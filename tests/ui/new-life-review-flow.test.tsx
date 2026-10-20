import React from 'react';
import { Modal, Switch } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGameStore } from '../../src/state/gameStore';
import { useCreationDraft } from '../../src/state/creationDraft';
import { createLife, randomCreation } from '../../src/game/createLife';
import { encodeWorld } from '../../src/game/model';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { avatarPresets } from '../../src/ui/CreationElements';
import { ThemeProvider } from '../../src/ui/theme';

let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), replace: jest.fn(), push: jest.fn(), setParams: jest.fn() },
  useLocalSearchParams: () => ({ seed: '42', mode: 'custom' }), useFocusEffect: jest.fn(), Redirect: () => null,
}));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector), freshSeed: () => 43 }));
import { router } from 'expo-router';
import NewLife from '../../app/new-life';
import Appearance from '../../app/appearance';
import Birth from '../../app/birth';

const date = { year: 2026, month: 10, day: 20 }, newId = 'life_review_newborn';
const frame = (children: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{children}</ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const choose = async (name: string) => { await act(async () => { fireEvent.press(screen.getByRole('radio', { name })); }); };
const world = () => mockStore.getState().world!;
const modal = () => within(screen.UNSAFE_getByType(Modal));

async function setup(existing = true) {
  const directory = mkdtempSync(join(tmpdir(), 'dreams-new-life-review-')), file = join(directory, 'dreams.db');
  let sqlite: DatabaseSync;
  function connect(): SqlDatabase {
    sqlite = new DatabaseSync(file); sqlite.exec('PRAGMA foreign_keys=ON'); const connection = sqlite;
    const session: SqlSession = {
      run: async (sql, values = []) => { connection.prepare(sql).run(...values); },
      get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null,
      all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[],
    };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => {
      connection.exec('BEGIN IMMEDIATE');
      try { const result = await action(session); connection.exec('COMMIT'); return result; }
      catch (error) { connection.exec('ROLLBACK'); throw error; }
    } };
  }
  const repository = new SaveRepository(connect()); await repository.initialise();
  if (existing) await repository.create(createLife('life_review_previous', 9, randomCreation(9), date));
  let nextYield: Promise<void> | undefined;
  const pauseNextSave = () => { let release!: () => void; nextYield = new Promise<void>(resolve => { release = resolve; }); return release; };
  const bootstrap = async (repo: SaveRepository) => {
    mockStore = createGameStore({ repository: async () => repo, date: () => date, id: () => newId, yieldToUI: async () => { const pause = nextYield; nextYield = undefined; if (pause) await pause; } });
    expect(await mockStore.getState().bootstrap()).toBe(true);
  };
  await bootstrap(repository);
  if (existing) {
    expect(await mockStore.getState().acknowledgeBirth()).toBe(true);
    expect(await mockStore.getState().dispatch({ type: 'advance' })).toBe(true);
    let guard = 0;
    while ((world().pending || world().annual) && guard++ < 50) {
      const current = world(), pending = current.pending;
      expect(await mockStore.getState().dispatch(pending?.kind === 'decision' ? { type: 'choose', eventId: pending.id, choiceId: pending.choices.find(choice => !choiceUnavailable(current, choice))!.id } : pending ? { type: 'acknowledge', resultId: pending.id } : { type: 'resume' })).toBe(true);
    }
    expect(guard).toBeLessThan(50);
  }
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [String(row.name), sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])) as Record<string, Record<string, unknown>[]>;
  return { get sqlite() { return sqlite; }, rows, pauseNextSave,
    cold: async () => { sqlite.close(); await bootstrap(new SaveRepository(connect())); },
    close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); },
  };
}

async function setJapaneseIdentity() {
  fireEvent.changeText(screen.getByLabelText('First name'), 'Alex'); fireEvent.changeText(screen.getByLabelText('Last name'), 'Carter');
  await press(/^Country\./); await choose('Japan'); await press('Choose');
  await press(/^City\./); await choose('Osaka'); await press('Choose');
}

function expectReview() {
  expect(modal().getByText('Start another life?')).toBeOnTheScreen();
  expect(modal().getByText('New life')).toBeOnTheScreen(); expect(modal().getByText('Alex Carter')).toBeOnTheScreen();
  expect(modal().getByText('Birthplace')).toBeOnTheScreen(); expect(modal().getByText('Osaka, Japan')).toBeOnTheScreen();
}

beforeEach(() => { useCreationDraft.setState({ draft: null }); jest.clearAllMocks(); });
afterEach(() => { jest.restoreAllMocks(); });

test('reviewed new-life creation retains terms and error through rollback, retries once and cold-resumes without changing the previous life', async () => {
  const context = await setup();
  try {
    const previous = encodeWorld(world()), beforeRows = context.rows(); expect(beforeRows.snapshots.length).toBeGreaterThan(0);
    let view = render(frame(<NewLife />)); await setJapaneseIdentity(); const draft = structuredClone(useCreationDraft.getState().draft!);
    const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    await press('Start My Life'); expectReview(); await press('Never mind');
    expect(context.rows()).toEqual(beforeRows); expect(encodeWorld(world())).toBe(previous); expect(useCreationDraft.getState().draft).toEqual(draft);
    await press('Start My Life'); expectReview();
    // Fail after the new lives row is inserted, requiring a complete transaction rollback.
    context.sqlite.exec("CREATE TRIGGER fail_review_creation BEFORE INSERT ON backups WHEN NEW.life_id='life_review_newborn' BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    const release = context.pauseNextSave(); await press('Start a New Life'); expect(mockStore.getState().busy).toBe(true);
    expect(modal().getByRole('button', { name: 'Start a New Life' })).toBeDisabled(); expect(modal().getByRole('button', { name: 'Never mind' })).toBeDisabled();
    await press('Start a New Life'); await act(async () => { screen.UNSAFE_getByType(Modal).props.onRequestClose(); });
    expectReview(); expect(context.rows()).toEqual(beforeRows); expect(encodeWorld(world())).toBe(previous);
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false));
    expectReview(); const alert = modal().getByRole('alert'); expect(alert).toHaveTextContent(/new life couldn't be saved/); expect(alert).toHaveProp('accessibilityLiveRegion', 'polite');
    expect(screen.getAllByRole('alert')).toHaveLength(1); expect(useCreationDraft.getState().draft).toEqual(draft); expect(context.rows()).toEqual(beforeRows); expect(encodeWorld(world())).toBe(previous); expect(router.replace).not.toHaveBeenCalled();
    context.sqlite.exec('DROP TRIGGER fail_review_creation'); await press('Start a New Life');
    const expected = createLife(newId, draft.seed, draft.input, date); expect(world()).toEqual(expected); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    expect(screen.queryByText('Start another life?')).toBeNull(); expect(router.replace).toHaveBeenCalledTimes(1); expect(router.replace).toHaveBeenLastCalledWith('/birth');
    const savedRows = context.rows(); expect(savedRows.lives).toHaveLength(2);
    for (const [table, rows] of Object.entries(beforeRows)) for (const row of rows) if (table !== 'preferences' || row.key !== 'active_life') expect(savedRows[table]).toContainEqual(row);
    view.unmount(); await context.cold(); view = render(frame(<Birth />)); expect(world()).toEqual(expected); expect(context.rows()).toEqual(savedRows); expect(screen.getByText('Welcome to the World!')).toBeOnTheScreen();
    await press('Begin Life!'); expect(world().revision).toBe(1); expect(world().birthAcknowledged).toBe(true); expect(world().people).toEqual(expected.people); expect(world().random).toEqual(expected.random); expect(world().ledger).toEqual(expected.ledger);
    const acknowledged = world(), doneRows = context.rows(); await act(async () => { expect(await mockStore.getState().acknowledgeBirth()).toBe(true); });
    expect(world()).toEqual(acknowledged); expect(context.rows()).toEqual(doneRows); expect(doneRows.lives).toHaveLength(2); view.unmount();
  } finally { context.close(); }
});

test('reselecting Japan retains Osaka and the creation draft across cancelled pickers and appearance navigation into the actual saved birth', async () => {
  const context = await setup(false);
  try {
    const beforeRows = context.rows(), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); let view = render(frame(<NewLife />)); await setJapaneseIdentity();
    const selected = structuredClone(useCreationDraft.getState().draft!); await press(/^Country\./); await choose('Japan'); await press('Choose');
    expect(useCreationDraft.getState().draft).toEqual(selected); expect(screen.getByRole('button', { name: 'City. Osaka' })).toBeOnTheScreen();
    await press(/^Country\./); await choose('Canada'); await press('Never mind'); await press(/^City\./); await choose('Tokyo'); await press('Never mind');
    expect(useCreationDraft.getState().draft).toEqual(selected); expect(context.rows()).toEqual(beforeRows); expect(mockStore.getState().world).toBeNull();
    await press('Choose Appearance'); view.rerender(frame(<Appearance />)); await choose('Avatar 7'); await press('Continue'); view.rerender(frame(<NewLife />));
    expect(screen.getByLabelText('First name')).toHaveProp('value', 'Alex'); expect(screen.getByLabelText('Last name')).toHaveProp('value', 'Carter');
    expect(useCreationDraft.getState().draft!.input).toMatchObject({ country: 'JP', city: 'Osaka', appearance: avatarPresets[6] });
    const edited = structuredClone(useCreationDraft.getState().draft!); await press(/^Country\./); await choose('Japan'); await press('Choose'); expect(useCreationDraft.getState().draft).toEqual(edited);
    expect(context.rows()).toEqual(beforeRows); await press('Start My Life'); const expected = createLife(newId, edited.seed, edited.input, date); expect(world()).toEqual(expected); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    const savedRows = context.rows(); view.unmount(); await context.cold(); view = render(frame(<Birth />)); expect(world()).toEqual(expected); expect(context.rows()).toEqual(savedRows); expect(screen.getByText(/in Osaka, Japan/)).toBeOnTheScreen(); view.unmount();
  } finally { context.close(); }
});

test('advanced creation controls expose disabled state during a held save and cannot change the identity actually committed', async () => {
  const context = await setup(false);
  try {
    const view = render(frame(<NewLife />)); await setJapaneseIdentity(); await press(/^More Options/); await press('✓ Men');
    await act(async () => { fireEvent(screen.getByRole('switch', { name: 'Would like children' }), 'valueChange', false); }); await press('Neither');
    const draft = structuredClone(useCreationDraft.getState().draft!), beforeRows = context.rows(), release = context.pauseNextSave(); await press('Start My Life'); expect(mockStore.getState().busy).toBe(true);
    for (const name of [/^Ordinary Family/, /^Royal Family/, 'Men', '✓ Women', '✓ Non-binary', 'Can carry a pregnancy', 'Can contribute to conception', 'Neither']) {
      const control = screen.getByRole('button', { name }); expect(control).toBeDisabled(); expect(control.props.accessibilityState.disabled).toBe(true); await act(async () => { fireEvent.press(control); });
    }
    const toggle = screen.getByRole('switch', { name: 'Would like children' }); expect(toggle).toBeDisabled(); expect(toggle).toHaveProp('accessibilityState', { disabled: true });
    await act(async () => { screen.UNSAFE_getByType(Switch).props.onValueChange(true); });
    expect(useCreationDraft.getState().draft).toEqual(draft); expect(context.rows()).toEqual(beforeRows); expect(mockStore.getState().world).toBeNull();
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false));
    expect(world()).toEqual(createLife(newId, draft.seed, draft.input, date)); const person = world().people[world().activePersonId];
    expect(person.attractedTo).toEqual(draft.input.attractedTo); expect(person.wantsChildren).toBe(false); expect(person.biology.role).toBe('neither'); expect(context.rows().lives).toHaveLength(1); view.unmount();
  } finally { context.close(); }
});
