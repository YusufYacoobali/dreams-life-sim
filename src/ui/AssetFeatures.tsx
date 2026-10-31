import React from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { AssetOffer } from '../game/content/assets';
import { CatalogArt } from '../assets/CatalogArt';
import { assetFeatureLabel, assetFeatures, type AssetFeature } from './assetFeatureData';
import { useFeedbackPress } from './feedback';
import { useColors } from './theme';
import { DisplayText as Text, displayText } from './DisplayText';

const icons: Record<AssetFeature['id'], React.ComponentProps<typeof Ionicons>['name']> = {
  beds: 'bed-outline', baths: 'water-outline', area: 'resize-outline',
  speed: 'speedometer-outline', mileage: 'trail-sign-outline', condition: 'checkmark-circle-outline',
};

/** Three equal specs share one row at ordinary sizes; large text can grow freely. */
export function AssetFeatures({ offer, condition, mileage, decorative = false }: { offer?: AssetOffer; condition?: number; mileage?: number; decorative?: boolean }) {
  const c = useColors(), { fontScale } = useWindowDimensions();
  if (!offer) return null;
  const features = assetFeatures(offer, condition, mileage);
  if (!features.length) return null;
  const vehicle = offer.kind === 'vehicle', stacked = fontScale >= (vehicle ? 1.6 : 2);
  const propertyColumns = fontScale >= 1.4 ? 2 : 3;
  return <View testID="asset-feature-row" accessibilityElementsHidden={decorative} importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'} style={{ flexDirection: stacked ? 'column' : 'row', flexWrap: vehicle ? 'nowrap' : 'wrap', gap: 6, alignItems: 'stretch' }}>
    {features.map(feature => <View key={feature.id} testID={'asset-feature-' + feature.id} accessible={!decorative} accessibilityLabel={displayText(assetFeatureLabel([feature]))}
      style={{ flex: vehicle && !stacked ? 1 : undefined, flexBasis: vehicle ? undefined : stacked ? '100%' : propertyColumns === 2 ? '46%' : '30%', flexGrow: vehicle ? undefined : 1, minWidth: 0, borderRadius: 8, paddingVertical: 9, paddingHorizontal: vehicle ? 5 : 8, gap: 3, backgroundColor: c.inset, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ flexDirection: vehicle ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', flexWrap: vehicle ? 'nowrap' : 'wrap', gap: 5, maxWidth: '100%' }}>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Ionicons name={icons[feature.id]} size={16} color={c.muted} /></View>
        <Text style={{ color: c.ink, fontSize: 13, lineHeight: 18, fontWeight: '600', textAlign: 'center', flexShrink: 1 }}>{feature.value}</Text>
      </View>
      <Text style={{ color: c.muted, fontSize: 11, lineHeight: 16, textAlign: 'center', alignSelf: 'stretch' }}>{feature.label}</Text>
      {feature.note && <Text style={{ color: c.muted, fontSize: 10, lineHeight: 14, textAlign: 'center', alignSelf: 'stretch' }}>{feature.note}</Text>}
    </View>)}
  </View>;
}

/** Artwork, prices and specifications remain one accessible catalogue entry. */
export function AssetListing({ offer, value, secondaryValue, subtitle = offer.description, onPress }: { offer: AssetOffer; value: string; secondaryValue?: string; subtitle?: string; onPress: () => void }) {
  const c = useColors(), press = useFeedbackPress(onPress);
  return <Pressable accessibilityRole="button" accessibilityLabel={displayText([offer.name, subtitle, value, secondaryValue, assetFeatureLabel(assetFeatures(offer))].filter(Boolean).join('. '))} onPress={press}
    style={({ pressed }) => ({ paddingVertical: 14, gap: 10, borderBottomWidth: 1, borderBottomColor: c.line, backgroundColor: pressed ? c.selected : 'transparent' })}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><CatalogArt id={offer.id} size={56} /></View>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text style={{ color: c.ink, fontSize: 16, fontWeight: '600' }}>{offer.name}</Text>
        <Text style={{ color: c.muted, fontSize: 13, lineHeight: 18 }}>{subtitle}</Text>
        <Text style={{ color: c.positiveText, fontSize: 16, lineHeight: 22, fontWeight: '600' }}>{value}</Text>
        {secondaryValue && <Text style={{ color: c.link, fontSize: 14, lineHeight: 20, fontWeight: '600' }}>{secondaryValue}</Text>}
      </View>
      <Text allowFontScaling={false} accessibilityElementsHidden importantForAccessibility="no" style={{ color: c.muted, fontSize: 25 }}>›</Text>
    </View>
    <AssetFeatures offer={offer} decorative />
  </Pressable>;
}
