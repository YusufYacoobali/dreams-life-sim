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
  const identityRef = useRef(identity), submitting = useRef(false); identityRef.current = identity;
  const [review, setReview] = useState<{ identity: string; command: LegalCommand; event: EventPresentation } | null>(null);
  useEffect(() => { setReview(saved => saved && saved.identity !== identity ? null : saved); }, [identity]);
  const current = review?.identity === identity ? review : null;
  return {
    isOpen: !!current,
    confirm(command: LegalCommand, title: string, body: string, terms: EffectRow[] = [], art: HealthLegalArtId = 'justice', confirmLabel = 'Confirm') {
      if (busy || submitting.current) return;
      setReview({ identity, command, event: { kind: 'confirmation', id: identity + ':' + command.type, title, body, terms, confirmLabel, illustration: <HealthLegalArt id={art} size={64} /> } });
    },
    modal: <EventModal event={current?.event ?? null} busy={busy} error={error} onCancel={() => { if (!busy && !submitting.current) setReview(null); }} onChoose={async () => {
      if (!current || busy || submitting.current) return;
      submitting.current = true;
      try {
        if (await dispatch(current.command) && identityRef.current === current.identity) setReview(saved => saved === current ? null : saved);
      } finally { submitting.current = false; }
    }} />,
  };
}
