import type { Person, World } from '../model';
import { countries } from '../countries';
import { convertMoney, roundRatio } from '../money';
import { incomeTax, rules } from '../rules';
import { fxMoney, fxRate } from '../valuation';
import { post } from './common';

/** Value each paid receipt once in the person's fixed lifetime-earnings currency. */
export function recordWageEarnings(world: World, person: Person, history: World['workHistory'][number], wages: bigint, month = world.date.year * 12 + world.date.month - 1) {
  if (wages < 0n) throw new Error('Negative earned wages');
  const rate = fxRate(world, history.currency, person.finance.earningsCurrency);
  const reference = convertMoney({ minor: wages, currency: history.currency }, person.finance.earningsCurrency, rate.numerator, rate.denominator).minor;
  history.grossEarned += wages; history.normalizedGross += reference; person.finance.lifetimeGross += reference;
  if (wages && history.currency !== person.finance.earningsCurrency) history.conversions.push({ month, native: wages, reference, rate });
}

/** The external pension issuer converts only the payment actually due, retaining its quote. */
export function pensionPayment(world: World, person: Person, periods = 1, background = false) {
  const finance = person.finance, sourceCurrency = finance.earningsCurrency, currency = countries[person.country].currency;
  if (!Number.isSafeInteger(periods) || periods < 1 || finance.pensionAnnual <= 0n) throw new Error('Invalid pension period');
  const firstPeriod = finance.pensionMonths, nativeGross = roundRatio(finance.pensionAnnual * BigInt(firstPeriod + periods), 12n) - roundRatio(finance.pensionAnnual * BigInt(firstPeriod), 12n);
  const rate = fxRate(world, sourceCurrency, currency), gross = convertMoney({ minor: nativeGross, currency: sourceCurrency }, currency, rate.numerator, rate.denominator).minor;
  const annual = fxMoney(world, { minor: finance.pensionAnnual, currency: sourceCurrency }, currency).minor;
  const fee = sourceCurrency === currency ? 0n : (gross + 99n) / 100n;
  const annualTax = incomeTax(annual, rules[person.country]);
  const taxQuote = background ? 0n : roundRatio(annualTax * BigInt(firstPeriod + periods), 12n) - roundRatio(annualTax * BigInt(firstPeriod), 12n);
  const withheld = taxQuote < gross - fee ? taxQuote : gross - fee;
  const payment = { month: world.date.year * 12 + world.date.month - 1, firstPeriod, periods, sourceCurrency, currency, annualPay: finance.pensionAnnual, nativeGross, rate, gross, fee, withheld, grossTransactionId: null as string | null, feeTransactionId: null as string | null, taxTransactionId: null as string | null };
  if (gross) { post(world, gross, 0n, background ? 'background-income' : 'income', 'Pension payment', null, person, currency); payment.grossTransactionId = world.ledger.at(-1)!.id; }
  if (fee) { post(world, -fee, 0n, 'pension-exchange-fee', 'Pension currency conversion fee', null, person, currency); payment.feeTransactionId = world.ledger.at(-1)!.id; }
  if (withheld) { post(world, -withheld, 0n, 'tax', 'Pension tax withheld', null, person, currency); payment.taxTransactionId = world.ledger.at(-1)!.id; }
  finance.pensionMonths += periods; finance.pensionReceipts.push(payment);
  if (!background) { finance.cycleGross += gross; finance.cycleWithheld += withheld; }
  return { gross, fee, withheld, net: gross - fee - withheld, annual };
}
