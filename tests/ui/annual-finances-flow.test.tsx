import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGameStore } from '../../src/state/gameStore';
import { randomCreation } from '../../src/game/createLife';
import { encodeWorld, fullName } from '../../src/game/model';
import { formatMoney } from '../../src/game/money';
import { countries } from '../../src/game/countries';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import * as projection from '../../src/ui/annualFinances';
import { ThemeProvider } from '../../src/ui/theme';
import pensionArchive from '../fixtures/v18-foreign-pension-archive.json';
import companyArchive from '../fixtures/v11-business-archive.json';

let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn(), navigate: jest.fn() }, usePathname: () => '/finances', useGlobalSearchParams: () => ({}), Redirect: () => null, Stack: Object.assign(() => null, { Screen: () => null }) }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import { router } from 'expo-router';
import Finances from '../../app/(game)/finances';
import Assets from '../../app/(game)/(tabs)/assets';
import Bank from '../../app/(game)/bank';
import GameLayout from '../../app/(game)/_layout';

const frame = (content: React.ReactNode = <Finances />) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{content}</ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const choose = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('radio', { name })); }); };
const world = () => mockStore.getState().world!;
async function setup(archive = pensionArchive) {
  const directory = mkdtempSync(join(tmpdir(), 'dreams-annual-finances-')), path = join(directory, 'dreams.db'); let sqlite: DatabaseSync;
  function connect(): SqlDatabase {
    const connection = sqlite = new DatabaseSync(path); connection.exec('PRAGMA foreign_keys=ON');
    const session: SqlSession = {
      run: async (sql, values = []) => { connection.prepare(sql).run(...values); },
      get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null,
      all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[],
    };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => {
      connection.exec('BEGIN IMMEDIATE'); try { const result = await action(session); connection.exec('COMMIT'); return result; } catch (error) { connection.exec('ROLLBACK'); throw error; }
    } };
  }
  const repository = new SaveRepository(connect()); await repository.initialise(); await repository.import(JSON.stringify(archive));
  async function bootstrap(repo: SaveRepository) { mockStore = createGameStore({ repository: async () => repo, date: () => ({ year: 2030, month: 6, day: 1 }), id: () => 'life_finance_other' }); expect(await mockStore.getState().bootstrap()).toBe(true); }
  await bootstrap(repository); const originalLifeId = world().id;
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  return { get sqlite() { return sqlite; }, rows,
    cold: async () => { sqlite.close(); await bootstrap(new SaveRepository(connect())); },
    oldMoments: () => { for (const point of archive.snapshots) expect(sqlite.prepare('SELECT payload FROM snapshots WHERE life_id=? AND snapshot_id=?').get(originalLifeId, point.summary.id)?.payload).toBe(point.payload); },
    close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); },
  };
}

async function selectScope(kind: 'year' | 'currency', id: string) { await press(kind === 'year' ? /^Financial Year\./ : /^Finance Currency\./); await choose(id); await press('View Breakdown'); }

test('genuine foreign pension year/currency/category/paging views write none of eight on-disk tables and cold-resume the entire world', async () => {
  const context = await setup();
  try {
    const initial = world(), payload = encodeWorld(initial), rows = context.rows(); expect(Object.keys(rows)).toHaveLength(8);
    const index = jest.spyOn(projection, 'indexPersonalFinances'), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), dispatch = jest.spyOn(mockStore.getState(), 'dispatch'); let view = render(frame());
    const money = (minor: bigint) => formatMoney({ minor, currency: 'JPY' }, countries[initial.people[initial.activePersonId].country].locale);
    expect(screen.getByText(fullName(initial.people[initial.activePersonId]))).toBeOnTheScreen(); expect(screen.getByText('Personal finances · 2027 · JPY')).toBeOnTheScreen();
    expect(screen.getByText('Income received before personal tax: ' + money(304649n))).toBeOnTheScreen(); expect(screen.getByText('Monthly income average: ' + money(304649n))).toBeOnTheScreen();
    await press(/^Financial Year\./); expect(screen.getByRole('radio', { name: '2027. This is your current view' })).toBeDisabled(); await choose('2027. This is your current view'); expect(screen.getByRole('button', { name: 'View Breakdown' })).toBeDisabled(); await press('Never mind');
    await selectScope('year', '2026'); expect(screen.getByText('Income received before personal tax: ' + money(3337696n))).toBeOnTheScreen(); expect(screen.getByText('Monthly income average: ' + money(278141n))).toBeOnTheScreen();
    await press(/^Income\. Received/); expect(screen.getByText('Income Breakdown')).toBeOnTheScreen(); await press(/^Taxes\. Received/); expect(screen.getByText('Taxes Breakdown')).toBeOnTheScreen();
    await press(/^All Recorded Transactions\./); expect(screen.getByRole('button', { name: 'Show Earlier Transactions' })).toBeOnTheScreen(); await press('Show Earlier Transactions');
    await selectScope('currency', 'USD'); expect(screen.getByText('Personal finances · 2026 · USD')).toBeOnTheScreen(); expect(screen.getByText('No personal transactions recorded for 2026 in USD.')).toBeOnTheScreen();
    expect(index).toHaveBeenCalledTimes(1); expect(dispatch).not.toHaveBeenCalled(); expect(unpack).not.toHaveBeenCalled(); expect(world()).toBe(initial); expect(encodeWorld(world())).toBe(payload); expect(context.rows()).toEqual(rows); context.oldMoments();
    index.mockRestore(); unpack.mockRestore(); dispatch.mockRestore(); view.unmount(); await context.cold(); view = render(frame()); expect(world()).toEqual(initial); expect(encodeWorld(world())).toBe(payload); expect(context.rows()).toEqual(rows); expect(screen.getByText('Personal finances · 2027 · JPY')).toBeOnTheScreen(); context.oldMoments(); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
}, 30000);

test('Assets and Bank expose the annual view without calculating it or changing their real forms or saved money', async () => {
  const context = await setup(companyArchive);
  try {
    const initial = world(), rows = context.rows(), index = jest.spyOn(projection, 'indexPersonalFinances'), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    let view = render(frame(<Assets />)); await press(/^Finances\./); expect(router.push).toHaveBeenLastCalledWith({ pathname: '/finances', params: { tab: 'assets' } }); view.unmount();
    view = render(frame(<Bank />)); await act(async () => { fireEvent.changeText(screen.getByLabelText('Amount in USD'), '12.34'); }); expect(screen.getByLabelText('Amount in USD').props.value).toBe('12.34'); await press(/^Annual Finances\./); expect(router.push).toHaveBeenLastCalledWith({ pathname: '/finances', params: { tab: 'assets' } });
    expect(index).not.toHaveBeenCalled(); expect(unpack).not.toHaveBeenCalled(); expect(world()).toBe(initial); expect(context.rows()).toEqual(rows); context.oldMoments(); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});

test('a genuine interleaved wage and company-payout year stays in original posting order when filtering and paging', async () => {
  const context = await setup(companyArchive);
  try {
    const initial = world(), rows = context.rows(), chronological = initial.ledger.filter(row => row.personId === initial.activePersonId && row.year === 2023 && row.currency === 'USD' && ['income', 'business-owner-income'].includes(row.category));
    expect(new Set(chronological.map(row => row.category)).size).toBe(2);
    const view = render(frame()); await selectScope('year', '2023'); await press(/^Income\. Received/);
    const expected = [...chronological].reverse(), visible = () => screen.getAllByText(/^2023-\d{2} · (Employment pay \/ pensions|Company profit payouts received) · Cash /).map(node => (Array.isArray(node.props.children) ? node.props.children.join('') : String(node.props.children)).split(' · Cash ')[0]);
    const prefix = (row: typeof chronological[number]) => row.year + '-' + String(row.month).padStart(2, '0') + ' · ' + (row.category === 'income' ? 'Employment pay / pensions' : 'Company profit payouts received');
    expect(visible()).toEqual(expected.slice(0, 20).map(prefix));
    if (expected.length > 20) { await press('Show Earlier Transactions'); expect(visible()).toEqual(expected.slice(0, 40).map(prefix)); }
    expect(world()).toBe(initial); expect(context.rows()).toEqual(rows); context.oldMoments(); view.unmount();
  } finally { context.close(); }
});

test('a direct Finances route selects Assets without a tab override and issues no financial read or command', async () => {
  const context = await setup();
  try {
    const initial = world(), rows = context.rows(), index = jest.spyOn(projection, 'indexPersonalFinances'), dispatch = jest.spyOn(mockStore.getState(), 'dispatch'), view = render(frame(<GameLayout />));
    expect(screen.getByRole('tab', { name: 'Assets', selected: true })).toBeOnTheScreen(); await act(async () => { fireEvent.press(screen.getByRole('tab', { name: 'Assets' })); });
    expect(router.navigate).not.toHaveBeenCalled(); expect(index).not.toHaveBeenCalled(); expect(dispatch).not.toHaveBeenCalled(); expect(world()).toBe(initial); expect(context.rows()).toEqual(rows); context.oldMoments(); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});

test('a real new-life switch resets prior-person/year filters even when the player ID repeats, and opening the empty finances saves nothing', async () => {
  const context = await setup(companyArchive);
  try {
    const original = world(); expect(original.activePersonId).toBe('person_player');
    expect(await mockStore.getState().startLife({ ...randomCreation(4242), country: 'US', city: 'New York', background: 'ordinary' }, 4242)).toBe(true); expect(await mockStore.getState().acknowledgeBirth()).toBe(true);
    const newborn = world(); expect(newborn.activePersonId).toBe(original.activePersonId); expect(await mockStore.getState().selectLife(original.id)).toBe(true);
    const view = render(frame()); await selectScope('year', '2023'); expect(screen.getByText('Personal finances · 2023 · USD')).toBeOnTheScreen();
    await press(/^Finance Currency\./); const savedLifeRows = context.sqlite.prepare('SELECT * FROM lives ORDER BY id').all(), savedReceipts = context.sqlite.prepare('SELECT * FROM receipts ORDER BY life_id,command_id').all();
    await act(async () => { expect(await mockStore.getState().selectLife(newborn.id)).toBe(true); }); expect(screen.queryByRole('button', { name: 'View Breakdown' })).toBeNull(); expect(screen.getByText('Personal finances · 2030 · USD')).toBeOnTheScreen(); expect(screen.getByText('No personal transactions recorded for 2030 in USD.')).toBeOnTheScreen();
    const before = context.rows(), payload = encodeWorld(world()); await press(/^Financial Year\./); await press('Never mind'); expect(context.rows()).toEqual(before); expect(encodeWorld(world())).toBe(payload); expect(world()).toEqual(newborn);
    expect(context.sqlite.prepare('SELECT * FROM lives ORDER BY id').all()).toEqual(savedLifeRows); expect(context.sqlite.prepare('SELECT * FROM receipts ORDER BY life_id,command_id').all()).toEqual(savedReceipts); context.oldMoments(); view.unmount();
  } finally { context.close(); }
});
