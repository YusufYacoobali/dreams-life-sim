import React from 'react';
import { AccessibilityInfo, Modal, Platform, Pressable, StyleSheet } from 'react-native';
import * as Native from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, fireEvent, render, screen, waitFor } from '../support/rendering';
import { ThemeProvider, lightColors } from '../../src/ui/theme';
import { FeedbackProvider } from '../../src/ui/feedback';
import { noOwnership, productIds, type ProductId } from '../../src/purchases/catalog';

let mockNativeBlur: 'missing' | 'present' | 'throws' = 'missing', mockBlurThrows = false;
jest.mock('expo-modules-core', () => ({ requireOptionalNativeModule: () => {
  if (mockNativeBlur === 'throws') throw Error('Older native runtime');
  return mockNativeBlur === 'present' ? {} : null;
} }));
jest.mock('expo-blur', () => ({ BlurView: (props: unknown) => {
  if (mockBlurThrows) throw Error('Unavailable native view');
  return require('react').createElement(require('react-native').View, props);
} }));
jest.mock('../../src/state/useGame', () => ({ useGame: jest.fn() }));
jest.mock('../../src/purchases/native', () => ({ purchases: require('../../src/purchases/service').createPurchaseService(async () => null) }));
import { purchases } from '../../src/purchases/native';
import { ShopBackdrop } from '../../src/purchases/ShopBackdrop';
import { ShopProductDetailModal } from '../../src/purchases/ShopProductDetailModal';

const initialDimensions = { window: Native.Dimensions.get('window'), screen: Native.Dimensions.get('screen') };
const frame = (children: React.ReactNode, small = false, dark = false) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: small ? 320 : 390, height: small ? 568 : 844 }, insets: { top: small ? 24 : 47, bottom: small ? 24 : 34, left: 0, right: 0 } }}><ThemeProvider appearance={dark ? 'dark' : 'light'}>{children}</ThemeProvider></SafeAreaProvider>;
const press = async (label: string) => { await act(async () => { await fireEvent.press(screen.getByRole('button', { name: label })); }); };
const retained = (label: string) => screen.UNSAFE_getAllByType(Pressable).find(node => node.props.accessibilityLabel === label)!.props.onPress as () => void;
function insideScroll(label: string) {
  let node = screen.getByRole('button', { name: label }).parent;
  while (node) { if (node.props.testID === 'shop-product-content') return true; node = node.parent; }
  return false;
}
let buy: jest.Mock, restore: jest.Mock;
beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'ios'); mockNativeBlur = 'missing'; mockBlurThrows = false;
  Native.Dimensions.set({ window: { width: 390, height: 844, scale: 3, fontScale: 1 }, screen: { width: 390, height: 844, scale: 3, fontScale: 1 } });
  jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockResolvedValue(false);
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  buy = jest.fn(async () => 'cancelled' as const); restore = jest.fn(async () => false);
  purchases.setState({ status: 'ready', busy: false, ownership: noOwnership(), products: Object.fromEntries(productIds.map(identifier => [identifier, { identifier, priceString: identifier === 'dreams.full_unlock' ? '29,99 €' : 'CA$12.49' }])), error: null, message: null, purchase: buy, restore });
});
afterEach(() => { jest.restoreAllMocks(); Native.Dimensions.set(initialDimensions); });

test.each(['android', 'web'] as const)('%s uses a light dim fallback without mounting native blur', async platform => {
  jest.replaceProperty(Platform, 'OS', platform); mockNativeBlur = 'present';
  await render(<ShopBackdrop dark={false} />);
  expect(screen.queryByTestId('shop-native-blur', { includeHiddenElements: true })).toBeNull();
  expect(StyleSheet.flatten(screen.getByTestId('shop-backdrop-dim', { includeHiddenElements: true }).props.style).backgroundColor).toBe('rgba(10, 12, 35, 0.32)');
  expect(screen.getByTestId('shop-backdrop', { includeHiddenElements: true })).toHaveProp('pointerEvents', 'none');
  expect(AccessibilityInfo.isReduceTransparencyEnabled).not.toHaveBeenCalled();
});

test.each(['missing', 'throws'] as const)('an iOS binary with %s native support keeps the modal usable', async availability => {
  mockNativeBlur = availability;
  await render(frame(<ShopProductDetailModal id="dreams.athlete" trigger="presentation" onDismiss={jest.fn()} />));
  expect(screen.queryByTestId('shop-native-blur', { includeHiddenElements: true })).toBeNull();
  expect(screen.getByRole('button', { name: 'Buy Athlete Career' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Close product details' })).toBeEnabled();
});

test('supported iOS blur follows Reduce Transparency and a later native event wins over an older query', async () => {
  mockNativeBlur = 'present';
  let report!: (enabled: boolean) => void, release!: (enabled: boolean) => void;
  const remove = jest.fn();
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation((event, callback) => {
    if (event === 'reduceTransparencyChanged') report = callback;
    return { remove };
  });
  jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockReturnValue(new Promise(done => { release = done; }));
  const view = await render(<ShopBackdrop dark />);
  expect(screen.queryByTestId('shop-native-blur', { includeHiddenElements: true })).toBeNull();
  await act(async () => { report(true); release(false); });
  expect(screen.queryByTestId('shop-native-blur', { includeHiddenElements: true })).toBeNull();
  await act(async () => { report(false); });
  expect(screen.getByTestId('shop-native-blur', { includeHiddenElements: true })).toHaveProp('intensity', 20);
  expect(screen.getByTestId('shop-native-blur', { includeHiddenElements: true })).toHaveProp('tint', 'dark');
  await act(async () => { report(true); });
  expect(screen.queryByTestId('shop-native-blur', { includeHiddenElements: true })).toBeNull();
  await view.unmount(); expect(remove).toHaveBeenCalledTimes(1);
});

test('a native blur render failure retains dimming and the functional purchase control', async () => {
  mockNativeBlur = 'present'; mockBlurThrows = true;
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    await render(frame(<ShopProductDetailModal id="dreams.full_unlock" trigger="presentation" onDismiss={jest.fn()} />));
    expect(screen.getByTestId('shop-backdrop-dim', { includeHiddenElements: true })).toBeOnTheScreen();
    expect(screen.queryByTestId('shop-native-blur', { includeHiddenElements: true })).toBeNull();
    expect(screen.getByRole('button', { name: 'Buy Full Unlock' })).toBeEnabled();
  } finally { error.mockRestore(); }
});

test.each(['dreams.full_unlock', 'dreams.athlete'] as const)('%s keeps its existing color, exact localized price and persistent CTA on a small dark phone at 200%% text', async id => {
  Native.Dimensions.set({ window: { width: 320, height: 568, scale: 2, fontScale: 2 }, screen: { width: 320, height: 568, scale: 2, fontScale: 2 } });
  await render(frame(<ShopProductDetailModal id={id} trigger="presentation" onDismiss={jest.fn()} onExplore={jest.fn()} contextual />, true, true));
  const label = id === 'dreams.full_unlock' ? 'Buy Full Unlock' : 'Buy Athlete Career';
  expect(insideScroll(label)).toBe(false);
  expect(insideScroll('Explore Career')).toBe(true);
  expect(insideScroll('Restore Purchases')).toBe(true);
  expect(insideScroll('Maybe Later')).toBe(true);
  expect(StyleSheet.flatten(screen.getByTestId('shop-product-card').props.style)).toMatchObject({ maxHeight: 488, backgroundColor: '#253247' });
  expect(StyleSheet.flatten(screen.getByTestId('shop-product-footer').props.style)).toMatchObject({ flexShrink: 0 });
  expect(screen.getByText('Unlock for ' + purchases.getState().products[id]!.priceString)).toBeOnTheScreen();
  const control = screen.UNSAFE_getAllByType(Pressable).find(node => node.props.accessibilityLabel === label)!;
  expect(StyleSheet.flatten(control.props.style({ pressed: false })).backgroundColor).toBe(id === 'dreams.full_unlock' ? '#8231C7' : lightColors.actionBlue);
  expect(screen.getByRole('button', { name: 'Close product details' })).toBeEnabled();
  expect(buy).not.toHaveBeenCalled(); expect(restore).not.toHaveBeenCalled();
});

test('Explore is optional and closes the live session once while busy and retained callbacks cannot act', async () => {
  const explore = jest.fn(), dismiss = jest.fn();
  const props = { id: 'dreams.athlete' as ProductId, trigger: 'presentation', onDismiss: dismiss, contextual: true };
  const view = await render(frame(<ShopProductDetailModal {...props} />));
  expect(screen.queryByRole('button', { name: 'Explore Career' })).toBeNull();
  await view.rerender(frame(<ShopProductDetailModal {...props} onExplore={explore} />));
  const oldExplore = retained('Explore Career'), oldBuy = retained('Buy Athlete Career'), oldRestore = retained('Restore Purchases'), oldDismiss = screen.UNSAFE_getByType(Modal).props.onRequestClose;
  await act(async () => { purchases.setState({ busy: true }); });
  expect(screen.getByRole('button', { name: 'Explore Career' })).toBeDisabled();
  await act(async () => { oldExplore(); oldDismiss(); }); expect(explore).not.toHaveBeenCalled(); expect(dismiss).not.toHaveBeenCalled();
  await act(async () => { purchases.setState({ busy: false }); });
  await press('Explore Career');
  await act(async () => { oldExplore(); oldBuy(); oldRestore(); oldDismiss(); });
  expect(explore).toHaveBeenCalledTimes(1); expect(dismiss).not.toHaveBeenCalled();
  expect(buy).not.toHaveBeenCalled(); expect(restore).not.toHaveBeenCalled();
  expect(purchases.getState().ownership).toEqual(noOwnership());
  await view.rerender(frame(<ShopProductDetailModal {...props} id="dreams.full_unlock" onExplore={explore} />));
  await act(async () => { oldExplore(); }); expect(explore).toHaveBeenCalledTimes(1);
});

test('reduced motion keeps the native modal transition still', async () => {
  await render(frame(<FeedbackProvider reducedMotion haptics={false} onButtonFeedback={async () => {}}><ShopProductDetailModal id="dreams.athlete" trigger="presentation" onDismiss={jest.fn()} /></FeedbackProvider>));
  await waitFor(() => expect(screen.UNSAFE_getByType(Modal).props.animationType).toBe('none'));
});
