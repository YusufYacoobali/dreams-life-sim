import React from 'react';
import { Pressable } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '../support/rendering';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../../src/ui/theme';
import { createGameStore } from '../../src/state/gameStore';
import { SaveRepository } from '../../src/persistence/repository';
import { resolveCommand } from '../../src/game/engine';
import { decodeWorld, encodeWorld } from '../../src/game/model';
import graduate from '../fixtures/v3-employed-graduate.json';
import { database } from '../support/sqlite';
let mockStore: ReturnType<typeof createGameStore>;
jest.mock('../../src/state/useGame', () => ({ useGame: (select: unknown) => require('zustand').useStore(mockStore, select) }));
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
import Life from '../../app/(game)/(tabs)/life';
test('the annual-advance button shows saving feedback before simulation/storage can begin and rejects another tap', async () => {
  jest.useFakeTimers();
  const initial = decodeWorld(JSON.stringify(graduate));
  const { sqlite, driver } = database(), repository = new SaveRepository(driver);
  await repository.initialise(); await repository.create(initial);
  let block = false, release!: () => void;
  mockStore = createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'unused', yieldToUI: () => block ? new Promise<void>(resolve => { release = resolve; }) : Promise.resolve() });
  await mockStore.getState().bootstrap(); block = true;
  let inflight: Promise<unknown> | undefined;
  try {
    await render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 320, height: 640 }, insets: { top: 24, bottom: 24, left: 0, right: 0 } }}><ThemeProvider><Life /></ThemeProvider></SafeAreaProvider>);
    const before = encodeWorld(initial), receipts = sqlite.prepare('SELECT count(*) AS n FROM receipts').get()!.n;
    const press = screen.UNSAFE_getAllByType(Pressable).find(row => row.props.accessibilityLabel === 'Age Up')!.props.onPress;
    await act(async () => { inflight = press(); });
    expect(screen.getByRole('button', { name: 'Age Up', busy: true })).toBeDisabled();
    expect(screen.getByLabelText('Saving your year')).toBeOnTheScreen();
    expect(encodeWorld(mockStore.getState().world!)).toBe(before); expect(encodeWorld(await repository.load(initial.id))).toBe(before);
    expect(press()).toBe(false);
    await act(async () => { release(); await inflight; });
    expect(mockStore.getState().world).toEqual(resolveCommand(initial, { type: 'advance' }, true));
    expect(sqlite.prepare('SELECT count(*) AS n FROM receipts').get()!.n).toBe(Number(receipts) + 1);
  } finally { await act(async () => { release?.(); await inflight; }); sqlite.close(); jest.useRealTimers(); }
});
