import React from 'react';
import { Illustration, illustrationCells, IllustrationId } from '../assets/Illustration';
import { useGame } from '../state/useGame';
import { EventModal, EventPresentation } from './EventModal';
import { FamilyArt, familyCells, FamilyArtId } from '../assets/FamilyArt';
import { HealthLegalArt, HealthLegalArtId } from '../assets/HealthLegalArt';
import { healthLegalRects } from '../assets/healthLegalLayout';
import { choiceUnavailable } from '../game/choiceAvailability';

/** Render persisted decisions/results; opening or closing a view never resolves an outcome. */
export function PendingEvent() {
  const pending = useGame(s => s.world?.pending);
  const world = useGame(s => s.world);
  const dispatch = useGame(s => s.dispatch);
  const busy = useGame(s => s.busy);
  const error = useGame(s => s.error);
  if (!pending) return null;
  const illustration = pending.illustration in illustrationCells ? <Illustration id={pending.illustration as IllustrationId} size={64} /> : pending.illustration in familyCells ? <FamilyArt id={pending.illustration as FamilyArtId} size={64} /> : pending.illustration in healthLegalRects ? <HealthLegalArt id={pending.illustration as HealthLegalArtId} size={64} /> : undefined;
  const event: EventPresentation = pending.kind === 'decision'
    ? { ...pending, illustration, choices: pending.choices.map(choice => ({ id: choice.id, label: choice.label, disabledReason: world ? choiceUnavailable(world, choice) : choice.disabledReason })) }
    : { ...pending, illustration };
  return <EventModal event={event} busy={busy} error={error} onChoose={choiceId => {
    void dispatch(pending.kind === 'decision' ? { type: 'choose', eventId: pending.id, choiceId } : { type: 'acknowledge', resultId: pending.id });
  }} />;
}
