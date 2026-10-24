import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGameStore } from '../../src/state/gameStore';
import { copyWorld, encodeWorld, immutableWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { offerPending } from '../../src/game/pendingQueue';
import * as copy from '../../src/game/content/socialCriticism';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import { arrangedCriticismRoll, criticismPost, criticismProfile, finishCriticismScene, legacyCriticism } from '../support/criticismFixture';
import history from '../fixtures/v7-history-archive.json';

let mockStore: ReturnType<typeof createGameStore>;
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const world = () => mockStore.getState().world!;

function legacyScene(queued: boolean) {
  const old = jest.spyOn(copy, 'publicCriticismCopy').mockReturnValue(legacyCriticism), initial = arrangedCriticismRoll(criticismProfile());
  let next = resolveCommand(initial, criticismPost(initial), true); old.mockRestore();
  // Freeze the historical choice copy as well as the setup; mocking only the
  // setup would otherwise construct old prose with the current choice labels.
  const historical = copyWorld(next);
  if (historical.pending?.kind !== 'decision') throw new Error('Expected bound criticism');
  for (const choice of historical.pending.choices) {
    choice.label = choice.id === 'apologise' ? 'Acknowledge the harm and apologise' : choice.id === 'clarify' ? 'Explain what you meant' : 'Let the argument run its course';
    choice.resultTitle = 'Your response is recorded';
    choice.resultBody = 'Your audience and public image reflect the response. Reopening the profile cannot change it.';
  }
  next = immutableWorld(historical);
  if (queued) {
    // Explicit queue arrangement to preserve an older bound decision behind a saved result.
    const arranged = copyWorld(next); offerPending(arranged, { kind: 'result', id: 'arranged_existing_result', title: 'Earlier saved result', body: 'An existing result is ahead of this decision.', illustration: 'journal', effects: [] }, 120); next = immutableWorld(arranged);
  }
  return next;
}

async function setup(initial: World) {
  const directory = mkdtempSync(join(tmpdir(), 'dreams-criticism-copy-')), file = join(directory, 'dreams.db'); let sqlite: DatabaseSync;
  function connect(): SqlDatabase {
    const connection = sqlite = new DatabaseSync(file); connection.exec('PRAGMA foreign_keys=ON');
    const session: SqlSession = {
      run: async (sql, values = []) => { connection.prepare(sql).run(...values); },
      get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null,
      all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[],
    };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => {
      connection.exec('BEGIN IMMEDIATE'); try { const result = await action(session); connection.exec('COMMIT'); return result; } catch (error) { connection.exec('ROLLBACK'); throw error; }
    } };
  }
  const repository = new SaveRepository(connect()); await repository.initialise(); await repository.import(JSON.stringify(history));
  const oldLives = sqlite!.prepare('SELECT * FROM lives ORDER BY id').all(), oldBackups = sqlite!.prepare('SELECT * FROM backups ORDER BY life_id').all(), oldMoments = sqlite!.prepare('SELECT * FROM snapshots ORDER BY 1,2').all();
  await repository.create(initial);
  let nextYield: Promise<void> | undefined;
  const pauseNextSave = () => { let release!: () => void; nextYield = new Promise<void>(resolve => { release = resolve; }); return release; };
  const bootstrap = async (repo: SaveRepository) => { mockStore = createGameStore({ repository: async () => repo, date: () => initial.date, id: () => 'unused', yieldToUI: async () => { const pause = nextYield; nextYield = undefined; if (pause) await pause; } }); expect(await mockStore.getState().bootstrap()).toBe(true); };
  await bootstrap(repository);
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [String(row.name), sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  return { get sqlite() { return sqlite!; }, rows, pauseNextSave,
    cold: async () => { sqlite.close(); await bootstrap(new SaveRepository(connect())); },
    original: () => {
      for (const row of oldLives) expect(sqlite.prepare('SELECT * FROM lives WHERE id=?').get(row.id!)).toEqual(row);
      for (const row of oldBackups) expect(sqlite.prepare('SELECT * FROM backups WHERE life_id=?').get(row.life_id!)).toEqual(row);
      expect(sqlite.prepare('SELECT * FROM snapshots ORDER BY 1,2').all()).toEqual(oldMoments);
      for (const point of history.snapshots) expect(sqlite.prepare('SELECT payload FROM snapshots WHERE snapshot_id=?').get(point.summary.id)?.payload).toBe(point.payload);
    },
    close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); },
  };
}
afterEach(() => { jest.restoreAllMocks(); });

test.each([false, true])('an old bound criticism (queued=%s) retains exact text through opening, rollback, held retry and cold result', async queued => {
  const initial = legacyScene(queued), context = await setup(initial), factory = jest.spyOn(copy, 'publicCriticismCopy');
  try {
    const openingRows = context.rows(); expect(Object.keys(openingRows)).toHaveLength(8); let view = render(frame()); expect(world()).toEqual(initial); expect(context.rows()).toEqual(openingRows);
    view.unmount(); await context.cold(); view = render(frame()); expect(world()).toEqual(initial); expect(context.rows()).toEqual(openingRows);
    if (queued) { expect(screen.getByText('Earlier saved result')).toBeOnTheScreen(); const bound = world().deferred.find(row => row.event.kind === 'decision' && row.event.templateId === 'public-controversy')!.event; expect(bound).toMatchObject(legacyCriticism); await press('Continue'); }
    const before = world(), beforeRows = context.rows(), command = { type: 'choose' as const, eventId: before.pending!.id, choiceId: 'apologise' }, expected = resolveCommand(before, command, true), originalResult = before.deferred.find(row => row.event.kind === 'result')!.event;
    expect(screen.getByText(legacyCriticism.title)).toBeOnTheScreen(); expect(screen.getByText(legacyCriticism.body)).toBeOnTheScreen(); expect(before.controversies[0]).toMatchObject(legacyCriticism);
    const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); context.sqlite.exec("CREATE TRIGGER fail_criticism BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press('Acknowledge the harm and apologise'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/));
    expect(screen.getByText(legacyCriticism.body)).toBeOnTheScreen(); expect(screen.getAllByRole('alert')).toHaveLength(1); expect(world()).toEqual(before); expect(context.rows()).toEqual(beforeRows);
    context.sqlite.exec('DROP TRIGGER fail_criticism'); const release = context.pauseNextSave(); await press('Acknowledge the harm and apologise'); expect(mockStore.getState().busy).toBe(true);
    for (const label of ['Acknowledge the harm and apologise', 'Explain what you meant', 'Let the argument run its course']) expect(screen.getByRole('button', { name: label })).toBeDisabled();
    await press('Acknowledge the harm and apologise'); expect(context.rows()).toEqual(beforeRows); await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false));
    expect(world()).toEqual(expected); expect(world().random).toEqual(before.random); expect(world().accounts).toEqual(before.accounts); expect(world().controversies[0]).toMatchObject(legacyCriticism); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    const savedRows = context.rows(); view.unmount(); await context.cold(); view = render(frame()); expect(world()).toEqual(expected); expect(context.rows()).toEqual(savedRows); expect(screen.getByText(expected.pending!.body)).toBeOnTheScreen();
    const result = world().pending!; await press('Continue'); expect(world().pending).toEqual(originalResult); expect(screen.getByText(originalResult.body)).toBeOnTheScreen(); await press('Continue');
    const done = world(), doneRows = context.rows(); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: result.id })).toBe(false); }); expect(world()).toEqual(done); expect(context.rows()).toEqual(doneRows); expect(factory).not.toHaveBeenCalled(); context.original(); view.unmount();
  } finally { context.close(); }
});

test('a new criticism binds the same actual post and copy after failed publication, warm retry and a fresh cold connection', async () => {
  const initial = arrangedCriticismRoll(criticismProfile()), command = criticismPost(initial), expected = resolveCommand(initial, command, true), context = await setup(initial);
  try {
    const beforeRows = context.rows(), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); let view = render(frame());
    context.sqlite.exec("CREATE TRIGGER fail_criticism BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await act(async () => { expect(await mockStore.getState().dispatch(command)).toBe(false); }); expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows); expect(screen.queryByText(expected.pending!.body)).toBeNull();
    context.sqlite.exec('DROP TRIGGER fail_criticism'); await act(async () => { expect(await mockStore.getState().dispatch(command)).toBe(true); }); expect(world()).toEqual(expected); expect(screen.getByText(expected.pending!.body)).toBeOnTheScreen(); expect(world().socialAccounts[0].totalPosts).toBe(1); expect(world().controversies).toHaveLength(1); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    const savedRows = context.rows(); view.unmount(); await context.cold(); view = render(frame()); expect(world()).toEqual(expected); expect(context.rows()).toEqual(savedRows); expect(screen.getByText(expected.pending!.body)).toBeOnTheScreen();
    const choice = { type: 'choose' as const, eventId: expected.pending!.id, choiceId: 'ignore' }; await press('Give the comments absolutely nothing'); expect(world()).toEqual(resolveCommand(expected, choice, true)); context.original(); view.unmount();
  } finally { context.close(); }
});

test('a stored audience cooldown suppresses every penalty through a failed ordinary post, retry and cold reload', async () => {
  const first = arrangedCriticismRoll(criticismProfile('photogram', true));
  const resolved = finishCriticismScene(resolveCommand(first, criticismPost(first), true));
  const arranged = copyWorld(resolved); arranged.date.year += 6;
  arranged.people[arranged.activePersonId].stats.energy = 100;
  const initial = arrangedCriticismRoll(arranged), command = criticismPost(initial), expected = resolveCommand(initial, command, true), context = await setup(initial);
  try {
    const beforeRows = context.rows(), account = initial.socialAccounts[0];
    expect(expected.controversies).toEqual(initial.controversies);
    expect(expected.socialAccounts[0].posts.at(-1)!.response).not.toBe('controversial');
    expect(expected.socialAccounts[0].posts.at(-1)!.followerDelta).toBeGreaterThanOrEqual(0);
    expect(expected.socialAccounts[0].strikes).toBe(account.strikes);
    expect(expected.people[expected.activePersonId].publicLife.image).toBe(initial.people[initial.activePersonId].publicLife.image);
    expect(expected.relationships).toEqual(initial.relationships);
    context.sqlite.exec("CREATE TRIGGER fail_criticism BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    expect(await mockStore.getState().dispatch(command)).toBe(false);
    expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows);
    context.sqlite.exec('DROP TRIGGER fail_criticism');
    expect(await mockStore.getState().dispatch(command)).toBe(true); expect(world()).toEqual(expected);
    const savedRows = context.rows(); await context.cold();
    expect(world()).toEqual(expected); expect(context.rows()).toEqual(savedRows);
    expect(world().controversies).toHaveLength(1); context.original();
  } finally { context.close(); }
});
