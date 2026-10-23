import React from 'react';
import { Image, ScrollView, useWindowDimensions } from 'react-native';
import Svg from 'react-native-svg';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { createLife, randomCreation } from '../../src/game/createLife';
import { recordDeath } from '../../src/game/engine';
import { encodeWorld, fullName } from '../../src/game/model';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { lightColors, ThemeProvider } from '../../src/ui/theme';
import { openingBackground } from '../../src/ui/OpeningScene';

let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector), freshSeed: () => 42 }));
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: jest.fn(() => ({ width: 390, height: 844, scale: 1, fontScale: 1 })) }));
import { router } from 'expo-router';
import Welcome from '../../app/index';
import Help from '../../app/help';
import Activities from '../../app/(game)/(tabs)/activities';

const frame = (children: React.ReactNode, appearance: 'light' | 'dark' = 'light') => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider appearance={appearance}>{children}</ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
async function setup(saved: 'none' | 'birth' | 'alive' | 'dead' = 'none', bootstrap = true) {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise();
  if (saved !== 'none') {
    const world = createLife('life_welcome_saved', 42, randomCreation(42), { year: 2026, month: 10, day: 23 });
    world.birthAcknowledged = saved !== 'birth';
    if (saved === 'dead') recordDeath(world, world.activePersonId, 'Controlled completed life');
    await repository.create(world);
  }
  mockStore = createGameStore({ repository: async () => repository, date: () => ({ year: 2026, month: 10, day: 23 }), id: () => 'life_welcome_unused' });
  if (bootstrap) await mockStore.getState().bootstrap();
  return { sqlite, repository };
}
beforeEach(() => { jest.clearAllMocks(); jest.mocked(useWindowDimensions).mockReturnValue({ width: 390, height: 844, scale: 1, fontScale: 1 }); });

test.each(['light', 'dark'] as const)('%s welcome shows the brand and creation actions without scenery, tagline, footer or Saved Lives', async appearance => {
  const context = await setup();
  try {
    const view = render(frame(<Welcome />, appearance));
    expect(screen.getByRole('header', { name: 'Dreams' })).toBeOnTheScreen();
    expect(screen.getByText('Life Simulator')).toBeOnTheScreen();
    expect(screen.queryByText(/Make choices|Free to play|Your story stays with you/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Saved Lives' })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Continue Life/ })).toBeNull();
    expect(screen.queryByText(/^Continue as /)).toBeNull();
    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Start New Life' })).toHaveStyle({ backgroundColor: lightColors.actionBlue });
    expect(screen.UNSAFE_queryAllByType(Image)).toHaveLength(0);
    expect(screen.UNSAFE_getByType(Svg).props.width).toBe(184);
    const help = screen.getByRole('button', { name: 'Help' });
    expect(help).toHaveStyle({ width: 44, height: 44 });
    expect(screen.queryByText('Help')).toBeNull();
    await press('Start New Life'); expect(router.push).toHaveBeenLastCalledWith({ pathname: '/new-life', params: { seed: '42', mode: 'custom' } });
    await press('Random Life'); expect(router.push).toHaveBeenLastCalledWith({ pathname: '/new-life', params: { seed: '42', mode: 'random' } });
    await press('Help'); expect(router.push).toHaveBeenLastCalledWith('/help');
    view.rerender(frame(<Help />, appearance)); expect(screen.getByText('A year at a time')).toBeOnTheScreen();
    expect(await context.repository.list()).toEqual([]);
    view.unmount();
  } finally { context.sqlite.close(); }
});

test.each(['birth', 'alive', 'dead'] as const)('Continue is primary and opens the exact %s life without writing or replacing any save', async saved => {
  const context = await setup(saved);
  try {
    const world = mockStore.getState().world!, encoded = encodeWorld(world), rows = await context.repository.list();
    const view = render(frame(<Welcome />));
    const label = 'Continue Life as ' + fullName(world.people[world.activePersonId]);
    expect(screen.getByText('Continue as ' + fullName(world.people[world.activePersonId]))).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: label })).toHaveStyle({ backgroundColor: lightColors.actionGreen });
    expect(screen.getByRole('button', { name: 'Start New Life' })).toHaveStyle({ borderWidth: 1 });
    await press(label); expect(router.push).toHaveBeenLastCalledWith(saved === 'birth' ? '/birth' : saved === 'dead' ? '/death' : '/life');
    expect(encodeWorld(mockStore.getState().world!)).toBe(encoded);
    expect(await context.repository.list()).toEqual(rows);
    expect(encodeWorld((await context.repository.active())!)).toBe(encoded);
    if (saved === 'alive') {
      view.rerender(frame(<Activities />)); await press(/^Saved Lives/);
      expect(router.push).toHaveBeenLastCalledWith('/saved-lives');
    }
    expect(await context.repository.list()).toEqual(rows);
    expect(encodeWorld((await context.repository.active())!)).toBe(encoded);
    view.unmount();
  } finally { context.sqlite.close(); }
});

test('startup retains the loading announcement and keeps Help disabled until ready', async () => {
  const context = await setup('none', false);
  try {
    const view = render(frame(<Welcome />));
    expect(screen.getByLabelText('Opening your saved lives')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Help' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Start New Life' })).toBeNull();
    await press('Help'); expect(router.push).not.toHaveBeenCalled();
    await act(async () => { await mockStore.getState().bootstrap(); });
    expect(screen.queryByLabelText('Opening your saved lives')).toBeNull();
    expect(screen.getByRole('button', { name: 'Help' })).toBeEnabled();
    view.unmount();
  } finally { context.sqlite.close(); }
});

test('busy save state disables the three life actions without replacing the decorative motif', async () => {
  const context = await setup('alive');
  try {
    const view = render(frame(<Welcome />)), motif = screen.UNSAFE_getByType(Svg);
    const before = encodeWorld(mockStore.getState().world!);
    await act(async () => { mockStore.setState({ busy: true }); });
    for (const name of [/^Continue Life/, 'Start New Life', 'Random Life']) { expect(screen.getByRole('button', { name })).toBeDisabled(); await press(name); }
    expect(router.push).not.toHaveBeenCalled(); expect(encodeWorld(mockStore.getState().world!)).toBe(before);
    expect(screen.UNSAFE_getByType(Svg)).toBe(motif);
    view.unmount();
  } finally { context.sqlite.close(); }
});

test.each([{ width: 320, height: 568, fontScale: 1 }, { width: 320, height: 568, fontScale: 2 }, { width: 1024, height: 1366, fontScale: 1 }])('responsive $width × $height / font $fontScale keeps scalable controls in a scrollable composition', async dimensions => {
  jest.mocked(useWindowDimensions).mockReturnValue({ ...dimensions, scale: 1 });
  const context = await setup('alive');
  try {
    const view = render(frame(<Welcome />));
    const scroll = screen.UNSAFE_getByType(ScrollView);
    expect(scroll.props.contentContainerStyle).toEqual(expect.arrayContaining([expect.objectContaining({ flexGrow: 1, paddingHorizontal: 24 })]));
    expect(screen.getByText('Start New Life').props.allowFontScaling).not.toBe(false);
    expect(screen.getByText('Random Life').props.numberOfLines).toBeUndefined();
    expect(screen.getByText('Continue Life').props.numberOfLines).toBeUndefined();
    const caption = screen.getByText(/^Continue as /);
    expect(caption.props.numberOfLines).toBeUndefined();
    expect(caption.props.allowFontScaling).not.toBe(false);
    expect(screen.UNSAFE_getByType(Svg).props.width).toBe(dimensions.width < 360 ? 140 : 184);
    expect(openingBackground).toBe('#0D1729');
    await press('Random Life'); expect(router.push).toHaveBeenLastCalledWith({ pathname: '/new-life', params: { seed: '42', mode: 'random' } });
    view.unmount();
  } finally { context.sqlite.close(); }
});
