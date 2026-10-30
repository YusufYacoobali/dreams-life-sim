import React from 'react';
import { Modal } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGameStore } from '../../src/state/gameStore';
import { randomCreation } from '../../src/game/createLife';
import { encodeWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { accountFor } from '../../src/game/systems/common';
import { royalMembership } from '../../src/game/systems/royaltySchemas';
import { royalAllowanceQuote, royalDutyReason } from '../../src/game/systems/royalty';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import { decodeSave } from '../../src/persistence/archive';
import * as checkpoints from '../../src/persistence/checkpoints';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import archive from '../fixtures/v17-royal-archive.json';

let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Royalty from '../../app/(game)/royalty';

const world = () => mockStore.getState().world!;
const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><Royalty /><PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp, role: 'button' | 'radio' = 'button') => { await act(async () => { fireEvent.press(screen.getByRole(role, { name })); }); };
const modal = () => within(screen.UNSAFE_getByType(Modal));
const currentPublic = /^Balanced Public Duties\..*This is your current public duty focus$/;
const currentPrivate = /^Lead a Private Life\..*You already lead a private royal life$/;
const acknowledge = (input: World) => resolveCommand(input, { type: 'acknowledge', resultId: input.pending!.id }, true);

async function setup(prior = false) {
  // This is the original recorded Japanese birth-to-adulthood journey and its
  // actual pre-duty checkpoint. No funds/age/health/outcome setup is added here.
  const save = decodeSave(JSON.stringify(archive));
  const directory = mkdtempSync(join(tmpdir(), 'dreams-royal-review-')), path = join(directory, 'dreams.db'); let sqlite!: DatabaseSync;
  const connect = (): SqlDatabase => {
    sqlite = new DatabaseSync(path); sqlite.exec('PRAGMA foreign_keys=ON'); const connection = sqlite;
    const session: SqlSession = { run: async (sql, values = []) => { connection.prepare(sql).run(...values); }, get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null, all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[] };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => { connection.exec('BEGIN IMMEDIATE'); try { const result = await action(session); connection.exec('COMMIT'); return result; } catch (error) { connection.exec('ROLLBACK'); throw error; } } };
  };
  const repository = new SaveRepository(connect()); await repository.initialise();
  // Main cases retain the complete original archive; the separate earlier-state
  // case starts at its genuine private-adult historical checkpoint.
  if (prior) await repository.create(checkpoints.unpackCheckpoint(save.snapshots[0].payload, true));
  else {
    await repository.importWithSummary(JSON.stringify(archive), false);
    expect(sqlite.prepare('SELECT payload FROM snapshots WHERE life_id=? ORDER BY snapshot_id').all(save.world.id).map(row => row.payload)).toEqual(archive.snapshots.map(row => row.payload));
  }
  let nextYield: Promise<void> | undefined;
  const pauseNextSave = () => { let release!: () => void; nextYield = new Promise<void>(resolve => { release = resolve; }); return release; };
  const bootstrap = async (repo: SaveRepository) => { mockStore = createGameStore({ premiumAccess: feature => feature === 'god_mode',  repository: async () => repo, date: () => save.world.date, id: () => 'life_unused', yieldToUI: async () => { const pause = nextYield; nextYield = undefined; if (pause) await pause; } }); expect(await mockStore.getState().bootstrap()).toBe(true); };
  await bootstrap(repository);
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  return { get sqlite() { return sqlite; }, rows, pauseNextSave, cold: async () => { sqlite.close(); await bootstrap(new SaveRepository(connect())); }, close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); } };
}

test.each(['private', 'community'] as const)('genuine public duties to %s keeps a failed review, retries once and resumes its exact result cold', async change => {
  const context = await setup();
  try {
    const initial = world(), before = encodeWorld(initial), beforeRows = context.rows(), membership = royalMembership(initial)!;
    expect(Object.keys(beforeRows)).toHaveLength(8); expect(membership.member.mode).toBe('public'); expect(royalDutyReason(initial)).toBeUndefined();
    expect(initial.ledger.filter(row => row.personId === initial.activePersonId && row.category === 'royal-allowance').reduce((sum, row) => sum + row.cashDelta, 0n)).toBe(2400000n);
    const command: GameCommand = { type: 'royal-duties', mode: change === 'private' ? 'private' : 'public', focus: change === 'private' ? membership.member.focus : 'community', quotedAnnualPay: royalAllowanceQuote(initial, membership.house).annual };
    const expected = resolveCommand(initial, command, true), launch = change === 'private' ? /^Lead a Private Life\./ : /^Community Work\./, confirm = change === 'private' ? 'Choose Private Life' : 'Set Public Duties', title = change === 'private' ? 'Choose a private royal life?' : 'Take up these public duties?';
    const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), dispatch = jest.spyOn(mockStore.getState(), 'dispatch'); let view = render(frame());
    expect(screen.getByRole('radio', { name: currentPublic })).toBeChecked(); expect(screen.getByRole('radio', { name: currentPublic })).toBeDisabled(); await press(currentPublic, 'radio'); expect(screen.queryByText(title)).toBeNull(); expect(dispatch).not.toHaveBeenCalled();
    await press(launch, 'radio'); await press('Never mind'); expect(encodeWorld(world())).toBe(before); expect(context.rows()).toEqual(beforeRows);
    await press(launch, 'radio'); context.sqlite.exec("CREATE TRIGGER fail_royal_review BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press(confirm); await waitFor(() => expect(modal().getByRole('alert')).toHaveTextContent(/couldn't be saved/)); expect(screen.getAllByText(/couldn't be saved/)).toHaveLength(1); expect(modal().getByText(title)).toBeOnTheScreen(); expect(modal().getByRole('button', { name: confirm })).toBeEnabled(); expect(encodeWorld(world())).toBe(before); expect(context.rows()).toEqual(beforeRows);
    context.sqlite.exec('DROP TRIGGER fail_royal_review'); await press(confirm); expect(world()).toEqual(expected); expect(screen.queryByText(title)).toBeNull(); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    const savedRows = context.rows(); expect(savedRows.snapshots).toEqual(beforeRows.snapshots); expect(savedRows.snapshot_metadata).toEqual(beforeRows.snapshot_metadata); view.unmount(); await context.cold(); view = render(frame()); expect(world()).toEqual(expected); expect(context.rows()).toEqual(savedRows); expect(screen.getByText(expected.pending!.title)).toBeOnTheScreen();
    await press('Continue'); const done = acknowledge(expected); expect(world()).toEqual(done); expect(world().accounts).toEqual(initial.accounts); expect(world().ledger).toEqual(initial.ledger); expect(world().workHistory).toEqual(initial.workHistory); expect(world().people).toEqual(initial.people); expect(world().random).toEqual(initial.random);
    expect(world().royalHouses[0].records).toEqual(initial.royalHouses[0].records); expect(world().royalHouses[0].archives).toEqual(initial.royalHouses[0].archives); expect(world().royalHouses[0].successions).toEqual(initial.royalHouses[0].successions);
    if (change === 'private') { const doneRows = context.rows(), coldDispatch = jest.spyOn(mockStore.getState(), 'dispatch'); expect(screen.getByRole('radio', { name: currentPrivate })).toBeChecked(); expect(screen.getByRole('radio', { name: currentPrivate })).toBeDisabled(); await press(currentPrivate, 'radio'); expect(coldDispatch).not.toHaveBeenCalled(); expect(world()).toEqual(done); expect(context.rows()).toEqual(doneRows); }
    if (change === 'community') expect(screen.getByRole('radio', { name: /^Community Work\./ })).toBeChecked();
    const doneRows = context.rows(); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: expected.pending!.id })).toBe(false); }); expect(world()).toEqual(done); expect(context.rows()).toEqual(doneRows); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});

test('a held royal withdrawal retains its command through duplicate taps and Back, then preserves prior receipts and stops next-year allowances', async () => {
  const context = await setup();
  try {
    const initial = world(), beforeRows = context.rows(), membership = royalMembership(initial)!, command: GameCommand = { type: 'royal-duties', mode: 'private', focus: membership.member.focus, quotedAnnualPay: royalAllowanceQuote(initial, membership.house).annual }, expected = resolveCommand(initial, command, true);
    let view = render(frame()); await press(/^Lead a Private Life\./, 'radio'); const release = context.pauseNextSave(); await press('Choose Private Life'); expect(mockStore.getState().busy).toBe(true);
    expect(modal().getByRole('button', { name: 'Choose Private Life' })).toHaveProp('accessibilityState', { disabled: true, busy: true }); expect(screen.getByRole('radio', { name: /^Community Work\./ })).toBeDisabled();
    await press(/^Community Work\./, 'radio'); await press('Choose Private Life'); await press('Never mind'); await act(async () => { screen.UNSAFE_getByType(Modal).props.onRequestClose(); }); expect(modal().getByText('Choose a private royal life?')).toBeOnTheScreen(); expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows);
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false)); expect(world()).toEqual(expected); await press('Continue');
    const privateStart = world(), paidRows = privateStart.ledger.filter(row => row.personId === privateStart.activePersonId && row.category === 'royal-allowance'), cash = accountFor(privateStart).cash;
    expect(cash).toBe(accountFor(initial).cash); expect(royalMembership(privateStart)!.member.mode).toBe('private');
    // Advance one actual year through visible eligible choices, without editing
    // dates, health, money, RNG or annual outcomes to force a favourable result.
    view.unmount(); const send = async (action: GameCommand) => { await act(async () => { expect(await mockStore.getState().dispatch(action)).toBe(true); }); };
    await send({ type: 'advance' }); let guard = 0;
    while ((world().pending || world().annual) && !world().people[world().activePersonId].died && guard++ < 160) {
      const pending = world().pending;
      if (!pending) await send({ type: 'resume' });
      else if (pending.kind === 'result') await send({ type: 'acknowledge', resultId: pending.id });
      else { const choice = pending.choices.find(item => !choiceUnavailable(world(), item)); if (!choice) throw new Error('No available actual annual choice'); await send({ type: 'choose', eventId: pending.id, choiceId: choice.id }); }
    }
    expect(guard).toBeLessThan(160); expect(world().people[world().activePersonId].died).toBeNull(); expect(world().date.year).toBe(privateStart.date.year + 1); expect(world().annual).toBeNull();
    expect(world().ledger.filter(row => row.personId === privateStart.activePersonId && row.category === 'royal-allowance')).toEqual(paidRows); expect(royalMembership(world())!.member.status).toBe('active'); expect(royalMembership(world())!.member.mode).toBe('private');
    const later = world().royalHouses[0].records.filter(row => row.personId === privateStart.activePersonId && row.year * 12 + row.month > privateStart.date.year * 12 + privateStart.date.month); expect(later).toHaveLength(12); expect(later.every(row => !row.attended && row.allowance === 0n)).toBe(true);
    const final = world(), finalRows = context.rows(); await context.cold(); view = render(frame()); expect(world()).toEqual(final); expect(context.rows()).toEqual(finalRows); expect(screen.getByRole('radio', { name: currentPrivate })).toBeChecked(); expect(screen.getByRole('radio', { name: currentPrivate })).toBeDisabled(); view.unmount();
  } finally { context.close(); }
});

test('the actual earlier private adult checkpoint has a disabled current mode and can review public duties without paying or saving', async () => {
  const context = await setup(true);
  try {
    const initial = world(), beforeRows = context.rows(), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), dispatch = jest.spyOn(mockStore.getState(), 'dispatch'), view = render(frame());
    expect(royalMembership(initial)!.member.mode).toBe('private'); expect(screen.getByRole('radio', { name: currentPrivate })).toBeChecked(); expect(screen.getByRole('radio', { name: currentPrivate })).toBeDisabled(); await press(currentPrivate, 'radio'); await press(/^Community Work\./, 'radio'); expect(modal().getByText('Take up these public duties?')).toBeOnTheScreen(); await press('Never mind');
    expect(dispatch).not.toHaveBeenCalled(); expect(unpack).not.toHaveBeenCalled(); expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});

test('a normally created royal newborn cannot launch adult duties or renunciation, and an actual direct refusal writes nothing', async () => {
  const context = await setup();
  try {
    await act(async () => { expect(await mockStore.getState().startLife({ ...randomCreation(42), country: 'JP', city: 'Tokyo', background: 'royal' }, 42)).toBe(true); expect(await mockStore.getState().acknowledgeBirth()).toBe(true); });
    const initial = world(), beforeRows = context.rows(), dispatch = jest.spyOn(mockStore.getState(), 'dispatch'), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), view = render(frame());
    expect(royalDutyReason(initial)).toMatch(/eighteen/); expect(screen.getByRole('radio', { name: /^Community Work\..*eighteen$/ })).toBeDisabled(); expect(screen.getByRole('button', { name: 'Review Renunciation' })).toBeDisabled(); await press(/^Community Work\./, 'radio'); await press('Review Renunciation'); expect(dispatch).not.toHaveBeenCalled();
    await act(async () => { expect(await mockStore.getState().dispatch({ type: 'royal-duties', mode: 'public', focus: 'community', quotedAnnualPay: royalAllowanceQuote(initial, royalMembership(initial)!.house).annual })).toBe(false); });
    expect(mockStore.getState().error).toMatch(/eighteen/); expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows); expect(unpack).not.toHaveBeenCalled(); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});
