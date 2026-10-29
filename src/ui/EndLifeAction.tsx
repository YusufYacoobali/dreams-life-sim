import React, { useEffect, useRef, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { fullName } from '../game/model';
import type { EndLifeCommand } from '../game/engine';
import { useGame } from '../state/useGame';
import { ActionRow } from './components';
import { EventModal, type EventPresentation } from './EventModal';
import { useColors } from './theme';

type Review = { command: EndLifeCommand; event: EventPresentation };

export function EndLifeAction() {
  const world = useGame(s => s.world), busy = useGame(s => s.busy), error = useGame(s => s.error);
  const dispatch = useGame(s => s.dispatch), clearError = useGame(s => s.clearError), c = useColors();
  const [review, setReview] = useState<Review | null>(null);
  const reviewRef = useRef<Review | null>(null), mounted = useRef(true);
  if (reviewRef.current && (!world || reviewRef.current.command.lifeId !== world.id || reviewRef.current.command.personId !== world.activePersonId || reviewRef.current.command.expectedRevision !== world.revision)) reviewRef.current = null;
  const current = review && reviewRef.current === review ? review : null;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; reviewRef.current = null; }; }, []);
  useEffect(() => { if (review && !current) setReview(null); }, [review, current]);
  if (!world || !world.birthAcknowledged || world.people[world.activePersonId].died) return null;
  const unavailable = world.pending || world.annual && !world.annual.pausedForPlanning ? 'Finish the current event first' : undefined;
  const open = () => {
    if (busy || unavailable) return;
    clearError();
    const next: Review = {
      command: { type: 'end-life', lifeId: world.id, personId: world.activePersonId, expectedRevision: world.revision },
      event: {
        id: 'end-life:' + world.id + ':' + world.activePersonId + ':' + world.revision, kind: 'confirmation', title: 'End this life?',
        body: 'This will end ' + fullName(world.people[world.activePersonId]) + '’s current life and settle their estate. You can then view their life summary, start a new life, or continue as a living child if one is available.',
        terms: [{ id: 'checkpoint', label: 'Recovery', value: 'A checkpoint will be kept before this life ends.', tone: 'neutral' }],
        confirmLabel: 'End This Life',
      },
    };
    reviewRef.current = next; setReview(next);
  };
  return <>
    <ActionRow title="End This Life" subtitle="Finish this character’s story" icon={<Ionicons name="flag-outline" size={30} color={c.red} />} disabled={busy} disabledReason={unavailable} onPress={open} />
    <EventModal event={current?.event ?? null} busy={busy} error={error} onCancel={() => { reviewRef.current = null; setReview(null); clearError(); }} onChoose={() => {
      if (mounted.current && current && reviewRef.current === current && !busy) void dispatch(current.command).then(saved => { if (saved && reviewRef.current === current) { reviewRef.current = null; setReview(null); } });
    }} />
  </>;
}
