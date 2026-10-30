import type { World } from '../../game/model';
import { IneligibleAction } from '../../game/errors';
import {
  activeMiniGame,
  challengeContext,
  miniGameReason,
  escapeAttemptKey,
} from './eligibility';
import { challengeSeed } from './difficulty';
import { evaluateSession } from './evaluation';
import { ratingFor } from './scoring';
import {
  durationMs,
  titles,
  type MiniGameCommand,
  type MiniGameSession,
} from './types';

export function resolveMiniGame(
  world: World,
  command: MiniGameCommand,
): MiniGameSession | undefined {
  if (command.type === 'mini-game-start') {
    const reason = miniGameReason(
      world,
      command.kind,
      command.ownerId,
      command.contextId,
    );
    if (reason) throw new IneligibleAction(reason);
    const id = `mini_${world.id}_${world.activePersonId}_${world.revision}`;
    const session: MiniGameSession = {
      id,
      lifeId: world.id,
      personId: world.activePersonId,
      kind: command.kind,
      ownerId: command.ownerId,
      contextId: command.contextId,
      started: { ...world.date },
      startedRevision: world.revision,
      seed: challengeSeed(id + ':' + command.kind + ':' + command.contextId),
      difficulty: challengeContext(
        world,
        command.kind,
        command.ownerId,
        command.contextId,
      )!.difficulty,
      assisted: command.assisted,
      status: 'active',
      paused: false,
      elapsedMs: 0,
      inputs: [],
      score: null,
      rating: null,
      settled: null,
      appliedMonth: null,
    };
    if (command.kind === 'escape') {
      session.escapeVersion = 2;
      session.escapePatternVersion = 1;
    }
    world.miniGames.push(session);
    // Starting commits the SAME yearly burglary allowance, before any game input.
    if (command.kind === 'crime')
      world.actionCounts[
        world.activePersonId + ':legal:' + world.date.year + ':crime:burglary'
      ] = 1;
    if (command.kind === 'escape')
      world.actionCounts[escapeAttemptKey(world.activePersonId, world.date.year)] = 1;
    return;
  }
  const session = world.miniGames.find(
    (row) =>
      row.id === command.sessionId &&
      row.personId === world.activePersonId &&
      row.lifeId === world.id,
  );
  if (!session || session !== activeMiniGame(world))
    throw new IneligibleAction(
      'This challenge has already ended or belongs to another life',
    );
  if (command.type === 'mini-game-resume') {
    session.paused = false;
    return;
  }
  if (command.type === 'mini-game-pause') {
    if (
      command.elapsedMs < session.elapsedMs ||
      command.elapsedMs > durationMs[session.kind]
    )
      throw new IneligibleAction('Invalid challenge time');
    session.elapsedMs = command.elapsedMs;
    session.paused = true;
    return;
  }
  if (command.type === 'mini-game-input') {
    if (session.paused)
      throw new IneligibleAction('Resume the challenge first');
    if (command.index !== session.inputs.length || session.inputs.length >= 120)
      throw new IneligibleAction(
        'This input has already been recorded or is out of order',
      );
    const { input } = command;
    if (input.at < session.elapsedMs || input.at > durationMs[session.kind])
      throw new IneligibleAction('Invalid challenge time');
    if (
      !(session.kind === 'escape' && session.escapeVersion === 2 && ['stamp', 'escape-recall', 'escape-hint'].includes(input.action.type)) &&
      (session.kind === 'sports'
        ? 'shot'
        : session.kind === 'crime'
          ? 'lock'
          : session.kind === 'escape'
            ? 'stamp'
            : 'thrust') !== input.action.type
    )
      throw new IneligibleAction('This control belongs to another game');
    if (evaluateSession(session).finished)
      throw new IneligibleAction('The challenge has already finished');
    session.inputs.push(input);
    session.elapsedMs = input.at;
    evaluateSession(session); // Reject contradictory flight/input transcripts before saving.
    return;
  }
  const outcome = evaluateSession(session),
    forfeit = command.type === 'mini-game-forfeit';
  if (!forfeit && !outcome.finished)
    throw new IneligibleAction('Finish the challenge before saving its result');
  session.status = forfeit ? 'forfeited' : 'completed';
  session.paused = false;
  session.score = forfeit ? 0 : outcome.score;
  session.rating = ratingFor(session.score);
  session.settled = { ...world.date };
  world.journal.push({
    id: session.id + '_result',
    personId: session.personId,
    date: { ...world.date },
    category: session.kind === 'escape' ? 'legal' : session.kind === 'crime' ? 'crime' : 'career',
    text: session.kind === 'escape'
      ? `I ${forfeit ? 'abandoned Exit Shuffle' : 'completed Exit Shuffle with ' + session.score + '/100'}.`
      : `${titles[session.kind]}: ${forfeit ? 'forfeited' : session.rating} (${session.score}/100).`,
  });
  return session;
}
