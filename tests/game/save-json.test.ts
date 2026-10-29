import { createLife, randomCreation } from '../../src/game/createLife';
import { decodeWorld, encodeWorld, validateWorld } from '../../src/game/model';

const world = createLife('life_json', 42, randomCreation(42), { year: 2026, month: 10, day: 19 });
const base = encodeWorld(world);
function original(text: string) {
  return validateWorld(JSON.parse(text, (_key, value: unknown) => {
    if (value && typeof value === 'object' && Object.keys(value).length === 1 && '$dreamsBigInt' in value) {
      const amount = (value as { $dreamsBigInt: unknown }).$dreamsBigInt;
      if (typeof amount !== 'string' || !/^-?\d{1,128}$/.test(amount)) throw new Error('Invalid money encoding');
      return BigInt(amount);
    }
    return value;
  }));
}

test('the container-only decoder matches the original reviver for nested markers and still validates unknown fields before stripping them', () => {
  const amounts = ['0', '-0', '0000123', '-456', '9'.repeat(128), '', '+1', '1.5', '1e9', '9'.repeat(129), 1, null, {}, []];
  for (const amount of amounts) for (const extra of [
    { $dreamsBigInt: amount }, [{ $dreamsBigInt: amount }],
    { nested: [null, true, 'literal', 123, { deeper: { $dreamsBigInt: amount } }] },
    { $dreamsBigInt: amount, another: 'ordinary object' },
    { $dreamsBigInt: { $dreamsBigInt: amount } },
  ]) {
    const value = JSON.parse(base); value.extra = extra; const text = JSON.stringify(value);
    let expected: ReturnType<typeof original>;
    try { expected = original(text); } catch { expect(() => decodeWorld(text)).toThrow(); continue; }
    expect(decodeWorld(text)).toEqual(expected);
  }
});

test('arbitrary-size positive and negative money remains exact through the real world decoder', () => {
  for (const amount of [0n, 900719925474099399n, BigInt('9'.repeat(128))]) {
    const next = validateWorld(world);
    next.accounts[0].cash = amount; next.accounts[0].openingCash = amount;
    expect(decodeWorld(encodeWorld(next))).toEqual(next);
  }
  // A negative historical cash movement stays a bigint rather than a rounded Number.
  const next = validateWorld(world), account = next.accounts[0];
  account.cash = 0n; account.openingCash = 900719925474099399n;
  next.ledger.push({ id: 'txn_exact', personId: account.ownerId, accountId: account.id, liabilityId: null, year: next.date.year, month: next.date.month, currency: account.currency, cashDelta: -account.openingCash, debtDelta: 0n, category: 'purchase', description: 'Exact historical payment' });
  expect(decodeWorld(encodeWorld(next))).toEqual(next);
});

test('a JSON prototype-named field is ordinary data and cannot modify application prototypes', () => {
  const text = base.slice(0, -1) + ',"__proto__":{"polluted":{"$dreamsBigInt":"1"}}}';
  expect(decodeWorld(text)).toEqual(world);
  expect(({} as Record<string, unknown>).polluted).toBeUndefined();
});
