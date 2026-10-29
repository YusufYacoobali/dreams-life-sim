import type { World } from '../game/model';
import { achievementDefinitions, challengeDefinitions } from './catalog';
import { progressFacts } from './facts';
import type { GoalDefinition, ProgressGoal, Achievement, Challenge } from './types';
export type * from './types';
export { progressFacts } from './facts';

export function lifeProgress(world: World, personId = world.activePersonId) {
  const facts = progressFacts(world, personId);
  if (!facts) return null;
  const goal = (definition: GoalDefinition): ProgressGoal => ({ ...definition, value: facts[definition.id], complete: facts[definition.id] >= definition.target, percent: Math.min(100, facts[definition.id] / definition.target * 100) });
  return {
    personId, facts,
    achievements: achievementDefinitions.map((item): Achievement => { const progress = goal(item.goal); return { ...item, goal: progress, complete: progress.complete }; }),
    challenges: challengeDefinitions.map((item): Challenge => { const goals = item.goals.map(goal); return { ...item, goals, complete: goals.every(item => item.complete), percent: goals.reduce((sum, item) => sum + item.percent, 0) / goals.length }; }),
  };
}

/** The collection contains currently owned, directly inherited possessions. */
export const inheritedPossessions = (world: World, personId = world.activePersonId) => world.assets.filter(item => item.ownerId === personId && item.kind === 'possession' && (item.ownershipSource === 'inheritance' || item.ownershipSource === 'legacy'));
