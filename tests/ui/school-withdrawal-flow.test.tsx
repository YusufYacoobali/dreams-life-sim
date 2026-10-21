import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { router } from 'expo-router';
import { createGameStore } from '../../src/state/gameStore';
import { encodeWorld, fullName } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { currentSchool } from '../../src/game/systems/schoolSchemas';
import { SaveRepository, SqlDatabase, SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { pupil } from '../support/pupil';
import archive from '../fixtures/v28-native-school-archive.json';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';

let mockStore: ReturnType<typeof createGameStore>, mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() }, useLocalSearchParams: () => mockParams }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import School from '../../app/(game)/school';
import SchoolContacts from '../../app/(game)/school-contacts';
import Education from '../../app/(game)/education';
const frame = (content = <School />) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{content}<PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };

async function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'dreams-school-withdrawal-')), file = join(directory, 'life.db'); let sqlite!: DatabaseSync, saveGate: Promise<void> | null = null;
  function connect(): SqlDatabase {
    sqlite = new DatabaseSync(file); sqlite.exec('PRAGMA foreign_keys=ON'); const connection = sqlite;
    const session: SqlSession = { run: async (sql, values = []) => { connection.prepare(sql).run(...values); }, get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null, all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[] };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => { connection.exec('BEGIN IMMEDIATE'); try { const result = await action(session); connection.exec('COMMIT'); return result; } catch (error) { connection.exec('ROLLBACK'); throw error; } } };
  }
  let repository = new SaveRepository(connect()); await repository.initialise(); const initial = pupil('US', 16); initial.id = 'life_withdrawal_student'; await repository.create(initial);
  // A genuine old inactive life/moments are installed as exact fixture bytes;
  // the eligible student is a declared ordinary age-boundary unit-test fixture.
  const old = checkpoints.unpackCheckpoint(archive.checkpoint, true);
  sqlite.prepare('INSERT INTO lives(id,name,revision,updated_at,payload) VALUES(?,?,?,?,?)').run(old.id, fullName(old.people[old.activePersonId]), old.revision, '2026-10-20', archive.checkpoint);
  sqlite.prepare('INSERT INTO backups(life_id,revision,payload) VALUES(?,?,?)').run(old.id, old.revision, archive.checkpoint);
  for (const point of archive.snapshots) {
    sqlite.prepare('INSERT INTO snapshots(life_id,snapshot_id,payload) VALUES(?,?,?)').run(old.id, point.summary.id, point.payload);
    sqlite.prepare('INSERT INTO snapshot_metadata(life_id,snapshot_id,revision,metadata) VALUES(?,?,?,?)').run(old.id, point.summary.id, point.summary.revision, JSON.stringify(point.summary));
  }
  const boot = async () => { mockStore = createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'unused', yieldToUI: () => saveGate ?? Promise.resolve() }); expect(await mockStore.getState().bootstrap()).toBe(true); };
  await boot();
  return { initial, old, get sqlite() { return sqlite; }, get repository() { return repository; }, gate: (value: Promise<void> | null) => { saveGate = value; }, rows: () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])), cold: async () => { sqlite.close(); repository = new SaveRepository(connect()); await repository.initialise(); await boot(); }, close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); } };
}

test('withdrawal reviews and cancels without writes, keeps one failed review, retries warm, and reopens the exact on-disk result before acknowledgement once', async () => {
  const context = await fixture(); let view: ReturnType<typeof render> | undefined;
  try {
    const before = mockStore.getState().world!, school = currentSchool(before)!, original = encodeWorld(before), originalRows = context.rows();
    const command = { type: 'school-withdraw' as const, communityId: school.id, country: school.country, city: school.city, school: school.school }, predicted = resolveCommand(before, command, true);
    const commit = jest.spyOn(context.repository, 'commit'), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); view = render(frame());
    await act(async () => { mockStore.setState({ busy: true }); }); expect(screen.getByRole('button', { name: /^Withdraw from Secondary School/ })).toBeDisabled();
    fireEvent.press(screen.getByRole('button', { name: /^Withdraw from Secondary School/ })); expect(screen.queryByRole('button', { name: 'Withdraw from School' })).toBeNull(); await act(async () => { mockStore.setState({ busy: false }); });
    await press(/^Withdraw from Secondary School/); expect(screen.getByText(/Withdraw from .* before completing/)).toBeOnTheScreen(); await press('Never mind');
    expect(commit).not.toHaveBeenCalled(); expect(unpack).not.toHaveBeenCalled(); expect(context.rows()).toEqual(originalRows); expect(mockStore.getState().world).toBe(before);

    await press(/^Withdraw from Secondary School/); context.sqlite.exec("CREATE TRIGGER fail_withdrawal BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    let release!: () => void; context.gate(new Promise(resolve => { release = resolve; })); act(() => { fireEvent.press(screen.getByRole('button', { name: 'Withdraw from School' })); });
    expect(mockStore.getState().busy).toBe(true); expect(screen.getByRole('button', { name: 'Withdraw from School' })).toBeDisabled(); expect(screen.getByRole('button', { name: 'Never mind' })).toBeDisabled();
    fireEvent.press(screen.getByRole('button', { name: 'Withdraw from School' })); fireEvent.press(screen.getByRole('button', { name: 'Never mind' })); expect(context.rows()).toEqual(originalRows);
    context.gate(null); await act(async () => { release(); }); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/));
    expect(screen.getAllByRole('alert')).toHaveLength(1); expect(screen.getByRole('button', { name: 'Withdraw from School' })).toBeEnabled(); expect(encodeWorld(mockStore.getState().world!)).toBe(original); expect(context.rows()).toEqual(originalRows);
    await press('Never mind'); expect(screen.getAllByText(/couldn't be saved/)).toHaveLength(1); await press(/^Withdraw from Secondary School/); expect(screen.getAllByRole('alert')).toHaveLength(1);
    context.sqlite.exec('DROP TRIGGER fail_withdrawal'); await press('Withdraw from School');
    expect(mockStore.getState().world).toEqual(predicted); expect(commit).toHaveBeenCalledTimes(2); expect(unpack).not.toHaveBeenCalled(); expect(screen.queryByRole('button', { name: 'Withdraw from School' })).toBeNull(); expect(screen.queryByRole('alert')).toBeNull();
    expect(context.sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(context.old.id)?.payload).toBe(archive.checkpoint); expect(context.sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(context.old.id)?.payload).toBe(archive.checkpoint);
    const savedRows = context.rows(); expect(savedRows.snapshots).toEqual(originalRows.snapshots); expect(savedRows.snapshot_metadata).toEqual(originalRows.snapshot_metadata); view.unmount(); view = undefined; unpack.mockRestore(); commit.mockRestore();

    await context.cold(); expect(mockStore.getState().world).toEqual(predicted); expect(context.rows()).toEqual(savedRows); view = render(frame());
    expect(screen.getByText('School Withdrawal')).toBeOnTheScreen(); const acknowledged = resolveCommand(predicted, { type: 'acknowledge', resultId: predicted.pending!.id }, true); await press('Continue'); expect(mockStore.getState().world).toEqual(acknowledged); expect(mockStore.getState().world!.schoolWithdrawals).toHaveLength(1);
    const afterAck = context.rows(); await act(async () => { expect(await mockStore.getState().dispatch(command)).toBe(false); }); expect(context.rows()).toEqual(afterAck); expect(mockStore.getState().world).toEqual(acknowledged);
    await press('Former Teachers'); expect(router.push).toHaveBeenLastCalledWith({ pathname: '/school-contacts', params: { group: 'teachers', communityId: school.id } });
    mockParams = { group: 'teachers', communityId: school.id }; view.rerender(frame(<SchoolContacts />)); const teacher = before.people[school.currentTeacherId]; expect(screen.getByText(fullName(teacher))).toBeOnTheScreen(); expect(screen.getByText('Former class teacher')).toBeOnTheScreen();
    fireEvent.press(screen.getByText(fullName(teacher))); expect(router.push).toHaveBeenLastCalledWith({ pathname: '/person/[id]', params: { id: teacher.id, tab: 'activities' } }); expect(context.rows()).toEqual(afterAck);
  } finally { view?.unmount(); jest.restoreAllMocks(); context.close(); }
}, 30000);

test('secondary-school education browsing stays read-only and changing selected lives dismisses the old review', async () => {
  const context = await fixture(); const view = render(frame());
  try {
    const before = mockStore.getState().world!, rows = context.rows();
    await press(/^Further Education\./); expect(router.push).toHaveBeenLastCalledWith('/education'); expect(mockStore.getState().world).toBe(before); expect(context.rows()).toEqual(rows);
    view.rerender(frame(<Education />)); expect(screen.getByRole('button', { name: /^University\..*Finish secondary education first/ })).toBeDisabled();
    expect(screen.getByText(/minimum leaving age is 16; review early withdrawal/)).toBeOnTheScreen(); await press('Your School'); expect(router.push).toHaveBeenLastCalledWith('/school'); expect(mockStore.getState().world).toBe(before); expect(context.rows()).toEqual(rows);
    view.rerender(frame()); await press(/^Withdraw from Secondary School/); expect(screen.getByRole('button', { name: 'Withdraw from School' })).toBeEnabled();
    await act(async () => { expect(await mockStore.getState().selectLife(context.old.id)).toBe(true); }); expect(screen.queryByRole('button', { name: 'Withdraw from School' })).toBeNull();
    await act(async () => { expect(await mockStore.getState().selectLife(before.id)).toBe(true); }); expect(screen.queryByRole('button', { name: 'Withdraw from School' })).toBeNull(); expect(mockStore.getState().world).toEqual(before); expect(mockStore.getState().world!.schoolWithdrawals).toEqual([]);
  } finally { view.unmount(); jest.restoreAllMocks(); context.close(); }
}, 30000);
