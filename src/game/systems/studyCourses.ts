import type { Person, World } from '../model';
import { countries } from '../countries';
import { fields } from './schemas';
import type { StudyCourse } from './studyCourseSchemas';

const program = (person: Person) => ['university', 'trade', 'graduate'].includes(person.education.stage) ? person.education.stage as NonNullable<StudyCourse['program']> : null;
function observation(world: World, person: Person): StudyCourse {
  const education = person.education;
  if (!fields.includes(education.field as typeof fields[number]) || !education.school || education.requiredMonths <= 0) throw new Error('Cannot record an unknown study course');
  return { id: 'study_' + person.id + '_' + world.revision + '_' + world.studyCourses.length, personId: person.id, origin: 'legacy-current', status: 'withdrawn', program: program(person), field: education.field as typeof fields[number], school: education.school, country: null, city: null, currency: null, recorded: { ...world.date }, started: null, ended: { ...world.date }, months: education.months, requiredMonths: education.requiredMonths, grades: education.grades, funding: education.funding, annualTuition: education.tuition, tuitionPaidMonths: education.tuitionPaidMonths, admissionId: null, firstPayment: null };
}
function update(world: World, person: Person, item: StudyCourse) {
  const education = person.education;
  item.recorded = { ...world.date }; item.months = education.months; item.grades = education.grades; item.funding = education.funding; item.tuitionPaidMonths = education.tuitionPaidMonths;
}
/** Preserve a genuinely incomplete old slot before a new course overwrites it.
 * Its historical course type, dates, currency and payments are not inferred. */
export function observeIncompleteStudy(world: World, person: Person) {
  const education = person.education;
  if (education.stage !== 'none' || education.requiredMonths <= 0 || education.months >= education.requiredMonths || !fields.includes(education.field as typeof fields[number]) || !education.school) return;
  if (world.studyCourses.some(item => item.personId === person.id && item.school === education.school && item.field === education.field && item.months === education.months && item.requiredMonths === education.requiredMonths && item.tuitionPaidMonths === education.tuitionPaidMonths && (item.status === 'withdrawn' || item.status === 'observed-incomplete'))) return;
  const item = observation(world, person); item.origin = 'legacy-incomplete'; item.status = 'observed-incomplete'; item.ended = null; world.studyCourses.push(item);
}
/** Called only after a real course start and its real first tuition operation. */
export function beginStudyCourse(world: World, person: Person, payment: NonNullable<StudyCourse['firstPayment']>, admissionId?: string) {
  const item = observation(world, person);
  item.origin = 'enrolment'; item.status = 'active'; item.started = { ...world.date }; item.ended = null; item.country = person.country; item.city = person.city; item.currency = countries[person.country].currency; item.firstPayment = payment; item.admissionId = admissionId ?? null;
  world.studyCourses.push(item);
}
export function syncStudyCourse(world: World, person: Person) {
  if (!program(person)) return;
  const item = world.studyCourses.find(candidate => candidate.personId === person.id && candidate.status === 'active');
  if (item) update(world, person, item);
}
export function endStudyCourse(world: World, person: Person, status: 'withdrawn' | 'completed' | 'failed' | 'died') {
  if (!program(person)) return;
  let item = world.studyCourses.find(candidate => candidate.personId === person.id && candidate.status === 'active');
  if (!item) { item = observation(world, person); world.studyCourses.push(item); }
  update(world, person, item); item.status = status; item.ended = { ...(status === 'died' ? person.died! : world.date) };
}
export function refreshStudyCourses(world: World) {
  for (const item of world.studyCourses) if (item.status === 'active') update(world, world.people[item.personId], item);
}
