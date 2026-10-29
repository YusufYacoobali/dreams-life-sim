import React from 'react';
import { Modal } from 'react-native';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { decodeWorld, encodeWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { divorceQuote } from '../../src/game/systems/family';
import { otherPerson, partnerRelation } from '../../src/game/systems/relationships';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { database } from '../support/sqlite';
import { ThemeProvider } from '../../src/ui/theme';
import { relationFor } from '../../src/game/systems/relationships';
import fixture from '../fixtures/v3-employed-graduate.json';
import marriage from '../fixtures/v5-marriage-result.json';
let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import MeetPeople from '../../app/(game)/meet-people';
import { PendingEvent } from '../../src/ui/PendingEvent';
import Divorce from '../../app/(game)/divorce';
import { EventModal } from '../../src/ui/EventModal';

test('an introduction selected in the native UI persists the chosen person and relationship in SQLite', async () => {
  const { sqlite, driver } = database(); const repository = new SaveRepository(driver); await repository.initialise();
  const initial = decodeWorld(JSON.stringify(fixture)); await repository.create(initial);
  mockStore = createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'life_unused' }); await mockStore.getState().bootstrap();
  const view = render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><MeetPeople /><PendingEvent /></ThemeProvider></SafeAreaProvider>);
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Meet Potential Dates' })); });
  await waitFor(() => expect(screen.getByText('Someone new')).toBeOnTheScreen());
  const decision = mockStore.getState().world!.pending; if (decision?.kind !== 'decision') throw new Error('Expected introductions');
  const chosen = decision.choices[1];
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: chosen.label })); });
  await waitFor(() => expect(screen.getByText('Introductions made')).toBeOnTheScreen());
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Continue' })); });
  const restored = (await repository.load(initial.id))!;
  expect(relationFor(restored, restored.activePersonId, chosen.id)).toBeDefined();
  expect(restored.people[chosen.id]).toEqual(mockStore.getState().world!.people[chosen.id]);
  expect(screen.getByRole('button', { name: 'Meet Potential Dates' })).toBeDisabled();
  view.unmount(); sqlite.close();
});

test('the actual married couple retains a failed divorce review, rejects obsolete callbacks and commits its exact settlement once through closed-file SQLite', async () => {
  // Genuine existing marriage, then one ordinary paid afternoon together. No
  // people, balances, ages, dates, statistics or outcome streams are replaced.
  let initial = decodeWorld(JSON.stringify(marriage));
  initial = resolveCommand(initial, { type: 'acknowledge', resultId: initial.pending!.id }, true);
  const spouseId = otherPerson(initial, partnerRelation(initial)!).id;
  initial = resolveCommand(initial, { type: 'interact', personId: spouseId, action: 'spend-time' }, true);
  initial = resolveCommand(initial, { type: 'acknowledge', resultId: initial.pending!.id }, true);
  const quote = divorceQuote(initial, spouseId), command = { type: 'divorce' as const, personId: spouseId, custody: 'shared' as const, quotedPayment: quote.signed };
  expect(quote.amount).toBeGreaterThan(0n);
  const directory = mkdtempSync(join(tmpdir(), 'dreams-divorce-review-')), path = join(directory, 'dreams.db');
  let sqlite!: DatabaseSync, repository: SaveRepository, nextYield: Promise<void> | undefined, view: ReturnType<typeof render> | undefined;
  const connect = (): SqlDatabase => {
    const connection = sqlite = new DatabaseSync(path); connection.exec('PRAGMA foreign_keys=ON');
    const session: SqlSession = {
      run: async (sql, values = []) => { connection.prepare(sql).run(...values); },
      get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null,
      all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[],
    };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => { connection.exec('BEGIN IMMEDIATE'); try { const value = await action(session); connection.exec('COMMIT'); return value; } catch (error) { connection.exec('ROLLBACK'); throw error; } } };
  };
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])) as Record<string, Record<string, unknown>[]>;
  const bootstrap = async () => {
    mockStore = createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'unused', yieldToUI: async () => { const held = nextYield; nextYield = undefined; if (held) await held; } });
    expect(await mockStore.getState().bootstrap()).toBe(true);
  };
  const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><Divorce /><PendingEvent /></ThemeProvider></SafeAreaProvider>;
  const press = async (name: string) => { await act(async () => fireEvent.press(screen.getByRole('button', { name }))); };
  const confirmation = () => screen.UNSAFE_getAllByType(EventModal).find(item => item.props.event?.kind === 'confirmation')!;
  repository = new SaveRepository(connect());
  try {
    await repository.initialise(); await repository.create(initial); await bootstrap(); view = render(frame());
    expect(screen.getByText('You have no shared dependent children with ' + initial.people[spouseId].firstName + ' ' + initial.people[spouseId].lastName + '. No new custody arrangement will be recorded.')).toBeOnTheScreen();
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    await press('Review Divorce'); const first = confirmation().props, reviewed = first.event;
    // An ordinary non-financial action changes revision, not this reviewed
    // couple, quote or childless care context. Keep the exact draft.
    await act(async () => {
      expect(await mockStore.getState().dispatch({ type: 'meditate' })).toBe(true);
      expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: mockStore.getState().world!.pending!.id })).toBe(true);
    });
    expect(confirmation().props.event).toBe(reviewed);
    initial = mockStore.getState().world!;
    const before = rows(), beforeWorld = encodeWorld(initial);
    expect(Object.keys(before)).toHaveLength(8);
    sqlite.exec("CREATE TRIGGER fail_divorce BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    await press('Confirm Divorce'); await waitFor(() => expect(mockStore.getState().error).toMatch(/couldn't be saved/));
    expect(rows()).toEqual(before); expect(encodeWorld(mockStore.getState().world!)).toBe(beforeWorld);
    expect(screen.queryByText('End your marriage?')).toBeOnTheScreen();
    expect(confirmation().props.event).toBe(reviewed); expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/);
    expect(screen.getAllByText(/couldn't be saved/)).toHaveLength(1);
    await act(async () => { first.onCancel(); await first.onChoose('confirm'); });
    expect(screen.queryByText('End your marriage?')).toBeNull(); expect(rows()).toEqual(before);
    await press('Review Divorce'); const second = confirmation().props;
    await act(async () => { first.onCancel(); await first.onChoose('confirm'); });
    expect(confirmation().props.event).toBe(second.event); expect(rows()).toEqual(before);
    // Unmount and return while still married: the abandoned route's closures
    // cannot confirm or cancel the new route's exact review.
    view.unmount(); view = render(frame()); await press('Review Divorce'); const current = confirmation().props;
    await act(async () => { second.onCancel(); await second.onChoose('confirm'); });
    expect(confirmation().props.event).toBe(current.event); expect(rows()).toEqual(before);
    sqlite.exec('DROP TRIGGER fail_divorce');
    let release!: () => void; nextYield = new Promise<void>(resolve => { release = resolve; });
    await act(async () => { void current.onChoose('confirm'); void current.onChoose('confirm'); current.onCancel(); });
    expect(mockStore.getState().busy).toBe(true); expect(rows()).toEqual(before);
    expect(screen.getByRole('button', { name: 'Confirm Divorce' })).toBeDisabled(); expect(screen.getByRole('button', { name: 'Never mind' })).toBeDisabled();
    await act(async () => screen.UNSAFE_getByType(Modal).props.onRequestClose());
    expect(confirmation().props.event).toBe(current.event);
    await act(async () => release());
    const expected = resolveCommand(initial, command, true);
    expect(mockStore.getState().world).toEqual(expected); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    expect(rows().receipts).toHaveLength(before.receipts.length + 1);
    expect(sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(initial.id)?.payload).toBe(before.lives.find(row => row.id === initial.id)!.payload);
    expect(expected.marriages.at(-1)?.endReason).toBe('divorce');
    expect(expected.ledger.filter(row => row.category === 'settlement')).not.toHaveLength(0);
    const committed = rows(); view.unmount(); view = undefined; sqlite.close();
    repository = new SaveRepository(connect()); await bootstrap(); view = render(frame());
    expect(rows()).toEqual(committed); expect(mockStore.getState().world).toEqual(expected);
    await press('Continue'); const done = mockStore.getState().world!, acknowledged = rows();
    expect(done.pending).toBeNull(); expect(done.revision).toBe(initial.revision + 2); expect(done.ledger).toEqual(expected.ledger); expect(done.people).toEqual(expected.people);
    await act(async () => { await current.onChoose('confirm'); expect(await mockStore.getState().dispatch(command)).toBe(false); expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: expected.pending!.id })).toBe(false); });
    expect(rows()).toEqual(acknowledged);
  } finally { jest.restoreAllMocks(); view?.unmount(); sqlite.close(); rmSync(directory, { recursive: true, force: true }); }
}, 30000);
