import type { World } from './model';

type Row = World['ledger'][number];
const reusable = new WeakMap<Row, { rows: World['ledger']; index: LedgerIndex }>();
/** Mutable callers build a fresh index. Certified frozen rows can reuse exact reference matches. */
export function indexLedger(rows: World['ledger'], certified = false) {
  const cached = rows.length && certified ? reusable.get(rows[0]) : undefined;
  if (cached && (cached.rows === rows || cached.rows.length === rows.length && rows.every((row, index) => row === cached.rows[index]))) return cached.index;
  const transactions = new Map<string, Row>(), byCategory = new Map<string, Row[]>();
  const cashChanges = new Map<string, bigint>(), debtChanges = new Map<string, bigint>();
  const accountReferences = new Map<string, { ownerId: string; currency: Row['currency'] }>(), debtCurrencies = new Map<string, Row['currency']>();
  let consistent = true;
  for (const row of rows) {
    const account = accountReferences.get(row.accountId), debtCurrency = row.liabilityId ? debtCurrencies.get(row.liabilityId) : undefined;
    if (transactions.has(row.id) || account && (account.ownerId !== row.personId || account.currency !== row.currency) || debtCurrency && debtCurrency !== row.currency || !row.liabilityId && row.debtDelta !== 0n) consistent = false;
    if (!account) accountReferences.set(row.accountId, { ownerId: row.personId, currency: row.currency });
    cashChanges.set(row.accountId, (cashChanges.get(row.accountId) ?? 0n) + row.cashDelta);
    if (row.liabilityId) {
      debtCurrencies.set(row.liabilityId, row.currency);
      debtChanges.set(row.liabilityId, (debtChanges.get(row.liabilityId) ?? 0n) + row.debtDelta);
    }
    transactions.set(row.id, row);
    const category = byCategory.get(row.category);
    if (category) category.push(row); else byCategory.set(row.category, [row]);
  }
  let positioned: Map<string, { row: Row; index: number }> | undefined;
  return {
    transactions, cashChanges, debtChanges, accountReferences, debtCurrencies, consistent,
    get positioned() {
      if (!positioned) {
        positioned = new Map();
        for (let index = 0; index < rows.length; index++) {
          const row = rows[index];
          positioned.set(row.id, { row, index });
        }
      }
      return positioned;
    },
    categories: (...names: string[]) => names.flatMap(name => byCategory.get(name) ?? []),
  };
}
// Explicit shape avoids a recursive inferred return type through the weak cache.
export type LedgerIndex = {
  transactions: Map<string, Row>; cashChanges: Map<string, bigint>; debtChanges: Map<string, bigint>;
  accountReferences: Map<string, { ownerId: string; currency: Row['currency'] }>; debtCurrencies: Map<string, Row['currency']>; consistent: boolean;
  readonly positioned: Map<string, { row: Row; index: number }>;
  categories: (...names: string[]) => Row[];
};
/** Called only after full world validation and recursive freezing. */
export function rememberLedgerIndex(rows: World['ledger'], index: LedgerIndex): void {
  if (rows.length && Object.isFrozen(rows) && rows.every(row => Object.isFrozen(row))) reusable.set(rows[0], { rows, index });
}
