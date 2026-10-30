import { useStore } from 'zustand';
import type { PremiumFeature } from './catalog';
import { purchases } from './native';
export const usePurchases = <T>(selector: (state: ReturnType<typeof purchases.getState>) => T): T => useStore(purchases, selector);
export const useEntitlement = (feature: PremiumFeature) => usePurchases(state => state.ownership[feature]);
