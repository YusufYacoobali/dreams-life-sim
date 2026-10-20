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
import { assetCatalog } from '../../src/game/content/assets';
import { purchaseQuote, saleQuote, refinanceFee, mortgageInterestBps, mortgagePayment } from '../../src/game/systems/assets';
import { investmentQuote, investmentValue } from '../../src/game/systems/markets';
import { exchangeQuote } from '../../src/game/systems/finance';
import { accountFor, availableCash } from '../../src/game/systems/common';
import { currencyDigits, formatMoney, type Currency } from '../../src/game/money';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import graduate from '../fixtures/v3-employed-graduate.json';

let mockStore: ReturnType<typeof createGameStore>, mockRouteId = '';
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ id: mockRouteId }), router: { back: jest.fn(), push: jest.fn(), navigate: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Asset from '../../app/(game)/asset/[id]';
import Bank from '../../app/(game)/bank';
import Investment from '../../app/(game)/investment/[id]';

type Kind = 'listing' | 'refinance' | 'sale' | 'borrow' | 'repay' | 'exchange' | 'buy' | 'sell';
const kinds: Kind[] = ['listing', 'refinance', 'sale', 'borrow', 'repay', 'exchange', 'buy', 'sell'];
const world = () => mockStore.getState().world!;
const frame = (kind: Kind) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{['listing', 'refinance', 'sale'].includes(kind) ? <Asset /> : ['borrow', 'repay', 'exchange'].includes(kind) ? <Bank /> : <Investment />}<PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const modal = () => within(screen.UNSAFE_getByType(Modal));
const choose = async (name: string) => { await act(async () => { fireEvent.press(screen.getByRole('radio', { name })); }); };
const edit = (name: string, value: string) => fireEvent.changeText(screen.getByLabelText(name), value);
const money = (value: bigint, currency = accountFor(world()).currency) => formatMoney({ minor: value, currency });
const decimal = (value: bigint, currency: Currency) => { const digits = currencyDigits[currency], scale = 10n ** BigInt(digits); return (value / scale).toString() + (digits ? '.' + (value % scale).toString().padStart(digits, '0') : ''); };
const acknowledge = (initial: World) => resolveCommand(initial, { type: 'acknowledge', resultId: initial.pending!.id }, true);
const apply = (initial: World, command: GameCommand) => acknowledge(resolveCommand(initial, command, true));

function funded(lifeId?: string) {
  const initial = decodeWorld(JSON.stringify(graduate)), account = accountFor(initial);
  if (lifeId) initial.id = lifeId;
  // Explicitly funded scenario, not a natural-lifetime or native-data claim.
  account.cash += 100000000n; account.openingCash += 100000000n;
  return initial;
}
function purchase(initial: World, catalogId = 'studio', financing: 'cash' | 'mortgage' = 'cash') {
  const quote = purchaseQuote(initial, assetCatalog.find(item => item.id === catalogId)!, financing);
  return apply(initial, { type: 'buy-asset', catalogId, financing, depositBps: 2000, termMonths: 360, quotedPrice: quote.price });
}
function prepare(kind: Kind, lifeId?: string) {
  let initial = funded(lifeId);
  if (['listing', 'refinance', 'sale'].includes(kind)) initial = purchase(initial, kind === 'sale' ? 'used-compact' : 'studio', kind === 'refinance' ? 'mortgage' : 'cash');
  else if (kind === 'repay') initial = apply(initial, { type: 'borrow', amount: 100000n });
  else if (kind === 'sell') initial = apply(initial, { type: 'buy-investment', instrumentId: 'ORBIT', quantity: 2000000n, quotedMinor: investmentQuote(initial, 'ORBIT', 2000000n).value });
  return initial;
}
async function setup(initial: World, kind: Kind) {
  mockRouteId = ['listing', 'refinance', 'sale'].includes(kind) ? initial.assets.find(item => item.ownerId === initial.activePersonId)!.id : 'ORBIT';
  const directory = mkdtempSync(join(tmpdir(), 'dreams-asset-bank-')), path = join(directory, 'dreams.db'); let sqlite: DatabaseSync;
  const connect = (): SqlDatabase => {
    sqlite = new DatabaseSync(path); sqlite.exec('PRAGMA foreign_keys=ON'); const connection = sqlite;
    const session: SqlSession = {
      run: async (sql, values = []) => { connection.prepare(sql).run(...values); },
      get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null,
      all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[],
    };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => { connection.exec('BEGIN IMMEDIATE'); try { const value = await action(session); connection.exec('COMMIT'); return value; } catch (error) { connection.exec('ROLLBACK'); throw error; } } };
  };
  const repository = new SaveRepository(connect()); await repository.initialise(); await repository.create(initial);
  let nextYield: Promise<void> | undefined;
  const pauseNextSave = () => { let release!: () => void; nextYield = new Promise<void>(resolve => { release = resolve; }); return release; };
  const bootstrap = async (repo: SaveRepository) => { mockStore = createGameStore({ repository: async () => repo, date: () => initial.date, id: () => 'life_unused', yieldToUI: async () => { const pause = nextYield; nextYield = undefined; if (pause) await pause; } }); expect(await mockStore.getState().bootstrap()).toBe(true); };
  await bootstrap(repository);
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  return { get sqlite() { return sqlite; }, repository, rows, pauseNextSave, cold: async () => { sqlite.close(); await bootstrap(new SaveRepository(connect())); }, close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); } };
}

type Review = { command: GameCommand; title: string; confirm: string; visibleAmounts: string[]; draft?: [string, string] };
async function openReview(kind: Kind): Promise<Review> {
  const current = world(), account = accountFor(current), asset = current.assets.find(item => item.id === mockRouteId)!;
  if (kind === 'listing') {
    const amount = asset.value + 12345n, value = decimal(amount, asset.currency);
    await press(/^Sell Property\./); edit('Asking price', value); await press('Review Listing');
    return { command: { type: 'list-property', assetId: asset.id, askingPrice: amount }, title: 'List at this price?', confirm: 'Confirm', visibleAmounts: [money(amount, asset.currency)], draft: ['Asking price', value] };
  }
  if (kind === 'refinance') {
    const loan = current.liabilities.find(item => item.id === asset.mortgageId)!, amount = loan.principal - 12345n, value = decimal(amount, asset.currency);
    await press(/^Refinance\./); edit('New mortgage principal', value); await press(/^New term\./); await choose('20 years'); await press('Choose');
    expect(screen.queryByRole('button', { name: 'Choose' })).toBeNull(); await press('Review Refinancing');
    return { command: { type: 'refinance', assetId: asset.id, principal: amount, termMonths: 240 }, title: 'Refinance this mortgage?', confirm: 'Confirm', visibleAmounts: [money(amount, asset.currency), money(refinanceFee(amount), asset.currency), money(mortgagePayment(amount, mortgageInterestBps(current), 240), asset.currency)], draft: ['New mortgage principal', value] };
  }
  if (kind === 'sale') {
    const quote = saleQuote(current, asset); await press('Sell Vehicle');
    return { command: { type: 'sell-asset', assetId: asset.id, quotedPrice: quote.price }, title: 'Accept this sale offer?', confirm: 'Confirm', visibleAmounts: [money(quote.proceeds, asset.currency)] };
  }
  if (['borrow', 'repay', 'exchange'].includes(kind)) {
    const amount = 10017n, value = decimal(amount, account.currency); edit('Amount in ' + account.currency, value);
    if (kind === 'borrow') { await press('Review Personal Loan'); return { command: { type: 'borrow', amount }, title: 'Take out this loan?', confirm: 'Accept Loan', visibleAmounts: [money(amount)], draft: ['Amount in ' + account.currency, value] }; }
    if (kind === 'repay') { const debt = current.liabilities.find(item => item.ownerId === current.activePersonId && item.kind === 'personal' && item.principal > 0n)!; await press(/^Personal debt\./); return { command: { type: 'repay', liabilityId: debt.id, amount }, title: 'Make this repayment?', confirm: 'Repay', visibleAmounts: [money(amount)], draft: ['Amount in ' + account.currency, value] }; }
    const to = account.currency === 'USD' ? 'EUR' : 'USD', quote = exchangeQuote(current, amount, account.currency, to); await press('Review Exchange');
    return { command: { type: 'exchange', from: account.currency, to, amount, quotedNet: quote.net }, title: 'Exchange currencies?', confirm: 'Exchange', visibleAmounts: [money(amount), money(quote.fee, to), money(quote.net, to)], draft: ['Amount in ' + account.currency, value] };
  }
  const quantity = 125001n, quote = investmentQuote(current, 'ORBIT', quantity); await press(kind === 'buy' ? 'Buy' : 'Sell'); edit('Trade quantity', '0.125001'); await press('Review Trade');
  return { command: kind === 'buy' ? { type: 'buy-investment', instrumentId: 'ORBIT', quantity, quotedMinor: quote.value } : { type: 'sell-investment', holdingId: current.holdings.find(item => item.ownerId === current.activePersonId && item.instrumentId === 'ORBIT')!.id, quantity, quotedMinor: quote.value }, title: kind === 'buy' ? 'Buy ORBIT?' : 'Sell ORBIT?', confirm: kind === 'buy' ? 'Confirm Purchase' : 'Confirm Sale', visibleAmounts: [money(quote.value), money(quote.fee), money(kind === 'buy' ? quote.buyCost : quote.sellProceeds)], draft: ['Trade quantity', '0.125001'] };
}
function expectReview(review: Review) {
  expect(modal().getByText(review.title)).toBeOnTheScreen();
  for (const amount of review.visibleAmounts) expect(modal().getAllByText(amount).length).toBeGreaterThan(0);
  if (review.draft) expect(screen.getByLabelText(review.draft[0])).toHaveProp('value', review.draft[1]);
}

test.each(kinds)('%s preview/cancel saves nothing; failed commit retains exact terms, retries warm and cold-resumes once', async kind => {
  const context = await setup(prepare(kind), kind);
  try {
    const initial = world(), before = encodeWorld(initial), beforeRows = context.rows(), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    let view = render(frame(kind)); let review = await openReview(kind); expectReview(review); await press('Never mind');
    expect(screen.queryByText(review.title)).toBeNull(); expect(encodeWorld(world())).toBe(before); expect(context.rows()).toEqual(beforeRows);
    review = await openReview(kind); const expected = resolveCommand(initial, review.command, true); expectReview(review);
    context.sqlite.exec("CREATE TRIGGER fail_financial_ui BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press(review.confirm); await waitFor(() => expect(modal().getByRole('alert')).toHaveTextContent(/couldn't be saved/));
    expectReview(review); expect(modal().getByRole('alert')).toHaveProp('accessibilityLiveRegion', 'polite'); expect(encodeWorld(world())).toBe(before); expect(context.rows()).toEqual(beforeRows);
    context.sqlite.exec('DROP TRIGGER fail_financial_ui'); await press(review.confirm);
    expect(world()).toEqual(expected); expect(screen.queryByText(review.title)).toBeNull(); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    const savedRows = context.rows(); view.unmount(); await context.cold(); view = render(frame(kind));
    expect(world()).toEqual(expected); expect(context.rows()).toEqual(savedRows); expect(screen.getByText(expected.pending!.title)).toBeOnTheScreen();
    await press('Continue'); const done = acknowledge(expected); expect(world()).toEqual(done); expect(world().accounts).toEqual(expected.accounts); expect(world().assets).toEqual(expected.assets); expect(world().liabilities).toEqual(expected.liabilities); expect(world().holdings).toEqual(expected.holdings); expect(world().ledger).toEqual(expected.ledger); expect(world().random).toEqual(expected.random);
    const doneRows = context.rows(); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: expected.pending!.id })).toBe(false); });
    expect(world()).toEqual(done); expect(context.rows()).toEqual(doneRows); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});

test.each(['refinance', 'repay', 'sell'] as Kind[])('%s save disables mutation inputs and ignores duplicate confirm/cancel/Android Back', async kind => {
  const context = await setup(prepare(kind), kind);
  try {
    const initial = world(), beforeRows = context.rows(), view = render(frame(kind)), review = await openReview(kind), expected = resolveCommand(initial, review.command, true);
    const release = context.pauseNextSave(); await press(review.confirm); expect(mockStore.getState().busy).toBe(true);
    expect(screen.getByLabelText(review.draft![0])).toBeDisabled(); expect(modal().getByRole('button', { name: review.confirm })).toHaveProp('accessibilityState', { disabled: true, busy: true });
    const disabled = kind === 'refinance' ? [/^Refinance\./, /^New term\./, 'Review Refinancing'] : kind === 'repay' ? [/^Currency Account\./, /^Exchange To\./, /^Personal debt\./, 'Review Personal Loan', 'Review Exchange'] : ['Buy', 'Sell', 'Review Trade'];
    for (const name of disabled) { expect(screen.getByRole('button', { name })).toBeDisabled(); await press(name); }
    const reviewButton = kind === 'refinance' ? 'Review Refinancing' : kind === 'repay' ? 'Review Personal Loan' : 'Review Trade';
    expect(screen.getByRole('button', { name: reviewButton })).toHaveProp('accessibilityState', { disabled: true, busy: false });
    await press(review.confirm); await press('Never mind'); await act(async () => { screen.UNSAFE_getByType(Modal).props.onRequestClose(); });
    expectReview(review); expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows);
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false));
    expect(world()).toEqual(expected); expect(world().revision).toBe(initial.revision + 1); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});

test('changing actual asset or instrument identity drops its previous local form/quote without saving', async () => {
  let initial = purchase(funded(), 'studio', 'mortgage'); initial = purchase(initial, 'apartment', 'cash');
  const context = await setup(initial, 'refinance');
  try {
    const beforeRows = context.rows(), before = encodeWorld(world()), view = render(frame('refinance'));
    await openReview('refinance'); const firstId = mockRouteId, other = world().assets.find(item => item.id !== firstId && item.ownerId === initial.activePersonId)!;
    mockRouteId = other.id; view.rerender(frame('refinance')); expect(screen.queryByText('Refinance this mortgage?')).toBeNull(); expect(screen.queryByLabelText('New mortgage principal')).toBeNull();
    mockRouteId = firstId; view.rerender(frame('refinance')); await press(/^Refinance\./); expect(screen.getByLabelText('New mortgage principal')).toHaveProp('value', ''); expect(screen.getByRole('button', { name: 'New term. 30 years' })).toBeOnTheScreen();
    view.rerender(frame('buy')); mockRouteId = 'ORBIT'; view.rerender(frame('buy')); edit('Trade quantity', '0.125001'); await press('Review Trade'); expect(screen.getByText('Buy ORBIT?')).toBeOnTheScreen();
    mockRouteId = 'GROVE'; view.rerender(frame('buy')); expect(screen.queryByText('Buy ORBIT?')).toBeNull(); expect(screen.getByLabelText('Trade quantity')).toHaveProp('value', '1'); await press('Review Trade'); expect(screen.getByText('Buy GROVE?')).toBeOnTheScreen(); await press('Never mind');
    expect(encodeWorld(world())).toBe(before); expect(context.rows()).toEqual(beforeRows); view.unmount();
  } finally { context.close(); }
});

test('currency choices and invalid repayment reasons are read-only and preserve actual debt/currency amounts', async () => {
  let initial = apply(funded(), { type: 'borrow', amount: 100000n });
  initial = apply(initial, { type: 'exchange', from: 'USD', to: 'EUR', amount: 10000n, quotedNet: exchangeQuote(initial, 10000n, 'USD', 'EUR').net });
  const unitValue = investmentValue(initial, 'GROVE', 1n, 'USD'), quantity = accountFor(initial).cash * 100n / (unitValue * 101n);
  initial = apply(initial, { type: 'buy-investment', instrumentId: 'GROVE', quantity, quotedMinor: investmentQuote(initial, 'GROVE', quantity).value });
  const context = await setup(initial, 'repay');
  try {
    const beforeRows = context.rows(), before = encodeWorld(world()), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), view = render(frame('repay'));
    edit('Amount in USD', '1000.01'); await press(/^Personal debt\./); expect(screen.getByRole('alert')).toHaveTextContent('The repayment exceeds the outstanding principal.'); expect(screen.queryByText('Make this repayment?')).toBeNull();
    expect(availableCash(accountFor(world()))).toBeLessThan(100000n); edit('Amount in USD', '1000'); await press(/^Personal debt\./); expect(screen.getByRole('alert')).toHaveTextContent('Your available balance cannot cover this repayment.'); expect(screen.queryByText('Make this repayment?')).toBeNull();
    await press(/^Currency Account\./); await choose('EUR'); await press('Choose'); expect(screen.queryByRole('button', { name: 'Choose' })).toBeNull(); expect(screen.getByLabelText('Amount in EUR')).toBeOnTheScreen(); expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('button', { name: /Personal debt\..*Repay from an account in USD/ })).toBeDisabled();
    await press(/^Exchange To\./); await choose('JPY'); await press('Choose'); expect(screen.getByRole('button', { name: 'Exchange To. JPY' })).toBeOnTheScreen();
    expect(encodeWorld(world())).toBe(before); expect(context.rows()).toEqual(beforeRows); expect(unpack).not.toHaveBeenCalled(); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});


test('reviewing identical mortgage terms does not charge or save, while an actual new term remains reviewable', async () => {
  const context = await setup(prepare('refinance'), 'refinance');
  try {
    const initial = world(), beforeRows = context.rows(), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), view = render(frame('refinance'));
    await press(/^Refinance\./); await press('Review Refinancing');
    expect(screen.getByRole('alert')).toHaveTextContent('These are already your current mortgage terms.'); expect(screen.queryByText('Refinance this mortgage?')).toBeNull();
    const asset = initial.assets.find(item => item.id === mockRouteId)!, loan = initial.liabilities.find(item => item.id === asset.mortgageId)!;
    edit('New mortgage principal', decimal(loan.principal, asset.currency)); await press('Review Refinancing'); expect(screen.queryByText('Refinance this mortgage?')).toBeNull();
    await press(/^New term\./); await choose('20 years'); await press('Choose'); expect(screen.queryByRole('alert')).toBeNull(); await press('Review Refinancing'); expect(screen.getByText('Refinance this mortgage?')).toBeOnTheScreen(); await press('Never mind');
    expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows); expect(unpack).not.toHaveBeenCalled(); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});


test('switching trade side clears the previous quantity reason without saving or silently changing the entered amount', async () => {
  const context = await setup(prepare('sell'), 'sell');
  try {
    const initial = world(), beforeRows = context.rows(), view = render(frame('sell'));
    await press('Sell'); edit('Trade quantity', '3'); await press('Review Trade'); expect(screen.getByRole('alert')).toHaveTextContent('You do not own that quantity.'); expect(screen.queryByText('Sell ORBIT?')).toBeNull();
    await press('Buy'); expect(screen.queryByRole('alert')).toBeNull(); expect(screen.getByLabelText('Trade quantity')).toHaveProp('value', '3'); await press('Review Trade'); expect(screen.getByText('Buy ORBIT?')).toBeOnTheScreen(); await press('Never mind');
    expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows); view.unmount();
  } finally { context.close(); }
});


test.each(['refinance', 'repay', 'sell'] as Kind[])('%s draft belongs to its actual life/person even when the next life reuses the same route id', async kind => {
  const initial = prepare(kind), other = prepare(kind, 'life_other_' + kind), context = await setup(initial, kind);
  try {
    await context.repository.create(other); expect(await mockStore.getState().selectLife(initial.id)).toBe(true);
    const view = render(frame(kind)), review = await openReview(kind); expectReview(review);
    const savedLives = context.sqlite.prepare('SELECT * FROM lives ORDER BY id').all(), receipts = context.sqlite.prepare('SELECT * FROM receipts ORDER BY life_id,command_id').all();
    await act(async () => { expect(await mockStore.getState().selectLife(other.id)).toBe(true); });
    expect(world()).toEqual(other); expect(screen.queryByText(review.title)).toBeNull();
    if (kind === 'refinance') { expect(other.assets[0].id).toBe(initial.assets[0].id); expect(screen.queryByLabelText('New mortgage principal')).toBeNull(); await press(/^Refinance\./); expect(screen.getByLabelText('New mortgage principal')).toHaveProp('value', ''); expect(screen.getByRole('button', { name: 'New term. 30 years' })).toBeOnTheScreen(); }
    else if (kind === 'repay') expect(screen.getByLabelText('Amount in USD')).toHaveProp('value', '');
    else expect(screen.getByLabelText('Trade quantity')).toHaveProp('value', '1');
    expect(context.sqlite.prepare('SELECT * FROM lives ORDER BY id').all()).toEqual(savedLives); expect(context.sqlite.prepare('SELECT * FROM receipts ORDER BY life_id,command_id').all()).toEqual(receipts); view.unmount();
  } finally { context.close(); }
});
