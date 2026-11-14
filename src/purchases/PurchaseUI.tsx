import React, { useEffect, useRef, useState } from 'react';
import { Modal } from 'react-native';
import { featureProduct, paywallProducts, type PremiumFeature } from './catalog';
import { purchases } from './native';
import { useEntitlement, usePurchases } from './hooks';
import { trackPurchase } from './analytics';
import { hasPremiumAccess } from './access';
import { ShopContent } from './ShopScreen';
import { ShopProductDetailModal } from './ShopProductDetailModal';
import { useFeedback } from '../ui/feedback';

export function PurchaseOptions({ trigger }: { trigger: string }) {
  return <ShopContent trigger={trigger} />;
}
export function FeaturePaywall({ feature, trigger, onDismiss, onUnlocked, inline = false }: { feature: PremiumFeature; trigger: string; onDismiss: () => void; onUnlocked: () => void; inline?: boolean }) {
  const owned = useEntitlement(feature), busy = usePurchases(s => s.busy), continued = useRef(false), unlock = useRef(onUnlocked);
  const [selected, setSelected] = useState(featureProduct(feature));
  unlock.current = onUnlocked;
  useEffect(() => { void purchases.getState().initialize(); }, []);
  useEffect(() => { setSelected(featureProduct(feature)); }, [feature]);
  useEffect(() => { trackPurchase({ name: 'paywall_viewed', feature, trigger, ownership: purchases.getState().ownership }); }, [feature, trigger]);
  useEffect(() => { if (owned && !busy && !continued.current) { continued.current = true; unlock.current(); } }, [owned, busy]);
  const dismiss = () => {
    if (purchases.getState().busy) return;
    trackPurchase({ name: 'paywall_dismissed', feature, trigger, ownership: purchases.getState().ownership }); onDismiss();
  };
  return <ShopProductDetailModal id={selected} trigger={trigger} onDismiss={dismiss} inline={inline} contextual alternatives={paywallProducts(feature)} onSelect={setSelected} />;
}

/** Retains a pending UI action locally; stale/unmounted life or route contexts cannot resume it. */
export function usePremiumAction(identity: string) {
  const { reducedMotion } = useFeedback();
  type Pending = { identity: string; feature: PremiumFeature; trigger: string; action: () => void };
  const [pending, setPending] = useState<Pending | null>(null), currentIdentity = useRef(identity), mounted = useRef(true), pendingRef = useRef<Pending | null>(null);
  currentIdentity.current = identity;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; pendingRef.current = null; }; }, []);
  useEffect(() => { if (pendingRef.current?.identity !== identity) { pendingRef.current = null; setPending(null); } }, [identity]);
  const resume = () => {
    const current = pendingRef.current;
    if (!current || !mounted.current || currentIdentity.current !== current.identity || !hasPremiumAccess(purchases.getState().ownership[current.feature])) return;
    pendingRef.current = null; setPending(null); current.action();
  };
  return {
    run(feature: PremiumFeature | null, trigger: string, action: () => void) {
      if (!mounted.current || currentIdentity.current !== identity || pendingRef.current) return;
      if (!feature || hasPremiumAccess(purchases.getState().ownership[feature])) { action(); return; }
      const next = { identity, feature, trigger, action }; pendingRef.current = next; setPending(next);
    },
    modal: pending && pending.identity === identity ? <Modal visible transparent presentationStyle="overFullScreen" statusBarTranslucent navigationBarTranslucent={false} animationType={reducedMotion ? 'none' : 'fade'} accessibilityViewIsModal onRequestClose={() => { if (mounted.current && pendingRef.current === pending && !purchases.getState().busy) { trackPurchase({ name: 'paywall_dismissed', feature: pending.feature, trigger: pending.trigger, ownership: purchases.getState().ownership }); pendingRef.current = null; setPending(null); } }}><FeaturePaywall inline feature={pending.feature} trigger={pending.trigger} onDismiss={() => { pendingRef.current = null; setPending(null); }} onUnlocked={resume} /></Modal> : null,
  };
}
