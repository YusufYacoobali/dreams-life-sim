import { displayText } from '../../src/ui/displayNumbers';
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGameStore } from '../../src/state/gameStore';
import { encodeWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import native from '../fixtures/v32-native-hourly-checkpoints.json';
import history from '../fixtures/v7-history-archive.json';

let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Jobs from '../../app/(game)/jobs';
const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><Jobs /><PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };

async function setup(kind: 'final' | 'interview') {
  const payload = native.checkpoints[kind].payload, initial = checkpoints.unpackCheckpoint(payload);
  const directory = mkdtempSync(join(tmpdir(), 'dreams-interview-experience-')), file = join(directory, 'dreams.db');
  let sqlite!: DatabaseSync, held: (() => void) | null = null, pauseReceipt = false, receiptWrites = 0;
  const connect = (): SqlDatabase => {
    const connection = sqlite = new DatabaseSync(file); connection.exec('PRAGMA foreign_keys=ON');
    const session: SqlSession = {
      run: async (sql, values = []) => {
        if (sql.startsWith('INSERT INTO receipts')) {
          receiptWrites++;
          if (pauseReceipt) { pauseReceipt = false; await new Promise<void>(resolve => { held = resolve; }); held = null; }
        }
        connection.prepare(sql).run(...values);
      },
      get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null,
      all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[],
    };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => { connection.exec('BEGIN IMMEDIATE'); try { const result = await action(session); connection.exec('COMMIT'); return result; } catch (error) { connection.exec('ROLLBACK'); throw error; } } };
  };
  const repository = new SaveRepository(connect()); await repository.initialise(); await repository.import(JSON.stringify(history)); await repository.create(initial);
  // Same exact actual native world, retaining its original historical raw bytes.
  for (const table of ['lives', 'backups']) sqlite.prepare('UPDATE ' + table + ' SET payload=? WHERE ' + (table === 'lives' ? 'id' : 'life_id') + '=?').run(payload, initial.id);
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [String(row.name), sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  const oldRows = () => Object.fromEntries(['lives', 'backups', 'snapshots', 'snapshot_metadata', 'receipts'].map(table => [table, sqlite.prepare('SELECT * FROM ' + table + ' WHERE ' + (table === 'lives' ? 'id' : 'life_id') + '!=? ORDER BY 1,2').all(initial.id)]));
  const original = oldRows();
  const bootstrap = async (repo: SaveRepository) => {
    mockStore = createGameStore({ repository: async () => repo, date: () => initial.date, id: () => 'unused' }); expect(await mockStore.getState().bootstrap()).toBe(true);
  };
  // Loading starts with a genuinely closed connection rather than the create cache.
  sqlite.close(); await bootstrap(new SaveRepository(connect()));
  return {
    initial, payload, rows, oldRows, original,
    sql: (sql: string) => sqlite.exec(sql),
    backup: () => sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(initial.id)?.payload,
    writes: () => receiptWrites, hold: () => { pauseReceipt = true; }, isHeld: () => !!held,
    release: () => { if (!held) throw new Error('No receipt is held'); held(); },
    cold: async () => { sqlite.close(); await bootstrap(new SaveRepository(connect())); },
    close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); },
  };
}
afterEach(() => { jest.restoreAllMocks(); });

test('genuine paid history binds once through application/answer rollback, held duplicate refusal, actual closed-connection cold and acknowledgement', async () => {
  const context = await setup('final'); let view = render(frame());
  try {
    const before = context.rows(), initialText = encodeWorld(context.initial); expect(Object.keys(before)).toHaveLength(8);
    await press(/^Retail Assistant\./); expect(context.rows()).toEqual(before);
    const command = { type: 'apply-job' as const, roleId: 'retail' }, predicted = resolveCommand(context.initial, command, true), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    context.sql("CREATE TRIGGER fail_experience_apply BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press('Apply for this Job'); await waitFor(() => expect(mockStore.getState().error).toMatch(/couldn't be saved/));
    expect(screen.getAllByRole('alert')).toHaveLength(1); expect(screen.getByText('Job Detail')).toBeOnTheScreen(); expect(context.rows()).toEqual(before); expect(encodeWorld(mockStore.getState().world!)).toBe(initialText);
    context.sql('DROP TRIGGER fail_experience_apply'); context.hold();
    await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Apply for this Job' })); fireEvent.press(screen.getByRole('button', { name: 'Apply for this Job' })); });
    await waitFor(() => expect(context.isHeld()).toBe(true)); expect(mockStore.getState().busy).toBe(true); expect(context.writes()).toBe(2);
    expect(screen.getByRole('button', { name: 'Apply for this Job' })).toBeDisabled();
    await act(async () => { context.release(); }); await waitFor(() => expect(screen.getByText('Retail Assistant interview')).toBeOnTheScreen());
    expect(mockStore.getState().world).toEqual(predicted); expect(predicted.pending?.body).toContain('12 recorded paid months in Retail. Experience can add up to 2 percentage points'); expect(predicted.random).toEqual(context.initial.random); expect(context.backup()).toBe(context.payload); expect(context.oldRows()).toEqual(context.original); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    const decisionRows = context.rows(); view.unmount(); await act(async () => { await context.cold(); }); view = render(frame());
    expect(context.rows()).toEqual(decisionRows); expect(mockStore.getState().world).toEqual(predicted);
    if (predicted.pending?.kind !== 'decision') throw new Error('Expected saved interview');
    const choice = predicted.pending.choices[0], answer = { type: 'choose' as const, eventId: predicted.pending.id, choiceId: choice.id }, expected = resolveCommand(predicted, answer, true), warmUnpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    context.sql("CREATE TRIGGER fail_experience_answer BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await press(choice.label);
    await waitFor(() => expect(mockStore.getState().error).toMatch(/couldn't be saved/)); expect(screen.getAllByRole('alert')).toHaveLength(1); expect(context.rows()).toEqual(decisionRows); expect(mockStore.getState().world).toEqual(predicted);
    context.sql('DROP TRIGGER fail_experience_answer'); await press(choice.label); await waitFor(() => expect(mockStore.getState().world).toEqual(expected));
    expect(expected.accounts).toEqual(predicted.accounts); expect(expected.ledger).toEqual(predicted.ledger); expect(warmUnpack).not.toHaveBeenCalled(); warmUnpack.mockRestore();
    const resultRows = context.rows(); view.unmount(); await act(async () => { await context.cold(); }); view = render(frame()); expect(context.rows()).toEqual(resultRows); expect(mockStore.getState().world).toEqual(expected);
    expect(screen.getByText(expected.pending!.title)).toBeOnTheScreen(); await press('Continue'); const done = mockStore.getState().world!, doneRows = context.rows();
    expect(done.people).toEqual(expected.people); expect(done.random).toEqual(expected.random); expect(done.workHistory).toEqual(expected.workHistory);
    await act(async () => { expect(await mockStore.getState().dispatch(answer)).toBe(false); expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: expected.pending!.id })).toBe(false); }); expect(context.rows()).toEqual(doneRows);
    view.unmount(); await act(async () => { await context.cold(); }); view = render(frame()); expect(mockStore.getState().world).toEqual(done); expect(context.rows()).toEqual(doneRows); expect(context.oldRows()).toEqual(context.original);
  } finally { if (context.isHeld()) { await act(async () => { context.release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false)); } view.unmount(); context.close(); }
}, 30_000);

test('actual old native unanswered interview keeps exact old copy, absent metadata, raw backup and original hiring result after disk retry/cold', async () => {
  const context = await setup('interview'); let view = render(frame());
  try {
    const initial = context.initial, before = context.rows(), pending = initial.pending;
    if (pending?.kind !== 'decision') throw new Error('Expected old actual interview');
    expect(pending.body).not.toContain('recorded paid months'); expect(pending.choices.every(choice => !('experience' in choice.effects[0]))).toBe(true); expect(screen.getByText(displayText(pending.body))).toBeOnTheScreen();
    context.sql("CREATE TRIGGER fail_legacy_experience BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await press(pending.choices[0].label); await waitFor(() => expect(mockStore.getState().error).toMatch(/couldn't be saved/)); expect(context.rows()).toEqual(before); expect(mockStore.getState().world).toEqual(initial);
    context.sql('DROP TRIGGER fail_legacy_experience'); await press(pending.choices[0].label);
    const actualHired = checkpoints.unpackCheckpoint(native.checkpoints.hired.payload); await waitFor(() => expect(mockStore.getState().world).toEqual(actualHired)); expect(context.backup()).toBe(context.payload);
    const after = context.rows(); view.unmount(); await act(async () => { await context.cold(); }); view = render(frame()); expect(context.rows()).toEqual(after); expect(mockStore.getState().world).toEqual(actualHired); expect(context.oldRows()).toEqual(context.original);
  } finally { view.unmount(); context.close(); }
});
