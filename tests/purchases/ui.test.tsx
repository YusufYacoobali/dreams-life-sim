import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../../src/ui/theme';
import { Button, Page } from '../../src/ui/components';
import { createPurchaseService, type Customer, type PurchaseAdapter } from '../../src/purchases/service';
import { features, products, productIds, type PremiumFeature, type ProductId } from '../../src/purchases/catalog';
import { PurchaseOptions, usePremiumAction } from '../../src/purchases/PurchaseUI';
import { createGameStore } from '../../src/state/gameStore';
import { decodeWorld } from '../../src/game/model';
import { endEmployment } from '../../src/game/systems/work';
import { careerPayQuote } from '../../src/game/systems/careers';
import { useCareerReview } from '../../src/ui/CareerReview';
import { setPurchaseAnalytics, type PurchaseEvent } from '../../src/purchases/analytics';
import { router, Redirect } from 'expo-router';
import TimeMachine from '../../app/time-machine';
import { useCultDialog } from '../../src/ui/CultDialog';
import graduate from '../fixtures/v3-employed-graduate.json';
let mockAdapter: PurchaseAdapter | null, mockStore: ReturnType<typeof createGameStore>;
jest.mock('../../src/purchases/native', () => ({ purchases: require('../../src/purchases/service').createPurchaseService(async () => mockAdapter) }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn(), replace: jest.fn(), navigate: jest.fn() }, useFocusEffect: () => {}, Redirect: jest.fn(() => null) }));
import { purchases } from '../../src/purchases/native';
import { GodModeEditor } from '../../src/ui/GodModeEditor';
import { godModeSessionStore } from '../../src/state/godModeSession';
import { MiniGamePlayground } from '../../src/minigames/MiniGamePlayground';
// Native animation is not involved in purchase/gating checks.
jest.mock('expo-asset', () => ({ Asset: { loadAsync: jest.fn(async () => []) } }));
jest.mock('../../src/minigames/components/MiniGameScreen', () => ({ MiniGameScreen: () => null }));
import Constants from 'expo-constants';
import { preferencesStore } from '../../src/state/usePreferences';

const customer = (...owned: PremiumFeature[]): Customer => ({ entitlements: { active: Object.fromEntries(owned.map(feature => [feature, {}])), verification: 'VERIFIED' } });
let adapter: PurchaseAdapter, buy: jest.Mock, restore: jest.Mock;
const frame = (child: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, bottom: 0, left: 0, right: 0 } }}><ThemeProvider>{child}</ThemeProvider></SafeAreaProvider>;
const press = async (name: string) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
beforeEach(async () => {
  purchases.getState().dispose(); purchases.setState({ ownership: Object.fromEntries(features.map(feature => [feature, false])) as Record<PremiumFeature, boolean>, status: 'idle', products: {}, busy: false, error: null, message: null });
  buy = jest.fn(async product => customer(...products[product.identifier as ProductId].features)); restore = jest.fn(async () => customer('athlete'));
  adapter = { configure: async () => {}, customer: async () => customer(), products: async () => productIds.map(identifier => ({ identifier, priceString: identifier === 'dreams.full_unlock' ? '29,99 €' : '£9.99' })), purchase: buy, restore, listen: () => () => {} };
  mockAdapter = adapter;
  const world = decodeWorld(JSON.stringify(graduate)); endEmployment(world); world.people[world.activePersonId].skills.sport = 100; world.people[world.activePersonId].stats.health = world.people[world.activePersonId].stats.fitness = 100;
  mockStore = createGameStore({ repository: async () => ({ active: async () => world, list: async () => [], commit: async (next: ReturnType<typeof decodeWorld>) => next } as never), date: () => world.date, id: () => 'life_purchase_ui', premiumAccess: feature => purchases.getState().ownership[feature] });
  await mockStore.getState().bootstrap();
});
afterEach(() => { setPurchaseAnalytics(); godModeSessionStore.getState().reset(); purchases.getState().dispose(); });
function Intent({ identity = 'life:athlete', onContinue }: { identity?: string; onContinue: () => void }) {
  const premium = usePremiumAction(identity);
  return <Page><Button label="Try Athlete" onPress={() => premium.run('athlete', 'tryout', onContinue)} />{premium.modal}</Page>;
}
test('store keeps exact localized decimal prices, full bundle grants Owned to individual items and blocks duplicates', async () => {
  render(frame(<PurchaseOptions trigger="store" />)); await waitFor(() => expect(screen.getByText('29,99 €')).toBeTruthy());
  expect(screen.getAllByText('£9.99')).toHaveLength(7); expect(screen.getByLabelText('Price: 29,99 €')).toBeTruthy();
  await press('Buy Full Unlock'); await waitFor(() => expect(screen.getAllByText('Owned').length).toBeGreaterThanOrEqual(8));
  expect(screen.queryByRole('button', { name: 'Buy Athlete Career' })).toBeNull(); expect(buy).toHaveBeenCalledTimes(1);
});
test('contextual career purchase shows only individual and bundles, resumes once, and dismissing changes no action', async () => {
  const resumed = jest.fn(), events: PurchaseEvent[] = []; setPurchaseAnalytics(event => events.push(event)); render(frame(<Intent onContinue={resumed} />));
  await press('Try Athlete'); await waitFor(() => expect(screen.getByText('29,99 €')).toBeTruthy());
  expect(screen.getByRole('button', { name: 'Buy All Careers Pass' })).toBeTruthy(); expect(screen.queryByRole('button', { name: 'Buy God Mode' })).toBeNull();
  await press('Maybe Later'); expect(resumed).not.toHaveBeenCalled(); expect(events.map(event => event.name)).toContain('paywall_dismissed');
  await press('Try Athlete'); await press('Buy Athlete Career'); await waitFor(() => expect(resumed).toHaveBeenCalledTimes(1));
  expect(events.map(event => event.name)).toEqual(expect.arrayContaining(['paywall_viewed', 'product_selected', 'purchase_initiated', 'purchase_completed']));
});
test('cancel and failure keep the intended action; restore returns to it without another purchase', async () => {
  const resumed = jest.fn(); render(frame(<Intent onContinue={resumed} />)); await press('Try Athlete'); await waitFor(() => expect(screen.getByText('29,99 €')).toBeTruthy());
  buy.mockRejectedValueOnce({ userCancelled: true }); await press('Buy Athlete Career'); expect(screen.getByText('Purchase cancelled.')).toBeTruthy(); expect(resumed).not.toHaveBeenCalled();
  buy.mockRejectedValueOnce(new Error('offline')); await press('Buy Athlete Career'); expect(screen.getByRole('alert')).toHaveTextContent(/could not be verified/); expect(resumed).not.toHaveBeenCalled();
  await press('Restore Purchases'); await waitFor(() => expect(resumed).toHaveBeenCalledTimes(1)); expect(restore).toHaveBeenCalledTimes(1);
});
test('held purchase prevents repeated taps and back; changing life context cannot resume a stale action', async () => {
  let finish!: (value: Customer) => void; buy.mockImplementationOnce(() => new Promise(done => { finish = done; }));
  const resumed = jest.fn(), view = render(frame(<Intent onContinue={resumed} />)); await press('Try Athlete'); await waitFor(() => expect(screen.getByText('29,99 €')).toBeTruthy());
  await press('Buy Athlete Career'); expect(screen.getByRole('button', { name: 'Buy Athlete Career' })).toBeDisabled(); expect(screen.getByRole('button', { name: 'Maybe Later' })).toBeDisabled();
  await press('Buy Athlete Career'); expect(buy).toHaveBeenCalledTimes(1);
  view.rerender(frame(<Intent identity="another-life" onContinue={resumed} />)); await act(async () => { finish(customer('athlete')); }); expect(resumed).not.toHaveBeenCalled();
});
test('missing configuration shows unavailable prices and disabled purchases, and retry recovers', async () => {
  mockAdapter = null; render(frame(<PurchaseOptions trigger="store" />)); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/unavailable/));
  expect(screen.getByRole('button', { name: 'Buy Full Unlock' })).toBeDisabled(); expect(screen.getByRole('button', { name: 'Restore Purchases' })).toBeDisabled();
  mockAdapter = adapter; await press('Refresh Store'); await waitFor(() => expect(screen.getByText('29,99 €')).toBeTruthy()); expect(screen.getByRole('button', { name: 'Buy Full Unlock' })).toBeEnabled();
});
function CareerIntent() {
  const review = useCareerReview('athlete'), world = mockStore.getState().world!;
  return <Page><Button label="Review Tryout" onPress={() => review.confirm({ type: 'select-career', kind: 'athlete', quotedAnnualPay: careerPayQuote(world, 'athlete') }, 'Attend the tryout?', 'Start a team contract.', [], 'athlete', 'Attend Tryout')} />{review.modal}</Page>;
}
test('career review preserves its original command after purchase and only dispatches after normal confirmation', async () => {
  const revision = mockStore.getState().world!.revision;
  render(frame(<CareerIntent />)); await press('Review Tryout'); await waitFor(() => expect(screen.getByText('29,99 €')).toBeTruthy());
  expect(screen.queryByRole('button', { name: 'Attend Tryout' })).toBeNull(); await press('Buy Athlete Career');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Attend Tryout' })).toBeTruthy()); expect(mockStore.getState().world!.revision).toBe(revision);
  await press('Attend Tryout'); expect(mockStore.getState().world!.revision).toBe(revision + 1);
});
test('paid God Mode opens the editor without exposing the internal mini-game playground', async () => {
  const globalDev = globalThis as unknown as { __DEV__: boolean }, previous = __DEV__;
  globalDev.__DEV__ = false; Constants.expoConfig!.extra = { godModeTesting: false };
  try {
    await purchases.getState().initialize(); await purchases.getState().purchase('dreams.god_mode', 'test');
    const view = render(frame(<GodModeEditor />)); expect(screen.getByRole('button', { name: 'Save Changes' })).toBeTruthy(); expect(screen.queryByRole('button', { name: 'Mini-Game Playground' })).toBeNull();
    view.unmount();
  } finally { globalDev.__DEV__ = previous; }
});

test('Time Machine browses freely and retains the selected checkpoint through purchase and the final confirmation', async () => {
  const world = mockStore.getState().world!, restorePoint = jest.fn(async (_id: string) => true);
  mockStore.setState({ snapshots: [{ id: 'snapshot_test', name: 'Earlier Moment', date: world.date, age: 22, label: 'Saved moment', size: 42, revision: 0, personId: world.activePersonId, createdAt: 'today' }], restoreSnapshot: restorePoint });
  render(frame(<TimeMachine />)); expect(screen.getByText(/checkpoints.*compressed/)).toBeTruthy();
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: /^Earlier Moment/ })); });
  await waitFor(() => expect(screen.getByText('29,99 €')).toBeTruthy());
  expect(screen.getByRole('button', { name: 'Buy Unlimited Time Machine' })).toBeTruthy(); expect(screen.queryByRole('button', { name: 'Buy All Careers Pass' })).toBeNull(); expect(restorePoint).not.toHaveBeenCalled();
  await press('Buy Unlimited Time Machine'); await waitFor(() => expect(screen.getByRole('button', { name: 'Restore as New Branch' })).toBeTruthy());
  expect(restorePoint).not.toHaveBeenCalled(); await press('Restore as New Branch'); expect(restorePoint).toHaveBeenCalledWith('snapshot_test'); expect(router.replace).toHaveBeenCalledWith('/life');
});
function CultIntent() {
  const dialog = useCultDialog();
  return <Page><Button label="Review Founding" onPress={() => dialog.confirm({ type: 'found-cult', name: 'Retained Name' } as never, 'Found Retained Name?', 'Keep my beliefs and headquarters.', [], 'cult', 'Found Cult')} />{dialog.modal}</Page>;
}
test('cult paywall keeps the founding form context and opens its original review after a bundle purchase', async () => {
  render(frame(<CultIntent />)); await press('Review Founding'); await waitFor(() => expect(screen.getByText('29,99 €')).toBeTruthy());
  expect(screen.getByRole('button', { name: 'Buy Cult Leader Career' })).toBeTruthy();
  await press('Buy All Careers Pass'); await waitFor(() => expect(screen.getByText('Found Retained Name?')).toBeTruthy()); expect(screen.getByText('Keep my beliefs and headquarters.')).toBeTruthy(); expect(screen.getByRole('button', { name: 'Found Cult' })).toBeTruthy();
});
test('a direct public playground link remains internal even after Full Unlock and a saved testing toggle', async () => {
  const globalDev = globalThis as unknown as { __DEV__: boolean }, previous = __DEV__, previousExtra = Constants.expoConfig!.extra;
  globalDev.__DEV__ = false; Constants.expoConfig!.extra = { godModeTesting: false };
  try {
    await purchases.getState().initialize(); await purchases.getState().purchase('dreams.full_unlock', 'test');
    godModeSessionStore.getState().reveal(); preferencesStore.setState({ ready: true, settings: { ...preferencesStore.getState().settings, godModeEnabled: true } });
    render(frame(<MiniGamePlayground />)); expect(Redirect).toHaveBeenCalledWith({ href: '/settings' }, undefined); expect(screen.queryByRole('header', { name: 'Mini-Game Playground' })).toBeNull();
  } finally { globalDev.__DEV__ = previous; Constants.expoConfig!.extra = previousExtra; }
});
