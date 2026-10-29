import React from 'react';
import { TextInput } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { DisplayText } from '../../src/ui/DisplayText';
import {
  displayNumber,
  displayQuantity,
  displayText,
} from '../../src/ui/displayNumbers';
import { formatMoney, parseMoney } from '../../src/game/money';
import { countries, countryCodes } from '../../src/game/countries';
import { currencyDigits } from '../../src/game/money';

test.each([
  ['£3,123,123.00', '£3,123,123'],
  ['$12,345.49', '$12,345'],
  ['$12,345.50', '$12,346'],
  ['-$12.50', '-$13'],
  ['+£175.00', '+£175'],
  ['£0.01', '<£1'],
  ['-$0.01', '-<$1'],
  ['$0.00', '$0'],
  ['£999.99', '£1,000'],
  ['₹12,34,567.89', '₹12,34,568'],
  ['1.234.567,89\u00a0€', '1.234.568\u00a0€'],
  ['1\u202f234\u202f567,89\u00a0€', '1\u202f234\u202f568\u00a0€'],
  ['R$\u00a012.345,67', 'R$\u00a012.346'],
  ['R\u00a012\u00a0345,67', 'R\u00a012\u00a0346'],
  ['$9,007,199,254,740,993.97', '$9,007,199,254,740,994'],
  ['¥123,456', '¥123,456'],
  ['Your cost is £12.50. Cash: £9,999.00.', 'Your cost is £13. Cash: £9,999.'],
  ['£10.50 100 followers', '£11 100 followers'],
  ['0.25% fatal risk · 2.00% injury', '<1% fatal risk · 2% injury'],
  ['33.33% · -1.75%', '33% · -2%'],
  ['2.5 bathrooms · 1,234.56 units', '3 bathrooms · 1,235 units'],
  ['1.234 units', '1 units'],
  ['3.123', '3.123'],
  ['Bought 1.001 ORBIT', 'Bought 1 ORBIT'],
  ['Sold 2.567 ORBIT', 'Sold 3 ORBIT'],
  [
    'Version 57.0.31, file.txt, Model2.5, 2026-10-23',
    'Version 57.0.31, file.txt, Model2.5, 2026-10-23',
  ],
])('%s displays as %s', (input, expected) =>
  expect(displayText(input)).toBe(expected),
);

test.each(countryCodes)(
  '%s keeps local grouping and currency placement with whole prices',
  (country) => {
    const { locale, currency } = countries[country],
      digits = currencyDigits[currency];
    for (const minor of [312312345n, -312312350n, 0n]) {
      const expected = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Number(minor) / 10 ** digits);
      expect(displayText(formatMoney({ minor, currency }, locale))).toBe(
        expected,
      );
    }
  },
);

test('whole holdings retain their exact editable quantity and accounting', () => {
  expect(displayQuantity('0.000001')).toBe('<1');
  expect(displayQuantity('1.234')).toBe('1');
  expect(displayQuantity('12345.500001')).toBe('12,346');
  expect(displayQuantity('-1234')).toBe('-1,234');
  expect(displayQuantity('9007199254740993.5')).toBe('9,007,199,254,740,994');
  const amount = parseMoney('3123123.45', 'GBP');
  expect(displayText(formatMoney(amount, 'en-GB'))).toBe('£3,123,123');
  expect(amount.minor).toBe(312312345n);
  expect(formatMoney(amount, 'en-GB')).toBe('£3,123,123.45');
});

test('native text handles nested fragments, numbers and accessible labels without changing input values', () => {
  render(
    <>
      <DisplayText accessibilityLabel="Balance £12.50">
        <>
          Balance {'£12.50'} · {2.5}
        </>
      </DisplayText>
      <TextInput accessibilityLabel="Exact trade quantity" value="0.123456" />
    </>,
  );
  expect(screen.getByText('Balance £13 · 3')).toBeOnTheScreen();
  expect(screen.getByLabelText('Balance £13')).toBeOnTheScreen();
  expect(screen.getByLabelText('Exact trade quantity').props.value).toBe(
    '0.123456',
  );
  expect(displayNumber(2026)).toBe(2026);
  expect(displayNumber(0.25)).toBe('<1');
});
