import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Text, View } from 'react-native';
import { Body, Button, Card, Header, Heading, Page } from '../ui/components';
import { useColors } from '../ui/theme';
import { CareerArt } from '../assets/CareerArt';
import { CultArt } from '../assets/CultArt';
import { HealthLegalArt } from '../assets/HealthLegalArt';
import { features, featureProduct, ownsProduct, paywallProducts, products, type PremiumFeature, type ProductId } from './catalog';
import { purchases } from './native';
import { useEntitlement, usePurchases } from './hooks';
import { trackPurchase } from './analytics';

function ProductArt({ id }: { id: ProductId }) {
  const feature = products[id].features[0];
  if (feature === 'cult') return <CultArt id="cult" size={56} />;
  if (feature === 'time_machine') return <HealthLegalArt id="rewind" size={56} />;
  return <CareerArt id={feature === 'god_mode' ? 'royalty' : feature} size={56} />;
}
export function PurchaseOptions({ feature, trigger, onContinue }: { feature?: PremiumFeature; trigger: string; onContinue?: () => void }) {
  const state = usePurchases(s => s), c = useColors();
  const ids: ProductId[] = feature ? paywallProducts(feature) : ['dreams.full_unlock', 'dreams.career_pass', ...features.map(featureProduct)];
  useEffect(() => { void purchases.getState().initialize(); }, []);
  return <>
    <Body>One-time purchases. Permanent access across every life. No subscription.</Body>
    {state.status === 'loading' && <ActivityIndicator accessibilityLabel="Connecting to the store" />}
    {state.error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, fontSize: 15, lineHeight: 22 }}>{state.error}</Text>}
    {state.message && <Body>{state.message}</Body>}
    {ids.map(id => {
      const item = products[id], owned = ownsProduct(state.ownership, id), product = state.products[id];
      return <Card key={id} style={id === 'dreams.full_unlock' ? { borderColor: c.link, borderWidth: 2 } : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}><ProductArt id={id} /><View style={{ flex: 1, minWidth: 0 }}><Heading size={id === 'dreams.full_unlock' ? 23 : 19}>{item.title}</Heading>{id === 'dreams.full_unlock' && <Body muted>Best value · Complete package</Body>}</View></View>
        <Body>{item.description}</Body>
        {/* Store prices must bypass the game's whole-number simulation formatter. */}
        <Text accessibilityLabel={owned ? 'Owned' : product ? 'Price: ' + product.priceString : 'Price unavailable'} style={{ color: c.ink, fontSize: 20, fontWeight: '600' }}>{owned ? 'Owned' : product?.priceString ?? 'Unavailable'}</Text>
        <Button label={owned ? 'Owned' : 'Buy ' + item.title} busy={state.busy} disabled={owned || !product || state.status !== 'ready'} onPress={() => {
          trackPurchase({ name: 'product_selected', productId: id, trigger, ownership: purchases.getState().ownership });
          void purchases.getState().purchase(id, trigger);
        }} />
      </Card>;
    })}
    {feature && state.ownership[feature] && onContinue && <Button label="Continue" onPress={onContinue} disabled={state.busy} />}
    <Button label="Restore Purchases" tone="secondary" busy={state.busy} disabled={state.status !== 'ready'} onPress={() => { void purchases.getState().restore(trigger); }} />
    <Button label="Refresh Store" tone="secondary" busy={state.busy} disabled={state.status === 'loading'} onPress={() => { void purchases.getState().refresh(); }} />
  </>;
}

export function FeaturePaywall({ feature, trigger, onDismiss, onUnlocked }: { feature: PremiumFeature; trigger: string; onDismiss: () => void; onUnlocked: () => void }) {
  const owned = useEntitlement(feature), busy = usePurchases(s => s.busy), continued = useRef(false), unlock = useRef(onUnlocked);
  unlock.current = onUnlocked;
  useEffect(() => { trackPurchase({ name: 'paywall_viewed', feature, trigger, ownership: purchases.getState().ownership }); }, [feature, trigger]);
  useEffect(() => { if (owned && !busy && !continued.current) { continued.current = true; unlock.current(); } }, [owned, busy]);
  const dismiss = () => {
    if (purchases.getState().busy) return;
    trackPurchase({ name: 'paywall_dismissed', feature, trigger, ownership: purchases.getState().ownership }); onDismiss();
  };
  return <Page bottomSafeArea><Header title={products[featureProduct(feature)].title} backDisabled={busy} onBack={dismiss} />
    <Heading size={23}>{products[featureProduct(feature)].title}</Heading><Body>{products[featureProduct(feature)].description}</Body>
    <PurchaseOptions feature={feature} trigger={trigger} onContinue={onUnlocked} />
    <Button label="Maybe Later" tone="secondary" disabled={busy} onPress={dismiss} />
  </Page>;
}

/** Retains a pending UI action locally; stale/unmounted life or route contexts cannot resume it. */
export function usePremiumAction(identity: string) {
  type Pending = { identity: string; feature: PremiumFeature; trigger: string; action: () => void };
  const [pending, setPending] = useState<Pending | null>(null), currentIdentity = useRef(identity), mounted = useRef(true), pendingRef = useRef<Pending | null>(null);
  currentIdentity.current = identity;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; pendingRef.current = null; }; }, []);
  useEffect(() => { if (pendingRef.current?.identity !== identity) { pendingRef.current = null; setPending(null); } }, [identity]);
  const resume = () => {
    const current = pendingRef.current;
    if (!current || !mounted.current || currentIdentity.current !== current.identity || !purchases.getState().ownership[current.feature]) return;
    pendingRef.current = null; setPending(null); current.action();
  };
  return {
    run(feature: PremiumFeature | null, trigger: string, action: () => void) {
      if (!mounted.current || currentIdentity.current !== identity || pendingRef.current) return;
      if (!feature || purchases.getState().ownership[feature]) { action(); return; }
      const next = { identity, feature, trigger, action }; pendingRef.current = next; setPending(next);
    },
    modal: pending && pending.identity === identity ? <Modal visible animationType="slide" accessibilityViewIsModal onRequestClose={() => { if (!purchases.getState().busy) { trackPurchase({ name: 'paywall_dismissed', feature: pending.feature, trigger: pending.trigger, ownership: purchases.getState().ownership }); pendingRef.current = null; setPending(null); } }}><FeaturePaywall feature={pending.feature} trigger={pending.trigger} onDismiss={() => { pendingRef.current = null; setPending(null); }} onUnlocked={resume} /></Modal> : null,
  };
}
