import { createLife, randomCreation } from '../../src/game/createLife';
import { decodeWorld, encodeWorld, World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { createGameStore } from '../../src/state/gameStore';
import { SaveRepository } from '../../src/persistence/repository';
import { decodeSave } from '../../src/persistence/archive';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { database } from '../support/sqlite';
import fixture from '../fixtures/v6-birth-result.json';

test('compressed checkpoints retain Unicode, bigint, pregnancy, pending birth, annual cursor and random streams', () => {
  const world = decodeWorld(JSON.stringify(fixture)); world.people[world.activePersonId].firstName = '陽菜';
  const packed = packCheckpoint(world); expect(unpackCheckpoint(packed)).toEqual(world); expect(packed.length).toBeLessThan(encodeWorld(world).length / 3);
  const damaged = JSON.parse(packed); damaged.hash = damaged.hash === '00000000' ? 'ffffffff' : '00000000'; expect(() => unpackCheckpoint(JSON.stringify(damaged))).toThrow(/damaged/);
  damaged.bytes = 20_000_001; expect(() => unpackCheckpoint(JSON.stringify(damaged))).toThrow();
});
function initial(): World { return { ...createLife('life_history', 42, randomCreation(42), { year: 2026, month: 10, day: 18 }), birthAcknowledged: true }; }
test('Age Up checkpoint, new state, backup and receipt commit or roll back together', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); const before = initial(); await repository.create(before);
  const store = createGameStore({ repository: async () => repository, date: () => before.date, id: () => 'life_branch' }); await store.getState().bootstrap();
  sqlite.exec("CREATE TRIGGER fail_receipt BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  expect(await store.getState().dispatch({ type: 'advance' })).toBe(false); expect(await repository.load(before.id)).toEqual(before); expect(await repository.snapshots(before.id)).toEqual([]);
  sqlite.exec('DROP TRIGGER fail_receipt'); expect(await store.getState().dispatch({ type: 'advance' })).toBe(true);
  expect(await repository.snapshots(before.id)).toHaveLength(1);
  const row = sqlite.prepare('SELECT payload FROM snapshots WHERE life_id=?').get(before.id)!; expect(unpackCheckpoint(row.payload as string)).toEqual(before);
  expect((await repository.load(before.id)).revision).toBe(1); sqlite.close();
});
test('restoring a historical decision creates a separate branch with exact saved outcomes and no future checkpoint leak', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); const before = initial(); await repository.create(before);
  let future = resolveCommand(before, { type: 'advance' }); await repository.commit(future, before.revision, 'advance', true);
  const point = future; const moment = (await repository.snapshot(future.id, future.revision))[0];
  if (future.pending?.kind !== 'decision') throw new Error('Expected a birthday');
  const choose = { type: 'choose' as const, eventId: future.pending.id, choiceId: future.pending.choices[0].id };
  const chosen = resolveCommand(future, choose); future = chosen; await repository.commit(future, point.revision, 'choose');
  if (future.pending?.kind !== 'result') throw new Error('Expected result');
  const completed = resolveCommand(future, { type: 'acknowledge', resultId: future.pending.id }); await repository.commit(completed, future.revision, 'ack');
  future = resolveCommand(completed, { type: 'advance' }); await repository.commit(future, completed.revision, 'advance-again', true); await repository.snapshot(future.id, future.revision);
  const originalFuture = await repository.load(before.id);
  const branch = await repository.restoreBranch(before.id, moment.id, future.revision, 'life_branch', 'restore_1');
  expect(branch).toEqual({ ...point, id: 'life_branch' }); expect(await repository.load(before.id)).toEqual(originalFuture);
  expect((await repository.snapshots(branch.id)).every(item => item.revision <= point.revision)).toBe(true); expect(await repository.snapshots(branch.id)).toHaveLength(2);
  const replay = resolveCommand(branch, choose); expect(replay).toEqual({ ...chosen, id: branch.id }); expect(branch.market).toEqual(point.market); expect(branch.market).not.toEqual(future.market);
  expect(await repository.restoreBranch(before.id, moment.id, future.revision, 'life_other', 'restore_1')).toEqual(branch); expect(await repository.list()).toHaveLength(2);
  expect((await repository.list()).find(item => item.id === branch.id)?.branch?.age).toBe(1); sqlite.close();
});
test('a restore receipt failure rolls back the new life, copied history and active selection', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); const before = initial(); await repository.create(before); const point = (await repository.snapshot(before.id, before.revision))[0];
  sqlite.exec("CREATE TRIGGER fail_restore BEFORE INSERT ON restore_receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  await expect(repository.restoreBranch(before.id, point.id, before.revision, 'life_failed', 'restore_fail')).rejects.toThrow('storage failure');
  expect(await repository.list()).toHaveLength(1); expect(await repository.active()).toEqual(before); expect(await repository.snapshots('life_failed')).toEqual([]);
  sqlite.exec('DROP TRIGGER fail_restore'); const branch = await repository.restoreBranch(before.id, point.id, before.revision, 'life_failed', 'restore_fail'); expect(branch.id).toBe('life_failed'); sqlite.close();
});
test('export/import retains complete compressed history and branch origin, while invalid history cannot replace a save', async () => {
  const source = database(), repository = new SaveRepository(source.driver); await repository.initialise(); const before = initial(); await repository.create(before); const point = (await repository.snapshot(before.id, before.revision))[0];
  const branch = await repository.restoreBranch(before.id, point.id, before.revision, 'life_branch', 'restore_archive'), archive = await repository.export(branch.id);
  expect(decodeSave(archive).world).toEqual(branch); const destination = database(), imported = new SaveRepository(destination.driver); await imported.initialise(); await imported.import(archive);
  expect(await imported.snapshots(branch.id)).toEqual(await repository.snapshots(branch.id)); expect(await imported.branch(branch.id)).toEqual(await repository.branch(branch.id));
  const corrupt = JSON.parse(archive), record = JSON.parse(corrupt.snapshots[0].payload); record.hash = '00000000'; corrupt.snapshots[0].payload = JSON.stringify(record);
  await expect(imported.import(JSON.stringify(corrupt), true)).rejects.toThrow(); expect(await imported.load(branch.id)).toEqual(branch); source.sqlite.close(); destination.sqlite.close();
});
test('a database-v2 raw checkpoint migrates to compressed history without changing its world', async () => {
  const { sqlite, driver } = database(); const before = initial();
  sqlite.exec('CREATE TABLE lives(id TEXT PRIMARY KEY,name TEXT NOT NULL,revision INTEGER NOT NULL,updated_at TEXT NOT NULL,payload TEXT NOT NULL); CREATE TABLE snapshots(life_id TEXT NOT NULL,snapshot_id TEXT NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(life_id,snapshot_id)); PRAGMA user_version=2');
  sqlite.prepare('INSERT INTO lives VALUES(?,?,?,?,?)').run(before.id, 'Historic', before.revision, '2026', encodeWorld(before)); sqlite.prepare('INSERT INTO snapshots VALUES(?,?,?)').run(before.id, 'earlier_id', encodeWorld(before));
  const repository = new SaveRepository(driver); await repository.initialise(); expect(await repository.snapshots(before.id)).toHaveLength(1);
  const row = sqlite.prepare('SELECT payload FROM snapshots').get()!; expect(unpackCheckpoint(row.payload as string)).toEqual(before); expect(await repository.load(before.id)).toEqual(before); sqlite.close();
});
test('recovering an older valid checkpoint removes later history so it cannot leak through a new export', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); const before = initial(); await repository.create(before);
  const decision = resolveCommand(before, { type: 'advance' }); await repository.commit(decision, before.revision, 'advance', true); await repository.snapshot(before.id, decision.revision);
  if (decision.pending?.kind !== 'decision') throw new Error('Expected decision');
  const result = resolveCommand(decision, { type: 'choose', eventId: decision.pending.id, choiceId: decision.pending.choices[0].id }); await repository.commit(result, decision.revision, 'choose'); await repository.snapshot(before.id, result.revision);
  sqlite.prepare('UPDATE lives SET payload=? WHERE id=?').run('{broken', before.id);
  expect(await repository.recover(before.id)).toEqual(decision); expect((await repository.snapshots(before.id)).every(item => item.revision <= decision.revision)).toBe(true);
  expect(decodeSave(await repository.export(before.id)).world).toEqual(decision); sqlite.close();
});
test('a damaged historical checkpoint cannot create a branch or change the active future', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); const before = initial(); await repository.create(before); const point = (await repository.snapshot(before.id, before.revision))[0];
  sqlite.prepare('UPDATE snapshots SET payload=? WHERE life_id=?').run('{broken', before.id);
  await expect(repository.restoreBranch(before.id, point.id, before.revision, 'life_bad', 'restore_bad')).rejects.toThrow(); expect(await repository.active()).toEqual(before); expect(await repository.list()).toHaveLength(1);
  await repository.snapshot(before.id, before.revision); expect((await repository.restoreBranch(before.id, point.id, before.revision, 'life_repaired', 'restore_repaired')).id).toBe('life_repaired'); sqlite.close();
});
