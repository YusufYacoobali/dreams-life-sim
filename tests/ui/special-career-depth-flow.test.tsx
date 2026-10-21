import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bindEvent, eligibleTemplates } from '../../src/game/content/events';
import { specialCareerDepthTemplates } from '../../src/game/content/specialCareerDepthStories';
import { offerPending } from '../../src/game/pendingQueue';
import { encodeWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { careerDepthWorld } from '../support/specialCareerDepth';
import { createGameStore } from '../../src/state/gameStore';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import { EventModal } from '../../src/ui/EventModal';
import oldCareerArchive from '../fixtures/v12-career-archive.json';

let mockStore: ReturnType<typeof createGameStore>;
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, bottom: 48, left: 0, right: 0 } }}><ThemeProvider><PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (label: string) => { await act(async () => fireEvent.press(screen.getByRole('button', { name: label }))); };

test('a declared new scene at a genuine recorded Streamer context retains old archive bytes and exact held failure/retry/warm0/backup/closed-connection result/once acknowledgement', async () => {
  const scene = specialCareerDepthTemplates.find(row => row.id === 'career-streamer-chair-soundcheck')!, initial = careerDepthWorld(scene);
  // Explicit scene binding/new working-life identity at the actual old studio,
  // not a natural annual encounter, new birth, paid broadcast or native claim.
  initial.id = 'life_career_depth_test'; expect(eligibleTemplates(initial)).toContain(scene);
  const event = bindEvent(initial, scene); offerPending(initial, event);
  const choice = event.choices.find(row => row.id === 'louder')!;
  const directory = mkdtempSync(join(tmpdir(), 'dreams-career-depth-')), path = join(directory, 'dreams.db');
  let sqlite!: DatabaseSync;
  let repository: SaveRepository, nextYield: Promise<void> | undefined;
  let view: ReturnType<typeof render> | undefined;
  function connect(): SqlDatabase {
    const connection = sqlite = new DatabaseSync(path); connection.exec('PRAGMA foreign_keys=ON');
    const session: SqlSession = {
      run: async (sql, values = []) => { connection.prepare(sql).run(...values); },
      get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null,
      all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[],
    };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => { connection.exec('BEGIN IMMEDIATE'); try { const result = await action(session); connection.exec('COMMIT'); return result; } catch (error) { connection.exec('ROLLBACK'); throw error; } } };
  }
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])) as Record<string, Record<string, unknown>[]>;
  const bootstrap = async () => {
    mockStore = createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'unused', yieldToUI: async () => { const pending = nextYield; nextYield = undefined; if (pending) await pending; } });
    expect(await mockStore.getState().bootstrap()).toBe(true);
  };
  repository = new SaveRepository(connect());
  try {
    await repository.initialise(); await repository.import(JSON.stringify(oldCareerArchive));
    const originalRows = rows(), oldLifeId = String(originalRows.lives[0].id);
    const oldRowsExact = () => {
      const current = rows();
      for (const [table, values] of Object.entries(originalRows)) for (const row of values) {
        if (table === 'preferences' && row.key === 'active_life') continue;
        expect(current[table]).toContainEqual(row);
      }
      for (const snapshot of oldCareerArchive.snapshots) expect(sqlite.prepare('SELECT payload FROM snapshots WHERE life_id=? AND snapshot_id=?').get(oldLifeId, snapshot.summary.id)?.payload).toBe(snapshot.payload);
    };
    await repository.create(initial); await bootstrap(); view = render(frame());
    expect(Object.keys(rows())).toHaveLength(8); expect(screen.getByText(event.title)).toBeOnTheScreen(); oldRowsExact();
    const before = rows(), world = mockStore.getState().world!, beforeWorld = encodeWorld(world);
    const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    let release!: () => void; nextYield = new Promise<void>(resolve => { release = resolve; });
    sqlite.exec("CREATE TRIGGER fail_career_depth BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    const staleCallback = screen.UNSAFE_getByType(EventModal).props.onChoose;
    await act(async () => { fireEvent.press(screen.getByRole('button', { name: choice.label })); staleCallback(choice.id); });
    expect(mockStore.getState().busy).toBe(true); expect(screen.getByRole('button', { name: choice.label })).toBeDisabled();
    expect(mockStore.getState().world).toBe(world); expect(rows()).toEqual(before);
    await act(async () => release()); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/));
    expect(screen.getAllByRole('alert')).toHaveLength(1); expect(screen.getByText(event.body)).toBeOnTheScreen();
    expect(encodeWorld(mockStore.getState().world!)).toBe(beforeWorld); expect(mockStore.getState().world?.pending).toBe(world.pending); expect(rows()).toEqual(before);
    sqlite.exec('DROP TRIGGER fail_career_depth'); await press(choice.label);
    const command = { type: 'choose' as const, eventId: event.id, choiceId: choice.id }, expected = resolveCommand(world, command, true);
    expect(mockStore.getState().world).toEqual(expected); expect(screen.getByText(choice.resultTitle)).toBeOnTheScreen();
    expect(rows().receipts).toHaveLength(before.receipts.length + 1); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    expect(sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(initial.id)?.payload).toBe(before.lives.find(row => row.id === initial.id)!.payload);
    expect(expected.random).toEqual(world.random); expect(expected.accounts).toEqual(world.accounts); expect(expected.ledger).toEqual(world.ledger); expect(expected.creatorStudios).toEqual(world.creatorStudios); expect(expected.socialAccounts).toEqual(world.socialAccounts);
    oldRowsExact(); const committed = rows(); view.unmount(); view = undefined; sqlite.close();
    repository = new SaveRepository(connect()); await bootstrap(); view = render(frame());
    expect(rows()).toEqual(committed); expect(mockStore.getState().world).toEqual(expected); expect(screen.getByText(choice.resultBody)).toBeOnTheScreen(); oldRowsExact();
    await press('Continue'); const done = mockStore.getState().world!, acknowledged = rows();
    expect(done.pending).toBeNull(); expect(done.people).toEqual(expected.people); expect(done.random).toEqual(expected.random); expect(done.revision).toBe(initial.revision + 2);
    await act(async () => { expect(await mockStore.getState().dispatch(command)).toBe(false); expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: expected.pending!.id })).toBe(false); });
    expect(rows()).toEqual(acknowledged); oldRowsExact();
  } finally { jest.restoreAllMocks(); view?.unmount(); sqlite!.close(); rmSync(directory, { recursive: true, force: true }); }
}, 30000);
