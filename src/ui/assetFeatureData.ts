import type { AssetOffer } from '../game/content/assets';

export type AssetFeature = {
  id: 'beds' | 'baths' | 'area' | 'speed' | 'mileage' | 'condition';
  label: string;
  value: string;
  note?: string;
};
const number = (value: number) => value.toLocaleString('en-US');

/** Catalogue specs stay outside saves; condition comes from the owned asset. */
export function assetFeatures(offer: AssetOffer, condition = offer.condition, mileage?: number): AssetFeature[] {
  if (offer.kind === 'property') return [
    ...(offer.bedrooms === undefined ? [] : [{ id: 'beds' as const, label: 'Beds', value: number(offer.bedrooms) }]),
    ...(offer.bathrooms === undefined ? [] : [{ id: 'baths' as const, label: 'Baths', value: number(offer.bathrooms) }]),
    ...(offer.squareFeet === undefined ? [] : [{ id: 'area' as const, label: 'Sq ft', value: number(offer.squareFeet) }]),
  ];
  if (offer.kind !== 'vehicle') return [];
  return [
    { id: 'speed', label: 'Top Speed', value: offer.topSpeedMph === undefined ? 'Unknown' : number(offer.topSpeedMph) + ' mph' },
    { id: 'mileage', label: 'Mileage', value: mileage !== undefined ? number(mileage) + ' mi' : offer.listingMileage === undefined ? 'Unknown' : number(offer.listingMileage) + ' mi', note: mileage === undefined ? 'Listing reading' : 'Recorded use' },
    { id: 'condition', label: 'Condition', value: number(condition) + '%' },
  ];
}
export const assetFeatureLabel = (features: readonly AssetFeature[]) => features.map(feature => feature.label + ': ' + feature.value + (feature.note ? '. ' + feature.note : '')).join('. ');
