import React from 'react';
import { Modal } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGameStore } from '../../src/state/gameStore';
import { copyWorld, encodeWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { accountFor } from '../../src/game/systems/common';
import { businessStartupQuote } from '../../src/game/systems/businesses';
import { formatMoney } from '../../src/game/money';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import archive from '../fixtures/v11-business-archive.json';

let mockStore: ReturnType<typeof createGameStore>, mockCompanyId = '';
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() }, useLocalSearchParams: () => ({ id: mockCompanyId }) }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Businesses from '../../app/(game)/business';
import ManageBusiness from '../../app/(game)/manage-business/[id]';

const frame = (startup = false) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{startup ? <Businesses /> : <ManageBusiness />}<PendingEvent /></ThemeProvider></SafeAreaProvider>;
const world = () => mockStore.getState().world!;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const edit = async (name: string, value: string) => { await act(async () => { fireEvent.changeText(screen.getByLabelText(name), value); }); };
const modal = () => within(screen.UNSAFE_getByType(Modal));
const acknowledge = (initial: World) => resolveCommand(initial, { type: 'acknowledge', resultId: initial.pending!.id }, true);

async function setup() {
  const directory = mkdtempSync(join(tmpdir(), 'dreams-business-review-')), path = join(directory, 'dreams.db'); let sqlite: DatabaseSync;
  function connect(): SqlDatabase {
    sqlite = new DatabaseSync(path); sqlite.exec('PRAGMA foreign_keys=ON'); const connection = sqlite;
    const session: SqlSession = {
      run: async (sql, values = []) => { connection.prepare(sql).run(...values); },
      get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null,
      all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[],
    };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => {
      connection.exec('BEGIN IMMEDIATE'); try { const value = await action(session); connection.exec('COMMIT'); return value; } catch (error) { connection.exec('ROLLBACK'); throw error; }
    } };
  }
  const repository = new SaveRepository(connect()); await repository.initialise(); await repository.import(JSON.stringify(archive));
  let nextYield: Promise<void> | undefined;
  const pauseNextSave = () => { let release!: () => void; nextYield = new Promise<void>(resolve => { release = resolve; }); return release; };
  const bootstrap = async (repo: SaveRepository) => { mockStore = createGameStore({ repository: async () => repo, date: () => ({ year: 2026, month: 1, day: 1 }), id: () => 'unused', yieldToUI: async () => { const pause = nextYield; nextYield = undefined; if (pause) await pause; } }); expect(await mockStore.getState().bootstrap()).toBe(true); };
  await bootstrap(repository); mockCompanyId = world().businesses.find(item => item.ownerId === world().activePersonId && item.status === 'active')!.id;
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  return { get sqlite() { return sqlite; }, repository, rows, pauseNextSave,
    cold: async () => { sqlite.close(); await bootstrap(new SaveRepository(connect())); },
    oldMoments: () => { for (const point of archive.snapshots) expect(sqlite.prepare('SELECT payload FROM snapshots WHERE snapshot_id=?').get(point.summary.id)?.payload).toBe(point.payload); },
    close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); },
  };
}

// This is the unchanged, already funded historical business archive, not a
// natural startup journey. All tested actions use the actual store, engine and
// on-disk repository; neither source cash nor company records are fabricated.
test.each(['startup', 'funding'] as const)('%s review survives exact all-table rollback, retries warm and resumes the durable result after reopening SQLite', async kind => {
  const context = await setup(), startup = kind === 'startup';
  try {
    const initial = world(), company = initial.businesses.find(item => item.id === mockCompanyId)!, beforeRows = context.rows(); expect(Object.keys(beforeRows)).toHaveLength(8);
    const quote = businessStartupQuote(initial, 'retail'), money = (minor: bigint) => formatMoney({ minor, currency: company.currency });
    const command: GameCommand = startup ? { type: 'start-business', kind: 'retail', name: 'Reviewed Retail', operation: 'manager', quotedCapital: quote.capital } : { type: 'fund-business', businessId: company.id, amount: 12345n };
    const expected = resolveCommand(initial, command, true), confirm = startup ? 'Start Business' : 'Fund Business', title = startup ? 'Start Reviewed Retail?' : 'Invest more capital?';
    let view = render(frame(startup));
    if (startup) { await press(/^Retail Shop\./); await edit('Business name', '  Reviewed Retail  '); }
    else { await edit('Additional business capital', '123.45'); await edit('Business profit withdrawal', '17.25'); }
    const launch = startup ? 'Review Startup' : 'Review Funding';
    const expectTerms = () => { expect(modal().getByText(title)).toBeOnTheScreen(); for (const value of startup ? [quote.capital, quote.registration, quote.total] : [12345n]) expect(modal().getByText(money(value))).toBeOnTheScreen(); };
    const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); await press(launch); expectTerms(); await press('Never mind'); expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows); expect(unpack).not.toHaveBeenCalled();
    await press(launch); context.sqlite.exec("CREATE TRIGGER fail_business_review BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press(confirm); await waitFor(() => expect(modal().getByRole('alert')).toHaveTextContent(/couldn't be saved/)); expectTerms();
    expect(screen.getAllByText(/couldn't be saved/)).toHaveLength(1); expect(screen.getAllByRole('alert')).toHaveLength(1); expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows);
    expect(screen.getByLabelText(startup ? 'Business name' : 'Additional business capital')).toHaveProp('value', startup ? '  Reviewed Retail  ' : '123.45');
    context.sqlite.exec('DROP TRIGGER fail_business_review'); const release = context.pauseNextSave(); await press(confirm); expect(mockStore.getState().busy).toBe(true); expectTerms();
    expect(screen.getByRole('button', { name: launch })).toBeDisabled(); expect(modal().getByRole('button', { name: confirm })).toBeDisabled(); expect(modal().getByRole('button', { name: 'Never mind' })).toBeDisabled();
    expect(screen.getAllByRole('button', { busy: true })).toHaveLength(1); expect(modal().getByRole('button', { name: confirm, busy: true })).toBeOnTheScreen();
    expect(screen.getByLabelText(startup ? 'Business name' : 'Additional business capital')).toHaveProp('editable', false);
    if (startup) { expect(screen.getByRole('button', { name: /^Employ a Manager\./ })).toBeDisabled(); expect(screen.getByRole('button', { name: /^Coffee Shop\./ })).toBeDisabled(); }
    else { expect(screen.getByRole('button', { name: 'Review Distribution' })).toBeDisabled(); expect(screen.getByRole('button', { name: /^125% of Standard Price/ })).toBeDisabled(); }
    await press(confirm); await press('Never mind'); await act(async () => { screen.UNSAFE_getByType(Modal).props.onRequestClose(); }); expectTerms(); expect(context.rows()).toEqual(beforeRows);
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false)); expect(screen.queryByText(title)).toBeNull(); expect(world()).toEqual(expected); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    expect(accountFor(world()).cash).toBe(accountFor(initial).cash - (startup ? quote.total : 12345n));
    if (startup) { expect(world().businesses.find(item => item.id === company.id)).toEqual(company); const created = world().businesses.find(item => item.id !== company.id)!; expect(created.staff).toHaveLength(2); expect(world().businesses).toHaveLength(initial.businesses.length + 1); }
    else { expect(world().businesses.find(item => item.id === company.id)!.cash).toBe(company.cash + 12345n); expect(world().businesses.find(item => item.id === company.id)!.cumulativeProfit).toBe(company.cumulativeProfit); expect(world().people).toEqual(initial.people); }
    const savedRows = context.rows(); view.unmount(); await context.cold(); view = render(frame(startup)); expect(world()).toEqual(expected); expect(context.rows()).toEqual(savedRows);
    await press('Continue'); expect(world()).toEqual(acknowledge(expected)); expect(world().businesses).toEqual(expected.businesses); expect(world().businessLedger).toEqual(expected.businessLedger); expect(world().accounts).toEqual(expected.accounts); expect(world().ledger).toEqual(expected.ledger); expect(world().random).toEqual(expected.random);
    const doneRows = context.rows(); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: expected.pending!.id })).toBe(false); }); expect(context.rows()).toEqual(doneRows); context.oldMoments(); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});

test('current prices, campaign and profit policy never launch or save; changed reviews and cancellation are local', async () => {
  const context = await setup();
  try {
    const initial = world(), before = encodeWorld(initial), beforeRows = context.rows(), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), view = render(frame());
    for (const label of [/^100% of Standard Price\. Current\. This is your current price$/, /^No Advertising\..*Current\. This is your current campaign$/, /^Distribute 25% of Monthly Profit\. Current\. This is your current profit policy$/]) { expect(screen.getByRole('button', { name: label })).toBeDisabled(); await press(label); expect(screen.queryByRole('button', { name: 'Never mind' })).toBeNull(); }
    for (const [launch, confirm] of [[/^125% of Standard Price/, 'Set Prices'], [/^Local Campaign\./, 'Set Campaign'], [/^Reinvest All Profit/, 'Set Policy']] as const) { await press(launch); expect(modal().getByRole('button', { name: confirm })).toBeEnabled(); await press('Never mind'); }
    expect(encodeWorld(world())).toBe(before); expect(context.rows()).toEqual(beforeRows); expect(unpack).not.toHaveBeenCalled(); context.oldMoments(); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});

test('an actual unrelated business-plan revision preserves the reviewed funding amount for the same company', async () => {
  const context = await setup();
  try {
    const initial = world(), view = render(frame()); await edit('Additional business capital', '123.45'); await press('Review Funding');
    const changed = resolveCommand(initial, { type: 'business-prices', businessId: mockCompanyId, priceBps: 12500 }, true), expected = acknowledge(changed);
    await act(async () => { expect(await mockStore.getState().dispatch({ type: 'business-prices', businessId: mockCompanyId, priceBps: 12500 })).toBe(true); expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: world().pending!.id })).toBe(true); });
    expect(world()).toEqual(expected); expect(modal().getByText('Invest more capital?')).toBeOnTheScreen(); expect(screen.getByLabelText('Additional business capital')).toHaveProp('value', '123.45');
    const rows = context.rows(); await press('Never mind'); expect(context.rows()).toEqual(rows); expect(world().accounts).toEqual(initial.accounts); expect(world().businessLedger).toEqual(initial.businessLedger); view.unmount();
  } finally { context.close(); }
});

test('switching between two actual owned company routes clears the old amounts and review without saving', async () => {
  const context = await setup();
  try {
    const quote = businessStartupQuote(world(), 'retail'); expect(await mockStore.getState().dispatch({ type: 'start-business', kind: 'retail', name: 'Second Actual Company', operation: 'manager', quotedCapital: quote.capital })).toBe(true); expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: world().pending!.id })).toBe(true);
    const initial = world(), beforeRows = context.rows(), firstId = mockCompanyId, secondId = initial.businesses.find(item => item.id !== firstId)!.id, unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), view = render(frame());
    await edit('Additional business capital', '123.45'); await edit('Business profit withdrawal', '17.25'); await press('Review Funding'); mockCompanyId = secondId; view.rerender(frame());
    expect(screen.queryByText('Invest more capital?')).toBeNull(); expect(screen.getByText('Second Actual Company')).toBeOnTheScreen(); expect(screen.getByLabelText('Additional business capital')).toHaveProp('value', ''); expect(screen.getByLabelText('Business profit withdrawal')).toHaveProp('value', '');
    mockCompanyId = firstId; view.rerender(frame()); expect(screen.getByLabelText('Additional business capital')).toHaveProp('value', ''); expect(screen.queryByRole('button', { name: 'Fund Business' })).toBeNull(); expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows); expect(unpack).not.toHaveBeenCalled(); context.oldMoments(); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});

test.each([true, false])('an actual life switch clears the %s startup form or company review even when person/company IDs repeat', async startup => {
  const context = await setup();
  try {
    // Identity-only second-life fixture; company/person IDs deliberately repeat.
    // This checks local form scoping, not an earned inheritance or natural life.
    const initial = world(), other = copyWorld(initial); other.id = 'life_other_business_review'; await context.repository.create(other); expect(await mockStore.getState().selectLife(initial.id)).toBe(true);
    const view = render(frame(startup)); if (startup) { await edit('Business name', 'Old Life Draft'); await press('Review Startup'); } else { await edit('Additional business capital', '123.45'); await edit('Business profit withdrawal', '17.25'); await press('Review Funding'); }
    const lives = context.sqlite.prepare('SELECT * FROM lives ORDER BY id').all(), receipts = context.sqlite.prepare('SELECT * FROM receipts ORDER BY life_id,command_id').all();
    await act(async () => { expect(await mockStore.getState().selectLife(other.id)).toBe(true); }); expect(screen.queryByRole('button', { name: startup ? 'Start Business' : 'Fund Business' })).toBeNull(); expect(screen.getByLabelText(startup ? 'Business name' : 'Additional business capital')).toHaveProp('value', '');
    if (!startup) expect(screen.getByLabelText('Business profit withdrawal')).toHaveProp('value', ''); expect(context.sqlite.prepare('SELECT * FROM lives ORDER BY id').all()).toEqual(lives); expect(context.sqlite.prepare('SELECT * FROM receipts ORDER BY life_id,command_id').all()).toEqual(receipts); context.oldMoments(); view.unmount();
  } finally { context.close(); }
});
