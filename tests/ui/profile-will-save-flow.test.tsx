import React from 'react';
import { Modal } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { router } from 'expo-router';
import { createGameStore } from '../../src/state/gameStore';
import { decodeWorld, encodeWorld, fullName, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { assetCatalog } from '../../src/game/content/assets';
import { assetPrice } from '../../src/game/systems/assets';
import { legalShares } from '../../src/game/systems/estates';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import { decodeSave } from '../../src/persistence/archive';
import * as checkpoints from '../../src/persistence/checkpoints';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import creatorArchive from '../fixtures/v10-creator-archive.json';
import birth from '../fixtures/v6-birth-result.json';
import history from '../fixtures/v7-history-archive.json';

let mockStore: ReturnType<typeof createGameStore>, mockAccountId = '';
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ id: mockAccountId }), router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import SocialProfile from '../../app/(game)/social-profile/[id]';
import Will from '../../app/(game)/will';

type Domain = 'profile' | 'will';
type WillCommand = Extract<GameCommand, { type: 'save-will' }>;
const frame = (domain: Domain) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{domain === 'profile' ? <SocialProfile /> : <Will />}<PendingEvent /></ThemeProvider></SafeAreaProvider>;
const world = () => mockStore.getState().world!;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const change = (label: string, value: string) => fireEvent.changeText(screen.getByLabelText(label), value);
const modal = () => within(screen.UNSAFE_getByType(Modal));
async function choose(name: string) { fireEvent.press(modal().getByRole('radio', { name })); await press('Choose'); }
const ack = (initial: World) => resolveCommand(initial, { type: 'acknowledge', resultId: initial.pending!.id }, true);
function finish(initial: World) {
  let current = initial, guard = 0;
  while ((current.pending || current.annual && !current.annual.pausedForPlanning) && guard++ < 100) {
    const command: GameCommand = current.pending?.kind === 'decision' ? { type: 'choose', eventId: current.pending.id, choiceId: current.pending.choices.find(choice => !choiceUnavailable(current, choice))!.id } : current.pending ? { type: 'acknowledge', resultId: current.pending.id } : { type: 'resume' };
    current = resolveCommand(current, command, true);
  }
  expect(guard).toBeLessThan(100); return current;
}
let creator: World | undefined, family: World | undefined;
const creatorWorld = () => creator ??= checkpoints.unpackCheckpoint(decodeSave(JSON.stringify(creatorArchive)).snapshots[0].payload, true);
function familyWorld(saved = true) {
  if (!family) {
    let current = finish(decodeWorld(JSON.stringify(birth)));
    // Actual purchases from the genuine retained fixture's existing account.
    // No money, people, age, date, stats or random streams are changed in setup.
    for (const id of ['rare-book', 'watch']) {
      const offer = assetCatalog.find(item => item.id === id)!;
      current = ack(resolveCommand(current, { type: 'buy-asset', catalogId: id, financing: 'cash', depositBps: 10000, termMonths: 120, quotedPrice: assetPrice(current, offer) }, true));
    }
    family = current;
  }
  if (!saved) return family;
  const shares = legalShares(family, family.activePersonId), assets = family.assets.filter(item => item.ownerId === family!.activePersonId);
  expect(shares).toHaveLength(2); expect(assets).toHaveLength(2);
  return ack(resolveCommand(family, { type: 'save-will', executorId: 'person_parent1', shares, bequests: assets.map((asset, index) => ({ assetId: asset.id, personId: shares[index].personId })) }, true));
}
async function setup(initial: World) {
  const directory = mkdtempSync(join(tmpdir(), 'dreams-profile-will-')), file = join(directory, 'dreams.db'); let sqlite!: DatabaseSync;
  function connect(): SqlDatabase {
    const connection = sqlite = new DatabaseSync(file); connection.exec('PRAGMA foreign_keys=ON');
    const session: SqlSession = {
      run: async (sql, values = []) => { connection.prepare(sql).run(...values); },
      get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null,
      all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[],
    };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => { connection.exec('BEGIN IMMEDIATE'); try { const result = await action(session); connection.exec('COMMIT'); return result; } catch (error) { connection.exec('ROLLBACK'); throw error; } } };
  }
  const repository = new SaveRepository(connect()); await repository.initialise(); await repository.import(JSON.stringify(history));
  const oldLives = sqlite.prepare('SELECT * FROM lives ORDER BY id').all(), oldBackups = sqlite.prepare('SELECT * FROM backups ORDER BY life_id').all(), oldMoments = sqlite.prepare('SELECT * FROM snapshots ORDER BY 1,2').all();
  await repository.create(initial); mockAccountId = initial.socialAccounts.find(account => account.ownerId === initial.activePersonId)?.id ?? '';
  let nextYield: Promise<void> | undefined;
  const pauseNextSave = () => { let release!: () => void; nextYield = new Promise<void>(resolve => { release = resolve; }); return release; };
  const bootstrap = async (repo: SaveRepository) => {
    mockStore = createGameStore({ repository: async () => repo, date: () => initial.date, id: () => 'unused', yieldToUI: async () => { const pending = nextYield; nextYield = undefined; if (pending) await pending; } });
    expect(await mockStore.getState().bootstrap()).toBe(true);
  };
  await bootstrap(repository);
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [String(row.name), sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  return { get sqlite() { return sqlite; }, rows, pauseNextSave,
    cold: async () => { sqlite.close(); await bootstrap(new SaveRepository(connect())); },
    original: () => {
      for (const row of oldLives) expect(sqlite.prepare('SELECT * FROM lives WHERE id=?').get(row.id!)).toEqual(row);
      for (const row of oldBackups) expect(sqlite.prepare('SELECT * FROM backups WHERE life_id=?').get(row.life_id!)).toEqual(row);
      expect(sqlite.prepare('SELECT * FROM snapshots ORDER BY 1,2').all()).toEqual(oldMoments);
      for (const point of history.snapshots) expect(sqlite.prepare('SELECT payload FROM snapshots WHERE snapshot_id=?').get(point.summary.id)?.payload).toBe(point.payload);
    },
    close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); },
  };
}
afterEach(() => { jest.restoreAllMocks(); jest.clearAllMocks(); });

test('current and trim-equivalent social identity is read only; genuine case or biography changes still enable review', async () => {
  const context = await setup(creatorWorld());
  try {
    const initial = world(), account = initial.socialAccounts.find(item => item.id === mockAccountId)!, beforeRows = context.rows(), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), view = render(frame('profile'));
    await press('Edit Profile'); expect(screen.getByRole('button', { name: 'Review Profile Changes' })).toBeDisabled(); expect(screen.getByText('This is your current profile.')).toBeOnTheScreen();
    await press('Review Profile Changes'); change('Edit social handle', ' ' + account.handle + ' '); change('Edit profile biography', ' ' + account.bio + ' ');
    expect(screen.getByRole('button', { name: 'Review Profile Changes' })).toBeDisabled(); await press('Review Profile Changes'); expect(screen.queryByText('Update this profile?')).toBeNull();
    change('Edit social handle', account.handle === account.handle.toUpperCase() ? account.handle.toLowerCase() : account.handle.toUpperCase()); expect(screen.getByRole('button', { name: 'Review Profile Changes' })).toBeEnabled();
    change('Edit social handle', account.handle); change('Edit profile biography', 'A different biography.'); expect(screen.getByRole('button', { name: 'Review Profile Changes' })).toBeEnabled();
    await press('Review Profile Changes'); await press('Never mind'); expect(screen.getByLabelText('Edit profile biography')).toHaveProp('value', 'A different biography.');
    expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows); expect(Object.keys(beforeRows)).toHaveLength(8); expect(unpack).not.toHaveBeenCalled(); context.original(); view.unmount();
  } finally { context.close(); }
});

test.each(['handle', 'biography'] as const)('a real social %s-only edit retains the raw draft and exact trimmed command through rollback, warm retry, cold result and one ack', async field => {
  const context = await setup(creatorWorld());
  try {
    const initial = world(), account = initial.socialAccounts.find(item => item.id === mockAccountId)!, rawHandle = field === 'handle' ? '  exact_identity  ' : account.handle, rawBio = field === 'biography' ? '  Exact biography survives the save failure.  ' : account.bio;
    const command: GameCommand = { type: 'edit-social', accountId: account.id, handle: rawHandle.trim(), bio: rawBio.trim() }, expected = resolveCommand(initial, command, true), beforeRows = context.rows(), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    let view = render(frame('profile')); await press('Edit Profile'); change('Edit social handle', rawHandle); change('Edit profile biography', rawBio); await press('Review Profile Changes');
    context.sqlite.exec("CREATE TRIGGER fail_profile_will BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await press('Save Profile'); await waitFor(() => expect(modal().getByRole('alert')).toHaveTextContent(/couldn't be saved/));
    expect(screen.getAllByRole('alert')).toHaveLength(1); expect(screen.getByLabelText('Edit social handle')).toHaveProp('value', rawHandle); expect(screen.getByLabelText('Edit profile biography')).toHaveProp('value', rawBio); expect(modal().getByText('Update this profile?')).toBeOnTheScreen(); expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows);
    context.sqlite.exec('DROP TRIGGER fail_profile_will'); const release = context.pauseNextSave(); await press('Save Profile'); expect(mockStore.getState().busy).toBe(true); expect(modal().getByRole('button', { name: 'Save Profile' })).toHaveProp('accessibilityState', { disabled: true, busy: true });
    expect(screen.getByRole('button', { name: 'Save Posting Routine' })).toHaveProp('accessibilityState', { disabled: true, busy: false }); expect(screen.getByLabelText('Edit profile biography')).toHaveProp('editable', false); await press('Save Profile'); await press('Never mind'); await act(async () => { screen.UNSAFE_getByType(Modal).props.onRequestClose(); }); expect(context.rows()).toEqual(beforeRows);
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false)); expect(world()).toEqual(expected); expect(screen.queryByText('Update this profile?')).toBeNull(); expect(screen.queryByLabelText('Edit social handle')).toBeNull(); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    const savedRows = context.rows(); view.unmount(); await context.cold(); view = render(frame('profile')); expect(world()).toEqual(expected); expect(context.rows()).toEqual(savedRows); await press('Continue'); expect(world()).toEqual(ack(expected));
    const done = world(), doneRows = context.rows(); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: expected.pending!.id })).toBe(false); }); expect(world()).toEqual(done); expect(context.rows()).toEqual(doneRows);
    await press('Edit Profile'); expect(screen.getByRole('button', { name: 'Review Profile Changes' })).toBeDisabled(); context.original(); view.unmount();
  } finally { context.close(); }
});

test('saved will percentages and reordered shares/bequests stay local and save nothing', async () => {
  const context = await setup(familyWorld());
  try {
    const initial = world(), saved = initial.wills[0], spouse = saved.shares[0].personId, child = saved.shares[1].personId, book = initial.assets.find(item => item.catalogId === 'rare-book')!, beforeRows = context.rows(), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), view = render(frame('will'));
    expect(screen.getByRole('button', { name: 'Save Will' })).toBeDisabled(); await press('Save Will');
    change('Percentage for ' + fullName(initial.people[spouse]), ' 50.00 '); expect(screen.getByRole('button', { name: 'Save Will' })).toBeDisabled();
    await press('Remove ' + initial.people[spouse].firstName); await press('Add Beneficiary'); await choose(fullName(initial.people[spouse])); change('Percentage for ' + fullName(initial.people[spouse]), '50.0');
    expect(screen.getByRole('button', { name: 'Save Will' })).toBeEnabled(); await press(/^First-Edition Novel\./); await choose(fullName(initial.people[spouse]));
    expect(screen.getByLabelText('Percentage for ' + fullName(initial.people[child]))).toHaveProp('value', '50'); expect(screen.getByRole('button', { name: 'Save Will' })).toBeDisabled(); expect(screen.getByText('This is your current saved will.')).toBeOnTheScreen();
    await press('Save Will'); await press(/^Executor\./); await press('Never mind'); expect(book.ownerId).toBe(initial.activePersonId); expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows); expect(unpack).not.toHaveBeenCalled(); context.original(); view.unmount();
  } finally { context.close(); }
});

type WillEdit = 'executor' | 'allocation' | 'bequest' | 'remove-bequest';
async function editWill(edit: WillEdit, initial: World): Promise<WillCommand> {
  const saved = initial.wills[0], first = saved.shares[0].personId, second = saved.shares[1].personId;
  const command: WillCommand = { type: 'save-will', executorId: saved.executorId, shares: saved.shares, bequests: saved.bequests };
  if (edit === 'executor') { await press(/^Executor\./); await choose(fullName(initial.people.person_parent2)); command.executorId = 'person_parent2'; }
  else if (edit === 'allocation') { change('Percentage for ' + fullName(initial.people[first]), '60.00'); change('Percentage for ' + fullName(initial.people[second]), '40'); command.shares = [{ personId: first, bps: 6000 }, { personId: second, bps: 4000 }]; }
  else { const assetId = saved.bequests[0].assetId; await press(/^First-Edition Novel\./); await choose(edit === 'bequest' ? fullName(initial.people[second]) : 'Sell and distribute with the estate'); command.bequests = saved.bequests.filter(item => item.assetId !== assetId).concat(edit === 'bequest' ? [{ assetId, personId: second }] : []); }
  return command;
}
test.each(['executor', 'allocation', 'bequest', 'remove-bequest'] as const)('a genuine changed will %s survives all-eight-row rollback, held retry, warm cache and real connection cold resume', async edit => {
  const context = await setup(familyWorld());
  try {
    const initial = world(), beforeRows = context.rows(), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); let view = render(frame('will')); const command = await editWill(edit, initial), expected = resolveCommand(initial, command, true);
    expect(screen.getByRole('button', { name: 'Save Will' })).toBeEnabled(); const draft = screen.getAllByLabelText(/Percentage for /).map(input => input.props.value);
    context.sqlite.exec("CREATE TRIGGER fail_profile_will BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await press('Save Will'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/)); expect(screen.getAllByRole('alert')).toHaveLength(1); expect(screen.getAllByLabelText(/Percentage for /).map(input => input.props.value)).toEqual(draft); expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows);
    context.sqlite.exec('DROP TRIGGER fail_profile_will'); const release = context.pauseNextSave(); await press('Save Will'); expect(mockStore.getState().busy).toBe(true); expect(screen.getByRole('button', { name: 'Save Will' })).toHaveProp('accessibilityState', { disabled: true, busy: true }); expect(screen.getByRole('button', { name: 'Revoke Will' })).toHaveProp('accessibilityState', { disabled: true, busy: false });
    expect(screen.getByRole('button', { name: 'Add Beneficiary' })).toBeDisabled(); for (const input of screen.getAllByLabelText(/Percentage for /)) expect(input).toHaveProp('editable', false); await press('Save Will'); await press('Revoke Will'); await press('Add Beneficiary'); await press('Back'); expect(router.back).not.toHaveBeenCalled(); expect(context.rows()).toEqual(beforeRows);
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false)); expect(world()).toEqual(expected); expect(screen.getByRole('button', { name: 'Save Will' })).toBeDisabled(); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore(); const savedRows = context.rows(); view.unmount();
    await context.cold(); view = render(frame('will')); expect(world()).toEqual(expected); expect(context.rows()).toEqual(savedRows); expect(screen.getByRole('button', { name: 'Save Will' })).toBeDisabled(); await press('Continue'); expect(world()).toEqual(ack(expected)); const done = world(), doneRows = context.rows();
    await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: expected.pending!.id })).toBe(false); }); expect(world()).toEqual(done); expect(context.rows()).toEqual(doneRows); expect(world().accounts).toEqual(initial.accounts); expect(world().estates).toEqual(initial.estates); context.original(); view.unmount();
  } finally { context.close(); }
});

test('no saved will still permits the first valid allocation and no-bequest default, while invalid totals stay editable without a write', async () => {
  const context = await setup(familyWorld(false));
  try {
    const initial = world(), shares = legalShares(initial, initial.activePersonId), first = shares[0].personId, beforeRows = context.rows(), view = render(frame('will'));
    expect(initial.wills).toHaveLength(0); expect(screen.getByRole('button', { name: 'Save Will' })).toBeEnabled(); change('Percentage for ' + fullName(initial.people[first]), '49.99'); await press('Save Will'); expect(screen.getByRole('alert')).toHaveTextContent(/Allocate exactly 100%/); expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows);
    change('Percentage for ' + fullName(initial.people[first]), '50.00'); expect(screen.queryByRole('alert')).toBeNull(); const command: WillCommand = { type: 'save-will', executorId: 'person_parent1', shares, bequests: [] }, expected = resolveCommand(initial, command, true);
    const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); await press('Save Will'); expect(world()).toEqual(expected); expect(world().wills[0].bequests).toEqual([]); expect(screen.getByRole('button', { name: 'Save Will' })).toBeDisabled(); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore(); context.original(); view.unmount();
  } finally { context.close(); }
});

test('will draft identity follows the actual selected life; selecting another retained life creates no will or cross-person draft', async () => {
  const context = await setup(familyWorld());
  try {
    const initial = world(), view = render(frame('will')); change('Percentage for ' + fullName(initial.people[initial.wills[0].shares[0].personId]), '25'); expect(screen.getByRole('button', { name: 'Save Will' })).toBeEnabled();
    const otherLife = mockStore.getState().lives.find(life => life.id !== initial.id)!; await act(async () => { expect(await mockStore.getState().selectLife(otherLife.id)).toBe(true); }); const other = world(), rows = context.rows();
    expect(screen.getByRole('button', { name: 'Save Will' })).toBeEnabled(); expect(screen.getAllByLabelText(/Percentage for /).map(input => input.props.value)).not.toContain('25'); expect(world().wills).toEqual(other.wills);
    await act(async () => { expect(await mockStore.getState().selectLife(initial.id)).toBe(true); }); expect(world()).toEqual(initial); expect(screen.getByRole('button', { name: 'Save Will' })).toBeDisabled(); const returnedRows = context.rows(); expect(returnedRows.lives).toEqual(rows.lives); expect(returnedRows.receipts).toEqual(rows.receipts); context.original(); view.unmount();
  } finally { context.close(); }
});
