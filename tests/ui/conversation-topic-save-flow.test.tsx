import React from 'react';
import { Modal } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { decodeWorld, fullName } from '../../src/game/model';
import { SaveRepository } from '../../src/persistence/repository';
import { EventModal } from '../../src/ui/EventModal';
import { Header } from '../../src/ui/components';
import { PendingEvent } from '../../src/ui/PendingEvent';
import { ThemeProvider } from '../../src/ui/theme';
import { database } from '../support/sqlite';
import fixture from '../fixtures/v3-employed-graduate.json';

let mockStore: ReturnType<typeof createGameStore>, mockPersonId = 'person_parent1';
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() }, useLocalSearchParams: () => ({ id: mockPersonId }) }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import { router } from 'expo-router';
import Person from '../../app/(game)/person/[id]';

const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><Person /><PendingEvent /></ThemeProvider></SafeAreaProvider>;
const world = () => mockStore.getState().world!;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const choose = async (name: RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('radio', { name })); }); };
const selection = () => screen.UNSAFE_getAllByType(EventModal).find(item => item.props.event?.kind === 'selection')!;

async function setup() {
  const db = database(), repository = new SaveRepository(db.driver), initial = decodeWorld(JSON.stringify(fixture));
  await repository.initialise(); await repository.create(initial);
  let nextYield: Promise<void> | undefined;
  const pause = () => { let release!: () => void; nextYield = new Promise(resolve => { release = resolve; }); return release; };
  mockStore = createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'unused', yieldToUI: async () => { const held = nextYield; nextYield = undefined; if (held) await held; } });
  expect(await mockStore.getState().bootstrap()).toBe(true);
  const payload = () => db.sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(initial.id)!.payload;
  const receipts = () => Number(db.sqlite.prepare('SELECT count(*) AS total FROM receipts WHERE life_id=?').get(initial.id)!.total);
  return { ...db, repository, pause, payload, receipts };
}

beforeEach(() => { mockPersonId = 'person_parent1'; jest.clearAllMocks(); });
afterEach(() => { jest.restoreAllMocks(); });

test('a genuine parent topic stays local until confirmed, retains its failed draft and commits one real conversation after a guarded retry', async () => {
  const context = await setup();
  try {
    const before = world(), payload = context.payload(), count = context.receipts(), dispatch = jest.spyOn(mockStore.getState(), 'dispatch');
    const view = render(frame()); await press('Have a Conversation');
    expect(screen.getByText('Talk to ' + fullName(before.people[mockPersonId]))).toBeOnTheScreen();
    expect(screen.getAllByRole('radio')).toHaveLength(6);
    expect(screen.getByRole('radio', { name: /^Interests\b/ })).toBeDisabled();
    expect(screen.getByRole('radio', { name: /^School and study\b/ })).toHaveProp('accessibilityLabel', expect.stringContaining('completed study at New York University'));
    expect(screen.getByRole('radio', { name: /^Work\b/ })).toHaveProp('accessibilityLabel', expect.stringContaining('Developer at New York Technology'));
    expect(screen.getByRole('button', { name: 'Have Conversation' })).toBeDisabled();
    await choose(/^Family\b/); expect(dispatch).not.toHaveBeenCalled(); await press('Never mind');
    expect(world()).toBe(before); expect(context.payload()).toBe(payload); expect(context.receipts()).toBe(count);
    await press('Have a Conversation'); await choose(/^Family\b/);
    context.sqlite.exec("CREATE TRIGGER fail_conversation BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press('Have Conversation'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/));
    expect(screen.getAllByRole('alert')).toHaveLength(1); expect(screen.getByRole('radio', { name: /^Family\b/, checked: true })).toBeOnTheScreen();
    expect(world()).toBe(before); expect(context.payload()).toBe(payload); expect(context.receipts()).toBe(count);
    context.sqlite.exec('DROP TRIGGER fail_conversation');
    const submit = selection().props.onChoose, cancel = selection().props.onCancel, back = screen.UNSAFE_getByType(Header).props.onBack, release = context.pause();
    await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Have Conversation' })); void submit('family'); cancel(); back(); });
    expect(mockStore.getState().busy).toBe(true); expect(screen.getAllByRole('button', { busy: true })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Have Conversation' })).toBeDisabled(); expect(screen.getByRole('button', { name: 'Never mind' })).toBeDisabled();
    fireEvent(screen.UNSAFE_getByType(Modal), 'requestClose'); expect(router.back).not.toHaveBeenCalled();
    expect(dispatch.mock.calls).toHaveLength(2); expect(context.payload()).toBe(payload);
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false));
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'interact', action: 'talk', personId: 'person_parent1', topic: 'family' });
    expect(world().revision).toBe(before.revision + 1); expect(context.receipts()).toBe(count + 1);
    expect(screen.queryByRole('button', { name: 'Have Conversation' })).toBeNull();
    const result = world().pending; if (result?.kind !== 'result') throw new Error('Expected the actual conversation result');
    expect(screen.getByText(result.body)).toBeOnTheScreen(); expect(result.body).not.toContain('discussion about food');
    expect(world().accounts).toEqual(before.accounts); expect(world().ledger).toEqual(before.ledger);
    await press('Continue'); expect(screen.getByRole('button', { name: /^Have a Conversation\./ })).toBeDisabled(); view.unmount();
  } finally { context.sqlite.close(); }
});

test('changing the actual person resets the topic review and makes the former person’s captured submit callback inert', async () => {
  const context = await setup();
  try {
    const before = world(), payload = context.payload(), count = context.receipts(), dispatch = jest.spyOn(mockStore.getState(), 'dispatch');
    const view = render(frame()); await press('Have a Conversation'); await choose(/^Family\b/); const oldSubmit = selection().props.onChoose;
    mockPersonId = 'person_parent2'; view.rerender(frame()); expect(screen.queryByRole('button', { name: 'Have Conversation' })).toBeNull();
    await act(async () => { await oldSubmit('family'); }); expect(dispatch).not.toHaveBeenCalled();
    await press('Have a Conversation'); expect(screen.getByText('Talk to ' + fullName(before.people[mockPersonId]))).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Have Conversation' })).toBeDisabled(); await choose(/^How you’re feeling\b/);
    const cancelledSubmit = selection().props.onChoose; await press('Never mind'); await act(async () => { await cancelledSubmit('feelings'); });
    expect(dispatch).not.toHaveBeenCalled(); expect(world()).toBe(before); expect(context.payload()).toBe(payload); expect(context.receipts()).toBe(count);
    expect(within(screen.UNSAFE_getAllByType(Header)[0]).getByRole('button', { name: 'Back' })).toBeEnabled(); view.unmount();
  } finally { context.sqlite.close(); }
});
