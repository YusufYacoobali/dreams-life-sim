import { z } from 'zod';
import { ageOn, fullName, World } from '../model';
import { IneligibleAction } from '../errors';
import { currentSchool, schoolClubs, schoolConducts, SchoolCommunity } from './schoolSchemas';
import { active, bounded, draw, fact, result } from './common';
import { createContact } from './npcs';
import { connectPerson, relationFor } from './relationships';
import { moveHousehold } from './households';
import { activeTrip } from './travelSchemas';
import { hospitalized } from './healthSchemas';
import { isConfined } from './legalSchemas';
import { serviceAway } from './serviceSchemas';

export const schoolCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('school-club'), communityId: z.string(), club: z.enum(schoolClubs) }),
  z.object({ type: z.literal('school-conduct'), communityId: z.string(), conduct: z.enum(schoolConducts) }),
  z.object({ type: z.literal('school-help'), communityId: z.string(), teacherId: z.string() }),
]);
export type SchoolCommand = z.infer<typeof schoolCommandSchema>;
const absolute = (world: World) => world.date.year * 12 + world.date.month - 1;
export const clubSkill = { sport: 'sport', music: 'music', drama: 'acting', science: 'science' } as const;
export const clubLabels = { none: 'No Club', sport: 'Sports Club', music: 'Music Club', drama: 'Drama Club', science: 'Science Club' };
export function refreshSchools(world: World) {
  for (const community of world.schoolCommunities.filter(item => !item.ended)) {
    const person = world.people[community.personId];
    if (person.died || person.education.stage !== community.stage || person.education.school !== community.school || person.country !== community.country || person.city !== community.city) {
      community.ended = { ...world.date }; community.endReason = person.died ? 'died' : person.education.stage === 'none' && person.education.qualifications.some(item => item.level === 'secondary') ? 'graduated' : 'changed-school';
    }
  }
}
function teacherAvailable(world: World, teacherId: string, community: SchoolCommunity) {
  const teacher = world.people[teacherId];
  return !!teacher && !teacher.died && teacher.country === community.country && teacher.city === community.city && teacher.employment?.roleId === 'teacher' && !activeTrip(world, teacherId) && !hospitalized(world, teacher) && !isConfined(world, teacher) && !teacher.legal.wanted && !serviceAway(world, teacherId);
}
function addTeacher(world: World, community: SchoolCommunity) {
  const teacher = createContact(world, { age: draw(world, 'npcs', 30, 52), country: community.country, city: community.city, qualifiedRole: 'teacher' });
  connectPerson(world, teacher.id, community.personId);
  const relation = relationFor(world, community.personId, teacher.id)!; relation.kind = 'teacher'; relation.roles = ['teacher']; relation.strength = 45; relation.trust = 50;
  community.teacherIds.push(teacher.id); community.currentTeacherId = teacher.id;
  fact(world, fullName(teacher) + ' became my class teacher at ' + community.school + '.', 'school-contact', '', community.personId);
}
function addClassmate(world: World, community: SchoolCommunity) {
  const student = world.people[community.personId], age = ageOn(student, world.date);
  const parent = createContact(world, { age: Math.max(30, age + 22) + draw(world, 'npcs', 0, 8), country: community.country, city: community.city, qualifiedRole: 'administrator' });
  const peer = createContact(world, { age, country: community.country, city: community.city, schoolStudent: true }); peer.lastName = parent.lastName;
  peer.education.stage = community.stage; peer.education.school = community.school;
  moveHousehold(world, [peer.id], parent.householdId!);
  world.relationships.push({ id: 'relation_school_parent_' + peer.id, from: parent.id, to: peer.id, kind: 'parent', roles: ['parent'], romance: 'none', since: { ...peer.born }, parentType: 'biological', strength: 75, trust: 75, memories: ['family'], lastInteractionYear: world.date.year });
  connectPerson(world, peer.id, student.id); const relation = relationFor(world, student.id, peer.id)!; if (!relation.roles.includes('classmate')) relation.roles.push('classmate');
  community.classmateIds.push(peer.id);
}
function ensureSchool(world: World) {
  refreshSchools(world); const person = active(world), stage = person.education.stage;
  if (person.died || stage !== 'primary' && stage !== 'secondary') return;
  let community = currentSchool(world);
  if (!community) {
    const age = ageOn(person, world.date), peers = world.relationships.filter(item => (item.from === person.id || item.to === person.id) && item.roles.includes('classmate')).map(item => world.people[item.from === person.id ? item.to : item.from]).filter(peer => !peer.died && peer.country === person.country && peer.city === person.city && Math.abs(ageOn(peer, world.date) - age) <= 1 && peer.education.stage === stage && peer.education.school === person.education.school).slice(0, 3);
    community = { id: 'school_' + person.id + '_' + world.revision + '_' + world.schoolCommunities.length, personId: person.id, stage, school: person.education.school, country: person.country, city: person.city, started: { ...world.date }, ended: null, endReason: null, classmateIds: peers.map(peer => peer.id), teacherIds: [], currentTeacherId: '', club: 'none', conduct: 'quiet', periods: [], exams: [], help: [] };
    world.schoolCommunities.push(community); addTeacher(world, community);
    const size = stage === 'primary' ? 3 : 4; while (community.classmateIds.length < size) addClassmate(world, community);
    fact(world, 'I got to know ' + community.classmateIds.map(id => world.people[id].firstName).join(', ') + ' in my class at ' + community.school + '.', 'school-contact');
  } else if (world.people[community.currentTeacherId].died || world.people[community.currentTeacherId].employment?.roleId !== 'teacher' || world.people[community.currentTeacherId].country !== community.country || world.people[community.currentTeacherId].city !== community.city) addTeacher(world, community);
  return community;
}
export function schoolActionReason(world: World, community: SchoolCommunity | undefined): string | undefined {
  const person = active(world);
  if (!community || community.personId !== person.id || community.ended || currentSchool(world)?.id !== community.id || person.education.stage !== community.stage || person.education.school !== community.school || person.country !== community.country || person.city !== community.city) return 'Attend your current school before choosing a school activity';
  if (person.died || isConfined(world) || person.legal.wanted || activeTrip(world) || hospitalized(world, person) || serviceAway(world)) return 'Return to your normal school routine first';
}
export function schoolHelpReason(world: World, community: SchoolCommunity | undefined, teacherId: string): string | undefined {
  const reason = schoolActionReason(world, community); if (reason) return reason;
  if (community!.currentTeacherId !== teacherId || !teacherAvailable(world, teacherId, community!)) return 'Your current class teacher is unavailable';
  if (community!.help.some(item => item.term === Math.floor(community!.periods.length / 12))) return 'You already asked for academic help this school year';
  if (active(world).stats.energy < 4) return 'Rest before the extra study session';
}
export function resolveSchool(world: World, command: SchoolCommand) {
  const community = world.schoolCommunities.find(item => item.id === command.communityId), person = active(world), reason = schoolActionReason(world, community); if (reason) throw new IneligibleAction(reason);
  if (command.type === 'school-club') { community!.club = command.club; result(world, 'After-school plans updated', command.club === 'none' ? 'Your club routine has stopped. Skills already learned stay yours.' : 'You joined the ' + clubLabels[command.club].toLowerCase() + '. Practice happens during actual attended school months. The school provides the activities without a fee; one club fits your timetable.', 'education'); return; }
  if (command.type === 'school-conduct') { community!.conduct = command.conduct; result(world, 'Classroom routine updated', command.conduct === 'helpful' ? 'You will help out in class. Your teacher will notice the work as school months pass.' : command.conduct === 'disruptive' ? 'You plan to test the limits. Your teacher’s trust and your term report can suffer.' : 'You will get on with your work quietly.', 'education'); return; }
  const helpReason = schoolHelpReason(world, community, command.teacherId); if (helpReason) throw new IneligibleAction(helpReason);
  const relation = relationFor(world, person.id, command.teacherId)!, chance = Math.min(95, 55 + Math.floor(relation.trust / 2)), roll = draw(world, 'outcomes', 1, 100), accepted = roll <= chance, gradeBefore = person.education.grades, gradeGain = accepted ? Math.min(3, 100 - gradeBefore) : 0;
  community!.help.push({ month: absolute(world), term: Math.floor(community!.periods.length / 12), teacherId: command.teacherId, chance, roll, accepted, gradeBefore, gradeGain });
  person.stats.energy = bounded(person.stats.energy - 4); person.education.grades += gradeGain;
  if (accepted) { relation.strength = bounded(relation.strength + 3); relation.trust = bounded(relation.trust + 2); }
  fact(world, 'I asked ' + world.people[command.teacherId].firstName + ' for extra help. ' + (accepted ? 'We worked through the parts I found difficult.' : 'They could not fit in the extra session this school year.'), 'school-help');
  result(world, accepted ? 'Some things click into place' : 'No extra session this time', accepted ? 'You worked through the material together. Your actual grades improved by ' + gradeGain + ' percentage points.' : 'You can keep studying and ask again next school year. Your current progress is preserved.', 'education');
}
/** One actual in-person school period; browsing never generates a class or progress. */
export function schoolMonth(world: World) {
  const person = active(world); refreshSchools(world);
  if (person.died || !['primary', 'secondary'].includes(person.education.stage) || isConfined(world) || person.legal.wanted || activeTrip(world) || hospitalized(world, person) || serviceAway(world)) return;
  const community = ensureSchool(world)!; const month = absolute(world); if (community.periods.at(-1)?.month === month) return;
  const teacher = relationFor(world, person.id, community.currentTeacherId)!;
  if (teacherAvailable(world, community.currentTeacherId, community)) { teacher.strength = bounded(teacher.strength + (community.conduct === 'helpful' ? 1 : community.conduct === 'disruptive' ? -1 : 0)); teacher.trust = bounded(teacher.trust + (community.conduct === 'disruptive' ? -1 : 0)); }
  let skillGain = 0;
  if (community.club !== 'none') { const skill = clubSkill[community.club], before = person.skills[skill]; person.skills[skill] = bounded(before + 1); skillGain = person.skills[skill] - before; person.stats.energy = bounded(person.stats.energy - 2); }
  community.periods.push({ month, teacherId: community.currentTeacherId, club: community.club, conduct: community.conduct, grades: person.education.grades, skillGain });
  if (community.periods.length % 12 === 0) {
    const delta = Math.trunc(community.periods.slice(-12).reduce((sum, period) => sum + (period.conduct === 'helpful' ? 2 : period.conduct === 'disruptive' ? -5 : 0), 0) / 12); person.education.grades = bounded(person.education.grades + delta); community.periods.at(-1)!.grades = person.education.grades;
    community.exams.push({ month, term: community.periods.length / 12, grade: person.education.grades });
    fact(world, 'My ' + community.stage + ' school-year report recorded grades of ' + person.education.grades + '%. I completed twelve attended months at ' + community.school + '.', 'school-report');
  }
}
