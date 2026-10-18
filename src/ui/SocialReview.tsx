import React, { useState } from 'react';
import { SocialMediaCommand } from '../game/systems/social';
import { useGame } from '../state/useGame';
import { FameBusinessArt, FameBusinessArtId } from '../assets/FameBusinessArt';
import { EffectRow, EventModal, EventPresentation } from './EventModal';
export function useSocialReview() {
  const dispatch = useGame(s => s.dispatch), busy = useGame(s => s.busy), [review, setReview] = useState<{ command: SocialMediaCommand; event: EventPresentation } | null>(null);
  return { confirm(command: SocialMediaCommand, title: string, body: string, terms: EffectRow[] = [], art: FameBusinessArtId = 'social', label = 'Confirm') { setReview({ command, event: { kind: 'confirmation', id: command.type, title, body, terms, confirmLabel: label, illustration: <FameBusinessArt id={art} size={64} /> } }); }, modal: <EventModal event={review?.event ?? null} busy={busy} onCancel={() => setReview(null)} onChoose={() => { if (review) { const command = review.command; setReview(null); void dispatch(command); } }} /> };
}
