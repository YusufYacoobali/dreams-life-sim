import type { Challenge, GameEvaluation, MiniGameInput } from '../core/types';

export function dialAngle(milliseconds: number, difficulty: number) {
  'worklet';
  return (milliseconds * (0.11 + difficulty * 0.018)) % 360;
}
export function targetAngle(seed: number, stage: number) {
  'worklet';
  return ((seed % 180) + 65 + stage * 113) % 360;
}
export function angleDistance(a: number, b: number) {
  'worklet';
  return Math.abs(((a - b + 540) % 360) - 180);
}
export function lockState(
  challenge: Challenge,
  inputs: readonly MiniGameInput[],
) {
  let stage = 0,
    suspicion = 0,
    precision = 0;
  for (const input of inputs) {
    if (input.action.type !== 'lock' || stage === 3 || suspicion >= 100)
      throw Error('That lock input is not available');
    const angle = challenge.assisted
      ? (input.action.angle ?? 0)
      : dialAngle(input.at, challenge.difficulty);
    const distance = angleDistance(angle, targetAngle(challenge.seed, stage)),
      tolerance = 29 - challenge.difficulty * 3 - stage * 2;
    if (distance <= tolerance) {
      precision += 1 - distance / (tolerance * 2);
      stage++;
    } else suspicion = Math.min(100, suspicion + 34);
  }
  return { stage, suspicion, precision };
}
export function evaluateLock(
  challenge: Challenge,
  inputs: readonly MiniGameInput[],
): GameEvaluation {
  const state = lockState(challenge, inputs);
  return state.stage === 3
    ? {
        finished: true,
        score: Math.max(
          30,
          Math.min(
            100,
            Math.round((state.precision / 3) * 100 - state.suspicion * 0.3),
          ),
        ),
        detail: 'All three bolts released',
      }
    : state.suspicion >= 100
      ? { finished: true, score: 0, detail: 'The alarm has activated' }
      : {
          finished: false,
          score: state.stage * 15,
          detail: `Bolt ${state.stage + 1} of 3`,
        };
}
