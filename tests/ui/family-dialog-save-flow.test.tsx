import React from 'react';
import { Modal } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { createGameStore } from '../../src/state/gameStore';
import { copyWorld, decodeWorld, encodeWorld, fullName, validateWorld, type World } from '../../src/game/model';
import { recordDeath, resolveCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { childrenOf } from '../../src/game/systems/family';
import { otherPerson, partnerRelation } from '../../src/game/systems/relationships';
import { SaveRepository } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { database } from '../support/sqlite';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import marriage from '../fixtures/v5-marriage-result.json';
import birth from '../fixtures/v6-birth-result.json';
import history from '../fixtures/v7-history-archive.json';

jest.setTimeout(30000);
let mockStore: ReturnType<typeof createGameStore>, mockPersonId = '';
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() }, useLocalSearchParams: () => ({ id: mockPersonId }), Redirect: () => null }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Family from '../../app/(game)/family';
import FamilyTree from '../../app/(game)/family-tree';
import Person from '../../app/(game)/person/[id]';
import Legacy from '../../app/legacy';
import Household from '../../app/(game)/household';
import { EventModal } from '../../src/ui/EventModal';

const frame = (child: React.ReactNode, pending = true) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{child}{pending && <PendingEvent />}</ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const confirm = async (name: string) => { await act(async () => { fireEvent.press(within(screen.UNSAFE_getByType(Modal)).getByRole('button', { name })); }); };
const type = (label: string, value: string) => fireEvent.changeText(screen.getByLabelText(label), value);
const world = () => mockStore.getState().world!;
const acknowledge = (current: World) => resolveCommand(current, { type: 'acknowledge', resultId: current.pending!.id }, true);
function finish(initial: World) {
  let current = initial, guard = 0;
  while ((current.pending || current.annual && !current.annual.pausedForPlanning) && guard++ < 150) {
    const command: GameCommand = current.pending?.kind === 'decision' ? { type: 'choose', eventId: current.pending.id, choiceId: current.pending.choices.find(choice => !choiceUnavailable(current, choice))!.id } : current.pending ? { type: 'acknowledge', resultId: current.pending.id } : { type: 'resume' };
    current = resolveCommand(current, command, true);
  }
  expect(guard).toBeLessThan(150); return current;
}
const family = () => finish(decodeWorld(JSON.stringify(birth)));
const couple = () => finish(decodeWorld(JSON.stringify(marriage)));
function deceased(initial = decodeWorld(JSON.stringify(birth)), personId = initial.activePersonId) {
  const current = copyWorld(initial); recordDeath(current, personId, 'Explicit UI mortality scenario'); return validateWorld(current);
}

async function setup(initial: World) {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver);
  await repository.initialise(); await repository.import(JSON.stringify(history));
  const oldLives = sqlite.prepare('SELECT * FROM lives ORDER BY id').all(), oldBackups = sqlite.prepare('SELECT * FROM backups ORDER BY life_id').all(), oldMoments = sqlite.prepare('SELECT * FROM snapshots ORDER BY 1,2').all();
  await repository.create(initial);
  let nextYield: Promise<void> | undefined;
  const pauseNextSave = () => { let release!: () => void; nextYield = new Promise<void>(resolve => { release = resolve; }); return release; };
  const cold = async (repo = new SaveRepository(driver)) => {
    mockStore = createGameStore({ repository: async () => repo, date: () => initial.date, id: () => 'unused', yieldToUI: async () => { const pause = nextYield; nextYield = undefined; if (pause) await pause; } }); expect(await mockStore.getState().bootstrap()).toBe(true);
  };
  await cold(repository);
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  const original = () => {
    for (const row of oldLives) expect(sqlite.prepare('SELECT * FROM lives WHERE id=?').get(row.id!)).toEqual(row);
    for (const row of oldBackups) expect(sqlite.prepare('SELECT * FROM backups WHERE life_id=?').get(row.life_id!)).toEqual(row);
    expect(sqlite.prepare('SELECT * FROM snapshots ORDER BY 1,2').all()).toEqual(oldMoments);
    for (const point of history.snapshots) expect(sqlite.prepare('SELECT payload FROM snapshots WHERE snapshot_id=?').get(point.summary.id)?.payload).toBe(point.payload);
  };
  const publishDeath = async (personId: string) => {
    const before = world(), next = deceased(before, personId); next.revision = before.revision + 1;
    await repository.commit(next, before.revision, 'explicit-mortality:' + personId);
    expect(await mockStore.getState().bootstrap()).toBe(true);
  };
  return { sqlite, rows, cold, original, pauseNextSave, publishDeath };
}

test('the actual married household keeps a failed move-out review, blocks obsolete confirmations and reloads one committed move', async () => {
  const { sqlite, rows, cold, original, pauseNextSave } = await setup(couple());
  try {
    const initial = world(), beforeRows = rows(), predicted = resolveCommand(initial, { type: 'move-out' }, true);
    let view = render(frame(<Household />));
    await press('Move Out');
    const confirmation = () => screen.UNSAFE_getAllByType(EventModal).find(item => item.props.event?.kind === 'confirmation')!;
    const first = confirmation().props, reviewed = first.event;
    sqlite.exec("CREATE TRIGGER fail_household_move BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await confirm('Move Out'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/));
    expect(confirmation().props.event).toBe(reviewed); expect(world()).toEqual(initial); expect(rows()).toEqual(beforeRows);
    expect(screen.getAllByText(/couldn't be saved/)).toHaveLength(1);
    sqlite.exec('DROP TRIGGER fail_household_move');
    await press('Never mind'); await act(async () => { await first.onChoose('confirm'); });
    expect(world()).toEqual(initial); expect(rows()).toEqual(beforeRows);
    await press('Move Out'); const current = confirmation().props;
    await act(async () => { first.onCancel(); await first.onChoose('confirm'); });
    expect(confirmation().props.event).toBe(current.event); expect(rows()).toEqual(beforeRows);
    const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), release = pauseNextSave();
    await confirm('Move Out'); expect(mockStore.getState().busy).toBe(true);
    expect(within(screen.UNSAFE_getByType(Modal)).getByRole('button', { name: 'Move Out', busy: true })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Never mind' })).toBeDisabled(); expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
    await act(async () => { current.onCancel(); await current.onChoose('confirm'); screen.UNSAFE_getByType(Modal).props.onRequestClose(); });
    expect(confirmation().props.event).toBe(current.event); expect(rows()).toEqual(beforeRows);
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false));
    expect(world()).toEqual(predicted); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    const savedRows = rows(); view.unmount(); await cold(); view = render(frame(<Household />));
    expect(world()).toEqual(predicted); expect(rows()).toEqual(savedRows); await press('Continue');
    const done = world(), doneRows = rows(); expect(done).toEqual(acknowledge(predicted));
    await act(async () => { await current.onChoose('confirm'); });
    expect(world()).toEqual(done); expect(rows()).toEqual(doneRows); expect(screen.getByRole('button', { name: 'Move Out' })).toBeDisabled();
    original(); view.unmount();
  } finally { jest.restoreAllMocks(); sqlite.close(); }
});

test.each(['adopt', 'try-child'] as const)('%s retains the reviewed family plan after rollback, retries warm, and cold-resumes one actual outcome', async action => {
  const { sqlite, rows, cold, original, pauseNextSave } = await setup(action === 'try-child' ? family() : couple());
  try {
    const initial = world(), beforeRows = rows(), command: GameCommand = action === 'adopt' ? { type: 'adopt', age: 6 } : { type: 'try-child' }, predicted = resolveCommand(initial, command, true);
    let view = render(frame(<Family />));
    const launch = action === 'adopt' ? 'Review Adoption' : 'Try for a Child', submit = action === 'adopt' ? 'Adopt a Child' : 'Try for a Child';
    if (action === 'adopt') {
      expect(screen.getByRole('radio', { name: 'Infant' })).toBeChecked();
      await act(async () => { fireEvent.press(screen.getByRole('radio', { name: 'Age 6' })); });
      expect(screen.getByRole('radio', { name: 'Age 6' })).toBeChecked(); expect(screen.getByRole('radio', { name: 'Infant' })).not.toBeChecked();
    }
    await press(launch); if (action === 'adopt') expect(screen.getByText('6 years')).toBeOnTheScreen(); await press('Never mind'); expect(rows()).toEqual(beforeRows); expect(world()).toEqual(initial);
    if (action === 'adopt') expect(screen.getByRole('radio', { name: 'Age 6' })).toBeChecked();
    await press(launch); const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    sqlite.exec("CREATE TRIGGER fail_family BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await confirm(submit); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/));
    expect(within(screen.UNSAFE_getByType(Modal)).getByRole('button', { name: submit })).toBeEnabled(); if (action === 'adopt') expect(screen.getByText('6 years')).toBeOnTheScreen(); expect(world()).toEqual(initial); expect(rows()).toEqual(beforeRows);
    sqlite.exec('DROP TRIGGER fail_family'); const release = pauseNextSave(); await confirm(submit); expect(mockStore.getState().busy).toBe(true);
    if (action === 'adopt') {
      for (const name of ['Age 6', 'Age 2']) expect(screen.getByRole('radio', { name })).toBeDisabled();
      expect(screen.getByRole('radio', { name: 'Age 6' })).toBeChecked(); expect(screen.getByRole('button', { name: 'Review Adoption' })).toBeDisabled();
    }
    expect(screen.getByRole('button', { name: 'Never mind' })).toBeDisabled(); await act(async () => { screen.UNSAFE_getByType(Modal).props.onRequestClose(); }); expect(rows()).toEqual(beforeRows);
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false)); expect(world()).toEqual(predicted); expect(screen.queryByRole('button', { name: 'Never mind' })).toBeNull(); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    const savedRows = rows(); view.unmount(); await cold(); view = render(frame(<Family />)); expect(world()).toEqual(predicted); expect(rows()).toEqual(savedRows); await press('Continue'); expect(world()).toEqual(acknowledge(predicted)); expect(world().people).toEqual(predicted.people); expect(world().accounts).toEqual(predicted.accounts); expect(world().pregnancies).toEqual(predicted.pregnancies);
    const done = world(), doneRows = rows(); await act(async () => { expect(await mockStore.getState().dispatch(command)).toBe(false); }); expect(world()).toEqual(done); expect(rows()).toEqual(doneRows); original(); view.unmount();
  } finally { jest.restoreAllMocks(); sqlite.close(); }
});

test('blank, current trimmed child name and profile navigation save nothing and reset the previous person’s drafts/review/error', async () => {
  const initial = finish(resolveCommand(family(), { type: 'adopt', age: 2 }, true)), kids = childrenOf(initial), { sqlite, rows, original } = await setup(initial);
  try {
    const beforeRows = rows(), before = encodeWorld(world()), dispatch = jest.spyOn(mockStore.getState(), 'dispatch'), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); mockPersonId = kids[0].id;
    const view = render(frame(<Person />)); expect(screen.getByRole('button', { name: 'Save Child’s Name' })).toBeDisabled();
    type('Child first name', '  ' + kids[0].firstName + '  '); expect(screen.getByRole('button', { name: 'Save Child’s Name. This is their current name' })).toBeDisabled(); await press('Save Child’s Name. This is their current name');
    type('Child first name', 'A different draft'); await press('Give Money'); type('Gift amount', '25'); await press('Review Gift'); expect(screen.getByRole('button', { name: 'Give Gift' })).toBeOnTheScreen();
    mockPersonId = kids[1].id; view.rerender(frame(<Person />)); expect(screen.queryByRole('button', { name: 'Give Gift' })).toBeNull(); expect(screen.queryByLabelText('Gift amount')).toBeNull(); expect(screen.getByLabelText('Child first name')).toHaveDisplayValue('');
    await press('Give Money'); expect(screen.getByLabelText('Gift amount')).toHaveDisplayValue(''); await press('Review Gift'); expect(screen.getByRole('alert')).toHaveTextContent('Enter a positive gift amount.');
    mockPersonId = kids[0].id; view.rerender(frame(<Person />)); expect(screen.queryByRole('alert')).toBeNull(); expect(screen.getByLabelText('Child first name')).toHaveDisplayValue('');
    expect(dispatch).not.toHaveBeenCalled(); expect(unpack).not.toHaveBeenCalled(); expect(rows()).toEqual(beforeRows); expect(encodeWorld(world())).toBe(before); original(); view.unmount();
  } finally { jest.restoreAllMocks(); sqlite.close(); }
});

test('a changed child name keeps its exact draft/alert after SQLite rollback, saves once with only the pressed control busy, and cold-resumes the same identity', async () => {
  const { sqlite, rows, cold, original, pauseNextSave } = await setup(family());
  try {
    const initial = world(), child = childrenOf(initial)[0], command: GameCommand = { type: 'name-child', childId: child.id, firstName: '  Newname  ' }, predicted = resolveCommand(initial, command, true), beforeRows = rows(); mockPersonId = child.id;
    let view = render(frame(<Person />)); type('Child first name', command.firstName); const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    sqlite.exec("CREATE TRIGGER fail_family BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await press('Save Child’s Name'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/)); expect(screen.getByLabelText('Child first name')).toHaveDisplayValue(command.firstName); expect(world()).toEqual(initial); expect(rows()).toEqual(beforeRows);
    sqlite.exec('DROP TRIGGER fail_family'); const release = pauseNextSave(); await press('Save Child’s Name'); expect(screen.getByRole('button', { name: 'Save Child’s Name', busy: true })).toBeDisabled(); expect(screen.getAllByRole('button', { busy: true })).toHaveLength(1); expect(screen.getByLabelText('Child first name')).toBeDisabled(); expect(screen.getByRole('button', { name: 'Give Money' })).toBeDisabled(); await press('Save Child’s Name'); expect(rows()).toEqual(beforeRows);
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false)); expect(world()).toEqual(predicted); expect(screen.getByLabelText('Child first name')).toHaveDisplayValue(''); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    expect(world().accounts).toEqual(initial.accounts); expect(world().relationships).toEqual(initial.relationships); const savedRows = rows(); view.unmount(); await cold(); view = render(frame(<Person />)); expect(world()).toEqual(predicted); expect(rows()).toEqual(savedRows); await press('Continue'); expect(world()).toEqual(acknowledge(predicted)); expect(world().people).toEqual(predicted.people);
    const doneRows = rows(); type('Child first name', ' Newname '); await press('Save Child’s Name. This is their current name'); expect(rows()).toEqual(doneRows); original(); view.unmount();
  } finally { jest.restoreAllMocks(); sqlite.close(); }
});

test('a reviewed gift preserves the person and amount after failure/cancel, retries warm and cold-resumes one actual transfer', async () => {
  const { sqlite, rows, cold, original, pauseNextSave } = await setup(family());
  try {
    const initial = world(), child = childrenOf(initial)[0], command: GameCommand = { type: 'gift-money', personId: child.id, amount: 2500n }, predicted = resolveCommand(initial, command, true), beforeRows = rows(); mockPersonId = child.id;
    let view = render(frame(<Person />)); await press('Give Money'); type('Gift amount', '25'); await press('Review Gift'); await press('Never mind'); expect(screen.getByLabelText('Gift amount')).toHaveDisplayValue('25'); expect(rows()).toEqual(beforeRows); await press('Review Gift'); const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    sqlite.exec("CREATE TRIGGER fail_family BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await press('Give Gift'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/)); expect(screen.getByText('Give $25.00?')).toBeOnTheScreen(); expect(screen.getByLabelText('Gift amount')).toHaveDisplayValue('25'); expect(world()).toEqual(initial); expect(rows()).toEqual(beforeRows);
    sqlite.exec('DROP TRIGGER fail_family'); const release = pauseNextSave(); await press('Give Gift'); expect(screen.getByRole('button', { name: 'Review Gift' })).toBeDisabled(); expect(screen.getByLabelText('Gift amount')).toBeDisabled(); expect(screen.getByRole('button', { name: 'Never mind' })).toBeDisabled(); await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false)); expect(world()).toEqual(predicted); expect(screen.queryByRole('button', { name: 'Give Gift' })).toBeNull(); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    const savedRows = rows(); view.unmount(); await cold(); view = render(frame(<Person />)); expect(world()).toEqual(predicted); expect(rows()).toEqual(savedRows); await press('Continue'); expect(world()).toEqual(acknowledge(predicted)); expect(world().accounts).toEqual(predicted.accounts); expect(world().ledger).toEqual(predicted.ledger);
    const done = world(), doneRows = rows(); await act(async () => { expect(await mockStore.getState().dispatch(command)).toBe(false); }); expect(world()).toEqual(done); expect(rows()).toEqual(doneRows); original(); view.unmount();
  } finally { jest.restoreAllMocks(); sqlite.close(); }
});

test('heir confirmation keeps the real child after rollback and navigates only after one durable transfer with exact cold inheritance and remaining year', async () => {
  const { sqlite, rows, cold, original, pauseNextSave } = await setup(deceased());
  try {
    const initial = world(), child = childrenOf(initial)[0], command: GameCommand = { type: 'continue-child', personId: child.id }, predicted = resolveCommand(initial, command, true), beforeRows = rows();
    let view = render(frame(<Legacy />, false)); expect(screen.getByText('Estate settlement')).toBeOnTheScreen(); await press('Continue as ' + child.firstName); await press('Never mind'); expect(rows()).toEqual(beforeRows); await press('Continue as ' + child.firstName); const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    sqlite.exec("CREATE TRIGGER fail_family BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await press('Continue Their Life'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/)); expect(screen.getByText('Continue as ' + child.firstName + '?')).toBeOnTheScreen(); expect(router.replace).not.toHaveBeenCalled(); expect(world()).toEqual(initial); expect(rows()).toEqual(beforeRows);
    sqlite.exec('DROP TRIGGER fail_family'); const release = pauseNextSave(); await press('Continue Their Life'); expect(screen.getByRole('button', { name: 'Continue as ' + child.firstName })).toBeDisabled(); expect(screen.getByRole('button', { name: 'Never mind' })).toBeDisabled(); expect(router.replace).not.toHaveBeenCalled(); expect(rows()).toEqual(beforeRows); await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false)); expect(world()).toEqual(predicted); expect(router.replace).toHaveBeenCalledTimes(1); expect(router.replace).toHaveBeenCalledWith('/life'); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    expect(world().people[child.id]).toEqual(child); expect(world().estates).toEqual(initial.estates); expect(world().accounts).toEqual(initial.accounts); expect(world().annual).toMatchObject({ monthsProcessed: 9, pausedForPlanning: true }); const savedRows = rows(); view.unmount(); await cold(); view = render(frame(<Family />)); expect(world()).toEqual(predicted); expect(rows()).toEqual(savedRows); await press('Continue'); expect(world()).toEqual(acknowledge(predicted)); expect(world().accounts).toEqual(predicted.accounts); expect(world().estates).toEqual(initial.estates);
    const done = world(), doneRows = rows(); await act(async () => { expect(await mockStore.getState().dispatch(command)).toBe(false); }); expect(world()).toEqual(done); expect(rows()).toEqual(doneRows); original(); view.unmount();
  } finally { jest.restoreAllMocks(); sqlite.close(); }
});

test.each(['person', 'heir'] as const)('%s removes a stale selected child after an actual recorded death without a new action', async route => {
  const { sqlite, rows, original, publishDeath } = await setup(route === 'heir' ? deceased() : family());
  try {
    const child = childrenOf(world())[0]; mockPersonId = child.id; const view = render(frame(route === 'heir' ? <Legacy /> : <Person />, false));
    if (route === 'heir') await press('Continue as ' + child.firstName); else { await press('Give Money'); type('Gift amount', '25'); await press('Review Gift'); }
    await act(async () => { await publishDeath(child.id); }); const afterDeath = rows(), before = encodeWorld(world()), dispatch = jest.spyOn(mockStore.getState(), 'dispatch');
    expect(screen.queryByRole('button', { name: route === 'heir' ? 'Continue Their Life' : 'Give Gift' })).toBeNull();
    if (route === 'heir') expect(screen.getByText('No living child is available.')).toBeOnTheScreen(); else { expect(screen.queryByLabelText('Child first name')).toBeNull(); await press('View Life & Estate Summary'); expect(router.push).toHaveBeenLastCalledWith({ pathname: '/life-summary', params: { id: child.id } }); }
    expect(dispatch).not.toHaveBeenCalled(); expect(encodeWorld(world())).toBe(before); expect(rows()).toEqual(afterDeath); original(); view.unmount();
  } finally { jest.restoreAllMocks(); sqlite.close(); }
});

test.each([false, true])('Family Tree includes the actual current partner and retains original multiple-parent/child identities, children=%s', async hasChildren => {
  const initial = hasChildren ? family() : couple(), partner = otherPerson(initial, partnerRelation(initial)!), { sqlite, rows, original } = await setup(initial);
  try {
    const beforeRows = rows(), before = encodeWorld(world()), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), view = render(frame(<FamilyTree />));
    expect(screen.getByRole('button', { name: new RegExp('^' + fullName(partner) + '\\. Spouse') })).toBeOnTheScreen(); await press(new RegExp('^' + fullName(partner) + '\\.')); expect(router.push).toHaveBeenLastCalledWith({ pathname: '/person/[id]', params: { id: partner.id } });
    for (const child of childrenOf(initial)) { expect(initial.relationships.filter(edge => edge.roles.includes('parent') && edge.to === child.id)).toHaveLength(2); expect(screen.getByRole('button', { name: new RegExp('^' + fullName(child) + '\\.') })).toBeOnTheScreen(); }
    for (const edge of initial.relationships.filter(item => item.roles.includes('parent') && item.to === initial.activePersonId)) expect(screen.getByRole('button', { name: new RegExp('^' + fullName(initial.people[edge.from]) + '\\.') })).toBeOnTheScreen();
    expect(unpack).not.toHaveBeenCalled(); expect(encodeWorld(world())).toBe(before); expect(rows()).toEqual(beforeRows); original(); view.unmount();
  } finally { jest.restoreAllMocks(); sqlite.close(); }
});
