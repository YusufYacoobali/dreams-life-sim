import { createLife, randomCreation } from '../../src/game/createLife';
import { IneligibleAction, resolveCommand } from '../../src/game/engine';
import { ageOn, decodeWorld, encodeWorld, validateWorld, World } from '../../src/game/model';
import { bindEvent, eligibleTemplates, eventTemplates } from '../../src/game/content/events';

function born(seed = 42): World {
  return { ...createLife('life_engine', seed, randomCreation(seed), { year: 2024, month: 2, day: 29 }), birthAcknowledged: true };
}
function finishPending(world: World): World {
  let guard = 0;
  while ((world.pending || world.annual) && guard++ < 100) {
    if (world.pending?.kind === 'decision') world = resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: world.pending.choices[0].id });
    else if (world.pending) world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
    else world = resolveCommand(world, { type: 'resume' });
  }
  if (guard >= 100) throw new Error('Annual progression did not close');
  return world;
}

test('a first birthday is deterministic and survives decision/result restoration without extra effects', () => {
  const initial = born();
  const encoded = encodeWorld(initial);
  const first = resolveCommand(initial, { type: 'advance' });
  expect(encodeWorld(initial)).toBe(encoded);
  expect(resolveCommand(initial, { type: 'advance' })).toEqual(first);
  expect(first.date).toEqual({ year: 2025, month: 2, day: 28 });
  expect(first.pending?.kind).toBe('decision');
  const restored = decodeWorld(encodeWorld(first));
  if (restored.pending?.kind !== 'decision') throw new Error('Expected a decision');
  const command = { type: 'choose' as const, eventId: restored.pending.id, choiceId: restored.pending.choices[0].id };
  const result = resolveCommand(restored, command);
  const durable = decodeWorld(encodeWorld(result));
  expect(durable.pending).toEqual(result.pending);
  expect(durable.random).toEqual(result.random);
  expect(() => resolveCommand(durable, command)).toThrow(IneligibleAction);
  const acknowledged = finishPending(durable);
  expect(acknowledged.people).toEqual(durable.people);
  expect(acknowledged.random).toEqual(durable.random);
  expect(acknowledged.annual).toBeNull();
  expect(acknowledged.pending).toBeNull();
});

test('the original leap-day anchor returns in the next leap year', () => {
  let world = born();
  for (let i = 0; i < 4; i++) world = finishPending(resolveCommand(world, { type: 'advance' }));
  expect(world.date).toEqual({ year: 2028, month: 2, day: 29 });
  expect(ageOn(world.people[world.activePersonId], world.date)).toBe(4);
});

test('a saved annual cursor resumes its remaining months without advancing a second year', () => {
  const world = born();
  world.annual = { id: 'year_interrupted', startDate: world.date, targetDate: { year: 2025, month: 2, day: 28 }, monthsProcessed: 6, stage: 'months', pausedForPlanning: false };
  world.date = { year: 2024, month: 8, day: 29 };
  const restored = decodeWorld(encodeWorld(world));
  const resumed = resolveCommand(restored, { type: 'resume' });
  expect(resumed.date).toEqual({ year: 2025, month: 2, day: 28 });
  expect(resumed.annual?.monthsProcessed).toBe(12);
  expect(resumed.pending?.kind).toBe('decision');
  expect(() => resolveCommand(born(), { type: 'resume' })).toThrow(/no interrupted year/);
});

test('no birth, pending or deceased gate can be bypassed by a direct engine command', () => {
  const world = born();
  expect(() => resolveCommand({ ...world, birthAcknowledged: false }, { type: 'advance' })).toThrow(/Begin/);
  const pending = resolveCommand(world, { type: 'advance' });
  expect(() => resolveCommand(pending, { type: 'advance' })).toThrow(/Finish/);
  expect(() => resolveCommand(pending, { type: 'choose', eventId: 'wrong', choiceId: 'wrong' })).toThrow(/no longer/);
  world.people[world.activePersonId].died = world.date;
  world.people[world.activePersonId].causeOfDeath = 'test fixture';
  expect(() => resolveCommand(world, { type: 'advance' })).toThrow(/ended/);
});

test('parent events bind living people and stay ineligible after all parents have died', () => {
  const world = born();
  world.date = { year: 2040, month: 2, day: 29 };
  for (const relation of world.relationships) {
    world.people[relation.from].died = { ...world.date };
    world.people[relation.from].causeOfDeath = 'test fixture';
  }
  expect(eligibleTemplates(world).some(template => template.parent)).toBe(false);
  expect(() => bindEvent(world, eventTemplates.find(template => template.parent)!)).toThrow(/living parent/);
});

test('result effects report the actual bounded change', () => {
  const world = born();
  world.people[world.activePersonId].stats.happiness = 99;
  const next = resolveCommand(world, { type: 'advance' });
  if (next.pending?.kind !== 'decision') throw new Error('Expected a decision');
  const result = resolveCommand(next, { type: 'choose', eventId: next.pending.id, choiceId: 'smash' });
  expect(result.pending?.kind === 'result' && result.pending.effects.find(effect => effect.label === 'Happiness')?.value).toBe('+1%');
});

// Genuine saves from old commits are exercised in persistence/repository.test.ts.

const sweepCount = Number(process.env.DREAMS_LIFE_SWEEP ?? '12');
if (!Number.isInteger(sweepCount) || sweepCount < 1 || sweepCount > 1000) throw new Error('Invalid DREAMS_LIFE_SWEEP');
test(`${sweepCount} complete seeded lives preserve invariants and terminate with factual death records`, () => {
  const ages: number[] = [];
  for (let seed = 0; seed < sweepCount; seed++) {
    let world = born(seed);
    let turns = 0;
    while (!world.people[world.activePersonId].died && turns++ < 150) {
      world = finishPending(resolveCommand(world, { type: 'advance' }));
      validateWorld(world);
    }
    const player = world.people[world.activePersonId];
    expect(player.died).not.toBeNull();
    expect(player.causeOfDeath).toBeTruthy();
    expect(world.pending).toBeNull();
    expect(world.annual).toBeNull();
    ages.push(ageOn(player, world.date));
  }
  expect(Math.min(...ages)).toBeLessThan(Math.max(...ages));
}, 900000);
