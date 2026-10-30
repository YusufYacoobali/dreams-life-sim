import type { World } from '../../game/model';
import { crimeReason } from '../../game/systems/legal';
import { activeSentence, isConfined } from '../../game/systems/legalSchemas';
import { prisonSecurity } from '../../game/systems/prisonSecurity';
import { newChallengeDifficulty } from './difficulty';
import type { MiniGameKind } from './types';

export const activeMiniGame = (world: World) =>
  world.miniGames.find(
    (session) =>
      session.personId === world.activePersonId && session.status === 'active',
  );
export function challengeContext(
  world: World,
  kind: MiniGameKind,
  ownerId: string,
  contextId: string,
) {
  const person = world.people[world.activePersonId];
  if (kind === 'escape') {
    const sentence = activeSentence(world);
    if (!sentence || sentence.id !== ownerId || contextId !== escapeContext(world)) return null;
    const base = { low: 2, medium: 3, high: 5 }[prisonSecurity(world, sentence)];
    const preparation = Math.floor((person.stats.smarts + person.stats.fitness + person.legal.crimeSkill) / 110);
    return { difficulty: Math.max(1, Math.min(5, base - preparation)) };
  }
  if (kind === 'sports') {
    const career = world.careers.find(
      (row) =>
        row.id === ownerId &&
        row.personId === person.id &&
        row.kind === 'athlete' &&
        row.status === 'active',
    );
    const project = career?.projects.find(
      (row) => row.id === contextId && row.status === 'active',
    );
    return project && career?.employmentId === project.employmentId
      ? {
          difficulty: newChallengeDifficulty,
        }
      : null;
  }
  if (kind === 'astronaut') {
    const career = world.serviceCareers.find(
      (row) =>
        row.id === ownerId &&
        row.personId === person.id &&
        row.kind === 'astronaut' &&
        row.status === 'active',
    );
    const assignment = career?.assignments.find(
      (row) =>
        row.id === contextId &&
        row.status === 'active' &&
        ['orbital-research', 'habitat-maintenance'].includes(row.kind),
    );
    return assignment && assignment.periods.length < 6
      ? {
          difficulty: newChallengeDifficulty,
        }
      : null;
  }
  return ownerId === person.id && contextId === burglaryContext(world)
    ? {
        difficulty: newChallengeDifficulty,
      }
    : null;
}
export const burglaryContext = (world: World) =>
  `${world.activePersonId}:burglary:${world.date.year}`;
export const escapeContext = (world: World) =>
  `${activeSentence(world)?.id ?? 'unavailable'}:escape:${world.date.year}`;
export const escapeAttemptKey = (personId: string, year: number) => `${personId}:legal:${year}:escape`;
export function miniGameReason(
  world: World,
  kind: MiniGameKind,
  ownerId: string,
  contextId: string,
): string | undefined {
  const person = world.people[world.activePersonId];
  if (person.died || !world.birthAcknowledged)
    return 'Open a living character first';
  if (activeMiniGame(world))
    return 'Resume or forfeit your saved challenge first';
  if (world.pending || (world.annual && !world.annual.pausedForPlanning))
    return 'Finish the current event first';
  if (
    world.miniGames.some(
      (row) =>
        row.personId === person.id &&
        row.kind === kind &&
        row.ownerId === ownerId &&
        row.contextId === contextId,
    )
  )
    return 'This challenge has already been used';
  if (
    (kind !== 'escape' && isConfined(world, person)) ||
    person.health.hospitalizedUntil !== null ||
    person.stats.health < 20 ||
    person.stats.energy < 10
  )
    return 'Recover or resolve custody before playing';
  if (!challengeContext(world, kind, ownerId, contextId))
    return 'This challenge is no longer available';
  if (kind === 'escape' && world.actionCounts[escapeAttemptKey(person.id, world.date.year)])
    return 'You already attempted escape this year';
  if (kind === 'crime') {
    if (
      world.serviceCareers.some(
        (row) =>
          row.personId === person.id &&
          row.assignments.some((item) => item.status === 'active'),
      )
    )
      return 'Return from your assignment first';
    if (
      world.trips.some(
        (row) =>
          row.participantIds.includes(person.id) && row.status === 'active',
      )
    )
      return 'Return from your trip first';
    return crimeReason(world, 'burglary');
  }
}
