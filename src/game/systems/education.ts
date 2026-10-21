import { hourlyEnrollmentReason } from './hourlyWork';
import { activeTrip } from './travelSchemas';
import { publicRoyalDuty } from './royaltySchemas';
import { fullTimeCreator } from './creatorSchemas';
import { z } from 'zod';
import { ageOn, Person, World } from '../model';
import { IneligibleAction } from '../errors';
import { rules } from '../rules';
import { fields } from './schemas';
import { accountFor, active, availableCash, borrow, bounded, charge, draw, fact, result } from './common';
import { formatMoney } from '../money';
import { jobs } from '../content/jobs';
import { hospitalized } from './healthSchemas';
import { isConfined } from './legalSchemas';
import { recordingCommitment } from './musicSchemas';
import { campaignCommitment } from './politicsSchemas';
import { currentRecovery } from './educationRecoverySchemas';
import { completeSecondary, hasSecondary } from './educationRecovery';
import { hasWithdrawnFromSchool } from './schoolSchemas';
import { serviceAway } from './serviceSchemas';
import { custodyReason } from './legal';
import { activateScholarship, finishScholarship, scholarshipOfferReason, scholarshipWaiver, tuitionWaiver } from './scholarships';
import { activeUniversityApplication } from './universityAdmissionSchemas';
import { compareDates } from '../model';
import { beginStudyCourse, endStudyCourse, observeIncompleteStudy, syncStudyCourse } from './studyCourses';

export const educationCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('enroll'), program: z.enum(['university', 'trade', 'graduate']), field: z.enum(fields), funding: z.enum(['cash', 'loan']), scholarshipId: z.string().optional() }),
  z.object({ type: z.literal('study') }),
  z.object({ type: z.literal('study-effort'), effort: z.enum(['relaxed', 'balanced', 'focused']) }),
  z.object({ type: z.literal('leave-school') }),
  z.object({ type: z.literal('fund-studies'), funding: z.enum(['cash', 'loan']) }),
]);
export type EducationCommand = z.infer<typeof educationCommandSchema>;
export function tuitionFor(person: Person, program: 'university' | 'trade' | 'graduate'): bigint {
  const rule = rules[person.country]; return program === 'trade' ? rule.tradeTuition : rule.universityTuition * (program === 'graduate' ? 2n : 1n);
}
export const courseMonths = (program: 'university' | 'trade' | 'graduate', field: string) => program === 'trade' ? 24 : program === 'graduate' && field === 'law' ? 36 : 48;
/** Shared existing command gates; previewing a refusal never changes the course. */
export function educationActionReason(world: World, command: Exclude<EducationCommand['type'], 'enroll'>): string | undefined {
  const custody = custodyReason(world, command); if (custody) return custody;
  const education = active(world).education;
  if (command === 'study') {
    if (education.stage === 'none' || education.paused) return 'You need an active course to study';
    if (education.lastStudyYear === world.date.year) return 'You have already done extra study this year';
  } else if (command === 'study-effort') {
    if (education.stage === 'none') return 'You are not enrolled';
  } else if (command === 'fund-studies') {
    if (!education.paused || education.stage === 'none') return 'Your studies are not waiting for tuition';
  } else if (education.stage === 'primary' || education.stage === 'secondary' || education.stage === 'none') return 'You cannot withdraw from compulsory education';
}
/** Current course requirements, without consuming or testing an application attempt. */
export function coursePrerequisiteReason(world: World, program: 'university' | 'trade' | 'graduate', field: string): string | undefined {
  if (activeTrip(world)) return 'Return from your trip before enrolling';
  const person = active(world); const education = person.education;
  if (isConfined(world)) return 'Courses outside custody are unavailable';
  if (ageOn(person, world.date) < rules[person.country].schoolEnd) return 'Finish secondary education first';
  if (education.stage !== 'none') return 'You are already enrolled';
  if (currentRecovery(world)) return 'Finish or leave your evening course before full-time study';
  if(publicRoyalDuty(world))return 'Choose a private royal life before full-time study';
  if(fullTimeCreator(world))return 'Switch your studio to part-time before full-time study';
  if(campaignCommitment(world))return 'Finish or withdraw from your campaign before full-time study';
  if (recordingCommitment(world)) return 'Finish or cancel your recording before full-time study';
  if (person.employment && !jobs.find(job => job.id === person.employment!.roleId)?.partTime) return 'Resign from full-time work before starting this course';
  const workload = hourlyEnrollmentReason(world, person); if (workload) return workload;
  if (!education.qualifications.some(q => q.level === 'secondary')) return 'A secondary qualification is required';
  if (program !== 'trade' && education.grades < 55) return 'Grades of at least 55% are required';
  if (program === 'graduate' && !education.qualifications.some(q => q.level === 'degree')) return 'A university degree is required';
  if (program === 'graduate' && field !== 'medicine' && field !== 'law') return 'Choose medicine or law for professional study';
  if (education.qualifications.some(q => q.level === (program === 'university' ? 'degree' : program === 'graduate' ? field : 'trade') && q.field === field)) return 'You already hold this qualification';
}
export function enrollmentReason(world: World, program: 'university' | 'trade' | 'graduate', field: string): string | undefined {
  const reason = coursePrerequisiteReason(world, program, field); if (reason) return reason;
  const person = active(world);
  if (world.actionCounts[person.id + ':education:' + world.date.year + ':' + program + ':' + field]) return 'You already applied for this course this year';
  if (program === 'university' && activeUniversityApplication(world)) return 'Use or withdraw your existing university application first';
}
function payTuition(world: World, funding: 'cash' | 'loan', waiver = tuitionWaiver(world, active(world))) {
  const person = active(world); const education = person.education;
  const billed = education.tuition - (waiver?.waived ?? 0n);
  let loanTransactionId: string | null = null;
  if (funding === 'loan' && billed > 0n) { borrow(world, billed, 'student', rules[person.country].studentInterestBps); loanTransactionId = world.ledger.at(-1)!.id; }
  charge(world, billed, 'tuition', 'Tuition: ' + education.school);
  if (waiver) waiver.item.periods.push({ date: { ...world.date }, studyMonth: education.tuitionPaidMonths, grades: education.grades, resources: waiver.resources, grossTuition: education.tuition, waived: waiver.waived, billed, funding, transactionId: billed > 0n ? world.ledger.at(-1)!.id : null, loanTransactionId });
  education.funding = funding; education.paused = false; education.tuitionPaidMonths += 12;
  return { billed, waived: waiver?.waived ?? 0n, transactionId: billed > 0n ? world.ledger.at(-1)!.id : null, loanTransactionId };
}
/** A confirmed admission starts with no completed study and a real annual tuition payment. */
export function startCourse(world: World, program: 'university' | 'trade' | 'graduate', field: typeof fields[number], funding: 'cash' | 'loan', school?: string, scholarshipId?: string, admissionId?: string) {
  const person = active(world), education = person.education;
  const admission = admissionId ? world.universityApplications.find(item => item.id === admissionId) : undefined;
  if (admissionId && (!admission || admission.status !== 'accepted' || admission.personId !== person.id || program !== 'university' || admission.field !== field || admission.country !== person.country || admission.city !== person.city || !admission.expires || compareDates(world.date, admission.expires) >= 0)) throw new IneligibleAction('Choose a current university place offer');
  observeIncompleteStudy(world, person);
  education.stage = program; education.field = field; education.school = admission?.school ?? school ?? person.city + (program === 'trade' ? ' Technical College' : ' University');
  education.months = 0; education.requiredMonths = admission?.requiredMonths ?? courseMonths(program, field);
  education.tuition = admission?.annualTuition ?? tuitionFor(person, program); education.tuitionPaidMonths = 0;
  activateScholarship(world, scholarshipId, program, field); const payment = payTuition(world, funding);
  beginStudyCourse(world, person, { ...payment, funding, scholarshipId: scholarshipId ?? null }, admissionId); return payment;
}
export function resolveEducation(world: World, command: EducationCommand) {
  const person = active(world); const education = person.education;
  if (command.type !== 'enroll') { const reason = educationActionReason(world, command.type); if (reason) throw new IneligibleAction(reason); }
  if (command.type === 'enroll') {
    const reason = enrollmentReason(world, command.program, command.field); if (reason) throw new IneligibleAction(reason);
    const tuition = tuitionFor(person, command.program);
    let waived = 0n;
    if (command.scholarshipId) {
      const item = world.scholarships.find(candidate => candidate.id === command.scholarshipId);
      if (!item) throw new IneligibleAction('Choose an available scholarship offer');
      const offerReason = scholarshipOfferReason(world, item, command.program, command.field); if (offerReason) throw new IneligibleAction(offerReason);
      waived = scholarshipWaiver(item, tuition);
    }
    if (command.funding === 'cash' && availableCash(accountFor(world)) < tuition - waived) throw new IneligibleAction('Your balance cannot cover the first year’s tuition');
    world.actionCounts[person.id + ':education:' + world.date.year + ':' + command.program + ':' + command.field] = 1;
    if (draw(world, 'outcomes', 1, 100) > Math.min(95, 20 + Math.round((education.grades + person.stats.smarts) / 2))) {
      fact(world, 'My application to study ' + command.field + ' was declined.', 'education');
      result(world, 'Application declined', 'The course did not offer you a place. Your money has not been spent.', 'education'); return;
    }
    startCourse(world, command.program, command.field, command.funding, undefined, command.scholarshipId);
    fact(world, 'I enrolled at ' + education.school + ' to study ' + command.field + '.', 'education');
    result(world, 'You’re enrolled', 'Your place is confirmed. Tuition is charged for each year of study. ' + (waived ? 'Your scholarship waives part or all of tuition; renewal requirements apply. ' : '') + 'Living costs are separate.', 'education', [{ id: 'tuition', label: 'First-year tuition billed', value: formatMoney({ minor: tuition - waived, currency: accountFor(world).currency }), tone: tuition === waived ? 'neutral' : 'negative' }, ...(waived ? [{ id: 'waived', label: 'Tuition waived', value: formatMoney({ minor: waived, currency: accountFor(world).currency }), tone: 'positive' as const }] : [])]);
  } else if (command.type === 'study') {
    education.lastStudyYear = world.date.year;
    const before = education.grades; education.grades = bounded(before + 5 + Math.floor(person.stats.discipline / 25));
    person.stats.energy = bounded(person.stats.energy - 8); person.stats.stress = bounded(person.stats.stress + 3);
    fact(world, 'I put extra time into my studies.', 'education');
    result(world, 'The work starts to show', 'You understand more than you did before. It took a little energy to get there.', 'education', [{ id: 'grades', label: 'Grades', value: '+' + (education.grades - before) + '%', tone: 'positive' }]);
  } else if (command.type === 'study-effort') {
    education.effort = command.effort; result(world, 'Study routine updated', 'Your new routine will affect your grades, energy and stress as time passes.', 'education');
  } else if (command.type === 'fund-studies') {
    payTuition(world, command.funding); result(world, 'Studies resumed', 'Your next year is funded. Your completed study time is preserved.', 'education');
  } else {
    fact(world, 'I left my ' + education.field + ' course. My existing qualifications remain valid.', 'education');
    endStudyCourse(world, person, 'withdrawn');
    education.stage = 'none'; education.paused = false;
    result(world, 'You left the course', 'Future tuition stops. Existing student debt still needs to be repaid.', 'education');
  }
  syncStudyCourse(world, person);
}
export function educationMonth(world: World, person: Person) {
  syncStudyCourse(world, person);
  if (hospitalized(world, person) || activeTrip(world, person.id)) return;
  if (isConfined(world, person) || person.legal.wanted || serviceAway(world, person.id)) return;
  const age = ageOn(person, world.date); const rule = rules[person.country]; const education = person.education;
  const isPlayer = person.id === world.activePersonId;
  if (education.stage === 'none' && age >= rule.schoolStart && age < rule.schoolEnd && !hasWithdrawnFromSchool(world, person.id) && !education.qualifications.some(q => q.level === 'secondary')) {
    education.stage = age < rule.secondaryStart ? 'primary' : 'secondary'; education.school = person.city + (education.stage === 'primary' ? ' Primary School' : ' Secondary School');
    if (education.months === 0 && !world.schoolCompletions.some(item => item.personId === person.id)) education.grades = bounded(Math.round((person.stats.smarts + person.stats.discipline) / 2));
    if (isPlayer) fact(world, 'I started at ' + education.school + '.', 'education');
  }
  if (education.stage === 'primary' && age >= rule.secondaryStart) {
    education.stage = 'secondary'; education.school = person.city + ' Secondary School';
    if (isPlayer) fact(world, 'I moved on to ' + education.school + '.', 'education');
  }
  if ((education.stage === 'primary' || education.stage === 'secondary') && age >= rule.schoolEnd) {
    if (hasSecondary(person)) education.stage = 'none';
    else completeSecondary(world, person);
    return;
  }
  if (education.stage === 'none' || education.paused) return;
  if (education.months >= education.tuitionPaidMonths && education.tuition > 0n && isPlayer) {
    const waiver = tuitionWaiver(world, person), billed = education.tuition - (waiver?.waived ?? 0n);
    if (education.funding === 'cash' && availableCash(accountFor(world)) < billed) {
      education.paused = true;
      fact(world, 'My studies paused because I could not cover the next tuition payment. My completed work is preserved.', 'education'); return;
    }
    payTuition(world, education.funding === 'loan' ? 'loan' : 'cash', waiver);
  }
  education.months++;
  if (education.months % 12 === 0) {
    const change = (education.effort === 'focused' ? 5 : education.effort === 'relaxed' ? -4 : 1) + draw(world, isPlayer ? 'outcomes' : 'npcs', -3, 3) + (person.stats.stress > 70 ? -4 : 0) + (person.stats.health < 40 ? -4 : 0);
    education.grades = bounded(education.grades + change);
    person.stats.stress = bounded(person.stats.stress + (education.effort === 'focused' ? 5 : education.effort === 'relaxed' ? -4 : 0));
  }
  syncStudyCourse(world, person);
  if (education.requiredMonths > 0 && education.months >= education.requiredMonths) {
    const level = education.stage === 'trade' ? 'trade' : education.stage === 'graduate' ? education.field as 'medicine' | 'law' : 'degree';
    if (education.grades >= 50) {
      education.qualifications.push({ level, field: education.field, year: world.date.year });
      if (isPlayer) fact(world, 'I completed my ' + education.field + ' ' + (level === 'degree' ? 'degree' : 'qualification') + ' with grades of ' + education.grades + '%.', 'education');
    } else if (isPlayer) fact(world, 'I finished the course but did not meet the passing grade. I was not awarded the qualification.', 'education');
    finishScholarship(world, person, education.grades >= 50);
    endStudyCourse(world, person, education.grades >= 50 ? 'completed' : 'failed');
    education.stage = 'none'; education.paused = false; education.tuition = 0n;
  }
}
