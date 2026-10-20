import React, { useEffect, useState } from 'react';
import { SocialMediaCommand } from '../game/systems/social';
import { useGame } from '../state/useGame';
import { FameBusinessArt, FameBusinessArtId } from '../assets/FameBusinessArt';
import { EffectRow, EventModal, EventPresentation } from './EventModal';
type Review = { identity: string; command: SocialMediaCommand; event: EventPresentation; onSaved?: () => void };

export function useSocialReview(context = '') {
  const dispatch = useGame(s => s.dispatch), busy = useGame(s => s.busy), error = useGame(s => s.error);
  const person = useGame(s => s.world ? s.world.id + ':' + s.world.activePersonId : 'none'), identity = person + ':' + context;
  const [review, setReview] = useState<Review | null>(null), current = review?.identity === identity ? review : null;
  useEffect(() => { setReview(null); }, [identity]);
  return {
    reviewing: !!current,
    confirm(command: SocialMediaCommand, title: string, body: string, terms: EffectRow[] = [], art: FameBusinessArtId = 'social', label = 'Confirm', onSaved?: () => void) {
      if (busy) return;
      setReview({ identity, command, onSaved, event: { kind: 'confirmation', id: command.type, title, body, terms, confirmLabel: label, illustration: <FameBusinessArt id={art} size={64} /> } });
    },
    modal: <EventModal event={current?.event ?? null} busy={busy} error={error} onCancel={() => { if (!busy) setReview(null); }} onChoose={async () => {
      if (busy || !current) return;
      if (await dispatch(current.command)) {
        setReview(value => value === current ? null : value);
        current.onSaved?.();
      }
    }} />,
  };
}
