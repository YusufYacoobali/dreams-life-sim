import { displayText } from '../../src/ui/displayNumbers';
import React from 'react';
import { Modal } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGameStore } from '../../src/state/gameStore';
import { decodeWorld, encodeWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { accountFor } from '../../src/game/systems/common';
import { tripQuote, unusedTripRefund } from '../../src/game/systems/travel';
import { moveQuote, relocationFee } from '../../src/game/systems/relocation';
import { formatMoney } from '../../src/game/money';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import { decodeSave } from '../../src/persistence/archive';
import * as checkpoints from '../../src/persistence/checkpoints';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import graduate from '../fixtures/v3-employed-graduate.json';
import familyTrip from '../fixtures/v19-family-trip-archive.json';
import moveArchive from '../fixtures/v20-relocation-archive.json';

let mockStore: ReturnType<typeof createGameStore>;
let mockParams: { id: string; duration?: string; tripId?: string; route?: string } = { id: 'paris' };
jest.mock('expo-router', () => ({ useLocalSearchParams: () => mockParams, router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Destination from '../../app/(game)/destination/[id]';
import Emigrate from '../../app/(game)/emigrate';

type Kind = 'booking' | 'return' | 'application-work' | 'application-study' | 'departure';
const world = () => mockStore.getState().world!;
const frame = (kind: Kind) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{kind === 'booking' || kind === 'return' ? <Destination /> : <Emigrate />}<PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const modal = () => within(screen.UNSAFE_getByType(Modal));
const acknowledge = (initial: World) => resolveCommand(initial, { type: 'acknowledge', resultId: initial.pending!.id }, true);
function prepare(kind: Kind) {
  if (kind === 'return') return checkpoints.unpackCheckpoint(decodeSave(JSON.stringify(familyTrip)).snapshots[0].payload, true);
  if (kind === 'departure') return checkpoints.unpackCheckpoint(decodeSave(JSON.stringify(moveArchive)).snapshots[0].payload, true);
  const initial = decodeWorld(JSON.stringify(graduate)), account = accountFor(initial); account.cash += 100000000n; account.openingCash += 100000000n;
  // Configured funding only. No success roll, qualification or calendar override.
  return kind === 'booking' ? acknowledge(resolveCommand(initial, { type: 'quit-job' }, true)) : initial;
}
async function setup(initial: World, kind: Kind) {
  mockParams = { id: 'paris', route: kind === 'application-study' ? 'study' : kind === 'application-work' ? 'work' : undefined };
  const directory = mkdtempSync(join(tmpdir(), 'dreams-travel-review-')), path = join(directory, 'dreams.db'); let sqlite: DatabaseSync;
  const connect = (): SqlDatabase => {
    sqlite = new DatabaseSync(path); sqlite.exec('PRAGMA foreign_keys=ON'); const connection = sqlite;
    const session: SqlSession = { run: async (sql, values = []) => { connection.prepare(sql).run(...values); }, get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null, all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[] };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => { connection.exec('BEGIN IMMEDIATE'); try { const value = await action(session); connection.exec('COMMIT'); return value; } catch (error) { connection.exec('ROLLBACK'); throw error; } } };
  };
  const repository = new SaveRepository(connect()); await repository.initialise(); await repository.create(initial);
  let nextYield: Promise<void> | undefined;
  const pauseNextSave = () => { let release!: () => void; nextYield = new Promise<void>(resolve => { release = resolve; }); return release; };
  const bootstrap = async (repo: SaveRepository) => { mockStore = createGameStore({ repository: async () => repo, date: () => initial.date, id: () => 'life_unused', yieldToUI: async () => { const pause = nextYield; nextYield = undefined; if (pause) await pause; } }); expect(await mockStore.getState().bootstrap()).toBe(true); };
  await bootstrap(repository);
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  return { get sqlite() { return sqlite; }, rows, pauseNextSave, cold: async () => { sqlite.close(); await bootstrap(new SaveRepository(connect())); }, close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); } };
}

type Review = { command: GameCommand; title: string; confirm: string; amounts: string[] };
async function openReview(kind: Kind): Promise<Review> {
  const current = world();
  if (kind === 'booking') {
    await press(/^3 Months/); await press(/^Try the Local Food/); const quote = tripQuote(current, 'paris', 3); await press('Review Trip');
    return { command: { type: 'book-trip', destinationId: 'paris', duration: 3, companionIds: [], focus: 'food', quotedTotal: quote.total }, title: 'Travel to Paris?', confirm: 'Start Trip', amounts: [formatMoney({ minor: quote.total, currency: quote.currency })] };
  }
  if (kind === 'return') {
    const trip = current.trips[0]; await press('Return Early'); return { command: { type: 'return-trip', tripId: trip.id }, title: 'Return home early?', confirm: 'Return Home', amounts: [formatMoney({ minor: unusedTripRefund(trip), currency: trip.quote.currency })] };
  }
  if (kind === 'departure') {
    await press(/^6-Month Living Reserve/); const offer = current.relocations[0], quote = moveQuote(current, offer, [], 6); await press('Review Move');
    return { command: { type: 'relocate', applicationId: offer.id, companionIds: [], reserveMonths: 6, reviewedQuote: quote }, title: 'Move to Tokyo?', confirm: 'Move Household', amounts: [formatMoney({ minor: quote.transport, currency: quote.currency }), formatMoney({ minor: quote.net, currency: quote.destinationCurrency })] };
  }
  await press(/^Japan\./); await press('Review Application');
  return { command: { type: 'apply-relocation', destinationId: 'tokyo', route: kind === 'application-work' ? 'work' : 'study', roleId: kind === 'application-work' ? 'administrator' : null, program: kind === 'application-study' ? 'university' : null, field: kind === 'application-study' ? 'arts' : null, quotedFee: relocationFee(current) }, title: 'Apply to Tokyo?', confirm: 'Submit Application', amounts: [formatMoney({ minor: relocationFee(current), currency: accountFor(current).currency })] };
}
const expectReview = (review: Review) => { expect(modal().getByText(review.title)).toBeOnTheScreen(); for (const amount of review.amounts) expect(modal().getAllByText(displayText(amount)).length).toBeGreaterThan(0); };

test.each(['booking', 'return', 'application-work', 'application-study', 'departure'] as Kind[])('%s keeps its reviewed terms after rollback, retries warm and cold-resumes the exact result once', async kind => {
  const context = await setup(prepare(kind), kind);
  try {
    const initial = world(), beforeRows = context.rows(), before = encodeWorld(initial), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    let view = render(frame(kind)); let review = await openReview(kind); expectReview(review); await press('Never mind'); expect(screen.queryByText(review.title)).toBeNull(); expect(context.rows()).toEqual(beforeRows); expect(encodeWorld(world())).toBe(before);
    review = await openReview(kind); const expected = resolveCommand(initial, review.command, true);
    context.sqlite.exec("CREATE TRIGGER fail_travel_review BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press(review.confirm); await waitFor(() => expect(modal().getByRole('alert')).toHaveTextContent(/couldn't be saved/)); expectReview(review); expect(encodeWorld(world())).toBe(before); expect(context.rows()).toEqual(beforeRows);
    context.sqlite.exec('DROP TRIGGER fail_travel_review'); await press(review.confirm); expect(world()).toEqual(expected); expect(screen.queryByText(review.title)).toBeNull(); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    const savedRows = context.rows(); view.unmount(); await context.cold(); view = render(frame(kind)); expect(world()).toEqual(expected); expect(context.rows()).toEqual(savedRows); expect(screen.getByText(expected.pending!.title)).toBeOnTheScreen();
    await press('Continue'); const done = acknowledge(expected); expect(world()).toEqual(done); expect(world().trips).toEqual(expected.trips); expect(world().relocations).toEqual(expected.relocations); expect(world().people).toEqual(expected.people); expect(world().accounts).toEqual(expected.accounts); expect(world().ledger).toEqual(expected.ledger); expect(world().random).toEqual(expected.random);
    const doneRows = context.rows(); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: expected.pending!.id })).toBe(false); }); expect(world()).toEqual(done); expect(context.rows()).toEqual(doneRows); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});

test('the actual current trip focus is disabled; failed real focus changes keep the original trip and retry without decode', async () => {
  const context = await setup(prepare('return'), 'return');
  try {
    const initial = world(), beforeRows = context.rows(), trip = initial.trips[0], unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); let view = render(frame('return'));
    const current = screen.getByRole('button', { name: 'See the Sights. Selected. This is your current trip focus' }); expect(current).toBeDisabled(); await press('See the Sights. Selected. This is your current trip focus'); expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows);
    const command: GameCommand = { type: 'trip-focus', tripId: trip.id, focus: 'rest' }, expected = resolveCommand(initial, command, true);
    context.sqlite.exec("CREATE TRIGGER fail_trip_focus BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await press('Take It Easy'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/)); expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows);
    context.sqlite.exec('DROP TRIGGER fail_trip_focus'); await press('Take It Easy'); expect(world()).toEqual(expected); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore(); const savedRows = context.rows(); view.unmount(); await context.cold(); view = render(frame('return')); expect(world()).toEqual(expected); expect(context.rows()).toEqual(savedRows);
    await press('Continue'); expect(world()).toEqual(acknowledge(expected)); expect(screen.getByRole('button', { name: 'Take It Easy. Selected. This is your current trip focus' })).toBeDisabled(); expect(world().trips[0].paid).toBe(trip.paid); expect(world().trips[0].periods).toEqual(trip.periods); expect(world().accounts).toEqual(initial.accounts); expect(world().random).toEqual(initial.random); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});

test.each(['booking', 'departure'] as Kind[])('%s pending save freezes its actual plan and ignores duplicate confirm/cancel/Android Back', async kind => {
  const context = await setup(prepare(kind), kind);
  try {
    const initial = world(), beforeRows = context.rows(), view = render(frame(kind)), review = await openReview(kind), expected = resolveCommand(initial, review.command, true), release = context.pauseNextSave();
    await press(review.confirm); expect(mockStore.getState().busy).toBe(true); expect(modal().getByRole('button', { name: review.confirm })).toHaveProp('accessibilityState', { disabled: true, busy: true });
    const preview = kind === 'booking' ? 'Review Trip' : 'Review Move'; expect(screen.getByRole('button', { name: preview })).toHaveProp('accessibilityState', { disabled: true, busy: false });
    const controls = kind === 'booking' ? [/^3 Months/, /^Try the Local Food/] : [/^6-Month Living Reserve/, 'Plan Another Move']; for (const name of controls) { expect(screen.getByRole('button', { name })).toBeDisabled(); await press(name); }
    for (const checkbox of screen.queryAllByRole('checkbox')) expect(checkbox).toBeDisabled();
    await press(review.confirm); await press('Never mind'); await act(async () => { screen.UNSAFE_getByType(Modal).props.onRequestClose(); }); expectReview(review); expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows);
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false)); expect(world()).toEqual(expected); expect(world().revision).toBe(initial.revision + 1); view.unmount();
  } finally { context.close(); }
});

test('changing destination or work/study entry context clears old local quotes without saving', async () => {
  const context = await setup(prepare('booking'), 'booking');
  try {
    const initial = world(), beforeRows = context.rows(), view = render(frame('booking')); await openReview('booking'); mockParams = { id: 'tokyo' }; view.rerender(frame('booking')); expect(screen.queryByText('Travel to Paris?')).toBeNull(); expect(screen.getByRole('button', { name: '1 Month. Selected' })).toBeOnTheScreen(); expect(screen.getByRole('button', { name: 'See the Sights. Selected' })).toBeOnTheScreen();
    mockParams = { id: 'paris', route: 'work' }; view.rerender(frame('application-work')); await openReview('application-work'); mockParams = { id: 'paris', route: 'study' }; view.rerender(frame('application-study')); expect(screen.queryByText('Apply to Tokyo?')).toBeNull(); expect(screen.getByRole('button', { name: 'Study Abroad. Selected' })).toBeOnTheScreen();
    expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows); view.unmount();
  } finally { context.close(); }
});
