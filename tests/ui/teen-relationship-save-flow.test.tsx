import React from 'react';
import { Modal } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGameStore } from '../../src/state/gameStore';
import { ageOn, copyWorld, encodeWorld, fullName, validateWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { monthFrom } from '../../src/game/calendar';
import { relationFor } from '../../src/game/systems/relationships';
import { refreshTeenRelationships } from '../../src/game/systems/teenRelationships';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { acknowledgeTeen, teenEnd, teenProposal, teenRelationshipFixture } from '../support/teenRelationshipFixture';
import archive from '../fixtures/v28-native-school-archive.json';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';

let mockStore: ReturnType<typeof createGameStore>, mockPersonId = '';
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() }, useLocalSearchParams: () => ({ id: mockPersonId }) }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import PersonProfile from '../../app/(game)/person/[id]';
import Profile from '../../app/(game)/profile';
const frame = (profile = false) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{profile ? <Profile /> : <PersonProfile />}<PendingEvent /></ThemeProvider></SafeAreaProvider>;
const dateConfirm = () => within(screen.UNSAFE_getByType(Modal)).getByRole('button', { name: 'Ask on a First Date' });
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(name === 'Ask on a First Date' ? dateConfirm() : screen.getByRole('button', { name })); }); };
const openDate = () => press(/^Ask on a First Date\. An afternoon/);

async function setup() {
  const initial = teenRelationshipFixture(); mockPersonId = initial.peerId;
  const directory = mkdtempSync(join(tmpdir(), 'dreams-teen-relationships-')), file = join(directory, 'life.db'); let sqlite!: DatabaseSync, gate: Promise<void> | null = null;
  function connect(): SqlDatabase {
    sqlite = new DatabaseSync(file); sqlite.exec('PRAGMA foreign_keys=ON'); const db = sqlite;
    const session: SqlSession = { run: async (sql, values = []) => { db.prepare(sql).run(...values); }, get: async <T,>(sql: string, values: (string | number | null)[] = []) => db.prepare(sql).get(...values) as T ?? null, all: async <T,>(sql: string, values: (string | number | null)[] = []) => db.prepare(sql).all(...values) as T[] };
    return { ...session, exec: async sql => { db.exec(sql); }, transaction: async action => { db.exec('BEGIN IMMEDIATE'); try { const value = await action(session); db.exec('COMMIT'); return value; } catch (error) { db.exec('ROLLBACK'); throw error; } } };
  }
  let repository = new SaveRepository(connect()); await repository.initialise(); await repository.create(initial.world);
  // Retain actual immutable earlier-life payloads and metadata beside this
  // explicit eligibility/consent component fixture. No natural-life claim.
  const old = checkpoints.unpackCheckpoint(archive.checkpoint, true);
  sqlite.prepare('INSERT INTO lives(id,name,revision,updated_at,payload) VALUES(?,?,?,?,?)').run(old.id, fullName(old.people[old.activePersonId]), old.revision, '2026-10-20', archive.checkpoint);
  sqlite.prepare('INSERT INTO backups(life_id,revision,payload) VALUES(?,?,?)').run(old.id, old.revision, archive.checkpoint);
  for (const point of archive.snapshots) {
    sqlite.prepare('INSERT INTO snapshots(life_id,snapshot_id,payload) VALUES(?,?,?)').run(old.id, point.summary.id, point.payload);
    sqlite.prepare('INSERT INTO snapshot_metadata(life_id,snapshot_id,revision,metadata) VALUES(?,?,?,?)').run(old.id, point.summary.id, point.summary.revision, JSON.stringify(point.summary));
  }
  const boot = async () => { mockStore = createGameStore({ repository: async () => repository, date: () => initial.world.date, id: () => 'unused', yieldToUI: () => gate ?? Promise.resolve() }); expect(await mockStore.getState().bootstrap()).toBe(true); };
  await boot();
  return { ...initial, old, get sqlite() { return sqlite; }, get repository() { return repository; }, gate: (value: Promise<void> | null) => { gate = value; }, rows: () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])), cold: async () => { sqlite.close(); repository = new SaveRepository(connect()); await repository.initialise(); await boot(); }, close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); } };
}

test('actual Person first-date review retains a held failed save, retries warm, cold-resumes the same consent/result and acknowledges once', async () => {
  const context = await setup(); let view: ReturnType<typeof render> | undefined;
  try {
    const before = mockStore.getState().world!, original = encodeWorld(before), rows = context.rows(), command = teenProposal(before, context.peerId), predicted = resolveCommand(before, command, true);
    const commit = jest.spyOn(context.repository, 'commit'), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); view = render(frame());
    await openDate(); expect(context.rows()).toEqual(rows); await press('Never mind'); expect(context.rows()).toEqual(rows); await openDate();
    context.sqlite.exec("CREATE TRIGGER fail_teen_date BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    let release!: () => void; context.gate(new Promise(resolve => { release = resolve; }));
    act(() => { fireEvent.press(dateConfirm()); });
    expect(mockStore.getState().busy).toBe(true); expect(dateConfirm()).toBeDisabled(); expect(screen.getByRole('button', { name: 'Never mind' })).toBeDisabled();
    fireEvent.press(dateConfirm()); fireEvent.press(screen.getByRole('button', { name: 'Never mind' })); expect(context.rows()).toEqual(rows);
    context.gate(null); await act(async () => { release(); }); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/));
    expect(screen.getAllByRole('alert')).toHaveLength(1); expect(dateConfirm()).toBeEnabled(); expect(encodeWorld(mockStore.getState().world!)).toBe(original); expect(context.rows()).toEqual(rows);
    context.sqlite.exec('DROP TRIGGER fail_teen_date'); await press('Ask on a First Date');
    expect(mockStore.getState().world).toEqual(predicted); expect(commit).toHaveBeenCalledTimes(2); expect(unpack).not.toHaveBeenCalled(); expect(screen.getByText('Your first date')).toBeOnTheScreen(); expect(screen.getByText('You are seeing each other.')).toBeOnTheScreen();
    const saved = context.rows(); expect(saved.snapshots).toEqual(rows.snapshots); expect(saved.snapshot_metadata).toEqual(rows.snapshot_metadata); expect(context.sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(context.old.id)?.payload).toBe(archive.checkpoint); expect(context.sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(context.old.id)?.payload).toBe(archive.checkpoint);
    const backup = context.sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(before.id); expect(checkpoints.unpackCheckpoint(backup!.payload as string, true)).toEqual(before);
    view.unmount(); view = undefined; unpack.mockRestore(); commit.mockRestore(); await context.cold(); expect(mockStore.getState().world).toEqual(predicted); expect(context.rows()).toEqual(saved);
    view = render(frame()); expect(screen.getByText('Your first date')).toBeOnTheScreen(); await press('Continue'); const acknowledged = acknowledgeTeen(predicted); expect(mockStore.getState().world).toEqual(acknowledged);
    const doneRows = context.rows(); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: predicted.pending!.id })).toBe(false); }); expect(mockStore.getState().world).toEqual(acknowledged); expect(context.rows()).toEqual(doneRows);
    await press(/^End First Relationship/); const ending = resolveCommand(acknowledged, teenEnd(acknowledged, context.peerId), true);
    await act(async () => { fireEvent.press(within(screen.UNSAFE_getByType(Modal)).getByRole('button', { name: 'End Relationship' })); });
    expect(mockStore.getState().world).toEqual(ending); expect(screen.queryByText('You are seeing each other.')).toBeNull(); expect(screen.getByText(/Ended in/)).toBeOnTheScreen(); expect(ending.random).toEqual(acknowledged.random);
  } finally { view?.unmount(); jest.restoreAllMocks(); context.close(); }
}, 30000);

test('review survives unrelated revisions, rechecks actual eligibility and resets on actual selected-life/person change', async () => {
  const context = await setup(), view = render(frame());
  try {
    const before = mockStore.getState().world!, rows = context.rows(); await openDate();
    const unrelated = validateWorld({ ...copyWorld(before), revision: before.revision + 1 }, true); await act(async () => { mockStore.setState({ world: unrelated }); });
    expect(dateConfirm()).toBeOnTheScreen(); const changed = copyWorld(unrelated); relationFor(changed, changed.activePersonId, context.peerId)!.trust = 39;
    await act(async () => { mockStore.setState({ world: validateWorld(changed, true) }); }); const dispatch = jest.spyOn(mockStore.getState(), 'dispatch');
    expect(screen.getByRole('alert')).toHaveTextContent(/50% bond and 40% trust/); await press('Ask on a First Date'); expect(dispatch).not.toHaveBeenCalled(); expect(context.rows()).toEqual(rows); await press('Never mind'); dispatch.mockRestore();
    await act(async () => { mockStore.setState({ world: before }); }); await openDate();
    await act(async () => { expect(await mockStore.getState().selectLife(context.old.id)).toBe(true); }); expect(screen.queryByRole('button', { name: 'Ask on a First Date' })).toBeNull();
    await act(async () => { expect(await mockStore.getState().selectLife(before.id)).toBe(true); }); expect(screen.UNSAFE_queryAllByType(Modal)).toHaveLength(0); expect(mockStore.getState().world).toEqual(before);
    await openDate(); mockPersonId = before.relationships.find(row => row.kind === 'parent' && row.to === before.activePersonId)!.from; view.rerender(frame()); expect(screen.queryByRole('button', { name: 'Ask on a First Date' })).toBeNull();
  } finally { view.unmount(); jest.restoreAllMocks(); context.close(); }
}, 30000);

test('actual Profile identifies a teen and a mixed-age ongoing pair without undefined marital status or marriage controls', async () => {
  const context = await setup(); let view: ReturnType<typeof render> | undefined;
  try {
    const dated = acknowledgeTeen(resolveCommand(context.world, teenProposal(context.world, context.peerId), true)); await act(async () => { mockStore.setState({ world: dated }); });
    view = render(frame(true)); expect(screen.getByText('In a relationship')).toBeOnTheScreen(); expect(screen.queryByText('Married')).toBeNull(); view.unmount();
    const mixed = copyWorld(dated), younger = [mixed.people[mixed.activePersonId], mixed.people[context.peerId]].sort((a, b) => a.born.year - b.born.year || a.born.month - b.born.month || a.born.day - b.born.day)[0];
    mixed.date = monthFrom(younger.born, 18 * 12); refreshTeenRelationships(mixed); const world = validateWorld(mixed, true);
    expect(Math.max(ageOn(world.people[world.activePersonId], world.date), ageOn(world.people[context.peerId], world.date))).toBe(18);
    await act(async () => { mockStore.setState({ world }); }); view = render(frame(true)); expect(screen.getByText('In a relationship')).toBeOnTheScreen(); view.unmount();
    view = render(frame()); expect(screen.getByRole('button', { name: /^End First Relationship/ })).toBeOnTheScreen(); expect(screen.queryByRole('button', { name: /^Plan Your Wedding/ })).toBeNull(); expect(screen.queryByRole('button', { name: /^Propose\./ })).toBeNull();
  } finally { view?.unmount(); context.close(); }
}, 30000);
