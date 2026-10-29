import type { World } from '../model';
import { countries } from '../countries';
import { storyPersonPresent } from './storyContext';

/** Future scenes use a recorded current enrolment, never a reconstructed old slot.
 * Active includes the first funded month; it does not establish prior attendance. */
export function studyStoryContext(world: World) {
  const person = world.people[world.activePersonId], education = person.education;
  if (!['trade', 'university', 'graduate'].includes(education.stage) || !storyPersonPresent(world, person)) return;
  let course: World['studyCourses'][number] | undefined;
  for (const item of world.studyCourses) {
    if (item.personId !== person.id || item.status !== 'active') continue;
    if (course) return;
    course = item;
  }
  if (!course || course.origin !== 'enrolment' || !course.started || !course.firstPayment || course.ended ||
    course.program !== education.stage || course.school !== education.school || course.field !== education.field ||
    course.country !== person.country || course.city !== person.city || course.currency !== countries[person.country].currency ||
    course.months !== education.months || course.requiredMonths !== education.requiredMonths || course.grades !== education.grades ||
    course.funding !== education.funding || course.annualTuition !== education.tuition || course.tuitionPaidMonths !== education.tuitionPaidMonths ||
    education.requiredMonths <= 0 || education.months < 0 || education.months >= education.requiredMonths) return;
  // A later deposit need not resume a paused course; the saved tuition boundary
  // corroborates its reason without guessing current funding or loan decisions.
  if (education.paused && (education.tuition <= 0n || education.months < education.tuitionPaidMonths)) return;
  return { courseId: course.id, school: course.school, field: course.field, state: education.paused ? 'paused' as const : 'active' as const };
}
