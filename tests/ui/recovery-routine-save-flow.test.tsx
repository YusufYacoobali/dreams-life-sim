import React from 'react';
import { Modal } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { encodeWorld } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { currentRecovery } from '../../src/game/systems/educationRecoverySchemas';
import { SaveRepository } from '../../src/persistence/repository';
import { decodeSave } from '../../src/persistence/archive';
import * as checkpoints from '../../src/persistence/checkpoints';
import { database } from '../support/sqlite';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import archive from '../fixtures/v23-low-grade-school-archive.json';

let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Education from '../../app/(game)/education';
const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><Education /><PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const choose = async (name: string) => { await act(async () => { fireEvent.press(screen.getByRole('radio', { name })); }); };
const world = () => mockStore.getState().world!;
const label = (effort: string) => effort[0].toUpperCase() + effort.slice(1);

async function setup(purpose: 'grades' | 'secondary', effort: 'relaxed' | 'balanced' | 'focused' = 'balanced') {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.import(JSON.stringify(archive));
  const oldMoments = sqlite.prepare('SELECT * FROM snapshots ORDER BY 1,2').all();
  // Current genuine v23 history retains its already-earned secondary credential.
  // Its actual earlier seventeenth-year branch finishes under current assessment
  // rules and is used for the missing-credential path. Neither fixture is edited.
  if (purpose === 'secondary') { const save = decodeSave(JSON.stringify(archive)); await repository.restoreBranch(save.world.id, save.snapshots.at(-1)!.summary.id, save.world.revision, 'life_recovery_routine_ui', 'fixture_recovery_branch'); }
  let nextYield: Promise<void> | undefined;
  const pauseNextSave = () => { let release!: () => void; nextYield = new Promise<void>(resolve => { release = resolve; }); return release; };
  const cold = async (repo = new SaveRepository(driver)) => { mockStore = createGameStore({ repository: async () => repo, date: () => ({ year: 2026, month: 1, day: 1 }), id: () => 'unused', yieldToUI: async () => { const pause = nextYield; nextYield = undefined; if (pause) await pause; } }); expect(await mockStore.getState().bootstrap()).toBe(true); };
  await cold(repository);
  const dispatch = async (command: GameCommand) => { expect(await mockStore.getState().dispatch(command)).toBe(true); };
  const finish = async () => {
    let guard = 0;
    while ((world().pending || world().annual) && guard++ < 150) {
      const current = world(), command: GameCommand = current.pending?.kind === 'decision' ? { type: 'choose', eventId: current.pending.id, choiceId: current.pending.choices.find(item => !choiceUnavailable(current, item))!.id } : current.pending ? { type: 'acknowledge', resultId: current.pending.id } : { type: 'resume' }; await dispatch(command);
    }
    expect(guard).toBeLessThan(150);
  };
  if (purpose === 'secondary') { await dispatch({ type: 'advance' }); await finish(); expect(world().schoolCompletions.find(item => item.personId === world().activePersonId)).toMatchObject({ passed: false, grade: 0 }); }
  await dispatch({ type: 'enroll-recovery', purpose }); await finish();
  if (effort !== 'balanced') { await dispatch({ type: 'recovery-effort', courseId: currentRecovery(world())!.id, effort }); await finish(); }
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  const original = () => {
    // Normal branch preparation adds its own Before Age Up; all old rows remain.
    for (const row of oldMoments) expect(sqlite.prepare('SELECT * FROM snapshots WHERE snapshot_id=?').get(row.snapshot_id!)).toEqual(row);
    for (const point of archive.snapshots) expect(sqlite.prepare('SELECT payload FROM snapshots WHERE snapshot_id=?').get(point.summary.id)?.payload).toBe(point.payload);
  };
  return { sqlite, rows, cold, pauseNextSave, original };
}

const unchangedCases = (['grades', 'secondary'] as const).flatMap(purpose => (['relaxed', 'balanced', 'focused'] as const).map(effort => [purpose, effort] as const));
test.each(unchangedCases)('%s course current %s choice, unselected Set and cancelled draft do not dispatch, save or decode', async (purpose, effort) => {
  const { sqlite, rows, original } = await setup(purpose, effort);
  try {
    const initial = world(), before = rows(), dispatch = jest.spyOn(mockStore.getState(), 'dispatch'), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), view = render(frame());
    await press('Evening Study Routine. ' + effort); expect(screen.getByRole('button', { name: 'Set Evening Routine' })).toBeDisabled();
    const name = label(effort) + '. This is your current routine'; expect(screen.getByRole('radio', { name })).toBeDisabled(); await choose(name); await press('Set Evening Routine'); expect(screen.getByRole('button', { name: 'Set Evening Routine' })).toBeDisabled();
    await choose(effort === 'focused' ? 'Balanced' : 'Focused'); expect(screen.getByRole('button', { name: 'Set Evening Routine' })).toBeEnabled(); await press('Never mind');
    await press('Evening Study Routine. ' + effort); expect(screen.getByRole('button', { name: 'Set Evening Routine' })).toBeDisabled(); await press('Never mind');
    expect(world()).toEqual(initial); expect(rows()).toEqual(before); expect(dispatch).not.toHaveBeenCalled(); expect(unpack).not.toHaveBeenCalled(); original(); view.unmount();
  } finally { jest.restoreAllMocks(); sqlite.close(); }
});

const changedCases = (['grades', 'secondary'] as const).flatMap(purpose => (['relaxed', 'focused'] as const).map(effort => [purpose, effort] as const));
test.each(changedCases)('%s course actual %s change retains failed draft, retries warm and cold-resumes with no extra attendance, qualification or payment', async (purpose, effort) => {
  const { sqlite, rows, cold, pauseNextSave, original } = await setup(purpose);
  try {
    const initial = world(), before = rows(), course = currentRecovery(initial)!, command: GameCommand = { type: 'recovery-effort', courseId: course.id, effort }, expected = resolveCommand(initial, command, true), encoded = encodeWorld(initial);
    let view = render(frame()); await press('Evening Study Routine. balanced'); await choose(label(effort)); const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    sqlite.exec("CREATE TRIGGER fail_evening_routine BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await press('Set Evening Routine'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/));
    expect(screen.getByRole('radio', { name: label(effort), checked: true })).toBeOnTheScreen(); expect(screen.getByRole('alert')).toHaveProp('accessibilityLiveRegion', 'polite'); expect(encodeWorld(world())).toBe(encoded); expect(rows()).toEqual(before);
    sqlite.exec('DROP TRIGGER fail_evening_routine'); const release = pauseNextSave(); await press('Set Evening Routine');
    expect(screen.getByRole('button', { name: 'Set Evening Routine', busy: true })).toBeDisabled(); expect(screen.getAllByRole('button', { busy: true })).toHaveLength(1);
    for (const name of ['Evening Study Routine. balanced', 'Leave Evening Classes', 'Never mind']) expect(screen.getByRole('button', { name })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^Extra Evening Study\./ })).toBeDisabled(); await press('Set Evening Routine'); await press('Never mind'); await act(async () => { screen.UNSAFE_getByType(Modal).props.onRequestClose(); }); expect(rows()).toEqual(before);
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false)); expect(world()).toEqual(expected); expect(screen.queryByRole('button', { name: 'Set Evening Routine' })).toBeNull(); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    const savedRows = rows(); view.unmount(); await cold(); view = render(frame()); expect(world()).toEqual(expected); expect(rows()).toEqual(savedRows); await press('Continue'); expect(world()).toEqual(resolveCommand(expected, { type: 'acknowledge', resultId: expected.pending!.id }, true));
    expect(world().people).toEqual(initial.people); expect(world().ledger).toEqual(initial.ledger); expect(world().accounts).toEqual(initial.accounts); expect(world().random).toEqual(initial.random); expect(currentRecovery(world())!.periods).toEqual(course.periods);
    const done = world(), doneRows = rows(); await press('Evening Study Routine. ' + effort); expect(screen.getByRole('radio', { name: label(effort) + '. This is your current routine' })).toBeDisabled(); await press('Never mind'); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: expected.pending!.id })).toBe(false); }); expect(world()).toEqual(done); expect(rows()).toEqual(doneRows); original(); view.unmount();
  } finally { jest.restoreAllMocks(); sqlite.close(); }
});
