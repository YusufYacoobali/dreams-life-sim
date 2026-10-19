import { publicRoyalDuty } from './royaltySchemas';
import { fullTimeCreator } from './creatorSchemas';
import { ageOn, Person, World } from '../model';
import { roundRatio } from '../money';
import { incomeTax, rules } from '../rules';
import { accountFor, charge, draw, fact, post } from './common';
import { endEmployment } from './work';
import { ownHousehold } from './households';
import { hireNpc } from './npcs';
import { daysInMonth } from '../calendar';
import { isConfined } from './legalSchemas';
import { recordingCommitment } from './musicSchemas';
import { campaignCommitment } from './politicsSchemas';
import { countries } from '../countries';
import { fxMoney } from '../valuation';
import { pensionPayment, recordWageEarnings } from './earnings';

/** Settle an unobserved contact's recorded contract once when they re-enter the story.
 * Background net earnings fund their ordinary/discretionary budget; no invented gift is credited to the player.
 */
export function settleBackground(world: World, person: Person, throughMonth: number) {
  const months = throughMonth - person.lastEconomicMonth;
  if (months <= 0 || person.id === world.activePersonId) return;
  if (person.employment?.companyId) throw new Error('Company employment requires recorded monthly payroll');
  for (const debt of world.liabilities.filter(item => item.ownerId === person.id && item.kind !== 'mortgage' && item.principal > 0n)) {
    const before = debt.principal; for (let month = 0; month < months; month++) debt.principal += roundRatio(debt.principal * BigInt(debt.interestBps), 120000n);
    if (debt.principal > before) post(world, 0n, debt.principal - before, 'interest', 'Interest during the background period', debt.id, person, debt.currency);
  }
  let wages = 0n;
  const currency = countries[person.country].currency;
  if (person.employment) {
    const job = person.employment;
    wages = roundRatio(job.annualPay * BigInt(job.paidMonths + months), 12n) - roundRatio(job.annualPay * BigInt(job.paidMonths), 12n);
    job.paidMonths += months; person.finance.serviceMonths += months;
    const record = world.workHistory.find(item => item.id === job.id)!; record.monthsWorked += months; recordWageEarnings(world, person, record, wages, throughMonth);
    if (wages) post(world, wages, 0n, 'background-income', 'Recorded employment pay for ' + months + ' months', null, person, job.currency);
  }
  const pension = person.finance.pensionAnnual > 0n ? pensionPayment(world, person, months, true) : { gross: 0n, fee: 0n, annual: 0n };
  const gross = fxMoney(world, { minor: wages, currency: person.employment?.currency ?? currency }, currency).minor + pension.gross;
  const annual = fxMoney(world, { minor: person.employment?.annualPay ?? 0n, currency: person.employment?.currency ?? currency }, currency).minor + pension.annual;
  const years = Math.floor(months / 12); const partial = gross - annual * BigInt(years);
  const tax = incomeTax(annual, rules[person.country]) * BigInt(years) + incomeTax(partial > 0n ? partial : 0n, rules[person.country]);
  if (tax) charge(world, tax, 'tax', 'Tax on the recorded background period', 'tax', undefined, person);
  const rule = rules[person.country]; const independentAge = Math.max(rule.adultAge, rule.schoolEnd);
  const birthdayDays = daysInMonth(person.born.year + independentAge, person.born.month);
  const independentMonth = (person.born.year + independentAge) * 12 + person.born.month - 1 + (Math.min(world.calendarAnchorDay, birthdayDays) < Math.min(person.born.day, birthdayDays) ? 1 : 0);
  const adultMonths = Math.max(0, throughMonth - Math.max(person.lastEconomicMonth, independentMonth - 1));
  const living = rule.livingCost * BigInt(adultMonths);
  const surplus = gross - pension.fee - tax - living;
  const spendingBps = person.traits.includes('practical') ? 4000n : person.traits.includes('impulsive') ? 9000n : 6500n;
  const spending = living + (surplus > 0n ? roundRatio(surplus * spendingBps, 10000n) : 0n);
  if (ageOn(person, world.date) >= rules[person.country].adultAge && spending) charge(world, spending, 'background-living', 'Living and discretionary costs for ' + months + ' months', 'living', undefined, person);
  person.lastEconomicMonth = throughMonth;
}

export function npcYearDecisions(world: World) {
  for (const person of Object.values(world.people)) {
    const rule = rules[person.country];
    if (person.id === world.activePersonId || person.died || isConfined(world, person) || person.legal.wanted || publicRoyalDuty(world,person.id) || fullTimeCreator(world,person.id) || recordingCommitment(world,person.id) || campaignCommitment(world,person.id) || person.employment || person.finance.pensionAnnual > 0n || person.education.stage !== 'none' || person.stats.health < 25 || ageOn(person, world.date) < Math.max(rule.adultAge, rule.schoolEnd)) continue;
    const key = person.id + ':job-search:' + world.date.year; if (world.actionCounts[key]) continue; world.actionCounts[key] = 1;
    // Search is an NPC decision, separate from the player's outcomes stream.
    if (draw(world, 'npcs', 1, 100) > 60) continue;
    settleBackground(world, person, world.date.year * 12 + world.date.month - 1);
    hireNpc(world, person);
  }
}
export function npcDiscretionaryMonth(world: World, person: Person, openingCash: bigint) {
  if (person.id === world.activePersonId || isConfined(world, person) || ageOn(person, world.date) < rules[person.country].adultAge) return;
  const surplus = accountFor(world, person).cash - openingCash;
  if (surplus <= 0n) return;
  const spendingBps = person.traits.includes('practical') ? 4000n : person.traits.includes('impulsive') ? 9000n : 6500n;
  const spend = roundRatio(surplus * spendingBps, 10000n);
  if (spend) charge(world, spend, 'npc-budget', 'Personal discretionary budget', undefined, undefined, person);
}

export function householdMonth(world: World) {
  for (const person of Object.values(world.people)) {
    if (person.died) continue;
    const rule = rules[person.country], age = ageOn(person, world.date);
    if (age >= rule.adultAge) for (const account of world.accounts.filter(item => item.ownerId === person.id && item.lockedCash > 0n)) { account.lockedCash = 0n; fact(world, 'My inheritance trust became available in adulthood.', 'finance', '', person.id); }
    const household = world.households.find(item => item.id === person.householdId);
    const independentAge = Math.max(rule.adultAge, rule.schoolEnd);
    if (!isConfined(world, person) && age >= independentAge && age < independentAge + 1 && !world.actionCounts[person.id + ':independent-home'] && household && world.relationships.some(relation => relation.to === person.id && relation.roles.includes('parent') && household.members.includes(relation.from))) {
      ownHousehold(world, person); world.actionCounts[person.id + ':independent-home'] = 1; fact(world, 'I began covering the costs of an independent household.', 'family', '', person.id);
    }
    if (person.id !== world.activePersonId && age >= rule.retirementAge && !person.finance.pensionAnnual && person.finance.serviceMonths >= 120) {
      settleBackground(world, person, world.date.year * 12 + world.date.month - 2);
      person.finance.pensionAnnual = roundRatio(person.finance.lifetimeGross * 12n * 40n, BigInt(person.finance.serviceMonths) * 100n);
      endEmployment(world, person.id); fact(world, 'I began receiving an earned pension.', 'work', '', person.id);
    }
  }
}
