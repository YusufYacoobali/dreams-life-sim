import React, { useEffect, useRef, useState } from 'react';
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
    const mounted = useRef(true), submitting = useRef(false), identityRef = useRef(identity), reviewRef = useRef<Review | null>(null);
    identityRef.current = identity;
    if (reviewRef.current?.identity !== identity) reviewRef.current = null;
    const [review, setReview] = useState<Review | null>(null), current = review === reviewRef.current && review?.identity === identity ? review : null;
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; reviewRef.current = null; }; }, []);
    useEffect(() => { setReview(saved => saved?.identity === identity ? saved : null); }, [identity]);
    const isCurrent = (value: Review) => mounted.current && identityRef.current === value.identity && reviewRef.current === value;
    return {
        reviewing: !!current,
        confirm(command: CareerAction, title: string, body: string, terms: EffectRow[] = [], art: CareerArtId = 'stage', label = 'Confirm') {
            if (!mounted.current || busy || submitting.current || identityRef.current !== identity) return;
            const next: Review = { identity, command, event: { kind: 'confirmation', id: command.type, title, body, terms, illustration: <CareerArt id={art} size={64} />, confirmLabel: label } };
            reviewRef.current = next; setReview(next);
        },
        modal: <EventModal event={current?.event ?? null} busy={busy} error={error} onCancel={() => {
            if (busy || submitting.current || !current || !isCurrent(current)) return;
            reviewRef.current = null; setReview(null);
        }} onChoose={async () => {
            if (busy || submitting.current || !current || !isCurrent(current)) return;
            submitting.current = true;
            try {
                if (await dispatch(current.command) && isCurrent(current)) { reviewRef.current = null; setReview(value => value === current ? null : value); }
            } finally { submitting.current = false; }
        }} />,
    };
}
