import { z } from 'zod';
import { compareDates, Person, World } from '../model';
import { monthFrom } from '../calendar';
import { countries } from '../countries';
import { IneligibleAction } from '../errors';
import { formatMoney } from '../money';
import { fxMoney, netWorth } from '../valuation';
import { active, draw, fact, result } from './common';
import { enrollmentReason, tuitionFor } from './education';
import { fields } from './schemas';
import { activeScholarship, Scholarship, scholarshipKinds, scholarshipPolicies, studyPrograms } from './scholarshipSchemas';

export const scholarshipCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('apply-scholarship'), kind: z.enum(scholarshipKinds), program: z.enum(studyPrograms), field: z.enum(fields) }),
  z.object({ type: z.literal('decline-scholarship'), scholarshipId: z.string() }),
]);
export type ScholarshipCommand = z.infer<typeof scholarshipCommandSchema>;
export function scholarshipResources(world: World, person = active(world)): bigint {
  const worth = netWorth(world, person.id), cash = world.accounts.filter(item => item.ownerId === person.id).reduce((sum, item) => sum + fxMoney(world, { minor: item.cash, currency: item.currency }, worth.currency).minor, 0n);
  return [0n, worth.minor, cash].reduce((a, b) => a > b ? a : b);
}
const applicationKey = (world: World, kind: Scholarship['kind'], program: Scholarship['program'], field: Scholarship['field']) => world.activePersonId + ':scholarship:' + world.date.year + ':' + kind + ':' + program + ':' + field;
export function scholarshipReason(world: World, kind: Scholarship['kind'], program: Scholarship['program'], field: Scholarship['field']): string | undefined {
  const person = active(world), policy = scholarshipPolicies[kind], reason = enrollmentReason(world, program, field);
  if (reason) return reason;
  if (world.scholarships.some(item => item.personId === person.id && ['offered', 'active'].includes(item.status))) return 'Use or decline your existing scholarship offer first';
  if (world.actionCounts[applicationKey(world, kind, program, field)]) return 'You already applied for this scholarship and course this calendar year';
  const tuition = tuitionFor(person, program);
  if (!tuition) return 'This course has no tuition to waive';
  if (person.education.grades < policy.entryGrade) return 'Grades of at least ' + policy.entryGrade + '% are required';
  if (kind === 'access' && scholarshipResources(world) > tuition) return 'Your assessed resources exceed one year of tuition';
}
export function scholarshipOfferReason(world: World, item: Scholarship, program: Scholarship['program'], field: string): string | undefined {
  const person = active(world);
  if (item.status !== 'offered' || item.personId !== person.id || item.program !== program || item.field !== field || item.country !== person.country || item.city !== person.city || compareDates(world.date, item.expires) >= 0) return 'This scholarship offer no longer matches the course';
  if (person.education.grades < scholarshipPolicies[item.kind].entryGrade) return 'Your grades no longer meet the scholarship entry requirement';
  if (item.kind === 'access' && scholarshipResources(world) > item.annualTuition) return 'Your assessed resources no longer meet this scholarship requirement';
}
export function scholarshipWaiver(item: Pick<Scholarship, 'coverageBps'>, tuition: bigint): bigint { return tuition * BigInt(item.coverageBps) / 10000n; }
export function resolveScholarship(world: World, command: ScholarshipCommand) {
  if (command.type === 'decline-scholarship') {
    const item = world.scholarships.find(candidate => candidate.id === command.scholarshipId && candidate.personId === world.activePersonId && candidate.status === 'offered');
    if (!item) throw new IneligibleAction('Choose an available scholarship offer');
    item.status = 'withdrawn'; item.ended = { ...world.date };
    fact(world, 'I declined the ' + scholarshipPolicies[item.kind].label + ' offer for ' + item.field + '.', 'education');
    result(world, 'Offer declined', 'No tuition was paid and no money changed hands.', 'education'); return;
  }
  const reason = scholarshipReason(world, command.kind, command.program, command.field); if (reason) throw new IneligibleAction(reason);
  const person = active(world), policy = scholarshipPolicies[command.kind], roll = draw(world, 'outcomes', 1, 100), accepted = roll <= policy.chance;
  world.actionCounts[applicationKey(world, command.kind, command.program, command.field)] = 1;
  const item: Scholarship = { id: 'scholarship_' + person.id + '_' + world.revision + '_' + world.scholarships.length, personId: person.id, kind: command.kind, program: command.program, field: command.field, country: person.country, city: person.city, currency: countries[person.country].currency, applied: { ...world.date }, expires: monthFrom(world.date, 12, world.date.day), gradeAtApplication: person.education.grades, resourcesAtApplication: scholarshipResources(world), annualTuition: tuitionFor(person, command.program), roll, chance: policy.chance, coverageBps: policy.coverageBps, status: accepted ? 'offered' : 'declined', ended: accepted ? null : { ...world.date }, lossReason: null, lossAssessment: null, course: null, periods: [] };
  world.scholarships.push(item);
  fact(world, 'My ' + policy.label + ' application for ' + item.field + ' was ' + (accepted ? 'approved' : 'declined') + '.', 'education');
  result(world, accepted ? 'A scholarship offer' : 'Scholarship declined', accepted ? 'Your offer is available for twelve calendar months. Choose it when applying for this exact course. Admission is separate; no tuition is refunded and no cash grant is paid.' : 'The application was free. Your course, balance and existing student debt are unchanged.', 'education', accepted ? [{ id: 'waiver', label: 'Annual tuition waiver', value: formatMoney({ minor: scholarshipWaiver(item, item.annualTuition), currency: item.currency }), tone: 'positive' }] : []);
}
export function activateScholarship(world: World, id: string | undefined, program: Scholarship['program'], field: string) {
  if (!id) return;
  const item = world.scholarships.find(candidate => candidate.id === id);
  if (!item) throw new IneligibleAction('Choose an available scholarship offer');
  const reason = scholarshipOfferReason(world, item, program, field); if (reason) throw new IneligibleAction(reason);
  const person = active(world);
  item.status = 'active'; item.course = { started: { ...world.date }, school: person.education.school, requiredMonths: person.education.requiredMonths };
}
/** Assessed only when a new twelve-month tuition period is actually due. */
export function tuitionWaiver(world: World, person: Person): { item: Scholarship; waived: bigint; resources: bigint } | null {
  const item = activeScholarship(world, person.id), education = person.education;
  if (!item || item.country !== person.country || item.city !== person.city || item.program !== education.stage || item.field !== education.field || item.course?.school !== education.school) return null;
  const resources = scholarshipResources(world, person), policy = scholarshipPolicies[item.kind];
  const lossReason = education.grades < policy.renewalGrade ? 'grades' : item.kind === 'access' && resources > item.annualTuition ? 'resources' : null;
  if (lossReason) {
    item.status = 'lost'; item.lossReason = lossReason; item.ended = { ...world.date };
    item.lossAssessment = { date: { ...world.date }, studyMonth: education.tuitionPaidMonths, grades: education.grades, resources };
    fact(world, 'My ' + policy.label + ' ended at renewal because ' + (lossReason === 'grades' ? 'my grades fell below ' + policy.renewalGrade + '%.' : 'my assessed resources exceeded the limit.'), 'education', '', person.id);
    return null;
  }
  return { item, waived: scholarshipWaiver(item, education.tuition), resources };
}
export function finishScholarship(world: World, person: Person, passed: boolean) {
  const item = activeScholarship(world, person.id); if (!item) return;
  item.status = passed ? 'completed' : 'failed'; item.ended = { ...world.date };
}
export function refreshScholarships(world: World) {
  for (const item of world.scholarships) {
    if (!['active', 'offered'].includes(item.status)) continue;
    const person = world.people[item.personId];
    const status = person.died ? 'died' : person.country !== item.country || person.city !== item.city ? 'moved' : item.status === 'offered' ? compareDates(world.date, item.expires) >= 0 ? 'expired' : person.education.stage !== 'none' ? 'withdrawn' : null : person.education.stage !== item.program || person.education.field !== item.field || person.education.school !== item.course?.school ? 'withdrawn' : null;
    if (status) { item.status = status; item.ended = { ...(status === 'died' ? person.died! : world.date) }; }
  }
}
export function tuitionDue(world: World): bigint {
  const person = active(world), item = activeScholarship(world);
  if (!item || person.education.grades < scholarshipPolicies[item.kind].renewalGrade || item.kind === 'access' && scholarshipResources(world) > item.annualTuition) return person.education.tuition;
  return person.education.tuition - scholarshipWaiver(item, person.education.tuition);
}
