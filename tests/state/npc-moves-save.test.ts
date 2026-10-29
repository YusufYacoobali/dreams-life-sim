import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGameStore } from '../../src/state/gameStore';
import { encodeWorld, fullName } from '../../src/game/model';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { npcMoveJourney } from '../support/npcMoves';
import { annualCommand } from '../support/npcRelationships';
import archive from '../fixtures/v30-native-workplace-story-archive.json';
import pensionArchive from '../fixtures/v18-foreign-pension-archive.json';

test('actual annual retirement move holds before receipt, rolls back all8 disk tables, retries warm once and cold-resumes unchanged old history', async () => {
  const { before, command, after } = npcMoveJourney(), directory = mkdtempSync(join(tmpdir(), 'dreams-npc-move-')), file = join(directory, 'life.db');
  let sqlite!: DatabaseSync, receiptGate: Promise<void> | null = null, receiptEntered: (() => void) | null = null;
  let release = () => {};
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
    await repository.initialise(); await repository.import(JSON.stringify(archive)); await repository.import(JSON.stringify(pensionArchive)); const original = rows(); await repository.create(before);
    const store = createGameStore({ repository: async () => repository, date: () => before.date, id: () => 'unused' }); expect(await store.getState().bootstrap()).toBe(true);
    const baseline = rows(), current = encodeWorld(store.getState().world!), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), commit = jest.spyOn(repository, 'commit'); expect(Object.keys(baseline)).toHaveLength(8);
    sqlite.exec("CREATE TRIGGER fail_npc_move BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    const held = new Promise<void>(resolve => { receiptEntered = resolve; }); receiptGate = new Promise<void>(resolve => { release = resolve; });
    const attempted = store.getState().dispatch(command); await held;
    expect(store.getState().busy).toBe(true); expect(encodeWorld(store.getState().world!)).toBe(current); expect(commit).toHaveBeenCalledTimes(1);
    reader = new DatabaseSync(file, { readOnly: true }); expect(rows(reader)).toEqual(baseline); expect(await store.getState().dispatch(command)).toBe(false); expect(commit).toHaveBeenCalledTimes(1);
    receiptGate = null; release(); expect(await attempted).toBe(false); expect(store.getState().error).toMatch(/couldn't be saved/); expect(rows()).toEqual(baseline); expect(encodeWorld(store.getState().world!)).toBe(current); expect(store.getState().busy).toBe(false);
    sqlite.exec('DROP TRIGGER fail_npc_move'); expect(await store.getState().dispatch(command)).toBe(true); expect(store.getState().world).toEqual(after); expect(commit).toHaveBeenCalledTimes(2); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore(); commit.mockRestore();
    const saved = rows(), result = after.npcMoves.find(row => row.outcome === 'moved')!, message = fullName(after.people[result.personId]) + ' moved from ' + result.originCity + ' to ' + result.destinationCity + ' and paid their own moving costs.';
    expect(after.ledger.filter(row => row.id === result.paymentId)).toHaveLength(1); expect(after.ledger.find(row => row.id === result.paymentId)?.cashDelta).toBe(-result.movingCost);
    for (const row of original.lives) expect(sqlite.prepare('SELECT * FROM lives WHERE id=?').get(row.id)).toEqual(row);
    for (const row of original.backups) expect(sqlite.prepare('SELECT * FROM backups WHERE life_id=?').get(row.life_id)).toEqual(row);
    for (const point of [...archive.snapshots, ...pensionArchive.snapshots]) { expect(sqlite.prepare('SELECT payload FROM snapshots WHERE snapshot_id=?').get(point.summary.id)?.payload).toBe(point.payload); }
    for (const table of ['snapshots', 'snapshot_metadata', 'receipts', 'branches', 'restore_receipts']) expect(saved[table].filter((row: Record<string, unknown>) => row.life_id !== before.id)).toEqual(original[table]);
    const backupPayload = sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(before.id)!.payload as string;
    expect(backupPayload).toBe(baseline.lives.find((row: Record<string, unknown>) => row.id === before.id)!.payload);
    expect(checkpoints.unpackCheckpoint(backupPayload, true)).toEqual(before);
    reader.close(); reader = undefined; sqlite.close(); repository = new SaveRepository(connect()); await repository.initialise();
    const cold = createGameStore({ repository: async () => repository, date: () => after.date, id: () => 'unused' }); expect(await cold.getState().bootstrap()).toBe(true); expect(cold.getState().world).toEqual(after); expect(rows()).toEqual(saved); expect(cold.getState().world!.journal.filter(row => row.text === message)).toHaveLength(1);
    let guard = 0, lastAck: ReturnType<typeof annualCommand> | undefined;
    while ((cold.getState().world!.pending || cold.getState().world!.annual) && guard++ < 100) { const next = annualCommand(cold.getState().world!); expect(await cold.getState().dispatch(next)).toBe(true); if (next.type === 'acknowledge') lastAck = next; }
    expect(guard).toBeLessThan(100); expect(lastAck).toBeDefined(); expect(cold.getState().world!.npcMoves).toEqual(after.npcMoves); expect(cold.getState().world!.journal.filter(row => row.text === message)).toHaveLength(1);
    const acknowledged = encodeWorld(cold.getState().world!), done = rows(); expect(await cold.getState().dispatch(lastAck!)).toBe(false); expect(encodeWorld(cold.getState().world!)).toBe(acknowledged); expect(rows()).toEqual(done);
  } finally { release(); reader?.close(); jest.restoreAllMocks(); sqlite.close(); rmSync(directory, { recursive: true, force: true }); }
}, 30000);
