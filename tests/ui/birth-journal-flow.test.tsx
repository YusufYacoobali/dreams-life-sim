import React from 'react';
import * as ReactNative from 'react-native';
import { FlatList } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { createLife, randomCreation } from '../../src/game/createLife';
import { decodeWorld, encodeWorld } from '../../src/game/model';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { ThemeProvider } from '../../src/ui/theme';
import oldNewborn from '../fixtures/v1-newborn.json';

let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { replace: jest.fn(), push: jest.fn() }, Redirect: () => null, useFocusEffect: (callback: () => void) => require('react').useEffect(callback, [callback]) }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import { router } from 'expo-router';
import Birth from '../../app/birth';
import Life from '../../app/(game)/(tabs)/life';

const frame = (child: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 320, height: 568 }, insets: { top: 20, bottom: 0, left: 0, right: 0 } }}><ThemeProvider>{child}</ThemeProvider></SafeAreaProvider>;
const press = async (name: string) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
afterEach(() => { jest.restoreAllMocks(); });

test.each([0, 2])('seed %i starts at the first Age 0 entry on a small screen, respects dragging and follows later years', async seed => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise();
  const before = createLife('life_birth_ui', seed, randomCreation(seed), { year: 2026, month: 10, day: 22 }); await repository.create(before);
  mockStore = createGameStore({ repository: async () => repository, date: () => before.date, id: () => 'unused' }); await mockStore.getState().bootstrap();
  jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({ width: 320, height: 568, scale: 1, fontScale: 1.5 });
  const start = jest.spyOn(FlatList.prototype, 'scrollToOffset').mockImplementation(() => {}), end = jest.fn();
  jest.spyOn(FlatList.prototype, 'getScrollResponder').mockReturnValue({ scrollToEnd: end } as unknown as ReturnType<FlatList['getScrollResponder']>);
  const frames = new Map<number, (time: number) => void>(); let nextFrame = 0;
  jest.spyOn(global, 'requestAnimationFrame').mockImplementation(callback => { frames.set(++nextFrame, callback); return nextFrame; });
  jest.spyOn(global, 'cancelAnimationFrame').mockImplementation(id => { if (typeof id === 'number') frames.delete(id); });
  const flush = () => act(() => { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(0)); });
  const view = render(frame(<Birth />)); await press('Begin Life!'); expect(router.replace).toHaveBeenCalledWith('/life');
  expect(mockStore.getState().world!.journal).toEqual(before.journal); view.rerender(frame(<Life />)); flush();
  const list = screen.UNSAFE_getByType(FlatList);
  expect(start).toHaveBeenCalledWith({ offset: 0, animated: false }); expect(end).not.toHaveBeenCalled();
  expect(screen.getAllByText('Age: 0')).toHaveLength(1); expect(screen.getByText(before.journal[0].text)).toBeOnTheScreen();
  expect(list.props.data.map((row: { age: number }) => row.age)).toEqual(before.journal.map(() => 0));
  start.mockClear(); fireEvent(list, 'contentSizeChange', 320, 1800); fireEvent(list, 'layout'); flush();
  expect(start).toHaveBeenCalledWith({ offset: 0, animated: false }); expect(end).not.toHaveBeenCalled();
  fireEvent(list, 'scrollBeginDrag'); start.mockClear(); fireEvent(list, 'contentSizeChange', 320, 1900); flush(); expect(start).not.toHaveBeenCalled(); expect(end).not.toHaveBeenCalled();
  await press('Age Up'); flush(); expect(end).toHaveBeenCalledWith({ animated: false }); expect(start).not.toHaveBeenCalled();
  expect(mockStore.getState().world!.journal.slice(0, before.journal.length)).toEqual(before.journal);
  expect(await repository.load(before.id)).toEqual(mockStore.getState().world);
  view.unmount(); sqlite.close();
});

test('a retained old newborn journal keeps its existing follow behavior and stored bytes', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise();
  const before = { ...decodeWorld(JSON.stringify(oldNewborn)), birthAcknowledged: true }; await repository.create(before);
  mockStore = createGameStore({ repository: async () => repository, date: () => before.date, id: () => 'unused' }); await mockStore.getState().bootstrap();
  const encoded = encodeWorld(before), start = jest.spyOn(FlatList.prototype, 'scrollToOffset').mockImplementation(() => {}), end = jest.fn();
  jest.spyOn(FlatList.prototype, 'getScrollResponder').mockReturnValue({ scrollToEnd: end } as unknown as ReturnType<FlatList['getScrollResponder']>);
  const frames: ((time: number) => void)[] = []; jest.spyOn(global, 'requestAnimationFrame').mockImplementation(callback => { frames.push(callback); return frames.length; });
  const view = render(frame(<Life />)); act(() => { frames.splice(0).forEach(callback => callback(0)); });
  expect(start).not.toHaveBeenCalled(); expect(end).toHaveBeenCalledWith({ animated: false }); expect(encodeWorld(await repository.load(before.id))).toBe(encoded);
  view.unmount(); sqlite.close();
});
