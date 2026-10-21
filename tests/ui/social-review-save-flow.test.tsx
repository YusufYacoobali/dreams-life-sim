import React from 'react';
import { Modal } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { router } from 'expo-router';
import { createGameStore } from '../../src/state/gameStore';
import { encodeWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { postCost, publicActionQuote } from '../../src/game/systems/social';
import { formatMoney } from '../../src/game/money';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import { decodeSave } from '../../src/persistence/archive';
import * as checkpoints from '../../src/persistence/checkpoints';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import { EventModal } from '../../src/ui/EventModal';
import { useSocialReview } from '../../src/ui/SocialReview';
import { Button } from '../../src/ui/components';
import creatorArchive from '../fixtures/v10-creator-archive.json';

let mockStore: ReturnType<typeof createGameStore>, mockAccountId = '', mockLive: string | undefined;
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ accountId: mockAccountId, id: mockAccountId, live: mockLive }), router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import CreatePost from '../../app/(game)/create-post';
import SocialProfile from '../../app/(game)/social-profile/[id]';
import Fame from '../../app/(game)/fame';

type Domain = 'post' | 'profile' | 'fame';
const caption = 'A carefully kept original afternoon.', biography = 'Original biography remains here.';
const world = () => mockStore.getState().world!;
const frame = (domain: Domain, content?: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{content ?? (domain === 'post' ? <CreatePost /> : domain === 'profile' ? <SocialProfile /> : <Fame />)}<PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const choose = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('radio', { name })); }); };
const change = (name: string, value: string) => fireEvent.changeText(screen.getByLabelText(name), value);
const modal = () => within(screen.UNSAFE_getByType(Modal));
const confirmLabel = (domain: Domain) => domain === 'post' ? 'Publish Post' : domain === 'profile' ? 'Save Profile' : 'Confirm';
const reviewTitle = (domain: Domain) => domain === 'post' ? 'Publish this post?' : domain === 'profile' ? 'Update this profile?' : 'Attend this event?';
const commandFor = (domain: Domain): GameCommand => domain === 'post' ? { type: 'publish-post', accountId: mockAccountId, kind: 'photo', intent: 'polished', caption, sponsored: false, liveMinutes: 0 } : domain === 'profile' ? { type: 'edit-social', accountId: mockAccountId, handle: 'reviewed_creator', bio: biography } : { type: 'public-action', action: 'event' };
const acknowledge = (input: World) => resolveCommand(input, { type: 'acknowledge', resultId: input.pending!.id }, true);
async function prepare(domain: Domain) {
  if (domain === 'post') { change('Post caption', caption); await choose(/^Produce a Polished Post\./); await press('Review Post'); }
  else if (domain === 'profile') { await press(/^Edit Profile$/); change('Edit social handle', 'reviewed_creator'); change('Edit profile biography', biography); await press('Review Profile Changes'); }
  else await press(/^Attend an Event\./);
}
function draftRetained(domain: Domain) {
  if (domain === 'post') { expect(screen.getByLabelText('Post caption')).toHaveProp('value', caption); expect(screen.getByRole('radio', { name: /^Produce a Polished Post\./, checked: true })).toHaveProp('accessibilityLabel', expect.stringContaining('Selected')); }
  if (domain === 'profile') { expect(screen.getByLabelText('Edit social handle')).toHaveProp('value', 'reviewed_creator'); expect(screen.getByLabelText('Edit profile biography')).toHaveProp('value', biography); }
}
async function setup() {
  // Actual original active creator snapshot: existing audience, prior posts, fame,
  // paid work and saved random streams remain untouched. No configured success.
  const save = decodeSave(JSON.stringify(creatorArchive)), initial = checkpoints.unpackCheckpoint(save.snapshots[0].payload, true);
  mockAccountId = initial.socialAccounts[0].id; mockLive = undefined;
  const directory = mkdtempSync(join(tmpdir(), 'dreams-social-review-')), path = join(directory, 'dreams.db'); let sqlite: DatabaseSync;
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
afterEach(() => { jest.restoreAllMocks(); jest.clearAllMocks(); });

test.each(['post', 'profile', 'fame'] as const)('%s retains an exact reviewed draft and one alert on rollback; retries warm, cold and once', async domain => {
  const context = await setup();
  try {
    const initial = world(), before = encodeWorld(initial), beforeRows = context.rows(), expected = resolveCommand(initial, commandFor(domain), true), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    expect(Object.keys(beforeRows)).toHaveLength(8); let view = render(frame(domain)); await prepare(domain); const originalReview = modal().getByText(reviewTitle(domain)); expect(originalReview).toBeOnTheScreen();
    if (domain !== 'profile') expect(modal().getByText(domain === 'post' ? formatMoney(postCost(initial, 'polished')) : formatMoney(publicActionQuote(initial, 'event')))).toBeOnTheScreen();
    const discarded = screen.UNSAFE_getAllByType(EventModal).find(item => item.props.event?.kind === 'confirmation')!.props.onChoose;
    await press('Never mind'); await act(async () => { await discarded('confirm'); }); draftRetained(domain); expect(encodeWorld(world())).toBe(before); expect(context.rows()).toEqual(beforeRows);
    if (domain === 'profile') await press('Review Profile Changes'); else if (domain === 'post') await press('Review Post'); else await prepare(domain);
    context.sqlite.exec("CREATE TRIGGER fail_social_review BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await press(confirmLabel(domain));
    await waitFor(() => expect(modal().getByRole('alert')).toHaveTextContent(/couldn't be saved/)); expect(screen.getAllByText(/couldn't be saved/)).toHaveLength(1); expect(modal().getByText(reviewTitle(domain))).toBeOnTheScreen(); draftRetained(domain); expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows); expect(router.back).not.toHaveBeenCalled(); expect(router.push).not.toHaveBeenCalled();
    if (domain !== 'profile') expect(modal().getByText(domain === 'post' ? formatMoney(postCost(initial, 'polished')) : formatMoney(publicActionQuote(initial, 'event')))).toBeOnTheScreen();
    context.sqlite.exec('DROP TRIGGER fail_social_review'); await press(confirmLabel(domain)); expect(world()).toEqual(expected); expect(screen.queryByText(reviewTitle(domain))).toBeNull(); if (domain === 'profile') expect(screen.queryByLabelText('Edit social handle')).toBeNull(); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    const savedRows = context.rows(); view.unmount(); await context.cold(); view = render(frame(domain)); expect(world()).toEqual(expected); expect(context.rows()).toEqual(savedRows); expect(screen.getByText(expected.pending!.title)).toBeOnTheScreen();
    await press('Continue'); const done = acknowledge(expected); expect(world()).toEqual(done); expect(world().workHistory).toEqual(initial.workHistory); expect(world().date).toEqual(initial.date);
    const doneRows = context.rows(); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: expected.pending!.id })).toBe(false); }); expect(world()).toEqual(done); expect(context.rows()).toEqual(doneRows); view.unmount();
  } finally { context.close(); }
});

test.each(['post', 'profile', 'fame'] as const)('%s preserves the reviewed command during duplicate presses, busy edits, cancellation and Android Back', async domain => {
  const context = await setup();
  try {
    const initial = world(), beforeRows = context.rows(), expected = resolveCommand(initial, commandFor(domain), true), dispatch = jest.spyOn(mockStore.getState(), 'dispatch'), view = render(frame(domain)); await prepare(domain);
    const callbacks = screen.UNSAFE_getAllByType(EventModal).find(item => item.props.event?.kind === 'confirmation')!.props;
    const release = context.pauseNextSave(); await act(async () => { fireEvent.press(screen.getByRole('button', { name: confirmLabel(domain) })); void callbacks.onChoose('confirm'); callbacks.onCancel(); });
    expect(dispatch).toHaveBeenCalledTimes(1); expect(mockStore.getState().busy).toBe(true); expect(modal().getByRole('button', { name: confirmLabel(domain) })).toHaveProp('accessibilityState', { disabled: true, busy: true });
    if (domain === 'post') { expect(screen.getByLabelText('Post caption')).toHaveProp('editable', false); expect(screen.getByRole('radio', { name: /^Keep It Authentic\./ })).toBeDisabled(); await choose(/^Keep It Authentic\./); }
    if (domain === 'profile') { expect(screen.getByLabelText('Edit social handle')).toHaveProp('editable', false); expect(screen.getByRole('button', { name: 'Save Posting Routine' })).toHaveProp('accessibilityState', { disabled: true, busy: false }); }
    if (domain === 'fame') { expect(screen.getByRole('button', { name: /^Do an Interview\./ })).toBeDisabled(); await press(/^Do an Interview\./); }
    await press(confirmLabel(domain)); await press('Never mind'); await act(async () => { screen.UNSAFE_getByType(Modal).props.onRequestClose(); }); expect(modal().getByText(reviewTitle(domain))).toBeOnTheScreen(); expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows);
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false)); expect(world()).toEqual(expected); expect(world().revision).toBe(initial.revision + 1); view.unmount();
  } finally { context.close(); }
});

test('current posting plan saves nothing; local picker choices and cancellation stay immediate; failed changed routine retains its draft', async () => {
  const context = await setup();
  try {
    const initial = world(), beforeRows = context.rows(), expected = resolveCommand(initial, { type: 'social-routine', accountId: mockAccountId, cadence: 'monthly', topic: 'photo', intent: 'authentic' }, true), view = render(frame('profile'));
    expect(screen.getByRole('button', { name: 'Save Posting Routine' })).toBeDisabled(); await press('Save Posting Routine'); expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows);
    await press(/^Schedule\./); fireEvent.press(modal().getByRole('radio', { name: 'One post each month' })); await press('Never mind'); expect(screen.getByRole('button', { name: 'Save Posting Routine' })).toBeDisabled();
    await press(/^Schedule\./); fireEvent.press(modal().getByRole('radio', { name: 'One post each month' })); await press('Choose'); expect(screen.queryByText('Posting Schedule')).toBeNull(); expect(screen.getByRole('button', { name: 'Save Posting Routine' })).toBeEnabled(); expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows);
    const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); context.sqlite.exec("CREATE TRIGGER fail_social_review BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await press('Save Posting Routine'); await waitFor(() => expect(screen.getByText(/couldn't be saved/)).toBeOnTheScreen()); expect(screen.getByRole('button', { name: /^Schedule\./ })).toHaveProp('accessibilityLabel', expect.stringContaining('One post each month')); expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows);
    context.sqlite.exec('DROP TRIGGER fail_social_review'); await press('Save Posting Routine'); expect(world()).toEqual(expected); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore(); const savedRows = context.rows(); view.unmount(); await context.cold(); const coldView = render(frame('profile')); expect(world()).toEqual(expected); expect(context.rows()).toEqual(savedRows); await press('Continue'); expect(screen.getByRole('button', { name: 'Save Posting Routine' })).toBeDisabled(); coldView.unmount();
  } finally { context.close(); }
});

test.each(['post', 'profile'] as const)('%s route identity drops stale local drafts and reviews without game, save or random work', async domain => {
  const context = await setup();
  try {
    const initial = world(), beforeRows = context.rows(), id = mockAccountId, expected = resolveCommand(initial, commandFor(domain), true), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), view = render(frame(domain)); await prepare(domain);
    const captured = screen.UNSAFE_getAllByType(EventModal).find(item => item.props.event?.kind === 'confirmation')!.props.onChoose;
    mockAccountId = 'unavailable_profile'; view.rerender(frame(domain)); expect(screen.queryByText(reviewTitle(domain))).toBeNull(); mockAccountId = id; view.rerender(frame(domain)); expect(screen.queryByText(reviewTitle(domain))).toBeNull();
    if (domain === 'post') expect(screen.getByLabelText('Post caption')).toHaveProp('value', ''); else { expect(screen.queryByLabelText('Edit social handle')).toBeNull(); await press('Edit Profile'); expect(screen.getByLabelText('Edit social handle')).toHaveProp('value', initial.socialAccounts[0].handle); }
    await act(async () => { await captured('confirm'); });
    expect(expected.revision).toBe(initial.revision + 1);
    expect(world().revision).toBe(initial.revision); expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows); expect(unpack).not.toHaveBeenCalled(); view.unmount();
  } finally { context.close(); }
});

function SavedCallbackReview({ context, onSaved }: { context: string; onSaved: () => void }) {
  const review = useSocialReview(context);
  return <><Button label="Review Profile" onPress={() => review.confirm(commandFor('profile') as Parameters<typeof review.confirm>[0], 'Update this profile?', 'Keep the recorded audience and identity.', [], 'social', 'Save Profile', onSaved)} />{review.modal}</>;
}

test.each(['changed context', 'unmounted'] as const)('an already submitted social save may finish after %s without calling its old onSaved', async change => {
  const context = await setup();
  try {
    const initial = world(), expected = resolveCommand(initial, commandFor('profile'), true), onSaved = jest.fn(), view = render(frame('profile', <SavedCallbackReview context="original" onSaved={onSaved} />));
    await press('Review Profile'); const captured = screen.UNSAFE_getAllByType(EventModal).find(item => item.props.event?.kind === 'confirmation')!.props.onChoose;
    const release = context.pauseNextSave(); await press('Save Profile'); expect(mockStore.getState().busy).toBe(true);
    if (change === 'unmounted') view.unmount(); else view.rerender(frame('profile', <SavedCallbackReview context="another" onSaved={onSaved} />));
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false));
    expect(world()).toEqual(expected); expect(onSaved).not.toHaveBeenCalled();
    const rows = context.rows(); await act(async () => { await captured('confirm'); }); expect(context.rows()).toEqual(rows);
    if (change !== 'unmounted') view.unmount();
  } finally { context.close(); }
});
