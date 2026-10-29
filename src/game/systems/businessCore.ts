import type { World } from '../model';
import type { Business } from '../businessValuation';
import { businessDebtOrder } from '../businessValuation';
import { IneligibleAction } from '../errors';
import { employmentBackPay } from './work';
import { apportion } from '../allocation';
export function businessBook(world: World, company: Business, cashDelta: bigint, debtDelta: bigint, category: string, description: string, payableId: string | null = null, personId: string | null = null, employmentId: string | null = null) {
  if (company.cash + cashDelta < 0n) throw new IneligibleAction('The company cannot cover this payment');
  company.cash += cashDelta;
  world.businessLedger.push({ id: 'business_txn_' + world.revision + '_' + world.businessLedger.length, businessId: company.id, personId, employmentId, date: { ...world.date }, currency: company.currency, cashDelta, debtDelta, payableId, category, description });
}
export function businessCost(world: World, company: Business, amount: bigint, category: string, description: string, kind: 'wages' | 'supplier' | 'tax', creditorId: string | null = null, employmentId: string | null = null) {
  if (amount < 0n) throw new Error('Negative company cost');
  const paid = company.cash < amount ? company.cash : amount, unpaid = amount - paid;
  let payableId: string | null = null;
  if (unpaid) {
    payableId = 'payable_' + company.id + '_' + kind + '_' + (creditorId ?? category) + '_' + (employmentId ?? 'external'); let payable = world.businessPayables.find(item => item.id === payableId);
    if (!payable) { payable = { id: payableId, businessId: company.id, creditorId, employmentId, kind, currency: company.currency, principal: 0n, writtenOff: 0n }; world.businessPayables.push(payable); }
    payable.principal += unpaid;
  }
  if (paid || unpaid) businessBook(world, company, -paid, unpaid, category, description, payableId, creditorId, employmentId);
  return { paid, unpaid };
}
export function settleBusinessPayables(world: World, company: Business, proRata = false) {
  const payables = world.businessPayables.filter(item => item.businessId === company.id && item.principal > 0n).sort((a, b) => businessDebtOrder[a.kind] - businessDebtOrder[b.kind]);
  const payments: { payable: World['businessPayables'][number]; paid: bigint }[] = [];
  let available = company.cash;
  for (const priority of [0, 1, 2]) {
    const group = payables.filter(item => businessDebtOrder[item.kind] === priority), due = group.reduce((sum, item) => sum + item.principal, 0n), budget = available < due ? available : due;
    if (proRata) { const allocated = apportion(budget, group.map(item => ({ personId: item.id, weight: item.principal }))); for (const payable of group) payments.push({ payable, paid: allocated.get(payable.id) ?? 0n }); }
    else { let remaining = budget; for (const payable of group) { const paid = payable.principal < remaining ? payable.principal : remaining; payments.push({ payable, paid }); remaining -= paid; } }
    available -= budget;
  }
  for (const { payable, paid } of payments) {
    if (!paid) continue;
    payable.principal -= paid; businessBook(world, company, -paid, -paid, 'payable-payment', 'Outstanding ' + payable.kind + ' paid', payable.id, payable.creditorId, payable.employmentId);
    if (payable.creditorId) { const person = world.people[payable.creditorId]; if (person.died || !payable.employmentId) throw new Error('Unsettled wage creditor identity'); employmentBackPay(world, person, payable.employmentId, paid); }
  }
}
export function writeOffBusinessPayables(world: World, company: Business) {
  for (const payable of world.businessPayables.filter(item => item.businessId === company.id && item.principal > 0n)) { const unpaid = payable.principal; payable.principal = 0n; payable.writtenOff += unpaid; businessBook(world, company, 0n, -unpaid, 'payable-writeoff', 'Unpaid ' + payable.kind + ' written off after liquidation', payable.id, payable.creditorId); }
}
