import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Platform } from 'react-native';
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
export function FeaturePaywall({ feature, trigger, onDismiss, onUnlocked, onExplore, inline = false }: { feature: PremiumFeature; trigger: string; onDismiss: () => void; onUnlocked: () => void; onExplore?: () => void; inline?: boolean }) {
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
  return <ShopProductDetailModal id={selected} trigger={trigger} onDismiss={dismiss} onExplore={onExplore} inline={inline} contextual alternatives={paywallProducts(feature)} onSelect={setSelected} />;
}

type Pending = { id: number; identity: string; valid: boolean; feature: PremiumFeature; trigger: string; action: () => void; onExplore?: () => void };
type Closing = { pending: Pending; next: 'unlock' | 'explore' | 'cancel'; dismissed: boolean };

/** Retains a pending UI action locally; stale/unmounted life or route contexts cannot resume it. */
export function usePremiumAction(identity: string) {
  const { reducedMotion } = useFeedback(), busy = usePurchases(s => s.busy);
  const [pending, setPending] = useState<Pending | null>(null), [closing, setClosing] = useState(false), [shownId, setShownId] = useState<number | null>(null);
  const currentIdentity = useRef(identity), mounted = useRef(true), pendingRef = useRef<Pending | null>(null), closingRef = useRef<Closing | null>(null), sequence = useRef(0);
  currentIdentity.current = identity;
  if (pendingRef.current && pendingRef.current.identity !== identity) pendingRef.current.valid = false;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; pendingRef.current = null; closingRef.current = null; }; }, []);
  const complete = useCallback((intent: Pending, dismissed = false) => {
    if (!mounted.current || pendingRef.current !== intent) return;
    // A native dismissal can arrive before the identity-change effect queues
    // cancellation. It still closes this intent without granting continuation.
    const queued = closingRef.current ?? (dismissed ? { pending: intent, next: 'cancel' as const, dismissed: true } : null);
    if (queued?.pending !== intent) return;
    if (dismissed) queued.dismissed = true;
    if (!queued.dismissed || queued.next !== 'cancel' && purchases.getState().busy) return;
    pendingRef.current = null; closingRef.current = null; setPending(null); setClosing(false);
    if (!intent.valid || currentIdentity.current !== intent.identity) return;
    if (queued.next === 'unlock' && hasPremiumAccess(purchases.getState().ownership[intent.feature])) intent.action();
    else if (queued.next === 'explore') intent.onExplore?.();
  }, []);
  const close = useCallback((intent: Pending, next: Closing['next'], stale = false) => {
    if (!mounted.current || pendingRef.current !== intent) return;
    if (closingRef.current) { if (stale) closingRef.current.next = 'cancel'; return; }
    if (!stale && purchases.getState().busy) return;
    if (next === 'unlock' && !hasPremiumAccess(purchases.getState().ownership[intent.feature])) return;
    closingRef.current = { pending: intent, next, dismissed: false }; setClosing(true);
  }, []);
  useEffect(() => {
    const intent = pendingRef.current;
    if (intent && (!intent.valid || intent.identity !== identity)) close(intent, 'cancel', true);
  }, [identity, pending?.valid, close]);
  useEffect(() => { if (!busy && pendingRef.current) complete(pendingRef.current); }, [busy, complete]);
  useEffect(() => {
    if (!pending || !closing || Platform.OS === 'ios') return;
    // Android has no Modal.onDismiss. Wait until visible=false has committed
    // and native frames have processed the removal before opening another UI.
    let active = true, frame = requestAnimationFrame(() => {
      if (active) frame = requestAnimationFrame(() => { if (active) complete(pending, true); });
    });
    return () => { active = false; cancelAnimationFrame(frame); };
  }, [pending, closing, complete]);
  const visible = !!pending && pending.valid && !closing && pending.identity === identity;
  // iOS cannot emit onDismiss for a host that never presented. Even an early
  // close must let this session acknowledge onShow before requesting removal.
  const nativeVisible = visible || Platform.OS === 'ios' && !!pending && shownId !== pending.id;
  return {
    run(feature: PremiumFeature | null, trigger: string, action: () => void, options?: { onExplore?: () => void }) {
      if (!mounted.current || currentIdentity.current !== identity || pendingRef.current) return;
      if (!feature || hasPremiumAccess(purchases.getState().ownership[feature])) { action(); return; }
      if (purchases.getState().busy) return;
      const next = { id: ++sequence.current, identity, valid: true, feature, trigger, action, onExplore: options?.onExplore };
      pendingRef.current = next; setPending(next);
    },
    modal: pending ? <Modal key={pending.id} visible={nativeVisible} transparent presentationStyle="overFullScreen" statusBarTranslucent navigationBarTranslucent={false} animationType={reducedMotion ? 'none' : 'fade'} accessibilityViewIsModal onShow={() => {
      if (mounted.current && pendingRef.current === pending) setShownId(pending.id);
    }} onDismiss={() => complete(pending, true)} onRequestClose={() => {
      if (mounted.current && pendingRef.current === pending && !closingRef.current && !purchases.getState().busy) {
        trackPurchase({ name: 'paywall_dismissed', feature: pending.feature, trigger: pending.trigger, ownership: purchases.getState().ownership }); close(pending, 'cancel');
      }
    }}>{visible && <FeaturePaywall inline feature={pending.feature} trigger={pending.trigger} onDismiss={() => close(pending, 'cancel')} onUnlocked={() => close(pending, 'unlock')} onExplore={pending.onExplore ? () => close(pending, 'explore') : undefined} />}</Modal> : null,
  };
}
