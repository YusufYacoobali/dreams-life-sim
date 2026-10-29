import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { lifeStoryWorld } from '../support/lifeStory';
import { bindEvent } from '../../src/game/content/events';
import { everydayLifeTemplates } from '../../src/game/content/everydayLifeStories';
import { offerPending } from '../../src/game/pendingQueue';
import { ageOn, encodeWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { SaveRepository } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import * as choiceAvailability from '../../src/game/choiceAvailability';
import { database } from '../support/sqlite';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { SqlDatabase, SqlSession } from '../../src/persistence/repository';
import { laterLifeFamilyTemplates } from '../../src/game/content/laterLifeFamilyStories';
import { ThemeProvider } from '../../src/ui/theme';
let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Life from '../../app/(game)/(tabs)/life';
import { PendingEvent } from '../../src/ui/PendingEvent';
import { EventModal } from '../../src/ui/EventModal';
const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><Life /><PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (label: string) => { await act(async () => fireEvent.press(screen.getByRole('button', { name: label }))); };

function pending(id: string, child = false): World {
  const world = lifeStoryWorld();
  if (child) world.activePersonId = Object.values(world.people).find(person => ageOn(person, world.date) >= 3 && ageOn(person, world.date) <= 11)!.id;
  offerPending(world, bindEvent(world, everydayLifeTemplates.find(t => t.id === id)!)); return world;
}

test.each([
  ['pet-familiar-presence', 'company', true],
  ['pet-familiar-presence', 'distracted', false],
  ['family-bedtime-detour', 'invent', false],
] as const)('%s/%s persists exact named effects through SQLite rollback, warm retry, cold result and a single acknowledgement', async (id, choiceId, asChild) => {
  const initial = pending(id, asChild); if (initial.pending?.kind !== 'decision') throw new Error('Missing bound scene'); const event = initial.pending, choice = event.choices.find(c => c.id === choiceId)!;
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.create(initial);
  const cold = async () => { const repo = new SaveRepository(driver); mockStore = createGameStore({ repository: async () => repo, date: () => initial.date, id: () => 'unused' }); await mockStore.getState().bootstrap(); };
  await cold(); let view = render(frame()); expect(screen.getByText(event.title)).toBeOnTheScreen();
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(r => [r.name, sqlite.prepare('SELECT * FROM '+r.name+' ORDER BY 1,2').all()])), beforeRows = rows(), before = encodeWorld(mockStore.getState().world!);
  const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); sqlite.exec("CREATE TRIGGER fail_life_context BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await press(choice.label); await waitFor(() => expect(mockStore.getState().error).toMatch(/couldn't be saved/)); expect(rows()).toEqual(beforeRows); expect(encodeWorld(mockStore.getState().world!)).toBe(before);
  sqlite.exec('DROP TRIGGER fail_life_context'); await press(choice.label); await waitFor(() => expect(screen.getByText(choice.resultTitle)).toBeOnTheScreen());
  const result = mockStore.getState().world!, expected = resolveCommand(initial, { type: 'choose', eventId: event.id, choiceId }, true); expect(result).toEqual(expected); expect(result.accounts).toEqual(initial.accounts); expect(result.ledger).toEqual(initial.ledger); expect(result.hobbies).toEqual(initial.hobbies); expect(result.workHistory).toEqual(initial.workHistory); expect(result.random).toEqual(initial.random); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
  if (asChild) { expect(result.pets[0].bonds[initial.activePersonId]).toBe(4); expect(result.pets[0].ownerId).not.toBe(initial.activePersonId); }
  const resultRows = rows(); view.unmount(); await cold(); view = render(frame()); expect(rows()).toEqual(resultRows); expect(mockStore.getState().world).toEqual(result); expect(screen.getByText(choice.resultTitle)).toBeOnTheScreen(); await press('Continue');
  const done = mockStore.getState().world!; expect(done.people).toEqual(result.people); expect(done.pets).toEqual(result.pets); expect(done.relationships).toEqual(result.relationships); expect(done.random).toEqual(result.random); expect(done.revision).toBe(initial.revision + 2);
  const finalRows = rows(); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'choose', eventId: event.id, choiceId })).toBe(false); }); expect(rows()).toEqual(finalRows); view.unmount(); sqlite.close();
});

test('an explicitly bound older-family photograph scene retains the exact review through held failure, retry, raw backup and an actual closed-file SQLite cold result', async () => {
  // The established helper declares its age/funds/factory-child arrangement.
  // This tests a new bound scene, not natural annual selection or a new life.
  const initial = lifeStoryWorld(), scene = laterLifeFamilyTemplates.find(row => row.id === 'later-family-photo-permission')!;
  const event = bindEvent(initial, scene), choice = event.choices.find(row => row.id === 'private')!;
  offerPending(initial, event);
  const directory = mkdtempSync(join(tmpdir(), 'dreams-later-family-')), path = join(directory, 'dreams.db');
  let sqlite!: DatabaseSync, view: ReturnType<typeof render> | undefined, repository: SaveRepository, nextYield: Promise<void> | undefined;
  const connect = (): SqlDatabase => {
    const connection = sqlite = new DatabaseSync(path); connection.exec('PRAGMA foreign_keys=ON');
    const session: SqlSession = {
      run: async (sql, values = []) => { connection.prepare(sql).run(...values); },
      get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null,
      all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[],
    };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => { connection.exec('BEGIN IMMEDIATE'); try { const result = await action(session); connection.exec('COMMIT'); return result; } catch (error) { connection.exec('ROLLBACK'); throw error; } } };
  };
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])) as Record<string, Record<string, unknown>[]>;
  const bootstrap = async () => {
    mockStore = createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'unused', yieldToUI: async () => { const held = nextYield; nextYield = undefined; if (held) await held; } });
    expect(await mockStore.getState().bootstrap()).toBe(true);
  };
  repository = new SaveRepository(connect());
  try {
    const availability = jest.spyOn(choiceAvailability, 'choiceUnavailable');
    await repository.initialise(); await repository.create(initial); await bootstrap(); view = render(frame());
    const before = rows(), world = mockStore.getState().world!, beforeWorld = encodeWorld(world);
    expect(Object.keys(before)).toHaveLength(8); expect(screen.getByText(event.body)).toBeOnTheScreen();
    if (world.pending?.kind !== 'decision') throw new Error('Missing saved family decision');
    const uiCalls = (snapshot: World) => availability.mock.calls.filter(([candidate]) => candidate === snapshot).length;
    expect(uiCalls(world)).toBe(event.choices.length);
    // UI-only immutable identity replacements retain every saved field. A new
    // world with the same pending object must still refresh current eligibility.
    const replacedWorld = Object.freeze({ ...world });
    await act(async () => { mockStore.setState({ world: replacedWorld }); });
    expect(replacedWorld.pending).toBe(world.pending); expect(uiCalls(replacedWorld)).toBe(event.choices.length);
    const replacedPending = Object.freeze({ ...world, pending: Object.freeze({ ...world.pending }) });
    await act(async () => { mockStore.setState({ world: replacedPending }); });
    expect(replacedPending.pending).not.toBe(world.pending); expect(uiCalls(replacedPending)).toBe(event.choices.length);
    await act(async () => { mockStore.setState({ world }); });
    expect(mockStore.getState().world).toBe(world); expect(encodeWorld(mockStore.getState().world!)).toBe(beforeWorld); expect(rows()).toEqual(before);
    const beforeBusyCalls = uiCalls(world), beforeEngineCalls = availability.mock.calls.length;
    const presentation = () => screen.UNSAFE_getAllByType(EventModal).find(modal => modal.props.event?.id === event.id)!.props.event;
    const beforeBusyPresentation = presentation();
    const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), oldChoose = screen.UNSAFE_getAllByType(EventModal).find(modal => modal.props.event?.id === event.id)!.props.onChoose;
    let release!: () => void; nextYield = new Promise<void>(resolve => { release = resolve; });
    sqlite.exec("CREATE TRIGGER fail_later_family BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await act(async () => { fireEvent.press(screen.getByRole('button', { name: choice.label })); oldChoose(choice.id); });
    expect(mockStore.getState().busy).toBe(true); expect(screen.getByRole('button', { name: choice.label })).toBeDisabled();
    expect(mockStore.getState().world).toBe(world); expect(rows()).toEqual(before);
    const heldCalls = uiCalls(world), busyPresentation = presentation();
    expect(busyPresentation).not.toBe(beforeBusyPresentation);
    await act(async () => release()); await waitFor(() => {
      const modal = screen.UNSAFE_getAllByType(EventModal).find(item => item.props.event?.id === event.id)!;
      expect(within(modal).getByRole('alert')).toHaveTextContent(/couldn't be saved/);
    });
    expect(encodeWorld(mockStore.getState().world!)).toBe(beforeWorld); expect(rows()).toEqual(before);
    expect(mockStore.getState().world?.pending).toBe(world.pending); expect(screen.getByText(event.body)).toBeOnTheScreen();
    expect(heldCalls).toBe(beforeBusyCalls); expect(uiCalls(world)).toBe(beforeBusyCalls);
    const engineCalls = availability.mock.calls.slice(beforeEngineCalls);
    expect(engineCalls).toHaveLength(1); expect(engineCalls[0][0]).not.toBe(world); expect(engineCalls[0][1].id).toBe(choice.id);
    expect(presentation()).not.toBe(busyPresentation);
    sqlite.exec('DROP TRIGGER fail_later_family'); await press(choice.label);
    const command = { type: 'choose' as const, eventId: event.id, choiceId: choice.id }, expected = resolveCommand(world, command, true);
    expect(mockStore.getState().world).toEqual(expected); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    expect(sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(initial.id)?.payload).toBe(before.lives.find(row => row.id === initial.id)!.payload);
    expect(rows().receipts).toHaveLength(before.receipts.length + 1);
    expect(expected.random).toEqual(world.random); expect(expected.accounts).toEqual(world.accounts); expect(expected.ledger).toEqual(world.ledger);
    expect(expected.journal.slice(0, world.journal.length)).toEqual(world.journal);
    const committed = rows(); view.unmount(); view = undefined; sqlite.close();
    repository = new SaveRepository(connect()); await bootstrap(); view = render(frame());
    expect(rows()).toEqual(committed); expect(mockStore.getState().world).toEqual(expected);
    expect(screen.getByText(choice.resultBody)).toBeOnTheScreen(); await press('Continue');
    const done = mockStore.getState().world!, acknowledged = rows();
    expect(done.pending).toBeNull(); expect(done.people).toEqual(expected.people); expect(done.relationships).toEqual(expected.relationships); expect(done.random).toEqual(expected.random);
    expect(done.revision).toBe(initial.revision + 2);
    await act(async () => { expect(await mockStore.getState().dispatch(command)).toBe(false); expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: expected.pending!.id })).toBe(false); });
    expect(rows()).toEqual(acknowledged);
  } finally { jest.restoreAllMocks(); view?.unmount(); sqlite.close(); rmSync(directory, { recursive: true, force: true }); }
}, 30000);
