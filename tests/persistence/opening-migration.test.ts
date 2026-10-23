import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGameStore } from '../../src/state/gameStore';
import { encodeWorld, fullName, World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { SaveRepository, SqlDatabase, SqlSession } from '../../src/persistence/repository';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import * as checkpoints from '../../src/persistence/checkpoints';
import au from '../fixtures/v33-natural-professional-au-checkpoint.json';
import native from '../fixtures/v32-native-hourly-checkpoints.json';
import child from '../fixtures/v28-ordinary-hobby-archive.json';

async function fixtureDatabase(includeAU = false) {
  const directory = mkdtempSync(join(tmpdir(), 'dreams-opening-migration-')), path = join(directory, 'dreams.db'); let sqlite!: DatabaseSync;
  function connect(): SqlDatabase {
    sqlite = new DatabaseSync(path); sqlite.exec('PRAGMA foreign_keys=ON'); const connection = sqlite;
    const session: SqlSession = {
      run: async (sql, values = []) => { connection.prepare(sql).run(...values); },
      get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null,
      all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[],
    };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => {
      connection.exec('BEGIN IMMEDIATE'); try { const value = await action(session); connection.exec('COMMIT'); return value; } catch (error) { connection.exec('ROLLBACK'); throw error; }
    } };
  }
  let driver = connect(); await new SaveRepository(driver).initialise();
  // Database-only installation of unmodified genuine payloads in the already
  // compatible eight-table reader-13 format. No gameplay fields are overridden.
  const payloads = [native.checkpoints.hired.payload, child.checkpoint, ...(includeAU ? [au.checkpoint] : [])], expected = new Map<string, World>();
  for (const payload of payloads) {
    const world = unpackCheckpoint(payload, true); expected.set(world.id, world);
    sqlite.prepare('INSERT INTO lives(id,name,revision,updated_at,payload) VALUES(?,?,?,?,?)').run(world.id, fullName(world.people[world.activePersonId]), world.revision, '2026-10-20', payload);
    sqlite.prepare('INSERT INTO backups(life_id,revision,payload) VALUES(?,?,?)').run(world.id, world.revision, payload);
  }
  const current = unpackCheckpoint(native.checkpoints.hired.payload, true), childWorld = unpackCheckpoint(child.checkpoint, true);
  for (const point of child.snapshots) {
    sqlite.prepare('INSERT INTO snapshots(life_id,snapshot_id,payload) VALUES(?,?,?)').run(childWorld.id, point.summary.id, point.payload);
    sqlite.prepare('INSERT INTO snapshot_metadata(life_id,snapshot_id,revision,metadata) VALUES(?,?,?,?)').run(childWorld.id, point.summary.id, point.summary.revision, JSON.stringify(point.summary));
  }
  sqlite.prepare('INSERT INTO preferences(key,value) VALUES(?,?)').run('active_life', current.id); sqlite.exec('PRAGMA user_version=13'); sqlite.close(); driver = connect();
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  return { get sqlite() { return sqlite; }, get driver() { return driver; }, current, expected, rows, reopen: () => { sqlite.close(); driver = connect(); return new SaveRepository(driver); }, close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); } };
}

test('reader13→27 changes metadata only; genuine World33 courtships and old bound hiring results survive closed-connection loading and durable acknowledgement', async () => {
  const context = await fixtureDatabase(true);
  try {
    const before = context.rows(); expect(Object.keys(before)).toHaveLength(8); expect(context.sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(13);
    for (const table of Object.keys(before)) for (const action of ['INSERT', 'UPDATE', 'DELETE']) context.sqlite.exec('CREATE TRIGGER deny_' + table + '_' + action + ' BEFORE ' + action + ' ON ' + table + " BEGIN SELECT RAISE(ABORT,'unexpected row write'); END");
    const repository = new SaveRepository(context.driver); await repository.initialise(); expect(context.sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(27); expect(context.rows()).toEqual(before);
    const loaded = await repository.active(); expect(encodeWorld(loaded!)).toBe(encodeWorld(context.current)); expect(loaded).toMatchObject({ schemaVersion: 47, engineVersion: 49, contentVersion: 26, cults: [], pending: { kind: 'result' } });
    const auId = [...context.expected.keys()].find(id => id.startsWith('life_professional_'))!, projectedAU = await repository.previewLife(auId);
    expect(encodeWorld(projectedAU)).toBe(encodeWorld(context.expected.get(auId)!)); expect(projectedAU.npcCourtships).toHaveLength(13); expect(unpackCheckpoint(packCheckpoint(projectedAU), true)).toEqual(projectedAU);
    expect(context.rows()).toEqual(before); expect(context.sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(auId)?.payload).toBe(au.checkpoint);
    const cold = context.reopen(); await cold.initialise(); let store = createGameStore({ repository: async () => cold, date: () => ({ year: 2026, month: 10, day: 20 }), id: () => 'unused' }); expect(await store.getState().bootstrap()).toBe(true); expect(encodeWorld(store.getState().world!)).toBe(encodeWorld(context.current)); expect(context.rows()).toEqual(before);
    for (const trigger of context.sqlite.prepare("SELECT name FROM sqlite_master WHERE type='trigger' AND name LIKE 'deny_%'").all()) context.sqlite.exec('DROP TRIGGER ' + trigger.name);
    const command = { type: 'acknowledge' as const, resultId: context.current.pending!.id }, expected = resolveCommand(context.current, command, true), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    context.sqlite.exec("CREATE TRIGGER fail_ack BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); expect(await store.getState().dispatch(command)).toBe(false); expect(encodeWorld(store.getState().world!)).toBe(encodeWorld(context.current)); expect(context.rows()).toEqual(before);
    context.sqlite.exec('DROP TRIGGER fail_ack'); expect(await store.getState().dispatch(command)).toBe(true); expect(encodeWorld(store.getState().world!)).toBe(encodeWorld(expected)); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    expect(context.sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(context.current.id)?.payload).toBe(native.checkpoints.hired.payload); expect(context.sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(auId)?.payload).toBe(au.checkpoint);
    for (const point of child.snapshots) expect(context.sqlite.prepare('SELECT payload FROM snapshots WHERE snapshot_id=?').get(point.summary.id)?.payload).toBe(point.payload);
    const saved = context.rows(), final = context.reopen(); await final.initialise(); store = createGameStore({ repository: async () => final, date: () => ({ year: 2026, month: 10, day: 20 }), id: () => 'unused' }); expect(await store.getState().bootstrap()).toBe(true); expect(encodeWorld(store.getState().world!)).toBe(encodeWorld(expected)); expect(context.rows()).toEqual(saved);
  } finally { jest.restoreAllMocks(); context.close(); }
}, 60000);

test('a failed reader metadata transaction leaves the actual supported13 marker and all original rows intact before retry', async () => {
  const context = await fixtureDatabase();
  try {
    const before = context.rows(), driver = context.driver, failing: SqlDatabase = { ...driver, transaction: action => driver.transaction(tx => action({ ...tx, run: async (sql, values) => { await tx.run(sql, values); if (sql === 'PRAGMA user_version = 27') throw new Error('metadata failure'); } })) };
    await expect(new SaveRepository(failing).initialise()).rejects.toThrow('metadata failure'); expect(context.sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(13); expect(context.rows()).toEqual(before);
    const repository = context.reopen(); await repository.initialise(); expect(context.sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(27); expect(context.rows()).toEqual(before);
  } finally { context.close(); }
});

test('future reader28 is refused before any mutation of a real retained life database', async () => {
  const context = await fixtureDatabase();
  try {
    context.sqlite.exec('PRAGMA user_version=28'); const before = context.rows(); await expect(new SaveRepository(context.driver).initialise()).rejects.toThrow('newer version'); expect(context.sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(28); expect(context.rows()).toEqual(before);
  } finally { context.close(); }
});
