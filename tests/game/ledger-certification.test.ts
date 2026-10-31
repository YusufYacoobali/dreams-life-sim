import { copyWorld, decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { post } from '../../src/game/systems/common';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import graduate from '../fixtures/v3-employed-graduate.json';

// Controlled integrity checks, not natural-life or mobile timing evidence.
const saved = () => decodeWorld(JSON.stringify(graduate), true);

test('certified ledger records are immutable, including their year and month', () => {
  const world = saved(), original = encodeWorld(world);
  expect(world.ledger.length).toBeGreaterThan(0);
  for (const row of world.ledger) {
    expect(Object.isFrozen(row)).toBe(true);
  }
  expect(Reflect.set(world.ledger[0], 'month', 13)).toBe(false);
  expect(encodeWorld(world)).toBe(original);
});

test('an appended ledger shares its proven prefix and retains exact canonical/checkpoint results', () => {
  const before = saved(), canonical = encodeWorld(before), checkpoint = packCheckpoint(before), working = copyWorld(before);
  post(working, 25n, 0n, 'certification-fixture', 'A controlled ledger append');
  const expected = validateWorld(working), checked = validateWorld(working, true);
  expect(encodeWorld(checked)).toBe(encodeWorld(expected));
  expect(checked.random).toEqual(before.random);
  before.ledger.forEach((row, index) => expect(checked.ledger[index]).toBe(row));
  expect(Object.isFrozen(checked.ledger.at(-1)!)).toBe(true);
  expect(encodeWorld(before)).toBe(canonical); expect(packCheckpoint(before)).toBe(checkpoint);
  expect(unpackCheckpoint(packCheckpoint(checked), true)).toEqual(checked);
});

test.each(['shape', 'balance', 'duplicate', 'undefined', 'wrong-field'] as const)('%s changes cannot borrow a ledger certificate', kind => {
  const before = saved(), working = copyWorld(before);
  if (kind === 'shape') working.ledger[0] = Object.freeze({ ...working.ledger[0], cashDelta: 'invalid' }) as unknown as World['ledger'][number];
  if (kind === 'balance') working.ledger[0] = Object.freeze({ ...working.ledger[0], cashDelta: working.ledger[0].cashDelta + 1n });
  if (kind === 'duplicate') working.ledger.push(before.ledger[0]);
  if (kind === 'undefined') (working.ledger as unknown[]).push(undefined);
  if (kind === 'wrong-field') working.ledger = before.accounts as unknown as World['ledger'];
  expect(() => validateWorld(working, true)).toThrow();
});

test('a fully frozen imported lookalike still needs shape and balance validation', () => {
  const raw = decodeWorld(JSON.stringify(graduate));
  raw.ledger[0].cashDelta += 1n;
  raw.ledger.forEach(row => Object.freeze(row));
  Object.freeze(raw.ledger); Object.freeze(raw);
  expect(() => validateWorld(raw, true)).toThrow();
});

test('sharing a certified ledger never bypasses account references or balances', () => {
  const before = saved(), working = copyWorld(before);
  working.ledger = before.ledger;
  working.accounts[0].cash += 1n;
  expect(() => validateWorld(working, true)).toThrow(/reconcile/);
});

test('valid reordered transactions retain their actual order rather than a stale index', () => {
  const before = saved(), working = copyWorld(before);
  post(working, 1n, 0n, 'certification-fixture', 'First append');
  post(working, 2n, 0n, 'certification-fixture', 'Second append');
  const prior = validateWorld(working, true), changed = copyWorld(prior);
  const length = changed.ledger.length;
  [changed.ledger[length - 2], changed.ledger[length - 1]] = [changed.ledger[length - 1], changed.ledger[length - 2]];
  const mutable = validateWorld(changed), checked = validateWorld(changed, true);
  expect(encodeWorld(checked)).toBe(encodeWorld(mutable));
  expect(checked.ledger.at(-1)!.id).toBe(prior.ledger.at(-2)!.id);
  expect(encodeWorld(prior)).toBe(encodeWorld(validateWorld(working)));
});
