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
import { accountFor } from '../../src/game/systems/common';
import { moveQuote, moveReason, relocationFee } from '../../src/game/systems/relocation';
import { formatMoney } from '../../src/game/money';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import archive from '../fixtures/v20-relocation-archive.json';

let mockStore: ReturnType<typeof createGameStore>, mockRoute: string | undefined = 'work';
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() }, useLocalSearchParams: () => ({ route: mockRoute }) }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Emigrate from '../../app/(game)/emigrate';

const world = () => mockStore.getState().world!;
const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><Emigrate /><PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const modal = () => within(screen.UNSAFE_getByType(Modal));
const ack = (value: World) => resolveCommand(value, { type: 'acknowledge', resultId: value.pending!.id }, true);
const selectedLondon = () => {
  expect(screen.getByRole('button', { name: 'United Kingdom. London. Selected' })).toBeOnTheScreen();
  expect(screen.getByText('London, United Kingdom')).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: /^France\./ })).toBeNull();
  expect(screen.queryByText('Choose a country outside your current residence')).toBeNull();
};
async function setup(mode: 'fr-birth' | 'archive') {
  const directory = mkdtempSync(join(tmpdir(), 'dreams-emigration-country-')), path = join(directory, 'dreams.db'); let sqlite: DatabaseSync;
  const connect = (): SqlDatabase => {
    sqlite = new DatabaseSync(path); sqlite.exec('PRAGMA foreign_keys=ON'); const connection = sqlite;
    const session: SqlSession = { run: async (sql, values = []) => { connection.prepare(sql).run(...values); }, get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null, all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[] };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => { connection.exec('BEGIN IMMEDIATE'); try { const value = await action(session); connection.exec('COMMIT'); return value; } catch (error) { connection.exec('ROLLBACK'); throw error; } } };
  };
  const repository = new SaveRepository(connect()); await repository.initialise(); if (mode === 'archive') await repository.import(JSON.stringify(archive));
  const boot = async (repo: SaveRepository) => { mockStore = createGameStore({ repository: async () => repo, date: () => ({ year: 2000, month: 1, day: 1 }), id: () => 'life_french_emigration_default' }); expect(await mockStore.getState().bootstrap()).toBe(true); };
  await boot(repository);
  if (mode === 'fr-birth') { expect(await mockStore.getState().startLife({ ...randomCreation(904), country: 'FR', city: 'Paris', background: 'ordinary' }, 904)).toBe(true); expect(await mockStore.getState().acknowledgeBirth()).toBe(true); }
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  return { get sqlite() { return sqlite; }, rows, cold: async () => { sqlite.close(); await boot(new SaveRepository(connect())); }, oldMoments: () => { for (const point of archive.snapshots) expect(sqlite.prepare('SELECT payload FROM snapshots WHERE snapshot_id=?').get(point.summary.id)?.payload).toBe(point.payload); }, close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); } };
}
afterEach(() => { jest.restoreAllMocks(); });

test.each(['work', 'study', undefined])('French-born %s entry selects a visible foreign country while preserving the real age gate and every saved row', async route => {
  mockRoute = route; const db = await setup('fr-birth');
  try {
    const initial = world(), beforeRows = db.rows(), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), view = render(frame());
    expect(initial.people[initial.activePersonId]).toMatchObject({ country: 'FR', nationality: 'FR' }); selectedLondon();
    expect(screen.getByText('Apply to move abroad from age eighteen')).toBeOnTheScreen(); expect(screen.getByRole('button', { name: 'Review Application' })).toBeDisabled();
    await press(/^Japan\./); expect(screen.getByText('Tokyo, Japan')).toBeOnTheScreen(); await press(/^United Kingdom\./); selectedLondon();
    expect(world()).toEqual(initial); expect(db.rows()).toEqual(beforeRows); expect(unpack).not.toHaveBeenCalled(); view.unmount();
  } finally { db.close(); }
});

test('an actual Japan-to-France move reinitialises this actor’s foreign destination; the EUR application retains its quote through rollback, warm retry and cold result', async () => {
  // The unmodified v20 archive already contains actual Japanese work and native
  // accounts, plus its documented historically funded setup. France is reached
  // only through real application/departure UI commands with the saved RNG.
  mockRoute = 'work'; const db = await setup('archive');
  try {
    const original = world(); expect(original.people[original.activePersonId]).toMatchObject({ country: 'JP', nationality: 'US' });
    const oldMove = original.relocations[0], unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); let view = render(frame());
    await press('Plan Another Move'); expect(screen.getByRole('button', { name: 'France. Paris. Selected' })).toBeOnTheScreen();
    const application: GameCommand = { type: 'apply-relocation', destinationId: 'paris', route: 'work', roleId: 'administrator', program: null, field: null, quotedFee: relocationFee(original) }, applied = resolveCommand(original, application, true);
    expect(applied.relocations.at(-1)?.status).toBe('approved'); await press('Review Application'); await press('Submit Application'); expect(world()).toEqual(applied); await press('Continue'); expect(world()).toEqual(ack(applied));
    const approved = world(), offer = approved.relocations.at(-1)!; expect(moveReason(approved, offer)).toBeUndefined();
    const departure: GameCommand = { type: 'relocate', applicationId: offer.id, companionIds: [], reserveMonths: 3, reviewedQuote: moveQuote(approved, offer) }, moved = resolveCommand(approved, departure, true);
    await press('Review Move'); await press('Move Household'); expect(world()).toEqual(moved); await press('Continue'); const french = ack(moved); expect(world()).toEqual(french);
    expect(french.people[french.activePersonId]).toMatchObject({ country: 'FR', city: 'Paris', nationality: 'US' }); expect(french.relocations[0]).toEqual(oldMove);
    await press('Plan Another Move'); selectedLondon(); expect(screen.getByRole('button', { name: 'Review Application' })).toBeEnabled();
    const beforeRows = db.rows(), before = encodeWorld(french), fee = relocationFee(french), money = formatMoney({ minor: fee, currency: 'EUR' }); expect(accountFor(french).currency).toBe('EUR');
    await press('Review Application'); expect(modal().getByText('Apply to London?')).toBeOnTheScreen(); expect(modal().getByText(money)).toBeOnTheScreen(); await press('Never mind'); selectedLondon(); expect(db.rows()).toEqual(beforeRows); expect(encodeWorld(world())).toBe(before);
    await press('Review Application'); db.sqlite.exec("CREATE TRIGGER fail_country_application BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await press('Submit Application');
    await waitFor(() => expect(modal().getByRole('alert')).toHaveTextContent(/couldn't be saved/)); expect(screen.getAllByRole('alert')).toHaveLength(1); expect(modal().getByText('Apply to London?')).toBeOnTheScreen(); expect(modal().getByText(money)).toBeOnTheScreen(); expect(world()).toEqual(french); expect(db.rows()).toEqual(beforeRows);
    const expected = resolveCommand(french, { type: 'apply-relocation', destinationId: 'london', route: 'work', roleId: 'administrator', program: null, field: null, quotedFee: fee }, true);
    db.sqlite.exec('DROP TRIGGER fail_country_application'); await press('Submit Application'); expect(world()).toEqual(expected); expect(accountFor(world()).cash).toBe(accountFor(french).cash - fee); expect(world().people).toEqual(french.people); expect(world().workHistory).toEqual(french.workHistory); expect(world().relocations[0]).toEqual(oldMove); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    const savedRows = db.rows(); view.unmount(); await db.cold(); view = render(frame()); expect(world()).toEqual(expected); expect(db.rows()).toEqual(savedRows); expect(screen.getByText(expected.pending!.title)).toBeOnTheScreen(); await press('Continue'); const done = ack(expected); expect(world()).toEqual(done);
    const doneRows = db.rows(); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: expected.pending!.id })).toBe(false); }); expect(world()).toEqual(done); expect(db.rows()).toEqual(doneRows); db.oldMoments(); view.unmount();
  } finally { db.close(); }
});
