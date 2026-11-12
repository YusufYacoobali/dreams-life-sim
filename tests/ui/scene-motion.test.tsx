import React from 'react';
import { act, fireEvent, render, screen } from '../support/rendering';
import { Animated, AppState, Pressable, Text, View, type AppStateStatus } from 'react-native';
import { SceneMotion, type SceneMotionFrame } from '../../src/ui/SceneMotion';

let mockFeedback: { reducedMotion: boolean; deviceReducedMotion: boolean | null };
jest.mock('../../src/ui/feedback', () => ({ useFeedback: () => mockFeedback }));

let changed: (state: AppStateStatus) => void, previousAppState: typeof AppState.currentState, observed: SceneMotionFrame;
let runs: { start: jest.Mock; stop: jest.Mock; reset: jest.Mock }[];
const removed = jest.fn(), continueLife = jest.fn();
function Frame({ identity = 'opening', ready = false, duration = 1600 }: { identity?: string; ready?: boolean; duration?: number }) {
  return <>
    <SceneMotion identity={identity} duration={duration}>{frame => { observed = frame; return <Animated.View testID="decoration" style={{ opacity: frame.progress }} />; }}</SceneMotion>
    <Text accessibilityRole="header">Dreams</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Continue your story" onPress={continueLife}><Text>Continue</Text></Pressable>
    <Text>{ready ? 'Ready' : 'Opening'}</Text>
  </>;
}
beforeEach(() => {
  mockFeedback = { reducedMotion: false, deviceReducedMotion: false }; runs = [];
  previousAppState = AppState.currentState; AppState.currentState = 'active';
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => { changed = listener; return { remove: removed }; });
  jest.spyOn(Animated.Value.prototype, 'setValue');
  jest.spyOn(Animated, 'timing').mockImplementation(() => {
    const run = { start: jest.fn(), stop: jest.fn(), reset: jest.fn() }; runs.push(run); return run;
  });
});
afterEach(() => { AppState.currentState = previousAppState; jest.restoreAllMocks(); });

test('the native one-shot leaves labels and controls immediately available and does not replay for ready/busy-only rerenders', async () => {
  const view = await render(<Frame />);
  expect(Animated.timing).toHaveBeenCalledTimes(1);
  expect(Animated.timing).toHaveBeenCalledWith(observed.progress, expect.objectContaining({ toValue: 1, duration: 1600, useNativeDriver: true, isInteraction: false }));
  expect(runs[0].start).toHaveBeenCalledTimes(1); expect(observed.motionEnabled).toBe(true);
  expect(screen.getByRole('header', { name: 'Dreams' })).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Continue your story' })); expect(continueLife).toHaveBeenCalledTimes(1);
  const decorative = screen.UNSAFE_getAllByType(View).find(node => node.props.importantForAccessibility === 'no-hide-descendants')!;
  expect(decorative.props).toMatchObject({ pointerEvents: 'none', accessible: false, accessibilityElementsHidden: true });
  await view.rerender(<Frame ready />); await view.rerender(<Frame />);
  expect(Animated.timing).toHaveBeenCalledTimes(1); await view.unmount();
  expect(runs[0].stop).toHaveBeenCalledTimes(1); expect(removed).toHaveBeenCalledTimes(1);
});

test('unknown and reduced-motion preferences keep a static final frame without hiding the heading or blocking Continue', async () => {
  mockFeedback = { reducedMotion: true, deviceReducedMotion: null };
  const view = await render(<Frame />);
  expect(Animated.timing).not.toHaveBeenCalled(); expect(Animated.Value.prototype.setValue).toHaveBeenLastCalledWith(1); expect(observed.motionEnabled).toBe(false);
  expect(screen.getByRole('header', { name: 'Dreams' })).toBeOnTheScreen();
  mockFeedback = { reducedMotion: true, deviceReducedMotion: true }; await view.rerender(<Frame ready />);
  expect(Animated.timing).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Continue your story' })); expect(continueLife).toHaveBeenCalledTimes(1); await view.unmount();
});

test('a late OS preference answer leaves the already-visible composition still', async () => {
  const clock = jest.spyOn(Date, 'now').mockReturnValue(1000);
  mockFeedback = { reducedMotion: true, deviceReducedMotion: null };
  const view = await render(<Frame />); clock.mockReturnValue(1600);
  mockFeedback = { reducedMotion: false, deviceReducedMotion: false }; await view.rerender(<Frame ready />);
  expect(Animated.timing).not.toHaveBeenCalled(); expect(Animated.Value.prototype.setValue).toHaveBeenLastCalledWith(1);
  expect(screen.getByRole('header', { name: 'Dreams' })).toBeOnTheScreen(); await view.unmount();
});

test('backgrounding stops and settles once, foregrounding does not replay, and a distinct scene identity gets its own bounded animation', async () => {
  const view = await render(<Frame duration={9000} />);
  expect(Animated.timing).toHaveBeenLastCalledWith(observed.progress, expect.objectContaining({ duration: 1800 }));
  await act(() => { AppState.currentState = 'inactive'; changed('inactive'); });
  expect(runs[0].stop).toHaveBeenCalledTimes(1); expect(Animated.Value.prototype.setValue).toHaveBeenLastCalledWith(1); expect(observed.motionEnabled).toBe(false);
  await act(() => { AppState.currentState = 'active'; changed('active'); }); await view.rerender(<Frame ready duration={9000} />);
  expect(Animated.timing).toHaveBeenCalledTimes(1);
  await view.rerender(<Frame identity="birth-of-another-life" duration={1500} />);
  expect(Animated.timing).toHaveBeenCalledTimes(2); expect(observed.motionEnabled).toBe(true); await view.unmount();
  expect(runs[1].stop).toHaveBeenCalledTimes(1);
});

test('enabling reduced motion during a scene stops it and keeps its final composition when the preference changes again', async () => {
  const view = await render(<Frame />);
  mockFeedback = { reducedMotion: true, deviceReducedMotion: false }; await view.rerender(<Frame />);
  expect(runs[0].stop).toHaveBeenCalledTimes(1); expect(Animated.Value.prototype.setValue).toHaveBeenLastCalledWith(1); expect(observed.motionEnabled).toBe(false);
  mockFeedback = { reducedMotion: false, deviceReducedMotion: false }; await view.rerender(<Frame ready />);
  expect(Animated.timing).toHaveBeenCalledTimes(1); await view.unmount();
});
