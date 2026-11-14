import { indexLedger, rememberLedgerIndex } from '../../src/game/ledgerIndex';
import type { World } from '../../src/game/model';

type Row = World['ledger'][number];
const transaction = (id: string, cashDelta = 1n): Row => ({
  id, accountId: 'account_fixture', personId: 'person_fixture', liabilityId: null,
  year: 2026, month: 11, currency: 'USD', cashDelta, debtDelta: 0n,
  category: 'position-fixture', description: 'A recorded payment',
});

test('ordinary append IDs resolve exact positions and missing IDs stay absent', () => {
  const rows = [transaction('txn_2_0'), transaction('txn_3_1'), transaction('txn_3_2')];
  const ledger = indexLedger(rows);
  expect(ledger.consistent).toBe(true);
  for (const [index, row] of rows.entries()) {
    expect(ledger.positioned.has(row.id)).toBe(true);
    expect(ledger.positioned.get(row.id)).toEqual({ row, index });
    expect(ledger.positioned.get(row.id)).toBe(ledger.positioned.get(row.id));
  }
  expect(ledger.positioned.has('missing')).toBe(false);
  expect(ledger.positioned.get('missing')).toBeUndefined();
});

test.each([
  'legacy-receipt', 'txn_1_0', 'txn_1_0000', 'txn_1_-1', 'txn_1_1.5',
  'txn_1_NaN', 'txn_1_Infinity', 'txn_1_9007199254740993', 'txn_1_999999999999999999999999999999999999999999999999999999999999999',
])('a historical or misleading ID %s retains its actual array position', id => {
  const rows = [transaction('unrelated'), transaction(id), transaction('last')];
  const ledger = indexLedger(rows);
  expect(ledger.consistent).toBe(true);
  expect(ledger.positioned.get(id)).toEqual({ row: rows[1], index: 1 });
  expect(ledger.positioned.get('unrelated')).toEqual({ row: rows[0], index: 0 });
});

test('reordered rows retain their actual order rather than the positions encoded in their IDs', () => {
  const first = transaction('txn_5_0'), second = transaction('txn_5_1'), third = transaction('txn_6_2');
  const rows = [third, first, second], ledger = indexLedger(rows);
  expect(ledger.positioned.get(third.id)).toEqual({ row: third, index: 0 });
  expect(ledger.positioned.get(first.id)).toEqual({ row: first, index: 1 });
  expect(ledger.positioned.get(second.id)).toEqual({ row: second, index: 2 });
  expect(ledger.categories('position-fixture')).toEqual(rows);
});

test.each(['same object', 'different object'] as const)('duplicate IDs with the %s remain inconsistent and resolve the final recorded row', kind => {
  const first = transaction('txn_5_0'), duplicate = kind === 'same object' ? first : transaction(first.id, 2n);
  const rows = [first, transaction('middle'), duplicate], ledger = indexLedger(rows);
  expect(ledger.consistent).toBe(false);
  expect(ledger.transactions.get(first.id)).toBe(duplicate);
  expect(ledger.positioned.get(first.id)).toEqual({ row: duplicate, index: 2 });
  expect(ledger.cashChanges.get(first.accountId)).toBe(kind === 'same object' ? 3n : 4n);
});

test('certified unchanged arrays can reuse the index while mutable callers always obtain current positions', () => {
  const frozen = [Object.freeze(transaction('txn_1_0')), Object.freeze(transaction('txn_1_1'))];
  Object.freeze(frozen);
  const original = indexLedger(frozen);
  rememberLedgerIndex(frozen, original);
  expect(indexLedger(frozen, true)).toBe(original);
  expect(indexLedger([...frozen], true)).toBe(original);
  expect(original.positioned.get(frozen[1].id)).toEqual({ row: frozen[1], index: 1 });

  const mutable = [...frozen], initial = indexLedger(mutable);
  expect(initial).not.toBe(original);
  expect(initial.positioned.get(frozen[1].id)).toEqual({ row: frozen[1], index: 1 });
  mutable.reverse();
  const changed = indexLedger(mutable);
  expect(changed).not.toBe(initial);
  expect(changed.positioned.get(frozen[1].id)).toEqual({ row: frozen[1], index: 0 });
  mutable.push(transaction('historical_append'));
  expect(indexLedger(mutable).positioned.get('historical_append')).toEqual({ row: mutable[2], index: 2 });
});
