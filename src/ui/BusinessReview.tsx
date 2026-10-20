import React, { useRef, useState } from 'react';
import { BusinessCommand } from '../game/systems/businesses';
import { useGame } from '../state/useGame';
import { FameBusinessArt, FameBusinessArtId } from '../assets/FameBusinessArt';
import { EffectRow, EventModal, EventPresentation } from './EventModal';
export function useBusinessReview() {
  const dispatch = useGame(s => s.dispatch), busy = useGame(s => s.busy), error = useGame(s => s.error), [review, setReview] = useState<{ command: BusinessCommand; event: EventPresentation } | null>(null), submitting = useRef(false);
  return { open: !!review, confirm(command: BusinessCommand, title: string, body: string, terms: EffectRow[] = [], art: FameBusinessArtId = 'business', label = 'Confirm') {
    if (busy || submitting.current) return;
    setReview({ command, event: { kind: 'confirmation', id: command.type, title, body, terms, confirmLabel: label, illustration: <FameBusinessArt id={art} size={64} /> } });
  }, modal: <EventModal event={review?.event ?? null} busy={busy} error={error} onCancel={() => { if (!busy && !submitting.current) setReview(null); }} onChoose={async () => {
    if (!review || busy || submitting.current) return;
    submitting.current = true;
    try { if (await dispatch(review.command)) setReview(null); }
    finally { submitting.current = false; }
  }} /> };
}
