import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { ThemeProvider } from '../../src/ui/theme';
let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() }, useLocalSearchParams: () => ({ seed: '42' }), useFocusEffect: jest.fn(), Redirect: () => null }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector), freshSeed: () => 42, gameStore: { getState: () => mockStore.getState() } }));
import NewLife from '../../app/new-life';
import Birth from '../../app/birth';
import Life from '../../app/(game)/(tabs)/life';
const frame = (child: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{child}</ThemeProvider></SafeAreaProvider>;
test('a newly created life reaches the newborn and first Life screen with Number-only Intl; failed creation and birth saves remain retryable', async () => {
  const NativeNumberFormat = Intl.NumberFormat;
  const numberFormat = jest.spyOn(Intl, 'NumberFormat').mockImplementation((locale, options) => {
    const formatter = new NativeNumberFormat(locale, options), check = (value: unknown) => { if (typeof value === 'bigint') throw new TypeError('Cannot convert BigInt to number'); };
    return { format: value => { check(value); return formatter.format(value as number); }, formatToParts: value => { check(value); return formatter.formatToParts(value as number); }, resolvedOptions: () => formatter.resolvedOptions() } as Intl.NumberFormat;
  });
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); mockStore = createGameStore({ repository: async () => repository, date: () => ({ year: 2026, month: 10, day: 19 }), id: () => 'life_opening' }); await mockStore.getState().bootstrap();
  const view = render(frame(<NewLife />)); fireEvent.changeText(screen.getByLabelText('First name'), 'Alex'); fireEvent.changeText(screen.getByLabelText('Last name'), 'Carter');
  sqlite.exec("CREATE TRIGGER fail_new_life BEFORE INSERT ON lives BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Start My Life' })); }); await waitFor(() => expect(screen.getByText(/couldn't be saved/)).toBeOnTheScreen()); expect(mockStore.getState().world).toBeNull(); expect(await repository.list()).toEqual([]);
  sqlite.exec('DROP TRIGGER fail_new_life'); await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Start My Life' })); }); await waitFor(() => expect(mockStore.getState().world?.id).toBe('life_opening')); const newborn = mockStore.getState().world!; expect(newborn.birthAcknowledged).toBe(false); expect(newborn.people[newborn.activePersonId].firstName).toBe('Alex');
  view.rerender(frame(<Birth />)); expect(screen.getByText('Welcome to the World!')).toBeOnTheScreen(); sqlite.exec("CREATE TRIGGER fail_birth BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Begin Life!' })); }); await waitFor(() => expect(screen.getByText(/couldn't be saved/)).toBeOnTheScreen()); expect(mockStore.getState().world!.birthAcknowledged).toBe(false); expect((await repository.load(newborn.id)).birthAcknowledged).toBe(false);
  sqlite.exec('DROP TRIGGER fail_birth'); await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Begin Life!' })); }); await waitFor(() => expect(mockStore.getState().world!.birthAcknowledged).toBe(true)); view.rerender(frame(<Life />)); expect(screen.getByText('Bank Balance')).toBeOnTheScreen(); expect(screen.getByText('Alex Carter')).toBeOnTheScreen(); expect(screen.getByRole('button', { name: 'Age Up' })).toBeEnabled(); expect(screen.getAllByRole('progressbar')).toHaveLength(5); expect(await repository.load(newborn.id)).toEqual(mockStore.getState().world); numberFormat.mockRestore(); view.unmount(); sqlite.close();
});
