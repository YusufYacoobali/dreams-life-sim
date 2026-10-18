import { z } from 'zod';
import { ageOn, Person, World } from '../model';
import { IneligibleAction } from '../errors';
import { jobs, JobRole, jobRanks } from '../content/jobs';
import { incomeTax, monthlyAmount, rules } from '../rules';
import { roundRatio, formatMoney } from '../money';
import { accountFor, active, bounded, draw, fact, post, result } from './common';
import { hospitalized } from './healthSchemas';
import { isConfined } from './legalSchemas';
import { visibleConvictions } from './legal';
import { careerContractEnded } from './careerSchemas';
import { recordingCommitment } from './musicSchemas';
import { campaignCommitment } from './politicsSchemas';

export const workCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('apply-job'), roleId: z.string() }),
  z.object({ type: z.literal('work-effort'), effort: z.enum(['relaxed', 'balanced', 'hard']) }),
  z.object({ type: z.literal('quit-job') }), z.object({ type: z.literal('retire') }),
]);
export type WorkCommand = z.infer<typeof workCommandSchema>;
export function endEmployment(world: World, personId = world.activePersonId) {
  const person = world.people[personId];
  const history = world.workHistory.find(record => record.id === person.employment?.id);
  if (history) history.ended = { ...world.date };
  if (person.employment) careerContractEnded(world,person.employment.id);
  if (person.employment?.companyId) {
    const company = world.businesses.find(item => item.id === person.employment!.companyId);
    if (company) { for (const member of company.staff.filter(item => item.employmentId === person.employment!.id && !item.ended)) member.ended = { ...world.date }; if (company.ownerId === personId) company.ownerOperated = false; }
  }
  person.employment = null;
}
export function jobReason(world: World, role: JobRole): string | undefined {
  const person = active(world); const rule = rules[person.country]; const age = ageOn(person, world.date);
  if (role.specialCareer) return 'Use this special career’s selection process';
  if (!role.partTime&&campaignCommitment(world))return 'Finish or withdraw from your campaign before full-time work';
  if (!role.partTime && recordingCommitment(world)) return 'Finish or cancel your recording before starting full-time work';
  if (isConfined(world, person)) return 'You cannot start ordinary work in custody';
  if (person.legal.wanted) return 'Resolve your outstanding arrest first';
  if (['doctor', 'lawyer', 'teacher', 'police'].includes(role.id) && visibleConvictions(world, person).length) return 'This role requires a clear current background check';
  if (age < (role.partTime ? rule.partTimeAge : rule.adultAge)) return 'Available from age ' + (role.partTime ? rule.partTimeAge : rule.adultAge);
  if (!role.partTime && person.education.stage !== 'none') return 'Full-time work is unavailable while you are studying';
  if (person.stats.health < 20) return 'Your health needs attention before starting work';
  if (person.stats.smarts < role.smarts) return 'Smarts of at least ' + role.smarts + '% are required';
  if (role.qualification && !person.education.qualifications.some(q => q.level === role.qualification && (!role.field || q.field === role.field))) return 'Requires ' + role.qualification + (role.field ? ' in ' + role.field : ' qualification');
  if (person.employment?.roleId === role.id) return 'You already have this job';
  if (world.actionCounts[person.id + ':job:' + world.date.year + ':' + role.id]) return 'You already applied for this role this year';
}
export function salaryForPerson(person: Person, role: JobRole, rank = 0): bigint {
  return roundRatio(rules[person.country].baseWage * BigInt(role.wageBps) * BigInt(100 + rank * 25), 1000000n);
}
export const salaryFor = (world: World, role: JobRole, rank = 0) => salaryForPerson(active(world), role, rank);
export function resolveWork(world: World, command: WorkCommand) {
  const person = active(world);
  if (command.type === 'apply-job') {
    const role = jobs.find(candidate => candidate.id === command.roleId);
    if (!role) throw new IneligibleAction('This job is not available');
    const reason = jobReason(world, role); if (reason) throw new IneligibleAction(reason);
    world.actionCounts[person.id + ':job:' + world.date.year + ':' + role.id] = 1;
    const chance = Math.max(15, Math.min(95, 40 + Math.round((person.stats.smarts + person.stats.respect + person.stats.discipline) / 6) + Math.floor(person.stats.fame / 20) - visibleConvictions(world, person).length * 10));
    if (draw(world, 'outcomes', 1, 100) > chance) {
      fact(world, 'I applied for a ' + role.title.toLowerCase() + ' role and was turned down.', 'work');
      result(world, 'They chose another applicant', 'The application was unsuccessful. Your current work, if any, is unchanged.', 'career'); return;
    }
    const annualPay = salaryFor(world, role); const employer = person.city + ' ' + role.sector;
    if (person.employment) endEmployment(world);
    person.employment = { id: 'employment_' + world.revision, roleId: role.id, employer, companyId: null, rank: 0, annualPay, paidMonths: 0, performance: 55, effort: 'balanced' };
    world.workHistory.push({ id: person.employment.id, personId: person.id, roleId: role.id, employer, companyId: null, started: { ...world.date }, ended: null, monthsWorked: 0, grossEarned: 0n });
    fact(world, 'I started work as a ' + role.title.toLowerCase() + ' at ' + employer + '.', 'work');
    result(world, 'You got the job', 'Your contract is active. Pay starts as time passes; accepting the role does not create a year of salary upfront.', 'career', [{ id: 'salary', label: 'Annual gross pay', value: formatMoney({ minor: annualPay, currency: accountFor(world).currency }), tone: 'positive' }]);
  } else if (command.type === 'work-effort') {
    if (!person.employment) throw new IneligibleAction('You need a job first');
    person.employment.effort = command.effort;
    result(world, 'Work routine updated', 'Your effort affects performance, energy and stress as months pass.', 'career');
  } else if (command.type === 'quit-job') {
    if (!person.employment) throw new IneligibleAction('You are not employed');
    const role = jobs.find(candidate => candidate.id === person.employment!.roleId)!;
    endEmployment(world);
    fact(world, 'I resigned from my ' + role.title.toLowerCase() + ' role.', 'work');
    result(world, 'You resigned', 'Future pay stops. Money you already earned stays yours.', 'career');
  } else {
    const rule = rules[person.country];
    if (ageOn(person, world.date) < rule.retirementAge) throw new IneligibleAction('Retirement is available from age ' + rule.retirementAge);
    if (person.finance.serviceMonths < 120) throw new IneligibleAction('At least ten years of recorded work are required for a pension');
    if (person.finance.pensionAnnual > 0n) throw new IneligibleAction('You already receive a pension');
    person.finance.pensionAnnual = roundRatio(person.finance.lifetimeGross * 12n * 40n, BigInt(person.finance.serviceMonths) * 100n);
    endEmployment(world);
    fact(world, 'I retired with a pension based on my recorded earnings.', 'work');
    result(world, 'A different pace', 'Your job has ended. Your earned pension will be paid as time passes.', 'career');
  }
}
/** Pay for one actual employment period. A company supplies cash through fundWages. */
export function employmentMonth(world: World, person = active(world), fundWages?: (due: bigint, employmentId: string) => bigint): bigint {
  const rule = rules[person.country], employment = person.employment;
  if (!employment || isConfined(world, person) || person.legal.wanted) return 0n;
  if (employment.companyId && !fundWages) throw new Error('Company wages require actual payroll funding');
  const role = jobs.find(candidate => candidate.id === employment.roleId);
  if (!role) throw new Error('Unknown employment role');
  const factor = hospitalized(world, person) ? 5000n : 10000n;
  const due = roundRatio(monthlyAmount(employment.annualPay, employment.paidMonths) * factor, 10000n), wages = fundWages ? fundWages(due, employment.id) : due;
  if (wages < 0n || wages > due) throw new Error('Invalid payroll funding');
  const withheld = wages === due ? monthlyAmount(incomeTax(roundRatio(employment.annualPay * factor, 10000n), rule), employment.paidMonths) : roundRatio(incomeTax(wages * 12n, rule), 12n);
  employment.paidMonths++; person.finance.serviceMonths++;
  const history = world.workHistory.find(record => record.id === employment.id)!;
  history.monthsWorked++; history.grossEarned += wages; person.finance.lifetimeGross += wages;
  const effort = employment.effort === 'hard' ? 2 : employment.effort === 'relaxed' ? -2 : 0, stream = person.id === world.activePersonId ? 'outcomes' : 'npcs';
  employment.performance = bounded(employment.performance + effort + draw(world, stream, -2, 2) + (person.stats.discipline >= 70 ? 1 : 0) - (person.stats.stress >= 75 ? 2 : 0) - (person.stats.health < 40 ? 2 : 0));
  person.stats.stress = bounded(person.stats.stress + (employment.effort === 'hard' ? 2 : employment.effort === 'relaxed' ? -1 : 0));
  if (employment.paidMonths % 12 === 0 && !role.specialCareer) {
    if (employment.performance >= 75 && employment.rank < 3 && draw(world, stream, 1, 100) <= 35) { employment.rank++; employment.annualPay = salaryForPerson(person, role, employment.rank); fact(world, 'I was promoted to ' + jobRanks[employment.rank].toLowerCase() + ' ' + role.title.toLowerCase() + '.', 'work', '', person.id); }
    else if (employment.performance < 25 && draw(world, stream, 1, 100) <= 45) { fact(world, 'I lost my ' + role.title.toLowerCase() + ' job after poor performance.', 'work', '', person.id); endEmployment(world, person.id); }
  }
  if (wages) { post(world, wages, 0n, 'income', 'Employment pay', null, person); if (withheld) post(world, -withheld, 0n, 'tax', 'Income tax withheld', null, person); person.finance.cycleGross += wages; person.finance.cycleWithheld += withheld; }
  return due;
}
/** Back pay belongs to its original contract, with no extra months of service. */
export function employmentBackPay(world: World, person: Person, employmentId: string, wages: bigint) {
  const history = world.workHistory.find(record => record.id === employmentId && record.personId === person.id);
  if (!history || wages < 0n) throw new Error('Invalid back-pay record'); if (!wages) return;
  const withheld = roundRatio(incomeTax(wages * 12n, rules[person.country]), 12n);
  history.grossEarned += wages; person.finance.lifetimeGross += wages; person.finance.cycleGross += wages; person.finance.cycleWithheld += withheld;
  post(world, wages, 0n, 'income', 'Outstanding wages paid', null, person); if (withheld) post(world, -withheld, 0n, 'tax', 'Tax withheld on back pay', null, person);
}
export function workMonth(world: World, person = active(world)) {
  if (person.employment && !person.employment.companyId) employmentMonth(world, person);
  if (person.finance.pensionAnnual > 0n) {
    const gross = monthlyAmount(person.finance.pensionAnnual, person.finance.pensionMonths), withheld = monthlyAmount(incomeTax(person.finance.pensionAnnual, rules[person.country]), person.finance.pensionMonths);
    person.finance.pensionMonths++;
    if (gross) { post(world, gross, 0n, 'income', 'Pension payment', null, person); if (withheld) post(world, -withheld, 0n, 'tax', 'Pension tax withheld', null, person); person.finance.cycleGross += gross; person.finance.cycleWithheld += withheld; }
  }
}
