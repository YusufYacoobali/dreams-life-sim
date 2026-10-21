import { createLife, randomCreation } from '../../src/game/createLife';
import { countries, countryCodes } from '../../src/game/countries';
import { resolveCommand } from '../../src/game/engine';
import { decodeWorld, encodeWorld, validateWorld, World } from '../../src/game/model';
import { assetCatalog } from '../../src/game/content/assets';
import { assetPrice, assetsMonth, completeAssetSale, mortgagePayment, purchaseQuote, saleQuote } from '../../src/game/systems/assets';
import { accountFor, post } from '../../src/game/systems/common';
import { exchangeQuote, financeMonth } from '../../src/game/systems/finance';
import { fxMoney, investmentQuote, investmentValue, marketMonth, netWorth, parseQuantity } from '../../src/game/systems/markets';
import { instrumentIds } from '../../src/game/content/markets';
import { Currency, currencyDigits, roundRatio } from '../../src/game/money';
import graduateFixture from '../fixtures/v3-employed-graduate.json';

function fixture(): World {
  const world = decodeWorld(JSON.stringify(graduateFixture));
  const account = accountFor(world); account.openingCash += 100000000n; account.cash += 100000000n;
  return world;
}
function acknowledge(world: World): World {
  if (world.pending?.kind !== 'result') throw new Error('Expected a result');
  return resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
}
function buy(world: World, id: string, financing: 'cash' | 'mortgage' = 'cash'): World {
  const offer = assetCatalog.find(item => item.id === id)!;
  return acknowledge(resolveCommand(world, { type: 'buy-asset', catalogId: id, financing, depositBps: 2000, termMonths: 360, quotedPrice: assetPrice(world, offer) }));
}

test('an actual v3 employed save migrates with every balance, liability and work record intact', () => {
  const migrated = decodeWorld(JSON.stringify(graduateFixture));
  expect(migrated.schemaVersion).toBe(37);
  expect(migrated.ledger).toEqual(graduateFixture.ledger.map(entry => ({ ...entry, cashDelta: BigInt(entry.cashDelta.$dreamsBigInt), debtDelta: BigInt(entry.debtDelta.$dreamsBigInt) })));
  for (const account of graduateFixture.accounts) expect(migrated.accounts.find(item => item.id === account.id)?.cash).toBe(BigInt(account.cash.$dreamsBigInt));
  expect(migrated.people[migrated.activePersonId].employment?.id).toBe(graduateFixture.people.person_player.employment.id);
  expect(migrated.random).toEqual(graduateFixture.random);
});

test('cash and mortgage purchases create one asset and preserve net worth apart from disclosed fees', () => {
  for (const financing of ['cash', 'mortgage'] as const) {
    const initial = fixture(); const offer = assetCatalog.find(item => item.id === 'studio')!;
    const quote = purchaseQuote(initial, offer, financing);
    const before = netWorth(initial).minor;
    const after = buy(initial, 'studio', financing);
    expect(after.assets.filter(item => item.ownerId === after.activePersonId)).toHaveLength(1);
    expect(netWorth(after).minor).toBe(before - quote.fee);
    expect(accountFor(initial).cash - accountFor(after).cash).toBe(quote.cashRequired);
    if (financing === 'mortgage') expect(after.liabilities.find(debt => debt.kind === 'mortgage')?.principal).toBe(quote.principal);
    validateWorld(after);
  }
});

test('mortgage payments reduce actual principal and mortgage interest is charged only once', () => {
  let world = fixture();
  world = buy(world, 'studio', 'mortgage');
  const debt = world.liabilities.find(item => item.kind === 'mortgage')!;
  const original = debt.principal; const payment = debt.monthlyPayment;
  const interest = roundRatio(original * BigInt(debt.interestBps), 120000n);
  assetsMonth(world);
  expect(debt.principal).toBe(original + interest - payment);
  financeMonth(world);
  expect(debt.principal).toBe(original + interest - payment);
  validateWorld(world);
  expect(mortgagePayment(120000n, 0, 120)).toBe(1000n);
});

test('a completed sale removes ownership once and cannot be sold a second time', () => {
  let world = buy(fixture(), 'city-car'); const asset = world.assets[0]; const quote = saleQuote(world, asset);
  const cash = accountFor(world).cash;
  world = acknowledge(resolveCommand(world, { type: 'sell-asset', assetId: asset.id, quotedPrice: quote.price }));
  expect(accountFor(world).cash).toBe(cash + quote.proceeds);
  expect(world.assets[0].ownerId).toBeNull();
  expect(() => resolveCommand(world, { type: 'sell-asset', assetId: asset.id, quotedPrice: quote.price })).toThrow(/do not own/);
  expect(() => completeAssetSale(world, asset.id, quote.price)).toThrow(/do not own/);
});

test('a property listing retains ownership, pauses for a real offer and resumes without repeating months', () => {
  let world = buy(fixture(), 'studio'); const asset = world.assets[0];
  world = acknowledge(resolveCommand(world, { type: 'list-property', assetId: asset.id, askingPrice: asset.value }));
  expect(world.assets[0].ownerId).toBe(world.activePersonId);
  world = resolveCommand(world, { type: 'advance' });
  expect(world.pending?.kind).toBe('decision');
  if (world.pending?.kind !== 'decision') throw new Error('Expected an offer');
  expect(world.pending.templateId).toBe('property-sale-offer');
  const month = world.annual!.monthsProcessed;
  expect(month).toBeLessThan(12);
  const restored = decodeWorld(encodeWorld(world));
  world = resolveCommand(restored, { type: 'choose', eventId: world.pending.id, choiceId: 'accept' });
  expect(world.assets[0].ownerId).toBeNull();
  world = acknowledge(world);
  expect(world.annual!.monthsProcessed).toBe(12);
  expect(world.date.year).toBe(restored.annual!.targetDate.year);
});

test('six missed mortgage payments lead to a forced sale with no debt forgiveness or duplicated cash', () => {
  let world = fixture();
  world = buy(world, 'studio', 'mortgage');
  const account = accountFor(world); post(world, -account.cash, 0n, 'fixture-expense', 'Cash spent before the missed payments');
  for (let month = 0; month < 6; month++) assetsMonth(world);
  const asset = world.assets[0];
  expect(asset.ownerId).toBeNull();
  expect(world.pending?.kind).toBe('result');
  validateWorld(world);
});

test('a month-twelve sale offer is followed by exactly one annual tax settlement and annual event', () => {
  let world = buy(fixture(), 'studio'); const asset = world.assets[0];
  world = acknowledge(resolveCommand(world, { type: 'list-property', assetId: asset.id, askingPrice: asset.value / 2n }));
  world.assets[0].listing!.nextOfferMonth = (world.date.year + 1) * 12 + world.date.month - 1;
  world = resolveCommand(world, { type: 'advance' });
  if (world.pending?.kind !== 'decision') throw new Error('Expected a sale offer');
  expect(world.pending.templateId).toBe('property-sale-offer');
  expect(world.annual).toMatchObject({ monthsProcessed: 12, stage: 'months' });
  world = resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: 'accept' });
  world = acknowledge(world);
  expect(world.annual?.stage).toBe('complete');
  expect(world.people[world.activePersonId].finance.cycleGross).toBe(0n);
  const facts = world.journal.filter(entry => entry.category === 'finance' && entry.date.year === world.date.year);
  expect(facts).toHaveLength(1);
  if (world.pending?.kind === 'decision') world = resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: world.pending.choices[0].id });
  world = acknowledge(world);
  expect(world.annual).toBeNull(); expect(world.pending).toBeNull();
  expect(world.journal.filter(entry => entry.category === 'finance' && entry.date.year === world.date.year)).toHaveLength(1);
});

test('refinancing and extra repayments change cash and principal together without manufacturing equity', () => {
  let world = buy(fixture(), 'studio', 'mortgage'); const asset = world.assets[0]; const old = world.liabilities.find(debt => debt.id === asset.mortgageId)!;
  const before = netWorth(world).minor; const principal = old.principal;
  world = acknowledge(resolveCommand(world, { type: 'refinance', assetId: asset.id, principal, termMonths: 240 }));
  expect(netWorth(world).minor).toBe(before - roundRatio(principal, 100n));
  expect(world.liabilities.find(debt => debt.id === old.id)?.principal).toBe(0n);
  const current = world.liabilities.find(debt => debt.id === world.assets[0].mortgageId)!;
  const worth = netWorth(world).minor;
  world = acknowledge(resolveCommand(world, { type: 'repay', liabilityId: current.id, amount: 10000n }));
  expect(netWorth(world).minor).toBe(worth); validateWorld(world);
});

test.each(countryCodes)('%s investments use exact local currency and conserve holdings through a partial sale', country => {
  const input = randomCreation(12);
  let world = createLife('life_market', 12, { ...input, country, city: countries[country].cities[0] }, { year: 2000, month: 1, day: 1 });
  world.date.year = 2026; world.birthAcknowledged = true;
  const account = accountFor(world); account.cash = 10n ** 15n; account.openingCash = account.cash;
  const before = netWorth(world).minor; const quantity = 3n; const quote = investmentQuote(world, 'GROVE', quantity);
  world = acknowledge(resolveCommand(world, { type: 'buy-investment', instrumentId: 'GROVE', quantity, quotedMinor: quote.value }));
  expect(netWorth(world).minor).toBe(before - quote.fee);
  const holding = world.holdings[0]; const sale = investmentQuote(world, 'GROVE', 1n);
  world = acknowledge(resolveCommand(world, { type: 'sell-investment', holdingId: holding.id, quantity: 1n, quotedMinor: sale.value }));
  expect(world.holdings[0].quantity).toBe(2n);
  expect(world.holdings[0].costBasis).toBeGreaterThan(0n);
  expect(() => resolveCommand(world, { type: 'sell-investment', holdingId: holding.id, quantity: 3n, quotedMinor: sale.value })).toThrow(/do not own/);
  validateWorld(world);
});

test('fractional crypto is rounded only at the final currency unit and market movement never directly credits gains', () => {
  const world = fixture();
  expect(parseQuantity('0.000001', 'ORBIT')).toBe(1n);
  expect(investmentValue(world, 'ORBIT', 1n, 'JPY')).toBe(10n);
  expect(() => parseQuantity('0.1', 'GROVE')).toThrow(/whole/);
  expect(() => parseQuantity('0.0000001', 'ORBIT')).toThrow(/six/);
  const before = accountFor(world).cash;
  marketMonth(world);
  expect(accountFor(world).cash).toBe(before);
  expect(instrumentIds.every(id => world.market.prices[id].minor > 0n)).toBe(true);
  const value = { minor: 100000n, currency: 'USD' as const };
  expect(fxMoney(world, value, 'USD')).toEqual(value);
});

test('all 81 currency pair directions reject same-currency trades or conserve money through a round trip', () => {
  const currencies = Object.keys(currencyDigits) as Currency[];
  for (const from of currencies) for (const to of currencies) {
    let world = fixture();
    for (const currency of currencies) if (!world.accounts.some(item => item.ownerId === world.activePersonId && item.currency === currency)) world.accounts.push({ id: 'account_fixture_' + currency, ownerId: world.activePersonId, currency, cash: 1000000000n, openingCash: 1000000000n, lockedCash: 0n });
    const before = accountFor(world, world.people[world.activePersonId], from).cash; const amount = 1000000n;
    if (from === to) { expect(() => resolveCommand(world, { type: 'exchange', from, to, amount, quotedNet: 1n })).toThrow(/different/); continue; }
    const quote = exchangeQuote(world, amount, from, to);
    world = acknowledge(resolveCommand(world, { type: 'exchange', from, to, amount, quotedNet: quote.net }));
    const reverse = exchangeQuote(world, quote.net, to, from);
    world = acknowledge(resolveCommand(world, { type: 'exchange', from: to, to: from, amount: quote.net, quotedNet: reverse.net }));
    expect(accountFor(world, world.people[world.activePersonId], from).cash).toBeLessThanOrEqual(before);
    validateWorld(world);
  }
  expect(exchangeQuote(fixture(), 1n, 'JPY', 'USD').net).toBe(0n);
});
