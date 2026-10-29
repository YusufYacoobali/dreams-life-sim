import { createGameStore } from '../../src/state/gameStore';
import { encodeWorld } from '../../src/game/model';
import * as checkpoints from '../../src/persistence/checkpoints';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import archive from '../fixtures/v28-native-school-archive.json';

test('an imported actual branch publishes its durable origin without another list read and keeps the next action warm', async () => {
  const source = database(), producer = new SaveRepository(source.driver); await producer.initialise(); const original = await producer.import(JSON.stringify(archive));
  const branched = await producer.restoreBranch(original.id, 'snapshot_r_31', original.revision, 'life_summary_import', 'summary-branch');
  const text = await producer.export(branched.id), { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise();
  const store = createGameStore({ repository: async () => repository, date: () => original.date, id: () => 'unused' }); await store.getState().bootstrap();
  const list = jest.spyOn(repository, 'list'); expect(await store.getState().importLife(text, false)).toBe(true);
  expect(list).not.toHaveBeenCalled(); expect(store.getState().lives[0]).toEqual((await repository.list())[0]);
  const summary = store.getState().lives[0]; expect(summary.branch).toMatchObject({ sourceLifeId: original.id, snapshotId: 'snapshot_r_31', name: 'Riley Kelly', age: 7 });
  const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); list.mockClear();
  expect(await store.getState().dispatch({ type: 'advance' })).toBe(true); expect(unpack).not.toHaveBeenCalled(); expect(list).not.toHaveBeenCalled();
  expect(store.getState().lives[0].branch).toEqual(summary.branch); expect(store.getState().lives[0].revision).toBe(32);
  unpack.mockRestore();
  // A supported plain-world replacement carries no branch origin; do not keep
  // a stale label from the life it replaces.
  expect(await store.getState().importLife(encodeWorld(store.getState().world!), true)).toBe(true);
  expect(store.getState().lives[0].branch).toBeUndefined(); expect(await repository.branch(branched.id)).toBeNull(); expect(list).not.toHaveBeenCalled();
  list.mockRestore(); source.sqlite.close(); sqlite.close();
});

test('failed branch recovery retains the visible world/summary; retry publishes the actual recovered origin with no post-commit list read', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.import(JSON.stringify(archive));
  const store = createGameStore({ repository: async () => repository, date: () => ({ year: 2026, month: 10, day: 20 }), id: () => 'life_summary_recovery' }); await store.getState().bootstrap(); await store.getState().restoreSnapshot('snapshot_r_31');
  const restored = store.getState().world!, branch = store.getState().lives.find(item => item.id === restored.id)!.branch;
  await store.getState().dispatch({ type: 'advance' }); const current = store.getState().world!, summary = store.getState().lives.find(item => item.id === current.id)!;
  sqlite.exec("CREATE TRIGGER fail_recovery BEFORE UPDATE ON lives BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  const list = jest.spyOn(repository, 'list'); expect(await store.getState().recoverLife(current.id)).toBe(false);
  expect(store.getState().world).toBe(current); expect(store.getState().lives.find(item => item.id === current.id)).toEqual(summary); expect(await repository.previewLife(current.id)).toEqual(current);
  sqlite.exec('DROP TRIGGER fail_recovery'); expect(await store.getState().recoverLife(current.id)).toBe(true); expect(list).not.toHaveBeenCalled();
  expect(encodeWorld(store.getState().world!)).toBe(encodeWorld(restored)); expect(store.getState().lives[0].branch).toEqual(branch); expect(store.getState().lives[0]).toEqual((await repository.list()).find(item => item.id === restored.id));
  const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); expect(await store.getState().dispatch({ type: 'advance' })).toBe(true); expect(unpack).not.toHaveBeenCalled();
  unpack.mockRestore(); list.mockRestore(); sqlite.close();
});
