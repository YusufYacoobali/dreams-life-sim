import React, { useState } from 'react';
import { useGame } from '../state/useGame';
import type { GameCommand } from '../game/engine';
import { EventModal, type EventPresentation, type EffectRow } from './EventModal';
export function useLifestyleReview() {
    const busy = useGame(s => s.busy), dispatch = useGame(s => s.dispatch), error = useGame(s => s.error);
    const [review, setReview] = useState<{
        command: GameCommand;
        event: EventPresentation;
    } | null>(null);
    const ask = (command: GameCommand, title: string, body: string, terms: EffectRow[] = []) => { if (!busy)
        setReview({ command, event: { id: 'lifestyle-review-' + command.type, kind: 'confirmation', title, body, terms, confirmLabel: 'Confirm' } }); };
    const modal = review ? <EventModal event={review.event} busy={busy} error={error} onCancel={() => { if (!busy)
        setReview(null); }} onChoose={async () => { if (!busy && await dispatch(review.command))
        setReview(null); }}/> : null;
    return { ask, modal, busy };
}
