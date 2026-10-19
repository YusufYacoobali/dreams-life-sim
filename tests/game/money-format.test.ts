import { countries, countryCodes } from '../../src/game/countries';
import { currencyDigits, formatMoney } from '../../src/game/money';

const NativeNumberFormat = Intl.NumberFormat;
function numberOnlyIntl() {
  return jest.spyOn(Intl, 'NumberFormat').mockImplementation((locale, options) => {
    const formatter = new NativeNumberFormat(locale, options);
    const check = (value: unknown) => { if (typeof value === 'bigint') throw new TypeError('Cannot convert BigInt to number'); };
    return { format: value => { check(value); return formatter.format(value as number); }, formatToParts: value => { check(value); return formatter.formatToParts(value as number); }, resolvedOptions: () => formatter.resolvedOptions() } as Intl.NumberFormat;
  });
}
afterEach(() => jest.restoreAllMocks());
test.each(countryCodes)('%s formats real launch-currency balances when Intl rejects all BigInt inputs', country => {
  const { currency, locale } = countries[country], digits = currencyDigits[currency], minor = 123456789n, expected = new NativeNumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(minor) / 10 ** digits);
  numberOnlyIntl(); expect(formatMoney({ minor, currency }, locale)).toBe(expected);
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
