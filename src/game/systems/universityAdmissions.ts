import { z } from 'zod';
import { monthFrom } from '../calendar';
import { countries } from '../countries';
import { IneligibleAction } from '../errors';
import { compareDates } from '../personHelpers';
import type { World } from '../model';
import { formatMoney } from '../money';
import { offerPending } from '../pendingQueue';
import { rules } from '../rules';
import { accountFor, active, availableCash, draw, fact, result } from './common';
import { coursePrerequisiteReason, enrollmentReason, startCourse } from './education';
import { fields } from './schemas';
import { scholarshipOfferReason, scholarshipWaiver } from './scholarships';
import { activeUniversityApplication, admissionAttemptKey, admissionChance, initialAdmissionStatus, universityTuitionV1, type UniversityApplication } from './universityAdmissionSchemas';

export const universityAdmissionCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('apply-university'), field: z.enum(fields) }),
  z.object({ type: z.literal('withdraw-university-application'), applicationId: z.string() }),
  z.object({ type: z.literal('accept-university-place'), applicationId: z.string(), funding: z.enum(['cash', 'loan']), scholarshipId: z.string().optional() }),
]);
export type UniversityAdmissionCommand = z.infer<typeof universityAdmissionCommandSchema>;

export function universityApplicationReason(world: World, field: typeof fields[number]): string | undefined {
  return enrollmentReason(world, 'university', field);
}
export function matchingAdmission(world: World, field: string) {
  const item = activeUniversityApplication(world), person = active(world);
  return item?.field === field && item.country === person.country && item.city === person.city ? item : undefined;
}
export function universityPlaceQuote(world: World, item: UniversityApplication, scholarshipId?: string) {
  let waived = 0n;
  if (scholarshipId) {
    const aid = world.scholarships.find(candidate => candidate.id === scholarshipId);
    if (!aid) throw new IneligibleAction('Choose an available scholarship offer');
    const reason = scholarshipOfferReason(world, aid, 'university', item.field); if (reason) throw new IneligibleAction(reason);
    if (aid.annualTuition !== item.annualTuition) throw new IneligibleAction('This scholarship does not match the offered tuition');
    waived = scholarshipWaiver(aid, item.annualTuition);
  }
  const account = accountFor(world), debt = world.liabilities.find(candidate => candidate.id === 'debt_student_' + world.activePersonId + '_' + account.currency);
  return { tuition: item.annualTuition, waived, billed: item.annualTuition - waived, interestBps: debt?.interestBps ?? rules[active(world).country].studentInterestBps, existingLoan: !!debt };
}
export function universityPlaceReason(world: World, applicationId: string, funding?: 'cash' | 'loan', scholarshipId?: string): string | undefined {
  const item = world.universityApplications.find(candidate => candidate.id === applicationId), person = active(world);
  if (!item || item.personId !== person.id || item.status !== 'accepted' || item.country !== person.country || item.city !== person.city || !item.expires || compareDates(world.date, item.expires) >= 0) return 'Choose a current university place offer';
  const reason = coursePrerequisiteReason(world, 'university', item.field); if (reason) return reason;
  try {
    const quote = universityPlaceQuote(world, item, scholarshipId);
    if (funding === 'cash' && availableCash(accountFor(world)) < quote.billed) return 'Your available balance cannot cover the first year’s tuition';
  } catch (error) { if (error instanceof IneligibleAction) return error.message; throw error; }
}
function transition(world: World, item: UniversityApplication, status: UniversityApplication['status']) {
  item.status = status; item.transitions.push({ date: { ...world.date }, status });
  if (status === 'accepted') { item.offered = { ...world.date }; item.expires = monthFrom(world.date, 12); }
  if (status !== 'accepted' && status !== 'waitlisted') item.ended = { ...(status === 'died' ? world.people[item.personId].died! : world.date) };
}
export function resolveUniversityAdmission(world: World, command: UniversityAdmissionCommand) {
  const person = active(world);
  if (command.type === 'apply-university') {
    const reason = universityApplicationReason(world, command.field); if (reason) throw new IneligibleAction(reason);
    const roll = draw(world, 'outcomes', 1, 100), chance = admissionChance(person.education.grades, person.stats.smarts), status = initialAdmissionStatus(roll, chance);
    const item: UniversityApplication = { id: 'admission_' + person.id + '_' + world.revision + '_' + world.universityApplications.length, personId: person.id, policyVersion: 1, field: command.field, country: person.country, city: person.city, school: person.city + ' University', currency: countries[person.country].currency, annualTuition: universityTuitionV1[person.country], requiredMonths: 48, applied: { ...world.date }, grades: person.education.grades, smarts: person.stats.smarts, roll, chance, status, transitions: [{ date: { ...world.date }, status }], reviewDue: status === 'waitlisted' ? monthFrom(world.date, 1) : null, review: null, offered: status === 'accepted' ? { ...world.date } : null, expires: status === 'accepted' ? monthFrom(world.date, 12) : null, ended: status === 'rejected' ? { ...world.date } : null, enrolment: null };
    world.universityApplications.push(item); world.actionCounts[admissionAttemptKey(person.id, world.date.year, item.field)] = 1;
    fact(world, 'My application to study ' + item.field + ' at ' + item.school + ' was ' + status + '.', 'education');
    result(world, status === 'accepted' ? 'A university place offer' : status === 'waitlisted' ? 'On the university waitlist' : 'University application rejected', status === 'accepted' ? 'The university has accepted your application. Review and accept the place separately within twelve calendar months. No course, tuition, loan or scholarship has started.' : status === 'waitlisted' ? 'The university will make one final decision in one calendar month. No tuition is due while you wait. You can withdraw the application.' : 'This application did not receive a place. It was free; your course, money and debt are unchanged.', 'education');
    return;
  }
  const item = world.universityApplications.find(candidate => candidate.id === command.applicationId && candidate.personId === person.id);
  if (!item || !['accepted', 'waitlisted'].includes(item.status)) throw new IneligibleAction('Choose a current university application');
  if (command.type === 'withdraw-university-application') {
    transition(world, item, 'withdrawn'); fact(world, 'I withdrew my university application for ' + item.field + '.', 'education');
    result(world, 'Application withdrawn', 'The application remains in your history. No tuition was paid, no loan was drawn and this year’s application attempt is not reset.', 'education'); return;
  }
  const reason = universityPlaceReason(world, item.id, command.funding, command.scholarshipId); if (reason) throw new IneligibleAction(reason);
  const quote = universityPlaceQuote(world, item, command.scholarshipId), payment = startCourse(world, 'university', item.field, command.funding, undefined, command.scholarshipId, item.id);
  item.enrolment = { date: { ...world.date }, funding: command.funding, scholarshipId: command.scholarshipId ?? null, ...payment, loanInterestBps: payment.loanTransactionId ? quote.interestBps : null };
  transition(world, item, 'enrolled');
  fact(world, 'I accepted my place at ' + item.school + ' to study ' + item.field + ' and enrolled.', 'education');
  result(world, 'You’re enrolled', 'You accepted the offered place and the reviewed first year is funded. Future annual tuition needs funding while you study; scholarship renewal requirements apply. Living costs and existing debt are separate.', 'education', [{ id: 'tuition', label: 'First-year tuition billed', value: formatMoney({ minor: payment.billed, currency: item.currency }), tone: payment.billed ? 'negative' : 'neutral' }, ...(payment.waived ? [{ id: 'waived', label: 'Tuition waived', value: formatMoney({ minor: payment.waived, currency: item.currency }), tone: 'positive' as const }] : [])]);
}
/** Close only real open applications; old courses never acquire admission history. */
export function refreshUniversityApplications(world: World) {
  for (const item of world.universityApplications) {
    if (item.status !== 'accepted' && item.status !== 'waitlisted') continue;
    const person = world.people[item.personId];
    const status = person.died ? 'died' : person.country !== item.country || person.city !== item.city ? 'moved' : person.education.stage !== 'none' ? 'other-course' : item.status === 'accepted' && item.expires && compareDates(world.date, item.expires) >= 0 ? 'expired' : null;
    if (status) transition(world, item, status);
  }
}
/** Ordinary calendar progression resolves the saved waitlist roll exactly once. */
export function universityAdmissionsMonth(world: World) {
  refreshUniversityApplications(world);
  for (const item of world.universityApplications) {
    if (item.status !== 'waitlisted' || !item.reviewDue || compareDates(world.date, item.reviewDue) < 0) continue;
    const person = world.people[item.personId];
    item.review = { date: { ...world.date }, grades: person.education.grades, secondaryQualified: person.education.qualifications.some(q => q.level === 'secondary') };
    const accepted = item.roll <= item.chance && item.review.grades >= 55 && item.review.secondaryQualified;
    transition(world, item, accepted ? 'accepted' : 'rejected');
    fact(world, 'My waitlisted application to study ' + item.field + ' was ' + (accepted ? 'accepted' : 'rejected') + ' at its final review.', 'education', '', item.personId);
    if (item.personId !== world.activePersonId) continue;
    if (accepted && world.annual?.stage === 'months') world.annual.pausedForPlanning = true;
    offerPending(world, { kind: 'result', id: item.id + '_review', title: accepted ? 'A university place offer' : 'Waitlist decision', body: accepted ? 'Your waitlisted application has received a place offer. The year has paused for planning. You have twelve calendar months to review the actual tuition and accept or withdraw; no course or payment has started.' : 'The final waitlist review did not offer you a place. No tuition or loan was charged. The application and its one final decision remain in your history.', illustration: 'education', effects: [] });
  }
}
