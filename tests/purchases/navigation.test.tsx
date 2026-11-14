import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { render, screen, fireEvent, waitFor } from '../support/rendering';
import { ThemeProvider } from '../../src/ui/theme';
import { decodeWorld, type World } from '../../src/game/model';
import graduate from '../fixtures/v3-employed-graduate.json';
let mockWorld: World | null, mockPath = '/shop';
jest.mock('../../src/state/useGame', () => ({ useGame: (select: (state: { world: World | null }) => unknown) => select({ world: mockWorld }) }));
jest.mock('../../src/purchases/native', () => ({ purchases: require('../../src/purchases/service').createPurchaseService(async () => ({
  configure: async () => {}, customer: async () => ({ entitlements: { active: {}, verification: 'VERIFIED' } }),
  products: async () => require('../../src/purchases/catalog').productIds.map((identifier: string) => ({ identifier, priceString: 'CHF 8.90' })),
  purchase: async () => { throw Error('Navigation must not purchase'); }, restore: async () => ({ entitlements: { active: {}, verification: 'VERIFIED' } }), listen: () => () => {},
})) }));
jest.mock('../../src/minigames/components/MiniGameEntry', () => ({ MiniGameResume: () => null }));
jest.mock('../../src/ui/PendingEvent', () => ({ PendingEvent: () => null }));
jest.mock('../../src/ui/ReviewPromptHost', () => ({ ReviewPromptHost: () => null }));
jest.mock('../../src/ui/cinematic/CinematicContext', () => ({ useCinematicTransition: () => ({ activeKind: null }) }));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), navigate: jest.fn() }, usePathname: () => mockPath, useGlobalSearchParams: () => ({}), Redirect: jest.fn(() => null),
  Stack: Object.assign(({ children }: React.PropsWithChildren) => mockPath === '/shop' ? require('react').createElement(require('../../app/(game)/shop').default) : children, { Screen: () => null }),
}));
import { Redirect, router } from 'expo-router';
import GameLayout from '../../app/(game)/_layout';
import Extras from '../../app/(game)/extras';
import DreamsStore from '../../app/store';
import Activities from '../../app/(game)/(tabs)/activities';
const frame = (content: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, bottom: 24, left: 0, right: 0 } }}><ThemeProvider>{content}</ThemeProvider></SafeAreaProvider>;
beforeEach(() => { mockWorld = decodeWorld(JSON.stringify(graduate)); mockPath = '/shop'; });
test('Activities places Dreams Shop first and opens it with the Activities tab preserved', async () => {
  const view = await render(frame(<Activities />));
  const first = screen.getAllByRole('button')[0];
  expect(first).toHaveAccessibleName('Dreams Shop. Unlock special careers, God Mode and more.');
  expect(screen.getByRole('button', { name: /^Education\./ })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: /^Extras\./ })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: /^Settings\./ })).toBeOnTheScreen();
  await fireEvent.press(first);
  expect(router.push).toHaveBeenCalledWith('/shop');
  await view.rerender(frame(<GameLayout />));
  expect(screen.getByRole('header', { name: 'Dreams Shop' })).toBeOnTheScreen();
  expect(screen.getByRole('tab', { name: 'Activities', selected: true })).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(router.back).toHaveBeenCalledTimes(1);
});
test('Extras opens the in-game shop with Activities selected; back and tab navigation remain available', async () => {
  const view = await render(frame(<Extras />)); await fireEvent.press(screen.getByRole('button', { name: /^Dreams Shop\./ })); expect(router.push).toHaveBeenCalledWith('/shop');
  await view.rerender(frame(<GameLayout />));
  expect(screen.getByRole('header', { name: 'Dreams Shop' })).toBeOnTheScreen(); expect(screen.getByRole('tab', { name: 'Activities', selected: true })).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Back' })); expect(router.back).toHaveBeenCalledTimes(1);
  await fireEvent.press(screen.getByRole('tab', { name: 'Activities' })); expect(router.navigate).toHaveBeenCalledWith('/activities');
  await fireEvent.press(screen.getByRole('tab', { name: 'Life' })); expect(router.navigate).toHaveBeenCalledWith('/life');
});
test('the root store works without an active life and keeps its normal back destination', async () => {
  mockWorld = null; await render(frame(<DreamsStore />));
  expect(screen.getByRole('header', { name: 'Dreams Shop' })).toBeOnTheScreen(); await waitFor(() => expect(screen.getAllByText('CHF 8.90')).toHaveLength(8));
  expect(screen.getByRole('button', { name: 'View All Careers' })).toBeDisabled(); expect(Redirect).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'View Athlete Career' })); expect(screen.getByRole('button', { name: 'Buy Athlete Career' })).toBeEnabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Close product details' })); await fireEvent.press(screen.getByRole('button', { name: 'Back' })); expect(router.back).toHaveBeenCalledTimes(1);
});
