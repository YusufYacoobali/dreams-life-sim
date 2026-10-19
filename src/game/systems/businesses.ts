import { publicRoyalDuty } from './royaltySchemas';
import { fullTimeCreator } from './creatorSchemas';
import { z } from 'zod';
import { ageOn, fullName, Person, World } from '../model';
import { businessCatalog, businessKinds, BusinessKind } from '../content/businesses';
import { jobs } from '../content/jobs';
import { Business, businessSaleQuote } from '../businessValuation';
import { countries } from '../countries';
import { rules } from '../rules';
import { formatMoney, roundRatio } from '../money';
import { fxMoney } from '../valuation';
import { IneligibleAction } from '../errors';
import { accountFor, active, availableCash, charge, draw, fact, post, result } from './common';
import { businessBook, businessCost } from './businessCore';
import { exitBusiness } from './businessLifecycle';
import { createContact, hireNpc } from './npcs';
import { employmentBackPay, endEmployment, salaryForPerson } from './work';
import { connectPerson, relationFor } from './relationships';
import { isConfined } from './legalSchemas';
import { recordingCommitment } from './musicSchemas';
import { campaignCommitment } from './politicsSchemas';
export const businessCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('start-business'), kind: z.enum(businessKinds), name: z.string().trim().min(1).max(50).refine(value => !/[\u0000-\u001F]/.test(value)), operation: z.enum(['owner', 'manager']), quotedCapital: z.bigint().positive() }),
  z.object({ type: z.literal('business-prices'), businessId: z.string(), priceBps: z.number().int().min(7500).max(15000) }),
  z.object({ type: z.literal('business-marketing'), businessId: z.string(), marketing: z.enum(['none', 'local', 'regional']) }),
  z.object({ type: z.literal('business-payout-policy'), businessId: z.string(), payoutBps: z.number().int().min(0).max(8000) }),
  z.object({ type: z.literal('hire-business-staff'), businessId: z.string(), role: z.enum(['worker', 'manager']), quotedPay: z.bigint().positive() }),
  z.object({ type: z.literal('dismiss-business-staff'), businessId: z.string(), employmentId: z.string() }),
  z.object({ type: z.literal('operate-business'), businessId: z.string(), operated: z.boolean() }),
  z.object({ type: z.literal('fund-business'), businessId: z.string(), amount: z.bigint().positive() }),
  z.object({ type: z.literal('improve-business'), businessId: z.string(), quotedCost: z.bigint().positive() }),
  z.object({ type: z.literal('expand-business'), businessId: z.string(), quotedCost: z.bigint().positive() }),
  z.object({ type: z.literal('withdraw-business-profit'), businessId: z.string(), amount: z.bigint().positive() }),
  z.object({ type: z.literal('sell-business'), businessId: z.string(), mode: z.enum(['sale', 'close']), quotedProceeds: z.bigint().nonnegative() }),
]);
export type BusinessCommand = z.infer<typeof businessCommandSchema>;
const absolute = (world: World) => world.date.year * 12 + world.date.month - 1;
export const activeBusinessStaff = (world: World, company: Business) => company.staff.filter(item => !item.ended && !world.people[item.personId].died && world.people[item.personId].employment?.id === item.employmentId);
export const businessManager = (world: World, company: Business) => activeBusinessStaff(world, company).find(item => item.role === 'manager' && !isConfined(world, item.personId) && !world.people[item.personId].legal.wanted);
export function businessStartupQuote(world: World, kind: BusinessKind) {
  const definition = businessCatalog[kind], currency = countries[active(world).country].currency, capital = roundRatio(rules[active(world).country].baseWage * BigInt(definition.capitalBps), 10000n), registration = roundRatio(capital * 200n, 10000n);
  return { capital, registration, total: capital + registration, currency };
}
export function ownerOperationReason(world: World, kind: BusinessKind): string | undefined {
  const person = active(world), role = jobs.find(item => item.id === businessCatalog[kind].workerRole)!;
  if (isConfined(world)) return 'You cannot operate a workplace from custody';
  if (person.legal.wanted) return 'Resolve your outstanding arrest before taking an operating role';
  if (person.employment) return 'Leave your current job before taking an operating role';
  if(publicRoyalDuty(world))return 'Choose a private royal life before operating a business';
  if(fullTimeCreator(world))return 'Switch your studio to part-time before operating a business';
  if(campaignCommitment(world))return 'Finish or withdraw from your campaign before operating a business';
  if(recordingCommitment(world)) return 'Finish or cancel your recording before operating a business';
  if (person.education.stage !== 'none') return 'Complete or leave full-time study before operating the business';
  if (person.stats.health < 25 || person.stats.smarts < role.smarts) return 'Your health or skills do not meet this operating role';
  if (role.qualification && !person.education.qualifications.some(item => item.level === role.qualification && (!role.field || item.field === role.field))) return 'Operating this business requires ' + role.qualification + (role.field ? ' in ' + role.field : '');
}
export function businessStartReason(world: World, kind: BusinessKind, operation: 'owner' | 'manager'): string | undefined {
  const person = active(world);
  if (ageOn(person, world.date) < rules[person.country].adultAge) return 'Business ownership is available to adults';
  if (isConfined(world) || person.legal.wanted) return 'Resolve your current custody or pursuit first';
  if (world.businesses.filter(item => item.ownerId === person.id && item.status === 'active').length >= 3) return 'You can start businesses while owning fewer than three active firms';
  if (operation === 'owner') { const reason = ownerOperationReason(world, kind); if (reason) return reason; }
  if (availableCash(accountFor(world)) < businessStartupQuote(world, kind).total) return 'Your available balance cannot fund this startup';
}
export function companyFor(world: World, businessId: string) {
  const company = world.businesses.find(item => item.id === businessId && item.ownerId === world.activePersonId && item.status === 'active');
  if (!company) throw new IneligibleAction('Choose one of your active businesses'); return company;
}
export const agencyFee = (company: Business) => roundRatio(rules[company.country].baseWage, 100n);
export function staffPayQuote(world: World, company: Business, role: 'worker' | 'manager') {
  const job = jobs.find(item => item.id === (role === 'manager' ? 'administrator' : businessCatalog[company.kind].workerRole))!;
  return salaryForPerson({ ...active(world), country: company.country }, job);
}
function addCompanyEmployee(world: World, company: Business, person: Person, role: 'worker' | 'manager') {
  const jobId = role === 'manager' ? 'administrator' : businessCatalog[company.kind].workerRole;
  if (person.employment) endEmployment(world, person.id); hireNpc(world, person, jobId);
  if (!person.employment) throw new IneligibleAction('The candidate cannot take this role');
  person.employment.companyId = company.id; person.employment.employer = company.name;
  const history = world.workHistory.find(item => item.id === person.employment!.id)!; history.companyId = company.id; history.employer = company.name;
  company.staff.push({ personId: person.id, employmentId: person.employment.id, role, hired: { ...world.date }, ended: null });
  if (person.id !== world.activePersonId) { connectPerson(world, person.id); const relation = relationFor(world, world.activePersonId, person.id)!; if (!relation.roles.includes('coworker')) relation.roles.push('coworker'); if (relation.kind === 'acquaintance') relation.kind = 'coworker'; }
}
export function hireCompanyStaff(world: World, company: Business, role: 'worker' | 'manager') {
  if (activeBusinessStaff(world, company).length >= company.locations * 2 + 1) throw new IneligibleAction('Expand before adding more positions');
  if (role === 'manager' && activeBusinessStaff(world, company).some(item => item.role === 'manager')) throw new IneligibleAction('A manager is already employed');
  const fee = agencyFee(company); if (company.cash < fee) throw new IneligibleAction('The company cannot cover the agency fee');
  businessBook(world, company, -fee, 0n, 'recruitment', 'Entry-level staffing agency fee'); company.pendingExpenses += fee;
  const jobId = role === 'manager' ? 'administrator' : businessCatalog[company.kind].workerRole;
  const person = createContact(world, { age: draw(world, 'npcs', 24, 25), country: company.country, city: company.city, qualifiedRole: jobId }); addCompanyEmployee(world, company, person, role);
  fact(world, 'I hired ' + fullName(person) + ' at ' + company.name + '.', 'business'); return person;
}
export function businessReserve(world: World, company: Business) {
  const fixed = roundRatio(rules[company.country].baseWage * BigInt(businessCatalog[company.kind].fixedCostBps) * BigInt(company.locations), 120000n), payroll = activeBusinessStaff(world, company).reduce((sum, item) => sum + world.people[item.personId].employment!.annualPay / 12n, 0n);
  return fixed + payroll;
}
export function availableBusinessProfit(world: World, company: Business) {
  const earned = company.cumulativeProfit - company.dividends - company.pendingExpenses - company.pendingPayroll, cash = company.cash - businessReserve(world, company), debts = world.businessPayables.filter(item => item.businessId === company.id).reduce((sum, item) => sum + item.principal, 0n);
  return earned <= 0n || cash <= debts ? 0n : earned < cash - debts ? earned : cash - debts;
}
export function payBusinessDividend(world: World, company: Business, amount: bigint) {
  if (!company.ownerId || amount < 0n || amount > availableBusinessProfit(world, company)) throw new IneligibleAction('This exceeds distributable profit after the operating reserve and debts'); if (!amount) return;
  const owner = world.people[company.ownerId]; businessBook(world, company, -amount, 0n, 'owner-distribution', 'Earned profit distributed', null, owner.id); company.dividends += amount;
  post(world, amount, 0n, 'business-owner-income', 'Profit from ' + company.name, null, owner, company.currency); owner.finance.cycleGross += fxMoney(world, { minor: amount, currency: company.currency }, countries[owner.country].currency).minor;
  if (ageOn(owner, world.date) < rules[owner.country].adultAge) accountFor(world, owner, company.currency).lockedCash += amount;
}
export const improvementQuote = (company: Business) => roundRatio(rules[company.country].baseWage * BigInt(businessCatalog[company.kind].capitalBps), 50000n);
export const expansionQuote = (company: Business) => roundRatio(rules[company.country].baseWage * BigInt(businessCatalog[company.kind].capitalBps) * 70n, 1000000n);
export function resolveBusiness(world: World, command: BusinessCommand) {
  const owner = active(world); if (ageOn(owner, world.date) < rules[owner.country].adultAge) throw new IneligibleAction('A minor’s inherited company is managed by its existing team');
  if (command.type === 'start-business') {
    const reason = businessStartReason(world, command.kind, command.operation); if (reason) throw new IneligibleAction(reason); const quote = businessStartupQuote(world, command.kind);
    if (command.quotedCapital !== quote.capital) throw new IneligibleAction('Review the current startup quote'); charge(world, quote.total, 'business-investment', 'Startup capital and registration: ' + command.name);
    const company: Business = { id: 'business_' + owner.id + '_' + world.revision, name: command.name, kind: command.kind, ownerId: owner.id, founderId: owner.id, country: owner.country, city: owner.city, currency: quote.currency, started: { ...world.date }, ended: null, status: 'active', cash: 0n, equipment: 0n, costBasis: quote.total, ownerOperated: command.operation === 'owner', locations: 1, facilities: 0, condition: 90, reputation: 50, priceBps: 10000, marketing: 'none', lastMonth: absolute(world), distressMonths: 0, cumulativeProfit: 0n, dividends: 0n, pendingExpenses: 0n, pendingPayroll: 0n, payoutBps: 2500, monthsOperated: 0, provenance: ['Founded by ' + fullName(owner) + ' in ' + world.date.year], staff: [], months: [], archives: [] };
    world.businesses.push(company); businessBook(world, company, quote.capital, 0n, 'capital-contribution', 'Owner startup capital', null, owner.id);
    const equipment = roundRatio(quote.capital * BigInt(businessCatalog[command.kind].equipmentBps), 10000n); businessBook(world, company, -equipment, 0n, 'equipment', 'Initial productive equipment'); company.equipment = equipment;
    if (command.operation === 'owner') addCompanyEmployee(world, company, owner, 'worker'); else { hireCompanyStaff(world, company, 'manager'); hireCompanyStaff(world, company, 'worker'); }
    fact(world, 'I founded ' + company.name + ', a ' + businessCatalog[company.kind].title.toLowerCase() + ' in ' + company.city + '.', 'business'); result(world, 'Open for business', 'Capital, equipment and actual employment contracts are in place. Sales, wages and expenses accrue as months pass.', businessCatalog[company.kind].art); return;
  }
  const company = companyFor(world, command.businessId);
  if (command.type === 'business-prices') company.priceBps = command.priceBps;
  else if (command.type === 'business-marketing') company.marketing = command.marketing;
  else if (command.type === 'business-payout-policy') company.payoutBps = command.payoutBps;
  else if (command.type === 'fund-business') { charge(world, command.amount, 'business-investment', 'Additional capital: ' + company.name, undefined, company.currency); businessBook(world, company, command.amount, 0n, 'capital-contribution', 'Additional owner capital', null, owner.id); company.costBasis += command.amount; }
  else if (command.type === 'hire-business-staff') { if (command.quotedPay !== staffPayQuote(world, company, command.role)) throw new IneligibleAction('Review the current salary quote'); const key = owner.id + ':business-hire:' + company.id + ':' + world.date.year; if ((world.actionCounts[key] ?? 0) >= 4) throw new IneligibleAction('Four agency placements are available per business each year'); world.actionCounts[key] = (world.actionCounts[key] ?? 0) + 1; hireCompanyStaff(world, company, command.role); }
  else if (command.type === 'operate-business') {
    if (command.operated) { const reason = ownerOperationReason(world, company.kind); if (reason) throw new IneligibleAction(reason); if (owner.country !== company.country || owner.city !== company.city) throw new IneligibleAction('You need to live in the company’s city'); addCompanyEmployee(world, company, owner, 'worker'); company.ownerOperated = true; }
    else { if (!company.ownerOperated || owner.employment?.companyId !== company.id) throw new IneligibleAction('You are not operating this company'); if (!businessManager(world, company)) throw new IneligibleAction('Appoint an available manager before delegating'); endEmployment(world, owner.id); }
  } else if (command.type === 'improve-business' || command.type === 'expand-business') {
    const cost = command.type === 'improve-business' ? improvementQuote(company) : expansionQuote(company); if (cost !== command.quotedCost) throw new IneligibleAction('Review the current capital-work quote');
    if (command.type === 'improve-business' && company.facilities >= 5 && company.condition >= 95 || command.type === 'expand-business' && company.locations >= 5) throw new IneligibleAction('This business has reached the current upgrade limit');
    businessBook(world, company, -cost, 0n, command.type, command.type === 'improve-business' ? 'Facilities upgraded' : 'New location opened'); const equipment = roundRatio(cost * 8000n, 10000n); company.equipment += equipment; company.pendingExpenses += cost - equipment;
    if (command.type === 'improve-business') { company.facilities = Math.min(5, company.facilities + 1); company.condition = Math.min(100, company.condition + 25); } else company.locations++;
  } else if (command.type === 'withdraw-business-profit') payBusinessDividend(world, company, command.amount);
  else if (command.type === 'sell-business') { const quote = businessSaleQuote(world, company, command.mode); if (quote.proceeds !== command.quotedProceeds) throw new IneligibleAction('Review the current business sale quote'); const sold = exitBusiness(world, company, command.mode); result(world, command.mode === 'sale' ? 'Business sold' : 'Business closed', 'Actual assets, obligations, staff contracts and residual proceeds have been settled.', 'business', [{ id: 'proceeds', label: 'Residual proceeds', value: formatMoney({ minor: sold.proceeds, currency: company.currency }), tone: 'positive' }]); return; }
  else if (command.type === 'dismiss-business-staff') {
    const member = activeBusinessStaff(world, company).find(item => item.employmentId === command.employmentId && item.personId !== owner.id); if (!member) throw new IneligibleAction('Choose another current employee');
    const person = world.people[member.personId], severance = roundRatio(person.employment!.annualPay, 12n), payment = businessCost(world, company, severance, 'severance', 'One month of severance', 'wages', person.id, member.employmentId); company.pendingPayroll += severance;
    employmentBackPay(world, person, member.employmentId, payment.paid); endEmployment(world, person.id); fact(world, 'My employment at ' + company.name + ' ended with a recorded severance obligation.', 'work', '', person.id);
  }
  result(world, 'Business updated', 'Your company’s actual plan and balances are updated. Recurring effects take place over time.', businessCatalog[company.kind].art);
}
