import { createLife, randomCreation } from '../../src/game/createLife';
import { copyWorld, decodeWorld, encodeWorld, immutableWorld, isImmutableWorld, validateWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';

function saved() {
  const world = createLife('life_certified_branches', 42, randomCreation(42), { year: 2026, month: 10, day: 24 });
  world.birthAcknowledged = true;
  // A valid age-ten test context; no gameplay probability is asserted here.
  world.date = { ...world.date, year: world.date.year + 10 };
  return immutableWorld(world);
}

test('unchanged certified branches share frozen originals while changes retain complete validation', () => {
  const before = saved(), original = encodeWorld(before);
  const after = resolveCommand(before, { type: 'health-routine', routine: { ...before.people[before.activePersonId].health.routine, mindfulness: true } }, true);
  expect(isImmutableWorld(before)).toBe(true); expect(isImmutableWorld(after)).toBe(true);
  expect(after.people).not.toBe(before.people); expect(after.journal).toBe(before.journal);
  expect(after.ledger).toBe(before.ledger); expect(after.relationships).toBe(before.relationships);
  expect(after.market).toBe(before.market); expect(after.people[before.activePersonId].health.routine.mindfulness).toBe(true);
  expect(encodeWorld(before)).toBe(original);
  expect(decodeWorld(encodeWorld(after))).toEqual(after); expect(unpackCheckpoint(packCheckpoint(after))).toEqual(after);
});

test('public mutable copies and mutable validation do not expose shared frozen branches', () => {
  const before = saved(), working = copyWorld(before), original = encodeWorld(before);
  working.people[before.activePersonId].stats.happiness = 42;
  working.journal[0].text = 'A harmless test edit.';
  working.relationships[0].strength = 10;
  expect(encodeWorld(before)).toBe(original); expect(isImmutableWorld(working)).toBe(false);
  const checked = validateWorld(before);
  checked.journal[0].text = 'Another test edit.';
  expect(before.journal[0].text).not.toBe(checked.journal[0].text);
});

test.each(['shape', 'funds', 'journal', 'relationship', 'frozen-forgery', 'wrong-field'] as const)('%s corruption cannot borrow a branch certificate', kind => {
  const before = saved(), working = copyWorld(before), id = working.activePersonId;
  if (kind === 'shape') working.people[id].stats.health = -1;
  if (kind === 'funds') working.accounts[0].cash += 1n;
  if (kind === 'journal') working.journal[0].date = { ...working.date, year: working.date.year + 1 };
  if (kind === 'relationship') working.relationships[0].from = 'person_missing';
  if (kind === 'frozen-forgery') { working.journal[0].text = 'x'.repeat(1201); Object.freeze(working.journal); }
  if (kind === 'wrong-field') working.journal = before.accounts as unknown as typeof working.journal;
  expect(() => validateWorld(working, true)).toThrow();
});

test('sharing a certified branch never skips its references and dates in a changed world', () => {
  const before = saved();
  const movedBirth = copyWorld(before); movedBirth.people[before.activePersonId].born = { ...before.date, year: before.date.year - 1 };
  expect(() => validateWorld({ ...movedBirth, journal: before.journal }, true)).toThrow();
  const missingPerson = copyWorld(before); delete missingPerson.people[missingPerson.relationships[0].from];
  expect(() => validateWorld({ ...missingPerson, relationships: before.relationships }, true)).toThrow();
});

test('freezing a lookalike world is not an immutable-world certificate', () => {
  const before = saved(), raw = decodeWorld(encodeWorld(before));
  expect(isImmutableWorld(Object.freeze(raw))).toBe(false); expect(isImmutableWorld(null)).toBe(false); expect(isImmutableWorld(1)).toBe(false);
});

test.each(['people', 'actionCounts'] as const)('%s record order remains identical to the fully parsed mutable result', kind => {
  let before = saved();
  if (kind === 'actionCounts') before = immutableWorld({ ...before, actionCounts: { first: 1, second: 2, third: 3 } });
  const working = copyWorld(before), record = working[kind], first = Object.keys(record)[0];
  const value = record[first]; delete record[first];
  Object.assign(record, { [first]: value });
  const mutable = validateWorld(working), shared = validateWorld(working, true);
  expect(Object.keys(shared[kind])).toEqual(Object.keys(mutable[kind]));
  expect(Object.keys(shared[kind])).not.toEqual(Object.keys(before[kind]));
  expect(encodeWorld(shared)).toBe(encodeWorld(mutable));
  expect(shared.random).toEqual(mutable.random);
});
