import React from 'react';
import { Modal } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { decodeWorld, fullName } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { SaveRepository } from '../../src/persistence/repository';
import { EventModal } from '../../src/ui/EventModal';
import { Header } from '../../src/ui/components';
import { PendingEvent } from '../../src/ui/PendingEvent';
import { ThemeProvider } from '../../src/ui/theme';
import { database } from '../support/sqlite';
import marriage from '../fixtures/v5-marriage-result.json';

let mockStore: ReturnType<typeof createGameStore>, mockPersonId = 'person_npc_67_3';
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() }, useLocalSearchParams: () => ({ id: mockPersonId }) }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import { router } from 'expo-router';
import Person from '../../app/(game)/person/[id]';

const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><Person /><PendingEvent /></ThemeProvider></SafeAreaProvider>;
const world = () => mockStore.getState().world!;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const choose = async (name: RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('radio', { name })); }); };
const selection = () => screen.UNSAFE_getAllByType(EventModal).find(item => item.props.event?.id === 'date-activity:' + mockPersonId)!;

test('a real spouse date offers four exact prices locally, retains a failed chosen activity and commits only one explicitly confirmed outcome', async () => {
  const db = database(), repository = new SaveRepository(db.driver), archived = decodeWorld(JSON.stringify(marriage));
  if (archived.pending?.kind !== 'result') throw new Error('Expected the archived marriage result');
  // Only acknowledge the genuine saved outcome; no eligibility, money or RNG edit.
  const initial = resolveCommand(archived, { type: 'acknowledge', resultId: archived.pending.id }, true);
  await repository.initialise(); await repository.create(initial);
  let nextYield: Promise<void> | undefined;
  mockStore = createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'unused', yieldToUI: async () => { const held = nextYield; nextYield = undefined; if (held) await held; } });
  expect(await mockStore.getState().bootstrap()).toBe(true);
  const payload = () => db.sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(initial.id)!.payload;
  const receipts = () => Number(db.sqlite.prepare('SELECT count(*) AS total FROM receipts WHERE life_id=?').get(initial.id)!.total);
  const before = world(), original = payload(), count = receipts(), dispatch = jest.spyOn(mockStore.getState(), 'dispatch');
  const invite = 'Invite ' + before.people[mockPersonId].firstName;
  const view = render(frame());
  try {
    await press(/^Go on a Date\b/); expect(screen.getByText('A date with ' + fullName(before.people[mockPersonId]))).toBeOnTheScreen();
    expect(screen.getAllByRole('radio')).toHaveLength(4);
    for (const price of [/^Go for a Walk · \$0\.00/, /^Go for Coffee · \$10\.00/, /^Share a Meal · \$40\.00/, /^Watch a Movie · \$30\.00/]) expect(screen.getByRole('radio', { name: price })).toBeEnabled();
    expect(screen.getByText(/They can decline; you pay only if they accept/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: invite })).toBeDisabled();
    await choose(/^Watch a Movie\b/); const cancelled = selection().props.onChoose; await press('Never mind');
    await act(async () => { await cancelled('movie'); }); expect(dispatch).not.toHaveBeenCalled(); expect(payload()).toBe(original);
    await press(/^Go on a Date\b/); await choose(/^Go for Coffee\b/); const oldSubmit = selection().props.onChoose;
    mockPersonId = 'person_parent1'; view.rerender(frame()); await act(async () => { await oldSubmit('coffee'); });
    expect(dispatch).not.toHaveBeenCalled(); expect(screen.queryByRole('button', { name: invite })).toBeNull();
    mockPersonId = 'person_npc_67_3'; view.rerender(frame()); await press(/^Go on a Date\b/);
    expect(screen.getByRole('button', { name: invite })).toBeDisabled(); await choose(/^Go for Coffee\b/);
    expect(world()).toBe(before); expect(payload()).toBe(original); expect(receipts()).toBe(count);
    db.sqlite.exec("CREATE TRIGGER fail_date_activity BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press(invite); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/));
    expect(screen.getAllByRole('alert')).toHaveLength(1); expect(screen.getByRole('radio', { name: /^Go for Coffee\b/, checked: true })).toBeOnTheScreen();
    expect(world()).toBe(before); expect(payload()).toBe(original); expect(receipts()).toBe(count);
    db.sqlite.exec('DROP TRIGGER fail_date_activity');
    let release!: () => void; nextYield = new Promise(resolve => { release = resolve; });
    const submit = selection().props.onChoose, cancel = selection().props.onCancel, back = screen.UNSAFE_getByType(Header).props.onBack;
    await act(async () => { fireEvent.press(screen.getByRole('button', { name: invite })); void submit('coffee'); cancel(); back(); });
    expect(mockStore.getState().busy).toBe(true); expect(screen.getAllByRole('button', { busy: true })).toHaveLength(1);
    fireEvent(screen.UNSAFE_getByType(Modal), 'requestClose'); expect(router.back).not.toHaveBeenCalled();
    expect(dispatch.mock.calls).toHaveLength(2); expect(payload()).toBe(original);
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false));
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'ask-date', personId: mockPersonId, activity: 'coffee' });
    expect(world().revision).toBe(before.revision + 1); expect(receipts()).toBe(count + 1);
    expect(screen.queryByRole('button', { name: invite })).toBeNull();
    const result = world().pending; if (result?.kind !== 'result') throw new Error('Expected the actual date outcome');
    expect(screen.getByText(result.body)).toBeOnTheScreen();
    await press('Continue'); expect(screen.getByRole('button', { name: /^Go on a Date\b/ })).toBeDisabled();
  } finally { view.unmount(); jest.restoreAllMocks(); db.sqlite.close(); }
});
