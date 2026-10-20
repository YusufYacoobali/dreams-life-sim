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
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { randomCreation } from '../../src/game/createLife';
import { accountFor } from '../../src/game/systems/common';
import { activeSentence, prisonContacts } from '../../src/game/systems/legal';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import graduate from '../fixtures/v3-employed-graduate.json';
import archive from '../fixtures/v9-court-archive.json';

let mockStore: ReturnType<typeof createGameStore>, mockCaseId = '';
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() }, useLocalSearchParams: () => ({ id: mockCaseId }) }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import CaseDetail from '../../app/(game)/case/[id]';
import PrisonActivities from '../../app/(game)/prison-activities';
import BlackMarket from '../../app/(game)/black-market';

const frame = (child: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{child}<PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const confirm = async (name: string) => { await act(async () => { fireEvent.press(within(screen.UNSAFE_getByType(Modal)).getByRole('button', { name })); }); };
const world = () => mockStore.getState().world!;
const ack = (value: World) => resolveCommand(value, { type: 'acknowledge', resultId: value.pending!.id }, true);
const choose = (value: World, choiceId: string) => resolveCommand(value, { type: 'choose', eventId: value.pending!.id, choiceId }, true);
// The immutable graduate's existing RNG naturally produces this actual arrest.
// All preparation uses production commands, with no money/stat/time/RNG edits.
function openCase() {
  const arrested = resolveCommand(decodeWorld(JSON.stringify(graduate)), { type: 'crime', offence: 'vandalism' }, true);
  expect(arrested.pending).toMatchObject({ kind: 'decision', templateId: 'arrest' });
  return ack(choose(arrested, 'remand'));
}
function prison() {
  const hearing = resolveCommand(openCase(), { type: 'advance' }, true);
  expect(hearing.pending).toMatchObject({ kind: 'decision', templateId: 'court-hearing' });
  return ack(choose(hearing, 'guilty'));
}

async function setup(initial: World) {
  const folder = mkdtempSync(join(tmpdir(), 'dreams-legal-ui-')), file = join(folder, 'dreams.db');
  let sqlite!: DatabaseSync;
  const connect = (): SqlDatabase => {
    sqlite = new DatabaseSync(file); const connection = sqlite; connection.exec('PRAGMA foreign_keys=ON');
    const session: SqlSession = {
      run: async (sql, values = []) => { connection.prepare(sql).run(...values); },
      get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null,
      all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[],
    };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => {
      connection.exec('BEGIN IMMEDIATE'); try { const value = await action(session); connection.exec('COMMIT'); return value; } catch (error) { connection.exec('ROLLBACK'); throw error; }
    } };
  };
  const repository = new SaveRepository(connect()); await repository.initialise(); await repository.import(JSON.stringify(archive));
  const tables = () => sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => String(row.name));
  const rows = () => Object.fromEntries(tables().map(name => [name, sqlite.prepare('SELECT * FROM ' + name + ' ORDER BY 1,2').all()]));
  expect(tables()).toHaveLength(8); const old = rows(); await repository.create(initial);
  let nextYield: Promise<void> | undefined;
  const pauseNextSave = () => { let release!: () => void; nextYield = new Promise<void>(resolve => { release = resolve; }); return release; };
  const boot = async (repo: SaveRepository) => {
    mockStore = createGameStore({ repository: async () => repo, date: () => initial.date, id: () => 'life_legal_second', yieldToUI: async () => { const pause = nextYield; nextYield = undefined; if (pause) await pause; } }); expect(await mockStore.getState().bootstrap()).toBe(true);
  };
  await boot(repository);
  return {
    get sqlite() { return sqlite; }, rows, pauseNextSave,
    cold: async () => { sqlite.close(); await boot(new SaveRepository(connect())); },
    original: () => {
      for (const table of ['lives', 'backups']) for (const oldRow of old[table]) expect(rows()[table].find(row => (row.id ?? row.life_id) === (oldRow.id ?? oldRow.life_id))).toEqual(oldRow);
      for (const table of ['snapshots', 'snapshot_metadata', 'branches', 'restore_receipts']) expect(rows()[table]).toEqual(old[table]);
      for (const oldRow of old.receipts) expect(sqlite.prepare('SELECT * FROM receipts WHERE life_id=? AND command_id=?').get(oldRow.life_id, oldRow.command_id)).toEqual(oldRow);
      for (const point of archive.snapshots) expect(sqlite.prepare('SELECT payload FROM snapshots WHERE snapshot_id=?').get(point.summary.id)?.payload).toBe(point.payload);
    },
    close: () => { sqlite.close(); rmSync(folder, { recursive: true, force: true }); },
  };
}

test('the exact reviewed counsel/payment survives on-disk rollback, busy duplicates/cancel, warm retry and a closed-connection cold result', async () => {
  const initial = openCase(), item = initial.cases[0], db = await setup(initial); mockCaseId = item.id;
  try {
    const command: GameCommand = { type: 'retain-counsel', caseId: item.id, counsel: 'private' }, expected = resolveCommand(initial, command, true), beforeRows = db.rows(), originalPayload = db.sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(initial.id)?.payload;
    let view = render(frame(<CaseDetail />)); await press(/Private Counsel\./); await confirm('Never mind'); expect(db.rows()).toEqual(beforeRows); expect(world()).toEqual(initial);
    await press(/Private Counsel\./); const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    db.sqlite.exec("CREATE TRIGGER fail_legal_ui BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await confirm('Choose Counsel');
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/)); expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Choose Counsel' })).toBeEnabled(); expect(screen.getByText('Change representation?')).toBeOnTheScreen(); expect(db.rows()).toEqual(beforeRows); expect(world()).toEqual(initial);
    db.sqlite.exec('DROP TRIGGER fail_legal_ui'); const release = db.pauseNextSave(); await confirm('Choose Counsel');
    expect(mockStore.getState().busy).toBe(true); expect(screen.getByRole('button', { name: 'Choose Counsel', busy: true })).toBeDisabled(); expect(screen.getByRole('button', { name: 'Never mind' })).toBeDisabled();
    await confirm('Choose Counsel'); await confirm('Never mind'); await act(async () => { screen.UNSAFE_getByType(Modal).props.onRequestClose(); }); expect(db.rows()).toEqual(beforeRows);
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false)); expect(world()).toEqual(expected); expect(screen.queryByRole('button', { name: 'Choose Counsel' })).toBeNull(); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    expect(accountFor(world()).cash).toBe(accountFor(initial).cash - item.counselFee.minor); expect(world().random).toEqual(initial.random); expect(world().cases[0].evidence).toBe(item.evidence); expect(world().cases[0].trialRoll).toBe(item.trialRoll);
    const savedRows = db.rows(), raw = db.sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(initial.id)?.payload; expect(raw).toBe(originalPayload);
    view.unmount(); await db.cold(); view = render(frame(<CaseDetail />)); expect(world()).toEqual(expected); expect(db.rows()).toEqual(savedRows);
    await press('Continue'); expect(world()).toEqual(ack(expected)); expect(world().ledger).toEqual(expected.ledger); expect(world().random).toEqual(expected.random); expect(world().sentences).toEqual(expected.sentences); db.original(); view.unmount();
  } finally { jest.restoreAllMocks(); db.close(); }
});

test('an unchanged prison routine saves nothing; a changed draft survives rollback and cold-resumes without granting free work/study', async () => {
  const initial = prison(), db = await setup(initial);
  try {
    const initialRows = db.rows(), dispatch = jest.spyOn(mockStore.getState(), 'dispatch'); let view = render(frame(<PrisonActivities />));
    expect(screen.getByRole('button', { name: 'Save Prison Routine. This is your current routine' })).toBeDisabled(); await press('Save Prison Routine. This is your current routine'); expect(dispatch).not.toHaveBeenCalled(); expect(db.rows()).toEqual(initialRows);
    fireEvent(screen.getByLabelText('Prison work'), 'valueChange', true); fireEvent(screen.getByLabelText('Prison study'), 'valueChange', true); await press(/Socialise in the Yard/);
    const routine = { work: true, study: true, exercise: false, conduct: 'social' as const }, command: GameCommand = { type: 'prison-routine', routine }, expected = resolveCommand(initial, command, true), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    db.sqlite.exec("CREATE TRIGGER fail_legal_ui BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await press('Save Prison Routine');
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/)); expect(screen.getByLabelText('Prison work').props.value).toBe(true); expect(screen.getByLabelText('Prison study').props.value).toBe(true); expect(screen.getByRole('button', { name: /Socialise in the Yard.*Selected/ })).toBeDisabled(); expect(world()).toEqual(initial); expect(db.rows()).toEqual(initialRows);
    db.sqlite.exec('DROP TRIGGER fail_legal_ui'); const release = db.pauseNextSave(); await press('Save Prison Routine'); expect(screen.getByRole('button', { name: 'Save Prison Routine', busy: true })).toBeDisabled(); expect(screen.getByLabelText('Prison study')).toBeDisabled(); await press('Save Prison Routine');
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false)); expect(world()).toEqual(expected); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    expect(world().accounts).toEqual(initial.accounts); expect(world().random).toEqual(initial.random); expect(activeSentence(world())?.servedMonths).toBe(activeSentence(initial)?.servedMonths); expect(activeSentence(world())?.studyMonths).toBe(activeSentence(initial)?.studyMonths);
    const savedRows = db.rows(); view.unmount(); await db.cold(); view = render(frame(<PrisonActivities />)); expect(world()).toEqual(expected); expect(db.rows()).toEqual(savedRows); await press('Continue'); expect(world()).toEqual(ack(expected)); expect(world().ledger).toEqual(initial.ledger);
    const doneRows = db.rows(); await press('Save Prison Routine. This is your current routine'); expect(db.rows()).toEqual(doneRows); db.original(); view.unmount();
  } finally { jest.restoreAllMocks(); db.close(); }
});

test('case identity navigation discards an old review; an ordinary revision retains a separate prison routine draft', async () => {
  let db = await setup(openCase()); mockCaseId = world().cases[0].id;
  try {
    const savedRows = db.rows(), originalId = mockCaseId, view = render(frame(<CaseDetail />)); await press(/Private Counsel\./);
    mockCaseId = 'missing'; view.rerender(frame(<CaseDetail />)); expect(screen.queryByRole('button', { name: 'Choose Counsel' })).toBeNull(); expect(screen.getByText('This case could not be found.')).toBeOnTheScreen(); mockCaseId = originalId; view.rerender(frame(<CaseDetail />)); expect(screen.queryByRole('button', { name: 'Choose Counsel' })).toBeNull(); expect(db.rows()).toEqual(savedRows); view.unmount();
  } finally { db.close(); }
  db = await setup(prison());
  try {
    const view = render(frame(<PrisonActivities />)); fireEvent(screen.getByLabelText('Prison exercise'), 'valueChange', true); const person = prisonContacts(world())[0]; expect(person).toBeDefined();
    await act(async () => { expect(await mockStore.getState().dispatch({ type: 'prison-interact', personId: person.id, action: 'befriend' })).toBe(true); }); await press('Continue'); expect(screen.getByLabelText('Prison exercise').props.value).toBe(true); expect(screen.getByRole('button', { name: 'Save Prison Routine' })).toBeEnabled(); expect(activeSentence(world())?.routine.exercise).toBe(false); db.original(); view.unmount();
  } finally { db.close(); }
});

test('a black-market reviewed alias stays exact on failure while its input is locked during retry', async () => {
  const initial = decodeWorld(JSON.stringify(graduate)), db = await setup(initial);
  try {
    const view = render(frame(<BlackMarket />)); fireEvent.changeText(screen.getByLabelText('Alias for false identity document'), '  Retained Alias  '); await press(/False Identity Document\./);
    db.sqlite.exec("CREATE TRIGGER fail_legal_ui BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await confirm('Buy Item'); expect(screen.getAllByRole('alert')).toHaveLength(1); expect(screen.getByLabelText('Alias for false identity document')).toHaveDisplayValue('  Retained Alias  '); expect(screen.getByText('Retained Alias')).toBeOnTheScreen(); expect(world()).toEqual(initial);
    db.sqlite.exec('DROP TRIGGER fail_legal_ui'); const release = db.pauseNextSave(); await confirm('Buy Item'); expect(screen.getByLabelText('Alias for false identity document')).toBeDisabled(); await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false));
    const expected = resolveCommand(initial, { type: 'black-market', kind: 'false-id', alias: 'Retained Alias' }, true); expect(world()).toEqual(expected); expect(world().contraband.at(-1)?.alias).toBe('Retained Alias'); expect(screen.queryByRole('button', { name: 'Buy Item' })).toBeNull(); db.original(); view.unmount();
  } finally { db.close(); }
});


test('actual life selection clears the prior legal review and alias instead of reviving them on return', async () => {
  const initial = decodeWorld(JSON.stringify(graduate)), db = await setup(initial);
  try {
    const view = render(frame(<BlackMarket />)); fireEvent.changeText(screen.getByLabelText('Alias for false identity document'), 'Previous life draft'); await press(/False Identity Document\./); expect(screen.getByRole('button', { name: 'Buy Item' })).toBeOnTheScreen();
    await act(async () => { expect(await mockStore.getState().startLife(randomCreation(44), 44)).toBe(true); });
    expect(world().id).toBe('life_legal_second'); expect(screen.getByLabelText('Alias for false identity document')).toHaveDisplayValue(''); expect(screen.queryByRole('button', { name: 'Buy Item' })).toBeNull();
    await act(async () => { expect(await mockStore.getState().selectLife(initial.id)).toBe(true); });
    expect(world()).toEqual(initial); expect(screen.getByLabelText('Alias for false identity document')).toHaveDisplayValue(''); expect(screen.queryByRole('button', { name: 'Buy Item' })).toBeNull(); db.original(); view.unmount();
  } finally { db.close(); }
});
