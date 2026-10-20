import React, { useEffect, useState } from 'react';
import { CareerCommand } from '../game/systems/careers';
import { MusicCommand } from '../game/systems/music';
import { RoyaltyCommand } from '../game/systems/royalty';
import { ServiceCommand } from '../game/systems/services';
import { CreatorCommand } from '../game/systems/creators';
import { PoliticsCommand } from '../game/systems/politics';
import { useGame } from '../state/useGame';
import { CareerArt, CareerArtId } from '../assets/CareerArt';
import { EffectRow, EventModal, EventPresentation } from './EventModal';

type CareerAction = CareerCommand | MusicCommand | PoliticsCommand | CreatorCommand | ServiceCommand | RoyaltyCommand;
type Review = { identity: string; command: CareerAction; event: EventPresentation };

export function useCareerReview(context = '') {
    const dispatch = useGame(s => s.dispatch), busy = useGame(s => s.busy), error = useGame(s => s.error);
    const person = useGame(s => s.world ? s.world.id + ':' + s.world.activePersonId : 'none'), identity = person + ':' + context;
    const [review, setReview] = useState<Review | null>(null), current = review?.identity === identity ? review : null;
    useEffect(() => { setReview(null); }, [identity]);
    return {
        reviewing: !!current,
        confirm(command: CareerAction, title: string, body: string, terms: EffectRow[] = [], art: CareerArtId = 'stage', label = 'Confirm') {
            if (busy) return;
            setReview({ identity, command, event: { kind: 'confirmation', id: command.type, title, body, terms, illustration: <CareerArt id={art} size={64} />, confirmLabel: label } });
        },
        modal: <EventModal event={current?.event ?? null} busy={busy} error={error} onCancel={() => { if (!busy) setReview(null); }} onChoose={async () => {
            if (busy || !current) return;
            if (await dispatch(current.command)) setReview(value => value === current ? null : value);
        }} />,
    };
}
