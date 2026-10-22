import React from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { AssetOffer } from '../game/content/assets';
import { CatalogArt } from '../assets/CatalogArt';
import { assetFeatureLabel, assetFeatures, type AssetFeature } from './assetFeatureData';
import { useFeedbackPress } from './feedback';
import { useColors } from './theme';

const icons: Record<AssetFeature['id'], React.ComponentProps<typeof Ionicons>['name']> = {
  beds: 'bed-outline', baths: 'water-outline', area: 'resize-outline',
  economy: 'flame-outline', range: 'battery-charging-outline', speed: 'speedometer-outline',
  mileage: 'trail-sign-outline', condition: 'checkmark-circle-outline',
};

/** The same compact specs appear in listings, leases and owned-asset details. */
export function AssetFeatures({ offer, condition, decorative = false }: { offer?: AssetOffer; condition?: number; decorative?: boolean }) {
  const c = useColors(), { width, fontScale } = useWindowDimensions();
  if (!offer) return null;
  const features = assetFeatures(offer, condition);
  if (features.length === 0) return null;
  const columns = fontScale >= 2 ? 1 : fontScale >= 1.4 ? 2 : features.length === 3 ? 3 : width >= 500 ? 4 : 2;
  return <View accessibilityElementsHidden={decorative} importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
    {features.map(feature => <View key={feature.id} accessible={!decorative} accessibilityLabel={assetFeatureLabel([feature])}
      style={{ flexBasis: columns === 1 ? '100%' : columns === 2 ? '46%' : columns === 3 ? '30%' : '22%', flexGrow: 1, minWidth: 0, borderRadius: 8, padding: 8, gap: 3, backgroundColor: c.inset, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 5 }}>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Ionicons name={icons[feature.id]} size={16} color={c.muted} /></View>
        <Text style={{ color: c.ink, fontSize: 13, lineHeight: 18, fontWeight: '600', textAlign: 'center', flexShrink: 1 }}>{feature.value}</Text>
      </View>
      <Text style={{ color: c.muted, fontSize: 11, lineHeight: 16, textAlign: 'center' }}>{feature.label}</Text>
    </View>)}
  </View>;
}

/** Keep the listing and its specifications in one accessible tap target. */
export function AssetListing({ offer, value, subtitle = offer.description, onPress }: { offer: AssetOffer; value: string; subtitle?: string; onPress: () => void }) {
  const c = useColors(), press = useFeedbackPress(onPress);
  return <Pressable accessibilityRole="button" accessibilityLabel={[offer.name, subtitle, value, assetFeatureLabel(assetFeatures(offer))].filter(Boolean).join('. ')} onPress={press}
    style={({ pressed }) => ({ paddingVertical: 14, gap: 10, borderBottomWidth: 1, borderBottomColor: c.line, backgroundColor: pressed ? c.selected : 'transparent' })}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><CatalogArt id={offer.id} size={56} /></View>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text style={{ color: c.ink, fontSize: 16, fontWeight: '600' }}>{offer.name}</Text>
        <Text style={{ color: c.muted, fontSize: 13, lineHeight: 18 }}>{subtitle}</Text>
        <Text style={{ color: c.positiveText, fontSize: 16, lineHeight: 22, fontWeight: '600' }}>{value}</Text>
      </View>
      <Text allowFontScaling={false} accessibilityElementsHidden importantForAccessibility="no" style={{ color: c.muted, fontSize: 25 }}>›</Text>
    </View>
    <AssetFeatures offer={offer} decorative />
  </Pressable>;
}
