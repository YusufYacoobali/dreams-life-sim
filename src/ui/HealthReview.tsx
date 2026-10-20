import React, { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';
import { ageOn, type World } from '../game/model';
import type { HealthCommand } from '../game/systems/health';
import { hospitalized } from '../game/systems/healthSchemas';
import { custodyReason } from '../game/systems/legal';
import { activeTrip } from '../game/systems/travelSchemas';
import { serviceAway } from '../game/systems/serviceSchemas';
import { useGame } from '../state/useGame';
import { HealthLegalArt, type HealthLegalArtId } from '../assets/HealthLegalArt';
import { EventModal, type EffectRow, type EventPresentation } from './EventModal';
import { useColors } from './theme';

type ReviewedHealthCommand = Extract<HealthCommand, { type: 'consult' | 'vaccinate' | 'treat' | 'stop-treatment' | 'fertility-care' | 'cosmetic-care' }>;
type HealthReviewCommand = ReviewedHealthCommand | Extract<HealthCommand, { type: 'exercise' }>;

/** Existing command restrictions only; opening a review neither books nor pays. */
export function healthReviewReason(world: World, command: ReviewedHealthCommand): string | undefined {
  const person = world.people[world.activePersonId];
  const inPerson = ['consult', 'vaccinate', 'fertility-care', 'cosmetic-care'].includes(command.type);
  if (inPerson && serviceAway(world)) return 'Return from your assignment before this in-person activity';
  if ((inPerson || command.type === 'treat') && activeTrip(world)) return 'Return from your trip before this activity at home';
  const custody = custodyReason(world, command.type); if (custody) return custody;
  const tried = (key: string) => world.actionCounts[person.id + ':health:' + world.date.year + ':' + key] ? 'You have already tried this this year' : undefined;
  if (command.type === 'vaccinate') {
    if (person.health.vaccinations.some(item => item.id === command.vaccine && item.expiresMonth > world.date.year * 12 + world.date.month - 1)) return 'This protection is still current';
    return tried('vaccinate:' + command.vaccine);
  }
  if (command.type === 'consult') return tried('consult:' + command.service);
  if (command.type === 'treat' || command.type === 'stop-treatment') {
    const condition = person.health.conditions.find(item => item.id === command.conditionId && item.status !== 'recovered' && item.diagnosed);
    if (!condition) return 'Choose an active diagnosed condition';
    if (command.type === 'stop-treatment') return condition.treatment ? undefined : 'No treatment is active';
    return condition.treatment ? 'Treatment is already active' : tried('treat:' + condition.id);
  }
  if (ageOn(person, world.date) < 18 || hospitalized(world, person)) return 'This elective care is available to adults outside hospital';
  if (command.type === 'fertility-care' && person.biology.role === 'neither') return 'This care cannot change reproductive capacity';
  return tried(command.type);
}

export function HealthReviewError({ error }: { error: string | null }) {
  const colors = useColors();
  return error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: colors.red, fontSize: 15, lineHeight: 22 }}>{error}</Text> : null;
}

export function useHealthReview(context = '') {
  const dispatch = useGame(s => s.dispatch), busy = useGame(s => s.busy), error = useGame(s => s.error);
  const identity = useGame(s => s.world ? JSON.stringify([s.world.id, s.world.activePersonId, context]) : 'none');
  const identityRef = useRef(identity), submitting = useRef(false); identityRef.current = identity;
  const [review, setReview] = useState<{ identity: string; command: HealthReviewCommand; event: EventPresentation } | null>(null);
  useEffect(() => { setReview(saved => saved && saved.identity !== identity ? null : saved); }, [identity]);
  const current = review?.identity === identity ? review : null;
  return {
    isOpen: !!current,
    confirm(command: HealthReviewCommand, title: string, body: string, terms: EffectRow[] = [], art: HealthLegalArtId = 'care', confirmLabel = 'Confirm') {
      if (busy || submitting.current) return;
      setReview({ identity, command, event: { kind: 'confirmation', id: identity + ':' + command.type, title, body, terms, confirmLabel, illustration: <HealthLegalArt id={art} size={64} /> } });
    },
    modal: <EventModal event={current?.event ?? null} busy={busy} error={error} onCancel={() => { if (!busy && !submitting.current) setReview(null); }} onChoose={async () => {
      if (!current || busy || submitting.current || identityRef.current !== current.identity) return;
      submitting.current = true;
      try {
        if (await dispatch(current.command) && identityRef.current === current.identity) setReview(saved => saved === current ? null : saved);
      } finally { submitting.current = false; }
    }} />,
  };
}
