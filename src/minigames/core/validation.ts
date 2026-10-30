import type { World } from '../../game/model';
import { challengeSeed } from './difficulty';
import { evaluateSession } from './evaluation';
import { ratingFor } from './scoring';
import { durationMs } from './types';
import type { GameDate } from '../../game/calendar';

const sameDate = (a: GameDate, b: GameDate) =>
  a.year === b.year && a.month === b.month && a.day === b.day;

export function validateMiniGames(world: World) {
  const ids = new Set<string>(),
    opportunities = new Set<string>(),
    active = new Set<string>();
  for (const session of world.miniGames) {
    const opportunity = [
      session.personId,
      session.kind,
      session.ownerId,
      session.contextId,
    ].join(':');
    if (
      ids.has(session.id) ||
      opportunities.has(opportunity) ||
      session.lifeId !== world.id ||
      !world.people[session.personId] ||
      session.startedRevision >= world.revision ||
      session.elapsedMs > durationMs[session.kind]
    )
      throw Error('Invalid mini-game identity or opportunity');
    ids.add(session.id);
    opportunities.add(opportunity);
    if (
      session.seed !==
      challengeSeed(session.id + ':' + session.kind + ':' + session.contextId)
    )
      throw Error('Invalid mini-game challenge parameters');
    if (
      session.kind === 'sports' &&
      !world.careers.some(
        (row) =>
          row.id === session.ownerId &&
          row.personId === session.personId &&
          row.kind === 'athlete' &&
          row.projects.some((item) => item.id === session.contextId),
      )
    )
      throw Error('Invalid mini-game season');
    if (
      session.kind === 'astronaut' &&
      !world.serviceCareers.some(
        (row) =>
          row.id === session.ownerId &&
          row.personId === session.personId &&
          row.kind === 'astronaut' &&
          row.assignments.some(
            (item) =>
              item.id === session.contextId &&
              ['orbital-research', 'habitat-maintenance'].includes(item.kind),
          ),
      )
    )
      throw Error('Invalid mini-game assignment');
    if (
      session.kind === 'crime' &&
      (session.ownerId !== session.personId ||
        session.contextId !==
          `${session.personId}:burglary:${session.started.year}` ||
        world.actionCounts[
          session.personId +
            ':legal:' +
            session.started.year +
            ':crime:burglary'
        ] !== 1)
    )
      throw Error('Invalid mini-game burglary reservation');
    if (session.escapeVersion !== undefined && session.kind !== 'escape') throw Error('Escape version on another game');
    if (session.kind === 'escape') {
      const sentence = world.sentences.find(row => row.id === session.ownerId && row.personId === session.personId);
      const incidents = world.incidents.filter(row => row.personId === session.personId && row.offence === 'escape' && row.date.year === session.started.year);
      if (!sentence || session.contextId !== `${sentence.id}:escape:${session.started.year}` ||
        world.actionCounts[`${session.personId}:legal:${session.started.year}:escape`] !== 1 ||
        (session.status === 'active' && (sentence.state !== 'active' || incidents.length !== 0)) ||
        (session.status !== 'active' && incidents.length !== 1) ||
        (session.status !== 'active' && session.appliedMonth !== session.started.year * 12 + session.started.month - 1))
        throw Error('Invalid mini-game escape reservation or settlement');
    }
    let prior = 0;
    for (const input of session.inputs) {
      if (
        input.at < prior ||
        input.at > session.elapsedMs ||
        (!(session.kind === 'escape' && session.escapeVersion === 2 && ['stamp', 'escape-recall', 'escape-hint'].includes(input.action.type)) && (session.kind === 'sports'
          ? 'shot'
          : session.kind === 'crime'
            ? 'lock'
            : session.kind === 'escape'
              ? 'stamp'
              : 'thrust') !== input.action.type)
      )
        throw Error('Invalid mini-game input');
      prior = input.at;
    }
    if (session.kind === 'sports' && session.inputs.length > 1)
      throw Error('Duplicate shot');
    const outcome = evaluateSession(session);
    if (session.status === 'active') {
      if (
        session.personId !== world.activePersonId ||
        world.people[session.personId].died ||
        world.pending ||
        !sameDate(session.started, world.date) ||
        active.has(session.personId) ||
        session.score !== null ||
        session.rating !== null ||
        session.settled !== null ||
        session.appliedMonth !== null
      )
        throw Error('Invalid active mini-game');
      active.add(session.personId);
    } else {
      const score = session.status === 'forfeited' ? 0 : outcome.score;
      if (
        session.paused ||
        (session.status === 'completed' && !outcome.finished) ||
        session.score !== score ||
        session.rating !== ratingFor(score) ||
        !session.settled ||
        !sameDate(session.started, session.settled)
      )
        throw Error('Invalid mini-game result');
    }
    if (session.kind === 'crime') {
      const incidents = world.incidents.filter(
        (row) =>
          row.personId === session.personId &&
          row.offence === 'burglary' &&
          row.date.year === session.started.year,
      );
      if (
        session.status === 'active'
          ? incidents.length !== 0
          : incidents.length !== 1 ||
            session.appliedMonth !==
              session.started.year * 12 + session.started.month - 1
      )
        throw Error('Invalid mini-game burglary settlement');
    }
    if (session.appliedMonth !== null) {
      if (
        session.kind === 'sports' &&
        !world.careers
          .find((row) => row.id === session.ownerId)
          ?.projects.find((row) => row.id === session.contextId)
          ?.periods.some(
            (row) => row.month === session.appliedMonth && row.attended,
          )
      )
        throw Error('Mini-game modifier lacks a match period');
      if (
        session.kind === 'astronaut' &&
        !world.serviceCareers
          .find((row) => row.id === session.ownerId)
          ?.assignments.find((row) => row.id === session.contextId)
          ?.periods.some(
            (row) =>
              row.month === session.appliedMonth &&
              row.attended &&
              row.risk === 'none',
          )
      )
        throw Error('Mini-game modifier lacks a mission period');
    }
  }
}
