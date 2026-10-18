import type { World } from './model';
import { countries } from './countries';
import { Currency, Money, convertMoney, currencyDigits, roundRatio } from './money';
import { InstrumentId, instruments } from './content/markets';

export function fxMoney(world: World, value: Money, currency: Currency): Money {
  if (value.currency === currency) return { ...value };
  const source = world.market.fx[value.currency], target = world.market.fx[currency];
  return convertMoney(value, currency, target.numerator * source.denominator, target.denominator * source.numerator);
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
  return { minor, currency };
}
export function portfolioValue(world: World): Money {
  const currency = countries[world.people[world.activePersonId].country].currency;
  return { currency, minor: world.holdings.filter(holding => holding.ownerId === world.activePersonId).reduce((sum, holding) => sum + investmentValue(world, holding.instrumentId, holding.quantity, currency), 0n) };
}
