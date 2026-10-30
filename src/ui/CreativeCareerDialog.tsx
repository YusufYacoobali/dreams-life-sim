import React, { useEffect, useRef, useState } from 'react';
import type { GameCommand } from '../game/engine';
import { useGame } from '../state/useGame';
import { CareerArt } from '../assets/CareerArt';
import { EventModal, type EffectRow, type EventPresentation } from './EventModal';

type Dialog = { identity: string; event: EventPresentation; command?: GameCommand; choose?: (id: string) => void };
/** The free industry careers share review/retry behavior, independently of purchase UI. */
export function useCreativeCareerDialog(kind: 'actor' | 'model') {
  const dispatch = useGame(state => state.dispatch), busy = useGame(state => state.busy), error = useGame(state => state.error), clearError = useGame(state => state.clearError);
  const identity = useGame(state => state.world ? state.world.id + ':' + state.world.activePersonId + ':' + state.world.revision + ':' + kind : 'none');
  const [dialog, setDialog] = useState<Dialog | null>(null), current = useRef<Dialog | null>(null), context = useRef(identity), mounted = useRef(true), submitting = useRef(false), sequence = useRef(0);
  context.current = identity;
  if (current.current?.identity !== identity) current.current = null;
  const shown = dialog === current.current && dialog?.identity === identity ? dialog : null;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; current.current = null; }; }, []);
  useEffect(() => { setDialog(value => value?.identity === identity ? value : null); }, [identity]);
  const isCurrent = (value: Dialog) => mounted.current && context.current === value.identity && current.current === value;
  const close = (value: Dialog) => { if (isCurrent(value)) { current.current = null; setDialog(previous => previous === value ? null : previous); } };
  const open = (event: EventPresentation, extra: Pick<Dialog, 'command' | 'choose'> = {}) => {
    if (!mounted.current || busy || submitting.current || context.current !== identity) return;
    clearError(); const value = { identity, event, ...extra }; current.current = value; setDialog(value);
  };
  const art = <CareerArt id={kind} size={64} />;
  return {
    open: !!shown,
    confirm(command: GameCommand, title: string, body: string, terms: EffectRow[] = [], label = 'Confirm') {
      open({ id: kind + ':review:' + sequence.current++, kind: 'confirmation', title, body, terms, confirmLabel: label, illustration: art }, { command });
    },
    select(title: string, body: string, choices: readonly { id: string; label: string; disabledReason?: string }[], choose: (id: string) => void) {
      open({ id: kind + ':select:' + sequence.current++, kind: 'selection', title, body, choices, confirmLabel: 'Choose', illustration: art }, { choose });
    },
    info(title: string, body: string, effects: EffectRow[] = []) {
      open({ id: kind + ':info:' + sequence.current++, kind: 'result', title, body, effects, continueLabel: 'Close', illustration: art });
    },
    modal: <EventModal event={shown?.event ?? null} busy={busy} error={shown?.command ? error : null}
      onCancel={shown?.event.kind === 'result' ? undefined : () => { if (shown && !busy && !submitting.current) close(shown); }}
      onClose={() => { if (shown && !busy && !submitting.current) close(shown); }}
      onChoose={async id => {
        if (!shown || busy || submitting.current || !isCurrent(shown)) return;
        if (shown.choose) { const choose = shown.choose; close(shown); choose(id); return; }
        if (!shown.command) { close(shown); return; }
        submitting.current = true;
        try { if (await dispatch(shown.command) && isCurrent(shown)) close(shown); }
        finally { submitting.current = false; }
      }} />,
  };
}
export type CreativeCareerDialog = ReturnType<typeof useCreativeCareerDialog>;
