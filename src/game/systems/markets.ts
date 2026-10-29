import { z } from 'zod';
import { ageOn } from '../personHelpers';
import type { World } from '../model';
import { Currency, formatMoney, roundRatio } from '../money';
import { InstrumentId, instrumentIds, instruments } from '../content/markets';
import { rules } from '../rules';
import { IneligibleAction } from '../errors';
import { accountFor, active, draw, fact, post, result } from './common';
import { fxMoney, investmentValue } from '../valuation';
export { fxMoney, investmentValue, netWorth, portfolioValue } from '../valuation';

export const marketCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('buy-investment'), instrumentId: z.enum(instrumentIds), quantity: z.bigint().positive(), quotedMinor: z.bigint().positive() }),
  z.object({ type: z.literal('sell-investment'), holdingId: z.string(), quantity: z.bigint().positive(), quotedMinor: z.bigint().positive() }),
]);
export type MarketCommand = z.infer<typeof marketCommandSchema>;
export function investmentQuote(world: World, id: InstrumentId, quantity: bigint) {
  const currency = accountFor(world).currency;
  const value = investmentValue(world, id, quantity, currency);
  const fee = roundRatio(value * 100n, 10000n);
  return { value, fee, buyCost: value + fee, sellProceeds: value - fee, currency };
}
export function parseQuantity(input: string, id: InstrumentId): bigint {
  const text = input.trim(); const places = instruments[id].unitScale === 1n ? 0 : 6;
  if (text.length > 30 || !/^\d+(\.\d+)?$/.test(text)) throw new IneligibleAction('Enter a valid quantity');
  const [whole, fraction = ''] = text.split('.');
  if (fraction.length > places) throw new IneligibleAction(places ? 'Use at most six decimal places' : 'Shares must be whole numbers');
  const value = BigInt(whole) * instruments[id].unitScale + BigInt(fraction.padEnd(places, '0') || '0');
  if (value <= 0n) throw new IneligibleAction('Choose a positive quantity');
  return value;
}
export function formatQuantity(quantity: bigint, id: InstrumentId): string {
  const scale = instruments[id].unitScale;
  if (scale === 1n) return quantity.toString();
  return (quantity / scale).toString() + ((quantity % scale) ? '.' + (quantity % scale).toString().padStart(6, '0').replace(/0+$/, '') : '');
}
export function resolveMarket(world: World, command: MarketCommand) {
  const person = active(world); const account = accountFor(world);
  if (ageOn(person, world.date) < rules[person.country].adultAge) throw new IneligibleAction('Investing is available to adults');
  const holding = command.type === 'sell-investment' ? world.holdings.find(item => item.id === command.holdingId && item.ownerId === person.id) : undefined;
  if (command.type === 'sell-investment' && (!holding || command.quantity > holding.quantity)) throw new IneligibleAction('You do not own that quantity');
  const id = command.type === 'buy-investment' ? command.instrumentId : holding!.instrumentId;
  const quote = investmentQuote(world, id, command.quantity);
  if (quote.value <= 0n || quote.value !== command.quotedMinor) throw new IneligibleAction('The quote changed. Review the current price');
  if (command.type === 'buy-investment') {
    if (account.cash < quote.buyCost) throw new IneligibleAction('Your balance cannot cover the purchase and fee');
    let target = world.holdings.find(item => item.ownerId === person.id && item.instrumentId === id && item.currency === account.currency);
    if (!target) { target = { id: 'holding_' + person.id + '_' + id + '_' + account.currency, ownerId: person.id, instrumentId: id, quantity: 0n, costBasis: 0n, currency: account.currency }; world.holdings.push(target); }
    target.quantity += command.quantity; target.costBasis += quote.buyCost;
    post(world, -quote.buyCost, 0n, 'investment', 'Bought ' + formatQuantity(command.quantity, id) + ' ' + id);
    fact(world, 'I invested in ' + instruments[id].name + '.', 'finance');
    result(world, 'Investment purchased', 'Your cash paid for the holding and trading fee. Future price changes affect its value.', 'money', [{ id: 'cost', label: 'Total paid', value: formatMoney({ minor: quote.buyCost, currency: account.currency }), tone: 'negative' }]);
  } else {
    const disposedCost = roundRatio(holding!.costBasis * command.quantity, holding!.quantity);
    holding!.quantity -= command.quantity; holding!.costBasis -= disposedCost;
    post(world, quote.sellProceeds, 0n, 'investment-sale', 'Sold ' + formatQuantity(command.quantity, id) + ' ' + id);
    const profit = quote.sellProceeds - fxMoney(world, { minor: disposedCost, currency: holding!.currency }, account.currency).minor;
    // This simplified model taxes positive realised gains and does not grant loss relief.
    if (profit > 0n) person.finance.cycleGross += profit;
    result(world, 'Investment sold', 'The sold quantity is gone from your holding. Proceeds are now in your bank balance.', 'money', [{ id: 'proceeds', label: 'Net proceeds', value: formatMoney({ minor: quote.sellProceeds, currency: account.currency }), tone: 'positive' }, { id: 'profit', label: 'Realised gain / loss', value: formatMoney({ minor: profit, currency: account.currency }, 'en-US', true), tone: profit >= 0n ? 'positive' : 'negative' }]);
  }
}
export function marketMonth(world: World) {
  for (const id of instrumentIds) {
    const instrument = instruments[id]; const price = world.market.prices[id];
    const movement = draw(world, 'economy', -instrument.volatilityBps, instrument.volatilityBps) + instrument.driftBps;
    const changed = roundRatio(price.minor * BigInt(10000 + movement), 10000n);
    price.minor = changed > 0n ? changed : 1n;
    price.history.push({ year: world.date.year, month: world.date.month, minor: price.minor });
    if (price.history.length > 60) price.history.shift();
  }
  for (const currency of Object.keys(world.market.fx) as Currency[]) {
    if (currency === 'USD') continue;
    const rate = world.market.fx[currency];
    const changed = roundRatio(rate.numerator * BigInt(10000 + draw(world, 'economy', -30, 30)), 10000n);
    rate.numerator = changed > 0n ? changed : 1n;
  }
  if (world.date.month % 3 === 0) for (const holding of world.holdings.filter(item => item.quantity > 0n && !world.people[item.ownerId].died)) {
    const person = world.people[holding.ownerId], account = accountFor(world, person);
    const instrument = instruments[holding.instrumentId];
    const dividend = roundRatio(investmentValue(world, holding.instrumentId, holding.quantity, account.currency) * BigInt(instrument.dividendBps), 40000n);
    if (dividend > 0n) { post(world, dividend, 0n, 'dividend', holding.instrumentId + ' dividend', null, person); person.finance.cycleGross += dividend; }
  }
}
