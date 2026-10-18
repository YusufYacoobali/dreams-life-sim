import type { World } from '../model';
import { countries } from '../countries';
import { businessCatalog } from '../content/businesses';
import { roundRatio } from '../money';
const compare = (a: World['date'], b: World['date']) => a.year - b.year || a.month - b.month || a.day - b.day;
export function validateBusinesses(world: World) {
  const month = world.date.year * 12 + world.date.month - 1, companies = new Map(world.businesses.map(item => [item.id, item])), payables = new Map(world.businessPayables.map(item => [item.id, item])), histories = new Map(world.workHistory.map(item => [item.id, item]));
  if (companies.size !== world.businesses.length || payables.size !== world.businessPayables.length) throw new Error('Duplicate company identity');
  const cash = new Map<string, bigint>(), debt = new Map<string, bigint>(), payroll = new Map<string, bigint>(), contribution = new Map<string, bigint>(), firstCapital = new Map<string, bigint>(), transactions = new Set<string>();
  for (const entry of world.businessLedger) {
    const company = companies.get(entry.businessId), payable = entry.payableId && payables.get(entry.payableId), history = entry.employmentId && histories.get(entry.employmentId);
    if (transactions.has(entry.id) || !company || entry.currency !== company.currency || compare(entry.date, company.started) < 0 || compare(entry.date, world.date) > 0 || company.ended && compare(entry.date, company.ended) > 0 || entry.personId && !world.people[entry.personId] || entry.payableId && (!payable || payable.businessId !== company.id) || entry.debtDelta !== 0n && !entry.payableId || entry.employmentId && (!history || history.companyId !== company.id || entry.personId && history.personId !== entry.personId)) throw new Error('Invalid corporate ledger reference');
    transactions.add(entry.id); cash.set(company.id, (cash.get(company.id) ?? 0n) + entry.cashDelta);
    if (entry.payableId) debt.set(entry.payableId, (debt.get(entry.payableId) ?? 0n) + entry.debtDelta);
    if (entry.employmentId && entry.personId && entry.cashDelta < 0n && ['payroll', 'severance', 'payable-payment'].includes(entry.category)) payroll.set(entry.employmentId, (payroll.get(entry.employmentId) ?? 0n) - entry.cashDelta);
    if (entry.category === 'capital-contribution') { if (entry.cashDelta <= 0n) throw new Error('Invalid company capital contribution'); contribution.set(company.id, (contribution.get(company.id) ?? 0n) + entry.cashDelta); if (!firstCapital.has(company.id)) firstCapital.set(company.id, entry.cashDelta); }
  }
  for (const payable of payables.values()) {
    const company = companies.get(payable.businessId), history = payable.employmentId && histories.get(payable.employmentId);
    if (!company || payable.currency !== company.currency || payable.principal !== (debt.get(payable.id) ?? 0n) || payable.creditorId && (!world.people[payable.creditorId] || !world.accounts.some(account => account.ownerId === payable.creditorId && account.currency === payable.currency)) || payable.kind === 'wages' && (!history || history.companyId !== company.id || payable.creditorId && history.personId !== payable.creditorId) || payable.kind !== 'wages' && (payable.creditorId || payable.employmentId) || company.status !== 'active' && payable.principal) throw new Error('Invalid company obligation');
  }
  const staffJobs = new Set<string>();
  for (const company of companies.values()) {
    const founder = world.people[company.founderId], owner = company.ownerId && world.people[company.ownerId], active = company.status === 'active', observed = [...company.months, ...company.archives], startMonth = company.started.year * 12 + company.started.month - 1;
    if (!/^business_[a-zA-Z0-9_-]+$/.test(company.id) || world.assets.some(item => item.id === company.id) || !founder || compare(company.started, founder.born) < 0 || compare(company.started, world.date) > 0 || company.currency !== countries[company.country].currency || company.cash !== (cash.get(company.id) ?? 0n) || company.lastMonth > month || company.lastMonth < startMonth || active && (!owner || owner.died || company.ended || company.lastMonth !== month) || !active && (company.ownerId || !company.ended || company.cash || company.equipment || company.ownerOperated) || company.ended && (compare(company.ended, company.started) < 0 || compare(company.ended, world.date) > 0) || company.monthsOperated !== company.lastMonth - startMonth || company.monthsOperated !== company.months.length + company.archives.reduce((sum, item) => sum + item.months, 0) || company.cumulativeProfit !== observed.reduce((sum, item) => sum + item.profit, 0n)) throw new Error('Invalid company state');
    const initial = firstCapital.get(company.id); if (!initial || company.costBasis !== (contribution.get(company.id) ?? 0n) + roundRatio(initial * 200n, 10000n)) throw new Error('Company investment basis does not reconcile');
    if (new Set(company.months.map(item => item.month)).size !== company.months.length || new Set(company.archives.map(item => item.year)).size !== company.archives.length || company.months.some((item, index) => item.month > company.lastMonth || item.month <= startMonth || index > 0 && item.month <= company.months[index - 1].month || item.profit !== item.revenue - item.expenses || item.payroll > item.expenses || item.tax > item.expenses) || company.archives.some(item => item.year < company.started.year || item.year > world.date.year || item.months > 12 || item.profit !== item.revenue - item.expenses || item.payroll > item.expenses || item.tax > item.expenses)) throw new Error('Invalid company performance history');
    let managers = 0, liveStaff = 0;
    for (const member of company.staff) {
      const person = world.people[member.personId], history = histories.get(member.employmentId);
      if (!person || staffJobs.has(member.employmentId) || !history || history.personId !== person.id || history.companyId !== company.id || compare(member.hired, company.started) < 0 || compare(member.hired, history.started) !== 0 || compare(member.hired, world.date) > 0 || !!member.ended !== !!history.ended || member.ended && history.ended && compare(member.ended, history.ended) !== 0 || !member.ended && (!active || person.died || person.employment?.id !== member.employmentId || person.employment.companyId !== company.id) || member.role === 'manager' && history.roleId !== 'administrator' || member.role === 'worker' && history.roleId !== businessCatalog[company.kind].workerRole) throw new Error('Invalid actual company staff');
      staffJobs.add(member.employmentId); if (!member.ended) { liveStaff++; if (member.role === 'manager') managers++; }
    }
    if (liveStaff > company.locations * 2 + 1 || managers > 1 || company.ownerOperated && (!owner || !company.staff.some(member => member.personId === owner.id && !member.ended && owner.employment?.id === member.employmentId))) throw new Error('Invalid company management capacity');
  }
  for (const history of world.workHistory) if (history.companyId && (!companies.has(history.companyId) || !staffJobs.has(history.id) || history.grossEarned !== (payroll.get(history.id) ?? 0n))) throw new Error('Company pay is not funded by its actual cash book');
  for (const person of Object.values(world.people)) if (person.employment?.companyId && histories.get(person.employment.id)?.companyId !== person.employment.companyId) throw new Error('Employment has an inconsistent company source');
}
