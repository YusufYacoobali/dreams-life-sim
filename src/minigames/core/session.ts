import type { World } from '../../game/model';
import { IneligibleAction } from '../../game/errors';
import {
  activeMiniGame,
  challengeContext,
  miniGameReason,
} from './eligibility';
import { challengeSeed } from './difficulty';
import { evaluateSession } from './evaluation';
import { ratingFor } from './scoring';
import {
  durationMs,
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
    world.miniGames.push(session);
    // Starting commits the SAME yearly burglary allowance, before any game input.
    if (command.kind === 'crime')
      world.actionCounts[
        world.activePersonId + ':legal:' + world.date.year + ':crime:burglary'
      ] = 1;
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
      (session.kind === 'sports'
        ? 'shot'
        : session.kind === 'crime'
          ? 'lock'
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
    category: session.kind === 'crime' ? 'crime' : 'career',
    text: `${session.kind === 'sports' ? 'Clutch Shot' : session.kind === 'crime' ? 'Safe Cracker' : 'Orbital Docking'}: ${forfeit ? 'forfeited' : session.rating} (${session.score}/100).`,
  });
  return session;
}
