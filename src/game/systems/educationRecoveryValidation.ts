import { ageOn, compareDates } from '../personHelpers';
import type { World } from '../model';
import { rules } from '../rules';
import { recoveryPaths } from './educationRecoverySchemas';

export function validateEducationRecovery(world: World) {
  const ids = new Set<string>(), active = new Set<string>(), now = world.date.year * 12 + world.date.month - 1;
  for (const item of world.schoolCompletions) {
    const person = world.people[item.personId], month = item.date.year * 12 + item.date.month - 1;
    if (!person || ids.has(item.id) || item.id !== 'school_completion_' + item.personId + '_' + month || compareDates(item.date, world.date) > 0 || ageOn({ ...person, died: null }, item.date) < rules[item.country].schoolEnd || person.died && compareDates(item.date, person.died) > 0 || item.passed !== (item.grade >= 50 && item.recordedStudyMonths >= item.requiredStudyMonths)) throw new Error('Invalid secondary school outcome');
    if (item.passed && !person.education.qualifications.some(q => q.level === 'secondary' && q.field === 'general' && q.year === item.date.year)) throw new Error('School outcome lacks its earned qualification');
    ids.add(item.id);
  }
  for (const course of world.recoveryCourses) {
    const person = world.people[course.personId], path = recoveryPaths[course.purpose], start = course.started.year * 12 + course.started.month - 1;
    if (!person || ids.has(course.id) || compareDates(course.started, world.date) > 0 || ageOn({ ...person, died: null }, course.started) < Math.max(rules[course.country].adultAge, rules[course.country].schoolEnd) || course.requiredMonths !== path.months || course.targetGrade !== path.target || course.periods.length > course.requiredMonths || course.ended && (compareDates(course.ended, course.started) < 0 || compareDates(course.ended, world.date) > 0 || person.died && compareDates(course.ended, person.died) > 0)) throw new Error('Invalid evening course history');
    ids.add(course.id);
    const qualifiedBefore = person.education.qualifications.some(q => q.level === 'secondary' && q.year <= course.started.year);
    if (course.purpose === 'grades' && !qualifiedBefore) throw new Error('Grade recovery requires an existing secondary qualification');
    if (course.status === 'active') {
      if (active.has(person.id) || person.died || course.ended || course.reason || course.finalGrade !== null || course.qualificationAwarded || course.periods.length >= course.requiredMonths || person.country !== course.country || person.city !== course.city || person.education.stage !== 'none' || course.purpose === 'secondary' && person.education.qualifications.some(q => q.level === 'secondary')) throw new Error('Invalid active evening course');
      active.add(person.id);
    } else {
      if (!course.ended || course.finalGrade === null) throw new Error('Unfinished evening course outcome');
      if (course.status === 'passed' || course.status === 'failed') {
        const last = course.periods.at(-1);
        if (course.reason || course.periods.length !== course.requiredMonths || !last || last.month !== course.ended.year * 12 + course.ended.month - 1 || course.finalGrade !== last.gradeBefore + last.gradeGain || (course.status === 'passed') !== (course.finalGrade >= course.targetGrade)) throw new Error('Evening course result does not reconcile with attended work');
      } else if (course.periods.length >= course.requiredMonths || course.status === 'withdrawn' && !['withdrawn', 'moved'].includes(course.reason!) || course.status === 'died' && (course.reason !== 'died' || !person.died || compareDates(course.ended, person.died) !== 0) || course.status === 'superseded' && (course.purpose !== 'secondary' || course.reason !== 'qualified-elsewhere' || !person.education.qualifications.some(q => q.level === 'secondary' && q.year <= course.ended!.year))) throw new Error('Invalid early evening course outcome');
      if (course.qualificationAwarded !== (course.status === 'passed' && course.purpose === 'secondary') || course.qualificationAwarded && !person.education.qualifications.some(q => q.level === 'secondary' && q.field === 'general' && q.year === course.ended!.year)) throw new Error('Evening qualification does not reconcile');
    }
    for (let index = 0; index < course.periods.length; index++) {
      const period = course.periods[index], expectedGain = Math.min(100 - period.gradeBefore, period.effort === 'focused' ? 2 : period.effort === 'balanced' ? 1 : 0);
      if (period.month <= start || period.month > now || course.ended && period.month > course.ended.year * 12 + course.ended.month - 1 || index > 0 && period.month <= course.periods[index - 1].month || period.gradeGain !== expectedGain) throw new Error('Invalid attended evening-study period');
    }
  }
}
