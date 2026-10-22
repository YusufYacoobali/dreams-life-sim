import type { Challenge, GameEvaluation, MiniGameInput } from '../core/types';

export function shotPower(milliseconds: number) {
  'worklet';
  return (Math.sin(milliseconds / 670 - Math.PI / 2) + 1) / 2;
}
export function keeperPosition(
  milliseconds: number,
  seed: number,
  difficulty: number,
) {
  'worklet';
  return (
    0.5 +
    Math.sin(milliseconds / (1200 - difficulty * 110) + (seed % 13)) * 0.31
  );
}
export function evaluateShot(
  challenge: Challenge,
  input?: MiniGameInput,
): GameEvaluation {
  if (!input)
    return {
      finished: false,
      score: 0,
      detail: 'Choose a corner and time your shot.',
    };
  if (input.action.type !== 'shot') throw Error('Choose shot placement');
  const { x, y } = input.action,
    power = challenge.assisted
      ? (input.action.power ?? 0.5)
      : shotPower(input.at);
  const timing = Math.max(0, 1 - Math.abs(power - 0.78) / 0.5);
  if (power < 0.12)
    return { finished: true, score: 0, detail: 'Not enough power' };
  if (power > 0.97)
    return { finished: true, score: 0, detail: 'Over the crossbar' };
  if (x < 0.08 || x > 0.92 || y < 0.08 || y > 0.9)
    return { finished: true, score: 0, detail: 'Wide of the goal' };
  const keeper = keeperPosition(
    challenge.assisted ? 0 : input.at,
    challenge.seed,
    challenge.difficulty,
  );
  const saved =
    Math.abs(x - keeper) < 0.09 + challenge.difficulty * 0.012 && y > 0.24;
  if (saved)
    return { finished: true, score: 25, detail: 'The keeper makes the save' };
  const corner = Math.min(1, Math.abs(x - 0.5) / 0.38);
  const score = Math.round(
    Math.max(30, Math.min(100, 25 + timing * 50 + corner * 25)),
  );
  return {
    finished: true,
    score,
    detail:
      score >= 85
        ? 'Top corner. Unstoppable.'
        : score >= 60
          ? 'Goal! Cleanly placed.'
          : 'A scrappy finish',
  };
}
