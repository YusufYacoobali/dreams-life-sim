import { createStore } from 'zustand/vanilla';
import { features, noOwnership, ownsProduct, productIds, type Ownership, type ProductId } from './catalog';
import { trackPurchase } from './analytics';

/** Customer information comes exclusively from the SDK, including its supported offline cache. */
export type Customer = { entitlements: { active: Record<string, unknown>; verification?: string } };
export type StoreProduct = { identifier: string; priceString: string };
export type PurchaseAdapter = {
  configure: () => Promise<void>;
  customer: () => Promise<Customer>;
  products: () => Promise<StoreProduct[]>;
  purchase: (product: StoreProduct) => Promise<Customer>;
  restore: () => Promise<Customer>;
  listen: (listener: (customer: Customer) => void) => () => void;
};
export function resolveOwnership(customer: Customer): Ownership {
  // Failed trusted-entitlement verification must never grant access.
  if (!['VERIFIED', 'VERIFIED_ON_DEVICE'].includes(customer.entitlements.verification ?? '')) return noOwnership();
  return Object.fromEntries(features.map(feature => [feature, !!customer.entitlements.active[feature]])) as Ownership;
}
export type PurchaseResult = 'completed' | 'owned' | 'cancelled' | 'failed' | 'busy';
type PurchaseState = {
  status: 'idle' | 'loading' | 'ready' | 'unavailable'; busy: boolean;
  ownership: Ownership; products: Partial<Record<ProductId, StoreProduct>>; error: string | null; message: string | null;
  initialize: () => Promise<void>; refresh: () => Promise<void>;
  purchase: (id: ProductId, trigger: string) => Promise<PurchaseResult>;
  restore: (trigger: string) => Promise<boolean>; dispose: () => void;
};
export function createPurchaseService(makeAdapter: () => Promise<PurchaseAdapter | null>) {
  let adapter: PurchaseAdapter | null = null, initialization: Promise<void> | null = null, refresh: Promise<void> | null = null;
  let unsubscribe: (() => void) | undefined, generation = 0, customerVersion = 0;
  return createStore<PurchaseState>((set, get) => {
    const accept = (customer: Customer) => { customerVersion++; set({ ownership: resolveOwnership(customer) }); };
    const load = async () => {
      const currentAdapter = adapter, currentGeneration = generation;
      if (!currentAdapter) return;
      const version = customerVersion;
      const [customer, catalogue] = await Promise.allSettled([
        (async () => {
          const info = await currentAdapter.customer();
          if (generation === currentGeneration && customerVersion === version) accept(info);
        })(),
        (async () => {
          const catalogue = await currentAdapter.products();
          if (generation !== currentGeneration) return;
          const entries = catalogue.filter(item => productIds.includes(item.identifier as ProductId));
          set({ products: Object.fromEntries(entries.map(item => [item.identifier, item])) });
        })(),
      ]);
      if (generation !== currentGeneration) return;
      const failed = customer.status === 'rejected' || catalogue.status === 'rejected';
      set({ status: 'ready', error: failed ? 'The store could not refresh. Previously verified access is kept. Please try again.' : null });
    };
    return {
      status: 'idle', busy: false, ownership: noOwnership(), products: {}, error: null, message: null,
      initialize: () => {
        if (initialization) return initialization;
        if (adapter) return get().refresh();
        const currentGeneration = generation;
        initialization = (async () => {
          set({ status: 'loading', error: null });
          try {
            const candidate = await makeAdapter();
            if (!candidate) { set({ status: 'unavailable', error: 'Purchases are unavailable in this build. Free gameplay is available.' }); return; }
            await candidate.configure();
            if (currentGeneration !== generation) return;
            adapter = candidate;
            unsubscribe = adapter.listen(accept);
            await load();
          } catch { set({ status: 'unavailable', error: 'The store is unavailable. Please try again. Free gameplay is available.' }); }
        })().finally(() => { initialization = null; });
        return initialization;
      },
      refresh: () => {
        if (get().busy) return Promise.resolve();
        if (!adapter) return get().initialize();
        if (!refresh) refresh = load().finally(() => { refresh = null; });
        return refresh;
      },
      purchase: async (id, trigger) => {
        if (get().busy) return 'busy';
        if (ownsProduct(get().ownership, id)) return 'owned';
        const product = get().products[id];
        if (!adapter || !product) { set({ error: 'This purchase is unavailable. Refresh the store and try again.' }); return 'failed'; }
        const event = (name: 'purchase_initiated' | 'purchase_completed' | 'purchase_cancelled' | 'purchase_failed') => trackPurchase({ name, productId: id, trigger, ownership: get().ownership });
        set({ busy: true, error: null, message: null }); event('purchase_initiated');
        try {
          accept(await adapter.purchase(product));
          if (!ownsProduct(get().ownership, id)) throw new Error('Entitlements not granted');
          event('purchase_completed'); set({ message: 'Purchase complete. Your unlock is available across every life.' }); return 'completed';
        } catch (error) {
          if ((error as { userCancelled?: boolean })?.userCancelled) { event('purchase_cancelled'); set({ message: 'Purchase cancelled.' }); return 'cancelled'; }
          event('purchase_failed'); set({ error: 'The purchase could not be verified. Try Restore Purchases before trying again.' }); return 'failed';
        } finally { set({ busy: false }); }
      },
      restore: async trigger => {
        if (get().busy) return false;
        if (!adapter) { set({ error: 'Restore is unavailable. Refresh the store and try again.' }); return false; }
        set({ busy: true, error: null, message: null });
        try {
          accept(await adapter.restore());
          trackPurchase({ name: 'purchase_restored', trigger, ownership: get().ownership });
          set({ message: features.some(feature => get().ownership[feature]) ? 'Purchases restored.' : 'No purchases were found for this store account.' }); return true;
        } catch { set({ error: 'Purchases could not be restored. Please try again.' }); return false; }
        finally { set({ busy: false }); }
      },
      dispose: () => { generation++; unsubscribe?.(); unsubscribe = undefined; adapter = null; },
    };
  });
}
