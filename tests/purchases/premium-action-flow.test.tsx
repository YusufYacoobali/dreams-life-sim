import React, { useState } from 'react';
import { Modal, Platform, Pressable, Text } from 'react-native';
import Constants from 'expo-constants';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, fireEvent, render, screen, waitFor } from '../support/rendering';
import { ThemeProvider } from '../../src/ui/theme';
import { Button, Page } from '../../src/ui/components';
import { FeaturePaywall, usePremiumAction } from '../../src/purchases/PurchaseUI';
import { noOwnership, productIds, products, type PremiumFeature, type ProductId } from '../../src/purchases/catalog';
import type { Customer, PurchaseAdapter } from '../../src/purchases/service';

let mockAdapter: PurchaseAdapter | null;
jest.mock('../../src/purchases/native', () => ({ purchases: require('../../src/purchases/service').createPurchaseService(async () => mockAdapter) }));
jest.mock('../../src/state/useGame', () => ({ useGame: (select: (state: { world: null }) => unknown) => select({ world: null }) }));
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn(), navigate: jest.fn() } }));
import { purchases } from '../../src/purchases/native';

const customer = (...features: PremiumFeature[]): Customer => ({ entitlements: { active: Object.fromEntries(features.map(feature => [feature, {}])), verification: 'VERIFIED' } });
let latest: Customer, notify: ((customer: Customer) => void) | undefined, buy: jest.Mock, restore: jest.Mock, configure: jest.Mock;
const originalExtra = Constants.expoConfig!.extra;
const frame = (children: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, bottom: 0, left: 0, right: 0 } }}><ThemeProvider>{children}</ThemeProvider></SafeAreaProvider>;
const press = async (name: string) => { await act(async () => { await fireEvent.press(screen.getByRole('button', { name })); }); };
const modal = () => screen.UNSAFE_getAllByType(Modal)[0];
const dismissNative = async (callback: () => void) => { await act(async () => { callback(); }); };
const publish = async (...features: PremiumFeature[]) => { await act(async () => { latest = customer(...features); notify?.(latest); }); };

beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'ios'); Constants.expoConfig!.extra = {};
  purchases.getState().dispose(); purchases.setState({ ownership: noOwnership(), status: 'idle', products: {}, busy: false, error: null, message: null });
  latest = customer(); notify = undefined; configure = jest.fn(async () => {});
  buy = jest.fn(async product => { latest = customer(...products[product.identifier as ProductId].features); return latest; });
  restore = jest.fn(async () => { latest = customer('athlete'); return latest; });
  mockAdapter = { configure, customer: async () => latest, products: async () => productIds.map(identifier => ({ identifier, priceString: '£9.99' })), purchase: buy, restore, listen: listener => { notify = listener; return () => { notify = undefined; }; } };
});
afterEach(() => { purchases.getState().dispose(); Constants.expoConfig!.extra = originalExtra; jest.restoreAllMocks(); });

function Intent({ identity = 'life:person:career', feature = 'athlete', onContinue, onExplore }: { identity?: string; feature?: PremiumFeature | null; onContinue: () => void; onExplore?: () => void }) {
  const premium = usePremiumAction(identity), [confirmation, setConfirmation] = useState(false);
  return <Page><Button label="Premium action" onPress={() => premium.run(feature, 'career-entry', () => { onContinue(); setConfirmation(true); }, onExplore ? { onExplore } : undefined)} />{premium.modal}
    {confirmation && <Modal visible><Text>Original confirmation</Text></Modal>}
  </Page>;
}
async function open(onContinue = jest.fn(), onExplore?: () => void, presented = true) {
  const view = await render(frame(<Intent onContinue={onContinue} onExplore={onExplore} />));
  await press('Premium action'); await waitFor(() => expect(screen.getByRole('button', { name: 'Buy Athlete Career' })).toBeEnabled());
  if (presented) await act(async () => { modal().props.onShow(); });
  return { view, onContinue, dismissed: modal().props.onDismiss as () => void };
}

test('cached ownership before iOS onShow drains through presentation and dismissal before resuming once', async () => {
  const { onContinue, dismissed } = await open(jest.fn(), undefined, false), shown = modal().props.onShow;
  const heldRun = screen.UNSAFE_getAllByType(Pressable).find(node => node.props.accessibilityLabel === 'Premium action')!.props.onPress;
  await publish('athlete');
  expect(modal().props.visible).toBe(true); expect(screen.UNSAFE_queryAllByType(FeaturePaywall)).toHaveLength(0);
  expect(onContinue).not.toHaveBeenCalled(); await act(async () => { heldRun(); });
  expect(screen.UNSAFE_getAllByType(Modal)).toHaveLength(1); expect(onContinue).not.toHaveBeenCalled();
  await act(async () => { shown(); }); expect(modal().props.visible).toBe(false); expect(onContinue).not.toHaveBeenCalled();
  await dismissNative(dismissed); await dismissNative(dismissed);
  expect(onContinue).toHaveBeenCalledTimes(1); expect(screen.getByText('Original confirmation')).toBeOnTheScreen();
});

test.each(['cancel', 'identity'] as const)('an early %s before iOS presentation closes controls and blocks another paywall until native dismissal', async reason => {
  const { view, onContinue, dismissed } = await open(jest.fn(), undefined, false), shown = modal().props.onShow;
  const heldRun = screen.UNSAFE_getAllByType(Pressable).find(node => node.props.accessibilityLabel === 'Premium action')!.props.onPress;
  if (reason === 'cancel') await press('Maybe Later');
  else await view.rerender(frame(<Intent identity="another-life" onContinue={onContinue} />));
  expect(modal().props.visible).toBe(true); expect(screen.UNSAFE_queryAllByType(FeaturePaywall)).toHaveLength(0);
  await act(async () => { heldRun(); }); expect(screen.UNSAFE_getAllByType(Modal)).toHaveLength(1);
  await act(async () => { shown(); }); expect(modal().props.visible).toBe(false);
  await dismissNative(dismissed); expect(onContinue).not.toHaveBeenCalled();
  await press('Premium action'); await waitFor(() => expect(screen.getByRole('button', { name: 'Buy Athlete Career' })).toBeEnabled());
  const nextShown = modal().props.onShow, nextDismissed = modal().props.onDismiss;
  await act(async () => { shown(); dismissed(); }); expect(modal().props.visible).toBe(true);
  await press('Maybe Later'); expect(modal().props.visible).toBe(true);
  await act(async () => { nextShown(); }); expect(modal().props.visible).toBe(false);
  await dismissNative(nextDismissed); expect(onContinue).not.toHaveBeenCalled();
});

test.each(['dreams.athlete', 'dreams.career_pass', 'dreams.full_unlock'] as const)('%s retains the original confirmation and presents it once after iOS dismissal', async id => {
  const { onContinue, dismissed } = await open();
  if (id !== 'dreams.athlete') await press(id === 'dreams.career_pass' ? 'View All Career Packs' : 'View ' + products[id].title);
  await press('Buy ' + products[id].title);
  expect(purchases.getState().ownership.athlete).toBe(true);
  expect(modal().props.visible).toBe(false);
  expect(onContinue).not.toHaveBeenCalled(); expect(screen.queryByText('Original confirmation')).toBeNull();
  await dismissNative(dismissed);
  expect(onContinue).toHaveBeenCalledTimes(1); expect(screen.getByText('Original confirmation')).toBeOnTheScreen();
  expect(screen.UNSAFE_getAllByType(Modal)).toHaveLength(1);
  await dismissNative(dismissed); expect(onContinue).toHaveBeenCalledTimes(1); expect(buy).toHaveBeenCalledTimes(1);
});

test('verified restore retains its pending action until dismissal, without purchasing', async () => {
  const { onContinue, dismissed } = await open();
  await press('Restore Purchases'); expect(restore).toHaveBeenCalledTimes(1);
  expect(modal().props.visible).toBe(false); expect(onContinue).not.toHaveBeenCalled();
  await dismissNative(dismissed); expect(onContinue).toHaveBeenCalledTimes(1); expect(buy).not.toHaveBeenCalled();
});

test('cancelled, failed and unverified payments and an empty restore preserve the locked pending flow', async () => {
  const { onContinue } = await open();
  buy.mockRejectedValueOnce({ userCancelled: true }); await press('Buy Athlete Career');
  expect(screen.getByText('Purchase cancelled.')).toBeOnTheScreen();
  buy.mockRejectedValueOnce(Error('offline')); await press('Buy Athlete Career');
  expect(screen.getByRole('alert')).toHaveTextContent(/could not be verified/);
  buy.mockResolvedValueOnce({ entitlements: { active: { athlete: {} }, verification: 'FAILED' } }); await press('Buy Athlete Career');
  restore.mockResolvedValueOnce(customer()); await press('Restore Purchases');
  expect(onContinue).not.toHaveBeenCalled(); expect(purchases.getState().ownership).toEqual(noOwnership());
  expect(modal().props.visible).toBe(true); expect(screen.getByRole('button', { name: 'Buy Athlete Career' })).toBeEnabled();
});

test('Explore closes before discovery and never resumes the retained purchase action or grants access', async () => {
  const explore = jest.fn(), { onContinue, dismissed } = await open(jest.fn(), explore);
  const detail = screen.UNSAFE_getByType(FeaturePaywall).props;
  const oldBuy = screen.UNSAFE_getAllByType(Pressable).find(node => node.props.accessibilityLabel === 'Buy Athlete Career')!.props.onPress;
  await press('Explore Career');
  expect(modal().props.visible).toBe(false); expect(explore).not.toHaveBeenCalled(); expect(onContinue).not.toHaveBeenCalled();
  await act(async () => { detail.onExplore(); detail.onUnlocked(); detail.onDismiss(); oldBuy(); });
  expect(buy).not.toHaveBeenCalled();
  await dismissNative(dismissed); await dismissNative(dismissed);
  expect(explore).toHaveBeenCalledTimes(1); expect(onContinue).not.toHaveBeenCalled();
  expect(purchases.getState().ownership).toEqual(noOwnership()); expect(screen.UNSAFE_queryAllByType(Modal)).toHaveLength(0);
  await publish('athlete'); await act(async () => { detail.onUnlocked(); }); expect(onContinue).not.toHaveBeenCalled();
});

test('busy payment and dismissal reject held presses, back, Explore and late callbacks', async () => {
  let finish!: (value: Customer) => void; buy.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const explore = jest.fn(), { onContinue, dismissed } = await open(jest.fn(), explore), detail = screen.UNSAFE_getByType(FeaturePaywall).props;
  const requestClose = modal().props.onRequestClose;
  const oldBuy = screen.UNSAFE_getAllByType(Pressable).find(node => node.props.accessibilityLabel === 'Buy Athlete Career')!.props.onPress;
  const oldRun = screen.UNSAFE_getAllByType(Pressable).find(node => node.props.accessibilityLabel === 'Premium action')!.props.onPress;
  await press('Buy Athlete Career');
  await act(async () => { oldBuy(); oldRun(); requestClose(); detail.onDismiss(); detail.onExplore(); detail.onUnlocked(); });
  expect(buy).toHaveBeenCalledTimes(1); expect(modal().props.visible).toBe(true);
  await act(async () => { latest = customer('athlete'); finish(latest); });
  expect(modal().props.visible).toBe(false);
  await act(async () => { oldBuy(); oldRun(); requestClose(); detail.onDismiss(); detail.onExplore(); detail.onUnlocked(); });
  expect(onContinue).not.toHaveBeenCalled(); expect(explore).not.toHaveBeenCalled(); expect(buy).toHaveBeenCalledTimes(1);
  await dismissNative(dismissed); expect(onContinue).toHaveBeenCalledTimes(1); expect(explore).not.toHaveBeenCalled();
});

test('old native and paywall callbacks cannot dismiss a newly requested feature', async () => {
  const first = jest.fn(), next = jest.fn(), { view, dismissed } = await open(first), old = screen.UNSAFE_getByType(FeaturePaywall).props;
  await press('Maybe Later'); await dismissNative(dismissed);
  await view.rerender(frame(<Intent feature="astronaut" onContinue={next} />)); await press('Premium action');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Buy Astronaut Career' })).toBeEnabled());
  await act(async () => { old.onDismiss(); old.onUnlocked(); dismissed(); });
  expect(modal().props.visible).toBe(true); expect(first).not.toHaveBeenCalled();
  await act(async () => { modal().props.onShow(); });
  const nextDismissed = modal().props.onDismiss; await press('Buy Astronaut Career'); await dismissNative(nextDismissed);
  expect(next).toHaveBeenCalledTimes(1); expect(first).not.toHaveBeenCalled();
});

test('a native dismissal without a prior button callback cancels rather than retaining an invisible paywall', async () => {
  const { onContinue, dismissed } = await open(); await dismissNative(dismissed);
  expect(onContinue).not.toHaveBeenCalled(); expect(screen.UNSAFE_queryAllByType(Modal)).toHaveLength(0);
  await press('Premium action'); await waitFor(() => expect(screen.getByRole('button', { name: 'Buy Athlete Career' })).toBeEnabled());
  expect(purchases.getState().ownership).toEqual(noOwnership());
});

test('revoked ownership during dismissal restores restrictions instead of resuming', async () => {
  const { onContinue, dismissed } = await open(); await press('Buy Athlete Career'); await publish();
  await dismissNative(dismissed); expect(onContinue).not.toHaveBeenCalled();
  await press('Premium action'); await waitFor(() => expect(screen.getByRole('button', { name: 'Buy Athlete Career' })).toBeEnabled());
  expect(purchases.getState().ownership).toEqual(noOwnership());
});

test('changing identity during dismissal permanently invalidates its intent even if the old identity returns', async () => {
  const { view, onContinue, dismissed } = await open(); await press('Buy Athlete Career');
  await view.rerender(frame(<Intent identity="another-life" onContinue={onContinue} />));
  await view.rerender(frame(<Intent onContinue={onContinue} />));
  await dismissNative(dismissed); expect(onContinue).not.toHaveBeenCalled();
  await press('Premium action'); expect(onContinue).toHaveBeenCalledTimes(1);
});

test.each(['purchase', 'explore'] as const)('unmounting during %s dismissal invalidates every queued completion', async kind => {
  const explore = jest.fn(), { view, onContinue, dismissed } = await open(jest.fn(), explore);
  if (kind === 'purchase') await press('Buy Athlete Career'); else await press('Explore Career');
  await view.unmount(); await dismissNative(dismissed);
  expect(onContinue).not.toHaveBeenCalled(); expect(explore).not.toHaveBeenCalled();
});

test('Android waits for committed removal and native frames before presenting the original confirmation', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  let sequence = 0; const frames = new Map<number, Parameters<typeof requestAnimationFrame>[0]>();
  jest.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(callback => { frames.set(++sequence, callback); return sequence; });
  jest.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(id => { if (typeof id === 'number') frames.delete(id); });
  const { onContinue } = await open(); await press('Buy Athlete Career');
  expect(modal().props.visible).toBe(false); expect(onContinue).not.toHaveBeenCalled();
  const nextFrame = async () => { const [id, callback] = frames.entries().next().value!; frames.delete(id); await act(async () => { callback(0); }); };
  await nextFrame(); expect(onContinue).not.toHaveBeenCalled();
  await nextFrame(); expect(onContinue).toHaveBeenCalledTimes(1); expect(screen.UNSAFE_getAllByType(Modal)).toHaveLength(1);
});

test('Android cancels queued dismissal work after unmount, including a retained native frame callback', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  const frames: Parameters<typeof requestAnimationFrame>[0][] = [];
  jest.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(callback => { frames.push(callback); return frames.length; });
  const cancel = jest.spyOn(globalThis, 'cancelAnimationFrame');
  const explore = jest.fn(), { view, onContinue } = await open(jest.fn(), explore);
  await press('Explore Career'); const heldFrame = frames[0];
  await view.unmount(); await act(async () => { heldFrame(0); });
  expect(cancel).toHaveBeenCalled(); expect(frames).toHaveLength(1);
  expect(onContinue).not.toHaveBeenCalled(); expect(explore).not.toHaveBeenCalled();
});

test('disabling testing access while its paywall dismisses immediately restores normal restrictions', async () => {
  const { view, onContinue, dismissed } = await open();
  Constants.expoConfig!.extra = { unlockAllTesting: true, unlockAllTestingBuild: 'internal' };
  await view.rerender(frame(<Intent onContinue={onContinue} />)); expect(modal().props.visible).toBe(false);
  Constants.expoConfig!.extra = {};
  await view.rerender(frame(<Intent onContinue={onContinue} />)); await dismissNative(dismissed);
  expect(onContinue).not.toHaveBeenCalled(); expect(purchases.getState().ownership).toEqual(noOwnership());
  await press('Premium action'); await waitFor(() => expect(screen.getByRole('button', { name: 'Buy Athlete Career' })).toBeEnabled());
});

test.each(['free', 'owned', 'testing'] as const)('%s entry preserves direct behavior without presenting a paywall', async kind => {
  if (kind === 'owned') { await purchases.getState().initialize(); await publish('athlete'); }
  if (kind === 'testing') Constants.expoConfig!.extra = { unlockAllTesting: true, unlockAllTestingBuild: 'internal' };
  const onContinue = jest.fn(); await render(frame(<Intent feature={kind === 'free' ? null : 'athlete'} onContinue={onContinue} />));
  const before = configure.mock.calls.length; await press('Premium action');
  expect(onContinue).toHaveBeenCalledTimes(1); expect(configure).toHaveBeenCalledTimes(before); expect(buy).not.toHaveBeenCalled();
  expect(screen.UNSAFE_getAllByType(Modal)).toHaveLength(1); expect(screen.getByText('Original confirmation')).toBeOnTheScreen();
  if (kind !== 'owned') expect(purchases.getState().ownership).toEqual(noOwnership());
});
