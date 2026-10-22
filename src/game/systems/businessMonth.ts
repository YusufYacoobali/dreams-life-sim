import { activeTrip } from './travelSchemas';
import { ageOn, World } from '../model';
import { Business } from '../businessValuation';
import { businessCatalog, businessOfferings } from '../content/businesses';
import { jobs } from '../content/jobs';
import { rules, monthlyAmount } from '../rules';
import { roundRatio } from '../money';
import { offerPending } from '../pendingQueue';
import { bounded, draw, fact } from './common';
import { offerDramaticEvent } from './dramaticOffers';
import { activeBusinessStaff, availableBusinessProfit, businessManager, businessReserve, improvementQuote, payBusinessDividend } from './businesses';
import { businessBook, businessCost, settleBusinessPayables } from './businessCore';
import { employmentMonth } from './work';
import { hospitalized } from './healthSchemas';
import { isConfined } from './legalSchemas';
import { exitBusiness } from './businessLifecycle';
const absolute = (world: World) => world.date.year * 12 + world.date.month - 1;
function archiveMonths(company: Business) {
  while (company.months.length > 60) {
    const record = company.months.shift()!, year = Math.floor(record.month / 12); let archive = company.archives.find(item => item.year === year);
    if (!archive) { archive = { year, months: 0, revenue: 0n, expenses: 0n, profit: 0n, payroll: 0n, tax: 0n }; company.archives.push(archive); }
    archive.months++; archive.revenue += record.revenue; archive.expenses += record.expenses; archive.profit += record.profit; archive.payroll += record.payroll; archive.tax += record.tax;
  }
}
export function businessMonth(world: World) {
  const month = absolute(world);
  for (const company of world.businesses.filter(item => item.status === 'active')) {
    if (company.lastMonth >= month) continue;
    if (company.lastMonth !== month - 1) throw new Error('Company history must advance one recorded month at a time');
    company.lastMonth = month;
    const owner = world.people[company.ownerId!], definition = businessCatalog[company.kind], staff = activeBusinessStaff(world, company), manager = businessManager(world, company), base = rules[company.country].baseWage;
    // A minor's existing manager may fund essential upkeep from company cash, never the child's trust.
    if (ageOn(owner, world.date) < rules[owner.country].adultAge && manager && company.condition < 40 && company.cash >= improvementQuote(company) + businessReserve(world, company)) {
      const cost = improvementQuote(company), equipment = roundRatio(cost * 8000n, 10000n); businessBook(world, company, -cost, 0n, 'essential-upkeep', 'Manager authorised essential inherited-company upkeep'); company.equipment += equipment; company.pendingExpenses += cost - equipment; company.condition = bounded(company.condition + 25);
    }
    let capacityBps = 0, quality = 0, availablePeople = 0, leadership = false;
    const job = jobs.find(item => item.id === definition.workerRole)!;
    for (const member of staff) {
      const person = world.people[member.personId], employment = person.employment!;
      if (activeTrip(world, person.id) || isConfined(world, person) || person.legal.wanted || hospitalized(world, person) || person.country !== company.country || person.city !== company.city) continue;
      if (member.role === 'manager' || person.id === owner.id && company.ownerOperated) leadership = true;
      const qualified = !job.qualification || person.education.qualifications.some(item => item.level === job.qualification && (!job.field || item.field === job.field));
      if (!qualified) continue;
      const score = Math.round((employment.performance + person.stats.smarts) / 2), weight = member.role === 'manager' ? 7500 : 10000;
      capacityBps += Math.round((7000 + score * 60) * weight / 10000); quality += score; availablePeople++;
    }
    const capacity = Math.max(0, Math.floor(1000 * capacityBps * (100 + company.facilities * 8) * (50 + company.condition / 2) * (leadership ? 1 : 0.35) / 100000000));
    const market = draw(world, 'economy', 80, 120), image = owner.publicLife.image, publicFactor = image < 30 ? 7500 : 10000 + Math.floor(owner.stats.fame * image / 2), marketingFactor = company.marketing === 'regional' ? 12500 : company.marketing === 'local' ? 11000 : 10000;
    const demand = Number(roundRatio(1600n * BigInt(company.locations) * BigInt(7500 + company.reputation * 50) * BigInt(publicFactor) * BigInt(marketingFactor) * BigInt(market) * 100000000n, 10000n * 10000n * 10000n * 100n * BigInt(company.priceBps) * BigInt(company.priceBps)));
    // Absence and the standard focus retain the original arithmetic and draws.
    const offering = company.offering && company.offering !== 'standard' ? businessOfferings[company.kind][company.offering] : undefined;
    const customers = Math.min(capacity, Math.max(0, offering ? Math.floor(demand * offering.demandBps / 10000) : demand));
    const baseSales = roundRatio(base * BigInt(definition.revenueBps) * BigInt(customers), 120000000n), standardRevenue = roundRatio(baseSales * BigInt(company.priceBps), 10000n), standardSupplies = roundRatio(baseSales * BigInt(definition.variableCostBps), 10000n);
    const revenue = offering ? roundRatio(standardRevenue * BigInt(offering.revenueBps), 10000n) : standardRevenue, supplies = offering ? roundRatio(standardSupplies * BigInt(offering.suppliesBps), 10000n) : standardSupplies;
    if (revenue) businessBook(world, company, revenue, 0n, 'sales', 'Delivered customer orders');
    settleBusinessPayables(world, company);
    const fixed = monthlyAmount(roundRatio(base * BigInt(definition.fixedCostBps) * BigInt(company.locations), 10000n), company.monthsOperated), marketing = monthlyAmount(roundRatio(base * BigInt(company.marketing === 'regional' ? 1200 : company.marketing === 'local' ? 300 : 0), 10000n), company.monthsOperated);
    businessCost(world, company, supplies, 'supplies', 'Materials for delivered orders', 'supplier'); businessCost(world, company, fixed, 'premises', 'Premises and utilities', 'supplier'); businessCost(world, company, marketing, 'marketing', 'Monthly promotion', 'supplier');
    let payroll = company.pendingPayroll;
    for (const member of staff) {
      const person = world.people[member.personId];
      if (person.country !== company.country || person.city !== company.city || person.employment?.id !== member.employmentId) continue;
      payroll += employmentMonth(world, person, (due, employmentId) => businessCost(world, company, due, 'payroll', 'Employment wages', 'wages', person.id, employmentId).paid);
    }
    const beforeTax = revenue - supplies - fixed - marketing - payroll - company.pendingExpenses, tax = beforeTax > 0n ? roundRatio(beforeTax * 1500n, 10000n) : 0n;
    businessCost(world, company, tax, 'corporate-tax', 'Tax on positive operating profit', 'tax'); const profit = beforeTax - tax, expenses = supplies + fixed + marketing + payroll + company.pendingExpenses + tax;
    company.pendingExpenses = 0n; company.pendingPayroll = 0n; company.cumulativeProfit += profit; company.monthsOperated++;
    company.equipment = roundRatio(company.equipment * 9950n, 10000n); if (company.monthsOperated % 6 === 0) company.condition = bounded(company.condition - 2);
    const service = availablePeople ? quality / availablePeople : 0, satisfaction = service + company.condition / 5 + company.facilities * 3 - (company.priceBps - 10000) / 200;
    company.reputation = bounded(company.reputation + (customers ? satisfaction >= 75 ? 1 : satisfaction < 45 ? -2 : 0 : -2));
    const arrears = world.businessPayables.some(item => item.businessId === company.id && item.principal > 0n); company.distressMonths = arrears ? company.distressMonths + 1 : 0;
    if (!arrears && profit > 0n && company.payoutBps) { const requested = roundRatio(profit * BigInt(company.payoutBps), 10000n), available = availableBusinessProfit(world, company); payBusinessDividend(world, company, requested < available ? requested : available); }
    company.months.push({ month, revenue, expenses, profit, payroll, tax, cash: company.cash, customers, ...(company.offering ? { offering: company.offering } : {}) }); archiveMonths(company);
    if (company.distressMonths >= 3) {
      exitBusiness(world, company, 'failure');
      if (owner.id === world.activePersonId) { offerPending(world, { kind: 'result', id: 'business_failure_' + company.id, title: 'The business has closed', body: company.name + ' has run out of time after three consecutive periods of unpaid bills. Its assets have been liquidated, creditors paid where possible and unpaid claims recorded as losses. The company has failed.', illustration: 'business', effects: [] }, 80); if (world.annual?.stage === 'months') world.annual.pausedForPlanning = true; }
    } else if (company.distressMonths === 1 && owner.id === world.activePersonId) {
      if (offerDramaticEvent(world, 'dramatic-unpaid-employees', 75, 'business_warning_' + company.id + '_' + month, company.id)) continue;
      fact(world, company.name + ' developed unpaid operating obligations.', 'business'); offerPending(world, { kind: 'result', id: 'business_warning_' + company.id + '_' + month, title: 'Cash flow under pressure', body: company.name + ' cannot cover all its bills. Being the boss has become a funding problem. Review cash, staff and prices before continuing; three consecutive periods of unpaid obligations trigger liquidation.', illustration: 'business', effects: [] }, 75); if (world.annual?.stage === 'months') world.annual.pausedForPlanning = true;
    }
  }
}
