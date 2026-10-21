import React, { useEffect, useRef, useState } from 'react';
import { SocialMediaCommand } from '../game/systems/social';
import { useGame } from '../state/useGame';
import { FameBusinessArt, FameBusinessArtId } from '../assets/FameBusinessArt';
import { EffectRow, EventModal, EventPresentation } from './EventModal';
type Review = { identity: string; command: SocialMediaCommand; event: EventPresentation; onSaved?: () => void };

export function useSocialReview(context = '') {
  const dispatch = useGame(s => s.dispatch), busy = useGame(s => s.busy), error = useGame(s => s.error);
  const person = useGame(s => s.world ? s.world.id + ':' + s.world.activePersonId : 'none'), identity = person + ':' + context;
  const mounted = useRef(true), submitting = useRef(false), identityRef = useRef(identity), reviewRef = useRef<Review | null>(null);
  identityRef.current = identity;
  if (reviewRef.current?.identity !== identity) reviewRef.current = null;
  const [review, setReview] = useState<Review | null>(null), current = review === reviewRef.current && review?.identity === identity ? review : null;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; reviewRef.current = null; }; }, []);
  useEffect(() => { setReview(saved => saved?.identity === identity ? saved : null); }, [identity]);
  const isCurrent = (value: Review) => mounted.current && identityRef.current === value.identity && reviewRef.current === value;
  return {
    reviewing: !!current,
    confirm(command: SocialMediaCommand, title: string, body: string, terms: EffectRow[] = [], art: FameBusinessArtId = 'social', label = 'Confirm', onSaved?: () => void) {
      if (!mounted.current || busy || submitting.current || identityRef.current !== identity) return;
      const next: Review = { identity, command, onSaved, event: { kind: 'confirmation', id: command.type, title, body, terms, confirmLabel: label, illustration: <FameBusinessArt id={art} size={64} /> } };
      reviewRef.current = next; setReview(next);
    },
    modal: <EventModal event={current?.event ?? null} busy={busy} error={error} onCancel={() => {
      if (busy || submitting.current || !current || !isCurrent(current)) return;
      reviewRef.current = null; setReview(null);
    }} onChoose={async () => {
      if (busy || submitting.current || !current || !isCurrent(current)) return;
      submitting.current = true;
      try {
        if (await dispatch(current.command) && isCurrent(current)) {
          reviewRef.current = null; setReview(value => value === current ? null : value);
          current.onSaved?.();
        }
      } finally { submitting.current = false; }
    }} />,
  };
}
