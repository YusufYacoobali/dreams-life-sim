import React, { useState } from 'react';
import { outingContent, outingKinds, type OutingKind } from '../game/content/leisure';
import { leisurePayer } from '../game/systems/leisure';
import { localContactReason, lifestyleReason } from '../game/systems/lifestyleCommon';
import { parentOf } from '../game/systems/travel';
import { ageOn } from '../game/personHelpers';
import { rules } from '../game/rules';
import { countries } from '../game/countries';
import { formatMoney } from '../game/money';
import { fullName } from '../game/personHelpers';
import { ActionRow, Card, Heading } from './components';
import { useLifestyleReview } from './LifestyleReview';
import { useLifestyleWorld } from './useLifestyleWorld';
import { PersonPicker } from './PersonPicker';
import { EventModal } from './EventModal';
import { PetsLeisureArt } from '../assets/PetsLeisureArt';

export function SharedLeisure() {
  const world = useLifestyleWorld()!, { ask, modal, busy } = useLifestyleReview('shared-outing');
  const [kind, setKind] = useState<OutingKind>('park'), [step, setStep] = useState<'venue' | 'person' | null>(null);
  const person = world.people[world.activePersonId], payer = leisurePayer(world), venue = outingContent[kind];
  if (!world.lifestyle) return null;
  const money = (minor: bigint) => formatMoney({ minor, currency: countries[person.country].currency });
  const reasonFor = (id: string) => {
    const contact = world.people[id], base = lifestyleReason(world, false) ?? localContactReason(world, id, true);
    if (base) return base;
    if (!payer) return 'An available parent must accompany you';
    if (ageOn(person, world.date) < venue.minAge || ageOn(contact, world.date) < venue.minAge) return 'Both guests must meet the venue’s age requirement';
    if (ageOn(contact, world.date) < 18 && (!parentOf(world, person.id, id) || person.householdId !== contact.householdId)) return 'Children attend with their co-resident parent';
    if (person.stats.energy < venue.energy || contact.stats.health < 25) return 'Rest and recover before this outing';
  };
  return <Card><Heading size={18}>Go with Someone</Heading><ActionRow title="Invite a Friend or Family Member" onPress={() => setStep('venue')} />
    <EventModal event={step === 'venue' ? { id: 'shared-outing-venue', kind: 'selection', title: 'Choose an Outing', body: 'Where would you like to go together?', choices: outingKinds.map(id => ({ id, label: outingContent[id].name })), confirmLabel: 'Choose Venue' } : null} busy={busy} onCancel={() => setStep(null)} onChoose={id => { if (outingKinds.includes(id as OutingKind)) { setKind(id as OutingKind); setStep('person'); } }} />
    {step === 'person' && <PersonPicker world={world} title="Invite Someone Along" personIds={world.relationships.filter(edge => edge.from === person.id || edge.to === person.id).map(edge => edge.from === person.id ? edge.to : edge.from)} busy={busy} eligibility={reasonFor} onCancel={() => setStep(null)} onChoose={id => {
      if (!payer || reasonFor(id)) return;
      const participants = new Set([person.id, id, payer.id]), fee = rules[person.country].baseWage * BigInt(venue.feeBps) / 10000n * BigInt(participants.size);
      setStep(null);
      ask({ type: 'shared-leisure-outing', kind, contactId: id, reviewedPayerId: payer.id, quotedFee: fee }, 'Invite ' + fullName(world.people[id]) + '?', 'Go to ' + venue.name.toLowerCase() + ' together. Everyone must agree; a refusal costs nothing.', [{ id: 'tickets', label: 'Tickets', value: String(participants.size), tone: 'neutral' }, { id: 'fee', label: 'Cost if agreed', value: money(fee), tone: 'negative' }, { id: 'payer', label: 'Paid by', value: fullName(payer), tone: 'neutral' }], ['cinema', 'concert', 'museum', 'nightclub'].includes(kind) ? <PetsLeisureArt id={kind as 'cinema' | 'concert' | 'museum' | 'nightclub'} size={64} /> : undefined);
    }} />}{modal}
  </Card>;
}
