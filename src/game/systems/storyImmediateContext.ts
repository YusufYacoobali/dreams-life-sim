import type { World } from '../model';
import type { Pending } from '../runtime';
import type { StoryOption } from '../content/eventTypes';
import { storyImmediateExtrasSchema, type StoryImmediateEffect, type StoryTrustRole } from './storyImmediateSchemas';
import { countries } from '../countries';
import { convertMoney, formatMoney } from '../money';
import { fxRate } from '../valuation';
import { jobs } from '../content/jobs';
import { storyPersonPresent } from './storyContext';

type Target = { otherId: string; relationshipId: string; contextId?: string; label: string };
export type StoryImmediateTargets = Partial<Record<StoryTrustRole, Target>>;
const pair = (world: World, personId: string, otherId: string, relationshipId: string) => world.relationships.find(row => row.id === relationshipId && [row.from, row.to].includes(personId) && [row.from, row.to].includes(otherId) && personId !== otherId);
const ordinaryWork = (world: World) => {
  const job = world.people[world.activePersonId].employment;
  return job && jobs.some(role => role.id === job.roleId && !role.specialCareer) ? job : undefined;
};
export function storyImmediateWorkAvailable(world: World, choices: readonly StoryOption[]) {
  return !choices.some(choice => choice.workPerformance !== undefined || choice.loseJob) || !!ordinaryWork(world);
}

/** Bind only prospective extras. No live template lookup is needed to resolve a save. */
export function bindStoryImmediate(world: World, choice: StoryOption, targets: StoryImmediateTargets): StoryImmediateEffect | undefined {
  const extras = storyImmediateExtrasSchema.parse({ cash: choice.cash, workPerformance: choice.workPerformance, trust: choice.trust, endFriendship: choice.endFriendship, loseJob: choice.loseJob, publicImage: choice.publicImage });
  if (Object.values(extras).every(value => value === undefined || typeof value === 'object' && !Object.keys(value).length)) return;
  if (choice.followUp) throw new Error('Immediate story consequences must finish in this decision');
  const effect: StoryImmediateEffect = { kind: 'story-immediate', ruleVersion: 1, personId: world.activePersonId };
  if (extras.cash !== undefined) {
    const currency = countries[world.people[world.activePersonId].country].currency;
    const account = world.accounts.find(row => row.ownerId === world.activePersonId && row.currency === currency);
    if (!account) throw new Error('This story needs an actual local bank account');
    const rate = fxRate(world, 'USD', currency);
    effect.cash = { accountId: account.id, currency, usdWhole: extras.cash, ...rate, minor: convertMoney({ minor: BigInt(extras.cash) * 100n, currency: 'USD' }, currency, rate.numerator, rate.denominator).minor };
  }
  if (extras.workPerformance !== undefined || extras.loseJob) {
    const job = ordinaryWork(world); if (!job) throw new Error('This story needs an actual ordinary employment contract');
    effect.work = { employmentId: job.id, ...(extras.workPerformance !== undefined ? { performance: extras.workPerformance } : {}), ...(extras.loseJob ? { loseJob: true } : {}) };
  }
  if (extras.trust) {
    const rows = Object.entries(extras.trust).map(([role, value]) => {
      const target = targets[role as StoryTrustRole]; if (!target) throw new Error('This story needs its declared actual ' + role);
      return { ...target, role: role as StoryTrustRole, delta: value! };
    });
    if (rows.length) effect.trust = rows;
  }
  if (extras.endFriendship) {
    const friend = targets.friend;
    if (!friend || !pair(world, world.activePersonId, friend.otherId, friend.relationshipId)?.roles.includes('friend')) throw new Error('This story needs an actual friendship to end');
    effect.endFriendship = { friendId: friend.otherId, relationshipId: friend.relationshipId, label: friend.label };
  }
  if (extras.publicImage !== undefined) effect.publicImage = extras.publicImage;
  return effect;
}

export function storyMoneyText(effect?: StoryImmediateEffect): string | undefined {
  return effect?.cash ? formatMoney({ minor: effect.cash.minor < 0n ? -effect.cash.minor : effect.cash.minor, currency: effect.cash.currency }) : undefined;
}

function targetCurrent(world: World, effect: StoryImmediateEffect, target: NonNullable<StoryImmediateEffect['trust']>[number]) {
  const other = world.people[target.otherId], relation = pair(world, effect.personId, target.otherId, target.relationshipId);
  if (!other || other.died || !relation) return false;
  if (target.role === 'parent') return relation.to === effect.personId && relation.roles.some(role => role === 'parent' || role === 'guardian');
  if (target.role === 'child') return relation.from === effect.personId && relation.roles.some(role => role === 'parent' || role === 'guardian');
  const actor = world.people[effect.personId], local = other.country === actor.country && other.city === actor.city && storyPersonPresent(world, actor) && storyPersonPresent(world, other);
  if (target.role === 'friend') return local && relation.roles.includes('friend') && !['dating', 'engaged', 'married'].includes(relation.romance);
  if (target.role === 'partner') return local && ['dating', 'engaged', 'married'].includes(relation.romance);
  if (target.role === 'peer' || target.role === 'teacher') {
    const school = world.schoolCommunities.find(row => row.id === target.contextId && row.personId === effect.personId && !row.ended);
    return local && !!school && school.country === actor.country && school.city === actor.city && school.school === actor.education.school && school.stage === actor.education.stage && (target.role === 'peer' ? school.classmateIds.includes(target.otherId) && relation.roles.includes('classmate') && other.education.school === school.school && other.education.stage === school.stage : school.currentTeacherId === target.otherId && relation.roles.includes('teacher') && other.employment?.roleId === 'teacher');
  }
  const job = world.people[effect.personId].employment;
  const workplace = world.workplaces.find(row => row.id === target.contextId && row.personId === effect.personId && !row.ended && row.employmentId === job?.id);
  return local && !!workplace && workplace.country === actor.country && workplace.city === actor.city && workplace.employer === job?.employer && workplace.employer === other.employment?.employer && relation.roles.includes('coworker') && workplace.members.some(row => row.personId === target.otherId && row.role === target.role && !row.left && row.employmentId === other.employment?.id);
}

/** Staleness disables only the bound choice; it never substitutes a new actor/contract. */
export function storyImmediateReason(world: World, effect: StoryImmediateEffect): string | undefined {
  const person = world.people[effect.personId];
  if (effect.personId !== world.activePersonId || !person || person.died) return 'This story belongs to a different person';
  if (effect.cash) {
    const account = world.accounts.find(row => row.id === effect.cash!.accountId && row.ownerId === person.id && row.currency === effect.cash!.currency);
    if (!account || countries[person.country].currency !== account.currency) return 'The quoted bank account is no longer current';
    if (effect.cash.minor < 0n && account.cash - account.lockedCash < -effect.cash.minor) return 'Insufficient available funds';
  }
  if (effect.work && ordinaryWork(world)?.id !== effect.work.employmentId) return 'This employment contract has changed';
  if (effect.trust?.some(target => !targetCurrent(world, effect, target))) return 'A relationship or role in this story has changed';
  if (effect.endFriendship) {
    const end = effect.endFriendship;
    if (!targetCurrent(world, effect, { role: 'friend', otherId: end.friendId, relationshipId: end.relationshipId, label: end.label, delta: 0 })) return 'This friendship has changed';
  }
}

/** Structural references may outlive their current role: stale choices must still load. */
export function validateStoryImmediate(world: World, pending: Extract<Pending, { kind: 'decision' }>) {
  for (const choice of pending.choices) {
    const effects = choice.effects.filter((effect): effect is StoryImmediateEffect => effect.kind === 'story-immediate');
    if (effects.length > 1) throw new Error('Duplicate immediate story consequence');
    for (const effect of effects) {
      if (effect.personId !== world.activePersonId || !pending.personIds.includes(effect.personId) || !effect.cash && !effect.work && !effect.trust?.length && !effect.endFriendship && effect.publicImage === undefined) throw new Error('Invalid immediate story person or empty consequence');
      if (effect.cash) {
        const cash = effect.cash, account = world.accounts.find(row => row.id === cash.accountId);
        if (!account || account.ownerId !== effect.personId || account.currency !== cash.currency || convertMoney({ minor: BigInt(cash.usdWhole) * 100n, currency: 'USD' }, cash.currency, cash.numerator, cash.denominator).minor !== cash.minor) throw new Error('Invalid frozen story cash quote');
      }
      if (effect.work) {
        const history = world.workHistory.find(row => row.id === effect.work!.employmentId && row.personId === effect.personId);
        if (!history || !jobs.some(role => role.id === history.roleId && !role.specialCareer) || effect.work.performance === undefined && !effect.work.loseJob) throw new Error('Invalid bound story employment');
      }
      const seen = new Set<string>();
      for (const target of effect.trust ?? []) {
        if (seen.has(target.relationshipId) || !pending.personIds.includes(target.otherId) || !pair(world, effect.personId, target.otherId, target.relationshipId) || ['peer', 'teacher', 'coworker', 'supervisor'].includes(target.role) !== !!target.contextId) throw new Error('Invalid bound story trust target');
        seen.add(target.relationshipId);
        if (target.contextId && (target.role === 'peer' || target.role === 'teacher') && !world.schoolCommunities.some(row => row.id === target.contextId && row.personId === effect.personId && (target.role === 'peer' ? row.classmateIds.includes(target.otherId) : row.teacherIds.includes(target.otherId)))) throw new Error('Invalid story school context');
        if (target.contextId && (target.role === 'coworker' || target.role === 'supervisor') && !world.workplaces.some(row => row.id === target.contextId && row.personId === effect.personId && row.members.some(member => member.personId === target.otherId && member.role === target.role))) throw new Error('Invalid story workplace context');
      }
      if (effect.endFriendship && (!pending.personIds.includes(effect.endFriendship.friendId) || !pair(world, effect.personId, effect.endFriendship.friendId, effect.endFriendship.relationshipId))) throw new Error('Invalid bound story friendship');
    }
  }
}
