import React, { useState } from 'react';
import { Modal, Text } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGameStore } from '../../src/state/gameStore';
import { copyWorld, encodeWorld, fullName, validateWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { randomInteger } from '../../src/game/random';
import { relationFor } from '../../src/game/systems/relationships';
import { SaveRepository, SqlDatabase, SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { bestFriendsFixture, friendshipEnd, friendshipProposal } from '../support/bestFriendsFixture';
import archive from '../fixtures/v28-native-school-archive.json';
import { ThemeProvider } from '../../src/ui/theme';
import { BestFriendshipCard } from '../../src/ui/BestFriendship';
import { PendingEvent } from '../../src/ui/PendingEvent';

let mockStore: ReturnType<typeof createGameStore>, mockPersonId = '';
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
function Content() {
  const world = require('zustand').useStore(mockStore, (state: ReturnType<typeof mockStore.getState>) => state.world)!, error = require('zustand').useStore(mockStore, (state: ReturnType<typeof mockStore.getState>) => state.error);
  const [review, setReview] = useState(false);
  return <>{!review && error && <Text accessibilityRole="alert">{error}</Text>}<BestFriendshipCard world={world} personId={mockPersonId} onReviewChange={setReview} /><PendingEvent /></>;
}
const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><Content /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };

async function fixture() {
  const setup = bestFriendsFixture(), initial = copyWorld(setup.world);
  // Explicit consenting-response component setup; not natural consent coverage.
  for (let seed = 1; seed < 10000; seed++) if (randomInteger(seed, 1, 100).value <= 95) { initial.random.npcs = seed; break; }
  const world = validateWorld(initial, true); mockPersonId = setup.friendId;
  const directory = mkdtempSync(join(tmpdir(), 'dreams-best-friends-')), file = join(directory, 'life.db'); let sqlite!: DatabaseSync, saveGate: Promise<void> | null = null;
  function connect(): SqlDatabase {
    sqlite = new DatabaseSync(file); sqlite.exec('PRAGMA foreign_keys=ON'); const connection = sqlite;
    const session: SqlSession = { run: async (sql, values = []) => { connection.prepare(sql).run(...values); }, get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null, all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[] };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => { connection.exec('BEGIN IMMEDIATE'); try { const result = await action(session); connection.exec('COMMIT'); return result; } catch (error) { connection.exec('ROLLBACK'); throw error; } } };
  }
  let repository = new SaveRepository(connect()); await repository.initialise(); await repository.create(world);
  const old = checkpoints.unpackCheckpoint(archive.checkpoint, true);
  sqlite.prepare('INSERT INTO lives(id,name,revision,updated_at,payload) VALUES(?,?,?,?,?)').run(old.id, fullName(old.people[old.activePersonId]), old.revision, '2026-10-20', archive.checkpoint);
  sqlite.prepare('INSERT INTO backups(life_id,revision,payload) VALUES(?,?,?)').run(old.id, old.revision, archive.checkpoint);
  for (const point of archive.snapshots) {
    sqlite.prepare('INSERT INTO snapshots(life_id,snapshot_id,payload) VALUES(?,?,?)').run(old.id, point.summary.id, point.payload);
    sqlite.prepare('INSERT INTO snapshot_metadata(life_id,snapshot_id,revision,metadata) VALUES(?,?,?,?)').run(old.id, point.summary.id, point.summary.revision, JSON.stringify(point.summary));
  }
  const boot = async () => { mockStore = createGameStore({ repository: async () => repository, date: () => world.date, id: () => 'unused', yieldToUI: () => saveGate ?? Promise.resolve() }); expect(await mockStore.getState().bootstrap()).toBe(true); };
  await boot();
  return { world, friendId: setup.friendId, old, get sqlite() { return sqlite; }, get repository() { return repository; }, gate: (value: Promise<void> | null) => { saveGate = value; }, rows: () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])), cold: async () => { sqlite.close(); repository = new SaveRepository(connect()); await repository.initialise(); await boot(); }, close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); } };
}

test('opening/cancelling is read-only; held failed consent preserves one exact review/RNG, retries warm, cold-resumes and acknowledges once before an explicit ending', async () => {
  const context = await fixture(); let view: ReturnType<typeof render> | undefined;
  try {
    const before = mockStore.getState().world!, original = encodeWorld(before), rows = context.rows(), command = friendshipProposal(before, context.friendId), predicted = resolveCommand(before, command, true);
    const commit = jest.spyOn(context.repository, 'commit'), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); view = render(frame());
    expect(screen.queryByText('You are best friends.')).toBeNull(); await press(/^Become Best Friends/); expect(screen.getByText(/They can say no/)).toBeOnTheScreen(); await press('Never mind');
    expect(commit).not.toHaveBeenCalled(); expect(unpack).not.toHaveBeenCalled(); expect(context.rows()).toEqual(rows); expect(mockStore.getState().world).toBe(before);
    await press(/^Become Best Friends/); context.sqlite.exec("CREATE TRIGGER fail_friendship BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    let release!: () => void; context.gate(new Promise(resolve => { release = resolve; })); act(() => { fireEvent.press(screen.getByRole('button', { name: 'Ask to Be Best Friends' })); });
    expect(mockStore.getState().busy).toBe(true); expect(screen.getByRole('button', { name: 'Ask to Be Best Friends' })).toBeDisabled(); expect(screen.getByRole('button', { name: 'Never mind' })).toBeDisabled();
    fireEvent.press(screen.getByRole('button', { name: 'Ask to Be Best Friends' })); fireEvent.press(screen.getByRole('button', { name: 'Never mind' })); expect(context.rows()).toEqual(rows);
    context.gate(null); await act(async () => { release(); }); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/));
    expect(screen.getAllByRole('alert')).toHaveLength(1); expect(screen.getByRole('button', { name: 'Ask to Be Best Friends' })).toBeEnabled(); expect(encodeWorld(mockStore.getState().world!)).toBe(original); expect(context.rows()).toEqual(rows);
    context.sqlite.exec('DROP TRIGGER fail_friendship'); await press('Ask to Be Best Friends');
    expect(mockStore.getState().world).toEqual(predicted); expect(commit).toHaveBeenCalledTimes(2); expect(unpack).not.toHaveBeenCalled(); expect(screen.queryByRole('button', { name: 'Ask to Be Best Friends' })).toBeNull(); expect(screen.getByText('You are best friends.')).toBeOnTheScreen();
    expect(context.sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(context.old.id)?.payload).toBe(archive.checkpoint); expect(context.sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(context.old.id)?.payload).toBe(archive.checkpoint);
    const saved = context.rows(); expect(saved.snapshots).toEqual(rows.snapshots); expect(saved.snapshot_metadata).toEqual(rows.snapshot_metadata); view.unmount(); view = undefined; unpack.mockRestore(); commit.mockRestore();
    await context.cold(); expect(mockStore.getState().world).toEqual(predicted); expect(context.rows()).toEqual(saved); view = render(frame()); expect(screen.getByText('Your best friend')).toBeOnTheScreen(); await press('Continue');
    const acknowledged = resolveCommand(predicted, { type: 'acknowledge', resultId: predicted.pending!.id }, true); expect(mockStore.getState().world).toEqual(acknowledged); const doneRows = context.rows();
    await act(async () => { expect(await mockStore.getState().dispatch(command)).toBe(false); }); expect(context.rows()).toEqual(doneRows); expect(mockStore.getState().world).toEqual(acknowledged);
    await press(/^End Best Friendship/); const ending = resolveCommand(acknowledged, friendshipEnd(acknowledged, context.friendId), true); await act(async () => { fireEvent.press(within(screen.UNSAFE_getByType(Modal)).getByRole('button', { name: 'End Best Friendship' })); }); expect(mockStore.getState().world).toEqual(ending); expect(screen.queryByText('You are best friends.')).toBeNull(); expect(screen.getByText(/Both agreed; ended/)).toBeOnTheScreen(); expect(ending.random).toEqual(acknowledged.random);
  } finally { view?.unmount(); jest.restoreAllMocks(); context.close(); }
}, 30000);

test('same-context revisions retain a reviewed draft, changed actual life/person/place clears it, and changed eligibility is rechecked without dispatch', async () => {
  const context = await fixture(), view = render(frame());
  try {
    const before = mockStore.getState().world!, rows = context.rows(); await press(/^Become Best Friends/);
    // Render-only context regression: no saved command, date, RNG or gameplay claim.
    const unrelated = validateWorld({ ...copyWorld(before), revision: before.revision + 1 }, true); await act(async () => { mockStore.setState({ world: unrelated }); });
    expect(screen.getByRole('button', { name: 'Ask to Be Best Friends' })).toBeOnTheScreen(); const changed = copyWorld(unrelated); relationFor(changed, changed.activePersonId, context.friendId)!.trust = 59;
    await act(async () => { mockStore.setState({ world: validateWorld(changed, true) }); }); const dispatch = jest.spyOn(mockStore.getState(), 'dispatch');
    expect(screen.getByRole('alert')).toHaveTextContent(/75% bond and 60% trust/); await press('Ask to Be Best Friends'); expect(dispatch).not.toHaveBeenCalled(); expect(context.rows()).toEqual(rows); await press('Never mind');
    await act(async () => { mockStore.setState({ world: before }); }); await press(/^Become Best Friends/);
    await act(async () => { expect(await mockStore.getState().selectLife(context.old.id)).toBe(true); }); expect(screen.queryByRole('button', { name: 'Ask to Be Best Friends' })).toBeNull();
    await act(async () => { expect(await mockStore.getState().selectLife(before.id)).toBe(true); }); expect(screen.queryByRole('button', { name: 'Ask to Be Best Friends' })).toBeNull(); expect(mockStore.getState().world).toEqual(before);
    await press(/^Become Best Friends/); mockPersonId = before.relationships.find(row => row.kind === 'parent' && row.to === before.activePersonId)!.from; view.rerender(frame()); expect(screen.queryByRole('button', { name: 'Ask to Be Best Friends' })).toBeNull();
    mockPersonId = context.friendId; view.rerender(frame()); expect(screen.queryByRole('button', { name: 'Ask to Be Best Friends' })).toBeNull();
  } finally { view.unmount(); jest.restoreAllMocks(); context.close(); }
}, 30000);
