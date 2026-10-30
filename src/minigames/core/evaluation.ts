import { evaluateShot } from '../sports/sportsLogic';
import { evaluateLock } from '../crime/crimeLogic';
import { evaluateDocking } from '../astronaut/dockingPhysics';
import { evaluateEscape } from '../escape/escapeLogic';
import { durationMs, type GameEvaluation, type MiniGameSession } from './types';
export function evaluateSession(session: MiniGameSession): GameEvaluation {
  const outcome =
    session.kind === 'sports'
      ? evaluateShot(session, session.inputs[0])
      : session.kind === 'crime'
        ? evaluateLock(session, session.inputs)
        : session.kind === 'escape'
          ? evaluateEscape(session, session.inputs)
          : evaluateDocking(session, session.inputs, session.elapsedMs);
  return !outcome.finished && session.elapsedMs >= durationMs[session.kind]
    ? { finished: true, score: 0, detail: 'Time expired' }
    : outcome;
}
