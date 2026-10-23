import type { MiniGameKind, MiniGameRating } from './types';

export function ratingFor(score: number): MiniGameRating {
  if (!Number.isInteger(score) || score < 0 || score > 100)
    throw Error('Invalid mini-game score');
  return score >= 85
    ? 'perfect'
    : score >= 60
      ? 'good'
      : score >= 30
        ? 'poor'
        : 'failed';
}
export function performanceModifier(score: number) {
  return ({ perfect: 8, good: 4, poor: -3, failed: -8 } as const)[
    ratingFor(score)
  ];
}
export function burglaryModifiers(score: number) {
  return (
    {
      perfect: { lootBps: 11500, riskBps: -700 },
      good: { lootBps: 10500, riskBps: -300 },
      poor: { lootBps: 6000, riskBps: 800 },
      failed: { lootBps: 0, riskBps: 1800 },
    } as const
  )[ratingFor(score)];
}
export function consequenceText(kind: MiniGameKind, score: number) {
  if (kind === 'crime')
    return score >= 60
      ? 'Better loot, less risk. You can still be arrested.'
      : 'Less loot, more risk. This burglary still counts.';
  const modifier = performanceModifier(score);
  return `${modifier >= 0 ? '+' : ''}${modifier} performance on your next ${kind === 'sports' ? 'match' : 'mission'} period.`;
}
