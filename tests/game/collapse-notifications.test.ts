import { monthFrom } from '../../src/game/calendar';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { cultStories } from '../../src/game/content/cultStories';
import { recordDeath, resolveCommand } from '../../src/game/engine';
import {
  decodeWorld,
  encodeWorld,
  validateWorld,
  type World,
} from '../../src/game/model';
import { offerPending } from '../../src/game/pendingQueue';
import type { Pending } from '../../src/game/runtime';
import { businessBook } from '../../src/game/systems/businessCore';
import { businessStartupQuote } from '../../src/game/systems/businesses';
import { accountFor } from '../../src/game/systems/common';
import {
  cultChangeFollowers,
  cultContribute,
  cultSpend,
} from '../../src/game/systems/cultCore';
import { offerCultThread } from '../../src/game/systems/cultEvents';
import { closeCult } from '../../src/game/systems/cultLifecycle';
import { cultMonth } from '../../src/game/systems/cultMonth';
import { cultMonthNumber } from '../../src/game/systems/cultSchemas';
import { newCultThread } from '../../src/game/systems/cultThreads';
import { endEmployment } from '../../src/game/systems/work';
import { cultFixture, drainCult, foundCult } from '../support/cults';

function pendingEvents(world: World) {
  return [
    ...(world.pending ? [world.pending] : []),
    ...world.deferred.map((row) => row.event),
  ];
}

function continueStep(world: World) {
  const event = world.pending;
  if (!event) return resolveCommand(world, { type: 'resume' });
  if (event.kind === 'result')
    return resolveCommand(world, { type: 'acknowledge', resultId: event.id });
  const choice =
    event.choices.find(
      (row) => row.id === 'withdraw' && !choiceUnavailable(world, row),
    ) ?? event.choices.find((row) => !choiceUnavailable(world, row));
  if (!choice) throw Error('Expected an available Age Up decision');
  return resolveCommand(world, {
    type: 'choose',
    eventId: event.id,
    choiceId: choice.id,
  });
}

function advanceUntil(input: World, finished: (world: World) => boolean) {
  let world = resolveCommand(input, { type: 'advance' }),
    guard = 0;
  while (!finished(world) && guard++ < 100) world = continueStep(world);
  if (!finished(world)) throw Error('Expected collapse during this Age Up');
  return world;
}

function finishWithoutRepeatedNotice(input: World, noticeId: string) {
  let world = input,
    guard = 0;
  while ((world.pending || world.annual) && guard++ < 100) {
    expect(pendingEvents(world).some((row) => row.id === noticeId)).toBe(false);
    world = continueStep(world);
  }
  expect(guard).toBeLessThan(100);
  return validateWorld(world);
}

function insolventCult() {
  const world = foundCult(undefined, { joiningFee: 0n, recurringFee: 0n }),
    cult = world.cults[0];
  cultSpend(
    world,
    cult,
    cult.cash,
    'communal-cost',
    'Committed communal costs',
  );
  cultChangeFollowers(cult, 3 - cult.followers);
  cult.loyalty = 0;
  return validateWorld(world);
}

function notice(id: string, title: string): Pending {
  return {
    kind: 'result',
    id,
    title,
    body: title,
    illustration: 'journal',
    effects: [],
  };
}

test('actual Age Up reports cult insolvency once, cold-resumes the saved result and preserves the planning pause', () => {
  const initial = insolventCult(),
    cultId = initial.cults[0].id,
    id = 'cult_collapse_' + cultId;
  let world = advanceUntil(
    initial,
    (value) => value.cults[0].status === 'collapsed',
  );
  expect(world).toEqual(
    advanceUntil(initial, (value) => value.cults[0].status === 'collapsed'),
  );
  expect(world.date).toEqual(
    monthFrom(initial.date, 4, initial.calendarAnchorDay),
  );
  expect(world.annual).toMatchObject({
    monthsProcessed: 4,
    pausedForPlanning: true,
  });
  expect(world.pending).toMatchObject({
    kind: 'result',
    id,
    title: 'Your organisation has collapsed',
    effects: [],
  });
  expect(world.pending!.body).toContain('four consecutive months');
  expect(world.pending!.body).toContain(
    'Your personal funds were kept separate.',
  );
  expect(world.pendingPriority).toBe(80);
  expect(world.cults[0]).toMatchObject({
    leaderId: null,
    cash: 0n,
    arrears: 0n,
  });
  expect(world.cults[0].writtenOff).toBeGreaterThan(0n);
  const saved = encodeWorld(world),
    date = world.date,
    writtenOff = world.cults[0].writtenOff,
    books = world.cults[0].book.length;
  world = decodeWorld(saved);
  expect(encodeWorld(world)).toBe(saved);
  world = resolveCommand(world, { type: 'acknowledge', resultId: id });
  expect(world.date).toEqual(date);
  expect(world.annual?.pausedForPlanning).toBe(true);
  expect(() =>
    resolveCommand(world, { type: 'acknowledge', resultId: id }),
  ).toThrow(/no longer open/);
  world = finishWithoutRepeatedNotice(world, id);
  expect(world.cults[0].writtenOff).toBe(writtenOff);
  expect(world.cults[0].book).toHaveLength(books);
});

test('a funded cult losing loyalty during Age Up reports its actual collapse cause', () => {
  const initial = foundCult(undefined, {
    philosophy: 'cosmic-accounting',
    doctrines: ['reality-stutters', 'leader-fallible'],
    rules: ['no-titles', 'open-books'],
    joiningFee: 0n,
    recurringFee: 0n,
  });
  cultContribute(initial, initial.cults[0], 100000000n);
  initial.cults[0].loyalty = 0;
  const world = advanceUntil(
    validateWorld(initial),
    (value) => value.cults[0].status === 'collapsed',
  );
  expect(world.annual).toMatchObject({
    monthsProcessed: 6,
    pausedForPlanning: true,
  });
  expect(world.cults[0].distressMonths).toBe(0);
  expect(world.pending?.body).toContain(
    'lost the loyalty of its followers over six consecutive months',
  );
  expect(world.pending?.body).not.toContain('four consecutive months');
});

test('collapse cancels obsolete cult decisions while retaining an emergency and an unrelated local result', () => {
  const world = foundCult(),
    cult = world.cults[0],
    definition = cultStories.find((row) => row.id === 'treasurer-envelope')!,
    member = cult.members.find((row) => row.role === 'treasurer')!,
    thread = newCultThread(
      world,
      cult,
      'story',
      definition.id,
      cultMonthNumber(world),
      [member.personId],
    );
  thread.title = definition.title;
  thread.body = definition.body;
  expect(offerCultThread(world, cult, thread)).toBe(true);
  const oldOffer = world.pending!.id,
    urgent = notice('saved_urgent_result', 'An urgent result'),
    local = notice('saved_local_result', 'Your previous activity');
  // Retained saves may have an urgent entry waiting behind the now-obsolete cult offer.
  world.deferred.push(
    { event: urgent, priority: 120 },
    { event: local, priority: 30 },
  );
  const personal = accountFor(world).cash;
  closeCult(world, cult, 'collapsed');
  validateWorld(world);
  expect(world.pending).toEqual(urgent);
  expect(world.pendingPriority).toBe(120);
  expect(world.deferred).toEqual([
    {
      priority: 80,
      event: expect.objectContaining({
        id: 'cult_collapse_' + cult.id,
        kind: 'result',
      }),
    },
    { priority: 30, event: local },
  ]);
  expect(pendingEvents(world).some((row) => row.id === oldOffer)).toBe(false);
  expect(thread).toMatchObject({ status: 'cancelled', offerId: null });
  expect(accountFor(world).cash).toBe(personal);
  const saved = encodeWorld(world);
  closeCult(world, cult, 'collapsed');
  cultMonth(world);
  expect(encodeWorld(world)).toBe(saved);
});

test('collapse preempts and preserves an open local result, without manufacturing an annual frame', () => {
  let world = foundCult();
  const cultId = world.cults[0].id,
    local = notice('local_result', 'An activity result');
  offerPending(world, local);
  closeCult(world, world.cults[0], 'collapsed');
  expect(world.pending?.id).toBe('cult_collapse_' + cultId);
  expect(world.annual).toBeNull();
  world = resolveCommand(world, {
    type: 'acknowledge',
    resultId: world.pending!.id,
  });
  expect(world.pending).toEqual(local);
  world = resolveCommand(world, { type: 'acknowledge', resultId: local.id });
  expect(world.pending).toBeNull();
  validateWorld(world);
});

test('voluntary disbanding, death and another leader collapsing do not create a player collapse result', () => {
  const disbanded = foundCult();
  closeCult(disbanded, disbanded.cults[0], 'disbanded');
  expect(disbanded.pending).toBeNull();
  validateWorld(disbanded);
  const deceased = foundCult();
  recordDeath(deceased, deceased.activePersonId, 'natural causes');
  expect(deceased.cults[0].status).toBe('deceased');
  expect(
    pendingEvents(deceased).some((row) => row.id.startsWith('cult_collapse_')),
  ).toBe(false);
  validateWorld(deceased);
  const other = foundCult();
  other.activePersonId = other.cults[0].members[0].personId;
  closeCult(other, other.cults[0], 'collapsed');
  expect(other.pending).toBeNull();
  validateWorld(other);
});

test('business insolvency already posts a durable one-time Age Up result with the same planning pause', () => {
  let initial = cultFixture();
  initial = drainCult(
    resolveCommand(initial, {
      type: 'start-business',
      kind: 'software',
      name: 'Last Light',
      operation: 'manager',
      quotedCapital: businessStartupQuote(initial, 'software').capital,
    }),
  );
  const company = initial.businesses[0];
  for (const member of [...company.staff])
    endEmployment(initial, member.personId);
  businessBook(
    initial,
    company,
    -company.cash,
    0n,
    'test-loss',
    'Working capital lost',
  );
  company.equipment = 0n;
  const id = 'business_failure_' + company.id;
  let world = advanceUntil(
    validateWorld(initial),
    (value) => value.businesses[0].status === 'failed',
  );
  expect(world.date).toEqual(
    monthFrom(initial.date, 3, initial.calendarAnchorDay),
  );
  expect(world.annual).toMatchObject({
    monthsProcessed: 3,
    pausedForPlanning: true,
  });
  expect(world.pending).toMatchObject({
    kind: 'result',
    id,
    title: 'The business has closed',
    effects: [],
  });
  expect(world.pendingPriority).toBe(80);
  expect(world.businessPayables.every((row) => row.principal === 0n)).toBe(
    true,
  );
  world = decodeWorld(encodeWorld(world));
  expect(world.pending?.id).toBe(id);
  const date = world.date,
    ledgerLength = world.businessLedger.length;
  world = resolveCommand(world, { type: 'acknowledge', resultId: id });
  expect(world.date).toEqual(date);
  expect(world.annual?.pausedForPlanning).toBe(true);
  world = finishWithoutRepeatedNotice(world, id);
  expect(world.businessLedger).toHaveLength(ledgerLength);
});
