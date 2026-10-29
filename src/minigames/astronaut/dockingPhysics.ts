import type { Challenge, GameEvaluation, MiniGameInput } from '../core/types';
export type DockingState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fuel: number;
  at: number;
  finished: boolean;
  score: number;
};
export function initialDocking(seed: number, difficulty: number): DockingState {
  'worklet';
  return {
    x: seed % 2 ? 0.29 : 0.71,
    y: 0.82,
    vx: ((seed % 3) - 1) * 0.009 * difficulty,
    vy: -0.049 - difficulty * 0.003,
    fuel: 100,
    at: 0,
    finished: false,
    score: 0,
  };
}
/** Analytic constant-velocity flight between impulses. The exact same worklet
 * drives the UI and command replay: no frame-rate-dependent integration. */
export function advanceDocking(
  state: DockingState,
  to: number,
  difficulty: number,
): DockingState {
  'worklet';
  if (state.finished || to <= state.at) return state;
  let dt = (to - state.at) / 1000;
  const crossedPort = state.vy < 0 && state.y + state.vy * dt <= 0.24;
  if (crossedPort) dt = Math.max(0, (0.24 - state.y) / state.vy);
  const x = state.x + state.vx * dt,
    y = state.y + state.vy * dt;
  let finished = crossedPort || x < 0.06 || x > 0.94 || y > 0.96 || to >= 14000,
    score = 0;
  if (crossedPort) {
    const alignment = Math.abs(x - 0.5),
      speed = Math.hypot(state.vx, state.vy),
      tolerance = 0.09 - difficulty * 0.006;
    if (alignment <= tolerance && speed <= 0.105)
      score = Math.round(
        Math.max(
          60,
          100 - (alignment / tolerance) * 20 - Math.max(0, speed - 0.065) * 350,
        ),
      );
    else if (alignment <= tolerance * 1.65 && speed <= 0.15) score = 40;
  }
  return { ...state, x, y, at: to, finished, score };
}
export function thrustDocking(
  state: DockingState,
  direction: string,
): DockingState {
  'worklet';
  if (state.finished || direction === 'coast') return state;
  if (state.fuel <= 5) return { ...state, fuel: 0, finished: true, score: 0 };
  const impulse = 0.022;
  return {
    ...state,
    fuel: state.fuel - 5,
    vx: Math.max(
      -0.2,
      Math.min(
        0.2,
        state.vx +
          (direction === 'left'
            ? -impulse
            : direction === 'right'
              ? impulse
              : 0),
      ),
    ),
    vy: Math.max(
      -0.2,
      Math.min(
        0.2,
        state.vy +
          (direction === 'up' ? -impulse : direction === 'down' ? impulse : 0),
      ),
    ),
  };
}
export function dockingState(
  challenge: Challenge,
  inputs: readonly MiniGameInput[],
  milliseconds: number,
) {
  let state = initialDocking(challenge.seed, challenge.difficulty);
  for (const input of inputs) {
    if (input.action.type !== 'thrust' || state.finished)
      throw Error('That thruster input is not available');
    state = advanceDocking(state, input.at, challenge.difficulty);
    if (state.finished) throw Error('The approach has already ended');
    state = thrustDocking(state, input.action.direction);
  }
  return advanceDocking(state, milliseconds, challenge.difficulty);
}
export function evaluateDocking(
  challenge: Challenge,
  inputs: readonly MiniGameInput[],
  milliseconds: number,
): GameEvaluation {
  const state = dockingState(challenge, inputs, milliseconds);
  return {
    finished: state.finished,
    score: state.score,
    detail: !state.finished
      ? 'Match alignment and slow your approach'
      : state.score >= 85
        ? 'A perfect, soft capture'
        : state.score >= 60
          ? 'Docking confirmed'
          : state.score >= 30
            ? 'A rough docking'
            : 'Approach aborted safely',
  };
}
