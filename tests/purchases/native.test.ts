import { Platform } from 'react-native';
import Constants from 'expo-constants';
const mockSDK = {
  isConfigured: jest.fn(async () => false), configure: jest.fn(),
  ENTITLEMENT_VERIFICATION_MODE: { INFORMATIONAL: 'INFORMATIONAL' },
  getCustomerInfo: jest.fn(async () => ({ entitlements: { active: {}, verification: 'VERIFIED' } })),
  getProducts: jest.fn(async () => []), purchaseStoreProduct: jest.fn(), restorePurchases: jest.fn(),
  addCustomerInfoUpdateListener: jest.fn((_listener: unknown) => {}), removeCustomerInfoUpdateListener: jest.fn((_listener: unknown) => {}),
};
jest.mock('react-native-purchases', () => ({ __esModule: true, default: mockSDK, PRODUCT_CATEGORY: { NON_SUBSCRIPTION: 'NON_SUBSCRIPTION' } }));
import { purchases } from '../../src/purchases/native';
import { noOwnership, productIds } from '../../src/purchases/catalog';
let previousOS: typeof Platform.OS, previousEnvironment: typeof Constants.executionEnvironment;
let previousApple: string | undefined, previousGoogle: string | undefined;
beforeEach(() => {
  previousOS = Platform.OS; previousEnvironment = Constants.executionEnvironment;
  previousApple = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY; previousGoogle = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
  delete process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY; delete process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
  purchases.getState().dispose(); purchases.setState({ ownership: noOwnership(), products: {}, status: 'idle', error: null, busy: false });
  Object.assign(Constants, { executionEnvironment: 'bare' });
});
afterEach(() => {
  purchases.getState().dispose(); Object.defineProperty(Platform, 'OS', { value: previousOS, configurable: true }); Object.assign(Constants, { executionEnvironment: previousEnvironment });
  if (previousApple === undefined) delete process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY; else process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY = previousApple;
  if (previousGoogle === undefined) delete process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY; else process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY = previousGoogle;
});
test.each(['ios', 'android'] as const)('%s configures the correct public key and trusted verification, fetches only permanent products, and registers listener', async platform => {
  Object.defineProperty(Platform, 'OS', { value: platform, configurable: true });
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY = 'appl_example_public'; process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY = 'goog_example_public';
  await purchases.getState().initialize();
  expect(mockSDK.configure).toHaveBeenCalledWith({ apiKey: platform === 'ios' ? 'appl_example_public' : 'goog_example_public', entitlementVerificationMode: 'INFORMATIONAL' });
  expect(mockSDK.getProducts).toHaveBeenCalledWith(productIds, 'NON_SUBSCRIPTION'); expect(mockSDK.addCustomerInfoUpdateListener).toHaveBeenCalledTimes(1);
  purchases.getState().dispose(); expect(mockSDK.removeCustomerInfoUpdateListener).toHaveBeenCalledWith(mockSDK.addCustomerInfoUpdateListener.mock.calls[0][0]);
});
test.each(['missing', 'placeholder', 'expo-go', 'web'])('%s is unavailable without attempting native billing', async mode => {
  Object.defineProperty(Platform, 'OS', { value: mode === 'web' ? 'web' : 'ios', configurable: true });
  if (mode === 'placeholder') process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY = 'REPLACE_WITH_APPLE_PUBLIC_SDK_KEY';
  if (mode === 'expo-go') { process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY = 'appl_example_public'; Object.assign(Constants, { executionEnvironment: 'storeClient' }); }
  await purchases.getState().initialize(); expect(purchases.getState().status).toBe('unavailable'); expect(mockSDK.configure).not.toHaveBeenCalled();
});
