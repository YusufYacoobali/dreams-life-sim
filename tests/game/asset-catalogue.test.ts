import { assetCatalog } from '../../src/game/content/assets';
import { resolveCommand } from '../../src/game/engine';
import { decodeWorld, encodeWorld, validateWorld } from '../../src/game/model';
import { assetPrice, purchaseQuote } from '../../src/game/systems/assets';
import { accountFor } from '../../src/game/systems/common';
import graduateFixture from '../fixtures/v3-employed-graduate.json';
import propertyOfferFixture from '../fixtures/v4-property-offer.json';
import previousCatalog from '../fixtures/asset-catalogue-before-expansion.json';

test('the expanded catalogue preserves every existing offer, ID, price and condition', () => {
  // Added display specifications may extend offers; every pre-existing field stays exact.
  expect(assetCatalog.slice(0,previousCatalog.length)).toMatchObject(previousCatalog);
  expect(new Set(assetCatalog.map(offer => offer.id)).size).toBe(assetCatalog.length);
  expect(new Set(assetCatalog.map(offer => offer.name)).size).toBe(assetCatalog.length);
  for (const kind of ['property','vehicle'] as const) {
    const offers = assetCatalog.filter(offer => offer.kind === kind);
    const oldPrices = previousCatalog.filter(offer => offer.kind === kind).map(offer => offer.priceBps);
    expect(offers).toHaveLength(kind === 'vehicle' ? 26 : 20);
    if (kind === 'vehicle') { expect(offers.filter(offer => !offer.licenceKind)).toHaveLength(20); expect(offers.filter(offer => offer.licenceKind)).toHaveLength(6); }
    expect(Math.min(...offers.map(offer => offer.priceBps))).toBeLessThan(Math.min(...oldPrices));
    expect(Math.max(...offers.map(offer => offer.priceBps))).toBeGreaterThan(Math.max(...oldPrices));
    for (const offer of offers) {
      expect(Number.isSafeInteger(offer.priceBps) && offer.priceBps > 0).toBe(true);
      expect(Number.isSafeInteger(offer.upkeepBps) && offer.upkeepBps >= 0).toBe(true);
      expect(offer.condition).toBeGreaterThanOrEqual(0);
      expect(offer.condition).toBeLessThanOrEqual(100);
      if (kind === 'property') expect(offer.bedrooms).toBeGreaterThanOrEqual(1);
    }
  }
});

test('every house and vehicle can be bought at its local quote and survives a saved-life round trip', () => {
  for (const offer of assetCatalog.filter(item => item.kind !== 'possession')) {
    let before = decodeWorld(JSON.stringify(graduateFixture));
    if (offer.licenceKind) {
      before = resolveCommand(before, { type: 'enable-lifestyle' });
      if (before.pending?.kind === 'result') before = resolveCommand(before, { type: 'acknowledge', resultId: before.pending.id });
    }
    const account = accountFor(before), funding = 1_000_000_000_000n;
    account.openingCash += funding; account.cash += funding;
    const quote = purchaseQuote(before,offer,'cash');
    const after = resolveCommand(before,{ type:'buy-asset',catalogId:offer.id,financing:'cash',depositBps:10000,termMonths:360,quotedPrice:assetPrice(before,offer) });
    const asset = after.assets.find(item => item.catalogId === offer.id)!;
    expect(asset.name).toBe(offer.name);
    expect(asset.pricePaid).toBe(quote.price);
    expect(accountFor(after).cash).toBe(account.cash-quote.cashRequired);
    const restored = decodeWorld(encodeWorld(after));
    expect(restored.assets).toEqual(after.assets);
    expect(restored.accounts).toEqual(after.accounts);
    expect(restored.random).toEqual(after.random);
    validateWorld(restored);
  }
});

test('an existing purchased-home save retains its physical asset and bound offer', () => {
  const restored = decodeWorld(JSON.stringify(propertyOfferFixture));
  const home = restored.assets.find(asset => asset.catalogId === 'studio')!;
  expect(home.id).toBe(propertyOfferFixture.assets[0].id);
  expect(home.name).toBe(propertyOfferFixture.assets[0].name);
  expect(home.ownerId).toBe(propertyOfferFixture.assets[0].ownerId);
  expect(JSON.parse(encodeWorld(restored)).pending).toEqual(propertyOfferFixture.pending);
  const roundTrip = decodeWorld(encodeWorld(restored));
  expect(roundTrip.assets).toEqual(restored.assets);
  expect(roundTrip.random).toEqual(restored.random);
});
