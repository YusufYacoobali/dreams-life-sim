import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { decodeWorld } from '../../src/game/model';
import { recordDeath } from '../../src/game/engine';
import { childrenOf } from '../../src/game/systems/family';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { ThemeProvider } from '../../src/ui/theme';
import fixture from '../fixtures/v6-birth-result.json';
let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { back: jest.fn(), replace: jest.fn(), navigate: jest.fn() }, Redirect: () => null,
  useFocusEffect: (callback: () => void) => require('react').useEffect(callback, [callback]),
}));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Legacy from '../../app/legacy';
import TimeMachine from '../../app/time-machine';
test('a failed legacy write leaves the deceased life intact and a retry cold-loads the same child and remaining months', async () => {
  const { sqlite, driver } = database(); const repository = new SaveRepository(driver); await repository.initialise();
  const initial = decodeWorld(JSON.stringify(fixture)); recordDeath(initial, initial.activePersonId, 'test fixture'); const child = childrenOf(initial)[0]; await repository.create(initial);
  const deps = { repository: async () => repository, date: () => initial.date, id: () => 'life_unused' };
  mockStore = createGameStore(deps); await mockStore.getState().bootstrap();
  sqlite.exec("CREATE TRIGGER fail_receipt BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  const frame = (content: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, bottom: 48, left: 0, right: 0 } }}><ThemeProvider>{content}</ThemeProvider></SafeAreaProvider>;
  const view = render(frame(<Legacy />));
  // Terminal routes have no game tab bar to reserve the system-navigation edge.
  expect(screen.UNSAFE_getByType(SafeAreaView).props.edges).toEqual(['top', 'bottom']);
  expect(screen.queryByRole('tablist')).toBeNull();
  view.rerender(frame(<TimeMachine />)); await waitFor(() => expect(mockStore.getState().busy).toBe(false));
  expect(screen.UNSAFE_getByType(SafeAreaView).props.edges).toEqual(['top', 'bottom']);
  expect(screen.queryByRole('tablist')).toBeNull(); expect(mockStore.getState().world).toEqual(initial);
  view.rerender(frame(<Legacy />));
  fireEvent.press(screen.getByRole('button', { name: 'Continue as ' + child.firstName }));
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Continue Their Life' })); });
  await waitFor(() => expect(screen.getByText(/couldn't be saved/)).toBeOnTheScreen()); expect(await repository.load(initial.id)).toEqual(initial);
  sqlite.exec('DROP TRIGGER fail_receipt');
  fireEvent.press(screen.getByRole('button', { name: 'Continue as ' + child.firstName }));
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Continue Their Life' })); });
  const restarted = createGameStore(deps); await restarted.getState().bootstrap(); const durable = restarted.getState().world!;
  expect(durable.activePersonId).toBe(child.id); expect(durable.people[child.id]).toEqual(child); expect(durable.annual?.monthsProcessed).toBe(9); expect(durable.date).toEqual(initial.date); expect(durable.estates).toEqual(initial.estates);
  expect(mockStore.getState().lives[0].name).toBe(child.firstName + ' ' + child.lastName);
  view.rerender(frame(<TimeMachine />)); await waitFor(() => expect(mockStore.getState().busy).toBe(false));
  expect(screen.UNSAFE_getByType(SafeAreaView).props.edges).toEqual(['top']);
  expect(screen.getByRole('tablist')).toHaveStyle({ paddingBottom: 48 });
  expect(mockStore.getState().world).toEqual(durable);
  view.unmount(); sqlite.close();
});
