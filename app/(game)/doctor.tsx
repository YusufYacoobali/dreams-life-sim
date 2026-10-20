import React from 'react';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { ageOn, fullName } from '../../src/game/model';
import { countries } from '../../src/game/countries';
import { consultationCost, HealthCommand, medicalQuote } from '../../src/game/systems/health';
import { rules } from '../../src/game/rules';
import { formatMoney } from '../../src/game/money';
import { ActionRow, Body, Card, Header, Heading, Page, Portrait } from '../../src/ui/components';
import { HealthLegalArt } from '../../src/assets/HealthLegalArt';
import { HealthReviewError, healthReviewReason, useHealthReview } from '../../src/ui/HealthReview';
import { isConfined } from '../../src/game/systems/legalSchemas';
export default function Doctor() {
  const world = useGame(s => s.world)!, busy = useGame(s => s.busy), error = useGame(s => s.error), review = useHealthReview();
  const person = world.people[world.activePersonId], provider = person.health.providerId && world.people[person.health.providerId], currency = countries[person.country].currency;
  const confirm = (command: Extract<HealthCommand, { type: 'consult' | 'fertility-care' | 'cosmetic-care' }>, title: string, cost: bigint) => { if (healthReviewReason(world, command)) return; const quote = medicalQuote(world, cost); review.confirm(command, title, quote.payer.id === person.id ? 'Your available balance pays for the visit. Findings and any response are recorded before you see the result.' : quote.payer.firstName + ' pays for this visit from their actual balance.', [{ id: 'cost', label: 'Patient fee', value: formatMoney({ minor: cost, currency }), tone: 'neutral' }, { id: 'payer', label: 'Payer', value: fullName(quote.payer), tone: 'neutral' }], 'doctor', 'Confirm Visit'); };
  const services = [{ id: 'checkup', title: 'General Check-up', subtitle: 'Review your general health' }, { id: 'symptoms', title: 'Discuss a Symptom', subtitle: 'Talk about symptoms you have noticed' }, { id: 'tests', title: 'Request Tests', subtitle: 'A more thorough assessment' }, { id: 'specialist', title: 'Specialist Referral', subtitle: 'Detailed assessment of persistent concerns' }] as const;
  return <Page><Header title="Doctor Visit" onBack={() => router.back()} /><Card>{provider && !provider.died ? <><Portrait name={fullName(provider)} appearance={provider.appearance} age={ageOn(provider, world.date)} size={80} /><Heading size={20}>Dr {provider.lastName}</Heading><Body>Medical practitioner · {provider.city}</Body></> : <><HealthLegalArt id="doctor" size={80} /><Heading size={20}>Local clinic</Heading><Body muted>A clinician is assigned when you book a visit. Your clinical records keep their actual identity.</Body></>}</Card>
    {!review.isOpen && <HealthReviewError error={error} />}<Card>{services.map(service => <ActionRow key={service.id} title={service.title} subtitle={service.subtitle} value={formatMoney({ minor: consultationCost(world, service.id), currency })} disabled={busy} disabledReason={healthReviewReason(world, { type: 'consult', service: service.id })} icon={<HealthLegalArt id="doctor" size={36} />} onPress={() => confirm({ type: 'consult', service: service.id }, service.title + '?', consultationCost(world, service.id))} />)}<ActionRow title="Get Treatment" subtitle="View diagnosed conditions and care options" icon={<HealthLegalArt id="medicine" size={36} />} onPress={() => router.push('/conditions')} /></Card>
    {ageOn(person, world.date) >= 18 && !isConfined(world) && <Card><ActionRow title="Fertility Care" subtitle="Support existing reproductive capacity" icon={<HealthLegalArt id="care" size={36} />} disabled={busy} disabledReason={healthReviewReason(world, { type: 'fertility-care' })} onPress={() => confirm({ type: 'fertility-care' }, 'Review fertility care?', rules[person.country].doctorVisit * 5n)} /><ActionRow title="Elective Appearance Care" subtitle="A paid procedure with uncertain results" icon={<HealthLegalArt id="care" size={36} />} disabled={busy} disabledReason={healthReviewReason(world, { type: 'cosmetic-care' })} onPress={() => confirm({ type: 'cosmetic-care' }, 'Review elective care?', rules[person.country].baseWage / 20n)} /></Card>}
    <Card><Heading size={18}>Visit history</Heading>{person.health.records.length === 0 && <Body muted>No clinical visits recorded.</Body>}{person.health.records.slice(-12).reverse().map(item => <React.Fragment key={item.id}><Body>{item.text}</Body><Body muted>{item.date.year}-{String(item.date.month).padStart(2, '0')} · {formatMoney({ minor: item.cost, currency: item.currency })}</Body></React.Fragment>)}</Card>
    {review.modal}
  </Page>;
}
