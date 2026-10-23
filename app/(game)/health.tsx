import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { ActionRow, Body, Card, Header, Heading, Page, StatBar } from '../../src/ui/components';
import { useColors } from '../../src/ui/theme';
import { HealthLegalArt } from '../../src/assets/HealthLegalArt';
import { EventModal, EventPresentation } from '../../src/ui/EventModal';
import { rules } from '../../src/game/rules';
import { countries } from '../../src/game/countries';
import { formatMoney } from '../../src/game/money';
import { hospitalized, medicalQuote } from '../../src/game/systems/health';
import { isConfined } from '../../src/game/systems/legalSchemas';
import { HealthReviewError, healthReviewReason, useHealthReview } from '../../src/ui/HealthReview';
import type { World } from '../../src/game/model';
import { DisplayText as Text } from '../../src/ui/DisplayText';

export default function Health() {
  const world = useGame(s => s.world)!;
  return <HealthContent key={JSON.stringify([world.id, world.activePersonId])} world={world} />;
}
function HealthContent({ world }: { world: World }) {
  const person = world.people[world.activePersonId], stats = person.stats;
  const busy = useGame(s => s.busy), error = useGame(s => s.error), review = useHealthReview();
  const [choosing, setChoosing] = useState(false);
  const c = useColors(), current = person.health.conditions.filter(item => item.status !== 'recovered');
  const careCount = current.filter(item => !!item.treatment).length;
  const cost = isConfined(world, person) ? 0n : rules[person.country].doctorVisit / 2n, quote = medicalQuote(world, cost);
  const vaccines = [{ id: 'routine', label: 'Routine protection · 10 years' }, { id: 'seasonal', label: 'Seasonal flu protection · 12 months' }] as const;
  const choices = vaccines.map(item => ({ ...item, disabledReason: healthReviewReason(world, { type: 'vaccinate', vaccine: item.id }) }));
  const unavailable = choices.every(item => item.disabledReason) ? choices[0].disabledReason === choices[1].disabledReason ? choices[0].disabledReason : 'Both protections are unavailable' : undefined;
  const event: EventPresentation | null = choosing ? { id: 'vaccine-choose', kind: 'selection', title: 'Vaccinations', body: 'Protection lasts for the stated period. It lowers infection risk and cannot cure an existing condition.', choices, confirmLabel: 'Review' } : null;
  return <Page><Header title="Health" onBack={() => router.back()} />
    <Card><View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}><HealthLegalArt id="care" size={72} /><View style={{ flexGrow: 1, flexBasis: 170, minWidth: 0, gap: 5 }}><Heading size={22}>Your health today</Heading><Body muted>Recorded {world.date.year}-{String(world.date.month).padStart(2, '0')}. Assessment, treatment and recovery each have their own history.</Body></View></View>
      <StatBar label="Health" value={stats.health} color={c.green} />
      <StatBar label="Energy" value={stats.energy} color={c.blue} />
      <StatBar label="Fitness" value={stats.fitness} color={c.teal} />
      <StatBar label="Stress" value={stats.stress} color={c.red} />
      <View style={{ backgroundColor: c.inset, borderRadius: 12, padding: 12, gap: 6 }}><Text style={{ color: c.ink, fontSize: 16, fontWeight: '600' }}>{current.length} current health {current.length === 1 ? 'concern' : 'concerns'} recorded</Text><Body muted>{careCount} ongoing care {careCount === 1 ? 'programme' : 'programmes'}. Symptoms without a diagnosis remain unnamed until assessed.</Body></View>{hospitalized(world, person) && <View style={{ backgroundColor: c.inset, borderRadius: 12, padding: 12, gap: 5 }}><Heading size={17}>Current hospital stay</Heading><Body>Study is paused and employment pays at the hospital-leave rate.</Body></View>}
    </Card>
    {!review.isOpen && !choosing && <HealthReviewError error={error} />}<Card><Heading size={20}>Care & prevention</Heading>
      <ActionRow title="Doctor" subtitle="Check-ups, symptoms, tests and referral" icon={<HealthLegalArt id="doctor" size={40} />} onPress={() => router.push('/doctor')} />
      <ActionRow title="Medical Conditions" subtitle="Current conditions and recovery history" icon={<HealthLegalArt id="care" size={40} />} onPress={() => router.push('/conditions')} />
      <ActionRow title="Treatments" subtitle="Diagnosed conditions and ongoing care" icon={<HealthLegalArt id="medicine" size={40} />} onPress={() => router.push('/conditions')} />
      <ActionRow title="Vaccinations" subtitle={'Routine and seasonal protection · Patient fee ' + formatMoney({ minor: cost, currency: countries[person.country].currency })} icon={<HealthLegalArt id="medicine" size={40} />} disabled={busy} disabledReason={unavailable} onPress={() => { if (!busy && !unavailable) setChoosing(true); }} />
      <ActionRow title="Mind & Body" subtitle="Diet, sleep, exercise and wellbeing" icon={<HealthLegalArt id="meditation" size={40} />} onPress={() => router.push('/lifestyle')} />
    </Card>
    <Card><Heading size={20}>Vaccination record</Heading>{!person.health.vaccinations.length && <Body muted>No vaccinations are recorded. Available protection can be reviewed above.</Body>}{person.health.vaccinations.map(item => <View key={item.id} style={{ backgroundColor: c.inset, borderRadius: 12, padding: 12, gap: 5 }}><Text style={{ color: c.ink, fontWeight: '600', fontSize: 16 }}>{item.id === 'routine' ? 'Routine protection' : 'Seasonal flu protection'}</Text><Body muted>Received {item.date.year}-{String(item.date.month).padStart(2, '0')}</Body><Body>{item.expiresMonth > world.date.year * 12 + world.date.month - 1 ? 'Current until ' + Math.floor(item.expiresMonth / 12) + '-' + String(item.expiresMonth % 12 + 1).padStart(2, '0') : 'Recorded protection has expired'}</Body></View>)}</Card>
    <EventModal event={event} busy={busy} error={error} onCancel={() => { if (!busy) setChoosing(false); }} onChoose={id => {
      const vaccine = choices.find(item => item.id === id); if (busy || !vaccine || vaccine.disabledReason) return;
      review.confirm({ type: 'vaccinate', vaccine: vaccine.id }, 'Receive this vaccination?', quote.payer.id === person.id ? 'The fee is paid from your available balance.' : quote.payer.firstName + ' will pay for your care.', [{ id: 'protection', label: 'Protection', value: vaccine.label, tone: 'neutral' }, { id: 'cost', label: 'Patient fee', value: formatMoney({ minor: cost, currency: countries[person.country].currency }), tone: 'neutral' }], 'care', 'Receive Vaccination');
      setChoosing(false);
    }} />{review.modal}
  </Page>;
}
