import { ageOn, fullName, type Person, type World } from '../model';
import { jobs } from '../content/jobs';
import { hobbyContent } from '../content/leisure';
import type { ConversationContext, ConversationTopic } from '../content/conversationWriting';
import { hospitalized } from './healthSchemas';
import { isConfined } from './legalSchemas';
import { samePhysicalPlace } from './travelSchemas';

export type { ConversationTopic } from '../content/conversationWriting';
export const conversationTopicIds = ['everyday', 'interests', 'family', 'school', 'work', 'feelings'] as const;
export type ConversationOption = { id: ConversationTopic; label: string; body: string; disabledReason?: string };

function schoolContext(world: World, person: Person, who: 'you' | 'them'): ConversationContext['school'] {
  const education = person.education;
  if (education.school && ['primary', 'secondary', 'trade', 'university', 'graduate'].includes(education.stage)) {
    return { person: who, name: education.school, field: education.field, status: education.paused ? 'paused' : 'current' };
  }
  // Old saves can retain the actual completed course without a newer course row.
  if (education.school && education.requiredMonths > 0 && education.months >= education.requiredMonths && education.qualifications.some(item => item.field === education.field)) {
    return { person: who, name: education.school, field: education.field, status: 'completed' };
  }
  for (let index = world.studyCourses.length - 1; index >= 0; index--) {
    const completed = world.studyCourses[index];
    if (completed.personId === person.id && completed.status === 'completed') return { person: who, name: completed.school, field: completed.field, status: 'completed' };
  }
}

function workContext(world: World, person: Person, who: 'you' | 'them'): ConversationContext['work'] {
  if (person.employment) {
    const role = jobs.find(row => row.id === person.employment!.roleId);
    if (role) return { person: who, title: role.title, employer: person.employment.employer, status: 'current' };
  }
  for (let index = world.workHistory.length - 1; index >= 0; index--) {
    const previous = world.workHistory[index];
    if (previous.personId !== person.id || previous.ended === null || previous.monthsWorked === 0) continue;
    const role = jobs.find(row => row.id === previous.roleId);
    if (role) return { person: who, title: role.title, employer: previous.employer, status: 'past' };
  }
}

/** Read-only facts for new writing; no invented interests or reconstructed history. */
export function conversationContext(world: World, personId: string): ConversationContext | undefined {
  const actor = world.people[world.activePersonId], target = world.people[personId];
  const relation = world.relationships.find(row => row.from === actor.id && row.to === personId || row.to === actor.id && row.from === personId);
  if (!target || !relation || target.id === actor.id) return;
  const practiced = world.hobbies.filter(row => (row.personId === actor.id || row.personId === target.id) && row.practices.some(practice => practice.attended));
  const shared = practiced.find(row => row.personId === actor.id && practiced.some(other => other.personId === target.id && other.kind === row.kind));
  const hobby = shared ?? practiced.find(row => row.personId === target.id) ?? practiced[0];
  const familyRole = relation.roles.includes('parent') ? relation.from === target.id ? 'parent' : 'child'
    : relation.roles.includes('guardian') ? relation.from === target.id ? 'guardian' : 'person in your care'
    : relation.roles.includes('sibling') ? 'sibling' : relation.romance === 'married' ? 'spouse' : undefined;
  return {
    targetName: fullName(target), targetFirstName: target.firstName,
    actorAge: ageOn(actor, world.date), targetAge: ageOn(target, world.date),
    actorStress: actor.stats.stress, targetStress: target.stats.stress, trust: relation.trust,
    setting: hospitalized(world, actor) || hospitalized(world, target) ? 'hospital'
      : isConfined(world, actor) || isConfined(world, target) ? 'custody'
      : !samePhysicalPlace(world, actor.id, target.id) ? 'apart' : 'ordinary',
    ...(familyRole ? { familyRole } : {}),
    ...(hobby ? { interest: { person: shared ? 'both' : hobby.personId === actor.id ? 'you' : 'them', label: hobbyContent[hobby.kind].name } as NonNullable<ConversationContext['interest']> } : {}),
    school: schoolContext(world, actor, 'you') ?? schoolContext(world, target, 'them'),
    work: workContext(world, actor, 'you') ?? workContext(world, target, 'them'),
  };
}

/** The same availability and yearly limit are used by the review and resolver. */
export function conversationTopics(world: World, personId: string): ConversationOption[] {
  const actor = world.people[world.activePersonId], target = world.people[personId], context = conversationContext(world, personId);
  const common = actor.died ? 'This life has ended' : !world.birthAcknowledged ? 'Begin this life first'
    : !context || !target || target.died ? 'Choose a living person you know'
    : world.pending || world.annual && !world.annual.pausedForPlanning ? 'Finish the current event first'
    : context.actorAge < 3 || context.targetAge < 3 ? 'Conversations unlock when both people are at least three'
    : world.actionCounts[actor.id + ':social:' + world.date.year + ':' + personId + ':talk'] ? 'You already tried this with this person this year' : undefined;
  const subject = (who: 'you' | 'them' | 'both') => who === 'you' ? 'your' : who === 'both' ? 'your shared' : target!.firstName + '’s';
  const rows: ConversationOption[] = [
    { id: 'everyday', label: 'Everyday life', body: 'Give ' + (target?.firstName ?? 'this person') + ' your attention and talk about an ordinary part of the day.' },
    { id: 'interests', label: 'Interests', body: context?.interest ? 'Talk about ' + subject(context.interest.person) + ' interest in ' + context.interest.label + '.' : 'Talk about a hobby one of you has actually practised.', disabledReason: context?.interest ? undefined : 'Neither of you has a recorded hobby practice yet' },
    { id: 'family', label: 'Family', body: context?.familyRole ? 'Talk with your ' + context.familyRole + ' about your family connection.' : 'Talk with an actual relative, guardian or spouse about family.', disabledReason: context?.familyRole ? undefined : 'Choose a relative, guardian or spouse for this topic' },
    { id: 'school', label: 'School and study', body: context?.school ? 'Talk about ' + subject(context.school.person) + ' ' + (context.school.status === 'completed' ? 'completed study at ' : context.school.status === 'paused' ? 'paused study at ' : 'study at ') + context.school.name + '.' : 'Talk about a recorded school or course.', disabledReason: context?.school ? undefined : 'Neither of you has a named current or completed course to discuss' },
    { id: 'work', label: 'Work', body: context?.work ? 'Talk about ' + subject(context.work.person) + ' ' + (context.work.status === 'past' ? 'past role' : 'role') + ' as ' + context.work.title + ' at ' + context.work.employer + '.' : 'Talk about an actual current job or recorded paid work.', disabledReason: context?.work ? undefined : 'Neither of you has a current job or recorded paid work to discuss' },
    { id: 'feelings', label: 'How you’re feeling', body: 'Ask for space to talk honestly. ' + (target?.firstName ?? 'The other person') + ' can keep the conversation private.', disabledReason: context && Math.min(context.actorAge, context.targetAge) < 8 ? 'Personal feelings conversations unlock when both people are at least eight' : context && context.trust < 40 ? 'Build at least 40% trust before a personal conversation' : undefined },
  ];
  return rows.map(row => ({ ...row, disabledReason: common ?? row.disabledReason }));
}
