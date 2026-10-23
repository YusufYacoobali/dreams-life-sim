import { countryCodes } from '../../src/game/countries';
import {
  copyWorld,
  decodeWorld,
  encodeWorld,
  validateWorld,
} from '../../src/game/model';
import { resolveCommand, recordDeath } from '../../src/game/engine';
import { accountFor } from '../../src/game/systems/common';
import {
  cultBill,
  cultCapacity,
  cultFeeOptions,
  cultModifiers,
  cultPayoutAvailable,
  cultRecruitQuote,
  cultStartupQuote,
  cultUpgradeQuote,
} from '../../src/game/systems/cultCore';
import { cultMonth } from '../../src/game/systems/cultMonth';
import {
  cultDoctrines,
  cultPhilosophies,
  cultRules,
} from '../../src/game/content/cults';
import { cultClaims } from '../../src/game/content/cultClaims';
import { cultStories } from '../../src/game/content/cultStories';
import { cultMonthNumber } from '../../src/game/systems/cultSchemas';
import { newCultThread } from '../../src/game/systems/cultThreads';
import { offerCultThread } from '../../src/game/systems/cultEvents';
import {
  cultCommand,
  cultFixture,
  cultPeriod,
  drainCult,
  foundCult,
} from '../support/cults';

test.each(countryCodes)(
  'founding uses actual %s currency, funds, headquarters and three persistent people',
  (country) => {
    const original = cultFixture(country),
      world = foundCult(original),
      cult = world.cults[0],
      quote = cultStartupQuote(original, 'meeting-room');
    expect(cult.currency).toBe(quote.currency);
    expect(cult.members).toHaveLength(3);
    expect(cult.capital).toBe(quote.capital);
    expect(cult.expenses).toBe(quote.premises);
    expect(accountFor(original).cash - accountFor(world).cash).toBe(
      quote.total,
    );
    expect(new Set(cult.members.map((row) => row.personId)).size).toBe(3);
    for (const member of cult.members)
      expect(world.people[member.personId]).toBeDefined();
    expect(cult.cash).toBe(cult.capital + cult.income - cult.expenses);
    expect(decodeWorld(encodeWorld(world))).toEqual(world);
    expect(() =>
      resolveCommand(world, {
        type: 'found-cult',
        name: 'Another',
        leaderTitle: 'Boss',
        philosophy: 'dream-archive',
        doctrines: ['borrowed-dreams', 'public-answers'],
        rules: ['family-day', 'open-books'],
        headquarters: 'meeting-room',
        method: 'announcement',
        joiningFee: 0n,
        recurringFee: 0n,
        quotedCost: quote.total,
      }),
    ).toThrow(/active cult/);
  },
);
test('every original philosophy, doctrine and rule has a real bounded modifier', () => {
  expect(cultPhilosophies).toHaveLength(8);
  expect(cultDoctrines).toHaveLength(28);
  expect(cultRules).toHaveLength(28);
  expect(cultClaims).toHaveLength(18);
  expect(cultStories).toHaveLength(28);
  for (const row of [...cultPhilosophies, ...cultDoctrines, ...cultRules])
    expect(Object.values(row.modifiers).some((value) => value !== 0)).toBe(
      true,
    );
  const cult = foundCult().cults[0];
  for (const doctrine of cultDoctrines) {
    const a = cultModifiers({ ...cult, doctrines: [doctrine.id] });
    expect(Object.values(a).every(Number.isFinite)).toBe(true);
    expect(Math.abs(a.growth)).toBeLessThanOrEqual(300);
  }
});
test('monthly accrual is exact, separate from personal cash and cannot run twice', () => {
  let world = foundCult(),
    cult = world.cults[0];
  const personal = accountFor(world).cash,
    expected = cult.recurringFee * BigInt(cult.followers - 3),
    oldIncome = cult.income;
  world = cultPeriod(world);
  cult = world.cults[0];
  expect(cult.monthsActive).toBe(1);
  expect(cult.book.find((row) => row.category === 'dues')!.delta).toBe(
    expected,
  );
  expect(cult.income).toBeGreaterThan(oldIncome);
  expect(accountFor(world).cash).toBe(personal);
  const before = encodeWorld(world);
  cultMonth(world);
  expect(encodeWorld(world)).toBe(before);
  expect(cult.cash).toBe(
    cult.capital +
      cult.income -
      cult.expenses -
      cult.payouts -
      cult.distribution -
      cult.misuse,
  );
});
test('a claim records a named witness, returns after its deadline, and a postponement works only once', () => {
  let world = foundCult(undefined, {
      doctrines: ['moon-lessons', 'public-answers'],
    }),
    cult = world.cults[0];
  world = cultCommand(world, {
    type: 'cult-claim',
    cultId: cult.id,
    claim: 'green-moon',
    approach: 'double-down',
  });
  const id = world.cults[0].threads[0].id,
    witness = world.cults[0].threads[0].participantIds[0];
  for (let i = 0; i < 12; i++)
    ((world = cultPeriod(world, false)),
      (world =
        world.pending?.kind === 'decision' &&
        world.pending.templateId === 'cult-green-moon'
          ? world
          : drainCult(world)));
  expect(world.pending?.kind).toBe('decision');
  expect(
    world.cults[0].threads.find((row) => row.id === id)!.participantIds,
  ).toEqual([witness]);
  world = resolveCommand(world, {
    type: 'choose',
    eventId: world.pending!.id,
    choiceId: 'postpone',
  });
  world = drainCult(world);
  expect(
    world.cults[0].threads.find((row) => row.id === id)!.postponements,
  ).toBe(1);
  for (let i = 0; i < 12; i++)
    ((world = cultPeriod(world, false)),
      (world =
        world.pending?.kind === 'decision' &&
        world.pending.templateId === 'cult-green-moon'
          ? world
          : drainCult(world)));
  expect(() =>
    resolveCommand(world, {
      type: 'choose',
      eventId: world.pending!.id,
      choiceId: 'postpone',
    }),
  ).toThrow(/already been postponed/);
  const event = world.pending!.id;
  world = resolveCommand(world, {
    type: 'choose',
    eventId: event,
    choiceId: 'admit',
  });
  expect(world.cults[0].threads.find((row) => row.id === id)!.status).toBe(
    'resolved',
  );
  expect(() =>
    resolveCommand(world, {
      type: 'choose',
      eventId: event,
      choiceId: 'admit',
    }),
  ).toThrow();
});
test('expelled ambitious follower returns two years later as the same rival leader', () => {
  let world = foundCult(),
    cult = world.cults[0],
    member = cult.members[0];
  member.loyalty = 5;
  member.grievance = 60;
  member.ambition = 90;
  world = cultCommand(world, {
    type: 'cult-member',
    cultId: cult.id,
    personId: member.personId,
    action: 'expel',
  });
  expect(
    world.cults[0].threads.some((row) => row.templateId === 'rival-return'),
  ).toBe(true);
  for (let i = 0; i < 24; i++) world = cultPeriod(world);
  expect(world.cults[0].rivals).toHaveLength(1);
  expect(world.cults[0].rivals[0].leaderId).toBe(member.personId);
  expect(world.cults[0].members[0].status).toBe('expelled');
  const followers = world.cults[0].rivals[0].followers;
  world = cultPeriod(world);
  expect(world.cults[0].rivals[0].lastMonth).toBe(cultMonthNumber(world));
  expect(world.people[member.personId]).toBeDefined();
  expect(followers).toBeGreaterThan(0);
});
test('actual diverted funds enter the normal legal pipeline', () => {
  let world = foundCult(),
    cult = world.cults[0],
    member = cult.members.find((row) => row.role === 'treasurer')!;
  member.loyalty = 20;
  const thread = newCultThread(
    world,
    cult,
    'story',
    'treasurer-envelope',
    cultMonthNumber(world),
    [member.personId],
  );
  thread.title = 'The Unlabelled Envelope';
  thread.body = 'A real transfer is being proposed.';
  offerCultThread(world, cult, thread);
  world = validateWorld(world);
  const personal = accountFor(world).cash;
  world = resolveCommand(world, {
    type: 'choose',
    eventId: world.pending!.id,
    choiceId: 'divert',
  });
  cult = world.cults[0];
  expect(cult.misuse).toBeGreaterThan(0n);
  expect(accountFor(world).cash).toBe(personal + cult.misuse);
  expect(cult.legalIncidents).toHaveLength(1);
  expect(
    world.incidents.find((row) => row.id === cult.legalIncidents[0])!.offence,
  ).toBe('cult-fraud');
  expect(world.cases).not.toHaveLength(0);
});
test('communal funds are never inherited or paid twice on death', () => {
  const world = foundCult(),
    cult = world.cults[0],
    personal = accountFor(world).cash,
    communal = cult.cash;
  recordDeath(world, world.activePersonId, 'natural causes');
  validateWorld(world);
  expect(cult.status).toBe('deceased');
  expect(cult.cash).toBe(0n);
  expect(cult.distribution).toBe(communal);
  const estate = world.estates.find(
    (row) => row.personId === world.activePersonId,
  )!;
  expect(estate.netWorthAtDeath.minor).toBeLessThanOrEqual(personal);
  const before = encodeWorld(world);
  recordDeath(world, world.activePersonId, 'natural causes');
  expect(encodeWorld(world)).toBe(before);
});
test('headquarters upgrades use actual communal funds and affect capacity/running costs', () => {
  let world = foundCult(),
    cult = world.cults[0],
    before = cult.cash,
    capacity = cultCapacity(cult),
    bill = cultBill(cult),
    quote = cultUpgradeQuote(cult, 'hall');
  world = cultCommand(world, {
    type: 'cult-upgrade',
    cultId: cult.id,
    upgrade: 'hall',
    quotedCost: quote,
  });
  cult = world.cults[0];
  expect(cult.cash).toBe(before - quote);
  expect(cultCapacity(cult)).toBeGreaterThan(capacity);
  expect(cultBill(cult)).toBeGreaterThan(bill);
  expect(() =>
    resolveCommand(world, {
      type: 'cult-upgrade',
      cultId: cult.id,
      upgrade: 'hall',
      quotedCost: quote,
    }),
  ).toThrow(/already installed/);
});
