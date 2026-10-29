import type { Person, World } from '../model';
import type { StorySchedule, StoryThread } from './storySchemas';
import { currentSchool } from './schoolSchemas';
import { activeTrip } from './travelSchemas';
import { hospitalized } from './healthSchemas';
import { isConfined } from './legalSchemas';
import { serviceAway } from './serviceSchemas';

type Participants = Pick<StorySchedule, 'personId' | 'peerId' | 'teacherId' | 'parentId' | 'communityId'>;
export const storyMonthNumber = (date: World['date']) => date.year * 12 + date.month - 1;
export function storyPersonPresent(world: World, person: Person) {
  return !person.died && !activeTrip(world, person.id) && !hospitalized(world, person) && !isConfined(world, person) && !person.legal.wanted && !serviceAway(world, person.id);
}
/** The named parent must actually be at home; another parent is never substituted later. */
export function storyParent(world: World) {
  const player = world.people[world.activePersonId];
  if (!player.householdId) return;
  return world.relationships.find(edge => {
    const parent = world.people[edge.from];
    return edge.kind === 'parent' && edge.to === player.id && parent && parent.householdId === player.householdId && parent.country === player.country && parent.city === player.city && storyPersonPresent(world, parent);
  });
}
export function storyContextReason(world: World, binding: Participants, permanentOnly = false, location?: Pick<StoryThread, 'country' | 'city'>): string | undefined {
  const person = world.people[binding.personId], peer = world.people[binding.peerId], school = currentSchool(world, binding.personId);
  if (!person || person.died || person.id !== world.activePersonId) return 'This part of the family story has ended';
  if (location && (person.country !== location.country || person.city !== location.city)) return 'You moved away';
  if (!school || school.id !== binding.communityId || school.school !== person.education.school || school.stage !== person.education.stage || school.country !== person.country || school.city !== person.city) return 'Your school has changed';
  if (!peer || peer.died) return 'Your classmate is no longer alive';
  if (!school.classmateIds.includes(peer.id) || peer.country !== person.country || peer.city !== person.city || peer.education.school !== school.school || peer.education.stage !== school.stage) return 'Your classmate is no longer at this school';
  const participants = [person, peer];
  if (binding.teacherId) {
    const teacher = world.people[binding.teacherId];
    if (!teacher || teacher.died || school.currentTeacherId !== teacher.id || teacher.employment?.roleId !== 'teacher' || teacher.country !== person.country || teacher.city !== person.city) return 'The teacher responsible for this project has left';
    participants.push(teacher);
  }
  if (binding.parentId) {
    const parent = world.people[binding.parentId];
    if (!parent || parent.died) return 'The parent who agreed is no longer alive';
    if (!person.householdId || parent.householdId !== person.householdId || parent.country !== person.country || parent.city !== person.city || !world.relationships.some(edge => edge.from === parent.id && edge.to === person.id && edge.kind === 'parent')) return 'The parent who agreed is no longer at home with you';
    participants.push(parent);
  }
  if (!permanentOnly && participants.some(participant => !storyPersonPresent(world, participant))) return 'Someone needed for this plan is away, in hospital or unable to attend';
}
