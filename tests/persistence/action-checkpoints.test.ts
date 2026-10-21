import { gzipSync, strToU8 } from 'fflate';
import { resolveCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { immutableWorld, validateWorld } from '../../src/game/model';
import { decodeSave } from '../../src/persistence/archive';
import * as checkpoints from '../../src/persistence/checkpoints';
import { encodeBase64 } from '../../src/persistence/base64';
import { SaveRepository } from '../../src/persistence/repository';
import archive from '../fixtures/v27-leisure-archive.json';
import responsiveArchive from '../fixtures/v27-responsive-archive.json';
import { database } from '../support/sqlite';

function scenario() {
  const original = decodeSave(JSON.stringify(archive)).world, world = immutableWorld(original);
  if (world.pending?.kind !== 'decision') throw new Error('Expected the genuine project deadline');
  const choice = world.pending.choices.find(item => !choiceUnavailable(world, item))!;
  const command = { type: 'choose' as const, eventId: world.pending.id, choiceId: choice.id };
  return { original, world, command, next: resolveCommand(world, command, true) };
}

test('immutable actions preserve exact outcomes and reuse certified old transactions and compressed blocks', () => {
  const { original, world, command, next } = scenario();
  expect(next).toEqual(resolveCommand(original, command));
  expect(Object.isFrozen(next.people[next.activePersonId].stats)).toBe(true);
  expect(next.ledger).not.toBe(world.ledger);
  expect(next.ledger.every((row, index) => row === world.ledger[index])).toBe(true);
  const before = JSON.parse(checkpoints.packCheckpoint(world)), after = JSON.parse(checkpoints.packCheckpoint(next));
  expect(before.format).toBe('dreams-checkpoint-v4');
  expect(after.ledger).toEqual(before.ledger); expect(after.main).not.toEqual(before.main);
  expect(checkpoints.unpackCheckpoint(JSON.stringify(after))).toEqual(next);
  const cold = checkpoints.unpackCheckpoint(JSON.stringify(after), true);
  expect(cold).toEqual(next); expect(Object.isFrozen(cold.ledger[0])).toBe(true);
  expect(JSON.parse(checkpoints.packCheckpoint(cold)).ledger).toEqual(after.ledger);
});

test('a changed middle transaction cannot reuse a cached block or bypass monetary validation', () => {
  const { world } = scenario();
  const before = JSON.parse(checkpoints.packCheckpoint(world));
  const middle = 200, ledger = [...world.ledger];
  ledger[middle] = { ...ledger[middle], description: 'A separately recorded description' };
  const revised = immutableWorld({ ...world, ledger });
  const after = JSON.parse(checkpoints.packCheckpoint(revised));
  expect(after.ledger[0]).not.toEqual(before.ledger[0]);
  expect(checkpoints.unpackCheckpoint(JSON.stringify(after)).ledger[middle]).toEqual(ledger[middle]);
  const corrupt = [...world.ledger];
  corrupt[middle] = Object.freeze({ ...corrupt[middle], cashDelta: corrupt[middle].cashDelta + 1n });
  expect(() => validateWorld({ ...world, ledger: corrupt }, true)).toThrow(/reconcile/);
  expect(() => checkpoints.packCheckpoint({ ...world, ledger: corrupt })).toThrow(/reconcile/);
});

test('reused ledger totals still reject changed account references, balances, duplicate rows and missing debts', () => {
  const { world } = scenario(), paid = world.ledger.find(row => row.cashDelta !== 0n)!;
  const changedBalance = world.accounts.map(account => account.id === paid.accountId ? { ...account, cash: account.cash + 1n } : account);
  expect(() => validateWorld({ ...world, accounts: changedBalance }, true)).toThrow(/reconcile/);
  const changedCurrency = world.accounts.map(account => account.id === paid.accountId ? { ...account, currency: account.currency === 'USD' ? 'AUD' : 'USD' } : account);
  expect(() => validateWorld({ ...world, accounts: changedCurrency }, true)).toThrow();
  expect(() => validateWorld({ ...world, accounts: world.accounts.filter(account => account.id !== paid.accountId) }, true)).toThrow();
  expect(() => validateWorld({ ...world, ledger: [...world.ledger, world.ledger[0]] }, true)).toThrow('Invalid ledger reference');
  const unpaid = { ...world.ledger[0], id: 'txn_orphan', debtDelta: 1n, liabilityId: null };
  expect(() => validateWorld({ ...world, ledger: [...world.ledger, unpaid] }, true)).toThrow('Invalid ledger reference');
  const orphan = { ...unpaid, liabilityId: 'debt_missing' };
  expect(() => validateWorld({ ...world, ledger: [...world.ledger, orphan] }, true)).toThrow('Invalid ledger reference');
});

test('chunk damage, contradictory bounds and invalid framing are rejected before publishing a world', () => {
  const { world } = scenario(), original = checkpoints.packCheckpoint(world);
  const edit = (change: (value: any) => void) => { const value = JSON.parse(original); change(value); return () => checkpoints.unpackCheckpoint(JSON.stringify(value)); };
  expect(edit(value => { value.ledger[0].hash = value.ledger[0].hash === '00000000' ? 'ffffffff' : '00000000'; })).toThrow('damaged');
  expect(edit(value => { value.bytes++; })).toThrow('size');
  expect(edit(value => { value.bytes = 32_000_001; })).toThrow();
  expect(edit(value => { value.ledger[0].bytes--; value.bytes--; })).toThrow('size');
  expect(edit(value => { value.ledger = Array(513).fill(value.ledger[0]); })).toThrow();
  // Well-checksummed malformed content must still pass JSON framing and full world validation.
  const part = (text: string) => {
    const bytes = strToU8(text); let hash = 2166136261;
    for (const byte of bytes) hash = Math.imul(hash ^ byte, 16777619) >>> 0;
    return { bytes: bytes.length, hash: hash.toString(16).padStart(8, '0'), data: encodeBase64(gzipSync(bytes)) };
  };
  for (const text of ['{}', '[]', '[{}]', '[],"revision":999,"ledger":[{}]']) {
    expect(edit(value => { value.bytes += part(text).bytes - value.ledger[0].bytes; value.ledger[0] = part(text); })).toThrow();
  }
  expect(checkpoints.unpackCheckpoint(archive.checkpoint)).toEqual(world);
});

test('the warm commit avoids decoding unchanged saves and keeps current, backup, receipts and history atomic on failure', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver), { world, next } = scenario();
  await repository.initialise(); await repository.create(world);
  const priorPayload = sqlite.prepare('SELECT payload FROM lives').get()?.payload;
  const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
  sqlite.exec("CREATE TRIGGER fail_action BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  await expect(repository.commit(next, world.revision, 'project', true)).rejects.toThrow('storage failure');
  expect(unpack).not.toHaveBeenCalled();
  expect(sqlite.prepare('SELECT payload FROM lives').get()?.payload).toBe(priorPayload);
  expect(sqlite.prepare('SELECT COUNT(*) AS count FROM snapshots').get()?.count).toBe(0);
  expect(sqlite.prepare('SELECT COUNT(*) AS count FROM receipts').get()?.count).toBe(0);
  sqlite.exec('DROP TRIGGER fail_action');
  await repository.commit(next, world.revision, 'project', true);
  expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
  expect(sqlite.prepare('SELECT payload FROM backups').get()?.payload).toBe(priorPayload);
  expect(sqlite.prepare('SELECT payload FROM snapshots').get()?.payload).toBe(priorPayload);
  const cold = new SaveRepository(driver);
  expect(await cold.load(world.id)).toEqual(next); expect(await cold.recoveryPreview(world.id)).toEqual(world);
  expect(await repository.commit(next, world.revision, 'project', true)).toEqual(next);
  expect(sqlite.prepare('SELECT COUNT(*) AS count FROM snapshots').get()?.count).toBe(1);
  sqlite.close();
});

test('a cached world cannot mask externally damaged current bytes or overwrite the recovery copy', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver), { world, next } = scenario();
  await repository.initialise(); await repository.create(world);
  const backup = sqlite.prepare('SELECT payload FROM backups').get()?.payload;
  sqlite.prepare('UPDATE lives SET payload=?').run('{damaged');
  await expect(repository.commit(next, world.revision, 'project')).rejects.toThrow();
  expect(sqlite.prepare('SELECT payload FROM lives').get()?.payload).toBe('{damaged');
  expect(sqlite.prepare('SELECT payload FROM backups').get()?.payload).toBe(backup);
  expect(await repository.recoveryPreview(world.id)).toEqual(world);
  sqlite.close();
});

test('the version-four upgrade is atomic and keeps the original v1 payload until an actual save', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver), { world, next } = scenario();
  await repository.initialise(); await repository.create(world);
  sqlite.prepare('UPDATE lives SET payload=?').run(archive.checkpoint);
  sqlite.exec("PRAGMA user_version=4; CREATE TRIGGER fail_v5 BEFORE INSERT ON backups BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  const updated = new SaveRepository(driver);
  await expect(updated.initialise()).rejects.toThrow('storage failure');
  expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(4);
  expect(sqlite.prepare('SELECT payload FROM lives').get()?.payload).toBe(archive.checkpoint);
  sqlite.exec('DROP TRIGGER fail_v5'); await updated.initialise();
  expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(21);
  expect(await updated.load(world.id)).toEqual(world);
  expect(sqlite.prepare('SELECT payload FROM lives').get()?.payload).toBe(archive.checkpoint);
  await updated.commit(next, world.revision, 'upgrade_project');
  expect(JSON.parse(sqlite.prepare('SELECT payload FROM lives').get()?.payload as string).format).toBe('dreams-checkpoint-v4');
  expect(sqlite.prepare('SELECT payload FROM backups').get()?.payload).toBe(archive.checkpoint);
  expect(await new SaveRepository(driver).load(world.id)).toEqual(next);
  sqlite.close();
});

test('reader seven upgrades a version-five database without rewriting its genuine v2 world or mixed-format history', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise();
  const imported = await repository.import(JSON.stringify(responsiveArchive));
  for (const table of ['lives', 'backups']) sqlite.prepare('UPDATE ' + table + ' SET payload=?').run(responsiveArchive.checkpoint);
  sqlite.exec('PRAGMA user_version=5');
  const moments = sqlite.prepare('SELECT snapshot_id,payload FROM snapshots ORDER BY snapshot_id').all();
  const upgraded = new SaveRepository(driver); await upgraded.initialise();
  expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(21);
  expect(sqlite.prepare('SELECT payload FROM lives').get()?.payload).toBe(responsiveArchive.checkpoint);
  expect(sqlite.prepare('SELECT payload FROM backups').get()?.payload).toBe(responsiveArchive.checkpoint);
  expect(sqlite.prepare('SELECT snapshot_id,payload FROM snapshots ORDER BY snapshot_id').all()).toEqual(moments);
  const world = await upgraded.load(imported.id); expect(world).toEqual(imported); expect(world.schemaVersion).toBe(41);
  if (world.pending?.kind !== 'result') throw new Error('Expected the genuine project result');
  const next = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id }, true);
  await upgraded.commit(next, world.revision, 'first_v28_action');
  expect(await new SaveRepository(driver).load(world.id)).toEqual(next);
  expect(sqlite.prepare('SELECT payload FROM backups').get()?.payload).toBe(responsiveArchive.checkpoint);
  expect(sqlite.prepare('SELECT snapshot_id,payload FROM snapshots ORDER BY snapshot_id').all()).toEqual(moments);
  sqlite.close();
});
