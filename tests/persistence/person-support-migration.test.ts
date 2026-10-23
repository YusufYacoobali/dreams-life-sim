import { decodeWorld, encodeWorld, validateWorld } from '../../src/game/model';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import graduate from '../fixtures/v3-employed-graduate.json';

test('an arranged World42 boundary adds only empty future histories and current markers', () => {
  // The earned facts and bound result come from the immutable older fixture.
  // Only this explicitly arranged envelope represents the prior World42 reader.
  const raw = JSON.parse(encodeWorld(decodeWorld(JSON.stringify(graduate))));
  raw.schemaVersion = 42; raw.engineVersion = 44; raw.contentVersion = 21;
  expect(raw.cults).toEqual([]); delete raw.cults; expect(raw.miniGames).toEqual([]); delete raw.miniGames;
  delete raw.personSupportRequests; delete raw.personActionHistory;
  const original = JSON.stringify(raw), restored = decodeWorld(original, true);
  expect(JSON.parse(encodeWorld(restored))).toEqual({
    ...raw, schemaVersion: 46, engineVersion: 48, contentVersion: 25, cults: [],
    personSupportRequests: [], personActionHistory: [], miniGames: [],
  });
  expect(JSON.stringify(raw)).toBe(original);
  expect(restored.pending).toEqual(raw.pending);
  expect(restored.random).toEqual(raw.random);
  expect(unpackCheckpoint(packCheckpoint(restored), true)).toEqual(restored);
});

test.each(['miniGames', 'personSupportRequests', 'personActionHistory'] as const)('current worlds require an explicit valid %s history', key => {
  const current = decodeWorld(JSON.stringify(graduate)), raw = JSON.parse(encodeWorld(current));
  const missing = { ...raw }; delete missing[key];
  const runtime: Record<string, unknown> = { ...current }; delete runtime[key];
  expect(() => decodeWorld(JSON.stringify(missing))).toThrow();
  expect(() => validateWorld(runtime)).toThrow();
  expect(() => decodeWorld(JSON.stringify({ ...raw, [key]: [{ id: 'invalid-unearned-record' }] }))).toThrow();
});
