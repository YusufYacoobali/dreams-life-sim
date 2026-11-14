import type { Challenge, GameEvaluation, MiniGameInput } from '../core/types';
import { challengeSeed } from '../core/difficulty';
import { nextRandom } from '../../game/random';

export const keyShapes = ['circle', 'triangle', 'square', 'diamond', 'star', 'hexagon'] as const;
export type KeyShape = typeof keyShapes[number];
export type CellKey = { id: number; shape: KeyShape; teeth: number };
type CellChallenge = Pick<Challenge, 'seed' | 'difficulty'>;
const level = (difficulty: number) => Math.max(1, Math.min(5, difficulty));
export const cellLockCount = (difficulty: number) => [3, 4, 4, 5, 6][level(difficulty) - 1];
export const cellMistakeLimit = (difficulty: number) => [4, 3, 3, 2, 2][level(difficulty) - 1];
function shuffled<T>(items: readonly T[], seed: number): T[] {
  const result = [...items]; let state = seed;
  for (let index = result.length - 1; index > 0; index--) {
    const draw = nextRandom(state); state = draw.state;
    const other = Math.floor(draw.value * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}
/** A separate local stream: constructing or rendering a board never draws life RNG. */
export function cellBoard(challenge: CellChallenge) {
  const shapes = shuffled(keyShapes, challengeSeed(challenge.seed + ':cell:3:shapes'));
  const families = challenge.difficulty >= 5 ? 2 : challenge.difficulty >= 3 ? 3 : 6;
  const keys: CellKey[] = Array.from({ length: 6 }, (_, id) => ({ id, shape: shapes[id % families], teeth: 1 + Math.floor(id / families) }));
  const locks = shuffled(keys, challengeSeed(challenge.seed + ':cell:3:locks')).slice(0, cellLockCount(challenge.difficulty)).map((key, id) => ({ id, keyId: key.id }));
  return { keys: shuffled(keys, challengeSeed(challenge.seed + ':cell:3:tray')), locks };
}
export function cellEscapeState(challenge: CellChallenge, inputs: readonly MiniGameInput[]) {
  const board = cellBoard(challenge), unlocked: number[] = [], usedKeys: number[] = [];
  let mistakes = 0, feedback: 'correct' | 'incorrect' | null = null, lastLock: number | null = null;
  for (const input of inputs) {
    if (unlocked.length === board.locks.length || mistakes >= cellMistakeLimit(challenge.difficulty)) throw Error('Cell Escape already finished');
    if (input.action.type !== 'escape-fit') throw Error('Choose a key and a cell lock');
    const { keyId, lockId } = input.action, key = board.keys.find(row => row.id === keyId), lock = board.locks.find(row => row.id === lockId);
    if (!key || !lock || unlocked.includes(lockId) || usedKeys.includes(keyId)) throw Error('Choose an unused key and a locked slot');
    lastLock = lockId;
    if (lock.keyId === keyId) { unlocked.push(lockId); usedKeys.push(keyId); feedback = 'correct'; }
    else { mistakes++; feedback = 'incorrect'; }
  }
  return { ...board, unlocked, usedKeys, mistakes, feedback, lastLock, complete: unlocked.length === board.locks.length, failed: mistakes >= cellMistakeLimit(challenge.difficulty) };
}
export function evaluateCellEscape(challenge: CellChallenge, inputs: readonly MiniGameInput[]): GameEvaluation {
  const state = cellEscapeState(challenge, inputs);
  return { finished: state.complete || state.failed, score: state.complete ? Math.max(60, 100 - state.mistakes * 10) : 0, detail: state.complete ? 'Every lock is open.' : state.failed ? 'The door stays locked.' : state.unlocked.length + '/' + state.locks.length + ' locks open' };
}
