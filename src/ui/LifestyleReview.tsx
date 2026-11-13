import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '../state/useGame';
import type { GameCommand } from '../game/engine';
import { EventModal, type EventPresentation, type EffectRow } from './EventModal';
import { useScopedGameAction } from './useScopedGameAction';

type Review = { identity: string; command: GameCommand; event: EventPresentation };
export function useLifestyleReview(context = '') {
  const { busy, dispatch, error, clear } = useScopedGameAction(context);
  const identity = useGame(state => state.world ? state.world.id + ':' + state.world.activePersonId + ':' + state.world.revision : 'none') + ':' + context;
  const [review, setReview] = useState<Review | null>(null);
  const active = useRef<Review | null>(null), current = useRef(identity), mounted = useRef(true);
  current.current = identity;
  const shown = review?.identity === identity && active.current === review ? review : null;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; active.current = null; }; }, []);
  useEffect(() => { if (active.current?.identity !== identity) { active.current = null; setReview(null); } }, [identity]);
  const close = () => { if (!busy && mounted.current) { active.current = null; setReview(null); clear(); } };
  const ask = (command: GameCommand, title: string, body: string, terms: EffectRow[] = [], illustration?: React.ReactNode) => {
    if (busy || !mounted.current || current.current !== identity) return;
    clear();
    const next: Review = { identity, command, event: { id: 'lifestyle-review-' + command.type, kind: 'confirmation', title, body, terms, confirmLabel: 'Confirm', illustration } };
    active.current = next; setReview(next);
  };
  const modal = <EventModal event={shown?.event ?? null} busy={busy} error={error} onCancel={close} onChoose={async () => {
    if (!shown || busy || !mounted.current || active.current !== shown || current.current !== shown.identity) return;
    if (await dispatch(shown.command) && mounted.current && active.current === shown) { active.current = null; setReview(value => value === shown ? null : value); }
  }} />;
  return { ask, modal, busy };
}
