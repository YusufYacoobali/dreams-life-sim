import React, { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';
import { LegalCommand } from '../game/systems/legal';
import { useGame } from '../state/useGame';
import { HealthLegalArt, HealthLegalArtId } from '../assets/HealthLegalArt';
import { EffectRow, EventModal, EventPresentation } from './EventModal';
import { useColors } from './theme';

export function LegalReviewError({ error }: { error: string | null }) {
  const colors = useColors();
  return error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: colors.red, fontSize: 15, lineHeight: 22 }}>{error}</Text> : null;
}

export function useLegalReview(context = '') {
  const dispatch = useGame(s => s.dispatch), busy = useGame(s => s.busy), error = useGame(s => s.error);
  const identity = useGame(s => s.world?.id + ':' + s.world?.activePersonId) + ':' + context;
  const identityRef = useRef(identity), mounted = useRef(true), submitting = useRef(false);
  const [review, setReview] = useState<{ identity: string; command: LegalCommand; event: EventPresentation } | null>(null);
  const activeReview = useRef<typeof review>(null);
  if (identityRef.current !== identity) { identityRef.current = identity; activeReview.current = null; }
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; activeReview.current = null; }; }, []);
  useEffect(() => { setReview(saved => saved && saved.identity !== identity ? null : saved); }, [identity]);
  const current = review?.identity === identity ? review : null;
  return {
    isOpen: !!current,
    confirm(command: LegalCommand, title: string, body: string, terms: EffectRow[] = [], art: HealthLegalArtId = 'justice', confirmLabel = 'Confirm') {
      if (!mounted.current || identityRef.current !== identity || busy || submitting.current) return;
      const next = { identity, command, event: { kind: 'confirmation', id: identity + ':' + command.type, title, body, terms, confirmLabel, illustration: <HealthLegalArt id={art} size={64} /> } } satisfies NonNullable<typeof review>;
      activeReview.current = next; setReview(next);
    },
    modal: <EventModal event={current?.event ?? null} busy={busy} error={error} onCancel={() => { if (mounted.current && !busy && !submitting.current && activeReview.current === current) { activeReview.current = null; setReview(saved => saved === current ? null : saved); } }} onChoose={async () => {
      if (!mounted.current || !current || busy || submitting.current || identityRef.current !== current.identity || activeReview.current !== current) return;
      submitting.current = true;
      try {
        if (await dispatch(current.command) && mounted.current && identityRef.current === current.identity && activeReview.current === current) { activeReview.current = null; setReview(saved => saved === current ? null : saved); }
      } finally { submitting.current = false; }
    }} />,
  };
}
