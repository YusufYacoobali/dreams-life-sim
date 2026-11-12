import { useStore } from 'zustand';
import type { PremiumFeature } from './catalog';
import { purchases } from './native';
import { hasPremiumAccess } from './access';
export const usePurchases = <T>(selector: (state: ReturnType<typeof purchases.getState>) => T): T => useStore(purchases, selector);
export const useEntitlement = (feature: PremiumFeature) => hasPremiumAccess(usePurchases(state => state.ownership[feature]));
