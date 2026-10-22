import type { AssetOffer } from '../game/content/assets';

export type AssetFeature = {
  id: 'beds' | 'baths' | 'area' | 'economy' | 'range' | 'speed' | 'mileage' | 'condition';
  label: string;
  value: string;
};

const number = (value: number) => value.toLocaleString('en-US');

/** Content specs stay outside saves; only condition changes during ownership. */
export function assetFeatures(offer: AssetOffer, condition = offer.condition): AssetFeature[] {
  if (offer.kind === 'property') return [
    ...(offer.bedrooms === undefined ? [] : [{ id: 'beds' as const, label: 'Beds', value: number(offer.bedrooms) }]),
    ...(offer.bathrooms === undefined ? [] : [{ id: 'baths' as const, label: 'Baths', value: number(offer.bathrooms) }]),
    ...(offer.squareFeet === undefined ? [] : [{ id: 'area' as const, label: 'Sq ft', value: number(offer.squareFeet) }]),
  ];
  if (offer.kind !== 'vehicle') return [];
  return [
    ...(offer.rangeMiles !== undefined
      ? [{ id: 'range' as const, label: 'EV range', value: number(offer.rangeMiles) + ' mi' }]
      : offer.fuelEconomyMpg === undefined ? [] : [{ id: 'economy' as const, label: 'MPG (US)', value: number(offer.fuelEconomyMpg) }]),
    ...(offer.topSpeedMph === undefined ? [] : [{ id: 'speed' as const, label: 'Top speed', value: number(offer.topSpeedMph) + ' mph' }]),
    ...(offer.listingMileage === undefined ? [] : [{ id: 'mileage' as const, label: 'Listing mileage', value: number(offer.listingMileage) + ' mi' }]),
    { id: 'condition', label: 'Condition', value: number(condition) + '%' },
  ];
}

export const assetFeatureLabel = (features: readonly AssetFeature[]) => features.map(feature => feature.label + ': ' + feature.value).join('. ');
