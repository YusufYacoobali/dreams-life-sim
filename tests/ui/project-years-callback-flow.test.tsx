import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { arrangedProject, ordinaryStoryCommand } from '../support/projectRecall';
import { createGameStore } from '../../src/state/gameStore';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { storyMonthNumber } from '../../src/game/systems/storyContext';
import { relationFor } from '../../src/game/systems/relationships';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import { EventModal } from '../../src/ui/EventModal';
import pinnedArchive from '../fixtures/v28-native-school-archive.json';

jest.setTimeout(60000);
let mockStore: ReturnType<typeof createGameStore>;
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
const world = () => mockStore.getState().world!;
const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, bottom: 48, left: 0, right: 0 } }}><ThemeProvider><PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (label: string) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name: label })); }); };

async function setup() {
  const directory = mkdtempSync(join(tmpdir(), 'dreams-project-recall-')), path = join(directory, 'dreams.db'), initial = arrangedProject();
  let sqlite: DatabaseSync, repository: SaveRepository, nextYield: Promise<void> | undefined;
  function connect(): SqlDatabase {
    const connection = sqlite = new DatabaseSync(path); connection.exec('PRAGMA foreign_keys=ON');
    const session: SqlSession = { run: async (sql, values = []) => { connection.prepare(sql).run(...values); }, get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null, all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[] };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => { connection.exec('BEGIN IMMEDIATE'); try { const value = await action(session); connection.exec('COMMIT'); return value; } catch (error) { connection.exec('ROLLBACK'); throw error; } } };
  }
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])) as Record<string, Record<string, unknown>[]>;
  repository = new SaveRepository(connect()); await repository.initialise(); await repository.import(JSON.stringify(pinnedArchive)); const pinned = rows();
  // Working current is the genuine v21 world with explicitly arranged template binding, not a full v21 archive import.
  await repository.create(initial);
  const bootstrap = async () => { mockStore = createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'unused', yieldToUI: async () => { const pending = nextYield; nextYield = undefined; if (pending) await pending; } }); expect(await mockStore.getState().bootstrap()).toBe(true); };
  await bootstrap();
  return { get sqlite() { return sqlite; }, rows, pause: () => { let release!: () => void; nextYield = new Promise<void>(resolve => { release = resolve; }); return release; }, cold: async () => { sqlite.close(); repository = new SaveRepository(connect()); await bootstrap(); }, original: () => {
    const current = rows(); for (const table of Object.keys(pinned)) for (const row of pinned[table]) {
      if (table === 'preferences' && row.key === 'active_life') continue;
      expect(current[table]).toContainEqual(row);
    }
    for (const snapshot of pinnedArchive.snapshots) expect(sqlite.prepare('SELECT payload FROM snapshots WHERE life_id=? AND snapshot_id=?').get(String(pinned.lives[0].id), snapshot.summary.id)?.payload).toBe(snapshot.payload);
  }, close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); } };
}

test('a real saved child resolves a project, lives two years, and saves the same-peer continuation once through rollback, warm retry and real cold reopens', async () => {
  const context = await setup(); let view: ReturnType<typeof render> | undefined;
  const until = async (condition: () => boolean) => { for (let count = 0; !condition(); count++) { if (count >= 250) throw new Error('Actual callback continuation exceeded its command bound'); expect(await mockStore.getState().dispatch(ordinaryStoryCommand(world()))).toBe(true); } };
  const durable = async (choiceId: string) => {
    const initial = world(), event = initial.pending; if (event?.kind !== 'decision') throw new Error('Missing actual callback decision');
    const label = event.choices.find(choice => choice.id === choiceId)!.label, before = context.rows(), command: GameCommand = { type: 'choose', eventId: event.id, choiceId };
    const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), release = context.pause(), callback = screen.UNSAFE_getByType(EventModal).props.onChoose;
    context.sqlite.exec("CREATE TRIGGER fail_project_recall BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await act(async () => { fireEvent.press(screen.getByRole('button', { name: label })); callback(choiceId); });
    expect(mockStore.getState().busy).toBe(true); expect(screen.getByRole('button', { name: label })).toBeDisabled(); expect(world()).toBe(initial); expect(context.rows()).toEqual(before);
    await act(async () => { release(); }); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/));
    expect(screen.getAllByRole('alert')).toHaveLength(1); expect(world()).toBe(initial); expect(world().pending).toBe(event); expect(screen.getByText(event.body)).toBeOnTheScreen(); expect(context.rows()).toEqual(before);
    context.sqlite.exec('DROP TRIGGER fail_project_recall'); await press(label);
    // Comparison is after the real committed retry; it never steers a scene, peer or outcome.
    const expected = resolveCommand(initial, command, true); expect(world()).toEqual(expected); expect(world().revision).toBe(initial.revision + 1); expect(world().random).toEqual(initial.random);
    expect(context.rows().receipts).toHaveLength(before.receipts.length + 1); expect(context.sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(initial.id)?.payload).toBe(before.lives.find(row => row.id === initial.id)!.payload); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    const committed = context.rows(); view!.unmount(); await context.cold(); view = render(frame()); expect(world()).toEqual(expected); expect(context.rows()).toEqual(committed); expect(screen.getByText(expected.pending!.title)).toBeOnTheScreen(); context.original();
    await press('Continue'); const acknowledged = world(), ackRows = context.rows();
    await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: expected.pending!.id })).toBe(false); }); expect(world()).toBe(acknowledged); expect(context.rows()).toEqual(ackRows);
    return expected;
  };
  try {
    expect(Object.keys(context.rows())).toHaveLength(8); view = render(frame()); const origin = await durable('promise'), threadId = origin.storyThreads[0].id;
    expect(origin.storyThreads[0].rememberProject).toBe(true); expect(origin.storyThreads[0]).not.toHaveProperty('projectRecall'); view.unmount(); view = undefined;
    await until(() => world().pending?.id === threadId + '_due'); view = render(frame()); const short = await durable('leave-to-peer'), shortThread = short.storyThreads[0];
    expect(shortThread.resolution).toBe('leave-to-peer'); expect(shortThread.projectRecall).toMatchObject({ status: 'scheduled', dueMonth: storyMonthNumber(shortThread.ended!) + 24, expiresMonth: storyMonthNumber(shortThread.ended!) + 26 }); view.unmount(); view = undefined;
    await until(() => !world().annual && !world().pending); const between = world(), betweenRows = context.rows(); expect(storyMonthNumber(between.date) - storyMonthNumber(shortThread.ended!)).toBe(10); expect(between.storyThreads[0].projectRecall!.status).toBe('scheduled');
    await context.cold(); expect(world()).toEqual(between); expect(context.rows()).toEqual(betweenRows);
    await until(() => world().pending?.id === threadId + '_project_recall'); const offered = world(), event = offered.pending!;
    expect(storyMonthNumber(offered.date) - storyMonthNumber(shortThread.ended!)).toBe(24); expect(event.kind === 'decision' && event.personIds).toEqual([shortThread.personId, shortThread.peerId]); expect(event.body).toContain('you left your promised section blank');
    expect(event.body).toContain(offered.people[shortThread.peerId].firstName); const school = offered.people[offered.activePersonId].education, peer = relationFor(offered, shortThread.personId, shortThread.peerId)!;
    view = render(frame()); const recalled = await durable('remember-project');
    expect(recalled.storyThreads[0]).toEqual({ ...offered.storyThreads[0], projectRecall: { ...offered.storyThreads[0].projectRecall!, status: 'resolved', resolution: 'remember-project', ended: recalled.date } });
    expect(recalled.people[recalled.activePersonId].education).toEqual(school); expect(recalled.people).toEqual(offered.people); expect(recalled.ledger).toEqual(offered.ledger); expect(recalled.accounts).toEqual(offered.accounts); expect(relationFor(recalled, shortThread.personId, shortThread.peerId)).toMatchObject({ strength: Math.min(100, peer.strength + 3), trust: Math.min(100, peer.trust + 2) });
    view.unmount(); view = undefined; await until(() => !world().annual && !world().pending); const completed = world(), recorded = completed.storyThreads[0]; expect(recorded.projectRecall!.status).toBe('resolved');
    expect(completed.journal.filter(row => row.id === threadId + '_project_recall_choice')).toHaveLength(1); expect(await mockStore.getState().dispatch({ type: 'advance' })).toBe(true); await until(() => !world().annual && !world().pending); expect(world().storyThreads.find(thread => thread.id === threadId)).toEqual(recorded);
    const final = world(), finalRows = context.rows(); await context.cold(); expect(world()).toEqual(final); expect(context.rows()).toEqual(finalRows); context.original();
    console.info('PROJECT_RECALL_OBSERVATION', JSON.stringify({ personId: recorded.personId, peerId: recorded.peerId, original: recorded.resolution, realElapsedMonths: 24, recall: recorded.projectRecall, finalRevision: final.revision }));
  } finally { view?.unmount(); jest.restoreAllMocks(); context.close(); }
});
