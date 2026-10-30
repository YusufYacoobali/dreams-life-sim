import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { PurchasesStoreProduct } from 'react-native-purchases';
import { createPurchaseService, type PurchaseAdapter } from './service';
import { productIds } from './catalog';

async function nativeAdapter(): Promise<PurchaseAdapter | null> {
  const key = Platform.OS === 'ios' ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY : Platform.OS === 'android' ? process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY : undefined;
  // Expo Go has no real billing module. Public API keys are intentionally bundled.
  if (!key || key.includes('REPLACE_') || Constants.executionEnvironment === 'storeClient' || !['ios', 'android'].includes(Platform.OS)) return null;
  const { default: Purchases, PRODUCT_CATEGORY } = require('react-native-purchases') as typeof import('react-native-purchases');
  return {
    configure: async () => {
      if (!await Purchases.isConfigured()) Purchases.configure({ apiKey: key, entitlementVerificationMode: Purchases.ENTITLEMENT_VERIFICATION_MODE.INFORMATIONAL });
    },
    customer: () => Purchases.getCustomerInfo(),
    products: () => Purchases.getProducts([...productIds], PRODUCT_CATEGORY.NON_SUBSCRIPTION),
    purchase: async product => (await Purchases.purchaseStoreProduct(product as PurchasesStoreProduct)).customerInfo,
    restore: () => Purchases.restorePurchases(),
    listen: listener => { Purchases.addCustomerInfoUpdateListener(listener); return () => { Purchases.removeCustomerInfoUpdateListener(listener); }; },
  };
}
export const purchases = createPurchaseService(nativeAdapter);
