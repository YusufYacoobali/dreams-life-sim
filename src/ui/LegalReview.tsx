import React, { useState } from 'react';
import { LegalCommand } from '../game/systems/legal';
import { useGame } from '../state/useGame';
import { HealthLegalArt, HealthLegalArtId } from '../assets/HealthLegalArt';
import { EffectRow, EventModal, EventPresentation } from './EventModal';
export function useLegalReview() {
  const dispatch = useGame(s => s.dispatch), busy = useGame(s => s.busy);
  const [review, setReview] = useState<{ command: LegalCommand; event: EventPresentation } | null>(null);
  return {
    confirm(command: LegalCommand, title: string, body: string, terms: EffectRow[] = [], art: HealthLegalArtId = 'justice', confirmLabel = 'Confirm') {
      setReview({ command, event: { kind: 'confirmation', id: command.type, title, body, terms, confirmLabel, illustration: <HealthLegalArt id={art} size={64} /> } });
    },
    modal: <EventModal event={review?.event ?? null} busy={busy} onCancel={() => setReview(null)} onChoose={() => { if (review) { const command = review.command; setReview(null); void dispatch(command); } }} />,
  };
}
