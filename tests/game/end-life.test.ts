import { createLife, randomCreation } from '../../src/game/createLife';
import { copyWorld, decodeWorld, encodeWorld, immutableWorld, validateWorld } from '../../src/game/model';
import { recordDeath, resolveCommand, type GameCommand } from '../../src/game/engine';
import { decodeSave } from '../../src/persistence/archive';
import { isConfined } from '../../src/game/systems/legalSchemas';
import { startStudy } from '../support/studyStory';
import { endLifeCommand, readyForActivity } from '../support/endLife';
import graduate from '../fixtures/v3-employed-graduate.json';
import birth from '../fixtures/v6-birth-result.json';
import service from '../fixtures/v16-service-archive.json';
import royalty from '../fixtures/v17-royal-archive.json';

function initial() { return immutableWorld({ ...createLife('life_end', 42, randomCreation(42), { year: 2026, month: 10, day: 22 }), birthAcknowledged: true }); }
function remanded() {
  const input = decodeWorld(JSON.stringify(graduate)); input.random.outcomes = 1;
  const arrested = resolveCommand(input, { type: 'crime', offence: 'vandalism' });
  return readyForActivity(resolveCommand(arrested, { type: 'choose', eventId: arrested.pending!.id, choiceId: 'remand' }));
}

test('ending a life uses the standard death/estate flow at the current date without mutating the original', () => {
  const before = initial(), encoded = encodeWorld(before), expected = copyWorld(before);
  recordDeath(expected, expected.activePersonId, 'Ended by choice'); expected.revision++;
  const next = resolveCommand(before, endLifeCommand(before), true);
  expect(next).toEqual(expected); expect(next.date).toEqual(before.date); expect(next.random).toEqual(before.random);
  expect(next.people[next.activePersonId].causeOfDeath).toBe('Ended by choice'); expect(next.pending).toBeNull(); expect(next.annual).toBeNull();
  expect(next.estates.filter(item => item.personId === next.activePersonId)).toHaveLength(1);
  expect(encodeWorld(before)).toBe(encoded); expect(decodeWorld(encodeWorld(next))).toEqual(next); expect(Object.isFrozen(next)).toBe(true);
  expect(() => resolveCommand(next, endLifeCommand(next))).toThrow(/ended/);
});

test.each([
  ['employed', () => decodeWorld(JSON.stringify(graduate))],
  ['parent', () => readyForActivity(decodeWorld(JSON.stringify(birth)))],
  ['student', () => startStudy()],
  ['custody', remanded],
  ['service', () => readyForActivity(decodeSave(JSON.stringify(service)).world)],
  ['royalty', () => readyForActivity(decodeSave(JSON.stringify(royalty)).world)],
] as const)('%s life ends with valid retained records and one settled estate', (kind, setup) => {
  const before = setup(); if (kind === 'custody') expect(isConfined(before)).toBe(true);
  const next = resolveCommand(before, endLifeCommand(before), true), player = next.people[next.activePersonId];
  expect(player.died).toEqual(before.date); expect(next.revision).toBe(before.revision + 1); expect(next.date).toEqual(before.date);
  expect(player.employment).toBeNull(); expect(next.studyCourses.filter(item => item.personId === player.id && item.status === 'active')).toHaveLength(0);
  expect(next.estates.filter(item => item.personId === player.id)).toHaveLength(1); expect(validateWorld(next)).toEqual(next);
  if (kind === 'parent') {
    const childId = next.relationships.find(item => item.from === player.id && item.roles.includes('parent') && !next.people[item.to].died)!.to;
    const inherited = resolveCommand(next, { type: 'continue-child', personId: childId }, true);
    expect(inherited.activePersonId).toBe(childId); expect(inherited.generation).toBe(next.generation + 1); expect(inherited.people[player.id].died).toEqual(before.date);
  }
});

test('ending during a real planning pause preserves the interrupted-year legacy cursor', () => {
  const studying = startStudy(), paused = readyForActivity(resolveCommand(studying, { type: 'advance' }, true));
  expect(paused.annual?.pausedForPlanning).toBe(true);
  const ended = resolveCommand(paused, endLifeCommand(paused), true);
  expect(ended.date).toEqual(paused.date); expect(ended.annual).toBeNull(); expect(ended.legacyAnnual).toEqual(paused.annual); expect(validateWorld(ended)).toEqual(ended);
});

test('unacknowledged births, pending decisions/results and stale confirmations cannot end a life', () => {
  const before = initial(), original = encodeWorld(before);
  for (const patch of [{ lifeId: 'life_other' }, { personId: 'person_other' }, { expectedRevision: before.revision + 1 }, { expectedRevision: NaN }, { expectedRevision: -1 }, { cause: 'unreviewed' }]) {
    expect(() => resolveCommand(before, { ...endLifeCommand(before), ...patch } as GameCommand)).toThrow(/Review/); expect(encodeWorld(before)).toBe(original);
  }
  const unborn = createLife('life_begin', 42, randomCreation(42), before.date); expect(() => resolveCommand(unborn, endLifeCommand(unborn))).toThrow(/Begin/);
  const pending = resolveCommand(before, { type: 'advance' }); expect(() => resolveCommand(pending, endLifeCommand(pending))).toThrow(/current event/);
  const result = decodeWorld(JSON.stringify(birth)); expect(() => resolveCommand(result, endLifeCommand(result))).toThrow(/current event/);
});
