import React from 'react';
import { Modal } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGameStore } from '../../src/state/gameStore';
import { randomCreation } from '../../src/game/createLife';
import { encodeWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { recordingQuote } from '../../src/game/systems/music';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import { decodeSave } from '../../src/persistence/archive';
import * as checkpoints from '../../src/persistence/checkpoints';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import musicArchive from '../fixtures/v13-music-archive.json';
import electionArchive from '../fixtures/v14-election-archive.json';
import studioArchive from '../fixtures/v15-studio-archive.json';

let mockStore: ReturnType<typeof createGameStore>, mockKind = 'streamer';
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ kind: mockKind }), router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Politics from '../../app/(game)/politics';
import MusicStudio from '../../app/(game)/music-studio';
import CreatorStudio from '../../app/(game)/creator-studio/[kind]';

type Domain = 'politics' | 'music' | 'equipment';
const world = () => mockStore.getState().world!;
const frame = (domain: Domain) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{domain === 'politics' ? <Politics /> : domain === 'music' ? <MusicStudio /> : <CreatorStudio />}<PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const modal = () => within(screen.UNSAFE_getByType(Modal));
const acknowledge = (input: World) => resolveCommand(input, { type: 'acknowledge', resultId: input.pending!.id }, true);
const prepare = (domain: Domain) => domain === 'politics' ? checkpoints.unpackCheckpoint(decodeSave(JSON.stringify(electionArchive)).snapshots[0].payload, true) : decodeSave(JSON.stringify(domain === 'music' ? musicArchive : studioArchive)).world;
async function setup(domain: Domain) {
  mockKind = 'streamer'; const initial = prepare(domain), directory = mkdtempSync(join(tmpdir(), 'dreams-career-context-')), path = join(directory, 'dreams.db'); let sqlite: DatabaseSync;
  const connect = (): SqlDatabase => {
    sqlite = new DatabaseSync(path); sqlite.exec('PRAGMA foreign_keys=ON'); const connection = sqlite;
    const session: SqlSession = { run: async (sql, values = []) => { connection.prepare(sql).run(...values); }, get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null, all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[] };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => { connection.exec('BEGIN IMMEDIATE'); try { const result = await action(session); connection.exec('COMMIT'); return result; } catch (error) { connection.exec('ROLLBACK'); throw error; } } };
  };
  let repository = new SaveRepository(connect()); await repository.initialise(); await repository.create(initial);
  let nextYield: Promise<void> | undefined;
  const pauseNextSave = () => { let release!: () => void; nextYield = new Promise<void>(resolve => { release = resolve; }); return release; };
  const bootstrap = async () => { mockStore = createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'life_context_next', yieldToUI: async () => { const pause = nextYield; nextYield = undefined; if (pause) await pause; } }); expect(await mockStore.getState().bootstrap()).toBe(true); }; await bootstrap();
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  return { initial, get sqlite() { return sqlite; }, rows, pauseNextSave, cold: async () => { sqlite.close(); repository = new SaveRepository(connect()); await bootstrap(); }, close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); } };
}
const title = (domain: Domain) => domain === 'politics' ? 'Update your campaign plan?' : domain === 'music' ? 'Record Another Unfinished Song?' : 'Change your setup?';
const confirm = (domain: Domain) => domain === 'politics' ? 'Set Campaign Plan' : domain === 'music' ? 'Start Recording' : 'Update Setup';
async function openReview(domain: Domain): Promise<GameCommand> {
  if (domain === 'politics') { await press(/^Healthcare\./); await press(/^Public Profile\./); await press('Review Campaign Plan'); return { type: 'campaign-plan', electionId: world().elections[0].id, platform: 'health', effort: 'publicity' }; }
  if (domain === 'music') { fireEvent.changeText(screen.getByLabelText('Music release title'), 'Another Unfinished Song'); await press(/^Album\./); await press(/^Classical\./); await press('Review Recording'); return { type: 'record-music', title: 'Another Unfinished Song', genre: 'classical', format: 'album', quotedCost: recordingQuote(world(), 'album').cost }; }
  await press(/^Use no laptop/); return { type: 'creator-equipment', studioId: world().creatorStudios[0].id, laptopId: null, cameraId: null };
}
function expectDraft(domain: Domain) {
  if (domain === 'music') { expect(screen.getByLabelText('Music release title')).toHaveDisplayValue('Another Unfinished Song'); expect(screen.getByRole('button', { name: /^Album\./ })).toHaveTextContent(/Selected/); expect(screen.getByRole('button', { name: /^Classical\./ })).toHaveTextContent(/Selected/); }
  if (domain === 'politics') { expect(screen.getByRole('button', { name: /^Healthcare\./ })).toHaveTextContent(/Selected/); expect(screen.getByRole('button', { name: /^Public Profile\./ })).toHaveTextContent(/Selected/); }
}

test.each(['politics', 'music', 'equipment'] as const)('genuine %s context keeps the exact reviewed choice after all-table rollback, retries warm, cold and acknowledges once', async domain => {
  const context = await setup(domain);
  try {
    const initial = world(), before = context.rows(), encoded = encodeWorld(initial), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); expect(Object.keys(before)).toHaveLength(8); let view = render(frame(domain));
    if (domain === 'politics') { expect(screen.getByRole('button', { name: 'Review Campaign Plan' })).toBeDisabled(); await press('Review Campaign Plan'); expect(screen.queryByText(title(domain))).toBeNull(); }
    if (domain === 'equipment') { for (const name of [/^Creative Laptop/, /^Use no camera/]) { expect(screen.getByRole('button', { name })).toBeDisabled(); await press(name); } expect(screen.queryByText('Use this equipment?')).toBeNull(); }
    const command = await openReview(domain); expect(modal().getByText(title(domain))).toBeOnTheScreen(); await press('Never mind'); expect(context.rows()).toEqual(before); expect(encodeWorld(world())).toBe(encoded);
    await openReview(domain); const expected = resolveCommand(initial, command, true);
    context.sqlite.exec("CREATE TRIGGER fail_career_plan BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await press(confirm(domain)); await waitFor(() => expect(modal().getByRole('alert')).toHaveTextContent(/couldn't be saved/));
    expect(screen.getAllByRole('alert')).toHaveLength(1); expect(modal().getByText(title(domain))).toBeOnTheScreen(); expectDraft(domain); expect(context.rows()).toEqual(before); expect(encodeWorld(world())).toBe(encoded);
    context.sqlite.exec('DROP TRIGGER fail_career_plan'); await press(confirm(domain)); expect(world()).toEqual(expected); expect(screen.queryByText(title(domain))).toBeNull(); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    const saved = context.rows(); view.unmount(); await context.cold(); view = render(frame(domain)); expect(world()).toEqual(expected); expect(context.rows()).toEqual(saved); expect(screen.getByText(expected.pending!.title)).toBeOnTheScreen();
    await press('Continue'); const done = acknowledge(expected); expect(world()).toEqual(done); const doneRows = context.rows(); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: expected.pending!.id })).toBe(false); }); expect(world()).toEqual(done); expect(context.rows()).toEqual(doneRows);
    if (domain !== 'music') expect(world().random).toEqual(initial.random); if (domain === 'politics') expect(screen.getByRole('button', { name: 'Review Campaign Plan' })).toBeDisabled(); if (domain === 'equipment') expect(screen.getByRole('button', { name: /^Use no laptop/ })).toBeDisabled(); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});

test.each(['politics', 'music', 'equipment'] as const)('%s held save blocks duplicate confirmation/cancel/Back and only marks the submitted button busy', async domain => {
  const context = await setup(domain);
  try {
    const before = context.rows(), initial = world(), view = render(frame(domain)), command = await openReview(domain), expected = resolveCommand(initial, command, true), release = context.pauseNextSave(); await press(confirm(domain));
    expect(modal().getByRole('button', { name: confirm(domain) })).toHaveProp('accessibilityState', { disabled: true, busy: true }); expect(modal().getByRole('button', { name: 'Never mind' })).toHaveProp('accessibilityState', { disabled: true, busy: false });
    if (domain === 'music') { expect(screen.getByLabelText('Music release title')).toHaveProp('editable', false); for (const name of [/^Album\./, /^Classical\./]) expect(screen.getByRole('button', { name })).toBeDisabled(); }
    if (domain === 'politics') for (const name of [/^Healthcare\./, /^Public Profile\./]) expect(screen.getByRole('button', { name })).toBeDisabled();
    await press(confirm(domain)); await press('Never mind'); await act(async () => { screen.UNSAFE_getByType(Modal).props.onRequestClose(); }); expect(modal().getByText(title(domain))).toBeOnTheScreen(); expect(context.rows()).toEqual(before); expect(world()).toEqual(initial);
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false)); expect(world()).toEqual(expected); expect(world().revision).toBe(initial.revision + 1); view.unmount();
  } finally { context.close(); }
});

test.each(['politics', 'music'] as const)('%s retains local choices and review across an actual same-context training revision and acknowledgement', async domain => {
  const context = await setup(domain);
  try {
    const view = render(frame(domain)); await openReview(domain); const expectedTitle = title(domain);
    await act(async () => { expect(await mockStore.getState().dispatch({ type: 'career-training', skill: domain === 'music' ? 'music' : 'politics', mode: 'self' })).toBe(true); });
    await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: world().pending!.id })).toBe(true); });
    expect(modal().getByText(expectedTitle)).toBeOnTheScreen(); expectDraft(domain); const before = context.rows(); await press('Never mind'); expect(context.rows()).toEqual(before); view.unmount();
  } finally { context.close(); }
});

test.each(['politics', 'music'] as const)('%s actual new-life/select round trip clears an old review and form even when player IDs repeat', async domain => {
  const context = await setup(domain);
  try {
    const view = render(frame(domain)); await openReview(domain); const oldPerson = world().activePersonId, oldLife = world().id;
    await act(async () => { expect(await mockStore.getState().startLife(randomCreation(43), 43)).toBe(true); }); expect(world().id).not.toBe(oldLife); expect(world().activePersonId).toBe(oldPerson); expect(screen.queryByText(title(domain))).toBeNull();
    if (domain === 'music') { expect(screen.getByLabelText('Music release title')).toHaveDisplayValue(''); expect(screen.getByRole('button', { name: /^Single\./ })).toHaveTextContent(/Selected/); expect(screen.getByRole('button', { name: /^Folk\./ })).toHaveTextContent(/Selected/); }
    else { expect(screen.getByRole('button', { name: /^Education\./ })).toHaveTextContent(/Selected/); expect(screen.getByRole('button', { name: /^Balanced Campaign\./ })).toHaveTextContent(/Selected/); }
    await act(async () => { expect(await mockStore.getState().selectLife(oldLife)).toBe(true); }); const before = context.rows(); expect(screen.queryByText(title(domain))).toBeNull();
    if (domain === 'music') expect(screen.getByLabelText('Music release title')).toHaveDisplayValue(''); else { expect(screen.getByRole('button', { name: /^Education\./ })).toHaveTextContent(/Selected/); expect(screen.getByRole('button', { name: /^Focus on Outreach\./ })).toHaveTextContent(/Selected/); expect(screen.getByRole('button', { name: 'Review Campaign Plan' })).toBeDisabled(); }
    view.rerender(frame(domain)); expect(context.rows()).toEqual(before); view.unmount();
  } finally { context.close(); }
});

test('a real campaign withdrawal resets the ended campaign draft to a new candidacy without reusing its old plan', async () => {
  const context = await setup('politics');
  try {
    const view = render(frame('politics')); await openReview('politics'); await press('Never mind'); await press(/^Withdraw from the Election/); await press('Withdraw Candidacy'); expect(world().elections[0].candidates[0].status).toBe('withdrawn'); await press('Continue');
    const before = context.rows(); expect(screen.getByRole('button', { name: /^Education\./ })).toHaveTextContent(/Selected/); expect(screen.getByRole('button', { name: /^Balanced Campaign\./ })).toHaveTextContent(/Selected/); expect(screen.queryByRole('button', { name: 'Review Campaign Plan' })).toBeNull(); view.rerender(frame('politics')); expect(context.rows()).toEqual(before); view.unmount();
  } finally { context.close(); }
});

test('real Streamer invoice pagination resets after studio-kind and saved-life round trips without saving any UI selection', async () => {
  const context = await setup('equipment');
  try {
    const view = render(frame('equipment')), initial = world(), before = context.rows(); await press('Earlier Payments'); expect(screen.getByRole('button', { name: 'Newer Payments' })).toBeEnabled();
    mockKind = 'youtuber'; view.rerender(frame('equipment')); expect(screen.queryByRole('button', { name: 'Newer Payments' })).toBeNull(); mockKind = 'streamer'; view.rerender(frame('equipment')); expect(screen.getByRole('button', { name: 'Newer Payments' })).toBeDisabled(); expect(context.rows()).toEqual(before);
    await press('Earlier Payments'); await act(async () => { expect(await mockStore.getState().startLife(randomCreation(43), 43)).toBe(true); }); await act(async () => { expect(await mockStore.getState().selectLife(initial.id)).toBe(true); }); expect(screen.getByRole('button', { name: 'Newer Payments' })).toBeDisabled(); const selectedRows = context.rows(); view.rerender(frame('equipment')); expect(context.rows()).toEqual(selectedRows); view.unmount();
  } finally { context.close(); }
});
