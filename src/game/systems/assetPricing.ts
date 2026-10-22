import type { World } from '../model';
import type { AssetOffer } from '../content/assets';
import { roundRatio } from '../money';
import { rules } from '../rules';

/** Purchases and rental quotes use the same local-wage and property market. */
export function assetPrice(world: World, offer: AssetOffer): bigint {
  const person = world.people[world.activePersonId];
  const base = rules[person.country].baseWage * BigInt(offer.priceBps);
  return roundRatio(base * BigInt(offer.kind === 'property' ? world.market.propertyIndex : 10000), 100000000n);
}
