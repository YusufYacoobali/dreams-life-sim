import { displayText } from '../../src/ui/displayNumbers';
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { router } from 'expo-router';
import { createGameStore } from '../../src/state/gameStore';
import { copyWorld, decodeWorld, encodeWorld, immutableWorld, type World } from '../../src/game/model';
import { recordDeath } from '../../src/game/engine';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import * as summaries from '../../src/ui/deathSummary';
import native from '../fixtures/v32-native-hourly-checkpoints.json';
import family from '../fixtures/v6-birth-result.json';
import history from '../fixtures/v7-history-archive.json';

let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ Redirect: () => null, useFocusEffect: (effect: () => void) => require('react').useEffect(effect, [effect]), router: { push: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector), freshSeed: () => 12345 }));
import Death from '../../app/death';
const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><Death /></SafeAreaProvider>;
async function setup(input: World) {
  // Explicit mortality UI scenario from genuine retained data. This is not a
  // newly observed natural death and grants no history, money or accomplishments.
  const mutable = copyWorld(input); recordDeath(mutable, mutable.activePersonId, 'Explicit terminal UI scenario'); const initial = immutableWorld(mutable);
  const directory = mkdtempSync(join(tmpdir(), 'dreams-terminal-biography-')), file = join(directory, 'dreams.db'); let sqlite!: DatabaseSync;
  const connect = (): SqlDatabase => {
    const connection = sqlite = new DatabaseSync(file); connection.exec('PRAGMA foreign_keys=ON');
    const session: SqlSession = { run: async (sql, values = []) => { connection.prepare(sql).run(...values); }, get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null, all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[] };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => { connection.exec('BEGIN IMMEDIATE'); try { const result = await action(session); connection.exec('COMMIT'); return result; } catch (error) { connection.exec('ROLLBACK'); throw error; } } };
  };
  const repository = new SaveRepository(connect()); await repository.initialise(); await repository.import(JSON.stringify(history)); await repository.create(initial);
  const bootstrap = async (repo: SaveRepository) => { mockStore = createGameStore({ repository: async () => repo, date: () => initial.date, id: () => 'unused' }); expect(await mockStore.getState().bootstrap()).toBe(true); };
  await bootstrap(repository);
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [String(row.name), sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  return { initial, rows, cold: async () => { sqlite.close(); await bootstrap(new SaveRepository(connect())); }, close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); } };
}
afterEach(() => { jest.restoreAllMocks(); jest.clearAllMocks(); });

test.each(['hourly', 'family'] as const)('%s terminal detail is factual, read-only across all eight tables and real cold resume, with original estate and action routes', async kind => {
  const input = kind === 'hourly' ? checkpoints.unpackCheckpoint(native.checkpoints.final.payload) : decodeWorld(JSON.stringify(family)), context = await setup(input);
  try {
    const initial = context.initial, expected = summaries.deathSummary(initial)!, before = encodeWorld(initial), beforeRows = context.rows(), selector = jest.spyOn(summaries, 'deathSummary'), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); let view = render(frame());
    expect(screen.getByText('You Died')).toBeOnTheScreen(); expect(screen.getByRole('header', { name: 'Life at a Glance' })).toBeOnTheScreen(); expect(screen.getByText(expected.summary)).toBeOnTheScreen(); expect(screen.getByText(expected.epitaph)).toBeOnTheScreen();
    for (const row of expected.rows) expect(screen.getByLabelText(displayText(row.label + ': ' + row.value))).toBeOnTheScreen();
    expect(screen.getByRole('progressbar', { name: 'Final happiness' })).toHaveAccessibilityValue({ min: 0, max: 100, now: initial.people[initial.activePersonId].stats.happiness }); expect(selector).toHaveBeenCalledTimes(1);
    view.rerender(frame()); expect(selector).toHaveBeenCalledTimes(1); expect(unpack).not.toHaveBeenCalled(); expect(Object.keys(beforeRows)).toHaveLength(8); expect(context.rows()).toEqual(beforeRows); expect(encodeWorld(mockStore.getState().world!)).toBe(before);
    fireEvent.press(screen.getByRole('button', { name: 'View Life Summary' })); expect(router.push).toHaveBeenCalledWith('/life-summary'); fireEvent.press(screen.getByRole('button', { name: 'Start a New Life' })); expect(router.push).toHaveBeenCalledWith({ pathname: '/new-life', params: { seed: '12345' } });
    fireEvent.press(screen.getByRole('button', { name: 'Journal' })); expect(router.push).toHaveBeenLastCalledWith('/life-summary'); fireEvent.press(screen.getByRole('button', { name: 'Family Tree' })); expect(router.push).toHaveBeenLastCalledWith('/family-history');
    if (kind === 'family') { fireEvent.press(screen.getByRole('button', { name: 'Continue as Child' })); expect(router.push).toHaveBeenCalledWith('/legacy'); }
    else expect(screen.getByRole('button', { name: 'Continue as Child. No living child is available.' })).toBeDisabled();
    expect(context.rows()).toEqual(beforeRows); expect(mockStore.getState().world!.estates).toEqual(initial.estates); unpack.mockRestore(); view.unmount(); await act(async () => { await context.cold(); }); view = render(frame());
    expect(mockStore.getState().world).toEqual(initial); expect(context.rows()).toEqual(beforeRows); expect(screen.getByText(expected.summary)).toBeOnTheScreen(); expect(screen.getByText(expected.epitaph)).toBeOnTheScreen(); expect(mockStore.getState().world!.generation).toBe(initial.generation); view.unmount();
  } finally { context.close(); }
});
