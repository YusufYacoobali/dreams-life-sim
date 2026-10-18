import React, { useState } from 'react';
import { CareerCommand } from '../game/systems/careers';
import { MusicCommand } from '../game/systems/music';
import { PoliticsCommand } from '../game/systems/politics';
import { useGame } from '../state/useGame';
import { CareerArt, CareerArtId } from '../assets/CareerArt';
import { EffectRow, EventModal, EventPresentation } from './EventModal';
export function useCareerReview() { const dispatch = useGame(s => s.dispatch), busy = useGame(s => s.busy), [review, setReview] = useState<{
    command: CareerCommand | MusicCommand | PoliticsCommand;
    event: EventPresentation;
} | null>(null); return { confirm(command: CareerCommand | MusicCommand | PoliticsCommand, title: string, body: string, terms: EffectRow[] = [], art: CareerArtId = 'stage', label = 'Confirm') { setReview({ command, event: { kind: 'confirmation', id: command.type, title, body, terms, illustration: <CareerArt id={art} size={64}/>, confirmLabel: label } }); }, modal: <EventModal event={review?.event ?? null} busy={busy} onCancel={() => setReview(null)} onChoose={() => { if (review) {
        const command = review.command;
        setReview(null);
        void dispatch(command);
    } }}/> }; }
