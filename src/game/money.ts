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

type IntegerFormat = { separator: string; primary: number; secondary: number; minimumGroupedDigits: number; digits: string[]; pattern: string };
type CurrencyTemplate = { prefix: string; decimal: string; suffix: string };
const integerFormats = new Map<string, IntegerFormat>(), currencyTemplates = new Map<string, CurrencyTemplate>();
let cachedConstructor: typeof Intl.NumberFormat | undefined;
const symbols: Record<Currency, string> = { USD: '$', CAD: 'CA$', GBP: '£', AUD: 'A$', EUR: '€', BRL: 'R$', INR: '₹', JPY: '¥', ZAR: 'R' };
const asciiDigits = Array.from({ length: 10 }, (_, digit) => String(digit));
const directionMarks = /[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;
function constructor() {
  const current = typeof Intl !== 'undefined' && typeof Intl.NumberFormat === 'function' ? Intl.NumberFormat : undefined;
  if (current !== cachedConstructor) { integerFormats.clear(); currencyTemplates.clear(); cachedConstructor = current; }
  return current;
}
function numberFormatter(locale: string, options: Intl.NumberFormatOptions) {
  const Factory = constructor();
  try { return Factory ? new Factory(locale, options) : undefined; } catch { return undefined; }
}
function patternFor(digits: string[]) { return digits.map(digit => digit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).sort((a, b) => b.length - a.length).join('|'); }
function numericGroups(value: string, digits: string[], pattern: string) {
  return value.replace(new RegExp(pattern, 'g'), token => String(digits.indexOf(token))).match(/\d+/g) ?? [];
}
function remember<T>(cache: Map<string, T>, key: string, value: T, limit: number) {
  if (cache.size >= limit) cache.delete(cache.keys().next().value!);
  cache.set(key, value); return value;
}
function integerFormat(locale: string): IntegerFormat {
  constructor(); const cached = integerFormats.get(locale); if (cached) return cached;
  const fallback: IntegerFormat = { separator: ',', primary: 3, secondary: /(?:^hi(?:-|$)|-in(?:-|$))/i.test(locale) ? 2 : 3, minimumGroupedDigits: 4, digits: asciiDigits, pattern: '[0-9]' };
  // Only .format(Number) is required. Some Hermes Intl implementations omit formatToParts,
  // signDisplay and BigInt inputs, while still providing correctly localized number strings.
  try {
    const formatter = numberFormatter(locale, { maximumFractionDigits: 0 }), digitFormatter = numberFormatter(locale, { useGrouping: false, maximumFractionDigits: 0 });
    if (!formatter || !digitFormatter) return remember(integerFormats, locale, fallback, 32);
    const digits = asciiDigits.map((_, digit) => digitFormatter.format(digit).replace(directionMarks, '').trim());
    if (digits.some(digit => !digit) || new Set(digits).size !== 10) return remember(integerFormats, locale, fallback, 32);
    const pattern = patternFor(digits), probe = formatter.format(1234567890123), groups = numericGroups(probe, digits, pattern);
    if (!groups.length) return remember(integerFormats, locale, fallback, 32);
    const normalized = probe.replace(new RegExp(pattern, 'g'), token => String(digits.indexOf(token))).replace(directionMarks, '');
    const separator = groups.length > 1 ? normalized.match(/\d([^\d]+)\d/)?.[1] ?? '' : '';
    const primary = groups[groups.length - 1].length, secondary = groups.length > 2 ? groups[groups.length - 2].length : primary;
    return remember(integerFormats, locale, { separator, primary, secondary, digits, pattern,
      minimumGroupedDigits: [4, 5, 6, 7].find(length => numericGroups(formatter.format(10 ** (length - 1)), digits, pattern).length > 1) ?? Infinity,
    }, 32);
  } catch { return remember(integerFormats, locale, fallback, 32); }
}
function localizedInteger(raw: string, format: IntegerFormat): string {
  if (!format.separator || raw.length < format.minimumGroupedDigits) return raw.replace(/\d/g, digit => format.digits[Number(digit)]);
  const chunks: string[] = []; let end = raw.length, width = format.primary;
  while (end > 0) { chunks.unshift(raw.slice(Math.max(0, end - width), end)); end -= width; width = format.secondary; }
  return chunks.map(chunk => chunk.replace(/\d/g, digit => format.digits[Number(digit)])).join(format.separator);
}
function currencyTemplate(locale: string, currency: Currency, negative: boolean, format: IntegerFormat): CurrencyTemplate {
  const key = locale + ':' + currency + ':' + negative, cached = currencyTemplates.get(key); if (cached) return cached;
  const fallback = { prefix: (negative ? '-' : '') + symbols[currency], decimal: '.', suffix: '' };
  try {
    const digits = currencyDigits[currency], formatter = numberFormatter(locale, { style: 'currency', currency, minimumFractionDigits: digits, maximumFractionDigits: digits });
    if (!formatter) return remember(currencyTemplates, key, fallback, 128);
    const probe = formatter.format((negative ? -1 : 1) * (digits ? 1.1 : 1)), tokens: RegExpExecArray[] = [], regex = new RegExp(format.pattern, 'g');
    let token: RegExpExecArray | null;
    while ((token = regex.exec(probe))) tokens.push(token);
    if (!tokens.length) return remember(currencyTemplates, key, fallback, 128);
    const first = tokens[0], last = tokens[tokens.length - 1], prefix = probe.slice(0, first.index), suffix = probe.slice(last.index + last[0].length);
    // Intl shims which ignore currency options still get an unambiguous currency symbol.
    if (!(prefix + suffix).replace(directionMarks, '').replace(/[-+\u2212\uff0d\s]/g, '')) return remember(currencyTemplates, key, fallback, 128);
    const decimal = digits && tokens.length > 1 ? probe.slice(first.index + first[0].length, tokens[1].index) : '.';
    return remember(currencyTemplates, key, { prefix, decimal: decimal || '.', suffix }, 128);
  } catch { return remember(currencyTemplates, key, fallback, 128); }
}

/** Exact minor units using only safe Number probes and the basic Intl .format method. */
export function formatMoney(value: Money, locale = 'en-US', signed = false): string {
  const digits = currencyDigits[value.currency], negative = value.minor < 0n, absolute = negative ? -value.minor : value.minor;
  const format = integerFormat(locale), integer = localizedInteger((absolute / scale(value.currency)).toString(), format);
  const fraction = (absolute % scale(value.currency)).toString().padStart(digits, '0').replace(/\d/g, digit => format.digits[Number(digit)]);
  const template = currencyTemplate(locale, value.currency, negative || signed, format);
  let prefix = template.prefix, suffix = template.suffix;
  if (signed && !negative) {
    if (/[-\u2212\uff0d]/.test(prefix + suffix)) { prefix = prefix.replace(/[-\u2212\uff0d]/, '+'); suffix = suffix.replace(/[-\u2212\uff0d]/, '+'); }
    else prefix = '+' + prefix;
  }
  return prefix + integer + (digits ? template.decimal + fraction : '') + suffix;
}
