import type { Ownership, PremiumFeature, ProductId } from './catalog';
export type PurchaseEvent = {
  name: 'paywall_viewed' | 'paywall_dismissed' | 'store_opened' | 'product_selected' | 'purchase_initiated' | 'purchase_completed' | 'purchase_cancelled' | 'purchase_failed' | 'purchase_restored';
  productId?: ProductId; trigger: string; ownership: Ownership; feature?: PremiumFeature;
};
// Optional in-process subscriber. No network provider and no save or personal data.
let subscriber: ((event: PurchaseEvent) => void) | undefined;
export function setPurchaseAnalytics(listener?: (event: PurchaseEvent) => void) { subscriber = listener; }
export function trackPurchase(event: PurchaseEvent) { try { subscriber?.(event); } catch { /* Analytics cannot fail a purchase. */ } }
