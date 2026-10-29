import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AppState, Modal, Platform, Pressable, Text, type AppStateStatus } from 'react-native';
import { createStore } from 'zustand/vanilla';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { decodeWorld, copyWorld, immutableWorld } from '../../src/game/model';
import { recordDeath } from '../../src/game/engine';
import type { GameState } from '../../src/state/gameStore';
import { useCinematicTransition } from '../../src/ui/cinematic/CinematicContext';
import newborn from '../fixtures/v1-newborn.json';

let mockPath = '/', mockPreferencesReady = false;
let mockFeedback = { reducedMotion: true, deviceReducedMotion: null as boolean | null };
let mockStore = createStore<Pick<GameState, 'world' | 'ready'>>(() => ({ world: null, ready: true }));
const mockNavigate = jest.fn(), mockHideSplash = jest.fn(async () => {});
const mockRuns: { to: number; duration: number; done: (finished: boolean) => void }[] = [];
const mockCancel = jest.fn();
let mockAutoLoad = true, mockInkProps: { onLoaded: () => void; onFailure: (error: string) => void; onFinished: (cancelled: boolean) => void };
jest.mock('expo-router', () => ({ usePathname: () => mockPath, router: { replace: (...args: unknown[]) => mockNavigate(...args) } }));
jest.mock('expo-splash-screen', () => ({ hideAsync: () => mockHideSplash() }));
jest.mock('react-native-screens', () => ({ FullWindowOverlay: require('react-native').View }));
jest.mock('../../src/ui/feedback', () => ({ useFeedback: () => mockFeedback }));
jest.mock('../../src/state/usePreferences', () => ({ usePreferences: (select: (s: unknown) => unknown) => select({ ready: mockPreferencesReady, loadFailed: false, settings: { reducedMotion: false } }) }));
jest.mock('../../src/state/useGame', () => ({ gameStore: { subscribe: (...args: unknown[]) => (mockStore.subscribe as Function)(...args) } }));
jest.mock('../../src/ui/cinematic/CinematicInk', () => {
  const React = require('react');
  return { CinematicInk: React.forwardRef((props: typeof mockInkProps, ref: unknown) => {
    mockInkProps = props;
    React.useImperativeHandle(ref, () => ({
      play: (start: number, end: number) => mockRuns.push({ to: end / 60 * 1000, duration: (end - start) / 60 * 1000, done: (finished: boolean) => props.onFinished(!finished) }),
      pause: mockCancel,
    }));
    React.useEffect(() => { if (mockAutoLoad) props.onLoaded(); }, []);
    return null;
  }) };
});
import { CinematicTransitionProvider } from '../../src/ui/cinematic/CinematicTransition';

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } };
function Actions() {
  const { play } = useCinematicTransition();
  return <><Text>Current screen</Text><Pressable testID="birth-action" onPress={() => play('birth', '/birth', () => mockNavigate('/birth'))}><Text>Birth</Text></Pressable></>;
}
const frame = () => <SafeAreaProvider initialMetrics={metrics}><CinematicTransitionProvider><Actions /></CinematicTransitionProvider></SafeAreaProvider>;
let previousAppState: AppStateStatus, appStateChanged: (state: AppStateStatus) => void;
beforeEach(() => {
  jest.useFakeTimers(); mockRuns.length = 0; mockNavigate.mockClear(); mockAutoLoad = true;
  mockPath = '/new-life'; mockPreferencesReady = true; mockFeedback = { reducedMotion: false, deviceReducedMotion: false };
  mockStore = createStore(() => ({ world: null, ready: true }));
  previousAppState = AppState.currentState; AppState.currentState = 'active';
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_name, callback) => { appStateChanged = callback; return { remove: jest.fn() }; });
});
afterEach(() => { jest.useRealTimers(); AppState.currentState = previousAppState; jest.restoreAllMocks(); });

test('cold welcome waits for preferences, runs 3.2 seconds without a Skip button, ignores late callbacks and never replays on return', () => {
  mockPath = '/'; mockPreferencesReady = false; mockFeedback = { reducedMotion: true, deviceReducedMotion: null };
  const view = render(frame()); expect(screen.getByTestId('cinematic-welcome')).toBeOnTheScreen(); expect(mockRuns).toHaveLength(0);
  mockPreferencesReady = true; view.rerender(frame()); expect(screen.getByTestId('cinematic-welcome')).toBeOnTheScreen(); expect(mockRuns).toHaveLength(0);
  mockPreferencesReady = true; mockFeedback = { reducedMotion: false, deviceReducedMotion: false }; view.rerender(frame());
  expect(mockRuns).toHaveLength(1); expect(mockRuns[0]).toMatchObject({ to: 3200, duration: 3200 });
  expect(screen.queryByRole('button', { name: 'Skip welcome animation' })).toBeNull();
  const finished = mockRuns[0].done;
  act(() => finished(true)); expect(screen.queryByTestId('cinematic-welcome')).toBeNull();
  act(() => finished(true)); expect(screen.queryByTestId('cinematic-welcome')).toBeNull();
  view.unmount(); render(frame()); expect(screen.queryByTestId('cinematic-welcome')).toBeNull(); expect(mockRuns).toHaveLength(1);
  expect(mockHideSplash).toHaveBeenCalled();
});

test('birth navigates only once under opaque ink, holds until the destination commits, then reveals for the remainder of 3.3 seconds', () => {
  const view = render(frame()); fireEvent.press(screen.getByTestId('birth-action'));
  expect(screen.getByTestId('cinematic-birth')).toBeOnTheScreen(); expect(mockNavigate).not.toHaveBeenCalled();
  expect(mockRuns[0]).toMatchObject({ to: 1400, duration: 1400 });
  act(() => mockRuns[0].done(true)); expect(mockNavigate).toHaveBeenCalledTimes(1); expect(mockNavigate).toHaveBeenLastCalledWith('/birth');
  act(() => jest.advanceTimersByTime(400)); expect(mockRuns).toHaveLength(1);
  mockPath = '/birth'; view.rerender(frame()); act(() => jest.advanceTimersByTime(40));
  expect(mockRuns[1]).toMatchObject({ to: 3300, duration: 1900 }); act(() => mockRuns[1].done(true));
  expect(screen.queryByTestId('cinematic-birth')).toBeNull(); act(() => mockRuns[0].done(true)); expect(mockNavigate).toHaveBeenCalledTimes(1);
});

test('Android uses a full-display native modal and Back cannot dismiss birth before its covered navigation', () => {
  const platform = Object.getOwnPropertyDescriptor(Platform, 'OS')!;
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
  const view = render(frame());
  try {
    fireEvent.press(screen.getByTestId('birth-action'));
    const modal = screen.UNSAFE_getByType(Modal);
    expect(modal.props).toMatchObject({ transparent: true, statusBarTranslucent: true, navigationBarTranslucent: true, hardwareAccelerated: true, animationType: 'none' });
    act(() => modal.props.onRequestClose()); expect(screen.getByTestId('cinematic-birth')).toBeOnTheScreen(); expect(mockNavigate).not.toHaveBeenCalled();
  } finally { view.unmount(); Object.defineProperty(Platform, 'OS', platform); }
});

test('backgrounding before cover completes navigation once and foregrounding does not replay', () => {
  const view = render(frame()); fireEvent.press(screen.getByTestId('birth-action')); const late = mockRuns[0].done;
  act(() => { AppState.currentState = 'background'; appStateChanged('background'); });
  expect(mockNavigate).toHaveBeenCalledTimes(1); expect(screen.queryByTestId('cinematic-birth')).toBeNull();
  act(() => { AppState.currentState = 'active'; appStateChanged('active'); late(true); }); view.rerender(frame());
  expect(mockNavigate).toHaveBeenCalledTimes(1); expect(mockRuns).toHaveLength(1); expect(mockCancel).toHaveBeenCalled();
});

test.each([true, null])('reduced or unknown device motion (%s) navigates immediately without an overlay', device => {
  mockFeedback = { reducedMotion: true, deviceReducedMotion: device };
  render(frame()); fireEvent.press(screen.getByTestId('birth-action'));
  expect(mockRuns).toHaveLength(0); expect(mockNavigate).toHaveBeenCalledWith('/birth'); expect(screen.queryByTestId('cinematic-birth')).toBeNull();
});

test('enabling reduced motion during ink settles immediately, and a lost animation callback cannot trap navigation', () => {
  const view = render(frame()); fireEvent.press(screen.getByTestId('birth-action'));
  mockFeedback = { reducedMotion: true, deviceReducedMotion: true }; view.rerender(frame());
  expect(mockNavigate).toHaveBeenCalledTimes(1); expect(screen.queryByTestId('cinematic-birth')).toBeNull();
  mockFeedback = { reducedMotion: false, deviceReducedMotion: false }; view.rerender(frame()); fireEvent.press(screen.getByTestId('birth-action'));
  act(() => jest.advanceTimersByTime(4801)); expect(mockNavigate).toHaveBeenCalledTimes(2); expect(screen.queryByTestId('cinematic-birth')).toBeNull();
});

test('a newly committed same-person death plays 2.8 seconds; cold opening, another life and later changes do not replay', () => {
  mockPath = '/life'; const alive = decodeWorld(JSON.stringify(newborn));
  mockStore.setState({ world: alive }); const view = render(frame()); expect(mockRuns).toHaveLength(0);
  // Explicit terminal presentation boundary; no claim of naturally observed mortality.
  const mutable = copyWorld(alive); recordDeath(mutable, mutable.activePersonId, 'Transition test'); mutable.revision++;
  const dead = immutableWorld(mutable);
  act(() => mockStore.setState({ world: dead })); expect(screen.getByTestId('cinematic-death')).toBeOnTheScreen();
  expect(mockRuns[0]).toMatchObject({ to: 1200, duration: 1200 }); act(() => mockRuns[0].done(true)); expect(mockNavigate).toHaveBeenLastCalledWith('/death');
  mockPath = '/death'; view.rerender(frame()); act(() => jest.advanceTimersByTime(40)); expect(mockRuns[1]).toMatchObject({ to: 2800, duration: 1600 });
  act(() => mockRuns[1].done(true)); view.unmount();
  mockPath = '/life'; const reopened = render(frame()); expect(screen.queryByTestId('cinematic-death')).toBeNull();
  act(() => mockStore.setState({ world: { ...dead, revision: dead.revision + 1 } }));
  act(() => mockStore.setState({ world: { ...dead, id: 'another-life' } })); expect(mockRuns).toHaveLength(2); reopened.unmount();
});


test('native loading cannot start the clock early, cancelled callbacks do not navigate, and decode failure settles once', () => {
  mockAutoLoad = false;
  render(frame()); fireEvent.press(screen.getByTestId('birth-action'));
  expect(mockRuns).toHaveLength(0);
  act(() => mockInkProps.onLoaded()); expect(mockRuns).toHaveLength(1);
  act(() => mockRuns[0].done(false)); expect(mockNavigate).not.toHaveBeenCalled();
  const late = mockRuns[0].done;
  act(() => mockInkProps.onFailure('Native decode failure')); expect(mockNavigate).toHaveBeenCalledTimes(1);
  expect(screen.queryByTestId('cinematic-birth')).toBeNull();
  act(() => late(true)); expect(mockNavigate).toHaveBeenCalledTimes(1);
});
