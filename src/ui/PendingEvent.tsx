import React, { useMemo } from 'react';
import { useGame } from '../state/useGame';
import { EventModal, EventPresentation } from './EventModal';
import { choiceUnavailable } from '../game/choiceAvailability';
import { storyParticipants } from '../game/storyNames';
import { resolveEventArtwork } from './eventArtwork';

/** Render persisted decisions/results; opening or closing a view never resolves an outcome. */
export function PendingEvent() {
  const pending = useGame(s => s.world?.pending);
  const world = useGame(s => s.world);
  const dispatch = useGame(s => s.dispatch);
  const busy = useGame(s => s.busy);
  const error = useGame(s => s.error);
  // Save feedback cannot change eligibility; a new world or bound scene can.
  const choices = useMemo(() => pending?.kind === 'decision'
    ? pending.choices.map(choice => ({ id: choice.id, label: choice.label, disabledReason: world ? choiceUnavailable(world, choice) : choice.disabledReason }))
    : [], [world, pending]);
  const artwork = useMemo(() => pending && world ? resolveEventArtwork(pending,world) : undefined,[pending,world]);
  const participants = useMemo(() => pending?.participants ?? (pending?.kind === 'decision' && world ? storyParticipants(world,pending.personIds) : undefined),[pending,world]);
  if (!pending || !artwork) return null;
  // Keep saved hiring quotes intact, including interviews resumed from disk.
  // Contract terms and experience belong in job details; the popup asks the question.
  const interview = pending.kind === 'decision' && pending.templateId === 'job-interview'
    ? pending.choices.flatMap(choice => choice.effects).find(effect => effect.kind === 'job-interview')
    : undefined;
  const questionStart = interview?.kind === 'job-interview' ? pending.body.indexOf(interview.employer + ' asks: ') : -1;
  const body = questionStart >= 0 ? pending.body.slice(questionStart) : pending.body;
  const event: EventPresentation = pending.kind === 'decision'
    ? { ...pending, body, ...artwork, participants, choices }
    : { ...pending, ...artwork, participants };
  return <EventModal scope="stack" event={event} busy={busy} error={error} onChoose={choiceId => {
    void dispatch(pending.kind === 'decision' ? { type: 'choose', eventId: pending.id, choiceId } : { type: 'acknowledge', resultId: pending.id });
  }} />;
}
