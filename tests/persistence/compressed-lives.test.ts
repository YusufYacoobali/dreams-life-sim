import { gunzipSync, strFromU8 } from 'fflate';
import { resolveCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { encodeWorld } from '../../src/game/model';
import { decodeSave } from '../../src/persistence/archive';
import { decodeBase64 } from '../../src/persistence/base64';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import { SaveRepository } from '../../src/persistence/repository';
import archive from '../fixtures/v23-school-plans-archive.json';
import { database } from '../support/sqlite';

// Recover the genuine old plain world bytes, without regenerating its outcomes
// or changing its content version. Version-three live rows used this encoding.
const plain = strFromU8(gunzipSync(decodeBase64(JSON.parse(archive.checkpoint).data)));
const expected = () => decodeSave(JSON.stringify(archive)).world;
async function previousDatabase() {
  const db = database(), repository = new SaveRepository(db.driver);
  await repository.initialise(); await repository.import(JSON.stringify(archive));
  for (const table of ['lives', 'backups']) db.sqlite.prepare('UPDATE ' + table + ' SET payload=?').run(plain);
  db.sqlite.exec('PRAGMA user_version=3');
  return { ...db, repository };
}

test('the version-three upgrade reads genuine plain state and retains old bytes, moments and RNG until actual commands commit', async () => {
  const { sqlite, driver } = await previousDatabase(), repository = new SaveRepository(driver);
  const world = expected(); await repository.initialise();
  expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(29);
  for (const table of ['lives', 'backups']) expect(sqlite.prepare('SELECT payload FROM ' + table).get()?.payload).toBe(plain);
  expect(await repository.load(world.id)).toEqual(world); expect(await repository.recoveryPreview(world.id)).toEqual(world);
  const before = decodeSave(await repository.export(world.id));
  expect(before.snapshots).toEqual(decodeSave(JSON.stringify(archive)).snapshots);
  if (world.pending?.kind !== 'result') throw new Error('Expected the genuine paid outing result');
  const next = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
  sqlite.exec("CREATE TRIGGER fail_compression_commit BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  await expect(repository.commit(next, world.revision, 'retry_unchanged')).rejects.toThrow('storage failure');
  expect(await repository.load(world.id)).toEqual(world); expect(await repository.recoveryPreview(world.id)).toEqual(world);
  for (const table of ['lives', 'backups']) expect(sqlite.prepare('SELECT payload FROM ' + table).get()?.payload).toBe(plain);
  expect(decodeSave(await repository.export(world.id)).snapshots).toEqual(before.snapshots);
  sqlite.exec('DROP TRIGGER fail_compression_commit');
  await repository.commit(next, world.revision, 'retry_unchanged');
  const packed = sqlite.prepare('SELECT payload FROM lives').get()?.payload as string;
  expect(JSON.parse(packed).format).toBe('dreams-checkpoint-v1'); expect(unpackCheckpoint(packed)).toEqual(next);
  expect(await repository.recoveryPreview(world.id)).toEqual(world);
  if (next.pending?.kind !== 'decision') throw new Error('Expected the saved project due next');
  const choice = next.pending.choices.find(item => !choiceUnavailable(next, item))!;
  const resumed = resolveCommand(next, { type: 'choose', eventId: next.pending.id, choiceId: choice.id });
  await repository.commit(resumed, next.revision, 'resume_saved_year');
  expect(await new SaveRepository(driver).load(world.id)).toEqual(resumed);
  const backup = sqlite.prepare('SELECT payload FROM backups').get()?.payload as string;
  expect(JSON.parse(backup).format).toBe('dreams-checkpoint-v1'); expect(unpackCheckpoint(backup)).toEqual(next);
  expect(packed.length + backup.length).toBeLessThan(plain.length * 2);
  expect(decodeSave(await repository.export(world.id)).world).toEqual(resumed);
  expect(decodeSave(await repository.export(world.id)).snapshots).toEqual(before.snapshots);
  sqlite.close();
});

test('a failed database representation upgrade rolls back its marker without rewriting existing plain lives', async () => {
  const { sqlite, driver } = await previousDatabase();
  sqlite.exec("CREATE TRIGGER fail_database_upgrade BEFORE INSERT ON backups BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  await expect(new SaveRepository(driver).initialise()).rejects.toThrow('storage failure');
  expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(3);
  for (const table of ['lives', 'backups']) expect(sqlite.prepare('SELECT payload FROM ' + table).get()?.payload).toBe(plain);
  sqlite.exec('DROP TRIGGER fail_database_upgrade');
  const repository = new SaveRepository(driver); await repository.initialise(); expect(await repository.active()).toEqual(expected());
  sqlite.close();
});

test('compressed live-row damage preserves the previous state for explicit exact recovery', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver), world = expected();
  await repository.initialise(); await repository.create(world);
  if (world.pending?.kind !== 'result') throw new Error('Expected a genuine result');
  const next = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
  await repository.commit(next, world.revision, 'acknowledge_outing');
  const packed = JSON.parse(sqlite.prepare('SELECT payload FROM lives').get()?.payload as string);
  packed.hash = packed.hash === '00000000' ? 'ffffffff' : '00000000';
  const damaged = JSON.stringify(packed); sqlite.prepare('UPDATE lives SET payload=?').run(damaged);
  await expect(repository.load(world.id)).rejects.toThrow('previous checkpoint');
  expect(sqlite.prepare('SELECT payload FROM lives').get()?.payload).toBe(damaged);
  expect(encodeWorld(await repository.recoveryPreview(world.id))).toBe(encodeWorld(world));
  expect(await repository.recover(world.id)).toEqual(world);
  expect(await new SaveRepository(driver).active()).toEqual(world);
  expect(sqlite.prepare('SELECT COUNT(*) AS count FROM receipts').get()?.count).toBe(0);
  sqlite.close();
});
