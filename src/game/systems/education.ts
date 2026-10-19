import { activeTrip } from './travelSchemas';
import { publicRoyalDuty } from './royaltySchemas';
import { fullTimeCreator } from './creatorSchemas';
import { z } from 'zod';
import { ageOn, Person, World } from '../model';
import { IneligibleAction } from '../errors';
import { rules } from '../rules';
import { fields } from './schemas';
import { accountFor, active, borrow, bounded, charge, draw, fact, result } from './common';
import { formatMoney } from '../money';
import { jobs } from '../content/jobs';
import { hospitalized } from './healthSchemas';
import { isConfined } from './legalSchemas';
import { recordingCommitment } from './musicSchemas';
import { campaignCommitment } from './politicsSchemas';

export const educationCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('enroll'), program: z.enum(['university', 'trade', 'graduate']), field: z.enum(fields), funding: z.enum(['cash', 'loan']) }),
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
export function enrollmentReason(world: World, program: 'university' | 'trade' | 'graduate', field: string): string | undefined {
  if (activeTrip(world)) return 'Return from your trip before enrolling';
  const person = active(world); const education = person.education;
  if (isConfined(world)) return 'Courses outside custody are unavailable';
  if (ageOn(person, world.date) < rules[person.country].schoolEnd) return 'Finish secondary education first';
  if (education.stage !== 'none') return 'You are already enrolled';
  if(publicRoyalDuty(world))return 'Choose a private royal life before full-time study';
  if(fullTimeCreator(world))return 'Switch your studio to part-time before full-time study';
  if(campaignCommitment(world))return 'Finish or withdraw from your campaign before full-time study';
  if (recordingCommitment(world)) return 'Finish or cancel your recording before full-time study';
  if (person.employment && !jobs.find(job => job.id === person.employment!.roleId)?.partTime) return 'Resign from full-time work before starting this course';
  if (!education.qualifications.some(q => q.level === 'secondary')) return 'A secondary qualification is required';
  if (program !== 'trade' && education.grades < 55) return 'Grades of at least 55% are required';
  if (program === 'graduate' && !education.qualifications.some(q => q.level === 'degree')) return 'A university degree is required';
  if (program === 'graduate' && field !== 'medicine' && field !== 'law') return 'Choose medicine or law for professional study';
  if (education.qualifications.some(q => q.level === (program === 'university' ? 'degree' : program === 'graduate' ? field : 'trade') && q.field === field)) return 'You already hold this qualification';
  if (world.actionCounts[person.id + ':education:' + world.date.year + ':' + program + ':' + field]) return 'You already applied for this course this year';
}
function payTuition(world: World, funding: 'cash' | 'loan') {
  const person = active(world); const education = person.education;
  if (funding === 'loan') borrow(world, education.tuition, 'student', rules[person.country].studentInterestBps);
  charge(world, education.tuition, 'tuition', 'Tuition: ' + education.school);
  education.funding = funding; education.paused = false; education.tuitionPaidMonths += 12;
}
/** A confirmed admission starts with no completed study and a real annual tuition payment. */
export function startCourse(world: World, program: 'university' | 'trade' | 'graduate', field: typeof fields[number], funding: 'cash' | 'loan', school?: string) {
  const person = active(world), education = person.education;
  education.stage = program; education.field = field; education.school = school ?? person.city + (program === 'trade' ? ' Technical College' : ' University');
  education.months = 0; education.requiredMonths = courseMonths(program, field);
  education.tuition = tuitionFor(person, program); education.tuitionPaidMonths = 0; payTuition(world, funding);
}
export function resolveEducation(world: World, command: EducationCommand) {
  const person = active(world); const education = person.education;
  if (command.type === 'enroll') {
    const reason = enrollmentReason(world, command.program, command.field); if (reason) throw new IneligibleAction(reason);
    const tuition = tuitionFor(person, command.program);
    if (command.funding === 'cash' && accountFor(world).cash < tuition) throw new IneligibleAction('Your balance cannot cover the first year’s tuition');
    world.actionCounts[person.id + ':education:' + world.date.year + ':' + command.program + ':' + command.field] = 1;
    if (draw(world, 'outcomes', 1, 100) > Math.min(95, 20 + Math.round((education.grades + person.stats.smarts) / 2))) {
      fact(world, 'My application to study ' + command.field + ' was declined.', 'education');
      result(world, 'Application declined', 'The course did not offer you a place. Your money has not been spent.', 'education'); return;
    }
    startCourse(world, command.program, command.field, command.funding);
    fact(world, 'I enrolled at ' + education.school + ' to study ' + command.field + '.', 'education');
    result(world, 'You’re enrolled', 'Your place is confirmed. Tuition is charged each year; your funding choice stays in place until you change it.', 'education', [{ id: 'tuition', label: 'First-year tuition', value: formatMoney({ minor: tuition, currency: accountFor(world).currency }), tone: 'negative' }]);
  } else if (command.type === 'study') {
    if (education.stage === 'none' || education.paused) throw new IneligibleAction('You need an active course to study');
    if (education.lastStudyYear === world.date.year) throw new IneligibleAction('You have already done extra study this year');
    education.lastStudyYear = world.date.year;
    const before = education.grades; education.grades = bounded(before + 5 + Math.floor(person.stats.discipline / 25));
    person.stats.energy = bounded(person.stats.energy - 8); person.stats.stress = bounded(person.stats.stress + 3);
    fact(world, 'I put extra time into my studies.', 'education');
    result(world, 'The work starts to show', 'You understand more than you did before. It took a little energy to get there.', 'education', [{ id: 'grades', label: 'Grades', value: '+' + (education.grades - before) + '%', tone: 'positive' }]);
  } else if (command.type === 'study-effort') {
    if (education.stage === 'none') throw new IneligibleAction('You are not enrolled');
    education.effort = command.effort; result(world, 'Study routine updated', 'Your new routine will affect your grades, energy and stress as time passes.', 'education');
  } else if (command.type === 'fund-studies') {
    if (!education.paused || education.stage === 'none') throw new IneligibleAction('Your studies are not waiting for tuition');
    payTuition(world, command.funding); result(world, 'Studies resumed', 'Your next year is funded. Your completed study time is preserved.', 'education');
  } else {
    if (education.stage === 'primary' || education.stage === 'secondary' || education.stage === 'none') throw new IneligibleAction('You cannot withdraw from compulsory education');
    fact(world, 'I left my ' + education.field + ' course. My existing qualifications remain valid.', 'education');
    education.stage = 'none'; education.paused = false;
    result(world, 'You left the course', 'Future tuition stops. Existing student debt still needs to be repaid.', 'education');
  }
}
export function educationMonth(world: World, person: Person) {
  if (hospitalized(world, person) || activeTrip(world, person.id)) return;
  if (isConfined(world, person) && !['none', 'primary', 'secondary'].includes(person.education.stage)) return;
  const age = ageOn(person, world.date); const rule = rules[person.country]; const education = person.education;
  const isPlayer = person.id === world.activePersonId;
  if (education.stage === 'none' && age >= rule.schoolStart && age < rule.schoolEnd && !education.qualifications.some(q => q.level === 'secondary')) {
    education.stage = age < rule.secondaryStart ? 'primary' : 'secondary'; education.school = person.city + (education.stage === 'primary' ? ' Primary School' : ' Secondary School');
    education.grades = bounded(Math.round((person.stats.smarts + person.stats.discipline) / 2));
    if (isPlayer) fact(world, 'I started at ' + education.school + '.', 'education');
  }
  if (education.stage === 'primary' && age >= rule.secondaryStart) {
    education.stage = 'secondary'; education.school = person.city + ' Secondary School';
    if (isPlayer) fact(world, 'I moved on to ' + education.school + '.', 'education');
  }
  if ((education.stage === 'primary' || education.stage === 'secondary') && age >= rule.schoolEnd) {
    education.qualifications.push({ level: 'secondary', field: 'general', year: world.date.year }); education.stage = 'none';
    if (isPlayer) fact(world, 'I completed secondary education with grades of ' + education.grades + '%.', 'education');
    return;
  }
  if (education.stage === 'none' || education.paused) return;
  if (education.months >= education.tuitionPaidMonths && education.tuition > 0n && isPlayer) {
    if (education.funding === 'cash' && accountFor(world).cash < education.tuition) {
      education.paused = true;
      fact(world, 'My studies paused because I could not cover the next tuition payment. My completed work is preserved.', 'education'); return;
    }
    payTuition(world, education.funding === 'loan' ? 'loan' : 'cash');
  }
  education.months++;
  if (education.months % 12 === 0) {
    const change = (education.effort === 'focused' ? 5 : education.effort === 'relaxed' ? -4 : 1) + draw(world, isPlayer ? 'outcomes' : 'npcs', -3, 3) + (person.stats.stress > 70 ? -4 : 0) + (person.stats.health < 40 ? -4 : 0);
    education.grades = bounded(education.grades + change);
    person.stats.stress = bounded(person.stats.stress + (education.effort === 'focused' ? 5 : education.effort === 'relaxed' ? -4 : 0));
  }
  if (education.requiredMonths > 0 && education.months >= education.requiredMonths) {
    const level = education.stage === 'trade' ? 'trade' : education.stage === 'graduate' ? education.field as 'medicine' | 'law' : 'degree';
    if (education.grades >= 50) {
      education.qualifications.push({ level, field: education.field, year: world.date.year });
      if (isPlayer) fact(world, 'I completed my ' + education.field + ' ' + (level === 'degree' ? 'degree' : 'qualification') + ' with grades of ' + education.grades + '%.', 'education');
    } else if (isPlayer) fact(world, 'I finished the course but did not meet the passing grade. I was not awarded the qualification.', 'education');
    education.stage = 'none'; education.paused = false; education.tuition = 0n;
  }
}
