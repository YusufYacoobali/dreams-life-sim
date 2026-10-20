import { z } from 'zod';
import { countries } from '../countries';
import { fullName, Person, World } from '../model';
import { jobs } from '../content/jobs';
import { IneligibleAction } from '../errors';
import { active, bounded, draw, fact, result } from './common';
import { createContact } from './npcs';
import { connectPerson, relationFor } from './relationships';
import { activeTrip } from './travelSchemas';
import { hospitalized } from './healthSchemas';
import { isConfined } from './legalSchemas';
import { serviceAway } from './serviceSchemas';
import { currentWorkplace, raisedAnnualPay, raiseChance, Workplace, WorkplaceMember } from './workplaceSchemas';
import { formatMoney } from '../money';

export const workplaceCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('meet-coworkers') }),
  z.object({ type: z.literal('work-feedback'), workplaceId: z.string(), supervisorId: z.string() }),
  z.object({ type: z.literal('request-raise'), workplaceId: z.string(), supervisorId: z.string() }),
]);
export type WorkplaceCommand = z.infer<typeof workplaceCommandSchema>;
const supervisorRoles: Record<string, string> = { 'shop-assistant-part': 'retail', 'cafe-part': 'barista' };

export function workplaceReason(world: World): string | undefined {
  const person = active(world), job = person.employment, role = jobs.find(item => item.id === job?.roleId);
  if (!job || !role) return 'Start a job before meeting colleagues';
  if (job.companyId) return 'Your company team is managed from Business';
  if (role.specialCareer) return 'Your professional team is in your special career';
  if (job.employer !== person.city + ' ' + role.sector || job.currency !== countries[person.country].currency) return 'Your job is based elsewhere. Start local work before meeting a new local team';
  if (person.died || activeTrip(world) || hospitalized(world, person) || isConfined(world) || person.legal.wanted || serviceAway(world)) return 'Return to your normal work routine first';
}
export function colleagueAway(world: World, person: Person): boolean {
  return !!(activeTrip(world, person.id) || hospitalized(world, person) || isConfined(world, person) || person.legal.wanted || serviceAway(world, person.id));
}
function stillEmployedHere(world: World, place: Workplace, member: WorkplaceMember) {
  const person = world.people[member.personId], job = person?.employment;
  return !!person && !person.died && person.country === place.country && person.city === place.city && !!job && job.id === member.employmentId && job.employer === place.employer && job.currency === countries[place.country].currency && !job.companyId;
}
/** End or update existing records only. Rendering and loading never call an introduction. */
export function refreshWorkplaces(world: World) {
  for (const place of world.workplaces.filter(item => !item.ended)) {
    const person = world.people[place.personId], history = world.workHistory.find(item => item.id === place.employmentId);
    if (person.died || person.employment?.id !== place.employmentId || person.employment.employer !== place.employer || person.country !== place.country || person.city !== place.city) {
      place.ended = { ...(person.died ?? history?.ended ?? world.date) }; place.endReason = person.died ? 'died' : person.country !== place.country || person.city !== place.city ? 'moved' : 'left-job'; continue;
    }
    for (const member of place.members.filter(item => !item.left)) if (!stillEmployedHere(world, place, member)) {
      const contact = world.people[member.personId], employment = world.workHistory.find(item => item.id === member.employmentId);
      member.left = { ...(contact.died ?? employment?.ended ?? world.date) }; member.endReason = contact.died ? 'died' : contact.country !== place.country || contact.city !== place.city ? 'moved' : 'left-job';
    }
  }
}
function addColleague(world: World, place: Workplace, role: WorkplaceMember['role']) {
  const presentIds = new Set(place.members.filter(item => !item.left).map(item => item.personId));
  const known = world.workplaces.filter(item => item.personId === place.personId && item.employer === place.employer && item.country === place.country && item.city === place.city).flatMap(item => item.members).find(member => member.role === role && !presentIds.has(member.personId) && member.personId !== place.personId && stillEmployedHere(world, place, member));
  let person = known && world.people[known.personId];
  if (!person) {
    const job = world.people[place.personId].employment!, staffRole = role === 'supervisor' ? (supervisorRoles[job.roleId] ?? job.roleId) : job.roleId;
    person = createContact(world, { age: draw(world, 'npcs', role === 'supervisor' ? 35 : 28, role === 'supervisor' ? 58 : 50), country: place.country, city: place.city, qualifiedRole: staffRole });
    // This is a generated adult professional's background at the named employer,
    // not backdated player attendance or a new salary payment.
    person.employment!.employer = place.employer;
    world.workHistory.find(item => item.id === person!.employment!.id)!.employer = place.employer;
  }
  connectPerson(world, person.id, place.personId);
  const relation = relationFor(world, place.personId, person.id)!;
  if (!relation.roles.includes('coworker')) relation.roles.push('coworker');
  if (relation.kind === 'acquaintance') { relation.kind = 'coworker'; relation.roles = relation.roles.filter(item => item !== 'acquaintance'); }
  const memory = 'work:' + place.id; if (!relation.memories.includes(memory)) relation.memories.push(memory);
  const member: WorkplaceMember = { personId: person.id, employmentId: person.employment!.id, role, joined: { ...world.date }, left: null, endReason: null };
  place.members.push(member);
  return person;
}
function fillRoster(world: World, place: Workplace) {
  if (!place.members.some(item => !item.left && item.role === 'supervisor')) {
    const supervisor = addColleague(world, place, 'supervisor');
    fact(world, fullName(supervisor) + ' became my supervisor at ' + place.employer + '.', 'work-contact', '', place.personId);
  }
  while (place.members.filter(item => !item.left && item.role === 'coworker').length < 2) addColleague(world, place, 'coworker');
}
/** Only an already-introduced workplace hires replacements during actual work. */
export function workplaceMonth(world: World) {
  refreshWorkplaces(world); const place = currentWorkplace(world);
  if (place && !workplaceReason(world)) fillRoster(world, place);
}
function supervisorReason(world: World, place: Workplace | undefined, supervisorId: string): string | undefined {
  const reason = workplaceReason(world); if (reason) return reason;
  if (!place || currentWorkplace(world)?.id !== place.id) return 'Choose your current workplace';
  const member = place.members.find(item => item.personId === supervisorId && item.role === 'supervisor' && !item.left);
  if (!member || !stillEmployedHere(world, place, member) || colleagueAway(world, world.people[supervisorId])) return 'Your current supervisor is unavailable';
}
export function workFeedbackReason(world: World, place: Workplace | undefined, supervisorId: string): string | undefined {
  const reason = supervisorReason(world, place, supervisorId); if (reason) return reason;
  if (active(world).employment!.paidMonths < 3) return 'Complete three paid months in this job first';
  if (world.workplaces.some(item => item.personId === place!.personId && item.employmentId === place!.employmentId && item.feedback.some(feedback => feedback.date.year === world.date.year))) return 'You already asked for work feedback this year';
  if (active(world).stats.energy < 4) return 'Rest before this work discussion';
}
export function workRaiseReason(world: World, place: Workplace | undefined, supervisorId: string): string | undefined {
  const unavailable = workplaceReason(world); if (unavailable) return unavailable;
  if (!place) return 'Meet your supervisor through View Coworkers first';
  const reason = supervisorReason(world, place, supervisorId); if (reason) return reason;
  const person = active(world), job = person.employment!;
  if (job.paidMonths < 12) return 'Complete twelve paid months in this job first';
  if (world.workRaises.some(item => item.personId === person.id && item.employmentId === job.id && item.date.year === world.date.year)) return 'You already asked for a raise in this job this year';
  if (job.performance < 65) return 'Reach 65% work performance before requesting a raise';
  if (person.stats.energy < 6) return 'Rest before negotiating your pay';
  if (raisedAnnualPay(job.annualPay) <= job.annualPay) return 'Your employer has no higher pay offer available';
}
export function resolveWorkplace(world: World, command: WorkplaceCommand) {
  const person = active(world);
  if (command.type === 'meet-coworkers') {
    const reason = workplaceReason(world); if (reason) throw new IneligibleAction(reason);
    if (currentWorkplace(world)) throw new IneligibleAction('You already know the people at this workplace');
    const job = person.employment!, place: Workplace = { id: 'workplace_' + person.id + '_' + world.revision + '_' + world.workplaces.length, personId: person.id, employmentId: job.id, employer: job.employer, country: person.country, city: person.city, started: { ...world.date }, ended: null, endReason: null, members: [], feedback: [] };
    world.workplaces.push(place); fillRoster(world, place);
    const names = place.members.map(item => world.people[item.personId].firstName).join(', ');
    fact(world, 'I got to know ' + names + ' at ' + place.employer + '.', 'work-contact');
    result(world, 'Faces to the names', 'Your colleagues are ' + names + '. You can get to know them from your workplace.', 'career'); return;
  }
  const place = world.workplaces.find(item => item.id === command.workplaceId);
  if (command.type === 'request-raise') {
    const reason = workRaiseReason(world, place, command.supervisorId); if (reason) throw new IneligibleAction(reason);
    const supervisor = world.people[command.supervisorId], job = person.employment!, trust = relationFor(world, person.id, supervisor.id)!.trust;
    const chance = raiseChance(job.performance, trust), roll = draw(world, 'outcomes', 1, 100), accepted = roll <= chance, annualPayBefore = job.annualPay, annualPayAfter = accepted ? raisedAnnualPay(annualPayBefore) : annualPayBefore;
    world.workRaises.push({ id: 'raise_' + person.id + '_' + world.revision, workplaceId: place!.id, personId: person.id, employmentId: job.id, date: { ...world.date }, supervisorId: supervisor.id, supervisorEmploymentId: supervisor.employment!.id, currency: job.currency, paidMonths: job.paidMonths, performance: job.performance, trust, chance, roll, accepted, annualPayBefore, annualPayAfter });
    person.stats.energy -= 6; job.annualPay = annualPayAfter;
    const salary = formatMoney({ minor: annualPayAfter, currency: job.currency });
    fact(world, 'I asked ' + supervisor.firstName + ' for a raise. ' + (accepted ? 'My annual gross pay rose to ' + salary + '.' : 'The answer was no.'), 'work-raise');
    result(world, accepted ? 'Worth the awkward conversation' : 'Not this year', accepted ? supervisor.firstName + ' agrees to a 5% raise. Your higher rate starts with your next paid period.' : supervisor.firstName + ' says the budget will not stretch. Your current pay stays the same; you can ask again next year.', 'career', [
      { id: 'salary', label: 'Annual gross pay', value: salary, tone: accepted ? 'positive' : 'neutral' },
      { id: 'energy', label: 'Energy', value: '−6%', tone: 'negative' },
    ]); return;
  }
  const reason = workFeedbackReason(world, place, command.supervisorId); if (reason) throw new IneligibleAction(reason);
  const supervisor = world.people[command.supervisorId], relation = relationFor(world, person.id, supervisor.id)!, job = person.employment!;
  const trustAtRequest = relation.trust, chance = Math.min(95, 50 + Math.floor(trustAtRequest / 2)), roll = draw(world, 'outcomes', 1, 100), accepted = roll <= chance, performanceBefore = job.performance, performanceGain = accepted ? Math.min(3, 100 - performanceBefore) : 0;
  place!.feedback.push({ date: { ...world.date }, supervisorId: supervisor.id, supervisorEmploymentId: supervisor.employment!.id, paidMonths: job.paidMonths, trustAtRequest, chance, roll, accepted, performanceBefore, performanceGain });
  person.stats.energy -= 4; job.performance += performanceGain; const bondBefore = relation.strength;
  if (accepted) { relation.strength = bounded(relation.strength + 2); relation.trust = bounded(relation.trust + 1); }
  fact(world, 'I asked ' + supervisor.firstName + ' for work feedback. ' + (accepted ? 'We found a useful change to make.' : 'They could not fit in the discussion this year.'), 'work-feedback');
  result(world, accepted ? 'A clearer target' : 'Not a good time', accepted ? supervisor.firstName + ' gives you one useful thing to change. It is considerably more helpful than “be more proactive”.' : supervisor.firstName + ' is too busy to talk. You leave the discussion for another year.', 'career', [
    { id: 'performance', label: 'Performance', value: '+' + performanceGain + '%', tone: performanceGain ? 'positive' : 'neutral' },
    { id: 'energy', label: 'Energy', value: '−4%', tone: 'negative' },
    ...(accepted ? [{ id: 'bond', label: 'Relationship', value: '+' + (relation.strength - bondBefore) + '%', tone: relation.strength > bondBefore ? 'positive' as const : 'neutral' as const }] : []),
  ]);
}
