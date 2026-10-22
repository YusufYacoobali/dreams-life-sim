import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { Animated, AppState, type AppStateStatus } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { router } from 'expo-router';
import { decodeWorld, encodeWorld, fullName, type World } from '../../src/game/model';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import { SceneMotion } from '../../src/ui/SceneMotion';
import { ThemeProvider } from '../../src/ui/theme';
import newborn from '../fixtures/v1-newborn.json';

let mockReducedMotion = false, previousAppState: AppStateStatus;
let mockState: { world: World; busy: boolean; error: string | null; acknowledgeBirth: jest.Mock };
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() }, Redirect: () => null,
  useFocusEffect: (callback: () => void) => require('react').useEffect(callback, [callback]),
}));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: (state: typeof mockState) => unknown) => selector(mockState), freshSeed: () => 42 }));
jest.mock('../../src/ui/feedback', () => ({ ...jest.requireActual('../../src/ui/feedback'),
  useFeedback: () => ({ reducedMotion: mockReducedMotion, deviceReducedMotion: mockReducedMotion, buttonFeedback: () => {} }),
}));
import Birth from '../../app/birth';
import Death from '../../app/death';
const frame = (child: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, bottom: 48, left: 0, right: 0 } }}><ThemeProvider>{child}</ThemeProvider></SafeAreaProvider>;

beforeEach(() => {
  mockReducedMotion = false; previousAppState = AppState.currentState; AppState.currentState = 'active';
  // Leave the native animation in progress; controls must not wait for its end.
  jest.spyOn(Animated, 'timing').mockImplementation(() => ({ start: jest.fn(), stop: jest.fn(), reset: jest.fn() }));
});
afterEach(() => { AppState.currentState = previousAppState; jest.restoreAllMocks(); });

const expectDecorativeOnly = () => {
  const scene = within(screen.UNSAFE_getByType(SceneMotion));
  expect(scene.queryByRole('button')).toBeNull(); expect(scene.queryByRole('header')).toBeNull(); expect(scene.queryByRole('image')).toBeNull();
};

test('birth facts and Begin stay available during the halo, with no automatic acknowledgement or replay for busy and failed-save rerenders', async () => {
  const world = decodeWorld(JSON.stringify(newborn)), before = encodeWorld(world);
  mockState = { world, busy: false, error: null, acknowledgeBirth: jest.fn(async () => false) };
  const view = render(frame(<Birth />));
  expect(Animated.timing).toHaveBeenCalledTimes(1); expect(Animated.timing).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ duration: 1500, useNativeDriver: true }));
  expect(screen.getByRole('header', { name: 'Welcome to the World!' })).toBeOnTheScreen();
  expect(screen.getByText(fullName(world.people[world.activePersonId]))).toBeOnTheScreen(); expectDecorativeOnly();
  expect(mockState.acknowledgeBirth).not.toHaveBeenCalled(); expect(screen.getByRole('button', { name: 'Begin Life!' })).toBeEnabled();
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Begin Life!' })); }); expect(mockState.acknowledgeBirth).toHaveBeenCalledTimes(1);
  mockState.busy = true; view.rerender(frame(<Birth />)); expect(screen.getByRole('button', { name: 'Begin Life!' })).toBeDisabled();
  mockState.busy = false; mockState.error = 'Your progress could not be saved.'; view.rerender(frame(<Birth />));
  expect(screen.getByRole('alert')).toHaveTextContent(mockState.error); expect(screen.getByRole('button', { name: 'Begin Life!' })).toBeEnabled();
  expect(Animated.timing).toHaveBeenCalledTimes(1); expect(encodeWorld(world)).toBe(before); expect(router.replace).not.toHaveBeenCalled();
  mockReducedMotion = true; view.rerender(frame(<Birth />)); expect(Animated.timing).toHaveBeenCalledTimes(1); expectDecorativeOnly();
  expect(screen.getByRole('header', { name: 'Welcome to the World!' })).toBeOnTheScreen(); view.unmount();
});

test('the genuine deceased ancestor keeps factual text and navigation outside the memorial motion, with an attractive static reduced-motion view', () => {
  const recorded = unpackCheckpoint(readFileSync(join(__dirname, '../fixtures/v30-family-year91-checkpoint.json'), 'utf8'), true);
  // Select the already deceased ancestor for this read-only UI scenario; no
  // death, legacy handover, earned history or game command is manufactured.
  const world = { ...recorded, activePersonId: 'person_player' }, before = encodeWorld(world), person = world.people.person_player;
  expect(person.died).toBeTruthy(); mockState = { world, busy: false, error: null, acknowledgeBirth: jest.fn() };
  const view = render(frame(<Death />));
  expect(Animated.timing).toHaveBeenCalledTimes(1); expect(Animated.timing).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ duration: 1800, useNativeDriver: true }));
  expect(screen.getByRole('header', { name: 'You Died' })).toBeOnTheScreen(); expect(screen.getByText(fullName(person))).toBeOnTheScreen();
  expect(screen.getByText('Cause of death: ' + person.causeOfDeath)).toBeOnTheScreen(); expectDecorativeOnly();
  expect(screen.getByRole('button', { name: 'View Life Summary' })).toBeEnabled(); expect(screen.getByRole('button', { name: 'Start a New Life' })).toBeEnabled();
  mockState.busy = true; mockState.error = 'Unrelated local feedback'; view.rerender(frame(<Death />)); expect(Animated.timing).toHaveBeenCalledTimes(1);
  mockReducedMotion = true; view.rerender(frame(<Death />)); expect(Animated.timing).toHaveBeenCalledTimes(1); expectDecorativeOnly();
  fireEvent.press(screen.getByRole('button', { name: 'View Life Summary' })); expect(router.push).toHaveBeenLastCalledWith('/life-summary');
  expect(encodeWorld(world)).toBe(before); expect(mockState.acknowledgeBirth).not.toHaveBeenCalled(); view.unmount();
});
