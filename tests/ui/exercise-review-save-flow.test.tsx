import { displayText } from '../../src/ui/displayNumbers';
import React from 'react';
import { Modal } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createGameStore } from '../../src/state/gameStore';
import { decodeWorld, encodeWorld, type World } from '../../src/game/model';
import { randomCreation } from '../../src/game/createLife';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { accountFor } from '../../src/game/systems/common';
import { rules } from '../../src/game/rules';
import { formatMoney } from '../../src/game/money';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import { EventModal } from '../../src/ui/EventModal';
import graduate from '../fixtures/v3-employed-graduate.json';
import archive from '../fixtures/v30-native-workplace-story-archive.json';

let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Exercise from '../../app/(game)/exercise';

const frame = (pending = true) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><Exercise />{pending && <PendingEvent />}</ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const modal = () => within(screen.UNSAFE_getByType(Modal));
const world = () => mockStore.getState().world!;
const acknowledge = (input: World) => resolveCommand(input, { type: 'acknowledge', resultId: input.pending!.id }, true);

async function setup() {
  // Unchanged recorded graduate; no age/health/funding/fitness/RNG setup.
  const initial = decodeWorld(JSON.stringify(graduate)), directory = mkdtempSync(join(tmpdir(), 'dreams-exercise-review-')), path = join(directory, 'dreams.db'); let sqlite!: DatabaseSync;
  const connect = (): SqlDatabase => {
    sqlite = new DatabaseSync(path); const connection = sqlite; connection.exec('PRAGMA foreign_keys=ON');
    const session: SqlSession = { run: async (sql, values = []) => { connection.prepare(sql).run(...values); }, get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null, all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[] };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => { connection.exec('BEGIN IMMEDIATE'); try { const result = await action(session); connection.exec('COMMIT'); return result; } catch (error) { connection.exec('ROLLBACK'); throw error; } } };
  };
  const repository = new SaveRepository(connect()); await repository.initialise(); await repository.import(JSON.stringify(archive));
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])) as Record<string, Record<string, unknown>[]>;
  const oldRows = rows(); expect(Object.keys(oldRows)).toHaveLength(8); await repository.create(initial);
  let nextYield: Promise<void> | undefined;
  const pauseNextSave = () => { let release!: () => void; nextYield = new Promise<void>(resolve => { release = resolve; }); return release; };
  const bootstrap = async (repo: SaveRepository) => { mockStore = createGameStore({ repository: async () => repo, date: () => initial.date, id: () => 'life_exercise_newborn', yieldToUI: async () => { const pause = nextYield; nextYield = undefined; if (pause) await pause; } }); expect(await mockStore.getState().bootstrap()).toBe(true); };
  await bootstrap(repository);
  return {
    get sqlite() { return sqlite; }, rows, pauseNextSave, cold: async () => { sqlite.close(); await bootstrap(new SaveRepository(connect())); },
    original: () => {
      const current = rows();
      for (const table of ['lives', 'backups']) for (const row of oldRows[table]) expect(current[table].find(item => (item.id ?? item.life_id) === (row.id ?? row.life_id))).toEqual(row);
      for (const table of ['snapshots', 'snapshot_metadata', 'branches', 'restore_receipts']) expect(current[table]).toEqual(oldRows[table]);
      for (const row of oldRows.receipts) expect(sqlite.prepare('SELECT * FROM receipts WHERE life_id=? AND command_id=?').get(String(row.life_id), String(row.command_id))).toEqual(row);
      for (const point of archive.snapshots) expect(sqlite.prepare('SELECT payload FROM snapshots WHERE life_id=? AND snapshot_id=?').get(String(oldRows.lives[0].id), point.summary.id)?.payload).toBe(point.payload);
    }, close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); },
  };
}

test.each([['walk', 'Go for a Walk', 5], ['trainer', 'Hire a Personal Trainer', 18]] as const)('the exact %s session and fee survive all-table failure, warm retry and closed-connection cold acknowledgement', async (activity, title, energy) => {
  const context = await setup();
  try {
    const initial = world(), before = context.rows(), canonical = encodeWorld(initial), command: GameCommand = { type: 'exercise', activity }, expected = resolveCommand(initial, command, true), fee = activity === 'trainer' ? rules.US.baseWage / 200n : 0n;
    const oldPayload = context.sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(initial.id)?.payload, dispatch = jest.spyOn(mockStore.getState(), 'dispatch'), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); let view = render(frame());
    await press(new RegExp('^' + title + '\\.')); expect(modal().getByText(title + '?')).toBeOnTheScreen(); expect(modal().getByText(displayText(formatMoney({ minor: fee, currency: 'USD' })))).toBeOnTheScreen(); expect(modal().getByText('−' + energy + '%')).toBeOnTheScreen(); await press('Never mind'); expect(dispatch).not.toHaveBeenCalled(); expect(context.rows()).toEqual(before); expect(encodeWorld(world())).toBe(canonical);
    await press(new RegExp('^' + title + '\\.')); context.sqlite.exec("CREATE TRIGGER fail_exercise_review BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await press('Begin Session');
    await waitFor(() => expect(modal().getByRole('alert')).toHaveTextContent(/couldn't be saved/)); expect(screen.getAllByRole('alert')).toHaveLength(1); expect(modal().getByRole('alert').props.accessibilityLiveRegion).toBe('polite'); expect(modal().getByText(title + '?')).toBeOnTheScreen(); expect(modal().getByText(displayText(formatMoney({ minor: fee, currency: 'USD' })))).toBeOnTheScreen(); expect(modal().getByText('−' + energy + '%')).toBeOnTheScreen(); expect(modal().getByRole('button', { name: 'Begin Session' })).toBeEnabled(); expect(world()).toEqual(initial); expect(context.rows()).toEqual(before);
    context.sqlite.exec('DROP TRIGGER fail_exercise_review'); await press('Begin Session'); expect(world()).toEqual(expected); expect(screen.queryByText(title + '?')).toBeNull(); expect(dispatch).toHaveBeenCalledTimes(2); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    expect(accountFor(world()).cash).toBe(accountFor(initial).cash - fee); expect(world().people[initial.activePersonId].stats.energy).toBe(initial.people[initial.activePersonId].stats.energy - energy); expect(world().actionCounts[initial.activePersonId + ':health:' + initial.date.year + ':exercise']).toBe(1); expect(context.sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(initial.id)?.payload).toBe(oldPayload);
    const savedRows = context.rows(); view.unmount(); await context.cold(); view = render(frame()); expect(world()).toEqual(expected); expect(context.rows()).toEqual(savedRows); expect(screen.getByText(expected.pending!.title)).toBeOnTheScreen(); await press('Continue'); const done = acknowledge(expected); expect(world()).toEqual(done);
    const doneRows = context.rows(), coldDispatch = jest.spyOn(mockStore.getState(), 'dispatch'); const sessions = screen.getAllByRole('button', { name: /Your focused session is complete this year$/ }); expect(sessions).toHaveLength(6); for (const session of sessions) { expect(session).toBeDisabled(); fireEvent.press(session); } expect(coldDispatch).not.toHaveBeenCalled(); expect(context.rows()).toEqual(doneRows); expect(world()).toEqual(done); context.original(); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});

test('a held session blocks immediate stale submission, alternative sessions, cancel and Android Back without losing the selected activity', async () => {
  const context = await setup();
  try {
    const initial = world(), before = context.rows(), expected = resolveCommand(initial, { type: 'exercise', activity: 'trainer' }, true), dispatch = jest.spyOn(mockStore.getState(), 'dispatch'), view = render(frame()); await press(/^Hire a Personal Trainer\./);
    const submit = screen.UNSAFE_getByType(EventModal).props.onChoose, release = context.pauseNextSave();
    await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Begin Session' })); submit('confirm'); }); expect(dispatch).toHaveBeenCalledTimes(1); expect(mockStore.getState().busy).toBe(true); expect(modal().getByRole('button', { name: 'Begin Session', busy: true })).toBeDisabled(); expect(screen.getByRole('button', { name: /^Go for a Walk\./ })).toBeDisabled();
    await press(/^Go for a Walk\./); await press('Never mind'); await act(async () => { screen.UNSAFE_getByType(Modal).props.onRequestClose(); }); expect(modal().getByText('Hire a Personal Trainer?')).toBeOnTheScreen(); expect(context.rows()).toEqual(before); expect(world()).toEqual(initial);
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false)); expect(world()).toEqual(expected); expect(world().revision).toBe(initial.revision + 1); expect(dispatch).toHaveBeenCalledTimes(1); context.original(); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});

test('an unrelated actual revision keeps the reviewed session, while a new life clears it and preserves the existing age gates', async () => {
  const context = await setup();
  try {
    const initial = world(), view = render(frame(false)); await press(/^Hire a Personal Trainer\./); const review = screen.UNSAFE_getByType(EventModal).props.event;
    await act(async () => { expect(await mockStore.getState().dispatch({ type: 'meditate' })).toBe(true); }); expect(screen.UNSAFE_getByType(EventModal).props.event).toEqual(review); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: world().pending!.id })).toBe(true); }); expect(screen.UNSAFE_getByType(EventModal).props.event).toEqual(review);
    await act(async () => { expect(await mockStore.getState().startLife(randomCreation(42), 42)).toBe(true); expect(await mockStore.getState().acknowledgeBirth()).toBe(true); }); expect(screen.queryByRole('button', { name: 'Begin Session' })).toBeNull(); const newborn = world(), newbornRows = context.rows(), dispatch = jest.spyOn(mockStore.getState(), 'dispatch');
    const sessions = screen.getAllByRole('button', { name: /Available from age/ }); expect(sessions).toHaveLength(6); for (const session of sessions) { expect(session).toBeDisabled(); fireEvent.press(session); } expect(dispatch).not.toHaveBeenCalled(); expect(context.rows()).toEqual(newbornRows); expect(world()).toEqual(newborn);
    await act(async () => { expect(await mockStore.getState().selectLife(initial.id)).toBe(true); }); expect(screen.queryByRole('button', { name: 'Begin Session' })).toBeNull(); expect(world().people[initial.activePersonId].stats.energy).toBe(initial.people[initial.activePersonId].stats.energy); expect(world().actionCounts[initial.activePersonId + ':health:' + initial.date.year + ':exercise']).toBeUndefined(); context.original(); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});
