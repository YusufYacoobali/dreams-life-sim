import React, { useEffect, useRef, useState } from 'react';
import { BusinessCommand } from '../game/systems/businesses';
import type { World } from '../game/model';
import { useGame } from '../state/useGame';
import { FameBusinessArt, FameBusinessArtId } from '../assets/FameBusinessArt';
import { EffectRow, EventModal, EventPresentation } from './EventModal';
type Review = { identity: string; command: BusinessCommand; event: EventPresentation };
function reviewContext(world: World | null, businessId?: string) {
  if (!world) return 'none';
  const person = world.people[world.activePersonId], company = businessId ? world.businesses.find(item => item.id === businessId) : undefined;
  return JSON.stringify([world.id, person.id, person.country, person.city, person.died, businessId,
    company && [company.id, company.ownerId, company.status, company.country, company.city, company.currency]]);
}

export function useBusinessReview(businessId?: string) {
  const dispatch = useGame(s => s.dispatch), busy = useGame(s => s.busy), error = useGame(s => s.error);
  const identity = useGame(s => reviewContext(s.world, businessId)), identityRef = useRef(identity), mounted = useRef(true), submitting = useRef(false), currentReviewRef = useRef<Review | null>(null);
  identityRef.current = identity;
  if (currentReviewRef.current && currentReviewRef.current.identity !== identity) currentReviewRef.current = null;
  const [review, setReview] = useState<Review | null>(null), current = review?.identity === identity && currentReviewRef.current === review ? review : null;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; currentReviewRef.current = null; }; }, []);
  useEffect(() => { setReview(saved => saved && saved.identity !== identity ? null : saved); }, [identity]);
  return { open: !!current, confirm(command: BusinessCommand, title: string, body: string, terms: EffectRow[] = [], art: FameBusinessArtId = 'business', label = 'Confirm') {
    if (!mounted.current || busy || submitting.current || identityRef.current !== identity) return;
    const next: Review = { identity, command, event: { kind: 'confirmation', id: identity + ':' + command.type, title, body, terms, confirmLabel: label, illustration: <FameBusinessArt id={art} size={64} /> } };
    currentReviewRef.current = next; setReview(next);
  }, modal: <EventModal event={current?.event ?? null} busy={busy} error={error} onCancel={() => {
    if (mounted.current && current && !busy && !submitting.current && identityRef.current === current.identity && currentReviewRef.current === current) {
      currentReviewRef.current = null; setReview(saved => saved === current ? null : saved);
    }
  }} onChoose={async () => {
    if (!mounted.current || !current || busy || submitting.current || identityRef.current !== current.identity || currentReviewRef.current !== current) return;
    submitting.current = true;
    try {
      if (await dispatch(current.command) && mounted.current && identityRef.current === current.identity && currentReviewRef.current === current) {
        currentReviewRef.current = null; setReview(saved => saved === current ? null : saved);
      }
    }
    finally { submitting.current = false; }
  }} /> };
}
