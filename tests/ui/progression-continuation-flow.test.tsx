import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Modal } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { encodeWorld } from '../../src/game/model';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { ThemeProvider } from '../../src/ui/theme';
import { EventModal } from '../../src/ui/EventModal';
import { randomCreation } from '../../src/game/createLife';
import * as progression from '../../src/progression/progress';
import archive from '../fixtures/v28-ordinary-hobby-archive.json';

let mockStore: ReturnType<typeof createGameStore>, mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() }, useLocalSearchParams: () => mockParams, Redirect: () => null }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import { router } from 'expo-router';
import Achievements from '../../app/(game)/achievements';
import Challenge from '../../app/(game)/challenge/[id]';
const frame = (children: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{children}</ThemeProvider></SafeAreaProvider>;

async function setup() {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.import(JSON.stringify(archive));
  mockStore = createGameStore({ repository: async () => repository, date: () => ({ year: 2026, month: 10, day: 20 }), id: () => 'life_continuation_new' }); await mockStore.getState().bootstrap();
  await mockStore.getState().dispatch({ type: 'acknowledge', resultId: mockStore.getState().world!.pending!.id });
  const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as { name: string }[];
  const rows = () => tables.map(({ name }) => ({ name, rows: sqlite.prepare('SELECT * FROM "' + name + '" ORDER BY rowid').all() }));
  expect(tables).toHaveLength(8); return { sqlite, driver, rows };
}

test('earned care opens its actual unfinished challenge and recognition; Back, Close and activity links leave all eight tables exact', async () => {
  const { sqlite, driver, rows } = await setup(), before = rows(), worldBefore = encodeWorld(mockStore.getState().world!);
  const progressReads = jest.spyOn(progression, 'lifeProgress');
  const view = render(frame(<Achievements />));
  fireEvent.press(screen.getByRole('tab', { name: 'Life' }));
  fireEvent.press(screen.getByRole('button', { name: /^A Year of Care\./ }));
  expect(screen.getByText('Care and Craft · 98% complete')).toBeOnTheScreen();
  fireEvent(screen.UNSAFE_getByType(Modal), 'requestClose');
  expect(screen.queryByRole('button', { name: 'View Challenge' })).toBeNull(); expect(router.push).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('button', { name: /^A Year of Care\./ })); fireEvent.press(screen.getByRole('button', { name: 'Close' }));
  expect(router.push).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('button', { name: /^A Year of Care\./ })); fireEvent.press(screen.getByRole('button', { name: 'View Challenge' }));
  expect(router.push).toHaveBeenLastCalledWith({ pathname: '/challenge/[id]', params: { id: 'care-and-craft' } });
  expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  expect(progressReads).toHaveBeenCalledTimes(1);
  mockParams = { id: 'care-and-craft' }; view.rerender(frame(<Challenge />));
  expect(screen.getByText('Milestones earned')).toBeOnTheScreen(); expect(screen.getByText('A Year of Care')).toBeOnTheScreen(); expect(screen.queryByText('Finding Your Rhythm')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'View Hobbies' })); expect(router.push).toHaveBeenLastCalledWith('/hobbies');
  view.rerender(frame(<Achievements />)); fireEvent.press(screen.getByRole('tab', { name: 'Special' }));
  fireEvent.press(screen.getByRole('button', { name: /^Finding Your Rhythm\./ }));
  expect(screen.queryByRole('button', { name: 'View Challenge' })).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'View Hobbies' })); expect(router.push).toHaveBeenLastCalledWith('/hobbies');
  expect(screen.queryByRole('button', { name: 'Close' })).toBeNull(); expect(screen.queryByLabelText('Saving')).toBeNull();
  expect(encodeWorld(mockStore.getState().world!)).toBe(worldBefore); expect(rows()).toEqual(before);
  const cold = new SaveRepository(driver); await cold.initialise(); expect(encodeWorld((await cold.active())!)).toBe(worldBefore); expect(rows()).toEqual(before);
  expect(progressReads).toHaveBeenCalledTimes(3); progressReads.mockRestore();
  view.unmount(); sqlite.close();
});

test('an unrelated actual save retains an open milestone while changing the active life clears it permanently', async () => {
  const { sqlite, rows } = await setup(), oldId = mockStore.getState().world!.id;
  const view = render(frame(<Achievements />)); fireEvent.press(screen.getByRole('tab', { name: 'Life' }));
  fireEvent.press(screen.getByRole('button', { name: /^A Year of Care\./ }));
  await act(async () => { expect(await mockStore.getState().dispatch({ type: 'study' })).toBe(true); });
  expect(screen.getByText('Care and Craft · 98% complete')).toBeOnTheScreen();
  const pendingId = mockStore.getState().world!.pending!.id;
  await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: pendingId })).toBe(true); });
  expect(screen.getByRole('button', { name: 'View Challenge' })).toBeOnTheScreen();
  await act(async () => { expect(await mockStore.getState().startLife(randomCreation(908), 908)).toBe(true); });
  expect(mockStore.getState().world!.id).not.toBe(oldId);
  expect(screen.queryByRole('button', { name: 'View Challenge' })).toBeNull();
  await act(async () => { expect(await mockStore.getState().selectLife(oldId)).toBe(true); });
  expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  const before = rows(), worldBefore = encodeWorld(mockStore.getState().world!);
  fireEvent.press(screen.getByRole('tab', { name: 'Life' })); fireEvent.press(screen.getByRole('button', { name: /^A Year of Care\./ }));
  expect(screen.getByText('Care and Craft · 98% complete')).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: 'Close' })); expect(rows()).toEqual(before); expect(encodeWorld(mockStore.getState().world!)).toBe(worldBefore);
  view.unmount(); sqlite.close();
});

test('optional milestone navigation stays disabled while busy and leaves existing Close and hardware Back semantics intact', () => {
  const onChoose = jest.fn(), onClose = jest.fn();
  const event = { id: 'earned-care', kind: 'milestone' as const, title: 'A Year of Care', body: 'Twelve actual care months.', facts: [], action: { id: 'challenge', label: 'View Challenge' }, continueLabel: 'Close' };
  const view = render(frame(<EventModal event={event} busy onChoose={onChoose} onClose={onClose} />));
  expect(screen.getByRole('button', { name: 'View Challenge' })).toBeDisabled(); fireEvent.press(screen.getByRole('button', { name: 'View Challenge' })); fireEvent(screen.UNSAFE_getByType(Modal), 'requestClose');
  expect(onChoose).not.toHaveBeenCalled(); expect(onClose).not.toHaveBeenCalled();
  view.rerender(frame(<EventModal event={event} onChoose={onChoose} onClose={onClose} />));
  fireEvent.press(screen.getByRole('button', { name: 'Close' })); expect(onChoose).toHaveBeenLastCalledWith('continue');
  fireEvent(screen.UNSAFE_getByType(Modal), 'requestClose'); expect(onClose).toHaveBeenCalledTimes(1);
  view.unmount();
});
