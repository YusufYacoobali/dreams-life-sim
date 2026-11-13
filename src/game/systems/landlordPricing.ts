import type { World } from '../model';
import type { CountryCode } from '../countries';
import { rules } from '../rules';
export const askingRent = (asset: World['assets'][number]) => asset.value * 6n / 1200n || 1n;
export function rentalPriceReason(asset: World['assets'][number], rent: bigint) {
  const market = askingRent(asset);
  if (rent < market / 2n || rent > market * 3n / 2n || rent <= 0n) return 'Choose rent between 50% and 150% of the current market estimate';
}
export const tenantCheckFee = (country: CountryCode) => rules[country].baseWage / 1000n || 1n;
export const tenancyReviewFee = (country: CountryCode) => rules[country].baseWage / 400n || 1n;
