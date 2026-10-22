import type { World } from '../model';
import { roundRatio } from '../money';

// Shared quote arithmetic without loading asset commands or event resolution.
export function saleQuote(world: World, asset: World['assets'][number], gross?: bigint) {
  const price = gross ?? roundRatio(asset.value * BigInt(asset.kind === 'vehicle' ? 8500 : 9500), 10000n);
  const fee = roundRatio(price * BigInt(asset.kind === 'property' ? 300 : 100), 10000n);
  const debt = world.liabilities.find(item => item.id === asset.mortgageId)?.principal ?? 0n;
  return { price, fee, debt, proceeds: price - fee - debt };
}
