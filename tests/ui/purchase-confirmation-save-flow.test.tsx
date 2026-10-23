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
import { decodeWorld, encodeWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { assetCatalog } from '../../src/game/content/assets';
import { purchaseQuote } from '../../src/game/systems/assets';
import { accountFor } from '../../src/game/systems/common';
import { formatMoney } from '../../src/game/money';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import graduateFixture from '../fixtures/v3-employed-graduate.json';

let mockStore: ReturnType<typeof createGameStore>;
let mockRouteId = 'studio';
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ id: mockRouteId }), router: { back: jest.fn(), navigate: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Offer from '../../app/(game)/offer/[id]';

const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><Offer /><PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const modal = () => within(screen.UNSAFE_getByType(Modal));
const choose = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('radio', { name })); }); };
const world = () => mockStore.getState().world!;

async function setup() {
  mockRouteId = 'studio';
  const directory = mkdtempSync(join(tmpdir(), 'dreams-purchase-confirmation-')), path = join(directory, 'dreams.db');
  let sqlite: DatabaseSync;
  function connect(): SqlDatabase {
    sqlite = new DatabaseSync(path); sqlite.exec('PRAGMA foreign_keys=ON');
    const connection = sqlite;
    const session: SqlSession = {
      run: async (sql, values = []) => { connection.prepare(sql).run(...values); },
      get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null,
      all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[],
    };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => {
      connection.exec('BEGIN IMMEDIATE');
      try { const value = await action(session); connection.exec('COMMIT'); return value; }
      catch (error) { connection.exec('ROLLBACK'); throw error; }
    } };
  }
  const repository = new SaveRepository(connect()); await repository.initialise();
  const initial = decodeWorld(JSON.stringify(graduateFixture));
  // An explicitly funded test scenario; the immutable fixture remains unchanged.
  const account = accountFor(initial); account.cash += 100000000n; account.openingCash += 100000000n;
  await repository.create(initial);
  let nextYield: Promise<void> | undefined;
  const pauseNextSave = () => { let release!: () => void; nextYield = new Promise<void>(resolve => { release = resolve; }); return release; };
  const bootstrap = async (repo: SaveRepository) => {
    mockStore = createGameStore({ repository: async () => repo, date: () => initial.date, id: () => 'life_unused', yieldToUI: async () => { const pause = nextYield; nextYield = undefined; if (pause) await pause; } });
    expect(await mockStore.getState().bootstrap()).toBe(true);
  };
  await bootstrap(repository);
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  return { get sqlite() { return sqlite; }, repository, rows, pauseNextSave,
    cold: async () => { sqlite.close(); await bootstrap(new SaveRepository(connect())); },
    close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); },
  };
}

async function reviewMortgage() {
  await choose('Mortgage'); await press(/^Deposit\./); await choose('40%'); await press('Choose');
  await press(/^Term\./); await choose('20 years'); await press('Choose'); await press('Review Purchase');
}

function expectReviewedTerms() {
  const quote = purchaseQuote(world(), assetCatalog.find(item => item.id === 'studio')!, 'mortgage', 4000, 240), money = (minor: bigint) => formatMoney({ minor, currency: accountFor(world()).currency });
  expect(modal().getByText('Buy City Studio?')).toBeOnTheScreen();
  for (const [label, value] of [['Price', quote.price], ['Purchase fees', quote.fee], ['Cash paid upfront', quote.cashRequired], ['Mortgage principal', quote.principal], ['Monthly payment', quote.payment]] as const) {
    expect(modal().getByText(label)).toBeOnTheScreen(); expect(modal().getAllByText(displayText(money(value))).length).toBeGreaterThan(0);
  }
  return quote;
}

test('local financing, deposit and term choices close immediately; review and cancellation save and decode nothing', async () => {
  const context = await setup();
  try {
    const before = encodeWorld(world()), beforeRows = context.rows(), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    const view = render(frame()); expect(screen.getByRole('radio', { name: 'Buy Outright', checked: true })).toBeOnTheScreen();
    await choose('Mortgage'); expect(screen.getByRole('radio', { name: 'Mortgage', checked: true })).toBeOnTheScreen(); await press(/^Deposit\./); await choose('40%'); await press('Choose');
    expect(screen.queryByRole('button', { name: 'Choose' })).toBeNull(); expect(screen.getByRole('button', { name: /^Deposit\. 40%/ })).toBeOnTheScreen();
    await press(/^Term\./); await choose('20 years'); await press('Choose'); expect(screen.queryByRole('button', { name: 'Choose' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Term. 20 years' })).toBeOnTheScreen();
    const quote = purchaseQuote(world(), assetCatalog.find(item => item.id === 'studio')!, 'mortgage', 4000, 240), money = (minor: bigint) => formatMoney({ minor, currency: accountFor(world()).currency });
    expect(screen.getByLabelText(displayText('Cash paid upfront: ' + money(quote.cashRequired) + '. Deposit plus purchase fees'))).toBeOnTheScreen();
    expect(screen.getByLabelText(displayText('Purchase fees: ' + money(quote.fee)))).toBeOnTheScreen();
    expect(screen.getByLabelText(displayText('Monthly payment: ' + money(quote.payment)))).toBeOnTheScreen();
    await press('Review Purchase'); expectReviewedTerms(); await press('Never mind');
    expect(screen.queryByText('Buy City Studio?')).toBeNull(); await choose('Buy Outright'); await choose('Mortgage');
    expect(screen.getByRole('button', { name: /^Deposit\. 40%/ })).toBeOnTheScreen(); expect(screen.getByRole('button', { name: 'Term. 20 years' })).toBeOnTheScreen();
    expect(encodeWorld(world())).toBe(before); expect(context.rows()).toEqual(beforeRows); expect(unpack).not.toHaveBeenCalled(); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});

test.each(['offer', 'life'] as const)('changing the actual %s closes the old purchase review and starts with fresh funding choices', async contextChange => {
  const context = await setup();
  try {
    const original = world();
    const other = { ...original, id: 'life_other_purchase' };
    if (contextChange === 'life') {
      // A second copy of the genuine adult scenario deliberately reuses its
      // person/offer IDs: only the actual saved-life identity differs.
      await context.repository.create(other);
      expect(await mockStore.getState().selectLife(original.id)).toBe(true);
    }
    const view = render(frame()); await reviewMortgage(); expectReviewedTerms();
    const beforeRows = context.rows();
    if (contextChange === 'offer') {
      mockRouteId = 'apartment'; view.rerender(frame());
      expect(context.rows()).toEqual(beforeRows); expect(world()).toEqual(original);
      expect(screen.getByText('Two-Bedroom Apartment')).toBeOnTheScreen();
    } else {
      await act(async () => { expect(await mockStore.getState().selectLife(other.id)).toBe(true); });
      expect(world()).toEqual(other);
      expect(await context.repository.load(original.id)).toEqual(original);
    }
    expect(screen.queryByRole('button', { name: 'Confirm Purchase' })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Deposit\./ })).toBeNull();
    const selectedRows = context.rows();
    await choose('Mortgage');
    expect(screen.getByRole('button', { name: /^Deposit\. 20%/ })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Term. 30 years' })).toBeOnTheScreen();
    expect(context.rows()).toEqual(selectedRows); expect(world()).toEqual(contextChange === 'life' ? other : original);
    view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});

test('a failed real mortgage purchase preserves reviewed terms and all rows, retries warm and cold-resumes exactly once', async () => {
  const context = await setup();
  try {
    const initial = world(), before = encodeWorld(initial), beforeRows = context.rows();
    let view = render(frame()); await reviewMortgage(); const quote = expectReviewedTerms();
    const command = { type: 'buy-asset', catalogId: 'studio', financing: 'mortgage', depositBps: 4000, termMonths: 240, quotedPrice: quote.price } as const;
    const expected = resolveCommand(initial, command, true), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    context.sqlite.exec("CREATE TRIGGER fail_purchase_confirmation BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press('Confirm Purchase'); await waitFor(() => expect(modal().getByRole('alert')).toHaveTextContent(/couldn't be saved/));
    expectReviewedTerms(); expect(modal().getByRole('button', { name: 'Confirm Purchase' })).toBeEnabled();
    expect(encodeWorld(world())).toBe(before); expect(context.rows()).toEqual(beforeRows);
    context.sqlite.exec('DROP TRIGGER fail_purchase_confirmation'); await press('Confirm Purchase');
    expect(screen.queryByText('Buy City Studio?')).toBeNull(); expect(screen.getByText('It’s yours')).toBeOnTheScreen();
    expect(world()).toEqual(expected); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    const owned = world().assets.filter(asset => asset.ownerId === initial.activePersonId); expect(owned).toHaveLength(1);
    expect(world().liabilities.find(debt => debt.id === owned[0].mortgageId)).toMatchObject({ principal: quote.principal, remainingMonths: 240, monthlyPayment: quote.payment });
    expect(accountFor(world()).cash).toBe(accountFor(initial).cash - quote.cashRequired);
    expect(world().ledger.filter(row => row.category === 'purchase')).toHaveLength(initial.ledger.filter(row => row.category === 'purchase').length + 1);
    const savedRows = context.rows(); view.unmount(); await context.cold(); view = render(frame());
    expect(world()).toEqual(expected); expect(context.rows()).toEqual(savedRows); expect(screen.getByText('It’s yours')).toBeOnTheScreen();
    await press('Continue'); const acknowledged = resolveCommand(expected, { type: 'acknowledge', resultId: expected.pending!.id }, true);
    expect(world()).toEqual(acknowledged); expect(world().accounts).toEqual(expected.accounts); expect(world().assets).toEqual(expected.assets); expect(world().liabilities).toEqual(expected.liabilities); expect(world().ledger).toEqual(expected.ledger); expect(world().random).toEqual(expected.random);
    const doneRows = context.rows(); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: expected.pending!.id })).toBe(false); });
    expect(world()).toEqual(acknowledged); expect(context.rows()).toEqual(doneRows); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});

test('a pending purchase disables financing changes and duplicate confirmations, retaining terms through Android Back', async () => {
  const context = await setup();
  try {
    const initial = world(), beforeRows = context.rows(), view = render(frame()); await reviewMortgage(); const quote = expectReviewedTerms();
    const expected = resolveCommand(initial, { type: 'buy-asset', catalogId: 'studio', financing: 'mortgage', depositBps: 4000, termMonths: 240, quotedPrice: quote.price }, true);
    const release = context.pauseNextSave(); await press('Confirm Purchase'); expect(mockStore.getState().busy).toBe(true);
    for (const name of ['Buy Outright', 'Mortgage', 'Rent']) expect(screen.getByRole('radio', { name })).toBeDisabled();
    for (const name of ['Review Purchase', 'Confirm Purchase', 'Never mind']) expect(screen.getByRole('button', { name })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^Deposit\./ })).toBeDisabled(); expect(screen.getByRole('button', { name: /^Term\./ })).toBeDisabled();
    await choose('Buy Outright'); await press('Review Purchase'); await press('Confirm Purchase'); await press('Never mind');
    await act(async () => { screen.UNSAFE_getByType(Modal).props.onRequestClose(); });
    expectReviewedTerms(); expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows);
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false));
    expect(world()).toEqual(expected); expect(world().revision).toBe(initial.revision + 1); expect(screen.queryByText('Buy City Studio?')).toBeNull(); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});
