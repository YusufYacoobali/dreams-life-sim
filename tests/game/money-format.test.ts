import { countries, countryCodes } from '../../src/game/countries';
import { currencyDigits, formatMoney } from '../../src/game/money';

const NativeNumberFormat = Intl.NumberFormat;
function numberOnlyIntl(formatOnly = false) {
  return jest.spyOn(Intl, 'NumberFormat').mockImplementation((locale, options) => {
    const formatter = new NativeNumberFormat(locale, options);
    const check = (value: unknown) => { if (typeof value === 'bigint') throw new TypeError('Cannot convert BigInt to number'); };
    const limited = { format: (value: number) => { check(value); if (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) throw new TypeError('Unsafe Intl probe'); return formatter.format(value); } };
    if (formatOnly) return limited as Intl.NumberFormat;
    return { ...limited, formatToParts: value => { check(value); return formatter.formatToParts(value as number); }, resolvedOptions: () => formatter.resolvedOptions() } as Intl.NumberFormat;
  });
}
afterEach(() => jest.restoreAllMocks());
test.each(countryCodes)('%s formats real launch-currency balances when Intl rejects all BigInt inputs', country => {
  const { currency, locale } = countries[country], digits = currencyDigits[currency], minor = 123456789n, expected = new NativeNumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(minor) / 10 ** digits);
  numberOnlyIntl(); expect(formatMoney({ minor, currency }, locale)).toBe(expected);
});
test.each(countryCodes)('%s formats zero, signed and fractional balances when Intl only exposes format', country => {
  const { currency, locale } = countries[country], digits = currencyDigits[currency];
  const examples = [0n, 1n, -1n, 123456789n, -123456789n];
  const expected = examples.map(minor => [false, true].map(signed => new NativeNumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: digits, maximumFractionDigits: digits, signDisplay: signed ? 'always' : 'auto' }).format(Number(minor) / 10 ** digits)));
  numberOnlyIntl(true);
  examples.forEach((minor, index) => [false, true].forEach((signed, signIndex) => expect(formatMoney({ minor, currency }, locale, signed)).toBe(expected[index][signIndex])));
});
test('format-only Intl preserves enormous fortunes, Indian grouping, non-Latin digits and Spanish grouping thresholds', () => {
  numberOnlyIntl(true); const minor = 900719925474099397n;
  expect(formatMoney({ minor, currency: 'USD' })).toBe('$9,007,199,254,740,993.97');
  expect(formatMoney({ minor, currency: 'INR' }, 'en-IN')).toBe('₹9,00,71,99,25,47,40,993.97');
  expect(formatMoney({ minor: 100000n, currency: 'EUR' }, 'es-ES')).toBe(new NativeNumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(1000));
  for (const signed of [false, true]) expect(formatMoney({ minor: -123456n, currency: 'USD' }, 'ar-EG', signed)).toBe(new NativeNumberFormat('ar-EG', { style: 'currency', currency: 'USD', signDisplay: signed ? 'always' : 'auto' }).format(-1234.56));
});
test('legacy Intl may ignore signDisplay and never expose formatToParts or resolvedOptions', () => {
  jest.spyOn(Intl, 'NumberFormat').mockImplementation((locale, options) => {
    const { signDisplay: _ignored, ...legacy } = options ?? {}, formatter = new NativeNumberFormat(locale, legacy);
    return { format: (value: number) => formatter.format(value) } as Intl.NumberFormat;
  });
  expect(formatMoney({ minor: 0n, currency: 'USD' }, 'en-US', true)).toBe('+$0.00');
  expect(formatMoney({ minor: 17500n, currency: 'GBP' }, 'en-GB', true)).toBe('+£175.00');
});
test('an absent or unusable Intl still displays an exact readable balance without crashing', () => {
  const unavailable = jest.spyOn(Intl, 'NumberFormat').mockImplementation(() => { throw new TypeError('Intl unavailable'); });
  expect(formatMoney({ minor: 900719925474099397n, currency: 'USD' })).toBe('$9,007,199,254,740,993.97');
  expect(formatMoney({ minor: -175n, currency: 'JPY' }, 'ja-JP')).toBe('-¥175');
  unavailable.mockRestore();
  expect(formatMoney({ minor: 1234n, currency: 'USD' }, 'invalid_locale')).toBe('$12.34');
});
test('a runtime with no NumberFormat constructor can still show the saved balance', () => {
  const descriptor = Object.getOwnPropertyDescriptor(Intl, 'NumberFormat')!;
  Object.defineProperty(Intl, 'NumberFormat', { configurable: true, writable: true, value: undefined });
  try {
    expect(formatMoney({ minor: 900719925474099397n, currency: 'USD' })).toBe('$9,007,199,254,740,993.97');
    expect(formatMoney({ minor: 0n, currency: 'GBP' }, 'en-GB', true)).toBe('+£0.00');
  } finally { Object.defineProperty(Intl, 'NumberFormat', descriptor); }
});
test('huge fortunes retain every digit and cent with Western, Indian and continental grouping', () => {
  numberOnlyIntl();
  const minor = 900719925474099397n;
  expect(formatMoney({ minor, currency: 'USD' })).toBe('$9,007,199,254,740,993.97');
  expect(formatMoney({ minor, currency: 'INR' }, 'en-IN')).toBe('₹9,00,71,99,25,47,40,993.97');
  expect(formatMoney({ minor, currency: 'EUR' }, 'de-DE')).toBe('9.007.199.254.740.993,97\u00a0€');
  expect(formatMoney({ minor, currency: 'EUR' }, 'fr-FR')).toBe('9\u202f007\u202f199\u202f254\u202f740\u202f993,97\u00a0€');
  expect(formatMoney({ minor, currency: 'JPY' }, 'ja-JP')).toBe('￥900,719,925,474,099,397');
});
test('zero, negative fractional values and explicit positive signs retain exact currency conventions', () => {
  numberOnlyIntl(); expect(formatMoney({ minor: 0n, currency: 'USD' })).toBe('$0.00'); expect(formatMoney({ minor: -1n, currency: 'USD' })).toBe('-$0.01'); expect(formatMoney({ minor: 17500n, currency: 'GBP' }, 'en-GB', true)).toBe('+£175.00');
});
test('grouping thresholds and localized digits match native locale rules without passing a large amount to Intl', () => {
  const spanish = new NativeNumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(1000), arabic = new NativeNumberFormat('ar-EG', { style: 'currency', currency: 'USD' }).format(1234.56);
  numberOnlyIntl(); expect(formatMoney({ minor: 100000n, currency: 'EUR' }, 'es-ES')).toBe(spanish); expect(formatMoney({ minor: 123456n, currency: 'USD' }, 'ar-EG')).toBe(arabic);
});
