import React from 'react';
import { Modal } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGameStore } from '../../src/state/gameStore';
import { copyWorld, encodeWorld, fullName, World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { hobbyContacts } from '../../src/game/systems/leisure';
import * as leisure from '../../src/game/systems/leisure';
import { activeHobbyPlan } from '../../src/game/systems/leisureSchemas';
import { SaveRepository, SqlDatabase, SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import archive from '../fixtures/v28-ordinary-hobby-archive.json';

let mockStore: ReturnType<typeof createGameStore>, mockKind = 'reading';
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() }, useLocalSearchParams: () => ({ kind: mockKind }) }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import { router } from 'expo-router';
import Hobby from '../../app/(game)/hobby/[kind]';
const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><Hobby /><PendingEvent /></ThemeProvider></SafeAreaProvider>;
const world = () => mockStore.getState().world!;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const modal = () => within(screen.UNSAFE_getByType(Modal));
const acknowledge = (initial: World) => resolveCommand(initial, { type: 'acknowledge', resultId: initial.pending!.id }, true);
const hobby = () => world().hobbies.find(item => item.kind === mockKind)!;

async function setup() {
  const directory = mkdtempSync(join(tmpdir(), 'dreams-hobby-introduction-')), path = join(directory, 'dreams.db'); let sqlite: DatabaseSync;
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
  const bootstrap = async (repo: SaveRepository) => { mockStore = createGameStore({ repository: async () => repo, date: () => ({ year: 2026, month: 10, day: 20 }), id: () => 'unused', yieldToUI: async () => { const pause = nextYield; nextYield = undefined; if (pause) await pause; } }); expect(await mockStore.getState().bootstrap()).toBe(true); };
  await bootstrap(repository); expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: world().pending!.id })).toBe(true); mockKind = 'reading';
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  return { get sqlite() { return sqlite; }, repository, rows, pauseNextSave,
    cold: async () => { sqlite.close(); await bootstrap(new SaveRepository(connect())); },
    oldMoments: () => { for (const point of archive.snapshots) expect(sqlite.prepare('SELECT payload FROM snapshots WHERE snapshot_id=?').get(point.summary.id)?.payload).toBe(point.payload); },
    close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); },
  };
}

// Genuine saved nine-year-old with already paid current guitar/reading access.
// No age, attendance, permission, funds, person or RNG override is made here.
test('the actual attended introduction retains one failed review, retries without unpack, and resumes the same person/result after reopening all eight SQLite tables', async () => {
  const context = await setup();
  try {
    const initial = world(), currentHobby = hobby(), plan = activeHobbyPlan(currentHobby)!, beforeRows = context.rows(); expect(Object.keys(beforeRows)).toHaveLength(8);
    const expected = resolveCommand(initial, { type: 'meet-hobby-peer', hobbyId: currentHobby.id, planId: plan.id, reviewedPayerId: plan.payerId, reviewedMonth: initial.date.year * 12 + initial.date.month - 1 }, true), peer = hobbyContacts(expected, expected.hobbies.find(item => item.id === currentHobby.id)!)[0];
    let view = render(frame()); const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    const expectTerms = () => { expect(modal().getByText('An Introduction After Practice?')).toBeOnTheScreen(); expect(modal().getByText('Current month already attended and paid')).toBeOnTheScreen(); expect(modal().getByText(fullName(initial.people[plan.payerId]))).toBeOnTheScreen(); expect(modal().getByText('One in this hobby during ' + initial.date.year)).toBeOnTheScreen(); };
    expect(screen.getByRole('button', { name: 'Review Hobby Routine' })).toBeDisabled(); await press('Review Hobby Routine'); expect(screen.queryByRole('button', { name: 'Make an Introduction' })).toBeNull();
    await press('Review Practice Introduction'); expectTerms(); await press('Never mind'); expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows); expect(unpack).not.toHaveBeenCalled();
    await press('Review Practice Introduction'); context.sqlite.exec("CREATE TRIGGER fail_hobby_introduction BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press('Make an Introduction'); await waitFor(() => expect(modal().getByRole('alert')).toHaveTextContent(/couldn't be saved/)); expectTerms(); expect(screen.getAllByRole('alert')).toHaveLength(1); expect(screen.getAllByText(/couldn't be saved/)).toHaveLength(1); expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows); expect(hobbyContacts(world(), hobby())).toEqual([]);
    context.sqlite.exec('DROP TRIGGER fail_hobby_introduction'); const release = context.pauseNextSave(); await press('Make an Introduction'); expect(mockStore.getState().busy).toBe(true); expectTerms();
    expect(screen.getByRole('button', { name: 'Review Practice Introduction' })).toBeDisabled(); expect(screen.getByRole('button', { name: 'Stop Routine' })).toBeDisabled(); expect(screen.getByRole('button', { name: 'Extra Practice' })).toBeDisabled(); expect(modal().getByRole('button', { name: 'Never mind' })).toBeDisabled(); expect(screen.getAllByRole('button', { busy: true })).toHaveLength(1); expect(modal().getByRole('button', { name: 'Make an Introduction', busy: true })).toBeOnTheScreen();
    await press('Make an Introduction'); await press('Never mind'); await act(async () => { screen.UNSAFE_getByType(Modal).props.onRequestClose(); }); expectTerms(); expect(context.rows()).toEqual(beforeRows);
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false)); expect(screen.queryByText('An Introduction After Practice?')).toBeNull(); expect(world()).toEqual(expected); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    expect(world().accounts.slice(0, initial.accounts.length)).toEqual(initial.accounts); expect(world().ledger).toEqual(initial.ledger); expect(world().hobbies).toEqual(initial.hobbies);
    const savedRows = context.rows(); view.unmount(); await context.cold(); view = render(frame()); expect(world()).toEqual(expected); expect(context.rows()).toEqual(savedRows);
    expect(hobbyContacts(world(), hobby()).map(person => person.id)).toEqual([peer.id]); await press('Continue'); expect(world()).toEqual(acknowledge(expected)); expect(world().people).toEqual(expected.people); expect(world().relationships).toEqual(expected.relationships); expect(world().random).toEqual(expected.random);
    expect(screen.getByRole('button', { name: 'Review Practice Introduction' })).toBeDisabled(); expect(screen.getByText('You already made an introduction in this hobby this calendar year')).toBeOnTheScreen();
    const finished = encodeWorld(world()), rows = context.rows(), readUnpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); await press('Review Practice Introduction'); await press(new RegExp('^' + fullName(peer) + '\\. Met through practice')); expect(router.push).toHaveBeenLastCalledWith({ pathname: '/person/[id]', params: { id: peer.id } }); expect(encodeWorld(world())).toBe(finished); expect(context.rows()).toEqual(rows); expect(readUnpack).not.toHaveBeenCalled();
    await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: expected.pending!.id })).toBe(false); }); expect(context.rows()).toEqual(rows); context.oldMoments(); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});

test('a same-person real revision retains the failed review; changing hobby route clears it and saves nothing', async () => {
  const context = await setup();
  try {
    const view = render(frame()); await press('Review Practice Introduction'); context.sqlite.exec("CREATE TRIGGER fail_hobby_introduction BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await press('Make an Introduction'); await waitFor(() => expect(modal().getByRole('alert')).toBeOnTheScreen()); context.sqlite.exec('DROP TRIGGER fail_hobby_introduction');
    // An actual other hobby's extra practice changes revision, not this identity.
    const guitar = world().hobbies.find(item => item.kind === 'guitar')!, plan = activeHobbyPlan(guitar)!;
    await act(async () => { expect(await mockStore.getState().dispatch({ type: 'practise-hobby', hobbyId: guitar.id, planId: plan.id })).toBe(true); expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: world().pending!.id })).toBe(true); });
    expect(modal().getByText('An Introduction After Practice?')).toBeOnTheScreen(); const before = encodeWorld(world()), rows = context.rows(), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    mockKind = 'guitar'; view.rerender(frame()); expect(screen.queryByText('An Introduction After Practice?')).toBeNull(); expect(screen.getByRole('radio', { name: 'Community access', checked: true })).toBeOnTheScreen(); mockKind = 'reading'; view.rerender(frame()); expect(screen.queryByRole('button', { name: 'Make an Introduction' })).toBeNull(); expect(encodeWorld(world())).toBe(before); expect(context.rows()).toEqual(rows); expect(unpack).not.toHaveBeenCalled(); context.oldMoments(); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});

test('a real life switch clears a review even when the saved child/hobby identifiers repeat', async () => {
  const context = await setup();
  try {
    // Identity-only second-life fixture, not a natural second generation.
    const initial = world(), other = copyWorld(initial); other.id = 'life_other_hobby_introduction'; await context.repository.create(other); expect(await mockStore.getState().selectLife(initial.id)).toBe(true);
    const view = render(frame()); await press('Review Practice Introduction'); const lives = context.sqlite.prepare('SELECT * FROM lives ORDER BY id').all(), receipts = context.sqlite.prepare('SELECT * FROM receipts ORDER BY life_id,command_id').all(); await act(async () => { expect(await mockStore.getState().selectLife(other.id)).toBe(true); }); expect(screen.queryByText('An Introduction After Practice?')).toBeNull(); expect(screen.queryByRole('button', { name: 'Make an Introduction' })).toBeNull(); expect(hobbyContacts(world(), hobby())).toEqual([]); expect(context.sqlite.prepare('SELECT * FROM lives ORDER BY id').all()).toEqual(lives); expect(context.sqlite.prepare('SELECT * FROM receipts ORDER BY life_id,command_id').all()).toEqual(receipts); context.oldMoments(); view.unmount();
  } finally { context.close(); }
});

test('a retained review cannot silently use a later actually paid year of the same plan', async () => {
  const context = await setup();
  try {
    const original = world(), planId = activeHobbyPlan(hobby())!.id, view = render(frame()); await press('Review Practice Introduction');
    await act(async () => {
      expect(await mockStore.getState().dispatch({ type: 'advance' })).toBe(true); let guard = 0;
      while ((world().pending || world().annual) && guard++ < 150) {
        const current = world(), pending = current.pending;
        expect(await mockStore.getState().dispatch(pending?.kind === 'decision' ? { type: 'choose', eventId: pending.id, choiceId: pending.choices.find(choice => !choiceUnavailable(current, choice))!.id } : pending ? { type: 'acknowledge', resultId: pending.id } : { type: 'resume' })).toBe(true);
      }
      expect(guard).toBeLessThan(150);
    });
    expect(world().date.year).toBe(original.date.year + 1); expect(activeHobbyPlan(hobby())!.id).toBe(planId); expect(hobby().practices.some(row => row.source === 'monthly' && row.attended && row.date.year === world().date.year && row.date.month === world().date.month)).toBe(true);
    expect(modal().getByText('One in this hobby during ' + original.date.year)).toBeOnTheScreen(); const before = encodeWorld(world()), rows = context.rows(), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    await press('Make an Introduction'); await waitFor(() => expect(modal().getByRole('alert')).toHaveTextContent('The attended month changed; review this introduction')); expect(encodeWorld(world())).toBe(before); expect(context.rows()).toEqual(rows); expect(unpack).not.toHaveBeenCalled(); expect(hobbyContacts(world(), hobby())).toEqual([]);
    await press('Never mind'); await press('Review Practice Introduction'); expect(modal().getByText('One in this hobby during ' + world().date.year)).toBeOnTheScreen(); await press('Never mind'); context.oldMoments(); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});

test('local mode edits, current choice and cancelled reviews reuse the memoized contact view without a save or population work', async () => {
  const context = await setup();
  try {
    const initial = world(), rows = context.rows(), contacts = jest.spyOn(leisure, 'hobbyContacts'), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), view = render(frame());
    expect(contacts).toHaveBeenCalledTimes(1);
    await press('Review Hobby Routine'); expect(screen.queryByRole('button', { name: 'Ask For This Routine' })).toBeNull();
    await act(async () => { fireEvent.press(screen.getByRole('radio', { name: 'Guided lessons' })); }); await press('Review Hobby Routine'); await press('Never mind');
    await act(async () => { fireEvent.press(screen.getByRole('radio', { name: 'Community access' })); }); await press('Review Practice Introduction'); await press('Never mind');
    expect(contacts).toHaveBeenCalledTimes(1); expect(world()).toBe(initial); expect(context.rows()).toEqual(rows); expect(unpack).not.toHaveBeenCalled(); context.oldMoments(); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});
