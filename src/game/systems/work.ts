import { currentHourlyRate, hourlyAnnual, hourlyContract, hourlyQuote, hourlyStudentReason, recordHourlyPeriod, updateHourlyRate } from './hourlyWork';
import { hourlyTermsSchema } from './hourlyWorkSchemas';
import { activeTrip } from './travelSchemas';
import { publicRoyalDuty } from './royaltySchemas';
import { serviceContractEnded } from './serviceSchemas';
import { fullTimeCreator } from './creatorSchemas';
import { z } from 'zod';
import { ageOn } from '../personHelpers';
import type { Person, World } from '../model';
import { IneligibleAction } from '../errors';
import { jobs, JobRole, jobRanks } from '../content/jobs';
import { jobInterviews } from '../content/jobInterviews';
import type { Effect, RuntimeEffectRow } from '../runtime';
import { incomeTax, monthlyAmount, rules } from '../rules';
import { roundRatio, formatMoney } from '../money';
import { accountFor, active, bounded, draw, fact, post, result } from './common';
import { hospitalized } from './healthSchemas';
import { isConfined } from './legalSchemas';
import { visibleConvictions } from './legalRecords';
import { careerContractEnded } from './careerSchemas';
import { recordingCommitment } from './musicSchemas';
import { campaignCommitment } from './politicsSchemas';
import { countries } from '../countries';
import { fxMoney } from '../valuation';
import { newWorkEarnings } from './earningsSchemas';
import { pensionPayment, recordWageEarnings } from './earnings';
import { endWorkplaceEmployment } from './workplaceSchemas';
import { interviewExperienceCopy, paidInterviewExperience } from './interviewExperience';

export const workCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('apply-job'), roleId: z.string(), reviewedHourlyTerms: hourlyTermsSchema.optional() }),
  z.object({ type: z.literal('work-effort'), effort: z.enum(['relaxed', 'balanced', 'hard']) }),
  z.object({ type: z.literal('quit-job') }), z.object({ type: z.literal('retire') }),
]);
export type WorkCommand = z.infer<typeof workCommandSchema>;
export function endEmployment(world: World, personId = world.activePersonId) {
  const person = world.people[personId];
  if (person.employment) endWorkplaceEmployment(world, personId, person.employment.id);
  const history = world.workHistory.find(record => record.id === person.employment?.id);
  if (history) history.ended = { ...world.date };
  if (person.employment) {careerContractEnded(world,person.employment.id);serviceContractEnded(world,person.employment.id);}
  if (person.employment?.companyId) {
    const company = world.businesses.find(item => item.id === person.employment!.companyId);
    if (company) { for (const member of company.staff.filter(item => item.employmentId === person.employment!.id && !item.ended)) member.ended = { ...world.date }; if (company.ownerId === personId) company.ownerOperated = false; }
  }
  person.employment = null;
}
export function jobReason(world: World, role: JobRole, interview = false, weeklyHours = 12): string | undefined {
  const person = active(world); const rule = rules[person.country]; const age = ageOn(person, world.date);
  if (activeTrip(world)) return 'Return from your trip before starting a job';
  if (role.specialCareer) return 'Use this special career’s selection process';
  if(!role.partTime&&publicRoyalDuty(world))return 'Choose a private royal life before other full-time work';
  if(!role.partTime&&fullTimeCreator(world))return 'Switch your studio to part-time before full-time work';
  if (!role.partTime&&campaignCommitment(world))return 'Finish or withdraw from your campaign before full-time work';
  if (!role.partTime && recordingCommitment(world)) return 'Finish or cancel your recording before starting full-time work';
  if (isConfined(world, person)) return 'You cannot start ordinary work in custody';
  if (person.legal.wanted) return 'Resolve your outstanding arrest first';
  if (['doctor', 'lawyer', 'teacher', 'police'].includes(role.id) && visibleConvictions(world, person).length) return 'This role requires a clear current background check';
  if (age < (role.partTime ? rule.partTimeAge : rule.adultAge)) return 'Available from age ' + (role.partTime ? rule.partTimeAge : rule.adultAge);
  if (!role.partTime && person.education.stage !== 'none') return 'Full-time work is unavailable while you are studying';
  if (role.partTime) { const workload = hourlyStudentReason(world, weeklyHours); if (workload) return workload; }
  if (person.stats.health < 20) return 'Your health needs attention before starting work';
  if (person.stats.smarts < role.smarts) return 'Smarts of at least ' + role.smarts + '% are required';
  if (role.qualification && !person.education.qualifications.some(q => q.level === role.qualification && (!role.field || q.field === role.field))) return 'Requires ' + role.qualification + (role.field ? ' in ' + role.field : ' qualification');
  if (person.employment?.roleId === role.id) return 'You already have this job';
  if (!interview && world.actionCounts[person.id + ':job:' + world.date.year + ':' + role.id]) return 'You already applied for this role this year';
}
export function salaryForPerson(person: Person, role: JobRole, rank = 0): bigint {
  return roundRatio(rules[person.country].baseWage * BigInt(role.wageBps) * BigInt(100 + rank * 25), 1000000n);
}
export const salaryFor = (world: World, role: JobRole, rank = 0) => salaryForPerson(active(world), role, rank);
/** Advance the existing contract's pay scale, retaining raises and its currency. */
export const promotedAnnualPay = (job: NonNullable<Person['employment']>) => roundRatio(job.annualPay * BigInt(100 + (job.rank + 1) * 25), BigInt(100 + job.rank * 25));
export function jobInterviewChance(world: World, answerChance: number, experienceBonus = 0) {
  const person = active(world);
  return Math.max(15, Math.min(95, 40 + Math.round((person.stats.smarts + person.stats.respect + person.stats.discipline) / 6) + Math.floor(person.stats.fame / 20) - visibleConvictions(world, person).length * 10 + answerChance + experienceBonus));
}
export function resolveWork(world: World, command: WorkCommand) {
  const person = active(world);
  if (command.type === 'apply-job') {
    const role = jobs.find(candidate => candidate.id === command.roleId);
    if (!role) throw new IneligibleAction('This job is not available');
    const hourly = role.partTime ? hourlyQuote(person.country, role, command.reviewedHourlyTerms?.weeklyHours ?? 12) : undefined;
    if (command.reviewedHourlyTerms && (!hourly || command.reviewedHourlyTerms.hourlyRate !== hourly.hourlyRate || command.reviewedHourlyTerms.paidWeeks !== hourly.paidWeeks)) throw new IneligibleAction('The hourly quote changed; review this job');
    const reason = jobReason(world, role, false, hourly?.weeklyHours); if (reason) throw new IneligibleAction(reason);
    world.actionCounts[person.id + ':job:' + world.date.year + ':' + role.id] = 1;
    const interview = jobInterviews[role.id], annualPay = hourly ? hourlyAnnual(hourly) : salaryFor(world, role), employer = person.city + ' ' + role.sector;
    if (!interview) throw new IneligibleAction('This interview is not available');
    const answers = [...interview.answers, { id: 'withdraw' as const, label: 'Withdraw my application' }];
    const experience = paidInterviewExperience(world, role);
    world.pending = {
      kind: 'decision', id: 'interview_' + world.revision, templateId: 'job-interview',
      title: role.title + ' interview', body: (hourly ? 'Reviewed contract: ' + formatMoney({ minor: hourly.hourlyRate, currency: countries[person.country].currency }) + ' per hour, ' + hourly.weeklyHours + ' hours per week and ' + hourly.paidWeeks + ' paid weeks per year. ' : '') + interviewExperienceCopy(role.sector, experience) + employer + ' asks: “' + interview.question + '”',
      illustration: 'career', personIds: [person.id],
      choices: answers.map(answer => ({ id: answer.id, label: answer.label,
        effects: [{ kind: 'job-interview', personId: person.id, roleId: role.id, employer, annualPay, ...(hourly ? { hourly } : {}), experience: { policyVersion: 1, ...experience, chance: answer.id === 'withdraw' ? null : jobInterviewChance(world, answer.chance, experience.bonus) }, answerId: answer.id }],
        resultTitle: 'Interview complete', resultBody: 'Your application has been considered.',
        journal: 'I attended an interview for a ' + role.title.toLowerCase() + ' role at ' + employer + '.',
      })),
    };
  } else if (command.type === 'work-effort') {
    if (!person.employment) throw new IneligibleAction('You need a job first');
    person.employment.effort = command.effort;
    result(world, 'Work routine updated', 'Your effort affects performance and stress as months pass.', 'career');
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
export type JobInterviewEffect = Extract<Effect, { kind: 'job-interview' }>;
export function resolveJobInterview(world: World, effect: JobInterviewEffect): { title: string; body: string; journal: string; effects: RuntimeEffectRow[] } {
  const person = active(world), role = jobs.find(item => item.id === effect.roleId), interview = jobInterviews[effect.roleId];
  if (!role || !interview || effect.personId !== person.id || effect.employer !== person.city + ' ' + role.sector || effect.annualPay !== (effect.hourly ? hourlyAnnual(effect.hourly) : salaryFor(world, role)) || effect.hourly && (!role.partTime || effect.hourly.hourlyRate !== hourlyQuote(person.country, role, effect.hourly.weeklyHours).hourlyRate) || !world.actionCounts[person.id + ':job:' + world.date.year + ':' + role.id]) throw new IneligibleAction('This interview is no longer available');
  const answer = interview.answers.find(item => item.id === effect.answerId);
  if (effect.experience) {
    const experience = paidInterviewExperience(world, role), expected = effect.answerId === 'withdraw' ? null : answer && jobInterviewChance(world, answer.chance, experience.bonus);
    if (effect.experience.policyVersion !== 1 || effect.experience.paidMonths !== experience.paidMonths || effect.experience.bonus !== experience.bonus || effect.experience.chance !== expected) throw new IneligibleAction('This interview experience quote is no longer available');
  }
  if (effect.answerId === 'withdraw') return { title: 'Application withdrawn', body: 'You decided against this role. Your current work is unchanged. You can apply for this role again next year.', journal: 'I withdrew my application for a ' + role.title.toLowerCase() + ' role.', effects: [] };
  const reason = jobReason(world, role, true, effect.hourly?.weeklyHours); if (reason) throw new IneligibleAction(reason);
  const chance = effect.experience?.chance ?? jobInterviewChance(world, answer!.chance);
  if (draw(world, 'outcomes', 1, 100) > chance) return { title: 'They chose another applicant', body: answer!.feedback + ' The application was unsuccessful. Your current work is unchanged. You can try this role again next year.', journal: 'I interviewed for a ' + role.title.toLowerCase() + ' role and was turned down.', effects: [] };
  if (person.employment) endEmployment(world);
  person.employment = { id: 'employment_' + world.revision, ...(effect.hourly ? { hourlyContractId: 'employment_' + world.revision } : {}), roleId: role.id, employer: effect.employer, companyId: null, currency: countries[person.country].currency, rank: 0, annualPay: effect.annualPay, paidMonths: 0, performance: 55, effort: 'balanced' };
  if (effect.hourly) world.hourlyContracts.push({ employmentId: person.employment.id, personId: person.id, roleId: role.id as 'shop-assistant-part' | 'cafe-part', country: person.country, currency: person.employment.currency, started: { ...world.date }, terms: { ...effect.hourly }, rates: [], periods: [] });
  world.workHistory.push({ id: person.employment.id, ...(effect.hourly ? { hourlyContractId: person.employment.id } : {}), personId: person.id, roleId: role.id, employer: effect.employer, companyId: null, started: { ...world.date }, ended: null, monthsWorked: 0, grossEarned: 0n, ...newWorkEarnings(person.employment.currency) });
  return { title: 'You got the job', body: answer!.feedback + ' Your contract is active. ' + (effect.hourly ? 'Your reviewed ' + effect.hourly.weeklyHours + '-hour week pays ' + formatMoney({ minor: effect.hourly.hourlyRate, currency: person.employment.currency }) + ' per hour. ' : '') + 'Pay starts as months pass, with income tax withheld. There is no salary payment upfront.', journal: 'I started work as a ' + role.title.toLowerCase() + ' at ' + effect.employer + '.', effects: [{ id: 'salary', label: 'Annual gross pay', value: formatMoney({ minor: effect.annualPay, currency: person.employment.currency }), tone: 'positive' }] };
}
/** Pay for one actual employment period. A company supplies cash through fundWages. */
export function employmentMonth(world: World, person = active(world), fundWages?: (due: bigint, employmentId: string) => bigint): bigint {
  const rule = rules[person.country], employment = person.employment;
  if (!employment || isConfined(world, person) || person.legal.wanted) return 0n;
  const holiday = activeTrip(world, person.id);
  if (holiday) {
    const leave = holiday.leave.find(item => item.personId === person.id && item.employmentId === employment.id && item.paid);
    if (!leave) return 0n;
    leave.used = true; world.actionCounts[person.id + ':paid-travel-leave:' + leave.year] = 1;
  }
  if (employment.companyId && !fundWages) throw new Error('Company wages require actual payroll funding');
  const role = jobs.find(candidate => candidate.id === employment.roleId);
  if (!role) throw new Error('Unknown employment role');
  const inHospital = hospitalized(world, person), hourly = hourlyContract(world, employment.id), periodRate = hourly ? currentHourlyRate(hourly) : 0n, firstPeriod = employment.paidMonths;
  const factor = inHospital ? 5000n : 10000n;
  const due = monthlyAmount(roundRatio(employment.annualPay * factor, 10000n), employment.paidMonths), wages = fundWages ? fundWages(due, employment.id) : due;
  if (wages < 0n || wages > due) throw new Error('Invalid payroll funding');
  const home = countries[person.country].currency;
  const annualHome = fxMoney(world, { minor: wages === due ? roundRatio(employment.annualPay * factor, 10000n) : wages * 12n, currency: employment.currency }, home).minor;
  const annualTaxNative = fxMoney(world, { minor: incomeTax(annualHome, rule), currency: home }, employment.currency).minor;
  const taxQuote = wages === due ? monthlyAmount(annualTaxNative, employment.paidMonths) : roundRatio(annualTaxNative, 12n), withheld = taxQuote < wages ? taxQuote : wages;
  employment.paidMonths++; person.finance.serviceMonths++;
  const history = world.workHistory.find(record => record.id === employment.id)!;
  history.monthsWorked++; recordWageEarnings(world, person, history, wages);
  if (!holiday && (!hourly || !inHospital)) {
  if (hourly) { person.stats.energy = bounded(person.stats.energy - hourly.terms.weeklyHours / 4); if (hourly.terms.weeklyHours === 20) person.stats.stress = bounded(person.stats.stress + 1); }
  const effort = employment.effort === 'hard' ? 2 : employment.effort === 'relaxed' ? -2 : 0, stream = person.id === world.activePersonId ? 'outcomes' : 'npcs';
  employment.performance = bounded(employment.performance + effort + draw(world, stream, -2, 2) + (person.stats.discipline >= 70 ? 1 : 0) - (person.stats.stress >= 75 ? 2 : 0) - (person.stats.health < 40 ? 2 : 0));
  person.stats.stress = bounded(person.stats.stress + (employment.effort === 'hard' ? 2 : employment.effort === 'relaxed' ? -1 : 0));
  if (employment.paidMonths % 12 === 0 && !role.specialCareer) {
    if (employment.performance >= 75 && employment.rank < 3 && draw(world, stream, 1, 100) <= 35) { if (hourly) updateHourlyRate(world, person, 'promotion', employment.rank + 1); else employment.annualPay = promotedAnnualPay(employment); employment.rank++; fact(world, 'I was promoted to ' + jobRanks[employment.rank].toLowerCase() + ' ' + role.title.toLowerCase() + '.', 'work', '', person.id); }
    else if (employment.performance < 25 && draw(world, stream, 1, 100) <= 45) { fact(world, 'I lost my ' + role.title.toLowerCase() + ' job after poor performance.', 'work', '', person.id); endEmployment(world, person.id); }
  }
  }
  const paymentCursor = world.ledger.length;
  if (wages) { post(world, wages, 0n, 'income', hourly ? 'Hourly employment pay' : 'Employment pay', null, person, employment.currency); if (withheld) post(world, -withheld, 0n, 'tax', 'Income tax withheld', null, person, employment.currency); person.finance.cycleGross += fxMoney(world, { minor: wages, currency: employment.currency }, home).minor; person.finance.cycleWithheld += fxMoney(world, { minor: withheld, currency: employment.currency }, home).minor; }
  if (hourly) recordHourlyPeriod(hourly, world.date, firstPeriod, 1, periodRate, inHospital ? 'hospital' : holiday ? 'paid-leave' : 'worked', wages, wages ? world.ledger[paymentCursor].id : null, inHospital ? 5000 : 10000);
  return due;
}
/** Back pay belongs to its original contract, with no extra months of service. */
export function employmentBackPay(world: World, person: Person, employmentId: string, wages: bigint) {
  const history = world.workHistory.find(record => record.id === employmentId && record.personId === person.id);
  if (!history || wages < 0n) throw new Error('Invalid back-pay record'); if (!wages) return;
  const home = countries[person.country].currency, grossHome = fxMoney(world, { minor: wages, currency: history.currency }, home).minor;
  const taxQuote = fxMoney(world, { minor: roundRatio(incomeTax(grossHome * 12n, rules[person.country]), 12n), currency: home }, history.currency).minor, withheld = taxQuote < wages ? taxQuote : wages;
  recordWageEarnings(world, person, history, wages); person.finance.cycleGross += grossHome; person.finance.cycleWithheld += fxMoney(world, { minor: withheld, currency: history.currency }, home).minor;
  post(world, wages, 0n, 'income', 'Outstanding wages paid', null, person, history.currency); if (withheld) post(world, -withheld, 0n, 'tax', 'Tax withheld on back pay', null, person, history.currency);
}
export function workMonth(world: World, person = active(world)) {
  if (person.employment && !person.employment.companyId) employmentMonth(world, person);
  if (person.finance.pensionAnnual > 0n) pensionPayment(world, person);
}
