import type { Challenge, GameEvaluation, MiniGameInput } from '../core/types';
import { challengeSeed } from '../core/difficulty';

export const escapeSymbols = ['sun', 'moon', 'star', 'bird'] as const;
export type EscapeSymbol = typeof escapeSymbols[number];
export const escapeSteps = (difficulty: number) => 3 + Math.floor(Math.max(1, Math.min(5, difficulty)) / 2);
export const escapeMistakes = (difficulty: number) => difficulty >= 4 ? 1 : 2;

/** An abstract stamp puzzle, not a model of an institution or escape method.
 * Its complete board is recoverable from the saved seed and input transcript. */
export function escapeSequence(challenge: Pick<Challenge, 'seed' | 'difficulty'>): EscapeSymbol[] {
  return Array.from({ length: escapeSteps(challenge.difficulty) }, (_, stage) =>
    escapeSymbols[challengeSeed(`${challenge.seed}:stamp:${stage}`) % escapeSymbols.length]);
}
export function escapeGates(seed: number, stage: number): EscapeSymbol[] {
  return [...escapeSymbols].sort((a, b) =>
    challengeSeed(`${seed}:gate:${stage}:${a}`) - challengeSeed(`${seed}:gate:${stage}:${b}`));
}
export function escapeState(challenge: Pick<Challenge, 'seed' | 'difficulty'>, inputs: MiniGameInput[]) {
  const sequence = escapeSequence(challenge);
  let stage = 0, mistakes = 0;
  for (const input of inputs) {
    if (input.action.type !== 'stamp') throw Error('Invalid escape control');
    if (stage >= sequence.length || mistakes >= escapeMistakes(challenge.difficulty))
      throw Error('Escape puzzle already finished');
    if (input.action.symbol === sequence[stage]) stage++;
    else mistakes++;
  }
  return { sequence, stage, mistakes, complete: stage === sequence.length, failed: mistakes >= escapeMistakes(challenge.difficulty) };
}
export function evaluateEscape(challenge: Challenge, inputs: MiniGameInput[]): GameEvaluation {
  const state = escapeState(challenge, inputs);
  return {
    finished: state.complete || state.failed,
    score: state.complete ? 100 - state.mistakes * 20 : 0,
    detail: state.complete ? 'You found the exit through the shuffle.' : state.failed ? 'The stamps no longer line up.' : `Stamp ${state.stage + 1} of ${state.sequence.length}`,
  };
}
