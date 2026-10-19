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

type IntegerFormat = { separator: string; primary: number; secondary: number; minimumGroupedDigits: number; digits: string[] };
const integerFormats = new Map<string, IntegerFormat>();
function integerFormat(locale: string): IntegerFormat {
  const cached = integerFormats.get(locale); if (cached) return cached;
  // Hermes supports BigInt arithmetic but some Intl implementations accept only Number.
  // Probe grouping with small, exactly representable numbers; format the actual balance as text.
  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const parts = formatter.formatToParts(1234567890123), groups = parts.filter(part => part.type === 'integer');
  const primary = Array.from(groups.at(-1)!.value).length, secondary = groups.length > 2 ? Array.from(groups.at(-2)!.value).length : primary;
  const digitFormatter = new Intl.NumberFormat(locale, { useGrouping: false, maximumFractionDigits: 0 });
  const value = { separator: parts.find(part => part.type === 'group')?.value ?? '', primary, secondary,
    minimumGroupedDigits: [4, 5, 6, 7].find(length => formatter.formatToParts(10 ** (length - 1)).some(part => part.type === 'group')) ?? Infinity,
    digits: Array.from({ length: 10 }, (_, digit) => digitFormatter.formatToParts(digit).filter(part => part.type === 'integer').map(part => part.value).join('')),
  };
  if (integerFormats.size >= 32) integerFormats.delete(integerFormats.keys().next().value!);
  integerFormats.set(locale, value); return value;
}
function localizedInteger(raw: string, format: IntegerFormat): string {
  if (!format.separator || raw.length < format.minimumGroupedDigits) return raw.replace(/\d/g, digit => format.digits[Number(digit)]);
  const chunks: string[] = []; let end = raw.length, width = format.primary;
  while (end > 0) { chunks.unshift(raw.slice(Math.max(0, end - width), end)); end -= width; width = format.secondary; }
  return chunks.map(chunk => chunk.replace(/\d/g, digit => format.digits[Number(digit)])).join(format.separator);
}

/** Exact minor units, with Number-only Intl calls for Android/Hermes compatibility. */
export function formatMoney(value: Money, locale = 'en-US', signed = false): string {
  const digits = currencyDigits[value.currency];
  const negative = value.minor < 0n;
  const absolute = negative ? -value.minor : value.minor;
  const format = integerFormat(locale), integer = localizedInteger((absolute / scale(value.currency)).toString(), format);
  const fraction = (absolute % scale(value.currency)).toString().padStart(digits, '0').replace(/\d/g, digit => format.digits[Number(digit)]);
  const template = new Intl.NumberFormat(locale, {
    style: 'currency', currency: value.currency, minimumFractionDigits: digits, maximumFractionDigits: digits,
    signDisplay: signed ? 'always' : 'auto',
  }).formatToParts(negative ? -1 : 1);
  return template.map(part => part.type === 'integer' ? integer : part.type === 'fraction' ? fraction : part.value).join('');
}
