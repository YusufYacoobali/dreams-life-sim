import { z } from 'zod';
import { ageOn } from '../personHelpers';
import type { Person, World } from '../model';
import { rules } from '../rules';
import { IneligibleAction } from '../errors';
import { active, bounded, fact, result } from './common';
import { currentRecovery, RecoveryCourse, recoveryPaths } from './educationRecoverySchemas';
import { activeTrip } from './travelSchemas';
import { hospitalized } from './healthSchemas';
import { isConfined } from './legalSchemas';
import { serviceAway } from './serviceSchemas';
import { educationMilestone } from './educationMilestones';

export const recoveryCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('enroll-recovery'), purpose: z.enum(['secondary', 'grades']) }),
  z.object({ type: z.literal('recovery-study'), courseId: z.string() }),
  z.object({ type: z.literal('recovery-effort'), courseId: z.string(), effort: z.enum(['relaxed', 'balanced', 'focused']) }),
  z.object({ type: z.literal('leave-recovery'), courseId: z.string() }),
]);
export type RecoveryCommand = z.infer<typeof recoveryCommandSchema>;
const absolute = (world: World) => world.date.year * 12 + world.date.month - 1;
export const hasSecondary = (person: Person) => person.education.qualifications.some(item => item.level === 'secondary');

export function recoveryAttendanceReason(world: World, person = active(world)): string | undefined {
  if (person.died) return 'This life has ended';
  if (hospitalized(world, person)) return 'Hospital care pauses evening classes';
  if (person.stats.health < 25) return 'Recover your health before attending evening classes';
  if (isConfined(world, person) || person.legal.wanted) return 'Custody or active pursuit pauses evening classes';
  if (activeTrip(world, person.id) || serviceAway(world, person.id)) return 'Evening classes resume when you return home';
}
export function recoveryReason(world: World, purpose: keyof typeof recoveryPaths): string | undefined {
  const person = active(world);
  if (ageOn(person, world.date) < Math.max(rules[person.country].adultAge, rules[person.country].schoolEnd)) return 'Finish your school years before joining an adult course';
  const absence = recoveryAttendanceReason(world, person); if (absence) return absence;
  if (currentRecovery(world)) return 'Finish or leave your current evening course first';
  if (person.education.stage !== 'none') return 'Finish or leave your current studies first';
  if (purpose === 'secondary' && hasSecondary(person)) return 'You already hold a secondary qualification';
  if (purpose === 'grades' && !hasSecondary(person)) return 'Complete secondary education before taking the grade-improvement course';
  if (purpose === 'grades' && person.education.grades >= 55) return 'Your grades already meet the ordinary university entry threshold';
}
function closeRecovery(world: World, course: RecoveryCourse, status: Exclude<RecoveryCourse['status'], 'active'>, reason: RecoveryCourse['reason'] = null) {
  course.status = status; course.reason = reason; course.ended = { ...world.date }; course.finalGrade = world.people[course.personId].education.grades;
}
/** Permanent changes close the original course; temporary absence earns no credits. */
export function refreshRecoveries(world: World) {
  for (const course of world.recoveryCourses.filter(item => item.status === 'active')) {
    const person = world.people[course.personId];
    if (person.died) closeRecovery(world, course, 'died', 'died');
    else if (person.country !== course.country || person.city !== course.city) {
      closeRecovery(world, course, 'withdrawn', 'moved');
      fact(world, 'My evening course at ' + course.school + ' ended when I moved. My recorded work stays in my education history.', 'education', '', person.id);
    } else if (course.purpose === 'secondary' && hasSecondary(person)) {
      closeRecovery(world, course, 'superseded', 'qualified-elsewhere');
      fact(world, 'I completed a secondary qualification through another route. My unfinished evening course did not award a second one.', 'education', '', person.id);
    }
  }
}

/** A real school outcome. Old qualifications are never reassessed on load. */
export function completeSecondary(world: World, person: Person) {
  const education = person.education, passed = education.grades >= 50 && education.months >= 12;
  world.schoolCompletions.push({ id: 'school_completion_' + person.id + '_' + absolute(world), personId: person.id, country: person.country, city: person.city, school: education.school, date: { ...world.date }, grade: education.grades, passed, recordedStudyMonths: education.months, requiredStudyMonths: 12 });
  if (passed && !hasSecondary(person)) education.qualifications.push({ level: 'secondary', field: 'general', year: world.date.year });
  education.stage = 'none'; education.paused = false; education.tuition = 0n;
  fact(world, passed ? 'I completed secondary education with grades of ' + education.grades + '%.' : 'I finished school with grades of ' + education.grades + '%. I did not earn the secondary qualification. An adult recovery course is still an option.', 'education', '', person.id);
  educationMilestone(world, person, 'secondary-completed', passed ? 'Secondary school completed' : 'No diploma in the envelope',
    passed ? 'You graduated from ' + education.school + '. Your secondary qualification is recorded.' : 'You finished at ' + education.school + ' without a diploma. Evening classes offer another route.',
    [{ id: 'school-grade', label: 'Final grades', value: education.grades + '% (50% required)', tone: education.grades >= 50 ? 'positive' : 'negative' }, { id: 'school-attendance', label: 'Recorded study', value: education.months + ' months (12 required)', tone: education.months >= 12 ? 'positive' : 'negative' }]);
}

export function resolveRecovery(world: World, command: RecoveryCommand) {
  const person = active(world);
  if (command.type === 'enroll-recovery') {
    const reason = recoveryReason(world, command.purpose); if (reason) throw new IneligibleAction(reason);
    const path = recoveryPaths[command.purpose];
    world.recoveryCourses.push({ id: 'recovery_' + person.id + '_' + world.revision + '_' + world.recoveryCourses.length, personId: person.id, country: person.country, city: person.city, school: person.city + ' Adult Learning Centre', purpose: command.purpose, started: { ...world.date }, ended: null, status: 'active', reason: null, requiredMonths: path.months, targetGrade: path.target, effort: 'balanced', finalGrade: null, qualificationAwarded: false, periods: [] });
    fact(world, 'I joined the ' + (command.purpose === 'secondary' ? 'secondary completion' : 'school-grade improvement') + ' evening course at ' + person.city + ' Adult Learning Centre.', 'education');
    result(world, 'Evening course enrolled', 'Your place is confirmed without a tuition fee or loan. Progress requires ' + path.months + ' attended months and a final grade of at least ' + path.target + '%. You can keep your job.', 'education'); return;
  }
  const course = currentRecovery(world);
  if (!course || course.id !== command.courseId) throw new IneligibleAction('Choose your current evening course');
  if (command.type === 'leave-recovery') {
    closeRecovery(world, course, 'withdrawn', 'withdrawn');
    fact(world, 'I left my evening course after ' + course.periods.length + ' attended months. I kept my existing qualifications.', 'education');
    result(world, 'Evening course ended', 'Your study history and grades are preserved. Existing qualifications remain valid.', 'education'); return;
  }
  if (command.type === 'recovery-effort') {
    course.effort = command.effort; result(world, 'Evening study routine updated', 'Your routine affects grades, energy and stress during actual attended months.', 'education'); return;
  }
  const unavailable = recoveryAttendanceReason(world, person); if (unavailable) throw new IneligibleAction(unavailable);
  if (person.education.lastStudyYear === world.date.year) throw new IneligibleAction('You already did extra study this year');
  if (person.stats.energy < 8) throw new IneligibleAction('Rest before doing extra study');
  person.education.lastStudyYear = world.date.year;
  const gain = Math.min(100 - person.education.grades, 5 + Math.floor(person.stats.discipline / 25)); person.education.grades += gain;
  person.stats.energy = bounded(person.stats.energy - 8); person.stats.stress = bounded(person.stats.stress + 3);
  fact(world, 'I put extra work into my evening studies. My grades improved by ' + gain + ' percentage points.', 'education');
  result(world, 'Extra work completed', 'Your actual grades improved. This study session does not replace an attended course month.', 'education', [{ id: 'recovery-grades', label: 'Grades', value: '+' + gain + '%', tone: 'positive' }]);
}

export function recoveryMonth(world: World) {
  refreshRecoveries(world);
  for (const course of world.recoveryCourses.filter(item => item.status === 'active')) {
    const person = world.people[course.personId], month = absolute(world);
    if (month <= course.started.year * 12 + course.started.month - 1 || course.periods.at(-1)?.month === month || recoveryAttendanceReason(world, person)) continue;
    const gradeBefore = person.education.grades, gain = Math.min(100 - gradeBefore, course.effort === 'focused' ? 2 : course.effort === 'balanced' ? 1 : 0);
    person.education.grades += gain; person.stats.energy = bounded(person.stats.energy - (course.effort === 'focused' ? 2 : course.effort === 'balanced' ? 1 : 0));
    person.stats.stress = bounded(person.stats.stress + (course.effort === 'focused' ? 1 : course.effort === 'relaxed' ? -1 : 0));
    course.periods.push({ month, effort: course.effort, gradeBefore, gradeGain: gain });
    if (course.periods.length === course.requiredMonths) {
      const passed = person.education.grades >= course.targetGrade;
      if (passed && course.purpose === 'secondary' && !hasSecondary(person)) { person.education.qualifications.push({ level: 'secondary', field: 'general', year: world.date.year }); course.qualificationAwarded = true; }
      closeRecovery(world, course, passed ? 'passed' : 'failed');
      fact(world, 'I completed ' + course.periods.length + ' attended evening-study months with grades of ' + course.finalGrade + '%. ' + (passed ? course.qualificationAwarded ? 'I earned my secondary qualification.' : 'I met the grade-improvement course’s passing threshold.' : 'I did not meet the passing grade. I can take another course.'), 'education', '', person.id);
      if (person.id === world.activePersonId) result(world, passed ? course.qualificationAwarded ? 'Secondary qualification earned' : 'School grades improved' : 'The course finished without a pass', passed ? 'Your completed course and actual grades are saved. Further courses and jobs still check their own entry requirements.' : 'Your completed work is recorded, but the passing grade was not met. Existing qualifications remain valid. You can try again.', 'education');
    }
  }
}
