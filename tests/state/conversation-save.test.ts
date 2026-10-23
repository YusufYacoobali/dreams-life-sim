import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGameStore } from '../../src/state/gameStore';
import { decodeWorld, encodeWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { database } from '../support/sqlite';
import graduate from '../fixtures/v3-employed-graduate.json';
import leisureArchive from '../fixtures/v27-leisure-archive.json';

test('the real reviewed topic saves atomically: held duplicate, all8 rollback, exact retry/backup, warm0, closed-connection result and acknowledgement once', async () => {
  const before = decodeWorld(JSON.stringify(graduate));
  const command = { type: 'interact' as const, action: 'talk' as const, topic: 'school' as const, personId: 'person_parent2' }, expected = resolveCommand(before, command);
  const directory = mkdtempSync(join(tmpdir(), 'dreams-topic-')), path = join(directory, 'life.db');
  let sqlite!: DatabaseSync, receiptGate: Promise<void> | null = null, entered: (() => void) | null = null, release = () => {};
  function connect(): SqlDatabase {
    sqlite = new DatabaseSync(path); sqlite.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL'); const db = sqlite;
    const session: SqlSession = {
      run: async (sql, values = []) => { if (sql.startsWith('INSERT INTO receipts') && receiptGate) { entered?.(); await receiptGate; } db.prepare(sql).run(...values); },
      get: async <T,>(sql: string, values: (string | number | null)[] = []) => db.prepare(sql).get(...values) as T ?? null,
      all: async <T,>(sql: string, values: (string | number | null)[] = []) => db.prepare(sql).all(...values) as T[],
    };
    return { ...session, exec: async sql => { db.exec(sql); }, transaction: async action => { db.exec('BEGIN IMMEDIATE'); try { const value = await action(session); db.exec('COMMIT'); return value; } catch (error) { db.exec('ROLLBACK'); throw error; } } };
  }
  const rows = (db = sqlite) => Object.fromEntries(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, db.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  let repository = new SaveRepository(connect()), reader: DatabaseSync | undefined;
  try {
    await repository.initialise(); await repository.import(JSON.stringify(leisureArchive)); const historical = rows(); await repository.create(before);
    const store = createGameStore({ repository: async () => repository, date: () => before.date, id: () => 'unused' }); expect(await store.getState().bootstrap()).toBe(true);
    const baseline = rows(), original = encodeWorld(store.getState().world!), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), commit = jest.spyOn(repository, 'commit'); expect(Object.keys(baseline)).toHaveLength(8);
    sqlite.exec("CREATE TRIGGER fail_conversation BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    const onEntered = new Promise<void>(resolve => { entered = resolve; }); receiptGate = new Promise<void>(resolve => { release = resolve; });
    const attempted = store.getState().dispatch(command); await onEntered;
    reader = new DatabaseSync(path, { readOnly: true }); expect(rows(reader)).toEqual(baseline); expect(store.getState().busy).toBe(true); expect(encodeWorld(store.getState().world!)).toBe(original);
    expect(await store.getState().dispatch({ ...command, topic: 'family' })).toBe(false); expect(commit).toHaveBeenCalledTimes(1);
    receiptGate = null; release(); expect(await attempted).toBe(false); expect(store.getState().error).toMatch(/couldn't be saved/); expect(rows()).toEqual(baseline); expect(encodeWorld(store.getState().world!)).toBe(original);
    sqlite.exec('DROP TRIGGER fail_conversation'); expect(await store.getState().dispatch(command)).toBe(true); expect(store.getState().world).toEqual(expected); expect(unpack).not.toHaveBeenCalled(); expect(commit).toHaveBeenCalledTimes(2); unpack.mockRestore(); commit.mockRestore();
    const saved = rows();
    for (const table of Object.keys(historical)) {
      if (table === 'preferences') continue;
      const originals = historical[table];
      for (const row of originals) expect(saved[table]).toContainEqual(row);
    }
    const backup = sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(before.id)!.payload as string;
    expect(backup).toBe(baseline.lives.find((row: { id: string }) => row.id === before.id)!.payload); expect(checkpoints.unpackCheckpoint(backup)).toEqual(before);
    reader.close(); reader = undefined; sqlite.close(); repository = new SaveRepository(connect()); await repository.initialise();
    const cold = createGameStore({ repository: async () => repository, date: () => before.date, id: () => 'unused' }); expect(await cold.getState().bootstrap()).toBe(true); expect(cold.getState().world).toEqual(expected); expect(rows()).toEqual(saved);
    const pending = expected.pending!; expect(pending.kind).toBe('result'); expect(cold.getState().world!.journal.at(-1)).toEqual(expected.journal.at(-1));
    const ack = { type: 'acknowledge' as const, resultId: pending.id }; expect(await cold.getState().dispatch(ack)).toBe(true);
    const acknowledged = resolveCommand(expected, ack), acknowledgedRows = rows(); expect(cold.getState().world).toEqual(acknowledged);
    expect(await cold.getState().dispatch(ack)).toBe(false); expect(await cold.getState().dispatch({ ...command, topic: 'family' })).toBe(false);
    expect(rows()).toEqual(acknowledgedRows); expect(cold.getState().world).toEqual(acknowledged);
    expect(checkpoints.unpackCheckpoint(checkpoints.packCheckpoint(acknowledged))).toEqual(acknowledged);
  } finally { release(); reader?.close(); jest.restoreAllMocks(); sqlite.close(); rmSync(directory, { recursive: true, force: true }); }
}, 30000);

test.each([13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24])('complete reader%i upgrades its marker only, retaining all8 rows and exact legacy conversation payload', async marker => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver);
  try {
    await repository.initialise(); const before = decodeWorld(JSON.stringify(graduate)); await repository.create(before);
    // A declared previous-reader frame uses the exact previous tuple; no new
    // conversation/history fields exist or are retroactively added.
    const legacy = JSON.parse(encodeWorld(before)); legacy.schemaVersion = 38; legacy.engineVersion = 39; legacy.contentVersion = 13;
    expect(legacy.miniGames).toEqual([]); delete legacy.miniGames;
    const payload = JSON.stringify(legacy); sqlite.prepare('UPDATE lives SET payload=? WHERE id=?').run(payload, before.id); sqlite.prepare('UPDATE backups SET payload=? WHERE life_id=?').run(payload, before.id);
    const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
    const baseline = rows(); expect(Object.keys(baseline)).toHaveLength(8);
    for (const table of Object.keys(baseline)) for (const action of ['INSERT', 'UPDATE', 'DELETE']) sqlite.exec('CREATE TRIGGER no_' + table + '_' + action + ' BEFORE ' + action + ' ON ' + table + " BEGIN SELECT RAISE(ABORT,'must not rewrite rows'); END");
    sqlite.exec('PRAGMA user_version=' + marker); const migrated = new SaveRepository(driver); await migrated.initialise();
    expect(sqlite.prepare('PRAGMA user_version').get()!.user_version).toBe(25); expect(rows()).toEqual(baseline);
    expect(await migrated.active()).toEqual(before); expect(rows()).toEqual(baseline); await migrated.initialise(); expect(rows()).toEqual(baseline);
    sqlite.exec('PRAGMA user_version=26'); await expect(new SaveRepository(driver).initialise()).rejects.toThrow(/newer version/); expect(rows()).toEqual(baseline); expect(sqlite.prepare('PRAGMA user_version').get()!.user_version).toBe(25);
  } finally { sqlite.close(); }
});

test('a failed reader18 marker transaction rolls back and retries without rewriting any payload', async () => {
  const { sqlite, driver } = database();
  try {
    await new SaveRepository(driver).initialise(); await new SaveRepository(driver).create(decodeWorld(JSON.stringify(graduate)));
    const payloads = () => sqlite.prepare('SELECT payload FROM lives UNION ALL SELECT payload FROM backups').all(); const before = payloads(); sqlite.exec('PRAGMA user_version=18');
    const failing: SqlDatabase = { ...driver, transaction: action => driver.transaction(tx => action({ ...tx, run: async (sql, values) => { await tx.run(sql, values); if (sql === 'PRAGMA user_version = 25') throw new Error('Interrupted marker write'); } })) };
    await expect(new SaveRepository(failing).initialise()).rejects.toThrow(/Interrupted marker/); expect(sqlite.prepare('PRAGMA user_version').get()!.user_version).toBe(18); expect(payloads()).toEqual(before);
    await new SaveRepository(driver).initialise(); expect(sqlite.prepare('PRAGMA user_version').get()!.user_version).toBe(25); expect(payloads()).toEqual(before);
  } finally { sqlite.close(); }
});
