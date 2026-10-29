import type { World } from './model';
import { apportion } from './allocation';
import { roundRatio } from './money';
export type Business = World['businesses'][number];
export const businessDebtOrder = { tax: 0, wages: 1, supplier: 2 } as const;
export function businessGoodwill(company: Business): bigint {
  if (company.status !== 'active' || company.monthsOperated < 12) return 0n;
  const profit = company.months.slice(-12).reduce((sum, item) => sum + item.profit, 0n), cap = company.costBasis * 3n;
  return profit <= 0n ? 0n : profit < cap ? profit : cap;
}
export function businessValue(world: World, company: Business): bigint {
  if (company.status !== 'active') return 0n;
  const debts = (world.businessPayables ?? []).filter(item => item.businessId === company.id).reduce((sum, item) => sum + item.principal, 0n);
  const equity = company.cash + company.equipment + businessGoodwill(company) - debts; return equity > 0n ? equity : 0n;
}
export function businessSaleQuote(world: World, company: Business, mode: 'sale' | 'close' | 'failure' = 'sale') {
  const price = mode === 'sale' ? company.equipment + businessGoodwill(company) : roundRatio(company.equipment * BigInt(mode === 'failure' ? 50 : 70), 100n), fee = roundRatio(price * 500n, 10000n);
  const debt = (world.businessPayables ?? []).filter(item => item.businessId === company.id).reduce((sum, item) => sum + item.principal, 0n), pool = company.cash + price - fee;
  return { price, fee, debt, proceeds: pool > debt ? pool - debt : 0n, pool };
}
/** Unfunded wages cannot manufacture a valuable claim against an insolvent company. */
export function businessRecoveries(world: World, company: Business) {
  const result = new Map<string, bigint>(); let available = businessSaleQuote(world, company).pool;
  const payables = (world.businessPayables ?? []).filter(item => item.businessId === company.id && item.principal > 0n);
  for (const priority of [0, 1, 2]) {
    const group = payables.filter(item => businessDebtOrder[item.kind] === priority), due = group.reduce((sum, item) => sum + item.principal, 0n), paid = available < due ? available : due;
    for (const [id, value] of apportion(paid, group.map(item => ({ personId: item.id, weight: item.principal })))) result.set(id, value);
    available -= paid;
  }
  return result;
}
export function companyClaimValue(world: World, payable: World['businessPayables'][number]): bigint {
  const company = (world.businesses ?? []).find(item => item.id === payable.businessId);
  return company && payable.principal ? businessRecoveries(world, company).get(payable.id) ?? 0n : 0n;
}
