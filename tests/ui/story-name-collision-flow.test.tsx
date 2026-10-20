import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bindEvent, eventTemplates } from '../../src/game/content/events';
import { copyWorld, encodeWorld, validateWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { createGameStore } from '../../src/state/gameStore';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import cohort from '../fixtures/story-name-collision-cohort.json';

let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };

test('new identical-name story and both role-labelled consequences survive an actual file-save failure, retry and closed-connection cold result', async () => {
  const row = cohort.records.find(item => item.decisionPointer === 'IT/result.json#/decisions/9')!, source = checkpoints.unpackCheckpoint(row.checkpoint), initial = copyWorld(source);
  // Test a newly created binding against the genuine context; old saved pending
  // scenes are never rebound by the production loader or resolver.
  initial.pending = bindEvent(initial, eventTemplates.find(item => item.id === 'teen-group-project-credit')!); validateWorld(initial);
  const directory = mkdtempSync(join(tmpdir(), 'dreams-colliding-story-')), path = join(directory, 'dreams.db'); let sqlite!: DatabaseSync;
  const connect = (): SqlDatabase => {
    const connection = sqlite = new DatabaseSync(path); connection.exec('PRAGMA foreign_keys=ON');
    const session: SqlSession = { run: async (sql, values = []) => { connection.prepare(sql).run(...values); }, get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null, all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[] };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => { connection.exec('BEGIN IMMEDIATE'); try { const result = await action(session); connection.exec('COMMIT'); return result; } catch (error) { connection.exec('ROLLBACK'); throw error; } } };
  };
  let repository = new SaveRepository(connect()); await repository.initialise(); await repository.create(initial);
  const bootstrap = async () => { mockStore = createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'unused' }); expect(await mockStore.getState().bootstrap()).toBe(true); };
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [String(row.name), sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  let view: ReturnType<typeof render> | undefined;
  try {
    await bootstrap(); const offered = mockStore.getState().world!, original = encodeWorld(offered), before = rows(); view = render(frame());
    expect(screen.getByText(initial.pending.body)).toBeOnTheScreen(); expect(initial.pending.body).toContain('Leonardo Ferrari (classmate)'); expect(rows()).toEqual(before);
    const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); sqlite.exec("CREATE TRIGGER fail_collision_result BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press('Interrupt with “You’re welcome!”'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/)); expect(screen.getAllByRole('alert')).toHaveLength(1); expect(rows()).toEqual(before); expect(encodeWorld(mockStore.getState().world!)).toBe(original); expect(screen.getByText(initial.pending.body)).toBeOnTheScreen();
    sqlite.exec('DROP TRIGGER fail_collision_result'); await press('Interrupt with “You’re welcome!”'); const result = mockStore.getState().world!;
    expect(result).toEqual(resolveCommand(offered, { type: 'choose', eventId: offered.pending!.id, choiceId: 'interrupt' }, true));
    for (const role of ['classmate', 'teacher']) expect(screen.getByText('Leonardo Ferrari (' + role + ') · relationship')).toBeOnTheScreen();
    expect(result.random).toEqual(offered.random); expect(result.accounts).toEqual(offered.accounts); expect(result.ledger).toEqual(offered.ledger); expect(Object.keys(result.people)).toEqual(Object.keys(offered.people)); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    const saved = rows(); view.unmount(); sqlite.close(); repository = new SaveRepository(connect()); await bootstrap(); view = render(frame()); expect(rows()).toEqual(saved); expect(mockStore.getState().world).toEqual(result);
    for (const role of ['classmate', 'teacher']) expect(screen.getByText('Leonardo Ferrari (' + role + ') · relationship')).toBeOnTheScreen();
    await press('Continue'); const done = mockStore.getState().world!; expect(done.relationships).toEqual(result.relationships); expect(done.people).toEqual(result.people); expect(done.random).toEqual(result.random);
    const acknowledged = rows(); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: result.pending!.id })).toBe(false); }); expect(rows()).toEqual(acknowledged);
  } finally { view?.unmount(); jest.restoreAllMocks(); sqlite.close(); rmSync(directory, { recursive: true, force: true }); }
});
