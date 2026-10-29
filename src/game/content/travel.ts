import type { CountryCode } from '../countries';
import type { TravelArtId } from '../../assets/travelLayout';
export const destinationIds = ['new-york', 'toronto', 'london', 'sydney', 'paris', 'berlin', 'barcelona', 'rome', 'rio', 'mumbai', 'tokyo', 'cape-town'] as const;
export type DestinationId = typeof destinationIds[number];
type Destination = { country: CountryCode; city: string; art: TravelArtId; setting: 'city' | 'beach'; popular: boolean; description: string };
export const destinations: Record<DestinationId, Destination> = {
  'new-york': { country: 'US', city: 'New York', art: 'new-york', setting: 'city', popular: true, description: 'Big park walks, late dinners and a skyline that refuses to be subtle.' },
  toronto: { country: 'CA', city: 'Toronto', art: 'toronto', setting: 'city', popular: false, description: 'Waterfront paths, neighbourhood markets and more lunch choices than lunch breaks.' },
  london: { country: 'GB', city: 'London', art: 'london', setting: 'city', popular: true, description: 'Museums, crowded theatres and a heroic commitment to talking about the weather.' },
  sydney: { country: 'AU', city: 'Sydney', art: 'sydney', setting: 'beach', popular: true, description: 'Harbour ferries, ocean swims and a convincing case for staying outside.' },
  paris: { country: 'FR', city: 'Paris', art: 'paris', setting: 'city', popular: true, description: 'Riverside evenings, long museum afternoons and one more stop at the bakery.' },
  berlin: { country: 'DE', city: 'Berlin', art: 'berlin', setting: 'city', popular: false, description: 'Street art, layered history and a late night that may become an early morning.' },
  barcelona: { country: 'ES', city: 'Barcelona', art: 'barcelona', setting: 'beach', popular: true, description: 'Colourful architecture, seaside walks and dinners that start when yours usually end.' },
  rome: { country: 'IT', city: 'Rome', art: 'rome', setting: 'city', popular: true, description: 'Ancient streets, lively squares and very strong opinions about your pasta order.' },
  rio: { country: 'BR', city: 'Rio de Janeiro', art: 'rio', setting: 'beach', popular: true, description: 'Mountain views, a busy waterfront and an ambitious new relationship with sunscreen.' },
  mumbai: { country: 'IN', city: 'Mumbai', art: 'mumbai', setting: 'city', popular: false, description: 'Harbour history, restless markets and a street-food wish list with no sensible ending.' },
  tokyo: { country: 'JP', city: 'Tokyo', art: 'tokyo', setting: 'city', popular: true, description: 'Neighbourhood discoveries, bright evening streets and day trips beyond the city.' },
  'cape-town': { country: 'ZA', city: 'Cape Town', art: 'cape-town', setting: 'beach', popular: false, description: 'Mountain trails, coastal views and a waterfront afternoon that gets pleasantly out of hand.' },
};
export const tripFocuses = ['sightseeing', 'rest', 'food'] as const;
export const tripDurations = [1, 3, 12] as const;
