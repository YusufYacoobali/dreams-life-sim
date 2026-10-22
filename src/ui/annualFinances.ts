import type { World } from '../game/model';
import type { Currency } from '../game/money';
import { roundRatio } from '../game/money';

type Transaction = World['ledger'][number];
export const financeSections = {
  income: 'Income', expenses: 'Expenses', taxes: 'Taxes', borrowing: 'Loans & debt',
  investments: 'Investment purchases & sales', assets: 'Owned goods purchases & sales',
  company: 'Company capital', transfers: 'Transfers & currency exchange',
  family: 'Gifts, inheritance & family payments', refunds: 'Refunds & claims',
  estate: 'Estate settlement', testing: 'God Mode adjustments', other: 'Other recorded activity',
} as const;
export type FinanceSection = keyof typeof financeSections;
const groups = Object.create(null) as Record<string, FinanceSection>;
const assign = (section: FinanceSection, categories: string[]) => categories.forEach(category => { groups[category] = section; });
assign('income', ['income', 'background-income', 'rent', 'dividend', 'creator-income', 'sponsorship', 'media-income', 'clinic-income', 'business-owner-income', 'career-royalties', 'creator-contract-income', 'royal-allowance', 'prison-pay']);
assign('expenses', ['living', 'background-living', 'npc-budget', 'tuition', 'maintenance', 'upkeep', 'insurance', 'sale-fee', 'loan-fee', 'skill-training', 'creator-agency', 'creator-contract-fee', 'adoption', 'prenatal-care', 'healthcare', 'exercise', 'lifestyle', 'hobby-event', 'legal-fee', 'court-fine', 'bribery-loss', 'group-fee', 'illicit-purchase', 'crime-loss', 'entertainment', 'hobby', 'music-production', 'pet-adoption', 'pet-vet', 'pet-care', 'campaign-spend', 'community-meeting', 'social', 'dating', 'wedding', 'npc-wedding', 'relocation-application', 'relocation-transport', 'royal-reception', 'royal-occasion', 'content-production', 'collaboration-production', 'public-event', 'charity', 'story-outing', 'pension-exchange-fee', 'travel']);
assign('taxes', ['tax', 'tax-refund', 'estate-tax']);
assign('expenses',['housing-rent']);
assign('borrowing', ['borrowing', 'repayment', 'interest', 'fine-reversal']);
assign('investments', ['investment', 'investment-sale']);
assign('assets', ['purchase', 'asset-sale']);
assign('company', ['business-investment', 'business-sale']);
assign('transfers', ['transfer', 'exchange', 'relocation-exchange', 'relocation-household', 'bail-held', 'bail-return']);
assign('family', ['gift', 'inheritance', 'settlement', 'child-support', 'restitution', 'family-collection', 'restitution-collection', 'repayment-received', 'estate-creditor-payment']);
assign('refunds', ['fine-refund', 'travel-refund', 'insurance-claim']);
assign('estate', ['estate-fx', 'estate-investment', 'estate-receivable', 'estate-asset-sale', 'estate-debt', 'estate-debt-close', 'estate-distribution', 'estate-charity']);
assign('testing', ['god-mode-adjustment']);
const labels: Record<string, string> = {
  'god-mode-adjustment': 'God Mode testing adjustment',
  income: 'Employment pay / pensions', 'background-income': 'Recorded background pay / pensions',
  rent: 'Rental receipts', 'housing-rent':'Home rent paid', dividend: 'Investment dividends', 'business-owner-income': 'Company profit payouts received',
  borrowing: 'Loan proceeds', repayment: 'Debt repayments', interest: 'Interest added to debt',
  'tax-refund': 'Income tax refunds', tax: 'Income tax paid / withheld', 'estate-tax': 'Estate tax',
  investment: 'Investment purchases', 'investment-sale': 'Investment sale proceeds', purchase: 'Owned goods purchases',
  'asset-sale': 'Asset sale proceeds', 'business-investment': 'Capital paid into companies', 'business-sale': 'Company sale / liquidation proceeds',
  'bail-held': 'Bail moved into escrow', 'bail-return': 'Bail returned from escrow',
};
export const financeCategoryLabel = (category: string) => Object.prototype.hasOwnProperty.call(labels, category) ? labels[category] : category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');
export type FinanceTotals = { received: bigint; paid: bigint; debtAdded: bigint; debtReduced: bigint; entries: readonly Transaction[] };
type Bucket = { rows: Transaction[]; sections: Map<FinanceSection, { rows: Transaction[]; categories: Map<string, Transaction[]> }> };
export type PersonalFinanceIndex = {
  personId: string; years: readonly number[]; currencies: readonly Currency[];
  currentMonth: number; observedFrom: number; buckets: ReadonlyMap<string, Bucket>;
  balances: ReadonlyMap<Currency, { cash: bigint; available: bigint; debt: bigint }>;
};
const cache = new WeakMap<World, Map<string, PersonalFinanceIndex>>();
const absolute = (date: World['date']) => date.year * 12 + date.month - 1;
const key = (year: number, currency: Currency) => year + ':' + currency;

/** Detail-only single ledger pass. Never combines currencies or corporate books. */
export function indexPersonalFinances(world: World, personId: string): PersonalFinanceIndex {
  const person = world.people[personId]; if (!person) throw new Error('Choose an existing person');
  const cached = Object.isFrozen(world) && cache.get(world)?.get(personId); if (cached) return cached;
  const years = new Set([world.date.year]), currencies = new Set<Currency>(), buckets = new Map<string, Bucket>(), balances = new Map<Currency, { cash: bigint; available: bigint; debt: bigint }>();
  let observedFrom = absolute(world.date);
  // Existing journal/receipt dates bound the saved observation window, not an
  // invented account-opening date for older generated contacts.
  for (const row of world.journal) observedFrom = Math.min(observedFrom, absolute(row.date));
  for (const row of world.ledger) {
    observedFrom = Math.min(observedFrom, row.year * 12 + row.month - 1);
    if (row.personId !== personId) continue;
    years.add(row.year); currencies.add(row.currency);
    const id = key(row.year, row.currency); let bucket = buckets.get(id);
    if (!bucket) { bucket = { rows: [], sections: new Map() }; buckets.set(id, bucket); }
    bucket.rows.push(row);
    const section = groups[row.category] ?? 'other'; let detail = bucket.sections.get(section);
    if (!detail) { detail = { rows: [], categories: new Map() }; bucket.sections.set(section, detail); }
    detail.rows.push(row);
    const entries = detail.categories.get(row.category); if (entries) entries.push(row); else detail.categories.set(row.category, [row]);
  }
  for (const account of world.accounts) if (account.ownerId === personId) {
    currencies.add(account.currency); const value = balances.get(account.currency) ?? { cash: 0n, available: 0n, debt: 0n };
    value.cash += account.cash; value.available += account.cash - account.lockedCash; balances.set(account.currency, value);
  }
  for (const debt of world.liabilities) if (debt.ownerId === personId) {
    currencies.add(debt.currency); const value = balances.get(debt.currency) ?? { cash: 0n, available: 0n, debt: 0n };
    value.debt += debt.principal; balances.set(debt.currency, value);
  }
  const index: PersonalFinanceIndex = { personId, years: [...years].sort((a, b) => b - a), currencies: [...currencies].sort(), currentMonth: absolute(world.date), observedFrom: Math.max(observedFrom, absolute(person.born)), buckets, balances };
  if (Object.isFrozen(world)) { let people = cache.get(world); if (!people) { people = new Map(); cache.set(world, people); } people.set(personId, index); }
  return index;
}
function totals(entries: readonly Transaction[]): FinanceTotals {
  let received = 0n, paid = 0n, debtAdded = 0n, debtReduced = 0n;
  for (const row of entries) { if (row.cashDelta > 0n) received += row.cashDelta; else paid -= row.cashDelta; if (row.debtDelta > 0n) debtAdded += row.debtDelta; else debtReduced -= row.debtDelta; }
  return { received, paid, debtAdded, debtReduced, entries };
}
/** Reuses the detail index when a reviewed year/currency or local section changes. */
export function annualFinanceSummary(index: PersonalFinanceIndex, year: number, currency: Currency) {
  if (!Number.isInteger(year) || !index.years.includes(year)) throw new Error('Choose a recorded financial year');
  const bucket = index.buckets.get(key(year, currency)), all = totals(bucket?.rows ?? []);
  const sections = (Object.keys(financeSections) as FinanceSection[]).flatMap(id => {
    const detail = bucket?.sections.get(id); if (!detail) return [];
    return [{ id, label: financeSections[id], ...totals(detail.rows), categories: [...detail.categories].map(([category, rows]) => ({ category, label: financeCategoryLabel(category), ...totals(rows) })) }];
  });
  const income = sections.find(row => row.id === 'income')?.received ?? 0n, expenses = sections.find(row => row.id === 'expenses')?.paid ?? 0n;
  const tax = sections.find(row => row.id === 'taxes'), months = Math.max(0, Math.min(year * 12 + 11, index.currentMonth) - Math.max(year * 12, index.observedFrom) + 1);
  return { year, currency, ...all, months, income, expenses, taxPaid: tax?.paid ?? 0n, taxRefunded: tax?.received ?? 0n, netCash: all.received - all.paid, sections,
    incomeAverage: months ? roundRatio(income, BigInt(months)) : null, expenseAverage: months ? roundRatio(expenses, BigInt(months)) : null,
    current: index.balances.get(currency) ?? { cash: 0n, available: 0n, debt: 0n } };
}
