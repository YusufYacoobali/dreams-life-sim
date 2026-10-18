import React, { useState } from 'react';
import { BusinessCommand } from '../game/systems/businesses';
import { useGame } from '../state/useGame';
import { FameBusinessArt, FameBusinessArtId } from '../assets/FameBusinessArt';
import { EffectRow, EventModal, EventPresentation } from './EventModal';
export function useBusinessReview() {
  const dispatch = useGame(s => s.dispatch), busy = useGame(s => s.busy), [review, setReview] = useState<{ command: BusinessCommand; event: EventPresentation } | null>(null);
  return { confirm(command: BusinessCommand, title: string, body: string, terms: EffectRow[] = [], art: FameBusinessArtId = 'business', label = 'Confirm') { setReview({ command, event: { kind: 'confirmation', id: command.type, title, body, terms, confirmLabel: label, illustration: <FameBusinessArt id={art} size={64} /> } }); }, modal: <EventModal event={review?.event ?? null} busy={busy} onCancel={() => setReview(null)} onChoose={() => { if (review) { const command = review.command; setReview(null); void dispatch(command); } }} /> };
}
