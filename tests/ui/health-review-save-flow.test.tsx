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
import { decodeSave } from '../../src/persistence/archive';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { randomCreation } from '../../src/game/createLife';
import { accountFor } from '../../src/game/systems/common';
import { consultationCost, treatmentCost } from '../../src/game/systems/health';
import { rules } from '../../src/game/rules';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import { EventModal } from '../../src/ui/EventModal';
import graduate from '../fixtures/v3-employed-graduate.json';
import medical from '../fixtures/v8-medical-archive.json';
import archive from '../fixtures/v30-native-workplace-story-archive.json';

let mockStore: ReturnType<typeof createGameStore>, mockConditionId = '';
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() }, useLocalSearchParams: () => ({ id: mockConditionId }) }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Health from '../../app/(game)/health';
import Doctor from '../../app/(game)/doctor';
import ConditionDetail from '../../app/(game)/condition/[id]';

const frame = (child: React.ReactNode, pending = true) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{child}{pending && <PendingEvent />}</ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const confirm = async (name: string) => { await act(async () => { fireEvent.press(within(screen.UNSAFE_getByType(Modal)).getByRole('button', { name })); }); };
const world = () => mockStore.getState().world!;
const ack = (value: World) => resolveCommand(value, { type: 'acknowledge', resultId: value.pending!.id }, true);

function treatedMedical() {
  let current = decodeSave(JSON.stringify(medical)).world;
  current = resolveCommand(current, { type: 'choose', eventId: current.pending!.id, choiceId: 'care' }, true);
  let guard = 0;
  while ((current.pending || current.annual) && !current.people[current.activePersonId].died && guard++ < 150) {
    const command: GameCommand = current.pending?.kind === 'decision'
      ? { type: 'choose', eventId: current.pending.id, choiceId: current.pending.choices.find(choice => !choiceUnavailable(current, choice))!.id }
      : current.pending ? { type: 'acknowledge', resultId: current.pending.id } : { type: 'resume' };
    current = resolveCommand(current, command, true);
  }
  expect(guard).toBeLessThan(150); expect(current.people[current.activePersonId].died).toBeNull();
  expect(current.people[current.activePersonId].health.conditions[0]).toMatchObject({ type: 'asthma', diagnosed: expect.any(Object), treatment: expect.any(Object) });
  return current;
}

async function setup(initial: World) {
  const folder = mkdtempSync(join(tmpdir(), 'dreams-health-ui-')), file = join(folder, 'dreams.db');
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
    mockStore = createGameStore({ repository: async () => repo, date: () => initial.date, id: () => 'life_health_second', yieldToUI: async () => { const pause = nextYield; nextYield = undefined; if (pause) await pause; } }); expect(await mockStore.getState().bootstrap()).toBe(true);
  };
  await boot(repository);
  return {
    get sqlite() { return sqlite; }, rows, pauseNextSave,
    cold: async () => { sqlite.close(); await boot(new SaveRepository(connect())); },
    original: () => {
      const current = rows();
      for (const table of ['lives', 'backups']) for (const oldRow of old[table]) expect(current[table].find(row => (row.id ?? row.life_id) === (oldRow.id ?? oldRow.life_id))).toEqual(oldRow);
      for (const table of ['snapshots', 'snapshot_metadata', 'branches', 'restore_receipts']) expect(current[table]).toEqual(old[table]);
      for (const oldRow of old.receipts) expect(sqlite.prepare('SELECT * FROM receipts WHERE life_id=? AND command_id=?').get(oldRow.life_id, oldRow.command_id)).toEqual(oldRow);
      for (const point of archive.snapshots) expect(sqlite.prepare('SELECT payload FROM snapshots WHERE snapshot_id=?').get(point.summary.id)?.payload).toBe(point.payload);
    },
    close: () => { sqlite.close(); rmSync(folder, { recursive: true, force: true }); },
  };
}

const vaccineCases = [['routine', 'Routine protection · 10 years'], ['seasonal', 'Seasonal flu protection · 12 months']] as const;
test.each(vaccineCases)('the exact %s vaccination review survives on-disk rollback, busy duplicates/cancel and closed-connection cold resume', async (vaccine, label) => {
  const initial = decodeWorld(JSON.stringify(graduate)), db = await setup(initial);
  try {
    const command: GameCommand = { type: 'vaccinate', vaccine }, expected = resolveCommand(initial, command, true), before = db.rows();
    const originalPayload = db.sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(initial.id)?.payload;
    const dispatch = jest.spyOn(mockStore.getState(), 'dispatch'); let view = render(frame(<Health />));
    await press(/^Vaccinations\./); fireEvent.press(screen.getByRole('radio', { name: label })); await confirm('Review'); await confirm('Never mind'); expect(db.rows()).toEqual(before); expect(dispatch).not.toHaveBeenCalled();
    await press(/^Vaccinations\./); fireEvent.press(screen.getByRole('radio', { name: label })); await confirm('Review'); expect(screen.getByText(label)).toBeOnTheScreen();
    const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); db.sqlite.exec("CREATE TRIGGER fail_health_ui BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await confirm('Receive Vaccination');
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/)); expect(screen.getAllByRole('alert')).toHaveLength(1); expect(screen.getByRole('alert').props.accessibilityLiveRegion).toBe('polite');
    expect(screen.getByText(label)).toBeOnTheScreen(); expect(screen.getByRole('button', { name: 'Receive Vaccination' })).toBeEnabled(); expect(world()).toEqual(initial); expect(db.rows()).toEqual(before);
    db.sqlite.exec('DROP TRIGGER fail_health_ui'); const release = db.pauseNextSave(), submit = screen.UNSAFE_getAllByType(EventModal).find(item => item.props.event?.kind === 'confirmation')!.props.onChoose;
    await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Receive Vaccination' })); submit('confirm'); }); expect(dispatch).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button', { name: 'Receive Vaccination', busy: true })).toBeDisabled(); expect(screen.getByRole('button', { name: 'Never mind' })).toBeDisabled();
    await confirm('Never mind'); await act(async () => { screen.UNSAFE_getByType(Modal).props.onRequestClose(); }); expect(world()).toEqual(initial); expect(db.rows()).toEqual(before);
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false)); expect(world()).toEqual(expected); expect(screen.queryByRole('button', { name: 'Receive Vaccination' })).toBeNull(); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    expect(accountFor(world()).cash).toBe(accountFor(initial).cash - rules.US.doctorVisit / 2n); expect(world().people[initial.activePersonId].health.vaccinations.map(item => item.id)).toEqual([vaccine]);
    expect(db.sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(initial.id)?.payload).toBe(originalPayload);
    const savedRows = db.rows(); view.unmount(); await db.cold(); view = render(frame(<Health />)); expect(world()).toEqual(expected); expect(db.rows()).toEqual(savedRows);
    await press('Continue'); expect(world()).toEqual(ack(expected));
    const done = db.rows(), canonical = encodeWorld(world()); await press(/^Vaccinations\./);
    expect(screen.getByRole('radio', { name: label + '. This protection is still current' })).toBeDisabled(); fireEvent.press(screen.getByRole('radio', { name: label + '. This protection is still current' })); expect(screen.getByRole('button', { name: 'Review' })).toBeDisabled(); await confirm('Never mind');
    expect(db.rows()).toEqual(done); expect(encodeWorld(world())).toBe(canonical); db.original(); view.unmount();
  } finally { jest.restoreAllMocks(); db.close(); }
});

test('the actual doctor assessment keeps its exact reviewed service, payer and fee after failure, retries warm once and cold-resumes its fixed clinical result', async () => {
  const initial = decodeWorld(JSON.stringify(graduate)), db = await setup(initial);
  try {
    const expected = resolveCommand(initial, { type: 'consult', service: 'tests' }, true), before = db.rows(); let view = render(frame(<Doctor />));
    await press(/^Request Tests\./);
    const cancelled = screen.UNSAFE_getAllByType(EventModal).find(item => item.props.event?.kind === 'confirmation')!.props;
    await confirm('Never mind'); await act(async () => { await cancelled.onChoose('confirm'); });
    expect(accountFor(world()).cash).toBe(accountFor(initial).cash); expect(db.rows()).toEqual(before); expect(world()).toEqual(initial);
    await press(/^Request Tests\./); await act(async () => { cancelled.onCancel(); });
    expect(screen.getByText('Request Tests?')).toBeOnTheScreen();
    const unmounted = screen.UNSAFE_getAllByType(EventModal).find(item => item.props.event?.kind === 'confirmation')!.props.onChoose;
    view.unmount(); await act(async () => { await unmounted('confirm'); });
    expect(accountFor(world()).cash).toBe(accountFor(initial).cash); expect(db.rows()).toEqual(before);
    view = render(frame(<Doctor />)); await press(/^Request Tests\./); const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); db.sqlite.exec("CREATE TRIGGER fail_health_ui BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await confirm('Confirm Visit');
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/)); expect(screen.getAllByRole('alert')).toHaveLength(1); expect(screen.getByText('Request Tests?')).toBeOnTheScreen(); expect(db.rows()).toEqual(before); expect(world()).toEqual(initial);
    db.sqlite.exec('DROP TRIGGER fail_health_ui'); await confirm('Confirm Visit'); await waitFor(() => expect(screen.queryByText('Request Tests?')).toBeNull()); expect(world()).toEqual(expected); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    expect(accountFor(world()).cash).toBe(accountFor(initial).cash - consultationCost(initial, 'tests')); expect(world().people[world().activePersonId].health.records.at(-1)?.kind).toBe('tests');
    const saved = db.rows(); view.unmount(); await db.cold(); view = render(frame(<Doctor />)); expect(world()).toEqual(expected); expect(db.rows()).toEqual(saved); await press('Continue'); expect(world()).toEqual(ack(expected));
    expect(screen.getByRole('button', { name: /^Request Tests\./ })).toBeDisabled(); const done = db.rows(); await press(/^Request Tests\./); expect(db.rows()).toEqual(done); db.original(); view.unmount();
  } finally { jest.restoreAllMocks(); db.close(); }
});

test.each(['treat', 'stop-treatment'] as const)('%s preserves the actual diagnosed condition and paid response through rollback/retry/cold without instant recovery', async type => {
  let initial = treatedMedical(); const id = initial.people[initial.activePersonId].health.conditions[0].id;
  if (type === 'treat') initial = ack(resolveCommand(initial, { type: 'stop-treatment', conditionId: id }, true));
  const db = await setup(initial); mockConditionId = id;
  try {
    const command: GameCommand = { type, conditionId: id }, expected = resolveCommand(initial, command, true), before = db.rows();
    const title = type === 'treat' ? 'Begin this care programme?' : 'Stop this treatment?', launch = type === 'treat' ? 'Review Treatment' : 'Review Stopping Treatment', action = type === 'treat' ? 'Begin Treatment' : 'Stop Treatment';
    let view = render(frame(<ConditionDetail />)); await press(launch); await confirm('Never mind'); expect(db.rows()).toEqual(before); await press(launch);
    const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); db.sqlite.exec("CREATE TRIGGER fail_health_ui BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await confirm(action);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/)); expect(screen.getAllByRole('alert')).toHaveLength(1); expect(screen.getByText(title)).toBeOnTheScreen(); expect(db.rows()).toEqual(before); expect(world()).toEqual(initial);
    db.sqlite.exec('DROP TRIGGER fail_health_ui'); await confirm(action); await waitFor(() => expect(screen.queryByText(title)).toBeNull()); expect(world()).toEqual(expected); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    expect(world().people[initial.activePersonId].health.conditions[0].severity).toBe(initial.people[initial.activePersonId].health.conditions[0].severity);
    expect(accountFor(world()).cash).toBe(accountFor(initial).cash - (type === 'treat' ? treatmentCost(initial, initial.people[initial.activePersonId].health.conditions[0]) : 0n));
    const saved = db.rows(); view.unmount(); await db.cold(); view = render(frame(<ConditionDetail />)); expect(world()).toEqual(expected); expect(db.rows()).toEqual(saved); await press('Continue'); expect(world()).toEqual(ack(expected)); db.original(); view.unmount();
  } finally { jest.restoreAllMocks(); db.close(); }
});

test('unrelated saved revisions retain the exact vaccination review, while a real life switch discards its identity', async () => {
  const initial = decodeWorld(JSON.stringify(graduate)), db = await setup(initial);
  try {
    const view = render(frame(<Health />, false)); await press(/^Vaccinations\./); fireEvent.press(screen.getByRole('radio', { name: vaccineCases[1][1] })); await confirm('Review');
    await act(async () => { expect(await mockStore.getState().dispatch({ type: 'meditate' })).toBe(true); }); expect(screen.getByText(vaccineCases[1][1])).toBeOnTheScreen();
    await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: world().pending!.id })).toBe(true); }); expect(screen.getByText(vaccineCases[1][1])).toBeOnTheScreen();
    await act(async () => { expect(await mockStore.getState().startLife(randomCreation(909), 909)).toBe(true); }); expect(screen.queryByRole('button', { name: 'Receive Vaccination' })).toBeNull();
    await act(async () => { expect(await mockStore.getState().selectLife(initial.id)).toBe(true); }); expect(screen.queryByRole('button', { name: 'Receive Vaccination' })).toBeNull();
    expect(world().people[initial.activePersonId].health.vaccinations).toEqual([]); db.original(); view.unmount();
  } finally { jest.restoreAllMocks(); db.close(); }
});

test('changing the actual condition route discards the previous review instead of retargeting treatment', async () => {
  const initial = treatedMedical(), id = initial.people[initial.activePersonId].health.conditions[0].id, db = await setup(initial); mockConditionId = id;
  try {
    const before = db.rows(), view = render(frame(<ConditionDetail />)); await press('Review Stopping Treatment');
    const stale = screen.UNSAFE_getAllByType(EventModal).find(item => item.props.event?.kind === 'confirmation')!.props.onChoose;
    mockConditionId = 'missing-condition'; view.rerender(frame(<ConditionDetail />)); expect(screen.getByText('This condition is unavailable.')).toBeOnTheScreen(); expect(screen.queryByRole('button', { name: 'Stop Treatment' })).toBeNull();
    await act(async () => { await stale('confirm'); }); expect(db.rows()).toEqual(before);
    mockConditionId = id; view.rerender(frame(<ConditionDetail />)); await act(async () => { await stale('confirm'); }); expect(screen.queryByRole('button', { name: 'Stop Treatment' })).toBeNull(); expect(db.rows()).toEqual(before); expect(world()).toEqual(initial); db.original(); view.unmount();
  } finally { jest.restoreAllMocks(); db.close(); }
});
