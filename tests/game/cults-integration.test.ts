import { resolveCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import {
  copyWorld,
  encodeWorld,
  validateWorld,
  type World,
} from '../../src/game/model';
import { jobs } from '../../src/game/content/jobs';
import { accountFor } from '../../src/game/systems/common';
import { cultMonth } from '../../src/game/systems/cultMonth';
import { jobReason } from '../../src/game/systems/work';
import { selectionReason } from '../../src/game/systems/careers';
import { serviceSelectionReason } from '../../src/game/systems/services';
import { campaignReason } from '../../src/game/systems/politics';
import { recordingReason } from '../../src/game/systems/music';
import { coursePrerequisiteReason } from '../../src/game/systems/educationEligibility';
import { ownerOperationReason } from '../../src/game/systems/businesses';
import { isConfined } from '../../src/game/systems/legalSchemas';
import { resolveLifeContext } from '../../src/ui/lifeContext';
import {
  cultCommand,
  cultFixture,
  drainCult,
  foundCult,
} from '../support/cults';

test('an empty cult history consumes no random draws or changes during ordinary monthly progression', () => {
  const world = cultFixture(),
    saved = encodeWorld(world);
  cultMonth(world);
  expect(encodeWorld(world)).toBe(saved);
});

test('cult leadership blocks competing full-time contracts while allowing part-time job applications', () => {
  const world = foundCult();
  const fullTime = jobs.find((role) => role.id === 'cleaner')!;
  const partTime = jobs.find((role) => role.id === 'cafe-part')!;
  expect(jobReason(world, fullTime)).toMatch(/cult/);
  expect(jobReason(world, partTime)).toBeUndefined();
  expect(selectionReason(world, 'actor')).toMatch(/cult/);
  expect(serviceSelectionReason(world, 'astronaut')).toMatch(/cult/);
  expect(campaignReason(world)).toMatch(/cult/);
  expect(recordingReason(world)).toMatch(/cult/);
  expect(coursePrerequisiteReason(world, 'trade', 'business')).toMatch(/cult/);
  expect(ownerOperationReason(world, 'cafe')).toMatch(/cult/);
  const saved = encodeWorld(world);
  expect(() =>
    resolveCommand(world, { type: 'apply-job', roleId: fullTime.id }),
  ).toThrow(/cult/);
  expect(encodeWorld(world)).toBe(saved);
  expect(resolveLifeContext(world)).toEqual({
    key: 'cult',
    label: 'Cult',
    href: '/cult',
    icon: { kind: 'cult' },
  });
});

test('disbanding releases the occupation and cancels future promises without a personal windfall', () => {
  let world = foundCult(undefined, {
    doctrines: ['moon-lessons', 'public-answers'],
  });
  const cultId = world.cults[0].id;
  world = cultCommand(world, {
    type: 'cult-claim',
    cultId,
    claim: 'green-moon',
    approach: 'double-down',
  });
  const cash = accountFor(world).cash,
    communal = world.cults[0].cash;
  world = cultCommand(world, { type: 'cult-disband', cultId });
  const cult = world.cults[0];
  expect(cult.status).toBe('disbanded');
  expect(cult.cash).toBe(0n);
  expect(cult.distribution).toBe(communal);
  expect(accountFor(world).cash).toBe(cash);
  expect(cult.threads.every((thread) => thread.status === 'cancelled')).toBe(
    true,
  );
  expect(
    jobReason(world, jobs.find((role) => role.id === 'cleaner')!),
  ).toBeUndefined();
  expect(resolveLifeContext(world).key).not.toBe('cult');
  const saved = encodeWorld(world);
  expect(() => resolveCommand(world, { type: 'cult-disband', cultId })).toThrow(
    /no longer lead/,
  );
  expect(encodeWorld(world)).toBe(saved);
});

test('custody prevents physical cult actions but permits winding up the communal organisation', () => {
  const initial = foundCult();
  let world: World | undefined;
  for (let seed = 1; seed <= 100; seed++) {
    const input = copyWorld(initial);
    input.random.outcomes = seed;
    const candidate = resolveCommand(input, {
      type: 'crime',
      offence: 'vandalism',
    });
    if (
      candidate.pending?.kind === 'decision' &&
      candidate.pending.choices.some((choice) => choice.id === 'remand')
    ) {
      world = drainCult(
        resolveCommand(candidate, {
          type: 'choose',
          eventId: candidate.pending.id,
          choiceId: 'remand',
        }),
      );
      break;
    }
  }
  if (!world) throw new Error('No arrest seed found');
  expect(isConfined(world)).toBe(true);
  expect(resolveLifeContext(world).key).toBe('prison');
  const cultId = world.cults[0].id;
  expect(() => resolveCommand(world!, { type: 'cult-preach', cultId })).toThrow(
    /custody/,
  );
  world = cultCommand(world, { type: 'cult-disband', cultId });
  expect(world.cults[0].status).toBe('disbanded');
  expect(isConfined(world)).toBe(true);
  validateWorld(world);
});

test('the engine processes each cult month once throughout a real Age Up and keeps reports reconciled', () => {
  let world = foundCult();
  const start = world.cults[0].lastMonth;
  world = resolveCommand(world, { type: 'advance' });
  let guard = 0;
  while (
    (world.pending || world.annual) &&
    !world.people[world.activePersonId].died &&
    guard++ < 150
  ) {
    const event = world.pending;
    if (event?.kind === 'decision') {
      const choices = event.choices.filter(
        (choice) => !choiceUnavailable(world, choice),
      );
      const choice = choices.find((row) => row.id === 'withdraw') ?? choices[0];
      if (!choice) throw new Error('No available saved choice');
      world = resolveCommand(world, {
        type: 'choose',
        eventId: event.id,
        choiceId: choice.id,
      });
    } else if (event)
      world = resolveCommand(world, {
        type: 'acknowledge',
        resultId: event.id,
      });
    else world = resolveCommand(world, { type: 'resume' });
  }
  expect(guard).toBeLessThan(150);
  const cult = world.cults[0];
  expect(cult.status).toBe('active');
  expect(cult.lastMonth - start).toBe(12);
  expect(cult.monthsActive).toBe(12);
  expect(cult.months).toHaveLength(12);
  expect(new Set(cult.months.map((month) => month.month)).size).toBe(12);
  expect(cult.years).toHaveLength(1);
  expect(cult.cash).toBe(
    cult.capital +
      cult.income -
      cult.expenses -
      cult.payouts -
      cult.distribution -
      cult.misuse,
  );
  const saved = encodeWorld(world);
  cultMonth(world);
  expect(encodeWorld(world)).toBe(saved);
});
