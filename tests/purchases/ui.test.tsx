import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '../support/rendering';
import { Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import * as ReactNative from 'react-native';
import { ShopProductArt, shopContent } from '../../src/purchases/ShopProduct';
import { CareerArt } from '../../src/assets/CareerArt';
import { CultArt } from '../../src/assets/CultArt';
import { HealthLegalArt } from '../../src/assets/HealthLegalArt';
import { Illustration } from '../../src/assets/Illustration';
import { PolishArt } from '../../src/assets/PolishArt';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../../src/ui/theme';
import { Button, Page } from '../../src/ui/components';
import { createPurchaseService, type Customer, type PurchaseAdapter } from '../../src/purchases/service';
import { features, products, productIds, featureProduct, noOwnership, type PremiumFeature, type ProductId } from '../../src/purchases/catalog';
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
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn(), replace: jest.fn(), navigate: jest.fn() }, useLocalSearchParams: () => ({ seed: '42', mode: 'custom' }), useFocusEffect: () => {}, Redirect: jest.fn(() => null) }));
import { purchases } from '../../src/purchases/native';
import { GodModeEditor } from '../../src/ui/GodModeEditor';
import { godModeSessionStore } from '../../src/state/godModeSession';
import { MiniGamePlayground } from '../../src/minigames/MiniGamePlayground';
// Native animation is not involved in purchase/gating checks.
jest.mock('expo-asset', () => ({ Asset: { loadAsync: jest.fn(async () => []) } }));
jest.mock('../../src/minigames/components/MiniGameScreen', () => ({ MiniGameScreen: () => null }));
import Constants from 'expo-constants';
import { preferencesStore } from '../../src/state/usePreferences';
import { useEntitlement } from '../../src/purchases/hooks';
import { useCreationDraft } from '../../src/state/creationDraft';
import { DisplayText } from '../../src/ui/DisplayText';
import Settings from '../../app/settings';
import NewLife from '../../app/new-life';

const customer = (...owned: PremiumFeature[]): Customer => ({ entitlements: { active: Object.fromEntries(owned.map(feature => [feature, {}])), verification: 'VERIFIED' } });
let adapter: PurchaseAdapter, buy: jest.Mock, restore: jest.Mock;
const frame = (child: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, bottom: 0, left: 0, right: 0 } }}><ThemeProvider>{child}</ThemeProvider></SafeAreaProvider>;
const press = async (name: string) => { await act(async () => { await fireEvent.press(screen.getByRole('button', { name })); }); };
const originalDimensions = { window: ReactNative.Dimensions.get('window'), screen: ReactNative.Dimensions.get('screen') };
beforeEach(async () => {
  ReactNative.Dimensions.set({ window: { width: 390, height: 844, scale: 3, fontScale: 1 }, screen: { width: 390, height: 844, scale: 3, fontScale: 1 } });
  purchases.getState().dispose(); purchases.setState({ ownership: Object.fromEntries(features.map(feature => [feature, false])) as Record<PremiumFeature, boolean>, status: 'idle', products: {}, busy: false, error: null, message: null });
  buy = jest.fn(async product => customer(...products[product.identifier as ProductId].features)); restore = jest.fn(async () => customer('athlete'));
  adapter = { configure: async () => {}, customer: async () => customer(), products: async () => productIds.map(identifier => ({ identifier, priceString: identifier === 'dreams.full_unlock' ? '29,99 €' : '£9.99' })), purchase: buy, restore, listen: () => () => {} };
  mockAdapter = adapter;
  const world = decodeWorld(JSON.stringify(graduate)); endEmployment(world); world.people[world.activePersonId].skills.sport = 100; world.people[world.activePersonId].stats.health = world.people[world.activePersonId].stats.fitness = 100;
  mockStore = createGameStore({ repository: async () => ({ active: async () => world, list: async () => [], commit: async (next: ReturnType<typeof decodeWorld>) => next } as never), date: () => world.date, id: () => 'life_purchase_ui', premiumAccess: feature => purchases.getState().ownership[feature] });
  await mockStore.getState().bootstrap();
});
afterEach(() => { ReactNative.Dimensions.set(originalDimensions); setPurchaseAnalytics(); godModeSessionStore.getState().reset(); purchases.getState().dispose(); });
function Intent({ identity = 'life:athlete', onContinue }: { identity?: string; onContinue: () => void }) {
  const premium = usePremiumAction(identity);
  return <Page><Button label="Try Athlete" onPress={() => premium.run('athlete', 'tryout', onContinue)} />{premium.modal}</Page>;
}
test('store keeps exact localized decimal prices, full bundle grants Owned to individual items and blocks duplicates', async () => {
  await render(frame(<PurchaseOptions trigger="store" />)); await waitFor(() => expect(screen.getByText('29,99 €')).toBeTruthy());
  expect(screen.getAllByText('£9.99')).toHaveLength(7); expect(screen.getByLabelText('Price: 29,99 €')).toBeTruthy();
  await press('Unlock Everything'); expect(buy).not.toHaveBeenCalled(); await press('Buy Full Unlock'); await press('Close product details'); await waitFor(() => expect(screen.getAllByText('Owned').length).toBeGreaterThanOrEqual(8));
  expect(screen.queryByRole('button', { name: 'Buy Athlete Career' })).toBeNull(); expect(buy).toHaveBeenCalledTimes(1);
});
test('contextual career purchase shows only individual and bundles, resumes once, and dismissing changes no action', async () => {
  const resumed = jest.fn(), events: PurchaseEvent[] = []; setPurchaseAnalytics(event => events.push(event)); await render(frame(<Intent onContinue={resumed} />));
  await press('Try Athlete'); await waitFor(() => expect(screen.getByText('29,99 €')).toBeTruthy());
  expect(screen.getByRole('button', { name: 'View All Career Packs' })).toBeTruthy(); expect(screen.queryByRole('button', { name: 'Buy God Mode' })).toBeNull();
  await press('Maybe Later'); expect(resumed).not.toHaveBeenCalled(); expect(events.map(event => event.name)).toContain('paywall_dismissed');
  await press('Try Athlete'); await press('Buy Athlete Career'); await waitFor(() => expect(resumed).toHaveBeenCalledTimes(1));
  expect(events.map(event => event.name)).toEqual(expect.arrayContaining(['paywall_viewed', 'product_selected', 'purchase_initiated', 'purchase_completed']));
});
test('cancel and failure keep the intended action; restore returns to it without another purchase', async () => {
  const resumed = jest.fn(); await render(frame(<Intent onContinue={resumed} />)); await press('Try Athlete'); await waitFor(() => expect(screen.getByText('29,99 €')).toBeTruthy());
  buy.mockRejectedValueOnce({ userCancelled: true }); await press('Buy Athlete Career'); expect(screen.getByText('Purchase cancelled.')).toBeTruthy(); expect(resumed).not.toHaveBeenCalled();
  buy.mockRejectedValueOnce(new Error('offline')); await press('Buy Athlete Career'); expect(screen.getByRole('alert')).toHaveTextContent(/could not be verified/); expect(resumed).not.toHaveBeenCalled();
  await press('Restore Purchases'); await waitFor(() => expect(resumed).toHaveBeenCalledTimes(1)); expect(restore).toHaveBeenCalledTimes(1);
});
test('held purchase prevents repeated taps and back; changing life context cannot resume a stale action', async () => {
  let finish!: (value: Customer) => void; buy.mockImplementationOnce(() => new Promise(done => { finish = done; }));
  const resumed = jest.fn(), view = await render(frame(<Intent onContinue={resumed} />)); await press('Try Athlete'); await waitFor(() => expect(screen.getByText('29,99 €')).toBeTruthy());
  await press('Buy Athlete Career'); expect(screen.getByRole('button', { name: 'Buy Athlete Career' })).toBeDisabled(); expect(screen.getByRole('button', { name: 'Maybe Later' })).toBeDisabled();
  await press('Buy Athlete Career'); expect(buy).toHaveBeenCalledTimes(1);
  await view.rerender(frame(<Intent identity="another-life" onContinue={resumed} />)); await act(async () => { finish(customer('athlete')); }); expect(resumed).not.toHaveBeenCalled();
});
test('missing configuration shows unavailable prices and disabled purchases, and retry recovers', async () => {
  mockAdapter = null; await render(frame(<PurchaseOptions trigger="store" />)); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/unavailable/));
  await press('Unlock Everything'); expect(screen.getByRole('button', { name: 'Buy Full Unlock' })).toBeDisabled(); await press('Close product details'); expect(screen.getByRole('button', { name: 'Restore Purchases' })).toBeDisabled();
  mockAdapter = adapter; await press('Refresh Store'); await waitFor(() => expect(screen.getByText('29,99 €')).toBeTruthy()); await press('Unlock Everything'); expect(screen.getByRole('button', { name: 'Buy Full Unlock' })).toBeEnabled();
});
function CareerIntent() {
  const review = useCareerReview('athlete'), world = mockStore.getState().world!;
  return <Page><Button label="Review Tryout" onPress={() => review.confirm({ type: 'select-career', kind: 'athlete', quotedAnnualPay: careerPayQuote(world, 'athlete') }, 'Attend the tryout?', 'Start a team contract.', [], 'athlete', 'Attend Tryout')} />{review.modal}</Page>;
}
test('career review preserves its original command after purchase and only dispatches after normal confirmation', async () => {
  const revision = mockStore.getState().world!.revision;
  await render(frame(<CareerIntent />)); await press('Review Tryout'); await waitFor(() => expect(screen.getByText('29,99 €')).toBeTruthy());
  expect(screen.queryByRole('button', { name: 'Attend Tryout' })).toBeNull(); await press('Buy Athlete Career');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Attend Tryout' })).toBeTruthy()); expect(mockStore.getState().world!.revision).toBe(revision);
  await press('Attend Tryout'); expect(mockStore.getState().world!.revision).toBe(revision + 1);
});
test('paid God Mode opens the editor without exposing the internal mini-game playground', async () => {
  const globalDev = globalThis as unknown as { __DEV__: boolean }, previous = __DEV__;
  globalDev.__DEV__ = false; Constants.expoConfig!.extra = { godModeTesting: false };
  try {
    await purchases.getState().initialize(); await purchases.getState().purchase('dreams.god_mode', 'test');
    const view = await render(frame(<GodModeEditor />)); expect(screen.getByRole('button', { name: 'Save Changes' })).toBeTruthy(); expect(screen.queryByRole('button', { name: 'Mini-Game Playground' })).toBeNull();
    await view.unmount();
  } finally { globalDev.__DEV__ = previous; }
});

test('Time Machine browses freely and retains the selected checkpoint through purchase and the final confirmation', async () => {
  const world = mockStore.getState().world!, restorePoint = jest.fn(async (_id: string) => true);
  mockStore.setState({ snapshots: [{ id: 'snapshot_test', name: 'Earlier Moment', date: world.date, age: 22, label: 'Saved moment', size: 42, revision: 0, personId: world.activePersonId, createdAt: 'today' }], restoreSnapshot: restorePoint });
  await render(frame(<TimeMachine />)); expect(screen.getByText(/checkpoints.*compressed/)).toBeTruthy();
  await act(async () => { await fireEvent.press(screen.getByRole('button', { name: /^Earlier Moment/ })); });
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
  await render(frame(<CultIntent />)); await press('Review Founding'); await waitFor(() => expect(screen.getByText('29,99 €')).toBeTruthy());
  expect(screen.getByRole('button', { name: 'Buy Cult Leader Career' })).toBeTruthy();
  await press('View All Career Packs'); await press('Buy All Careers Pass'); await waitFor(() => expect(screen.getByText('Found Retained Name?')).toBeTruthy()); expect(screen.getByText('Keep my beliefs and headquarters.')).toBeTruthy(); expect(screen.getByRole('button', { name: 'Found Cult' })).toBeTruthy();
});
test('a direct public playground link remains internal even after Full Unlock and a saved testing toggle', async () => {
  const globalDev = globalThis as unknown as { __DEV__: boolean }, previous = __DEV__, previousExtra = Constants.expoConfig!.extra;
  globalDev.__DEV__ = false; Constants.expoConfig!.extra = { godModeTesting: false };
  try {
    await purchases.getState().initialize(); await purchases.getState().purchase('dreams.full_unlock', 'test');
    godModeSessionStore.getState().reveal(); preferencesStore.setState({ ready: true, settings: { ...preferencesStore.getState().settings, godModeEnabled: true } });
    await render(frame(<MiniGamePlayground />)); expect(Redirect).toHaveBeenCalledWith({ href: '/settings' }, undefined); expect(screen.queryByRole('header', { name: 'Mini-Game Playground' })).toBeNull();
  } finally { globalDev.__DEV__ = previous; Constants.expoConfig!.extra = previousExtra; }
});

describe('testing access in the purchase UI', () => {
  const globals = globalThis as unknown as { __DEV__: boolean };
  let previousDev: boolean, previousExtra: NonNullable<typeof Constants.expoConfig>['extra'];
  beforeEach(() => { previousDev = __DEV__; previousExtra = Constants.expoConfig!.extra; globals.__DEV__ = false; });
  afterEach(() => { globals.__DEV__ = previousDev; Constants.expoConfig!.extra = previousExtra; });
  const build = (mode: 'enabled' | 'disabled' | 'production') => {
    const previous = { ...process.env };
    try {
      Object.assign(process.env, { EAS_BUILD_PROFILE: mode === 'production' ? 'production' : 'internal',
        EAS_BUILD_DISTRIBUTION: mode === 'production' ? 'store' : 'internal',
        DREAMS_UNLOCK_ALL_TESTING: mode === 'disabled' ? '0' : '1', DREAMS_GOD_MODE_TESTING: '0' });
      Constants.expoConfig!.extra = require('../../app.config.cjs')({ config: {} }).extra;
    } finally { process.env = previous; }
  };
  function FeatureIntent({ feature, onContinue }: { feature: PremiumFeature; onContinue: () => void }) {
    const allowed = useEntitlement(feature), premium = usePremiumAction('testing:' + feature);
    return <Page><DisplayText>{allowed ? 'Feature accessible' : 'Feature locked'}</DisplayText><Button label="Try Feature" onPress={() => premium.run(feature, 'testing', onContinue)} />{premium.modal}</Page>;
  }
  test.each((['enabled', 'disabled', 'production'] as const).flatMap(mode => features.map(feature => ({ mode, feature }))))(
    '$feature hook and paywall with override $mode do not change purchase ownership', async ({ mode, feature }) => {
      build(mode);
      const resumed = jest.fn(), ownership = purchases.getState().ownership, events: PurchaseEvent[] = [];
      setPurchaseAnalytics(event => events.push(event));
      if (mode === 'enabled') mockAdapter = null;
      await render(frame(<FeatureIntent feature={feature} onContinue={resumed} />));
      expect(screen.getByText(mode === 'enabled' ? 'Feature accessible' : 'Feature locked')).toBeOnTheScreen();
      await press('Try Feature');
      if (mode === 'enabled') {
        expect(resumed).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('button', { name: 'Maybe Later' })).toBeNull();
        expect(events).toEqual([]);
        expect(purchases.getState().status).toBe('idle');
      } else {
        await waitFor(() => expect(screen.getByRole('button', { name: 'Buy ' + products[featureProduct(feature)].title })).toBeEnabled());
        expect(resumed).not.toHaveBeenCalled();
        expect(events.map(event => event.name)).toContain('paywall_viewed');
      }
      if (mode === 'enabled') expect(purchases.getState().ownership).toBe(ownership);
      expect(purchases.getState().ownership).toEqual(noOwnership());
      expect(buy).not.toHaveBeenCalled(); expect(restore).not.toHaveBeenCalled();
    },
  );

  test('turning off the flag locks the same mounted feature and shows its normal paywall', async () => {
    build('enabled'); const resumed = jest.fn(), view = await render(frame(<FeatureIntent feature="athlete" onContinue={resumed} />));
    await press('Try Feature'); expect(resumed).toHaveBeenCalledTimes(1);
    build('disabled'); await view.rerender(frame(<FeatureIntent feature="athlete" onContinue={resumed} />));
    expect(screen.getByText('Feature locked')).toBeOnTheScreen();
    await press('Try Feature'); await waitFor(() => expect(screen.getByRole('button', { name: 'Buy Athlete Career' })).toBeEnabled());
    expect(resumed).toHaveBeenCalledTimes(1); expect(purchases.getState().ownership).toEqual(noOwnership());
  });

  test('a waiting paywall resumes once when testing becomes available without granting ownership', async () => {
    build('disabled'); const resumed = jest.fn(), view = await render(frame(<FeatureIntent feature="athlete" onContinue={resumed} />));
    await press('Try Feature'); await waitFor(() => expect(screen.getByRole('button', { name: 'Buy Athlete Career' })).toBeEnabled());
    build('enabled'); await view.rerender(frame(<FeatureIntent feature="athlete" onContinue={resumed} />));
    await waitFor(() => expect(resumed).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('button', { name: 'Maybe Later' })).toBeNull();
    expect(purchases.getState().ownership).toEqual(noOwnership()); expect(buy).not.toHaveBeenCalled();
  });

  test('Settings shows the exact indicator only while testing access is active', async () => {
    build('enabled'); const view = await render(frame(<Settings />));
    expect(screen.getByText('TEST MODE — ALL UNLOCKED')).toBeOnTheScreen();
    build('disabled'); await view.rerender(frame(<Settings />)); expect(screen.queryByText('TEST MODE — ALL UNLOCKED')).toBeNull();
    build('production'); await view.rerender(frame(<Settings />)); expect(screen.queryByText('TEST MODE — ALL UNLOCKED')).toBeNull();
  });

  test('the God Mode editor opens without the hidden reveal, settings toggle, store connection or purchase', async () => {
    build('enabled'); mockAdapter = null; godModeSessionStore.getState().reset();
    preferencesStore.setState({ ready: false, settings: { ...preferencesStore.getState().settings, godModeEnabled: false } });
    await render(frame(<GodModeEditor />));
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Buy God Mode' })).toBeNull();
    expect(godModeSessionStore.getState().revealed).toBe(false);
    expect(preferencesStore.getState().settings.godModeEnabled).toBe(false);
    expect(purchases.getState().ownership).toEqual(noOwnership());
  });

  test('Royal Family selection bypasses its paywall and is locked again when testing is disabled', async () => {
    build('enabled');
    useCreationDraft.setState({ draft: null });
    const view = await render(frame(<NewLife />));
    await act(async () => { useCreationDraft.getState().edit({ country: 'GB', city: 'London', background: 'ordinary' }); });
    await act(async () => { await fireEvent.press(screen.getByRole('button', { name: /^More Options/ })); });
    const chooseRoyal = async () => { await act(async () => { await fireEvent.press(screen.getByRole('radio', { name: /^Royal Family/ })); }); };
    await chooseRoyal(); expect(useCreationDraft.getState().draft!.input.background).toBe('royal');
    expect(screen.queryByRole('button', { name: 'Buy God Mode' })).toBeNull();
    build('disabled');
    await act(async () => { useCreationDraft.getState().edit({ background: 'ordinary' }); });
    await view.rerender(frame(<NewLife />)); await chooseRoyal();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Buy God Mode' })).toBeEnabled());
    expect(useCreationDraft.getState().draft!.input.background).toBe('ordinary');
    expect(purchases.getState().ownership).toEqual(noOwnership());
  });

  test('checkpoint selection opens its original restore confirmation without a paywall', async () => {
    build('enabled'); mockAdapter = null;
    const world = mockStore.getState().world!;
    mockStore.setState({ snapshots: [{ id: 'test-point', personId: world.activePersonId, name: 'Testing Life', age: 25, date: world.date, label: 'Saved moment', size: 200, revision: world.revision, createdAt: '2026-11-12T12:00:00Z' }] });
    await render(frame(<TimeMachine />));
    await act(async () => { await fireEvent.press(screen.getByRole('button', { name: /Testing Life.*Age 25/ })); });
    expect(screen.getByRole('button', { name: 'Restore as New Branch' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Buy Unlimited Time Machine' })).toBeNull();
    expect(purchases.getState().ownership).toEqual(noOwnership());
  });
});

const openProduct = async (id: ProductId) => press(id === 'dreams.full_unlock' ? 'Unlock Everything' : 'View ' + shopContent[id].title);
test.each(productIds)('%s opens accurate reusable details and existing artwork without initiating payment', async id => {
  await render(frame(<PurchaseOptions trigger="store" />)); await waitFor(() => expect(purchases.getState().status).toBe('ready'));
  await openProduct(id);
  expect(screen.UNSAFE_getAllByType(Modal)).toHaveLength(1);
  expect(screen.getByRole('header', { name: shopContent[id].title })).toBeOnTheScreen();
  for (const benefit of shopContent[id].benefits) expect(screen.getByText(benefit)).toBeOnTheScreen();
  expect(screen.getByText('Unlock for ' + purchases.getState().products[id]!.priceString)).toBeOnTheScreen();
  const expected = id === 'dreams.cult' ? [CultArt, 'cult'] as const : id === 'dreams.career_pass' ? [Illustration, 'career'] as const : id === 'dreams.time_machine' ? [HealthLegalArt, 'rewind'] as const : id === 'dreams.god_mode' ? [PolishArt, 'life-star'] as const : [CareerArt, id === 'dreams.full_unlock' ? 'royalty' : id.split('.')[1]] as const;
  const hero = screen.UNSAFE_getAllByType(ShopProductArt).find(row => row.props.size === 108)!;
  expect(hero.props.id).toBe(id);
  expect(screen.UNSAFE_getAllByType(expected[0]).some(row => row.props.id === expected[1] && row.props.size === 108)).toBe(true);
  expect(buy).not.toHaveBeenCalled(); await press('Close product details');
  expect(screen.queryByRole('button', { name: 'Buy ' + products[id].title })).toBeNull(); expect(buy).not.toHaveBeenCalled();
});
test('the compact shop lists only the four paid careers in the requested order and keeps one careers link', async () => {
  await render(frame(<PurchaseOptions trigger="store" />)); await waitFor(() => expect(purchases.getState().status).toBe('ready'));
  expect(screen.UNSAFE_getAllByType(Pressable).map(row => row.props.accessibilityLabel).filter(label => label?.startsWith('View '))).toEqual(['View All Career Packs', 'View Time Machine', 'View God Mode', 'View Athlete Career', 'View Astronaut Career', 'View Military Career', 'View Cult Leader', 'View All Careers']);
  expect(screen.queryByText('Organised Crime')).toBeNull(); expect(screen.getAllByRole('button', { name: 'View All Careers' })).toHaveLength(1);
  await press('View All Careers'); expect(router.push).toHaveBeenCalledWith('/special-careers');
});
test('Career Pass marks the four individual careers owned while God Mode and Time Machine retain their prices', async () => {
  await render(frame(<PurchaseOptions trigger="store" />)); await waitFor(() => expect(purchases.getState().status).toBe('ready'));
  await openProduct('dreams.career_pass'); await press('Buy All Careers Pass');
  expect(purchases.getState().ownership).toEqual({ athlete: true, astronaut: true, military: true, cult: true, god_mode: false, time_machine: false });
  expect(screen.getByRole('button', { name: 'Owned' })).toBeDisabled(); await press('Close product details');
  expect(screen.getAllByText('Owned')).toHaveLength(5); expect(screen.getAllByText('£9.99')).toHaveLength(2); expect(buy).toHaveBeenCalledTimes(1);
});
test('a loading or missing price cannot purchase; refreshing a missing product recovers the same popup', async () => {
  let release!: () => void;
  adapter.products = () => new Promise(done => { release = () => done(productIds.filter(id => id !== 'dreams.god_mode').map(identifier => ({ identifier, priceString: 'CA$12.49' }))); });
  await render(frame(<PurchaseOptions trigger="store" />)); await waitFor(() => expect(release).toBeDefined());
  await openProduct('dreams.god_mode'); expect(screen.getByRole('button', { name: 'Buy God Mode' })).toBeDisabled();
  await act(async () => { release(); }); await waitFor(() => expect(purchases.getState().status).toBe('ready'));
  expect(screen.getByRole('button', { name: 'Buy God Mode' })).toBeDisabled(); expect(screen.getByText('Price unavailable')).toBeOnTheScreen();
  adapter.products = async () => productIds.map(identifier => ({ identifier, priceString: 'CA$12.49' }));
  await press('Refresh Store'); await waitFor(() => expect(screen.getByText('Unlock for CA$12.49')).toBeOnTheScreen());
  expect(screen.getByRole('button', { name: 'Buy God Mode' })).toBeEnabled(); expect(buy).not.toHaveBeenCalled();
});
test('a held shop payment blocks repeated native presses and closure, and old callbacks cannot act after dismissal', async () => {
  let finish!: (value: Customer) => void; buy.mockImplementationOnce(() => new Promise(done => { finish = done; }));
  await render(frame(<PurchaseOptions trigger="store" />)); await waitFor(() => expect(purchases.getState().status).toBe('ready'));
  await openProduct('dreams.athlete');
  const retained = screen.UNSAFE_getAllByType(Pressable).find(row => row.props.accessibilityLabel === 'Buy Athlete Career')!.props.onPress;
  const requestClose = screen.UNSAFE_getByType(Modal).props.onRequestClose;
  await press('Buy Athlete Career'); await act(async () => { retained(); requestClose(); });
  expect(buy).toHaveBeenCalledTimes(1); expect(screen.getByRole('button', { name: 'Close product details' })).toBeDisabled(); expect(screen.getByRole('button', { name: 'Buy Athlete Career' })).toBeDisabled();
  await act(async () => { finish(customer('athlete')); }); await waitFor(() => expect(screen.getByRole('button', { name: 'Owned' })).toBeDisabled());
  await press('Close product details'); await openProduct('dreams.astronaut');
  await act(async () => { retained(); requestClose(); });
  expect(screen.getByRole('header', { name: 'Astronaut Career' })).toBeOnTheScreen(); expect(buy).toHaveBeenCalledTimes(1);
});
test('closing a popup without purchase invalidates a queued buy, and opening another product keeps one modal', async () => {
  await render(frame(<PurchaseOptions trigger="store" />)); await waitFor(() => expect(purchases.getState().status).toBe('ready'));
  await openProduct('dreams.athlete'); const retained = screen.UNSAFE_getAllByType(Pressable).find(row => row.props.accessibilityLabel === 'Buy Athlete Career')!.props.onPress;
  await press('Close product details'); await openProduct('dreams.full_unlock'); await act(async () => { retained(); });
  expect(buy).not.toHaveBeenCalled(); expect(screen.UNSAFE_getAllByType(Modal)).toHaveLength(1);
});
test('an owned product has no purchase control and testing access never marks an unpurchased item Owned', async () => {
  const previous = Constants.expoConfig!.extra;
  try {
    Constants.expoConfig!.extra = { unlockAllTesting: true, unlockAllTestingBuild: 'internal' };
    await render(frame(<PurchaseOptions trigger="store" />)); await waitFor(() => expect(purchases.getState().status).toBe('ready'));
    expect(screen.queryByText('Owned')).toBeNull(); await openProduct('dreams.athlete');
    expect(screen.getByRole('button', { name: 'Buy Athlete Career' })).toBeEnabled(); expect(purchases.getState().ownership).toEqual(noOwnership());
    adapter.customer = async () => customer('athlete'); await act(async () => { await purchases.getState().refresh(); });
    expect(screen.queryByRole('button', { name: 'Buy Athlete Career' })).toBeNull(); expect(screen.getByRole('button', { name: 'Owned' })).toBeDisabled();
    expect(buy).not.toHaveBeenCalled();
  } finally { Constants.expoConfig!.extra = previous; }
});
test('small dark screens with enlarged text keep detail content scrollable and the localized purchase control outside it', async () => {
  await act(async () => { ReactNative.Dimensions.set({ window: { width: 320, height: 568, scale: 2, fontScale: 2 }, screen: { width: 320, height: 568, scale: 2, fontScale: 2 } }); });
  try {
    await render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 320, height: 568 }, insets: { top: 24, bottom: 24, left: 0, right: 0 } }}><ThemeProvider appearance="dark"><PurchaseOptions trigger="store" /></ThemeProvider></SafeAreaProvider>);
    await waitFor(() => expect(purchases.getState().status).toBe('ready')); await openProduct('dreams.full_unlock');
    const button = screen.UNSAFE_getAllByType(Pressable).find(row => row.props.accessibilityLabel === 'Buy Full Unlock')!;
    let parent = button.parent; while (parent) { expect(parent.type).not.toBe(ScrollView); parent = parent.parent; }
    expect(screen.getByText('Unlock for 29,99 €')).toBeOnTheScreen(); expect(screen.getByRole('button', { name: 'Close product details' })).toBeEnabled();
    const surface = screen.UNSAFE_getAllByType(ReactNative.View).find(row => StyleSheet.flatten(row.props.style)?.maxWidth === 520)!;
    expect(StyleSheet.flatten(surface.props.style)).toMatchObject({ maxHeight: 488, backgroundColor: '#253247' });
    expect(screen.UNSAFE_getAllByType(ScrollView).length).toBeGreaterThan(0);
  } finally { await act(async () => { ReactNative.Dimensions.set(originalDimensions); }); }
});

test('choosing Full Unlock within a contextual paywall keeps one native modal and resumes the pending action once', async () => {
  const resumed = jest.fn(); await render(frame(<Intent onContinue={resumed} />)); await press('Try Athlete');
  await waitFor(() => expect(purchases.getState().status).toBe('ready'));
  await press('View Full Unlock'); expect(screen.UNSAFE_getAllByType(Modal)).toHaveLength(1);
  expect(screen.getByRole('header', { name: 'Full Unlock' })).toBeOnTheScreen(); expect(resumed).not.toHaveBeenCalled();
  await press('Buy Full Unlock'); await waitFor(() => expect(resumed).toHaveBeenCalledTimes(1));
  expect(buy).toHaveBeenCalledTimes(1); expect(purchases.getState().ownership).toEqual(Object.fromEntries(features.map(feature => [feature, true])));
});
