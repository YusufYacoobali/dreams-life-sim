import type { World } from '../model';
import { ageOn, compareDates, fullName } from '../personHelpers';
import { countries } from '../countries';
import { rules } from '../rules';
import { IneligibleAction } from '../errors';
import { accountFor, availableCash, bounded, charge, draw, fact, result } from './common';
import { createContact } from './npcs';
import { beginStudyCourse, syncStudyCourse } from './studyCourses';
import { storyPersonPresent } from './storyContext';
import { connectPerson } from './relationshipContacts';
import { relationFor } from './relationshipQueries';
import { campusClubs, type CampusClub, type CampusCommand, type CampusCommunity } from './campusSchemas';
import { storyContactNames } from '../storyNames';
export { campusCommandSchema } from './campusSchemas';
export type { CampusCommand } from './campusSchemas';

export const campusClubSkill = { sport: 'sport', music: 'music', drama: 'acting', science: 'science' } as const;

/** Record identity is separate from temporary availability so paused study retains its history. */
function enrolment(world: World, personId = world.activePersonId, requireCampusResidence = true) {
  const person = world.people[personId];
  if (!person || person.died || !['trade', 'university', 'graduate'].includes(person.education.stage)) return;
  const education = person.education;
  let course: World['studyCourses'][number] | undefined;
  for (const item of world.studyCourses) if (item.personId === personId && item.status === 'active') { if (course) return; course = item; }
  if (!course || course.origin !== 'enrolment' || !course.started || !course.firstPayment || course.ended ||
    course.program !== education.stage || course.field !== education.field || course.school !== education.school ||
    !course.country || !course.city || course.currency !== countries[course.country].currency ||
    requireCampusResidence && (course.country !== person.country || course.city !== person.city) ||
    course.months !== education.months || course.requiredMonths !== education.requiredMonths || course.grades !== education.grades ||
    course.funding !== education.funding || course.annualTuition !== education.tuition || course.tuitionPaidMonths !== education.tuitionPaidMonths ||
    course.months >= course.requiredMonths) return;
  return course;
}
export function campusReason(world: World): string | undefined {
  const person = world.people[world.activePersonId], course = enrolment(world);
  if (!course) return 'Enrol in a current course with a recorded start and tuition payment';
  if (ageOn(person, world.date) < Math.max(18, rules[person.country].adultAge)) return 'Campus activities are available to adult students';
  if (person.education.paused) return 'Fund and resume your course before campus activities';
  if (!storyPersonPresent(world, person)) return 'Return to your course before campus activities';
  if (course.months < 1) return 'Attend at least one course month before campus activities';
}
export function campusCourse(world: World, personId = world.activePersonId) {
  if (personId === world.activePersonId) return campusReason(world) ? undefined : enrolment(world);
  const person = world.people[personId], course = enrolment(world, personId);
  return person && course && course.months >= 1 && !person.education.paused && storyPersonPresent(world, person) && ageOn(person, world.date) >= Math.max(18, rules[person.country].adultAge) ? course : undefined;
}
export function currentCampus(world: World): CampusCommunity | undefined {
  const course = enrolment(world);
  return course ? world.campusCommunities.find(item => item.personId === world.activePersonId && item.courseId === course.id) : undefined;
}
export function campusIntroductionReason(world: World, courseId = enrolment(world)?.id): string | undefined {
  const reason = campusReason(world); if (reason) return reason;
  if (enrolment(world)!.id !== courseId) return 'This course is no longer current';
  if (world.campusCommunities.some(item => item.personId === world.activePersonId && item.courseId === courseId)) return 'You have already met course peers for this enrolment';
}
export function campusClubReason(world: World, communityId: string, club: CampusClub): string | undefined {
  const reason = campusReason(world); if (reason) return reason;
  const community = currentCampus(world);
  if (!community || community.id !== communityId) return 'This campus community is no longer current';
  if (!campusClubs.includes(club)) return 'Choose an available campus club';
  if (community.club === club) return 'This is your current campus club';
}

function student(world: World, course: NonNullable<ReturnType<typeof campusCourse>>) {
  const program = course.program!, country = course.country!, city = course.city!;
  const minimumAge = Math.max(18, rules[country].adultAge, rules[country].schoolEnd + (program === 'graduate' ? 4 : 0));
  const person = createContact(world, { age: draw(world, 'npcs', minimumAge, minimumAge + 6), country, city, postsecondaryStudent: { program, annualTuition: course.annualTuition } });
  person.education = { ...person.education, stage: program, field: course.field, school: course.school, months: 0, requiredMonths: course.requiredMonths, tuition: course.annualTuition, tuitionPaidMonths: 12, funding: 'cash', paused: false };
  charge(world, course.annualTuition, 'tuition', 'Tuition: ' + course.school, undefined, course.currency!, person);
  beginStudyCourse(world, person, { funding: 'cash', scholarshipId: null, billed: course.annualTuition, waived: 0n, transactionId: world.ledger.at(-1)!.id, loanTransactionId: null });
  const peerCourse = world.studyCourses.at(-1)!;
  connectPerson(world, person.id);
  const relation = relationFor(world, world.activePersonId, person.id)!;
  if (!relation.roles.includes('classmate')) relation.roles.push('classmate');
  relation.kind = 'classmate'; relation.memories.push('campus:' + course.id + ':' + peerCourse.id);
  return { personId: person.id, courseId: peerCourse.id };
}

export function resolveCampus(world: World, command: CampusCommand) {
  if (command.type === 'meet-campus') {
    const reason = campusIntroductionReason(world, command.courseId); if (reason) throw new IneligibleAction(reason);
    const course = campusCourse(world)!;
    const community: CampusCommunity = { id: 'campus_' + world.activePersonId + '_' + world.revision, personId: world.activePersonId, courseId: course.id, started: { ...world.date }, introducedStudyMonths: course.months, lastStudyMonths: course.months, club: 'none', students: [student(world, course), student(world, course)], periods: [] };
    world.campusCommunities.push(community);
    const { names } = storyContactNames(community.students.map((item, index) => ({ token: item.personId, role: 'course peer ' + (index + 1), person: world.people[item.personId], display: fullName(world.people[item.personId]) })));
    const peers = community.students.map(item => names[item.personId]).join(' and ');
    fact(world, 'I met ' + peers + ' through my ' + course.field + ' course at ' + course.school + '.', 'campus');
    result(world, 'Course introductions', 'You met ' + peers + '. Both are starting their own funded ' + course.field + ' courses at ' + course.school + '. You are acquaintances; a friendship takes time.', 'education');
    return;
  }
  const reason = campusClubReason(world, command.communityId, command.club); if (reason) throw new IneligibleAction(reason);
  currentCampus(world)!.club = command.club;
  fact(world, command.club === 'none' ? 'I left my campus club.' : 'I chose the ' + command.club + ' club alongside my course.', 'campus');
  result(world, 'Campus routine updated', command.club === 'none' ? 'Your learned skills stay yours. No further club energy is spent.' : 'During each newly attended course month, the club develops up to one relevant skill point and uses up to two energy. Paused or interrupted study earns no club progress.', 'education');
}

/** Only newly introduced peers receive this tuition policy. Existing NPCs are untouched. */
export function prepareCampusTuition(world: World) {
  if (!world.campusCommunities.length) return;
  const courses = new Map(world.studyCourses.map(item => [item.id, item])), seen = new Set<string>();
  for (const community of world.campusCommunities) for (const member of community.students) {
    if (seen.has(member.courseId)) continue; seen.add(member.courseId);
    const course = courses.get(member.courseId), person = world.people[member.personId];
    if (!course || !person || person.id === world.activePersonId || course.status !== 'active' || enrolment(world, person.id, false)?.id !== course.id || !storyPersonPresent(world, person)) continue;
    const education = person.education;
    if (education.months < education.tuitionPaidMonths || education.tuition <= 0n) continue;
    if (availableCash(accountFor(world, person, course.currency!)) < education.tuition) { education.paused = true; continue; }
    charge(world, education.tuition, 'tuition', 'Campus tuition: ' + course.id, undefined, course.currency!, person);
    education.tuitionPaidMonths += 12; education.paused = false;
    syncStudyCourse(world, person);
  }
}

/** Settle each new actual attended course month once, including its finishing month. */
export function campusMonth(world: World) {
  if (!world.campusCommunities.length) return;
  const courses = new Map(world.studyCourses.map(item => [item.id, item])), month = world.date.year * 12 + world.date.month - 1;
  for (const community of world.campusCommunities) {
    const course = courses.get(community.courseId), person = world.people[community.personId];
    if (!course || !person || course.months <= community.lastStudyMonths) continue;
    const previousStudyMonths = community.lastStudyMonths;
    community.lastStudyMonths = course.months;
    const finishing = (course.status === 'completed' || course.status === 'failed') && course.ended && compareDates(course.ended, world.date) === 0;
    if (person.id !== world.activePersonId || !storyPersonPresent(world, person) || course.country !== person.country || course.city !== person.city ||
      !finishing && (course.status !== 'active' || person.education.paused || enrolment(world, person.id)?.id !== course.id)) continue;
    // A resumed historical cursor cannot establish participation in skipped months.
    if (course.months !== previousStudyMonths + 1 || (community.periods.at(-1)?.month ?? -Infinity) >= month) continue;
    const skill = community.club === 'none' ? undefined : campusClubSkill[community.club], before = skill ? person.skills[skill] : null, energyBefore = person.stats.energy;
    if (skill) { person.skills[skill] = bounded(person.skills[skill] + 1); person.stats.energy = bounded(person.stats.energy - 2); }
    const after = skill ? person.skills[skill] : null;
    community.periods.push({ month, studyMonth: course.months, club: community.club, skillBefore: before, skillAfter: after, skillGain: before === null || after === null ? 0 : after - before, energyBefore, energyAfter: person.stats.energy });
  }
}
