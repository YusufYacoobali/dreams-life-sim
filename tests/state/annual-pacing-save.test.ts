import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGameStore } from '../../src/state/gameStore';
import { encodeWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { projectPacingOffer, projectPacingCommand } from '../support/annualPacing';
import archive from '../fixtures/v27-leisure-archive.json';
import workplaceArchive from '../fixtures/v30-native-workplace-story-archive.json';

test('actual due-project workload saves only with its receipt: all8 disk rollback, exact retry/raw backup, zero warm unpack and fresh cold acknowledgement once', async () => {
  const before = projectPacingOffer(), command = projectPacingCommand(before), after = resolveCommand(before, command), directory = mkdtempSync(join(tmpdir(), 'dreams-pacing-')), file = join(directory, 'life.db');
  let sqlite!: DatabaseSync, receiptGate: Promise<void> | null = null, receiptEntered: (() => void) | null = null, release = () => {};
  function connect(): SqlDatabase {
    sqlite = new DatabaseSync(file); sqlite.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL'); const db = sqlite;
    const session: SqlSession = {
      run: async (sql, values = []) => { if (sql.startsWith('INSERT INTO receipts') && receiptGate) { receiptEntered?.(); await receiptGate; } db.prepare(sql).run(...values); },
      get: async <T,>(sql: string, values: (string | number | null)[] = []) => db.prepare(sql).get(...values) as T ?? null,
      all: async <T,>(sql: string, values: (string | number | null)[] = []) => db.prepare(sql).all(...values) as T[],
    };
    return { ...session, exec: async sql => { db.exec(sql); }, transaction: async action => { db.exec('BEGIN IMMEDIATE'); try { const result = await action(session); db.exec('COMMIT'); return result; } catch (error) { db.exec('ROLLBACK'); throw error; } } };
  }
  const rows = (db = sqlite) => Object.fromEntries(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, db.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  let repository = new SaveRepository(connect()), reader: DatabaseSync | undefined;
  try {
    await repository.initialise(); await repository.import(JSON.stringify(archive)); await repository.import(JSON.stringify(workplaceArchive)); const historical = rows(); await repository.create(before);
    const store = createGameStore({ repository: async () => repository, date: () => before.date, id: () => 'unused' }); expect(await store.getState().bootstrap()).toBe(true);
    const baseline = rows(), current = encodeWorld(store.getState().world!), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), commit = jest.spyOn(repository, 'commit'); expect(Object.keys(baseline)).toHaveLength(8);
    sqlite.exec("CREATE TRIGGER fail_pacing BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    const entered = new Promise<void>(resolve => { receiptEntered = resolve; }); receiptGate = new Promise<void>(resolve => { release = resolve; });
    const attempted = store.getState().dispatch(command); await entered;
    expect(store.getState().busy).toBe(true); expect(encodeWorld(store.getState().world!)).toBe(current); expect(store.getState().world!.annual!.pacing!.decisions).toEqual([]);
    reader = new DatabaseSync(file, { readOnly: true }); expect(rows(reader)).toEqual(baseline); expect(await store.getState().dispatch(command)).toBe(false); expect(commit).toHaveBeenCalledTimes(1);
    receiptGate = null; release(); expect(await attempted).toBe(false); expect(store.getState().error).toMatch(/couldn't be saved/); expect(rows()).toEqual(baseline); expect(encodeWorld(store.getState().world!)).toBe(current); expect(store.getState().busy).toBe(false);
    sqlite.exec('DROP TRIGGER fail_pacing'); expect(await store.getState().dispatch(command)).toBe(true); expect(store.getState().world).toEqual(after); expect(commit).toHaveBeenCalledTimes(2); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore(); commit.mockRestore();
    const saved = rows(), observation = after.annual!.pacing!.decisions[0]; expect(after.annual!.pacing!.decisions).toHaveLength(1); expect(after.storyThreads[0].resolution).toBe('complete');
    for (const row of historical.lives) expect(sqlite.prepare('SELECT * FROM lives WHERE id=?').get(row.id)).toEqual(row);
    for (const row of historical.backups) expect(sqlite.prepare('SELECT * FROM backups WHERE life_id=?').get(row.life_id)).toEqual(row);
    for (const point of [...archive.snapshots, ...workplaceArchive.snapshots]) expect(sqlite.prepare('SELECT payload FROM snapshots WHERE snapshot_id=?').get(point.summary.id)?.payload).toBe(point.payload);
    for (const table of ['snapshots', 'snapshot_metadata', 'receipts', 'branches', 'restore_receipts']) expect(saved[table].filter((row: Record<string, unknown>) => row.life_id !== before.id)).toEqual(historical[table]);
    const backup = sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(before.id)!.payload as string;
    expect(backup).toBe(baseline.lives.find((row: Record<string, unknown>) => row.id === before.id)!.payload); expect(checkpoints.unpackCheckpoint(backup)).toEqual(before);
    reader.close(); reader = undefined; sqlite.close(); repository = new SaveRepository(connect()); await repository.initialise();
    const cold = createGameStore({ repository: async () => repository, date: () => after.date, id: () => 'unused' }); expect(await cold.getState().bootstrap()).toBe(true); expect(cold.getState().world).toEqual(after); expect(rows()).toEqual(saved);
    const result = cold.getState().world!.pending; if (result?.kind !== 'result') throw new Error('Expected the same saved callback result');
    const ack = { type: 'acknowledge' as const, resultId: result.id }; expect(await cold.getState().dispatch(ack)).toBe(true);
    expect(cold.getState().world!.annual!.pacing!.decisions).toEqual([observation]); expect(cold.getState().world!.journal.filter(row => row.id === observation.eventId + '_choice')).toHaveLength(1);
    const acknowledged = encodeWorld(cold.getState().world!), acknowledgedRows = rows(); expect(await cold.getState().dispatch(ack)).toBe(false); expect(encodeWorld(cold.getState().world!)).toBe(acknowledged); expect(rows()).toEqual(acknowledgedRows);
    expect(checkpoints.unpackCheckpoint(checkpoints.packCheckpoint(cold.getState().world!))).toEqual(cold.getState().world);
  } finally { release(); reader?.close(); jest.restoreAllMocks(); sqlite.close(); rmSync(directory, { recursive: true, force: true }); }
}, 30000);
