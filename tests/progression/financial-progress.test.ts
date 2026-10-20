import { decodeSave } from '../../src/persistence/archive';
import { copyWorld, decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { recordDeath, resolveCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { assetCatalog } from '../../src/game/content/assets';
import { assetPrice } from '../../src/game/systems/assets';
import { accountFor, post } from '../../src/game/systems/common';
import { investmentQuote } from '../../src/game/systems/markets';
import { lifeProgress, progressFacts } from '../../src/progression/progress';
import { lifeStoryWorld } from '../support/lifeStory';
import graduate from '../fixtures/v3-employed-graduate.json';
import propertyOffer from '../fixtures/v4-property-offer.json';
import family from '../fixtures/v7-history-archive.json';

function finish(input: World, acceptSale = false) {
  let world = input, guard = 0;
  while ((world.pending || world.annual) && !world.people[world.activePersonId].died && guard++ < 200) {
    const command: GameCommand = world.pending?.kind === 'decision'
      ? { type: 'choose', eventId: world.pending.id, choiceId: world.pending.choices.find(choice => !choiceUnavailable(world, choice) && (acceptSale || !choice.effects.some(effect => effect.kind === 'asset-sale')))!.id }
      : world.pending ? { type: 'acknowledge', resultId: world.pending.id } : { type: 'resume' };
    world = resolveCommand(world, command, true);
  }
  expect(guard).toBeLessThan(200); return world;
}
const act = (world: World, command: GameCommand, acceptSale = false) => finish(resolveCommand(world, command, true), acceptSale);
function buyHome(world: World, financing: 'cash' | 'mortgage' = 'mortgage') {
  const offer = assetCatalog.find(item => item.id === 'studio')!;
  return act(world, { type: 'buy-asset', catalogId: offer.id, financing, depositBps: 2000, termMonths: 360, quotedPrice: assetPrice(world, offer) });
}
function buyFund(world: World, instrumentId: 'GROVE' | 'LUMEN') {
  return act(world, { type: 'buy-investment', instrumentId, quantity: 2n, quotedMinor: investmentQuote(world, instrumentId, 2n).value });
}
const financial = (world: World, personId = world.activePersonId) => {
  const { investmentPurchases, dividendMonths, purchasedProperties, repaidMortgages } = progressFacts(world, personId)!;
  return { investmentPurchases, dividendMonths, purchasedProperties, repaidMortgages };
};

test('real paid investments and twelve distinct dividend months remain earned after all holdings are sold, without borrowing other people’s receipts', () => {
  const original = decodeWorld(JSON.stringify(graduate)); let world = buyFund(buyFund(original, 'GROVE'), 'LUMEN');
  expect(financial(original)).toEqual({ investmentPurchases: 0, dividendMonths: 0, purchasedProperties: 0, repaidMortgages: 0 });
  expect(financial(world)).toEqual({ investmentPurchases: 2, dividendMonths: 0, purchasedProperties: 0, repaidMortgages: 0 });
  expect(lifeProgress(world)?.achievements.find(item => item.id === 'first-investment')?.complete).toBe(true);
  world = act(world, { type: 'advance' });
  const receipts = world.ledger.filter(row => row.personId === world.activePersonId && row.category === 'dividend');
  expect(receipts).toHaveLength(8); expect(financial(world).dividendMonths).toBe(4);
  expect(lifeProgress(world)?.achievements.find(item => item.id === 'first-dividend')?.complete).toBe(true);
  expect(lifeProgress(world)?.challenges.find(item => item.id === 'patient-investor')?.complete).toBe(false);
  for (let year = 0; year < 2; year++) world = act(world, { type: 'advance' });
  expect(financial(world).dividendMonths).toBe(12);
  expect(lifeProgress(world)?.challenges.find(item => item.id === 'patient-investor')).toMatchObject({ complete: true, percent: 100 });
  for (const holding of world.holdings.filter(item => item.ownerId === world.activePersonId && item.quantity > 0n)) world = act(world, { type: 'sell-investment', holdingId: holding.id, quantity: holding.quantity, quotedMinor: investmentQuote(world, holding.instrumentId, holding.quantity).value });
  expect(world.holdings.every(item => item.quantity === 0n)).toBe(true);
  expect(financial(world)).toEqual({ investmentPurchases: 2, dividendMonths: 12, purchasedProperties: 0, repaidMortgages: 0 });
  const encoded = encodeWorld(world), observed = lifeProgress(world);
  for (let read = 0; read < 5; read++) expect(lifeProgress(world)).toEqual(observed);
  expect(encodeWorld(world)).toBe(encoded); expect(lifeProgress(decodeWorld(encoded))).toEqual(observed);
  expect(financial(world, 'person_parent1')).toEqual({ investmentPurchases: 0, dividendMonths: 0, purchasedProperties: 0, repaidMortgages: 0 });
});

test('an actual mortgage purchase needs real principal and interest repayments; the earned payoff remains after a later property sale', () => {
  let world = buyHome(decodeWorld(JSON.stringify(graduate))); const assetId = world.assets.at(-1)!.id, mortgageId = world.assets.at(-1)!.mortgageId!;
  expect(financial(world)).toEqual({ investmentPurchases: 0, dividendMonths: 0, purchasedProperties: 1, repaidMortgages: 0 });
  expect(lifeProgress(world)?.achievements.find(item => item.id === 'property-purchase')?.complete).toBe(true);
  world = act(world, { type: 'repay', liabilityId: mortgageId, amount: 1000n }); expect(financial(world).repaidMortgages).toBe(0);
  let years = 0;
  while (accountFor(world).cash < world.liabilities.find(debt => debt.id === mortgageId)!.principal && years++ < 8) world = act(world, { type: 'advance' });
  expect(years).toBeLessThan(8); expect(world.people[world.activePersonId].died).toBeNull();
  expect(world.ledger.some(row => row.liabilityId === mortgageId && row.category === 'interest')).toBe(true);
  const remaining = world.liabilities.find(debt => debt.id === mortgageId)!.principal;
  world = act(world, { type: 'repay', liabilityId: mortgageId, amount: remaining });
  expect(financial(world).repaidMortgages).toBe(1);
  expect(lifeProgress(world)?.challenges.find(item => item.id === 'paid-for-property')).toMatchObject({ complete: true, percent: 100 });
  const paid = encodeWorld(world), asset = world.assets.find(item => item.id === assetId)!;
  world = act(world, { type: 'list-property', assetId, askingPrice: asset.value });
  world = act(world, { type: 'advance' }, true);
  expect(world.assets.find(item => item.id === assetId)?.ownerId).toBeNull();
  expect(financial(world)).toMatchObject({ purchasedProperties: 1, repaidMortgages: 1 });
  expect(financial(decodeWorld(encodeWorld(world)))).toEqual(financial(world));
  expect(financial(decodeWorld(paid))).toMatchObject({ purchasedProperties: 1, repaidMortgages: 1 });
}, 60000);

test('a genuine legacy purchase is evidenced by its original transaction, but settling its mortgage from sale proceeds is not a personal payoff', () => {
  const original = decodeWorld(JSON.stringify(propertyOffer)), assetId = original.assets[0].id, mortgageId = original.assets[0].mortgageId!;
  expect(original.assets[0].ownershipSource).toBe('legacy');
  expect(financial(original)).toMatchObject({ investmentPurchases: 1, dividendMonths: 1, purchasedProperties: 1, repaidMortgages: 0 });
  const sold = finish(original, true);
  expect(sold.assets.find(item => item.id === assetId)?.ownerId).toBeNull(); expect(sold.liabilities.find(item => item.id === mortgageId)?.principal).toBe(0n);
  expect(sold.ledger.findLast(row => row.liabilityId === mortgageId)).toMatchObject({ category: 'repayment', description: 'Mortgage settled from sale' });
  expect(financial(sold)).toMatchObject({ purchasedProperties: 1, repaidMortgages: 0 });
  expect(lifeProgress(sold)?.achievements.find(item => item.id === 'mortgage-repaid')?.complete).toBe(false);
});

test('an actual refinance closes its previous mortgage without earning a payoff', () => {
  let world = finish(decodeWorld(JSON.stringify(propertyOffer))); const asset = world.assets[0], oldId = asset.mortgageId!, principal = world.liabilities.find(item => item.id === oldId)!.principal;
  world = act(world, { type: 'refinance', assetId: asset.id, principal, termMonths: 360 });
  expect(world.liabilities.find(item => item.id === oldId)?.principal).toBe(0n); expect(world.assets[0].mortgageId).not.toBe(oldId);
  expect(world.ledger.findLast(row => row.liabilityId === oldId)).toMatchObject({ category: 'repayment', description: 'Previous mortgage settled' });
  expect(financial(world)).toMatchObject({ purchasedProperties: 1, repaidMortgages: 0 });
});

test('actual estate settlement cannot turn debt closure or inherited ownership into the heir’s purchase or payoff', () => {
  let world = buyHome(finish(decodeSave(JSON.stringify(family)).world)); const parentId = world.activePersonId, before = financial(world), assetId = world.assets.at(-1)!.id, mortgageId = world.assets.at(-1)!.mortgageId!;
  world = copyWorld(world); recordDeath(world, parentId, 'explicit estate identity scenario'); validateWorld(world);
  expect(world.liabilities.find(item => item.id === mortgageId)?.principal).toBe(0n);
  expect(world.ledger.findLast(row => row.liabilityId === mortgageId)).toMatchObject({ category: 'estate-debt-close' });
  expect(financial(world, parentId)).toEqual(before); expect(financial(world, parentId).repaidMortgages).toBe(0);
  for (const heir of world.estates.at(-1)!.distributions) expect(financial(world, heir.personId)).toMatchObject({ purchasedProperties: 0, repaidMortgages: 0 });
  expect(world.assets.some(item => item.id === assetId)).toBe(true);
});

test('a real bequest preserves the buyer’s purchase history and gives its heir no purchase credit', () => {
  // Existing qualified family setup, not a native/natural birth-to-investor claim.
  let world = finish(lifeStoryWorld()); const parentId = world.activePersonId, asset = world.assets.find(item => item.kind === 'property')!;
  const child = world.relationships.filter(item => item.from === parentId && item.roles.includes('parent')).map(item => world.people[item.to]).find(item => world.date.year - item.born.year >= 18)!;
  const executor = Object.values(world.people).find(item => !item.died && item.id !== parentId && item.id !== child.id && world.date.year - item.born.year >= 18)!;
  world = act(world, { type: 'save-will', executorId: executor.id, shares: [{ personId: child.id, bps: 10000 }], bequests: [{ personId: child.id, assetId: asset.id }] });
  world = copyWorld(world); recordDeath(world, parentId, 'explicit property bequest scenario'); validateWorld(world);
  expect(world.assets.find(item => item.id === asset.id)).toMatchObject({ ownerId: child.id, ownershipSource: 'inheritance' });
  expect(financial(world, parentId).purchasedProperties).toBe(1); expect(financial(world, child.id).purchasedProperties).toBe(0);
  world = finish(resolveCommand(world, { type: 'continue-child', personId: child.id }, true));
  expect(financial(world)).toMatchObject({ investmentPurchases: 0, purchasedProperties: 0, repaidMortgages: 0 });
});

test('gifted/legacy ownership and unrelated transfer or sale receipts cannot manufacture a paid purchase or dividend', () => {
  // Deliberate validated identity/ledger traps around an actual purchased home.
  const world = copyWorld(buyHome(decodeWorld(JSON.stringify(graduate)))), buyerId = world.activePersonId, recipient = world.people.person_parent1, asset = world.assets.at(-1)!;
  for (const household of world.households) if (household.homeAssetId === asset.id) household.homeAssetId = null;
  const debt = world.liabilities.find(item => item.id === asset.mortgageId)!;
  post(world, 0n, -debt.principal, 'estate-debt-close', 'Explicit non-repayment closure', debt.id); debt.principal = 0n; debt.assetId = null; debt.monthlyPayment = 0n; debt.remainingMonths = 0;
  asset.ownerId = recipient.id; asset.primaryHome = false; asset.mortgageId = null; asset.ownershipSource = 'gift';
  post(world, 100n, 0n, 'inheritance', 'Explicit inherited cash', null, recipient);
  post(world, 100n, 0n, 'investment-sale', 'Explicit sale proceeds', null, recipient);
  post(world, 100n, 0n, 'exchange', 'Explicit exchange proceeds', null, recipient);
  post(world, 100n, 0n, 'investment', 'Explicit wrong-sign purchase', null, recipient);
  validateWorld(world);
  const encoded = encodeWorld(world);
  expect(financial(world, recipient.id)).toEqual({ investmentPurchases: 0, dividendMonths: 0, purchasedProperties: 0, repaidMortgages: 0 });
  expect(financial(world, buyerId)).toMatchObject({ purchasedProperties: 1, repaidMortgages: 0 });
  expect(encodeWorld(world)).toBe(encoded);
});
