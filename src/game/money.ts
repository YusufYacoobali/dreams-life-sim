export const currencyDigits = { USD: 2, CAD: 2, GBP: 2, AUD: 2, EUR: 2, BRL: 2, INR: 2, JPY: 0, ZAR: 2 } as const;
export type Currency = keyof typeof currencyDigits;
export type Money = { minor: bigint; currency: Currency };

const scale = (currency: Currency) => 10n ** BigInt(currencyDigits[currency]);

export function roundRatio(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) throw new Error('Denominator must be positive');
  const sign = numerator < 0n ? -1n : 1n;
  const absolute = numerator * sign;
  const quotient = absolute / denominator;
  return (quotient + (absolute % denominator * 2n >= denominator ? 1n : 0n)) * sign;
}

export function addMoney(first: Money, second: Money): Money {
  if (first.currency !== second.currency) throw new Error('Currency mismatch');
  return { minor: first.minor + second.minor, currency: first.currency };
}

export function applyBasisPoints(value: Money, basisPoints: bigint): Money {
  return { currency: value.currency, minor: roundRatio(value.minor * basisPoints, 10000n) };
}

/** numerator/denominator is target major units per source major unit. */
export function convertMoney(value: Money, currency: Currency, numerator: bigint, denominator: bigint): Money {
  if (numerator <= 0n || denominator <= 0n) throw new Error('Invalid exchange rate');
  return { currency, minor: roundRatio(value.minor * numerator * scale(currency), denominator * scale(value.currency)) };
}

export function parseMoney(input: string, currency: Currency): Money {
  const text = input.trim();
  if (text.length > 40 || !/^\d+(\.\d+)?$/.test(text)) throw new Error('Enter a valid non-negative amount');
  const [whole, fraction = ''] = text.split('.');
  const digits = currencyDigits[currency];
  if (fraction.length > digits) throw new Error('Too many decimal places');
  return { currency, minor: BigInt(whole) * scale(currency) + BigInt(fraction.padEnd(digits, '0') || '0') };
}

/** Uses bigint throughout; large fortunes do not lose cents in Number coercion. */
export function formatMoney(value: Money, locale = 'en-US', signed = false): string {
  const digits = currencyDigits[value.currency];
  const negative = value.minor < 0n;
  const absolute = negative ? -value.minor : value.minor;
  const integer = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(absolute / scale(value.currency));
  const fraction = (absolute % scale(value.currency)).toString().padStart(digits, '0');
  const template = new Intl.NumberFormat(locale, {
    style: 'currency', currency: value.currency, minimumFractionDigits: digits, maximumFractionDigits: digits,
    signDisplay: signed ? 'always' : 'auto',
  }).formatToParts(negative ? -1n : 1n);
  return template.map(part => part.type === 'integer' ? integer : part.type === 'fraction' ? fraction : part.value).join('');
}
