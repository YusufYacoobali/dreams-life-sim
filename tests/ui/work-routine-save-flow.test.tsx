import React from 'react';
import { Modal } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { createLife, randomCreation } from '../../src/game/createLife';
import { encodeWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { createContact } from '../../src/game/systems/npcs';
import { SaveRepository } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { database } from '../support/sqlite';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import pinned from '../fixtures/v30-native-interview-checkpoints.json';

let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn(), navigate: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Work from '../../app/(game)/work';
import { router } from 'expo-router';

const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><Work /><PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const modal = () => within(screen.UNSAFE_getByType(Modal));
const confirm = async (name: string) => { await act(async () => { fireEvent.press(modal().getByRole('button', { name })); }); };
const choose = async (name: string) => { await act(async () => { fireEvent.press(screen.getByRole('radio', { name })); }); };
const world = () => mockStore.getState().world!;
const acknowledge = (initial: World) => resolveCommand(initial, { type: 'acknowledge', resultId: initial.pending!.id }, true);

// Start from the immutable, genuine Android Barista hiring result. Preparation
// uses ordinary commands, and each warm store retains one repository instance.
function employee(effort: 'relaxed' | 'balanced' | 'hard' = 'balanced') {
  const initial = acknowledge(checkpoints.unpackCheckpoint(pinned.result));
  return effort === 'balanced' ? initial : acknowledge(resolveCommand(initial, { type: 'work-effort', effort }, true));
}

function pensionEligibleEmployee() {
  const initial = createLife('life_work_confirmation', 42, { ...randomCreation(42), country: 'US', city: 'New York' }, { year: 2026, month: 1, day: 1 });
  initial.birthAcknowledged = true;
  // The ordinary NPC constructor records this older employee's earned service
  // and historical wages; this is a configured scenario, not a natural lifetime.
  const person = createContact(initial, { age: 67, qualifiedRole: 'administrator' });
  initial.activePersonId = person.id;
  return initial;
}

async function setup(initial = employee()) {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver);
  await repository.initialise(); await repository.create(initial);
  let nextYield: Promise<void> | undefined;
  const pauseNextSave = () => { let release!: () => void; nextYield = new Promise<void>(resolve => { release = resolve; }); return release; };
  const cold = async (repo = new SaveRepository(driver)) => {
    mockStore = createGameStore({ repository: async () => repo, date: () => initial.date, id: () => 'unused', yieldToUI: async () => { const pause = nextYield; nextYield = undefined; if (pause) await pause; } });
    expect(await mockStore.getState().bootstrap()).toBe(true);
  };
  await cold(repository);
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  return { sqlite, rows, cold, pauseNextSave };
}

test.each(['relaxed', 'balanced', 'hard'] as const)('the current %s effort, unselected Set and cancelled draft do not save or decode', async effort => {
  const initial = employee(effort), { sqlite, rows } = await setup(initial);
  try {
    const beforeRows = rows(), before = encodeWorld(world()), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    const view = render(frame()); await press('Work routine. ' + effort);
    const label = effort === 'relaxed' ? 'Take it easy' : effort === 'balanced' ? 'Balanced' : 'Work hard';
    expect(screen.getByRole('radio', { name: label + '. This is your current routine' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Set Routine' })).toBeDisabled();
    await choose(label + '. This is your current routine'); await press('Set Routine');
    expect(screen.getByRole('button', { name: 'Set Routine' })).toBeDisabled();
    await choose(effort === 'hard' ? 'Balanced' : 'Work hard');
    expect(screen.getByRole('button', { name: 'Set Routine' })).toBeEnabled();
    await press('Never mind'); expect(screen.queryByRole('button', { name: 'Set Routine' })).toBeNull();
    await press('Work routine. ' + effort); expect(screen.getByRole('button', { name: 'Set Routine' })).toBeDisabled();
    await press('Never mind'); expect(encodeWorld(world())).toBe(before); expect(rows()).toEqual(beforeRows); expect(unpack).not.toHaveBeenCalled();
    view.unmount();
  } finally { jest.restoreAllMocks(); sqlite.close(); }
});

test.each([
  ['relaxed', 'Take it easy'],
  ['hard', 'Work hard'],
] as const)('a real %s routine edit retains its chosen draft/error after rollback, retries warm and cold-resumes once', async (effort, label) => {
  const { sqlite, rows, cold } = await setup();
  try {
    const initial = world(), before = encodeWorld(initial), beforeRows = rows(), command: GameCommand = { type: 'work-effort', effort }, predicted = resolveCommand(initial, command, true);
    let view = render(frame()); await press('Work routine. balanced'); await choose(label);
    expect(encodeWorld(world())).toBe(before); expect(rows()).toEqual(beforeRows);
    const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    sqlite.exec("CREATE TRIGGER fail_work_routine BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press('Set Routine'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/));
    expect(screen.getByRole('radio', { name: label, checked: true })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Set Routine' })).toBeEnabled();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(encodeWorld(world())).toBe(before); expect(rows()).toEqual(beforeRows);
    sqlite.exec('DROP TRIGGER fail_work_routine'); await press('Set Routine');
    expect(world()).toEqual(predicted); expect(router.navigate).toHaveBeenCalledWith('/life'); expect(screen.queryByRole('button', { name: 'Set Routine' })).toBeNull();
    expect(screen.getByText('Work routine updated')).toBeOnTheScreen(); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    const savedRows = rows(); view.unmount(); await cold(); view = render(frame());
    expect(world()).toEqual(predicted); expect(rows()).toEqual(savedRows); expect(screen.getByText('Work routine updated')).toBeOnTheScreen();
    await press('Continue'); const done = world();
    expect(done).toEqual(acknowledge(predicted)); expect(done.people).toEqual(predicted.people); expect(done.random).toEqual(predicted.random); expect(done.accounts).toEqual(initial.accounts); expect(done.ledger).toEqual(initial.ledger); expect(done.workHistory).toEqual(initial.workHistory);
    await press('Work routine. ' + effort); expect(screen.getByRole('radio', { name: label + '. This is your current routine' })).toBeDisabled(); await press('Never mind');
    const doneRows = rows(); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: predicted.pending!.id })).toBe(false); });
    expect(world()).toEqual(done); expect(rows()).toEqual(doneRows); view.unmount();
  } finally { jest.restoreAllMocks(); sqlite.close(); }
});

test.each(['quit-job', 'retire'] as const)('%s confirmation stays open on save failure, retries once and cold-resumes its exact result', async type => {
  const { sqlite, rows, cold } = await setup(type === 'retire' ? pensionEligibleEmployee() : employee());
  try {
    const initial = world(), beforeRows = rows(), command: GameCommand = { type }, predicted = resolveCommand(initial, command, true);
    const launch = type === 'retire' ? 'Retirement' : 'Resign', label = type === 'retire' ? 'Retire' : 'Resign', title = type === 'retire' ? 'Retire from work?' : 'Resign from this job?';
    let view = render(frame()); await press(launch); await press('Never mind'); expect(world()).toEqual(initial); expect(rows()).toEqual(beforeRows);
    await press(launch); const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    sqlite.exec("CREATE TRIGGER fail_work_confirmation BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await confirm(label); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/));
    expect(screen.getByText(title)).toBeOnTheScreen(); expect(modal().getByRole('button', { name: label })).toBeEnabled(); expect(world()).toEqual(initial); expect(rows()).toEqual(beforeRows);
    sqlite.exec('DROP TRIGGER fail_work_confirmation'); await confirm(label);
    expect(world()).toEqual(predicted); expect(router.navigate).not.toHaveBeenCalled(); expect(screen.queryByText(title)).toBeNull(); expect(world().people[world().activePersonId].employment).toBeNull(); expect(world().accounts).toEqual(initial.accounts); expect(world().ledger).toEqual(initial.ledger); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    const savedRows = rows(); view.unmount(); await cold(); view = render(frame()); expect(world()).toEqual(predicted); expect(rows()).toEqual(savedRows);
    await press('Continue'); expect(world()).toEqual(acknowledge(predicted)); expect(world().people).toEqual(predicted.people); expect(world().random).toEqual(predicted.random); expect(world().workHistory).toEqual(predicted.workHistory);
    const done = world(), doneRows = rows(); await act(async () => { expect(await mockStore.getState().dispatch(command)).toBe(false); }); expect(world()).toEqual(done); expect(rows()).toEqual(doneRows); view.unmount();
  } finally { jest.restoreAllMocks(); sqlite.close(); }
});

test('a pending real routine save disables mutation launches and duplicate confirmation and ignores Android Back', async () => {
  const { sqlite, rows, pauseNextSave } = await setup(pensionEligibleEmployee());
  try {
    const initial = world(), beforeRows = rows(), command: GameCommand = { type: 'work-effort', effort: 'hard' }, predicted = resolveCommand(initial, command, true);
    const view = render(frame()); await press('Work routine. balanced'); await choose('Work hard');
    const release = pauseNextSave(); await press('Set Routine'); expect(mockStore.getState().busy).toBe(true);
    for (const name of ['Work routine. balanced', 'Resign', 'Retirement', 'Set Routine', 'Never mind']) expect(screen.getByRole('button', { name })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Work hard', checked: true })).toBeDisabled();
    await press('Set Routine'); await press('Never mind'); await act(async () => { screen.UNSAFE_getByType(Modal).props.onRequestClose(); });
    expect(screen.getByRole('radio', { name: 'Work hard', checked: true })).toBeOnTheScreen(); expect(world()).toEqual(initial); expect(rows()).toEqual(beforeRows);
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false));
    expect(world()).toEqual(predicted); expect(world().revision).toBe(initial.revision + 1); expect(screen.queryByRole('button', { name: 'Set Routine' })).toBeNull(); view.unmount();
  } finally { jest.restoreAllMocks(); sqlite.close(); }
});
