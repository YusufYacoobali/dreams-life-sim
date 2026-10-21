import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGameStore } from '../../src/state/gameStore';
import { encodeWorld, World } from '../../src/game/model';
import { SaveRepository, SqlDatabase, SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import * as statisticsData from '../../src/ui/lifetimeStatistics';
import { ThemeProvider } from '../../src/ui/theme';
import archive from '../fixtures/v28-ordinary-hobby-archive.json';

let mockStore: ReturnType<typeof createGameStore>, mockParams: { id?: string | string[]; tab?: string } = {}, mockPath = '/statistics';
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn(), navigate: jest.fn() }, useLocalSearchParams: () => mockParams, useGlobalSearchParams: () => mockParams, usePathname: () => mockPath, Redirect: () => null, Stack: Object.assign(({ children }: React.PropsWithChildren) => children, { Screen: () => null }) }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import { router } from 'expo-router';
import Extras from '../../app/(game)/extras';
import Statistics from '../../app/(game)/statistics';
import GameLayout from '../../app/(game)/_layout';
const frame = (children: React.ReactNode = <Statistics />) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{children}</ThemeProvider></SafeAreaProvider>;
const world = () => mockStore.getState().world!;

async function setup(initial?: World) {
  const directory = mkdtempSync(join(tmpdir(), 'dreams-statistics-')), path = join(directory, 'dreams.db'); let sqlite: DatabaseSync;
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
  const repository = new SaveRepository(connect()); await repository.initialise(); if (initial) await repository.create(initial); else await repository.import(JSON.stringify(archive));
  const bootstrap = async (repo: SaveRepository) => { mockStore = createGameStore({ repository: async () => repo, date: () => ({ year: 2026, month: 10, day: 20 }), id: () => 'unused' }); expect(await mockStore.getState().bootstrap()).toBe(true); };
  await bootstrap(repository); mockParams = {};
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  return { rows, cold: async () => { sqlite.close(); await bootstrap(new SaveRepository(connect())); }, oldMoments: () => { if (!initial) for (const point of archive.snapshots) expect(sqlite.prepare('SELECT payload FROM snapshots WHERE snapshot_id=?').get(point.summary.id)?.payload).toBe(point.payload); }, close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); } };
}

test('Extras opens read-only Statistics without selecting a life, changing pending work, writing any of eight tables or unpacking; cold resume is exact', async () => {
  const context = await setup();
  try {
    const original = world(), encoded = encodeWorld(original), rows = context.rows(), projection = jest.spyOn(statisticsData, 'lifetimeStatistics'), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); expect(Object.keys(rows)).toHaveLength(8);
    let view = render(frame(<Extras />)); fireEvent.press(screen.getByRole('button', { name: /^Statistics\./ })); expect(router.push).toHaveBeenLastCalledWith({ pathname: '/statistics', params: { tab: 'activities' } }); expect(projection).not.toHaveBeenCalled();
    view.rerender(frame()); expect(projection).toHaveBeenCalledTimes(1); expect(screen.getByText('Riley Kelly')).toBeOnTheScreen(); expect(screen.getByRole('progressbar', { name: 'Discipline' })).toHaveAccessibilityValue({ now: original.people[original.activePersonId].stats.discipline }); expect(screen.getByText(/Older saves and background periods can be incomplete/)).toBeOnTheScreen();
    view.rerender(frame()); fireEvent.press(screen.getByRole('button', { name: 'Back' })); expect(router.back).toHaveBeenCalled(); expect(projection).toHaveBeenCalledTimes(1);
    // Same world, selected actual parent. No selectLife or active-person change.
    mockParams = { id: 'person_parent1' }; view.rerender(frame()); expect(projection).toHaveBeenCalledTimes(2); expect(screen.getByText(original.people.person_parent1.firstName + ' ' + original.people.person_parent1.lastName)).toBeOnTheScreen();
    mockParams = { id: 'not-a-person' }; view.rerender(frame()); expect(screen.getByText('This person’s statistics are unavailable.')).toBeOnTheScreen(); expect(screen.queryByText('Riley Kelly')).toBeNull();
    mockParams = { id: ['person_player', 'person_parent1'] }; view.rerender(frame()); expect(screen.getByText('This person’s statistics are unavailable.')).toBeOnTheScreen();
    expect(world()).toBe(original); expect(encodeWorld(world())).toBe(encoded); expect(context.rows()).toEqual(rows); expect(unpack).not.toHaveBeenCalled(); expect(screen.queryByLabelText('Saving')).toBeNull(); context.oldMoments(); unpack.mockRestore(); projection.mockRestore();
    view.unmount(); await context.cold(); mockParams = {}; view = render(frame()); expect(encodeWorld(world())).toBe(encoded); expect(context.rows()).toEqual(rows); expect(screen.getByText('Riley Kelly')).toBeOnTheScreen(); expect(world().pending).toEqual(original.pending); expect(world().annual).toEqual(original.annual); context.oldMoments(); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});

test('the actual nested Activities context returns to its root on reselect, keeps root taps inert and preserves all saved data', async () => {
  const context = await setup();
  try {
    const original = world(), encoded = encodeWorld(original), rows = context.rows(), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), dispatch = jest.spyOn(mockStore.getState(), 'dispatch'), view = render(frame(<Extras />));
    fireEvent.press(screen.getByRole('button', { name: /^Statistics\./ }));
    const destination = jest.mocked(router.push).mock.calls.at(-1)![0] as { pathname: string; params: { tab: string } };
    expect(destination.pathname).toBe('/statistics'); mockPath = destination.pathname; mockParams = destination.params;
    view.rerender(frame(<><GameLayout /><Statistics /></>)); expect(screen.getByRole('tab', { name: 'Activities', selected: true })).toBeOnTheScreen(); expect(screen.getByRole('tab', { name: 'Life', selected: false })).toBeOnTheScreen(); expect(screen.getByText('Riley Kelly')).toBeOnTheScreen();
    mockParams = { ...destination.params, id: 'person_parent1' }; view.rerender(frame(<><GameLayout /><Statistics /></>)); expect(screen.getByRole('tab', { name: 'Activities', selected: true })).toBeOnTheScreen(); expect(screen.getByText(original.people.person_parent1.firstName + ' ' + original.people.person_parent1.lastName)).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('tab', { name: 'Activities', selected: true })); expect(router.navigate).toHaveBeenCalledTimes(1); expect(router.navigate).toHaveBeenLastCalledWith('/activities');
    mockPath = '/activities'; mockParams = {}; view.rerender(frame(<GameLayout />)); fireEvent.press(screen.getByRole('tab', { name: 'Activities', selected: true })); expect(router.navigate).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByRole('tab', { name: 'Life', selected: false })); expect(router.navigate).toHaveBeenCalledTimes(2); expect(router.navigate).toHaveBeenLastCalledWith('/life');
    mockPath = '/life'; view.rerender(frame(<GameLayout />)); fireEvent.press(screen.getByRole('tab', { name: 'Life', selected: true })); expect(router.navigate).toHaveBeenCalledTimes(2);
    // The observed Education issue also uses the actual pathname fallback,
    // without a tab query or a visible/scrolled-in Back header.
    mockPath = '/education'; view.rerender(frame(<GameLayout />)); fireEvent.press(screen.getByRole('tab', { name: 'Activities', selected: true })); expect(router.navigate).toHaveBeenCalledTimes(3); expect(router.navigate).toHaveBeenLastCalledWith('/activities');
    expect(dispatch).not.toHaveBeenCalled(); expect(world()).toBe(original); expect(encodeWorld(world())).toBe(encoded); expect(context.rows()).toEqual(rows); expect(unpack).not.toHaveBeenCalled(); expect(world().pending).toEqual(original.pending); expect(world().annual).toEqual(original.annual); context.oldMoments(); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});

test('actual heir and ancestor views remain isolated across route changes and a closed-connection cold resume', async () => {
  const initial = checkpoints.unpackCheckpoint(readFileSync(join(__dirname, '../fixtures/v30-family-year91-checkpoint.json'), 'utf8'), true), context = await setup(initial);
  try {
    const original = world(), encoded = encodeWorld(original), rows = context.rows(), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), view = render(frame());
    expect(screen.getByLabelText('Recorded employment-months: 336')).toBeOnTheScreen();
    mockParams = { id: 'person_player' }; view.rerender(frame()); expect(screen.getByText('Age at death 86 · This person and timeline')).toBeOnTheScreen(); expect(screen.getByLabelText('Recorded employment-months: 588')).toBeOnTheScreen(); expect(screen.queryByLabelText('Recorded employment-months: 336')).toBeNull(); expect(screen.getByText('Last Recorded Stats')).toBeOnTheScreen(); expect(world()).toBe(original); expect(context.rows()).toEqual(rows); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    view.unmount(); await context.cold(); const reopened = render(frame()); expect(encodeWorld(world())).toBe(encoded); expect(context.rows()).toEqual(rows); expect(world().activePersonId).toBe('person_npc_246_24'); expect(screen.getByText('Age at death 86 · This person and timeline')).toBeOnTheScreen(); reopened.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});
