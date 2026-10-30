import type { Challenge, GameEvaluation, MiniGameInput } from '../core/types';
import { challengeSeed } from '../core/difficulty';
import { nextRandom } from '../../game/random';

export const escapeSymbols = ['sun', 'moon', 'star', 'bird'] as const;
export type EscapeSymbol = typeof escapeSymbols[number];
type EscapeChallenge = Pick<Challenge, 'seed' | 'difficulty' | 'escapeVersion' | 'escapePatternVersion'> & Partial<Pick<Challenge, 'assisted'>>;
const level = (difficulty: number) => Math.max(1, Math.min(5, difficulty));
/** Published v1 mechanics remain unchanged for already reserved attempts. */
export const escapeSteps = (difficulty: number) => 3 + Math.floor(level(difficulty) / 2);
export const escapeMistakes = (difficulty: number, version?: 2) => version === 2 ? [3, 3, 2, 2, 1][level(difficulty) - 1] : difficulty >= 4 ? 1 : 2;
export const escapeRounds = (difficulty: number) => difficulty <= 2 ? 2 : 3;
export const escapePatternLength = (difficulty: number, round: number) => [3, 4, 4, 5, 6][level(difficulty) - 1] + round;

/** Abstract memory symbols, not an institution or an escape method. */
export function escapeSequence(challenge: EscapeChallenge, round = 0): EscapeSymbol[] {
  if (challenge.escapeVersion === 2 && challenge.escapePatternVersion === 1) {
    // FNV's low two bits cycle with a final stage digit. Draw from a mixed local
    // stream instead; it never consumes or changes any life-simulation RNG.
    let state = challengeSeed(`${challenge.seed}:memory:2:${round}`);
    return Array.from({ length: escapePatternLength(challenge.difficulty, round) }, () => {
      const draw = nextRandom(state);
      state = draw.state;
      return escapeSymbols[Math.floor(draw.value * escapeSymbols.length)];
    });
  }
  // Published v1 and already-started task-stage v2 attempts keep exact patterns.
  return Array.from({ length: challenge.escapeVersion === 2 ? escapePatternLength(challenge.difficulty, round) : escapeSteps(challenge.difficulty) }, (_, stage) =>
    escapeSymbols[challengeSeed(challenge.escapeVersion === 2 ? `${challenge.seed}:memory:2:${round}:${stage}` : `${challenge.seed}:stamp:${stage}`) % escapeSymbols.length]);
}
export function escapeGates(seed: number, stage: number): EscapeSymbol[] {
  return [...escapeSymbols].sort((a, b) =>
    challengeSeed(`${seed}:gate:${stage}:${a}`) - challengeSeed(`${seed}:gate:${stage}:${b}`));
}
export function escapeState(challenge: EscapeChallenge, inputs: MiniGameInput[]) {
  let sequence = escapeSequence(challenge), stage = 0, mistakes = 0, round = 0, hints = 0;
  let phase: 'preview' | 'recall' | 'hint' | 'complete' | 'failed' = challenge.escapeVersion === 2 ? 'preview' : 'recall';
  let feedback: 'correct' | 'incorrect' | null = null;
  for (const input of inputs) {
    if (phase === 'complete' || phase === 'failed') throw Error('Escape puzzle already finished');
    if (challenge.escapeVersion === 2 && input.action.type === 'escape-recall') {
      if (phase !== 'preview' && phase !== 'hint') throw Error('The pattern is already hidden');
      phase = 'recall'; feedback = null; continue;
    }
    if (challenge.escapeVersion === 2 && input.action.type === 'escape-hint') {
      if (!challenge.assisted || phase !== 'recall' || hints >= 2) throw Error('No memory hint available');
      phase = 'hint'; hints++; feedback = null; continue;
    }
    if (input.action.type !== 'stamp') throw Error('Invalid escape control');
    if (phase !== 'recall') throw Error('Hide the pattern before choosing a symbol');
    if (input.action.symbol === sequence[stage]) {
      stage++; feedback = 'correct';
      if (stage === sequence.length) {
        if (challenge.escapeVersion !== 2 || round + 1 === escapeRounds(challenge.difficulty)) phase = 'complete';
        else { round++; stage = 0; sequence = escapeSequence(challenge, round); phase = 'preview'; }
      }
    } else {
      mistakes++; feedback = 'incorrect';
      if (mistakes >= escapeMistakes(challenge.difficulty, challenge.escapeVersion)) phase = 'failed';
    }
  }
  return { sequence, stage, mistakes, round, hints, phase, feedback, complete: phase === 'complete', failed: phase === 'failed' };
}
export function evaluateEscape(challenge: Challenge, inputs: MiniGameInput[]): GameEvaluation {
  const state = escapeState(challenge, inputs);
  return {
    finished: state.complete || state.failed,
    score: state.complete ? (challenge.escapeVersion === 2 ? Math.max(60, 100 - state.mistakes * 10 - state.hints * 5) : 100 - state.mistakes * 20) : 0,
    detail: state.complete ? 'You found the exit through the shuffle.' : state.failed ? 'The stamps no longer line up.' : challenge.escapeVersion === 2 ? `Round ${state.round + 1} of ${escapeRounds(challenge.difficulty)} · ${state.phase === 'preview' ? 'Remember the pattern' : state.phase === 'hint' ? 'One-symbol hint' : 'Recall the pattern'}` : `Stamp ${state.stage + 1} of ${state.sequence.length}`,
  };
}
