import React from 'react';
import { Modal } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGameStore } from '../../src/state/gameStore';
import { encodeWorld } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import { EventModal } from '../../src/ui/EventModal';
import archive from '../fixtures/v24-university-loan-archive.json';
import pinnedArchive from '../fixtures/v30-native-workplace-story-archive.json';

let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import ScholarshipApplications from '../../app/(game)/scholarships';

const world = () => mockStore.getState().world!;
const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><ScholarshipApplications /><PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const confirmation = () => screen.UNSAFE_getAllByType(EventModal).find(item => item.props.event?.kind === 'confirmation')!;
const modal = () => within(screen.UNSAFE_getByType(Modal));
async function command(command: GameCommand) { expect(await mockStore.getState().dispatch(command)).toBe(true); }
async function setup() {
  const directory = mkdtempSync(join(tmpdir(), 'dreams-scholarship-durable-')), path = join(directory, 'dreams.db'); let sqlite: DatabaseSync;
  const connect = (): SqlDatabase => {
    sqlite = new DatabaseSync(path); sqlite.exec('PRAGMA foreign_keys=ON'); const connection = sqlite;
    const session: SqlSession = { run: async (sql, values = []) => { connection.prepare(sql).run(...values); }, get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null, all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[] };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => { connection.exec('BEGIN IMMEDIATE'); try { const result = await action(session); connection.exec('COMMIT'); return result; } catch (error) { connection.exec('ROLLBACK'); throw error; } } };
  };
  let repository = new SaveRepository(connect()); await repository.initialise(); await repository.import(JSON.stringify(pinnedArchive)); await repository.import(JSON.stringify(archive));
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])) as Record<string, Record<string, unknown>[]>;
  const original = (await repository.active())!, imported = rows(); expect(Object.keys(imported)).toHaveLength(8);
  await repository.restoreBranch(original.id, archive.snapshots[0].summary.id, original.revision, 'life_scholarship_durable', 'original_pupil_scholarship');
  let nextYield: Promise<void> | undefined;
  const pause = () => { let release!: () => void; nextYield = new Promise<void>(resolve => { release = resolve; }); return release; };
  let dispatch: jest.SpyInstance<Promise<boolean>, [GameCommand]>;
  const bootstrap = async () => { mockStore = createGameStore({ repository: async () => repository, date: () => original.date, id: () => 'unused', yieldToUI: async () => { const wait = nextYield; nextYield = undefined; if (wait) await wait; } }); expect(await mockStore.getState().bootstrap()).toBe(true); dispatch = jest.spyOn(mockStore.getState(), 'dispatch'); }; await bootstrap();
  expect(world().date.year).toBe(2017); await command({ type: 'advance' }); let guard = 0;
  while (world().pending || world().annual) {
    if (++guard > 120) throw new Error('Original scholarship pupil stalled');
    const pending = world().pending, choice = pending?.kind === 'decision' ? pending.choices.find(item => !choiceUnavailable(world(), item)) : undefined;
    await command(pending?.kind === 'decision' ? { type: 'choose', eventId: pending.id, choiceId: choice!.id } : pending ? { type: 'acknowledge', resultId: pending.id } : { type: 'resume' });
  }
  expect(world().date.year).toBe(2018); expect(world().schoolCompletions.find(item => item.personId === world().activePersonId)?.passed).toBe(true); expect(world().scholarships).toEqual([]);
  return { get sqlite() { return sqlite; }, get dispatch() { return dispatch; }, originalId: original.id, rows, pause,
    cold: async () => { sqlite.close(); repository = new SaveRepository(connect()); await bootstrap(); },
    originals: () => {
      const current = rows(); for (const table of ['lives', 'backups', 'snapshots', 'snapshot_metadata', 'branches', 'restore_receipts']) for (const row of imported[table]) expect(current[table]).toContainEqual(row);
      for (const row of imported.receipts) expect(sqlite.prepare('SELECT * FROM receipts WHERE life_id=? AND command_id=?').get(String(row.life_id), String(row.command_id))).toEqual(row);
      for (const input of [archive, pinnedArchive]) for (const point of input.snapshots) expect(sqlite.prepare('SELECT payload FROM snapshots WHERE snapshot_id=?').get(point.summary.id)?.payload).toBe(point.payload);
    }, close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); } };
}
async function localChoice(row: RegExp, value: string, confirm: string) {
  await press(row); await act(async () => { fireEvent.press(screen.getByRole('radio', { name: value })); }); await press(confirm);
}
async function failureRetry(context: Awaited<ReturnType<typeof setup>>, confirm: string, actual: GameCommand) {
  const initial = world(), before = context.rows(), reviewed = confirmation().props, expected = resolveCommand(initial, actual, true), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), dispatch = context.dispatch, calls = dispatch.mock.calls.length;
  const release = context.pause(); context.sqlite.exec("CREATE TRIGGER fail_scholarship BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  try {
    await press(confirm); expect(mockStore.getState().busy).toBe(true); expect(world()).toEqual(initial); expect(context.rows()).toEqual(before);
    const heldConfirmation = screen.queryByRole('button', { name: confirm })?.props.accessibilityState, heldCourse = screen.getByRole('button', { name: /^Course\./, includeHiddenElements: true }).props.accessibilityState, heldSubject = screen.getByRole('button', { name: /^Subject\./, includeHiddenElements: true }).props.accessibilityState;
    await act(async () => { reviewed.onChoose('confirm'); reviewed.onChoose('confirm'); reviewed.onCancel(); screen.UNSAFE_queryByType(Modal)?.props.onRequestClose(); fireEvent.press(screen.getByRole('button', { name: 'Back', includeHiddenElements: true })); });
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().error).toMatch(/couldn't be saved/));
    expect(screen.queryByText(reviewed.event.title)).toBeOnTheScreen(); expect(confirmation().props.event).toEqual(reviewed.event); expect(modal().getByRole('alert')).toHaveTextContent(/couldn't be saved/); expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(heldConfirmation).toEqual({ disabled: true, busy: true }); expect(heldCourse).toEqual({ disabled: true }); expect(heldSubject).toEqual({ disabled: true }); expect(router.back).not.toHaveBeenCalled(); expect(dispatch).toHaveBeenCalledTimes(calls + 1);
    expect(world()).toEqual(initial); expect(context.rows()).toEqual(before); expect(unpack).not.toHaveBeenCalled();
    context.sqlite.exec('DROP TRIGGER fail_scholarship'); await press(confirm); expect(world()).toEqual(expected); expect(screen.queryByRole('button', { name: confirm })).toBeNull(); expect(unpack).not.toHaveBeenCalled();
    expect(context.sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(initial.id)?.payload).toBe(before.lives.find(row => row.id === initial.id)!.payload);
    return expected;
  } finally {
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false)); context.sqlite.exec('DROP TRIGGER IF EXISTS fail_scholarship'); unpack.mockRestore();
  }
}

test('genuine scholarship application and decline retain exact failed reviews, retry once and cold resume without tuition or aid activation', async () => {
  const context = await setup();
  try {
    const initial = world(), before = context.rows(), canonical = encodeWorld(initial), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); let view = render(frame());
    await localChoice(/^Course\./, 'Trade School', 'Choose Course'); await localChoice(/^Subject\./, 'Business', 'Choose Subject'); await localChoice(/^Course\./, 'University', 'Choose Course'); await localChoice(/^Subject\./, 'Computing', 'Choose Subject');
    await press('Apply · Academic Scholarship'); expect(screen.getByText('$14,000.00')).toBeOnTheScreen(); expect(screen.getByText('$10,500.00')).toBeOnTheScreen(); expect(screen.getByText('$3,500.00')).toBeOnTheScreen(); await press('Never mind'); expect(context.rows()).toEqual(before); expect(encodeWorld(world())).toBe(canonical); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    await press('Apply · Academic Scholarship'); const applied = await failureRetry(context, 'Apply For Scholarship', { type: 'apply-scholarship', kind: 'merit', program: 'university', field: 'computing' });
    expect(applied.scholarships).toHaveLength(1); const item = applied.scholarships[0]; expect(item).toMatchObject({ status: 'offered', roll: 51, program: 'university', field: 'computing', annualTuition: 1400000n, periods: [], course: null }); expect(applied.people).toEqual(initial.people); expect(applied.accounts).toEqual(initial.accounts); expect(applied.liabilities).toEqual(initial.liabilities); expect(applied.ledger).toEqual(initial.ledger); expect(applied.universityApplications).toEqual([]); expect(applied.studyCourses).toEqual([]);
    const saved = context.rows(); view.unmount(); await context.cold(); view = render(frame()); expect(world()).toEqual(applied); expect(context.rows()).toEqual(saved); await press('Continue'); const acknowledged = world(), acknowledgedRows = context.rows();
    await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: applied.pending!.id })).toBe(false); expect(await mockStore.getState().dispatch({ type: 'apply-scholarship', kind: 'merit', program: 'university', field: 'computing' })).toBe(false); }); expect(world()).toEqual(acknowledged); expect(context.rows()).toEqual(acknowledgedRows);
    await press('Decline Academic Scholarship'); await press('Never mind'); expect(world()).toEqual(acknowledged); expect(context.rows()).toEqual(acknowledgedRows); await press('Decline Academic Scholarship'); const declined = await failureRetry(context, 'Decline Offer', { type: 'decline-scholarship', scholarshipId: item.id });
    expect(declined.scholarships[0]).toEqual({ ...item, status: 'withdrawn', ended: declined.date }); expect(declined.random).toEqual(acknowledged.random); expect(declined.people).toEqual(initial.people); expect(declined.accounts).toEqual(initial.accounts); expect(declined.liabilities).toEqual(initial.liabilities); expect(declined.ledger).toEqual(initial.ledger);
    const declinedRows = context.rows(); view.unmount(); await context.cold(); view = render(frame()); expect(world()).toEqual(declined); expect(context.rows()).toEqual(declinedRows); await press('Continue'); const done = world(), doneRows = context.rows(); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: declined.pending!.id })).toBe(false); expect(await mockStore.getState().dispatch({ type: 'decline-scholarship', scholarshipId: item.id })).toBe(false); }); expect(world()).toEqual(done); expect(context.rows()).toEqual(doneRows); context.originals(); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
}, 60000);

test('local current choices save nothing, same-context progression retains the review and selecting the original life discards stale drafts and callbacks', async () => {
  const context = await setup();
  try {
    const initial = world(), before = context.rows(), dispatch = context.dispatch, calls = dispatch.mock.calls.length, unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), view = render(frame());
    await press(/^Course\./); expect(screen.getByRole('radio', { name: /University\. This is your selected course/ })).toBeDisabled(); await press('Never mind');
    await press(/^Subject\./); expect(screen.getByRole('radio', { name: /Computing\. This is your selected subject/ })).toBeDisabled(); await press('Never mind');
    await localChoice(/^Course\./, 'Trade School', 'Choose Course'); await localChoice(/^Subject\./, 'Business', 'Choose Subject'); await press('Apply · Academic Scholarship');
    const retained = confirmation().props; expect(retained.event.terms).toContainEqual({ id: 'course', label: 'Course', value: 'trade · business', tone: 'neutral' }); expect(world()).toEqual(initial); expect(context.rows()).toEqual(before); expect(dispatch).toHaveBeenCalledTimes(calls); expect(unpack).not.toHaveBeenCalled();
    await act(async () => { await command({ type: 'meditate' }); await command({ type: 'acknowledge', resultId: world().pending!.id }); }); expect(confirmation().props.event).toBe(retained.event); expect(world().scholarships).toEqual([]);
    await act(async () => { expect(await mockStore.getState().selectLife(context.originalId)).toBe(true); }); const selected = world(), selectedRows = context.rows(), count = dispatch.mock.calls.length; expect(selected.activePersonId).toBe(initial.activePersonId); expect(selected.id).not.toBe(initial.id); expect(selected.people[selected.activePersonId].education.months).toBe(12); expect(screen.queryByText(retained.event.title)).toBeNull(); expect(screen.getByRole('button', { name: /^Course\. University$/ })).toBeOnTheScreen(); expect(screen.getByRole('button', { name: /^Subject\. computing$/ })).toBeOnTheScreen();
    await act(async () => { await retained.onChoose('confirm'); }); expect(dispatch).toHaveBeenCalledTimes(count); expect(world()).toEqual(selected); expect(context.rows()).toEqual(selectedRows); expect(selected.scholarships).toEqual([]); context.originals(); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
}, 60000);
