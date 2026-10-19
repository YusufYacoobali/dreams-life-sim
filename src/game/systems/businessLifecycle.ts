import { newWorkEarnings } from './earningsSchemas';
import { ageOn, fullName, World } from '../model';
import { Business, businessSaleQuote, companyClaimValue } from '../businessValuation';
import { Currency, formatMoney, roundRatio } from '../money';
import { fxMoney } from '../valuation';
import { businessBook, settleBusinessPayables, writeOffBusinessPayables } from './businessCore';
import { endEmployment } from './work';
import { fact, post } from './common';
import { isConfined } from './legalSchemas';
import { countries } from '../countries';
import { rules } from '../rules';
import { accountFor } from './common';
/** Same authored external-claim market as family debts, capped at recoverable company value. */
export function assignBusinessClaims(world: World, personId: string, currency: Currency) {
  const person = world.people[personId]; let fees = 0n;
  for (const payable of world.businessPayables.filter(item => item.creditorId === personId && item.principal > 0n)) {
    const value = fxMoney(world, { minor: companyClaimValue(world, payable), currency: payable.currency }, currency).minor, fee = roundRatio(value * 500n, 10000n); fees += fee;
    if (value > fee) post(world, value - fee, 0n, 'estate-receivable', 'Company wage claim assigned at its recoverable value', null, person, currency);
    const company = world.businesses.find(item => item.id === payable.businessId)!; businessBook(world, company, 0n, 0n, 'claim-assignment', 'Wage claim assigned to an external buyer', payable.id, personId, payable.employmentId);
    payable.creditorId = null;
  }
  return fees;
}
/** Liquidate assets/brand, pay actual ranked creditors, then return only the residue to the owner. */
export function exitBusiness(world: World, company: Business, mode: 'sale' | 'close' | 'failure', forEstate = false) {
  if (company.status !== 'active' || !company.ownerId) throw new Error('The company is no longer active');
  const owner = world.people[company.ownerId], quote = businessSaleQuote(world, company, mode);
  const employees = company.staff.filter(item => !item.ended).map(member => ({ member, person: world.people[member.personId], contract: world.people[member.personId].employment ? { ...world.people[member.personId].employment! } : null }));
  if (quote.price) businessBook(world, company, quote.price, 0n, 'asset-sale', mode === 'sale' ? 'Assets and brand sold to an external buyer' : 'Equipment liquidation');
  if (quote.fee) businessBook(world, company, -quote.fee, 0n, 'sale-fee', 'Business sale costs');
  company.equipment = 0n; settleBusinessPayables(world, company, true); writeOffBusinessPayables(world, company);
  const proceeds = company.cash;
  if (proceeds) {
    businessBook(world, company, -proceeds, 0n, 'capital-return', 'Residual proceeds to owner', null, owner.id);
    post(world, proceeds, 0n, 'business-sale', 'Business ' + (mode === 'sale' ? 'sale' : 'liquidation') + ': ' + company.name, null, owner, company.currency);
    if (!forEstate && ageOn(owner, world.date) < rules[owner.country].adultAge) accountFor(world, owner, company.currency).lockedCash += proceeds;
    const gain = proceeds > company.costBasis ? proceeds - company.costBasis : 0n;
    if (!forEstate && gain) owner.finance.cycleGross += fxMoney(world, { minor: gain, currency: company.currency }, countries[owner.country].currency).minor;
  }
  for (const { member, person, contract } of employees) {
    if (person.employment?.id !== member.employmentId) { member.ended = { ...world.date }; continue; }
    endEmployment(world, person.id);
    if (mode === 'sale' && contract && !person.died && !isConfined(world, person) && person.id !== owner.id) {
      const id = 'employment_transfer_' + person.id + '_' + world.workHistory.length, employer = company.name + ' (new ownership)';
      person.employment = { ...contract, id, companyId: null, employer, paidMonths: 0 };
      world.workHistory.push({ id, personId: person.id, roleId: contract.roleId, companyId: null, employer, started: { ...world.date }, ended: null, monthsWorked: 0, grossEarned: 0n, ...newWorkEarnings(contract.currency) });
      fact(world, 'My employment continued under the new ownership of ' + company.name + '.', 'work', '', person.id);
    } else if (!person.died) fact(world, 'My employment at ' + company.name + ' ended.', 'work', '', person.id);
  }
  company.status = mode === 'sale' ? 'sold' : mode === 'failure' ? 'failed' : 'closed'; company.ended = { ...world.date }; company.ownerId = null; company.ownerOperated = false;
  company.provenance.push((forEstate ? 'Estate of ' : '') + fullName(owner) + ': ' + company.status + ' in ' + world.date.year);
  fact(world, (forEstate ? 'My estate sold ' : mode === 'sale' ? 'I sold ' : mode === 'failure' ? 'My business failed: ' : 'I closed ') + company.name + '. Residual proceeds were ' + formatMoney({ minor: proceeds, currency: company.currency }) + '.', 'business', '', owner.id);
  return { proceeds, fee: quote.fee, price: quote.price };
}
