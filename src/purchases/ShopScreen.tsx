import React, { useEffect, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Body, Card, Header, Heading, Page } from '../ui/components';
import { lightColors, useColors } from '../ui/theme';
import { useFeedbackPress } from '../ui/feedback';
import { useGame } from '../state/useGame';
import { ownsProduct, productIds, type ProductId } from './catalog';
import { usePurchases } from './hooks';
import { purchases } from './native';
import { trackPurchase } from './analytics';
import { paidCareers, ShopProductArt, shopContent } from './ShopProduct';
import { ShopProductDetailModal, StoreLink, StoreNotice, StorePrice } from './ShopProductDetailModal';

export function ShopScreen({ inGame = false }: { inGame?: boolean }) {
  const busy = usePurchases(s => s.busy);
  useEffect(() => { trackPurchase({ name: 'store_opened', trigger: 'store', ownership: purchases.getState().ownership }); }, []);
  return <Page bottomSafeArea={!inGame}><Header title="Dreams Shop" onBack={() => { if (!purchases.getState().busy) router.back(); }} backDisabled={busy} /><ShopContent trigger="store" /></Page>;
}
export function ShopContent({ trigger }: { trigger: string }) {
  const state = usePurchases(s => s), c = useColors(), { width, fontScale } = useWindowDimensions();
  const activeLife = useGame(s => !!s.world && s.world.birthAcknowledged && !s.world.people[s.world.activePersonId].died);
  const [selected, setSelected] = useState<ProductId | null>(null), compact = width / fontScale < 330, fullOwned = ownsProduct(state.ownership, 'dreams.full_unlock');
  const dark = c.background !== lightColors.background;
  useEffect(() => { void purchases.getState().initialize(); }, []);
  const open = (id: ProductId) => { if (!purchases.getState().busy) setSelected(id); };
  const fullPress = useFeedbackPress(() => open('dreams.full_unlock'), state.busy);
  return <>
    <View accessibilityElementsHidden={!!selected} importantForAccessibility={selected ? 'no-hide-descendants' : 'auto'} style={{ gap: 14 }}>
      <StoreNotice />
      <Pressable accessibilityRole="button" accessibilityLabel={fullOwned ? 'View Full Unlock' : 'Unlock Everything'} accessibilityState={{ disabled: state.busy }} disabled={state.busy} onPress={fullPress} style={{ borderRadius: 18, overflow: 'hidden', opacity: state.busy ? 0.6 : 1 }}>
        <LinearGradient colors={['#AD64EB', '#7863DC', '#609FF4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 14, gap: 12 }}>
          <View style={{ flexDirection: compact ? 'column' : 'row', alignItems: compact ? 'flex-start' : 'center', gap: 10 }}>
            <ShopProductArt id="dreams.full_unlock" size={compact ? 68 : 72} />
            <View style={{ flex: compact ? undefined : 1, gap: 7 }}><View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}><Text style={{ color: '#FFFFFF', fontSize: 27, lineHeight: 34, fontWeight: '800' }}>Full Unlock</Text><View style={{ backgroundColor: '#FFDF62', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 8 }}><Text style={{ color: '#0B1545', fontSize: 11, fontWeight: '800' }}>Best Value</Text></View></View><Text style={{ color: '#FFFFFF', fontSize: 14, lineHeight: 20 }}>{shopContent['dreams.full_unlock'].description}</Text></View>
          </View>
          <View style={{ flexDirection: compact ? 'column' : 'row', alignItems: compact ? 'stretch' : 'center', gap: 12 }}>
            <View style={{ backgroundColor: '#FAF4FF', borderRadius: 30, paddingVertical: 9, paddingHorizontal: 15, alignSelf: compact ? 'flex-start' : undefined }}><StorePrice id="dreams.full_unlock" color="#0B1545" size={23} /></View>
            <View style={{ flex: compact ? undefined : 1, backgroundColor: c.actionBlue, borderColor: '#CEE7FF', borderWidth: 1, borderBottomWidth: 3, borderRadius: 15, minHeight: 48, paddingVertical: 11, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '800', textAlign: 'center' }}>{fullOwned ? 'Owned' : 'Unlock Everything'}</Text></View>
          </View>
        </LinearGradient>
      </Pressable>
      <ShopRow id="dreams.career_pass" onPress={() => open('dreams.career_pass')} background={c.surface} />
      <ShopRow id="dreams.time_machine" onPress={() => open('dreams.time_machine')} background={dark ? '#332D48' : '#F1EAFB'} />
      <ShopRow id="dreams.god_mode" onPress={() => open('dreams.god_mode')} background={dark ? '#403824' : '#FFF5DF'} />
      <View style={{ paddingTop: 7, gap: 4 }}><Heading size={26}>Special Careers</Heading><Body muted>Unlock individual career paths.</Body></View>
      <Card style={{ padding: 0, gap: 0, borderWidth: 1, borderColor: c.line, overflow: 'hidden' }}>
        {paidCareers.map((id, index) => <React.Fragment key={id}>{index > 0 && <View style={{ height: 1, backgroundColor: c.line, marginHorizontal: 12 }} />}<ShopRow id={id} onPress={() => open(id)} career /></React.Fragment>)}
        <View style={{ padding: 10 }}><CareersLink disabled={!activeLife || state.busy} /></View>
      </Card>
      {!activeLife && <Body muted centered>Start a life to explore all career paths.</Body>}
      <View style={{ borderTopWidth: 1, borderTopColor: c.line, paddingTop: 5, gap: 2 }}><View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}><StoreLink label="Restore Purchases" disabled={state.busy || state.status !== 'ready'} onPress={() => { void purchases.getState().restore(trigger); }} /><Body muted>· One-time purchases</Body></View>
        {(state.status === 'unavailable' || !!state.error || productIds.some(id => !state.products[id])) && <StoreLink label="Refresh Store" disabled={state.busy || state.status === 'loading'} onPress={() => { void purchases.getState().refresh(); }} />}
      </View>
    </View>
    {selected && <ShopProductDetailModal id={selected} trigger={trigger} onDismiss={() => setSelected(null)} />}
  </>;
}
function ShopRow({ id, onPress, background, career = false }: { id: ProductId; onPress: () => void; background?: string; career?: boolean }) {
  const state = usePurchases(s => s), c = useColors(), { width, fontScale } = useWindowDimensions(), stacked = width < 360 || fontScale >= 1.3;
  const item = shopContent[id], title = career ? item.title.replace(' Career', '') : item.title, press = useFeedbackPress(onPress, state.busy);
  return <Pressable accessibilityRole="button" accessibilityLabel={'View ' + item.title} accessibilityState={{ disabled: state.busy }} disabled={state.busy} onPress={press} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 12, paddingVertical: career ? 7 : 10, minHeight: career ? 54 : 64, borderRadius: career ? 0 : 16, borderWidth: career ? 0 : 1, borderColor: c.line, backgroundColor: pressed ? c.selected : background ?? c.surface, opacity: state.busy ? 0.5 : 1 })}>
    <ShopProductArt id={id} size={career ? 40 : 46} />
    <View style={{ flex: 1, minWidth: 0, gap: 4 }}><View style={{ flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'flex-start' : 'center', gap: 8 }}><Text style={{ color: c.ink, fontSize: 18, fontWeight: '800', flex: stacked ? undefined : 1 }}>{title}</Text>{background && background !== c.surface ? <View style={{ borderRadius: 24, backgroundColor: c.surface, paddingHorizontal: 10, paddingVertical: 5 }}><StorePrice id={id} size={18} /></View> : <StorePrice id={id} size={18} />}</View>{!career && <Text style={{ color: c.muted, fontSize: 13, lineHeight: 18 }}>{item.description}</Text>}</View>
    <Text allowFontScaling={false} accessibilityElementsHidden importantForAccessibility="no" style={{ color: c.muted, fontSize: 29 }}>›</Text>
  </Pressable>;
}
function CareersLink({ disabled }: { disabled: boolean }) {
  const c = useColors(), press = useFeedbackPress(() => router.push('/special-careers'), disabled);
  return <Pressable accessibilityRole="button" accessibilityLabel="View All Careers" accessibilityState={{ disabled }} disabled={disabled} onPress={press} style={{ minHeight: 48, backgroundColor: c.selected, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, opacity: disabled ? 0.5 : 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}><Text style={{ color: c.link, fontSize: 18, textAlign: 'center', fontWeight: '700', flex: 1 }}>View All Careers</Text><Text allowFontScaling={false} accessibilityElementsHidden importantForAccessibility="no" style={{ color: c.link, fontSize: 25 }}>›</Text></Pressable>;
}
