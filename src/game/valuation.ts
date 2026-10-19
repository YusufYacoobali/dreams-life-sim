import type { World } from './model';
import { countries } from './countries';
import { Currency, Money, convertMoney, currencyDigits, roundRatio } from './money';
import { InstrumentId, instruments } from './content/markets';
import { businessValue, companyClaimValue } from './businessValuation';

export function fxRate(world: World, from: Currency, to: Currency) {
  if (from === to) return { numerator: 1n, denominator: 1n };
  const source = world.market.fx[from], target = world.market.fx[to];
  return { numerator: target.numerator * source.denominator, denominator: target.denominator * source.numerator };
}
export function fxMoney(world: World, value: Money, currency: Currency): Money {
  const rate = fxRate(world, value.currency, currency);
  return convertMoney(value, currency, rate.numerator, rate.denominator);
}
export function investmentValue(world: World, id: InstrumentId, quantity: bigint, currency: Currency): bigint {
  const target = world.market.fx[currency], source = world.market.fx.USD;
  return roundRatio(world.market.prices[id].minor * quantity * target.numerator * source.denominator * 10n ** BigInt(currencyDigits[currency]), 100n * instruments[id].unitScale * target.denominator * source.numerator);
}
export function netWorth(world: World, personId = world.activePersonId): Money {
  const currency = countries[world.people[personId].country].currency;
  let minor = 0n;
  for (const account of world.accounts.filter(item => item.ownerId === personId)) minor += fxMoney(world, { minor: account.cash, currency: account.currency }, currency).minor;
  for (const asset of world.assets.filter(item => item.ownerId === personId)) minor += fxMoney(world, { minor: asset.value, currency: asset.currency }, currency).minor;
  for (const holding of world.holdings.filter(item => item.ownerId === personId)) minor += investmentValue(world, holding.instrumentId, holding.quantity, currency);
  for (const debt of world.liabilities.filter(item => item.ownerId === personId)) minor -= fxMoney(world, { minor: debt.principal, currency: debt.currency }, currency).minor;
  for (const debt of world.liabilities.filter(item => item.creditorId === personId)) minor += fxMoney(world, { minor: debt.principal, currency: debt.currency }, currency).minor;
  for (const item of (world.cases ?? []).filter(item => item.personId === personId && item.bailState === 'held')) minor += fxMoney(world, item.bail, currency).minor;
  for (const item of (world.contraband ?? []).filter(item => item.personId === personId && item.status === 'owned')) minor += fxMoney(world, item.value, currency).minor;
  for (const company of (world.businesses ?? []).filter(item => item.ownerId === personId)) minor += fxMoney(world, { minor: businessValue(world, company), currency: company.currency }, currency).minor;
  for (const payable of (world.businessPayables ?? []).filter(item => item.creditorId === personId && item.principal > 0n)) minor += fxMoney(world, { minor: companyClaimValue(world, payable), currency: payable.currency }, currency).minor;
  return { minor, currency };
}
export function portfolioValue(world: World): Money {
  const currency = countries[world.people[world.activePersonId].country].currency;
  return { currency, minor: world.holdings.filter(holding => holding.ownerId === world.activePersonId).reduce((sum, holding) => sum + investmentValue(world, holding.instrumentId, holding.quantity, currency), 0n) };
}
/** Gifts from outside the couple and inheritances are excluded from future marital-gain equalisation. */
export function protectSeparateProperty(world: World, personId: string, value: Money, donorId?: string) {
  for (const marriage of world.marriages.filter(item => !item.ended && (item.a === personId || item.b === personId))) {
    if (donorId === marriage.a || donorId === marriage.b) continue;
    if (marriage.a === personId) marriage.excludedA += fxMoney(world, value, marriage.baselineA.currency).minor;
    else marriage.excludedB += fxMoney(world, value, marriage.baselineB.currency).minor;
  }
}
