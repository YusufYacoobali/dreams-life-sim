import React from 'react';
import { Modal } from 'react-native';
import Constants from 'expo-constants';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, cleanup, fireEvent, render, screen, waitFor } from '../support/rendering';
import { ThemeProvider } from '../../src/ui/theme';
import { createGameStore } from '../../src/state/gameStore';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { premiumCareerFixture, premiumEntryFixture } from '../support/premiumCareers';
import { foundCult } from '../support/cults';
import { encodeWorld, type World } from '../../src/game/model';
import { hasPremiumAccess, requiredCareerFeature } from '../../src/purchases/access';
import { featureProduct, features, noOwnership, products, productIds, type PremiumFeature, type ProductId } from '../../src/purchases/catalog';
import { shopContent } from '../../src/purchases/ShopProduct';
import type { Customer, PurchaseAdapter } from '../../src/purchases/service';

let mockStore: ReturnType<typeof createGameStore>, mockAdapter: PurchaseAdapter | null, mockBlur: (() => void) | undefined;
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
jest.mock('../../src/purchases/native', () => ({ purchases: require('../../src/purchases/service').createPurchaseService(async () => mockAdapter) }));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() }, useLocalSearchParams: () => ({ kind: 'athlete' }),
  useFocusEffect: (effect: () => (() => void)) => require('react').useEffect(() => {
    const cleanup = effect(); mockBlur = cleanup;
    return () => { cleanup(); mockBlur = undefined; };
  }, [effect]),
}));
jest.mock('../../src/minigames/components/MiniGameEntry', () => ({ MiniGameEntry: () => null }));
import { purchases } from '../../src/purchases/native';
import { router } from 'expo-router';
import SpecialCareers from '../../app/(game)/special-careers';
import CareerDashboard from '../../app/(game)/career/[kind]';

const customer = (...owned: PremiumFeature[]): Customer => ({ entitlements: { active: Object.fromEntries(owned.map(id => [id, {}])), verification: 'VERIFIED' } });
const cases = [
  { feature: 'athlete', title: 'Athlete', route: { pathname: '/career/[kind]', params: { kind: 'athlete' } } },
  { feature: 'astronaut', title: 'Astronaut', route: { pathname: '/service/[kind]', params: { kind: 'astronaut' } } },
  { feature: 'military', title: 'Military', route: { pathname: '/service/[kind]', params: { kind: 'military' } } },
  { feature: 'cult', title: 'Cult Leader', route: '/cult' },
] as const;
const frame = (child: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, bottom: 24, left: 0, right: 0 } }}><ThemeProvider>{child}</ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => {
  // A user sees the presented native popup before using its controls. Tests
  // for ownership arriving before presentation live in premium-action-flow.
  for (const modal of screen.UNSAFE_queryAllByType(Modal)) {
    if (modal.props.visible && modal.props.onShow) await act(async () => { modal.props.onShow(); });
  }
  await act(async () => { await fireEvent.press(screen.getByRole('button', { name })); });
};
const row = (title: string) => screen.getByRole('button', { name: new RegExp('^' + title + '\\.') });
async function finishDismissal() {
  await waitFor(() => expect(screen.UNSAFE_getByType(Modal).props.visible).toBe(false));
  const complete = screen.UNSAFE_getByType(Modal).props.onDismiss;
  await act(async () => { complete(); });
}

let sqlite: ReturnType<typeof database>['sqlite'] | undefined, repository: SaveRepository;
let buy: jest.Mock, restore: jest.Mock;
async function setup(world = premiumEntryFixture()) {
  const db = database(); sqlite = db.sqlite; repository = new SaveRepository(db.driver);
  await repository.initialise(); await repository.create(world);
  mockStore = createGameStore({ repository: async () => repository, date: () => world.date, id: () => 'discovery-unused', premiumAccess: feature => hasPremiumAccess(purchases.getState().ownership[feature]) });
  await mockStore.getState().bootstrap();
}
beforeEach(async () => {
  sqlite = undefined; Constants.expoConfig!.extra = {};
  purchases.getState().dispose(); purchases.setState({ ownership: noOwnership(), status: 'idle', products: {}, busy: false, error: null, message: null });
  buy = jest.fn(async product => customer(...products[product.identifier as ProductId].features));
  restore = jest.fn(async () => customer('athlete'));
  mockAdapter = { configure: async () => {}, customer: async () => customer(), products: async () => productIds.map(identifier => ({ identifier, priceString: identifier === 'dreams.full_unlock' ? '29,99 €' : 'CHF 9.90' })), purchase: buy, restore, listen: () => () => {} };
});
afterEach(async () => { await cleanup(); sqlite?.close(); purchases.getState().dispose(); Constants.expoConfig!.extra = {}; });

test.each(cases)('$feature discovery opens its existing localized detail, three benefits and bundles before navigation', async ({ feature, title }) => {
  await setup(); const before = await repository.export(mockStore.getState().world!.id);
  await render(frame(<SpecialCareers />));
  expect(row(title)).toHaveAccessibleName(/\bLocked\b/);
  await fireEvent.press(row(title));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Buy ' + products[featureProduct(feature)].title })).toBeEnabled());
  expect(router.push).not.toHaveBeenCalled(); expect(buy).not.toHaveBeenCalled();
  for (const benefit of shopContent[featureProduct(feature)].benefits) expect(screen.getByText(benefit)).toBeOnTheScreen();
  expect(screen.getByText(shopContent[featureProduct(feature)].description)).toBeOnTheScreen();
  expect(screen.getByText('Unlock for CHF 9.90')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Explore Career' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'View All Career Packs' })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'View Full Unlock' })).toBeOnTheScreen();
  expect(screen.UNSAFE_getAllByType(Modal)).toHaveLength(1);
  expect(await repository.export(mockStore.getState().world!.id)).toBe(before);
});

test.each(cases)('Explore $feature opens its page after dismissal without ownership, participation or save writes', async ({ title, route }) => {
  await setup(); const initial = mockStore.getState().world!, before = await repository.export(initial.id);
  await render(frame(<SpecialCareers />)); await fireEvent.press(row(title));
  await press('Explore Career'); expect(router.push).not.toHaveBeenCalled();
  await finishDismissal(); expect(router.push).toHaveBeenCalledTimes(1); expect(router.push).toHaveBeenCalledWith(route);
  expect(purchases.getState().ownership).toEqual(noOwnership()); expect(buy).not.toHaveBeenCalled();
  expect(encodeWorld(mockStore.getState().world!)).toBe(encodeWorld(initial)); expect(await repository.export(initial.id)).toBe(before);
});

test('an explored Athlete page shows requirements while its original tryout and command safeguards still prevent unpaid entry', async () => {
  await setup(); const initial = mockStore.getState().world!, before = await repository.export(initial.id);
  const view = await render(frame(<SpecialCareers />)); await fireEvent.press(row('Athlete')); await press('Explore Career'); await finishDismissal();
  await view.rerender(frame(<CareerDashboard />));
  expect(screen.getByRole('header', { name: 'Your Entry Requirements' })).toBeOnTheScreen();
  await press('Review Tryout');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Buy Athlete Career' })).toBeEnabled());
  expect(screen.queryByRole('button', { name: 'Attend Tryout' })).toBeNull();
  let accepted = true;
  await act(async () => { accepted = await mockStore.getState().dispatch({ type: 'select-career', kind: 'athlete', quotedAnnualPay: 0n }); });
  expect(accepted).toBe(false);
  expect(mockStore.getState().error).toMatch(/ownership/);
  expect(await repository.export(initial.id)).toBe(before);
});

test.each(cases)('buying $feature navigates once to its selected page without starting a career or spending game money', async ({ feature, title, route }) => {
  await setup(); const before = await repository.export(mockStore.getState().world!.id);
  await render(frame(<SpecialCareers />)); await fireEvent.press(row(title));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Buy ' + products[featureProduct(feature)].title })).toBeEnabled());
  await press('Buy ' + products[featureProduct(feature)].title);
  expect(router.push).not.toHaveBeenCalled(); await finishDismissal();
  expect(router.push).toHaveBeenCalledTimes(1); expect(router.push).toHaveBeenCalledWith(route); expect(buy).toHaveBeenCalledTimes(1);
  expect(purchases.getState().ownership[feature]).toBe(true);
  expect(await repository.export(mockStore.getState().world!.id)).toBe(before);
});

test.each(['dreams.career_pass', 'dreams.full_unlock'] as const)('%s keeps the selected Astronaut destination and grants only its existing entitlements', async id => {
  await setup(); const before = await repository.export(mockStore.getState().world!.id);
  await render(frame(<SpecialCareers />)); await fireEvent.press(row('Astronaut'));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Buy Astronaut Career' })).toBeEnabled());
  await press('View ' + shopContent[id].title); expect(screen.UNSAFE_getAllByType(Modal)).toHaveLength(1);
  await press('Buy ' + products[id].title); await finishDismissal();
  expect(router.push).toHaveBeenCalledWith({ pathname: '/service/[kind]', params: { kind: 'astronaut' } });
  for (const feature of features) expect(purchases.getState().ownership[feature]).toBe((products[id].features as readonly string[]).includes(feature));
  expect(await repository.export(mockStore.getState().world!.id)).toBe(before);
});

test.each(cases)('owned $feature opens normally with no discovery popup', async ({ feature, title, route }) => {
  await setup(); await purchases.getState().initialize(); await purchases.getState().purchase(featureProduct(feature), 'fixture'); buy.mockClear();
  await render(frame(<SpecialCareers />)); expect(row(title)).not.toHaveAccessibleName(/\bLocked\b/);
  await fireEvent.press(row(title)); expect(router.push).toHaveBeenCalledWith(route);
  expect(screen.UNSAFE_queryAllByType(Modal)).toHaveLength(0); expect(buy).not.toHaveBeenCalled();
});

test.each((['athlete', 'military', 'astronaut'] as const).flatMap(feature => (['active', 'between'] as const).map(status => ({ feature, status }))))('a genuine $status $feature career retains free access without ownership', async ({ feature, status }) => {
  await setup(premiumCareerFixture(feature, status)); const item = cases.find(row => row.feature === feature)!;
  const before = await repository.export(mockStore.getState().world!.id);
  await render(frame(<SpecialCareers />)); expect(row(item.title)).not.toHaveAccessibleName(/\bLocked\b/);
  await fireEvent.press(row(item.title)); expect(router.push).toHaveBeenCalledWith(item.route);
  expect(screen.UNSAFE_queryAllByType(Modal)).toHaveLength(0); expect(purchases.getState().ownership).toEqual(noOwnership());
  expect(await repository.export(mockStore.getState().world!.id)).toBe(before);
});

test('an existing active Cult Leader opens their movement freely, while a follower gains no discovery exemption', async () => {
  const world = foundCult(); await setup(world);
  const cult = world.cults[0];
  await render(frame(<SpecialCareers />)); expect(row('Cult Leader')).not.toHaveAccessibleName(/\bLocked\b/);
  await fireEvent.press(row('Cult Leader')); expect(router.push).toHaveBeenCalledWith('/cult');
  const follower = cult.members.find(member => member.personId !== world.activePersonId)!;
  expect(follower).toBeDefined();
  expect(requiredCareerFeature({ ...world, activePersonId: follower.personId }, 'cult')).toBe('cult');
  expect(purchases.getState().ownership).toEqual(noOwnership());
});

test('a career exemption belongs to its person and feature and does not unlock another programme', () => {
  const world = premiumCareerFixture('military', 'active');
  expect(requiredCareerFeature(world, 'military')).toBeNull();
  expect(requiredCareerFeature(world, 'astronaut')).toBe('astronaut');
  expect(requiredCareerFeature(world, 'athlete')).toBe('athlete');
  const other = Object.keys(world.people).find(id => id !== world.activePersonId)!;
  expect(requiredCareerFeature({ ...world, activePersonId: other }, 'military')).toBe('military');
});

test('all free careers keep their ordinary routes without opening a product popup', async () => {
  await setup(); await render(frame(<SpecialCareers />));
  for (const [title, route] of [
    ['Actor', { pathname: '/career/[kind]', params: { kind: 'actor' } }],
    ['Model', { pathname: '/career/[kind]', params: { kind: 'model' } }],
    ['Musician', { pathname: '/career/[kind]', params: { kind: 'musician' } }],
    ['Business Owner', '/business'], ['Organised Crime', '/organised-crime'],
  ] as const) { await fireEvent.press(row(title)); expect(router.push).toHaveBeenLastCalledWith(route); }
  expect(screen.UNSAFE_queryAllByType(Modal)).toHaveLength(0); expect(buy).not.toHaveBeenCalled();
});

test('cancellation and an unavailable store retain free exploration without claiming ownership', async () => {
  await setup(); await render(frame(<SpecialCareers />)); await fireEvent.press(row('Athlete'));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Buy Athlete Career' })).toBeEnabled());
  buy.mockRejectedValueOnce({ userCancelled: true }); await press('Buy Athlete Career');
  expect(screen.getByText('Purchase cancelled.')).toBeOnTheScreen(); expect(router.push).not.toHaveBeenCalled();
  await press('Maybe Later'); await finishDismissal(); expect(router.push).not.toHaveBeenCalled();
  purchases.getState().dispose(); mockAdapter = null;
  await act(async () => { purchases.setState({ status: 'idle', products: {}, error: null, message: null }); });
  await fireEvent.press(row('Astronaut'));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Buy Astronaut Career' })).toBeDisabled());
  await press('Explore Career'); await finishDismissal();
  expect(router.push).toHaveBeenCalledWith({ pathname: '/service/[kind]', params: { kind: 'astronaut' } });
  expect(purchases.getState().ownership).toEqual(noOwnership());
});

test('restoring an unrelated purchase keeps the chosen career locked, then restoring its entitlement opens it once', async () => {
  await setup(); await render(frame(<SpecialCareers />)); await fireEvent.press(row('Astronaut'));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Restore Purchases' })).toBeEnabled());
  await press('Restore Purchases'); expect(router.push).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Buy Astronaut Career' })).toBeEnabled();
  restore.mockResolvedValueOnce(customer('astronaut'));
  await press('Restore Purchases'); await finishDismissal();
  expect(router.push).toHaveBeenCalledTimes(1); expect(router.push).toHaveBeenCalledWith({ pathname: '/service/[kind]', params: { kind: 'astronaut' } });
  expect(buy).not.toHaveBeenCalled();
});

test('repeated cross-career presses keep one purchase session and its original destination', async () => {
  await setup(); await render(frame(<SpecialCareers />));
  const athlete = row('Athlete'), astronaut = row('Astronaut');
  await act(async () => { await fireEvent.press(athlete); await fireEvent.press(astronaut); });
  expect(screen.UNSAFE_getAllByType(Modal)).toHaveLength(1);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Buy Athlete Career' })).toBeEnabled());
  await press('Explore Career'); await finishDismissal();
  expect(router.push).toHaveBeenCalledTimes(1); expect(router.push).toHaveBeenCalledWith({ pathname: '/career/[kind]', params: { kind: 'athlete' } });
});

test('leaving the discovery route during payment cancels navigation even if the mounted screen later receives ownership', async () => {
  let finish!: (customer: Customer) => void;
  buy.mockImplementationOnce(() => new Promise<Customer>(resolve => { finish = resolve; }));
  await setup(); const before = await repository.export(mockStore.getState().world!.id);
  await render(frame(<SpecialCareers />)); await fireEvent.press(row('Athlete'));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Buy Athlete Career' })).toBeEnabled());
  await press('Buy Athlete Career');
  expect(purchases.getState().busy).toBe(true);
  await act(async () => { mockBlur!(); });
  await finishDismissal();
  await act(async () => { finish(customer('athlete')); });
  expect(purchases.getState().ownership.athlete).toBe(true);
  expect(router.push).not.toHaveBeenCalled();
  expect(screen.UNSAFE_queryAllByType(Modal)).toHaveLength(0);
  expect(await repository.export(mockStore.getState().world!.id)).toBe(before);
});

test('legacy testing access leaves all four career locks visible and does not grant ownership', async () => {
  await setup(); Constants.expoConfig!.extra = { unlockAllTesting: true, unlockAllTestingBuild: 'internal' };
  await render(frame(<SpecialCareers />));
  for (const { title } of cases) expect(row(title)).toHaveAccessibleName(/\bLocked\b/);
  expect(purchases.getState().ownership).toEqual(noOwnership()); expect(buy).not.toHaveBeenCalled();
});
