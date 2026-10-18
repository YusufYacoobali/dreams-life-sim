import { z } from 'zod';
import { ageOn, fullName, World } from '../model';
import { assetCatalog, AssetOffer } from '../content/assets';
import { rules } from '../rules';
import { formatMoney, roundRatio } from '../money';
import { IneligibleAction } from '../errors';
import { RuntimeEffectRow } from '../runtime';
import { accountFor, active, bounded, charge, draw, fact, post, result } from './common';
import { fxMoney } from './markets';

export type OwnedAsset = World['assets'][number];
const termSchema = z.union([z.literal(120), z.literal(240), z.literal(360)]);
export const assetCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('buy-asset'), catalogId: z.string(), financing: z.enum(['cash', 'mortgage']), depositBps: z.number().int().min(2000).max(10000), termMonths: termSchema, quotedPrice: z.bigint().positive() }),
  z.object({ type: z.literal('sell-asset'), assetId: z.string(), quotedPrice: z.bigint().nonnegative() }),
  z.object({ type: z.literal('list-property'), assetId: z.string(), askingPrice: z.bigint().positive() }),
  z.object({ type: z.literal('cancel-listing'), assetId: z.string() }),
  z.object({ type: z.literal('rent-property'), assetId: z.string() }),
  z.object({ type: z.literal('stop-renting'), assetId: z.string() }),
  z.object({ type: z.literal('move-in'), assetId: z.string() }),
  z.object({ type: z.literal('renovate'), assetId: z.string() }),
  z.object({ type: z.literal('insure'), assetId: z.string(), enabled: z.boolean() }),
  z.object({ type: z.literal('refinance'), assetId: z.string(), principal: z.bigint().positive(), termMonths: termSchema }),
]);
export type AssetCommand = z.infer<typeof assetCommandSchema>;
export const absoluteMonth = (world: World) => world.date.year * 12 + world.date.month - 1;
export const mortgageInterestBps = (world: World) => 450 + Math.floor(rules[active(world).country].personalInterestBps / 10);
export const refinanceFee = (principal: bigint) => roundRatio(principal * 100n, 10000n);
export function assetPrice(world: World, offer: AssetOffer): bigint {
  const base = rules[active(world).country].baseWage * BigInt(offer.priceBps);
  return roundRatio(base * BigInt(offer.kind === 'property' ? world.market.propertyIndex : 10000), 100000000n);
}
export function mortgagePayment(principal: bigint, annualBps: number, months: number): bigint {
  if (principal <= 0n || !Number.isInteger(months) || months < 1 || months > 600 || annualBps < 0) throw new Error('Invalid mortgage terms');
  if (annualBps === 0) return (principal + BigInt(months - 1)) / BigInt(months);
  const scale = 120000n; const rate = BigInt(annualBps);
  const factor = (scale + rate) ** BigInt(months); const denominator = scale * (factor - scale ** BigInt(months));
  const numerator = principal * rate * factor;
  return (numerator + denominator - 1n) / denominator;
}
export function purchaseQuote(world: World, offer: AssetOffer, financing: 'cash' | 'mortgage', depositBps = 2000, termMonths = 360) {
  const price = assetPrice(world, offer); const fee = offer.kind === 'property' ? roundRatio(price * 200n, 10000n) : 0n;
  const deposit = financing === 'cash' ? price : roundRatio(price * BigInt(depositBps), 10000n);
  const principal = price - deposit;
  const interestBps = mortgageInterestBps(world);
  return { price, fee, deposit, principal, cashRequired: deposit + fee, interestBps, payment: principal ? mortgagePayment(principal, interestBps, termMonths) : 0n, termMonths };
}
function debtCapacityReason(world: World, payment: bigint, omitDebtId?: string): string | undefined {
  const person = active(world); const account = accountFor(world);
  const income = (person.employment?.annualPay ?? 0n) + person.finance.pensionAnnual;
  if (!income) return 'A job or recorded pension is required';
  const existing = world.liabilities.filter(debt => debt.ownerId === person.id && debt.id !== omitDebtId && debt.principal > 0n).reduce((sum, debt) => sum + fxMoney(world, { minor: debt.monthlyPayment || debt.principal / 120n, currency: debt.currency }, account.currency).minor, 0n);
  if ((payment + existing) * 120n > income * 4n) return 'Total debt payments exceed 40% of your monthly gross income';
}
export function purchaseReason(world: World, offer: AssetOffer, financing: 'cash' | 'mortgage', depositBps = 2000, termMonths = 360): string | undefined {
  const person = active(world);
  if (ageOn(person, world.date) < rules[person.country].adultAge) return 'Purchases are available to adults';
  if (financing === 'mortgage' && offer.kind !== 'property') return 'Mortgages are only available for property';
  const quote = purchaseQuote(world, offer, financing, depositBps, termMonths);
  if (accountFor(world).cash < quote.cashRequired) return 'Your balance cannot cover the upfront payment';
  if (quote.principal) return debtCapacityReason(world, quote.payment);
}
export function ownedAsset(world: World, id: string): OwnedAsset {
  const asset = world.assets.find(candidate => candidate.id === id && candidate.ownerId === world.activePersonId);
  if (!asset) throw new IneligibleAction('You do not own this asset');
  return asset;
}
export function saleQuote(world: World, asset: OwnedAsset, gross?: bigint) {
  const price = gross ?? roundRatio(asset.value * BigInt(asset.kind === 'vehicle' ? 8500 : 9500), 10000n);
  const fee = roundRatio(price * BigInt(asset.kind === 'property' ? 300 : 100), 10000n);
  const debt = world.liabilities.find(item => item.id === asset.mortgageId)?.principal ?? 0n;
  return { price, fee, debt, proceeds: price - fee - debt };
}
export function completeAssetSale(world: World, assetId: string, price: bigint, foreclosure = false, person = active(world)): RuntimeEffectRow[] {
  const asset = world.assets.find(item => item.id === assetId && item.ownerId === person.id);
  if (!asset) throw new IneligibleAction('You do not own this asset');
  const quote = saleQuote(world, asset, price); const account = accountFor(world, person, asset.currency);
  if (!foreclosure && account.cash + quote.proceeds < 0n) throw new IneligibleAction('This sale would not cover the mortgage and fees');
  post(world, price, 0n, 'asset-sale', 'Sold ' + asset.name, null, person, asset.currency);
  if (quote.fee) charge(world, quote.fee, 'sale-fee', 'Sale fee: ' + asset.name, undefined, asset.currency);
  if (asset.mortgageId) {
    const debt = world.liabilities.find(item => item.id === asset.mortgageId)!;
    const paid = foreclosure && debt.principal > account.cash ? account.cash : debt.principal;
    debt.principal -= paid;
    post(world, -paid, -paid, 'repayment', 'Mortgage settled from sale', debt.id, person, asset.currency);
    debt.assetId = null; debt.monthlyPayment = 0n; debt.remainingMonths = 0;
    if (debt.principal > 0n) debt.kind = 'personal';
  }
  const capitalGain = price - quote.fee - asset.costBasis;
  if (capitalGain > 0n) person.finance.cycleGross += fxMoney(world, { minor: capitalGain, currency: asset.currency }, accountFor(world, person).currency).minor;
  asset.ownerId = null; asset.primaryHome = false; asset.rental = 'none'; asset.listing = null; asset.mortgageId = null;
  asset.provenance.push('Sold by ' + fullName(person) + ' in ' + world.date.year);
  for (const household of world.households) if (household.homeAssetId === asset.id) household.homeAssetId = null;
  fact(world, (foreclosure ? 'My lender repossessed and sold ' : 'I sold ') + asset.name + '.', 'assets', '', person.id);
  return [{ id: 'price', label: 'Sale price', value: formatMoney({ minor: price, currency: asset.currency }), tone: 'neutral' }, { id: 'net', label: foreclosure ? 'Remaining cash' : 'Net sale proceeds', value: formatMoney({ minor: foreclosure ? account.cash : quote.proceeds, currency: asset.currency }, 'en-US', true), tone: quote.proceeds >= 0n ? 'positive' : 'negative' }];
}
function makeMortgage(world: World, asset: OwnedAsset, principal: bigint, interestBps: number, termMonths: number) {
  const id = 'mortgage_' + asset.id + '_' + world.revision;
  const debt: World['liabilities'][number] = { id, ownerId: world.activePersonId, currency: asset.currency, kind: 'mortgage', principal, interestBps, assetId: asset.id, monthlyPayment: mortgagePayment(principal, interestBps, termMonths), remainingMonths: termMonths, missedPayments: 0 };
  world.liabilities.push(debt); asset.mortgageId = id;
  post(world, principal, principal, 'borrowing', 'Mortgage funding: ' + asset.name, id, active(world), asset.currency);
  return debt;
}
export function renovationQuote(asset: OwnedAsset) {
  return { cost: roundRatio(asset.value * 500n, 10000n), addedValue: roundRatio(asset.value * BigInt(asset.condition < 50 ? 700 : 300), 10000n) };
}
export const monthlyUpkeep = (asset: OwnedAsset) => roundRatio(asset.value * BigInt(asset.upkeepBps), 120000n);
export const monthlyInsurance = (asset: OwnedAsset) => roundRatio(asset.value * BigInt(asset.kind === 'vehicle' ? 18 : 6), 10000n);
export const monthlyRent = (asset: OwnedAsset) => roundRatio(asset.value * 600n, 120000n);
export function resolveAssets(world: World, command: AssetCommand) {
  const person = active(world);
  if (command.type === 'buy-asset') {
    const offer = assetCatalog.find(candidate => candidate.id === command.catalogId);
    if (!offer) throw new IneligibleAction('This offer is unavailable');
    const quote = purchaseQuote(world, offer, command.financing, command.depositBps, command.termMonths);
    if (quote.price !== command.quotedPrice) throw new IneligibleAction('The price changed. Review the offer again');
    const reason = purchaseReason(world, offer, command.financing, command.depositBps, command.termMonths); if (reason) throw new IneligibleAction(reason);
    const asset: OwnedAsset = { id: 'asset_' + world.revision, ownerId: person.id, catalogId: offer.id, kind: offer.kind, name: offer.name, country: person.country, city: person.city, currency: accountFor(world).currency, pricePaid: quote.price, costBasis: quote.price + quote.fee, value: quote.price, condition: offer.condition, ageMonths: 0, acquired: { ...world.date }, mortgageId: null, primaryHome: offer.kind === 'property' && !world.assets.some(item => item.ownerId === person.id && item.primaryHome), rental: 'none', rentPerMonth: 0n, upkeepBps: offer.upkeepBps, insured: false, listing: null, provenance: ['Purchased by ' + fullName(person) + ' in ' + world.date.year] };
    world.assets.push(asset);
    if (asset.primaryHome) { const household = world.households.find(item => item.id === person.householdId); if (household) household.homeAssetId = asset.id; }
    if (quote.principal) makeMortgage(world, asset, quote.principal, quote.interestBps, quote.termMonths);
    charge(world, quote.price + quote.fee, 'purchase', 'Purchased ' + asset.name);
    fact(world, 'I bought ' + asset.name + ' in ' + asset.city + '.', 'assets');
    result(world, 'It’s yours', 'Ownership and the payment are recorded. Ongoing costs apply as time passes.', asset.kind === 'vehicle' ? 'vehicle' : asset.kind === 'property' ? 'property' : 'money', [{ id: 'paid', label: 'Cash paid upfront', value: formatMoney({ minor: quote.cashRequired, currency: asset.currency }), tone: 'negative' }]);
    return;
  }
  const asset = ownedAsset(world, command.assetId);
  if (command.type === 'sell-asset') {
    if (asset.kind === 'property') throw new IneligibleAction('List a property for sale and wait for an offer');
    const quote = saleQuote(world, asset);
    if (command.quotedPrice !== quote.price) throw new IneligibleAction('The offer changed. Review it again');
    result(world, 'Sale completed', 'The asset has left your ownership and the actual proceeds are in your account.', asset.kind === 'vehicle' ? 'vehicle' : 'money', completeAssetSale(world, asset.id, quote.price));
  } else if (command.type === 'list-property') {
    if (asset.kind !== 'property') throw new IneligibleAction('Only properties use sale listings');
    if (command.askingPrice < asset.value / 2n || command.askingPrice > asset.value * 2n) throw new IneligibleAction('Set an asking price between half and twice the estimated value');
    asset.listing = { askingPrice: command.askingPrice, nextOfferMonth: absoluteMonth(world) + draw(world, 'economy', 1, 3), offer: null, offersMade: 0 };
    result(world, 'Property listed', 'You still own it and remain responsible for its costs. Offers may arrive as months pass.', 'property');
  } else if (command.type === 'cancel-listing') {
    if (!asset.listing) throw new IneligibleAction('This property is not listed');
    asset.listing = null; result(world, 'Listing removed', 'You still own the property. No sale has taken place.', 'property');
  } else if (command.type === 'rent-property') {
    if (asset.kind !== 'property' || asset.rental !== 'none' || asset.listing) throw new IneligibleAction('Choose an unlisted property that is not already rented');
    asset.primaryHome = false; asset.rental = 'listed'; asset.rentPerMonth = monthlyRent(asset);
    result(world, 'Looking for a tenant', 'Rent starts after a tenant moves in. You now need other housing and keep paying this property’s costs.', 'property');
  } else if (command.type === 'stop-renting') {
    if (asset.rental === 'none') throw new IneligibleAction('This property is not rented');
    asset.rental = 'none'; asset.rentPerMonth = 0n; result(world, 'Rental arrangement ended', 'Future rent stops. You still own the property.', 'property');
  } else if (command.type === 'move-in') {
    if (asset.kind !== 'property' || asset.rental !== 'none' || asset.listing || asset.country !== person.country) throw new IneligibleAction('Choose an available home in your country of residence');
    world.assets.filter(item => item.ownerId === person.id).forEach(item => { item.primaryHome = item.id === asset.id; });
    person.city = asset.city; result(world, 'You moved in', 'This is now your primary home. The housing part of your monthly living costs is reduced; ownership costs remain.', 'property');
    const household = world.households.find(item => item.id === person.householdId); if (household) { household.homeAssetId = asset.id; for (const id of household.members) if (!world.people[id].died) world.people[id].city = asset.city; }
  } else if (command.type === 'renovate') {
    if (asset.condition >= 95) throw new IneligibleAction('This asset is already in excellent condition');
    const quote = renovationQuote(asset);
    charge(world, quote.cost, 'maintenance', 'Improved ' + asset.name, undefined, asset.currency);
    asset.condition = bounded(asset.condition + 20); asset.value += quote.addedValue; asset.costBasis += quote.cost;
    result(world, 'Work completed', 'Condition improved. The estimated value changed by the actual work benefit.', asset.kind === 'vehicle' ? 'vehicle' : 'property', [{ id: 'cost', label: 'Cost', value: formatMoney({ minor: quote.cost, currency: asset.currency }), tone: 'negative' }]);
  } else if (command.type === 'insure') {
    if (asset.kind === 'possession') throw new IneligibleAction('This cover is available for homes and vehicles');
    asset.insured = command.enabled;
    result(world, command.enabled ? 'Cover activated' : 'Cover ended', command.enabled ? 'Monthly premiums will be charged. Covered incidents reimburse 80% of the recorded asset loss.' : 'Premiums stop and future incidents will be uninsured.', asset.kind === 'vehicle' ? 'vehicle' : 'property');
  } else {
    if (asset.kind !== 'property' || !asset.mortgageId || asset.currency !== accountFor(world).currency) throw new IneligibleAction('Choose a local property with a mortgage');
    if (command.principal > roundRatio(asset.value * 8000n, 10000n)) throw new IneligibleAction('The new mortgage cannot exceed 80% of the current value');
    const previous = world.liabilities.find(debt => debt.id === asset.mortgageId)!;
    const interestBps = mortgageInterestBps(world);
    const payment = mortgagePayment(command.principal, interestBps, command.termMonths);
    const reason = debtCapacityReason(world, payment, previous.id); if (reason) throw new IneligibleAction(reason);
    const fee = refinanceFee(command.principal);
    if (accountFor(world).cash + command.principal < previous.principal + fee) throw new IneligibleAction('Your balance cannot cover settlement and refinancing fees');
    makeMortgage(world, asset, command.principal, interestBps, command.termMonths);
    const payoff = previous.principal; previous.principal = 0n; previous.assetId = null; previous.monthlyPayment = 0n; previous.remainingMonths = 0;
    post(world, -payoff, -payoff, 'repayment', 'Previous mortgage settled', previous.id);
    charge(world, fee, 'loan-fee', 'Mortgage refinancing fee');
    result(world, 'Mortgage refinanced', 'The old principal is settled. Any cash released is matched by the new debt, less fees.', 'property');
  }
}

export function updatePropertyMarket(world: World): number {
  const movement = draw(world, 'economy', -100, 120);
  world.market.propertyIndex = Math.min(10000000, Math.max(100, Math.round(world.market.propertyIndex * (10000 + movement) / 10000)));
  return movement;
}
export function assetsMonth(world: World, person = active(world), movement = updatePropertyMarket(world)) {
  for (const asset of world.assets.filter(item => item.ownerId === person.id)) {
    const account = accountFor(world, person, asset.currency); asset.ageMonths++;
    const change = asset.kind === 'property' ? movement : asset.kind === 'vehicle' ? -75 : asset.catalogId === 'rare-book' || asset.catalogId === 'painting' ? draw(world, 'economy', -70, 100) : -30;
    asset.value = roundRatio(asset.value * BigInt(10000 + change), 10000n);
    if (asset.ageMonths % 6 === 0) asset.condition = bounded(asset.condition - 1);
    if (asset.rental === 'listed' && draw(world, 'economy', 1, 100) <= 55) { asset.rental = 'occupied'; fact(world, 'A tenant moved into ' + asset.name + '.', 'assets', '', person.id); }
    if (asset.rental === 'occupied' && draw(world, 'economy', 1, 100) <= 90) {
      post(world, asset.rentPerMonth, 0n, 'rent', 'Rent from ' + asset.name, null, person, asset.currency);
      person.finance.cycleGross += fxMoney(world, { minor: asset.rentPerMonth, currency: asset.currency }, accountFor(world, person).currency).minor;
    }
    const upkeep = monthlyUpkeep(asset);
    if (upkeep) charge(world, upkeep, 'upkeep', 'Upkeep: ' + asset.name, 'living', asset.currency, person);
    if (asset.insured) charge(world, monthlyInsurance(asset), 'insurance', 'Insurance: ' + asset.name, 'living', asset.currency, person);
    if (asset.mortgageId) {
      const debt = world.liabilities.find(item => item.id === asset.mortgageId)!;
      if (debt.principal > 0n) {
        const interest = roundRatio(debt.principal * BigInt(debt.interestBps), 120000n);
        debt.principal += interest; if (interest) post(world, 0n, interest, 'interest', 'Mortgage interest', debt.id, person, asset.currency);
        const due = debt.remainingMonths <= 1 || debt.principal < debt.monthlyPayment ? debt.principal : debt.monthlyPayment;
        const paid = account.cash < due ? account.cash : due;
        debt.principal -= paid; if (paid) post(world, -paid, -paid, 'repayment', 'Monthly mortgage payment', debt.id, person, asset.currency);
        debt.remainingMonths = Math.max(0, debt.remainingMonths - 1); debt.missedPayments = paid < due ? debt.missedPayments + 1 : 0;
        if (debt.missedPayments >= 6) {
          const effects = completeAssetSale(world, asset.id, roundRatio(asset.value * 7000n, 10000n), true, person);
          if (!world.pending && person.id === world.activePersonId) result(world, 'Your property was repossessed', 'Six missed payments led to a forced sale. Sale proceeds paid fees and as much of the loan as possible. Any shortfall remains visible as personal debt.', 'property', effects);
          continue;
        }
      }
    }
    if (asset.kind !== 'possession' && draw(world, 'economy', 1, 10000) <= 20) {
      const loss = roundRatio(asset.value * 1500n, 10000n); asset.value -= loss; asset.condition = bounded(asset.condition - 20);
      const claim = asset.insured ? roundRatio(loss * 8000n, 10000n) : 0n;
      if (claim) post(world, claim, 0n, 'insurance-claim', 'Covered loss: ' + asset.name, null, person, asset.currency);
      fact(world, asset.name + ' was damaged. ' + (claim ? 'My insurance paid ' + formatMoney({ minor: claim, currency: asset.currency }) + '.' : 'I had no cover for the loss.'), 'assets', '', person.id);
    }
    const listing = asset.listing;
    if (listing && !listing.offer && absoluteMonth(world) >= listing.nextOfferMonth && !world.pending) {
      const offer = roundRatio(asset.value * BigInt(draw(world, 'economy', 8500, 10800)), 10000n);
      listing.offersMade++; listing.nextOfferMonth = absoluteMonth(world) + 2;
      if (offer > 0n && offer >= listing.askingPrice * 85n / 100n && account.cash + saleQuote(world, asset, offer).proceeds >= 0n) {
        if (person.id !== world.activePersonId) { completeAssetSale(world, asset.id, offer, false, person); continue; }
        listing.offer = offer;
        world.pending = { kind: 'decision', id: 'property_offer_' + asset.id + '_' + listing.offersMade, templateId: 'property-sale-offer', title: 'An offer for ' + asset.name, body: 'A buyer has offered ' + formatMoney({ minor: offer, currency: asset.currency }) + '. You still own the property until you accept and settle.', illustration: 'property', personIds: [person.id], choices: [
          { id: 'accept', label: 'Accept the offer', effects: [{ kind: 'asset-sale', assetId: asset.id, minor: offer }], resultTitle: 'Sale completed', resultBody: 'The property left your ownership. The mortgage, fees and net proceeds are settled from the actual sale price.', journal: 'I accepted an offer for ' + asset.name + '.' },
          { id: 'decline', label: 'Wait for another buyer', effects: [{ kind: 'decline-sale', assetId: asset.id }], resultTitle: 'You kept the listing', resultBody: 'The property remains yours. Its costs continue while you wait for another offer.', journal: 'I declined an offer for ' + asset.name + '.' },
        ] };
      }
    }
  }
}
