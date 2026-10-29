import { createLife, randomCreation } from '../../src/game/createLife';
import { encodeWorld, immutableWorld } from '../../src/game/model';
import { post } from '../../src/game/systems/common';
import { decodeSave, encodeSave, snapshotRecord } from '../../src/persistence/archive';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';

const prepared = createLife('life_archive_bounds', 42, randomCreation(42), { year: 2026, month: 10, day: 25 });
// The production codec chooses v4 once a real ledger reaches one complete
// 512-row block. Fixture postings keep every account and transaction reconciled.
for (let index = 0; index < 512; index++) post(prepared, 1n, 0n, 'fixture-income', 'Archive boundary posting ' + index);
const world = immutableWorld(prepared);
const original = packCheckpoint(world);
// Valid JSON whitespace crosses the text boundary without inventing millions
// of gameplay facts. The real v4 codec still validates the complete world.
const checkpointAt = (length: number) => original + ' '.repeat(length - original.length);

test.each(['current', 'historical'] as const)('a supported v4 %s checkpoint above the old 28M limit imports with its exact world and historical bytes', kind => {
  const payload = checkpointAt(28_000_001);
  expect(JSON.parse(original).format).toBe('dreams-checkpoint-v4');
  expect(encodeWorld(unpackCheckpoint(payload))).toBe(encodeWorld(world));
  const record = snapshotRecord(world, '2026-10-25', 'Boundary checkpoint', payload);
  const archive = JSON.parse(encodeSave({ world, snapshots: kind === 'historical' ? [record] : [], branch: null }));
  if (kind === 'current') archive.checkpoint = payload;
  const text = JSON.stringify(archive);
  expect(text.length).toBeLessThan(64_000_000);
  const decoded = decodeSave(text);
  expect(encodeWorld(decoded.world)).toBe(encodeWorld(world));
  if (kind === 'historical') expect(decoded.snapshots).toEqual([record]);
});

test('archives retain the codec payload cap and the complete 64M input/output cap', () => {
  const archive = JSON.parse(encodeSave({ world, snapshots: [], branch: null }));
  archive.checkpoint = checkpointAt(44_000_001);
  expect(() => unpackCheckpoint(archive.checkpoint)).toThrow('This checkpoint exceeds the supported world size');
  expect(() => decodeSave(JSON.stringify(archive))).toThrow();
  expect(() => decodeSave(' '.repeat(64_000_001))).toThrow('This save archive is too large');
  const record = snapshotRecord(world, '2026-10-25', 'Complete archive boundary', checkpointAt(21_340_000));
  expect(() => encodeSave({ world, snapshots: [record, record, record], branch: null })).toThrow('This archive exceeds the supported export size');
});
