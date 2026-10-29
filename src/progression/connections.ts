import type { Achievement, Challenge } from './types';

/** Continue an earned fact toward its nearest unfinished challenge target. */
export function achievementContinuation(achievement: Achievement, challenges: readonly Challenge[]): Challenge | null {
  if (!achievement.complete) return null;
  const candidates = challenges.flatMap((challenge, index) => {
    if (challenge.complete) return [];
    const target = challenge.goals.find(goal => goal.id === achievement.goal.id && goal.target >= achievement.goal.target)?.target;
    return target === undefined ? [] : [{ challenge, target, index }];
  });
  candidates.sort((a, b) => a.target - b.target || b.challenge.percent - a.challenge.percent || a.index - b.index);
  return candidates[0]?.challenge ?? null;
}

/** Recognition is limited to earned milestones within this challenge's actual targets. */
export function challengeMilestones(challenge: Challenge, achievements: readonly Achievement[]): Achievement[] {
  return achievements.filter(achievement => achievement.complete && challenge.goals.some(goal => goal.id === achievement.goal.id && achievement.goal.target <= goal.target));
}
