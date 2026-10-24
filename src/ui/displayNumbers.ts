// Presentation only. Money, quantities, rates and saved prose retain their
// original precision; never feed these labels back into a game command.
import { displayPlatformNames } from './platformText';
const currency =
  '(?:[A-Z]{0,3}\\$|[£€₹¥￥]|R(?![A-Za-z])|(?:USD|CAD|GBP|AUD|EUR|BRL|INR|JPY|ZAR)(?![A-Za-z]))';
const amount = '[+−-]?\\d(?:[\\d.,\\u00a0\\u202f]*\\d)?';
const monetary =
  '[+−-]?' + currency + '\\s*' + amount + '|' + amount + '\\s*' + currency;
const decimal = '[+−-]?\\d+(?:,\\d{3})*\\.\\d+(?:\\s*%)?';
const displayedNumber = new RegExp('(' + monetary + ')|(' + decimal + ')', 'g');
const letterOrDigit = /[A-Za-z0-9_\.]/;

function grouped(integer: bigint, original: string, defaultSeparator = '') {
  const separator = original.match(/\d([^\d]+)\d/)?.[1] ?? defaultSeparator;
  const groups = original.split(/[^\d]+/);
  const primary = groups.length > 1 ? groups.at(-1)!.length : 3;
  const secondary = groups.length > 2 ? groups.at(-2)!.length : primary;
  if (!separator || !primary || !secondary) return integer.toString();
  const chunks: string[] = [];
  let remaining = integer.toString(),
    width = primary;
  while (remaining.length > width) {
    chunks.unshift(remaining.slice(-width));
    remaining = remaining.slice(0, -width);
    width = secondary;
  }
  return [remaining, ...chunks].join(separator);
}

function whole(integer: string, fraction: string, defaultSeparator = '') {
  const absolute = BigInt(integer.replace(/[^\d]/g, '') || '0');
  if (absolute === 0n && /[1-9]/.test(fraction)) return '<1';
  const rounded = absolute + (fraction[0] >= '5' ? 1n : 0n);
  return grouped(rounded, integer, defaultSeparator);
}

function wholeMoney(text: string) {
  // The final two digits are cents/pence. A three-digit final group is a
  // thousands separator, including continental and Indian currency labels.
  const match = /\d(?:[\d.,\u00a0\u202f]*\d)?/.exec(text);
  if (!match) return text;
  const number = match[0],
    fraction = /([.,])(\d{2})$/.exec(number);
  if (!fraction) return text;
  const integer = number.slice(0, fraction.index);
  const value = whole(integer, fraction[2], fraction[1] === '.' ? ',' : '');
  const before = text.slice(0, match.index),
    after = text.slice(match.index + number.length);
  // Keep < before the currency symbol, and retain an explicit payment sign.
  if (value === '<1' && before.trim()) {
    const sign = /^[+−-]/.exec(before)?.[0] ?? '';
    return sign + '<' + before.slice(sign.length) + '1' + after;
  }
  return before + value + after;
}

/** Whole read-only quantities; exact strings remain available to editable inputs. */
export function displayQuantity(value: string): string {
  const match = /^([+−-]?)(\d+)(?:\.(\d+))?$/.exec(value);
  if (!match) return displayText(value);
  if (!match[3]) return match[1] + grouped(BigInt(match[2]), match[2], ',');
  return match[1] + whole(match[2], match[3], ',');
}

/** Localised monetary strings, percentages and decimal prose, including old saves. */
export function displayText(value: string): string;
export function displayText(value: string | undefined): string | undefined;
export function displayText(value: string | undefined): string | undefined {
  if (value) value = displayPlatformNames(value);
  if (!value || !/[.,]/.test(value)) return value;
  return value.replace(
    displayedNumber,
    (
      match,
      money: string | undefined,
      number: string | undefined,
      offset: number,
    ) => {
      if (money) return wholeMoney(money);
      if (
        !number ||
        (offset > 0 && letterOrDigit.test(value[offset - 1])) ||
        (offset + match.length < value.length &&
          letterOrDigit.test(value[offset + match.length]))
      )
        return match;
      const parts = /^([+−-]?)(\d+(?:,\d{3})*)\.(\d+)(\s*%)?$/.exec(number)!;
      // A bare continental integer such as 3.123 is already a whole value.
      // Known fractional holdings use displayQuantity instead of guessing.
      const unit = /^\s*(?:units?|shares?|coins?)\b/i.test(
        value.slice(offset + match.length),
      );
      const trade = /(?:Bought|Sold|Quantity:?)\s*$/i.test(
        value.slice(0, offset),
      );
      if (
        parts[3].length === 3 &&
        !parts[4] &&
        parts[2] !== '0' &&
        !unit &&
        !trade
      )
        return match;
      const rounded = whole(parts[2], parts[3]);
      return parts[1] + rounded + (parts[4] ?? '');
    },
  );
}

export function displayNumber(value: number): number | string {
  if (!Number.isFinite(value) || Number.isInteger(value)) return value;
  if (value > 0 && value < 1) return '<1';
  if (value < 0 && value > -1) return '-<1';
  return Math.sign(value) * Math.round(Math.abs(value));
}
