import React, { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Heading } from '../ui/components';
import { lightColors, useColors } from '../ui/theme';
import { useFeedback, useFeedbackPress } from '../ui/feedback';
import { modalReturnTarget, restoreModalFocus } from '../ui/modalFocus';
import { ownsProduct, products, type ProductId } from './catalog';
import { purchases } from './native';
import { usePurchases } from './hooks';
import { trackPurchase } from './analytics';
import { ShopProductArt, shopContent } from './ShopProduct';

export function StoreNotice() {
  const state = usePurchases(s => s), c = useColors();
  return <>
    {state.status === 'loading' && <ActivityIndicator accessibilityLabel="Connecting to the store" />}
    {state.error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, fontSize: 15, lineHeight: 22 }}>{state.error}</Text>}
    {state.message && <Body>{state.message}</Body>}
  </>;
}
export function StorePrice({ id, color, size = 19 }: { id: ProductId; color?: string; size?: number }) {
  const state = usePurchases(s => s), c = useColors(), owned = ownsProduct(state.ownership, id), price = state.products[id]?.priceString;
  // Store strings must bypass the game's whole-number simulation formatter.
  return <Text accessibilityLabel={owned ? 'Owned' : price ? 'Price: ' + price : 'Price unavailable'} style={{ color: color ?? c.ink, fontSize: size, fontWeight: '800' }}>{owned ? 'Owned' : price ?? (state.status === 'loading' ? 'Loading…' : 'Unavailable')}</Text>;
}
export function StoreLink({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  const c = useColors(), press = useFeedbackPress(onPress, disabled);
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={press} style={{ minHeight: 44, paddingVertical: 10, paddingHorizontal: 8, justifyContent: 'center', alignItems: 'center', opacity: disabled ? 0.5 : 1 }}><Text style={{ color: c.link, fontSize: 15, textAlign: 'center', fontWeight: '600' }}>{label}</Text></Pressable>;
}
type Props = { id: ProductId; trigger: string; onDismiss: () => void; inline?: boolean; alternatives?: readonly ProductId[]; onSelect?: (id: ProductId) => void; contextual?: boolean };
export function ShopProductDetailModal(props: Props) {
  const { inline = false } = props, { reducedMotion } = useFeedback();
  const target = useRef(modalReturnTarget());
  const session = useMemo(() => ({ live: true }), [props.id]), current = useRef(session); current.current = session;
  useEffect(() => { session.live = true; return () => { session.live = false; }; }, [session]);
  const dismiss = () => { if (session.live && current.current === session && !purchases.getState().busy) { session.live = false; props.onDismiss(); } };
  useEffect(() => () => { restoreModalFocus(target.current); }, []);
  const content = <Detail key={props.id} {...props} session={session} onDismiss={dismiss} />;
  // Contextual paywalls already own one native Modal; only replace its content.
  return inline ? content : <Modal visible transparent presentationStyle="overFullScreen" statusBarTranslucent navigationBarTranslucent={false} animationType={reducedMotion ? 'none' : 'fade'} accessibilityViewIsModal onRequestClose={dismiss}>{content}</Modal>;
}
function Detail({ id, trigger, onDismiss, alternatives, onSelect, contextual, session }: Props & { session: { live: boolean } }) {
  const state = usePurchases(s => s), c = useColors(), insets = useSafeAreaInsets(), { height, fontScale } = useWindowDimensions();
  const item = shopContent[id], owned = ownsProduct(state.ownership, id), product = state.products[id], full = id === 'dreams.full_unlock';
  const dark = c.background !== lightColors.background, closed = useRef(false), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const live = () => session.live && mounted.current && !closed.current && !purchases.getState().busy;
  const dismiss = () => { if (!live()) return; closed.current = true; onDismiss(); };
  const buy = useFeedbackPress(() => {
    const current = purchases.getState();
    if (!live() || ownsProduct(current.ownership, id) || current.status !== 'ready' || !current.products[id]) return false;
    trackPurchase({ name: 'product_selected', productId: id, trigger, ownership: current.ownership });
    void current.purchase(id, trigger);
  }, state.busy || owned || !product || state.status !== 'ready', true);
  const close = useFeedbackPress(dismiss, state.busy);
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16, backgroundColor: c.overlay }}>
    <View accessibilityViewIsModal style={{ width: '100%', maxWidth: 520, maxHeight: Math.max(120, height - insets.top - insets.bottom - 32), borderRadius: 24, backgroundColor: c.surface, overflow: 'hidden', borderWidth: 1, borderColor: c.line }}>
      <View style={{ alignItems: 'flex-end', backgroundColor: full ? dark ? '#3D315D' : '#EEE3FF' : c.surface, paddingHorizontal: 10, paddingTop: 4 }}><Pressable accessibilityRole="button" accessibilityLabel="Close product details" accessibilityState={{ disabled: state.busy }} disabled={state.busy} onPress={close} style={{ minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center', opacity: state.busy ? 0.5 : 1 }}><Ionicons name="close" size={29} color={c.ink} /></Pressable></View>
      <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ paddingBottom: 8 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingBottom: 22, borderBottomLeftRadius: full ? 24 : 0, borderBottomRightRadius: full ? 24 : 0, backgroundColor: full ? dark ? '#3D315D' : '#EEE3FF' : c.surface }}>
          <ShopProductArt id={id} size={fontScale >= 1.6 ? 80 : 108} /><Heading size={full ? 32 : 28} centered>{item.title}</Heading><Body centered muted={!full}>{item.description}</Body>
        </View>
        <View style={{ marginHorizontal: 20, paddingTop: 17, gap: 18, borderTopWidth: full ? 0 : 1, borderTopColor: c.line }}>
          {item.benefits.map((benefit, index) => <View key={benefit} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            {full && <ShopProductArt id={(['dreams.career_pass', 'dreams.god_mode', 'dreams.time_machine'] as const)[index]} size={45} />}
            {!full && <Ionicons name="checkmark-circle" size={27} color={c.green} accessibilityElementsHidden importantForAccessibility="no" />}
            <View style={{ flex: 1, gap: 3 }}><Text style={{ color: c.ink, fontSize: full ? 19 : 16, fontWeight: '700', lineHeight: full ? 25 : 23 }}>{benefit}</Text>{full && <Body muted>{index === 0 ? 'Every premium career, in one bundle.' : shopContent[index === 1 ? 'dreams.god_mode' : 'dreams.time_machine'].description}</Body>}</View>
            {full && <Ionicons name="checkmark-circle" size={30} color={c.green} accessibilityElementsHidden importantForAccessibility="no" />}
          </View>)}
          <StoreNotice />
          {!!alternatives?.length && <View style={{ borderTopWidth: 1, borderTopColor: c.line, paddingTop: 8, gap: 2 }}><Body muted>Also available</Body>{alternatives.filter(other => other !== id).map(other => <Pressable key={other} accessibilityRole="button" accessibilityLabel={'View ' + shopContent[other].title} disabled={state.busy} accessibilityState={{ disabled: state.busy }} onPress={() => { if (!live() || !onSelect) return; closed.current = true; onSelect(other); }} style={{ minHeight: 44, paddingVertical: 9, gap: 4 }}><Text style={{ color: c.link, fontSize: 16, fontWeight: '600' }}>{shopContent[other].title} ›</Text><StorePrice id={other} size={16} /></Pressable>)}</View>}
          {(state.status === 'unavailable' || !!state.error || !product) && <StoreLink label="Refresh Store" disabled={state.busy || state.status === 'loading'} onPress={() => { if (live()) void purchases.getState().refresh(); }} />}
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16, gap: 12 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={owned ? 'Owned' : 'Buy ' + products[id].title} accessibilityValue={product && !owned ? { text: product.priceString } : undefined} accessibilityState={{ disabled: owned || state.busy || !product || state.status !== 'ready', busy: state.busy }} disabled={owned || state.busy || !product || state.status !== 'ready'} onPress={buy} style={({ pressed }) => ({ minHeight: 54, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 16, borderBottomWidth: 3, borderBottomColor: full ? '#591891' : c.actionBluePressed, backgroundColor: full ? pressed ? '#6E21B2' : '#8231C7' : pressed ? c.actionBluePressed : c.actionBlue, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, opacity: owned || state.busy || !product || state.status !== 'ready' ? 0.5 : 1 })}>
          {state.busy && <ActivityIndicator color="#FFFFFF" accessibilityLabel="Processing purchase" />}<Text style={{ color: '#FFFFFF', fontSize: 21, fontWeight: '800', textAlign: 'center', flexShrink: 1 }}>{owned ? 'Owned' : product ? 'Unlock for ' + product.priceString : 'Price unavailable'}</Text>
        </Pressable>
        <Body centered muted>One-time purchase · Keep forever</Body>
        {contextual && <View><StoreLink label="Restore Purchases" disabled={state.busy || state.status !== 'ready'} onPress={() => { if (live()) void purchases.getState().restore(trigger); }} /><StoreLink label="Maybe Later" disabled={state.busy} onPress={dismiss} /></View>}
      </View>
    </View>
  </View>;
}
