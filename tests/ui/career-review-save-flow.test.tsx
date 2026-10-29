import React from 'react';
import { Modal } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGameStore } from '../../src/state/gameStore';
import { encodeWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { serviceQualified } from '../../src/game/systems/serviceSchemas';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import { decodeSave } from '../../src/persistence/archive';
import * as checkpoints from '../../src/persistence/checkpoints';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import { EventModal } from '../../src/ui/EventModal';
import actorArchive from '../fixtures/v12-career-archive.json';
import serviceArchive from '../fixtures/v16-service-archive.json';

let mockStore: ReturnType<typeof createGameStore>, mockKind = 'actor';
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ kind: mockKind }), router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Career from '../../app/(game)/career/[kind]';
import Service from '../../app/(game)/service/[kind]';

type Domain = 'career' | 'service';
const world = () => mockStore.getState().world!;
const frame = (domain: Domain) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{domain === 'career' ? <Career /> : <Service />}<PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp, role: 'button' | 'radio' = 'button') => { await act(async () => { fireEvent.press(screen.getByRole(role, { name })); }); };
const modal = () => within(screen.UNSAFE_getByType(Modal));
const acknowledge = (initial: World) => resolveCommand(initial, { type: 'acknowledge', resultId: initial.pending!.id }, true);
const currentLabel = (domain: Domain) => domain === 'career' ? /^Keep a Balance\..*This is your current career focus$/ : /^Balanced Routine\..*This is your current service routine$/;
const changedLabel = (domain: Domain) => domain === 'career' ? /^Focus on the Work\./ : /^Careful Routine\./;
const otherLabel = (domain: Domain) => domain === 'career' ? /^Build Public Exposure\./ : /^Focused Routine\./;
const confirmLabel = (domain: Domain) => domain === 'career' ? 'Set Career Focus' : 'Set Routine';
const reviewTitle = (domain: Domain) => domain === 'career' ? 'Update your career focus?' : 'Set your working routine?';
const commandFor = (domain: Domain): GameCommand => domain === 'career' ? { type: 'career-focus', careerId: world().careers[0].id, focus: 'craft' } : { type: 'service-focus', serviceId: world().serviceCareers[0].id, focus: 'careful' };

async function setup(domain: Domain) {
  // Existing actual archived journeys: no accepted assessment, qualification,
  // experience, salary or random outcome is manufactured for these UI cases.
  const save = decodeSave(JSON.stringify(domain === 'career' ? actorArchive : serviceArchive));
  let initial = domain === 'career' ? checkpoints.unpackCheckpoint(save.snapshots[0].payload, true) : save.world;
  if (domain === 'service') {
    expect(initial.pending?.title).toBe('Your assignment has ended');
    initial = acknowledge(initial); // The recorded year is paused for planning after actual qualified service.
    expect(serviceQualified(initial.serviceCareers[0])).toBe(true);
    expect(initial.serviceCareers[0].assignments[0].status).toBe('completed');
  }
  mockKind = domain === 'career' ? 'actor' : 'military';
  const directory = mkdtempSync(join(tmpdir(), 'dreams-career-review-')), path = join(directory, 'dreams.db'); let sqlite: DatabaseSync;
  const connect = (): SqlDatabase => {
    sqlite = new DatabaseSync(path); sqlite.exec('PRAGMA foreign_keys=ON'); const connection = sqlite;
    const session: SqlSession = { run: async (sql, values = []) => { connection.prepare(sql).run(...values); }, get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null, all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[] };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => { connection.exec('BEGIN IMMEDIATE'); try { const value = await action(session); connection.exec('COMMIT'); return value; } catch (error) { connection.exec('ROLLBACK'); throw error; } } };
  };
  const repository = new SaveRepository(connect()); await repository.initialise(); await repository.create(initial);
  let nextYield: Promise<void> | undefined;
  const pauseNextSave = () => { let release!: () => void; nextYield = new Promise<void>(resolve => { release = resolve; }); return release; };
  const bootstrap = async (repo: SaveRepository) => { mockStore = createGameStore({ repository: async () => repo, date: () => initial.date, id: () => 'life_unused', yieldToUI: async () => { const pause = nextYield; nextYield = undefined; if (pause) await pause; } }); expect(await mockStore.getState().bootstrap()).toBe(true); };
  await bootstrap(repository);
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  return { get sqlite() { return sqlite; }, rows, pauseNextSave, cold: async () => { sqlite.close(); await bootstrap(new SaveRepository(connect())); }, close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); } };
}

test.each(['career', 'service'] as const)('%s current option/cancel saves nothing; a failed actual focus keeps one alert and retries warm, cold and once', async domain => {
  const context = await setup(domain);
  try {
    const initial = world(), beforeRows = context.rows(), before = encodeWorld(initial), command = commandFor(domain), expected = resolveCommand(initial, command, true), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    let view = render(frame(domain)); if (domain === 'career') expect(screen.getByRole('radio', { name: currentLabel(domain) })).toBeChecked(); expect(screen.getByRole(domain === 'career' ? 'radio' : 'button', { name: currentLabel(domain) })).toBeDisabled(); await press(currentLabel(domain), domain === 'career' ? 'radio' : 'button'); expect(screen.queryByText(reviewTitle(domain))).toBeNull();
    await press(changedLabel(domain), domain === 'career' ? 'radio' : 'button'); const discarded = screen.UNSAFE_getAllByType(EventModal).find(item => item.props.event?.kind === 'confirmation')!.props.onChoose;
    await press('Never mind'); await act(async () => { await discarded('confirm'); }); expect(encodeWorld(world())).toBe(before); expect(context.rows()).toEqual(beforeRows);
    await press(changedLabel(domain), domain === 'career' ? 'radio' : 'button'); context.sqlite.exec("CREATE TRIGGER fail_career_review BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press(confirmLabel(domain)); await waitFor(() => expect(modal().getByRole('alert')).toHaveTextContent(/couldn't be saved/)); expect(screen.getAllByText(/couldn't be saved/)).toHaveLength(1); expect(modal().getByText(reviewTitle(domain))).toBeOnTheScreen(); expect(modal().getByRole('button', { name: confirmLabel(domain) })).toBeEnabled(); expect(encodeWorld(world())).toBe(before); expect(context.rows()).toEqual(beforeRows);
    context.sqlite.exec('DROP TRIGGER fail_career_review'); await press(confirmLabel(domain)); expect(world()).toEqual(expected); expect(screen.queryByText(reviewTitle(domain))).toBeNull(); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    const savedRows = context.rows(); view.unmount(); await context.cold(); view = render(frame(domain)); expect(world()).toEqual(expected); expect(context.rows()).toEqual(savedRows); expect(screen.getByText(expected.pending!.title)).toBeOnTheScreen();
    await press('Continue'); const done = acknowledge(expected); expect(world()).toEqual(done); expect(world().workHistory).toEqual(initial.workHistory); expect(world().people).toEqual(initial.people); expect(world().accounts).toEqual(initial.accounts); expect(world().ledger).toEqual(initial.ledger); expect(world().random).toEqual(initial.random);
    if (domain === 'career') expect(world().careers[0].projects).toEqual(initial.careers[0].projects); else expect(world().serviceCareers[0].contracts).toEqual(initial.serviceCareers[0].contracts);
    const doneRows = context.rows(); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: expected.pending!.id })).toBe(false); }); expect(world()).toEqual(done); expect(context.rows()).toEqual(doneRows); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});

test.each(['career', 'service'] as const)('%s review keeps its chosen command through busy duplicate presses, cancellation and Android Back', async domain => {
  const context = await setup(domain);
  try {
    const initial = world(), beforeRows = context.rows(), expected = resolveCommand(initial, commandFor(domain), true), dispatch = jest.spyOn(mockStore.getState(), 'dispatch'), view = render(frame(domain)); await press(changedLabel(domain), domain === 'career' ? 'radio' : 'button');
    const callbacks = screen.UNSAFE_getAllByType(EventModal).find(item => item.props.event?.kind === 'confirmation')!.props;
    const release = context.pauseNextSave(); await act(async () => { fireEvent.press(screen.getByRole('button', { name: confirmLabel(domain) })); void callbacks.onChoose('confirm'); callbacks.onCancel(); });
    expect(dispatch).toHaveBeenCalledTimes(1); expect(mockStore.getState().busy).toBe(true); expect(modal().getByRole('button', { name: confirmLabel(domain) })).toHaveProp('accessibilityState', { disabled: true, busy: true });
    expect(screen.getByRole(domain === 'career' ? 'radio' : 'button', { name: otherLabel(domain) })).toBeDisabled(); await press(otherLabel(domain), domain === 'career' ? 'radio' : 'button'); await press(confirmLabel(domain)); await press('Never mind'); await act(async () => { screen.UNSAFE_getByType(Modal).props.onRequestClose(); });
    expect(modal().getByText(reviewTitle(domain))).toBeOnTheScreen(); expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows);
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false)); expect(world()).toEqual(expected); expect(world().revision).toBe(initial.revision + 1); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});

test('a new career kind drops the previous reviewed command and does not resurrect it on return', async () => {
  const context = await setup('career');
  try {
    const initial = world(), beforeRows = context.rows(), expected = resolveCommand(initial, commandFor('career'), true), view = render(frame('career')); await press(changedLabel('career'), 'radio'); expect(screen.getByText(reviewTitle('career'))).toBeOnTheScreen();
    const captured = screen.UNSAFE_getAllByType(EventModal).find(item => item.props.event?.kind === 'confirmation')!.props.onChoose;
    mockKind = 'model'; view.rerender(frame('career')); expect(screen.queryByText(reviewTitle('career'))).toBeNull(); mockKind = 'actor'; view.rerender(frame('career')); expect(screen.queryByText(reviewTitle('career'))).toBeNull();
    await act(async () => { await captured('confirm'); });
    expect(expected.revision).toBe(initial.revision + 1);
    expect(world().revision).toBe(initial.revision); expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows); view.unmount();
  } finally { context.close(); }
});

test('a cancelled career confirmation and cancellation cannot act on its replacement review', async () => {
  const context = await setup('career');
  try {
    const initial = world(), rows = context.rows(), view = render(frame('career')); await press(changedLabel('career'), 'radio');
    const old = screen.UNSAFE_getAllByType(EventModal).find(item => item.props.event?.kind === 'confirmation')!.props;
    await press('Never mind'); await press(otherLabel('career'), 'radio');
    const replacement = screen.UNSAFE_getAllByType(EventModal).find(item => item.props.event?.kind === 'confirmation')!.props.event;
    await act(async () => { old.onCancel(); await old.onChoose('confirm'); });
    expect(world()).toBe(initial); expect(context.rows()).toEqual(rows);
    expect(screen.UNSAFE_getAllByType(EventModal).find(item => item.props.event?.kind === 'confirmation')!.props.event).toBe(replacement);
    const expected = resolveCommand(initial, { type: 'career-focus', careerId: initial.careers[0].id, focus: 'publicity' }, true);
    await press('Set Career Focus'); expect(world()).toEqual(expected); view.unmount();
  } finally { context.close(); }
});
