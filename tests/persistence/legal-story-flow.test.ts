import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bindEvent } from '../../src/game/content/events';
import { legalTemplates } from '../../src/game/content/legalStories';
import { offerPending } from '../../src/game/pendingQueue';
import { resolveCommand } from '../../src/game/engine';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import { createGameStore } from '../../src/state/gameStore';
import { actualReleasedStoryWorld } from '../support/legalStories';

function connection(path: string) {
  const sqlite = new DatabaseSync(path); sqlite.exec('PRAGMA foreign_keys=ON');
  const session: SqlSession = {
    run: async (sql, values = []) => { sqlite.prepare(sql).run(...values); },
    get: async <T,>(sql: string, values: (string | number | null)[] = []) => sqlite.prepare(sql).get(...values) as T ?? null,
    all: async <T,>(sql: string, values: (string | number | null)[] = []) => sqlite.prepare(sql).all(...values) as T[],
  };
  const driver: SqlDatabase = { ...session, exec: async sql => { sqlite.exec(sql); }, transaction: async action => {
    sqlite.exec('BEGIN IMMEDIATE'); try { const value = await action(session); sqlite.exec('COMMIT'); return value; } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
  } };
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  return { sqlite, driver, rows };
}

test('a real released v9 actor keeps the exact new choice through failed saving, one retry and a closed-connection cold result', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'dreams-legal-story-')), path = join(directory, 'life.db');
  let db = connection(path);
  try {
    // Care, court and release were actual ordinary commands on the unchanged
    // v9 archive. Only optional template selection is arranged here, not RNG.
    const initial = actualReleasedStoryWorld(), originalLegal = structuredClone({ cases: initial.cases, sentences: initial.sentences, ledger: initial.ledger });
    const event = bindEvent(initial, legalTemplates.find(item => item.legal === 'released')!); offerPending(initial, event);
    let repository = new SaveRepository(db.driver); await repository.initialise(); await repository.create(initial);
    const createStore = () => createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'unused' });
    let store = createStore(); expect(await store.getState().bootstrap()).toBe(true);
    const before = store.getState().world!, rows = db.rows(), payload = db.sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(initial.id)!.payload;
    expect(Object.keys(rows)).toHaveLength(8);
    const command = { type: 'choose' as const, eventId: event.id, choiceId: 'routine' }, expected = resolveCommand(before, command);
    db.sqlite.exec("CREATE TRIGGER fail_legal_story BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    expect(await store.getState().dispatch(command)).toBe(false);
    expect(store.getState().world).toBe(before); expect(store.getState().world!.pending).toEqual(event); expect(db.rows()).toEqual(rows);
    db.sqlite.exec('DROP TRIGGER fail_legal_story');
    expect(await store.getState().dispatch(command)).toBe(true); expect(store.getState().world).toEqual(expected);
    expect(db.sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(initial.id)!.payload).toBe(payload);
    const committed = db.rows(); db.sqlite.close(); db = connection(path);
    repository = new SaveRepository(db.driver); await repository.initialise(); store = createStore(); expect(await store.getState().bootstrap()).toBe(true);
    expect(store.getState().world).toEqual(expected); expect(db.rows()).toEqual(committed);
    expect(await store.getState().dispatch(command)).toBe(false); expect(db.rows()).toEqual(committed);
    const result = store.getState().world!.pending!;
    expect(result).toMatchObject({ kind: 'result', title: 'A timetable you can change' });
    expect(await store.getState().dispatch({ type: 'acknowledge', resultId: result.id })).toBe(true);
    const done = store.getState().world!;
    expect({ cases: done.cases, sentences: done.sentences, ledger: done.ledger }).toEqual(originalLegal);
    expect(done.random).toEqual(before.random); expect(done.journal.filter(row => row.id === event.id + '_choice')).toHaveLength(1);
    const acknowledged = db.rows(); expect(await store.getState().dispatch({ type: 'acknowledge', resultId: result.id })).toBe(false);
    expect(db.rows()).toEqual(acknowledged);
  } finally { db.sqlite.close(); rmSync(directory, { recursive: true, force: true }); }
});
