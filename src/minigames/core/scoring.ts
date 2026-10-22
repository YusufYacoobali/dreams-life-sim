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
      ? 'A modest burglary advantage. Evidence, investigations and arrest still apply.'
      : 'The burglary still counts. Detection risk rises; the ordinary legal system resolves what follows.';
  const modifier = performanceModifier(score);
  return `${modifier >= 0 ? '+' : ''}${modifier} performance on the next eligible ${kind === 'sports' ? 'match' : 'mission'} period. Attendance, pay, risks and awards follow the normal simulation.`;
}
