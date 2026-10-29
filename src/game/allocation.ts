/** Largest-remainder apportionment: all minor units are assigned once, stable ties by identity. */
export function apportion(total: bigint, shares: { personId: string; weight: bigint }[]): Map<string, bigint> {
  const positive = shares.filter(item => item.weight > 0n), weight = positive.reduce((sum, item) => sum + item.weight, 0n);
  if (!weight) return new Map();
  const rows = positive.map(item => ({ ...item, amount: total * item.weight / weight, remainder: total * item.weight % weight }));
  let left = total - rows.reduce((sum, item) => sum + item.amount, 0n);
  rows.sort((a, b) => a.remainder === b.remainder ? a.personId < b.personId ? -1 : a.personId > b.personId ? 1 : 0 : a.remainder > b.remainder ? -1 : 1);
  for (const row of rows) if (left > 0n) { row.amount++; left--; }
  return new Map(rows.map(item => [item.personId, item.amount]));
}
