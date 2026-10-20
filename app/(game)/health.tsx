import React, { useState } from 'react';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { ActionRow, Body, Card, Header, Page, StatBar } from '../../src/ui/components';
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

export default function Health() {
  const world = useGame(s => s.world)!;
  return <HealthContent key={JSON.stringify([world.id, world.activePersonId])} world={world} />;
}
function HealthContent({ world }: { world: World }) {
  const person = world.people[world.activePersonId], stats = person.stats;
  const busy = useGame(s => s.busy), error = useGame(s => s.error), review = useHealthReview();
  const [choosing, setChoosing] = useState(false);
  const c = useColors();
  const cost = isConfined(world, person) ? 0n : rules[person.country].doctorVisit / 2n, quote = medicalQuote(world, cost);
  const vaccines = [{ id: 'routine', label: 'Routine protection · 10 years' }, { id: 'seasonal', label: 'Seasonal flu protection · 12 months' }] as const;
  const choices = vaccines.map(item => ({ ...item, disabledReason: healthReviewReason(world, { type: 'vaccinate', vaccine: item.id }) }));
  const unavailable = choices.every(item => item.disabledReason) ? choices[0].disabledReason === choices[1].disabledReason ? choices[0].disabledReason : 'Both protections are unavailable' : undefined;
  const event: EventPresentation | null = choosing ? { id: 'vaccine-choose', kind: 'selection', title: 'Vaccinations', body: 'Protection is recorded for a fixed period. It reduces the relevant infection risk and does not cure a current condition.', choices, confirmLabel: 'Review' } : null;
  return <Page><Header title="Health" onBack={() => router.back()} />
    <Card><HealthLegalArt id="care" size={64} />
      <StatBar label="Health" value={stats.health} color={c.green} />
      <StatBar label="Energy" value={stats.energy} color={c.blue} />
      <StatBar label="Fitness" value={stats.fitness} color={c.teal} />
      <StatBar label="Stress" value={stats.stress} color={c.red} />
      {hospitalized(world, person) && <Body>In hospital · study is paused and employment pays at the hospital-leave rate.</Body>}
    </Card>
    {!review.isOpen && !choosing && <HealthReviewError error={error} />}<Card>
      <ActionRow title="Doctor" subtitle="Check-ups, symptoms, tests and referral" icon={<HealthLegalArt id="doctor" size={40} />} onPress={() => router.push('/doctor')} />
      <ActionRow title="Medical Conditions" subtitle="Current conditions and recovery history" icon={<HealthLegalArt id="care" size={40} />} onPress={() => router.push('/conditions')} />
      <ActionRow title="Treatments" subtitle="Diagnosed conditions and ongoing care" icon={<HealthLegalArt id="medicine" size={40} />} onPress={() => router.push('/conditions')} />
      <ActionRow title="Vaccinations" subtitle="Dated routine and seasonal protection" icon={<HealthLegalArt id="medicine" size={40} />} disabled={busy} disabledReason={unavailable} onPress={() => { if (!busy && !unavailable) setChoosing(true); }} />
      <ActionRow title="Mind & Body" subtitle="Diet, sleep, exercise and wellbeing" icon={<HealthLegalArt id="meditation" size={40} />} onPress={() => router.push('/lifestyle')} />
    </Card>
    {person.health.vaccinations.length > 0 && <Card>{person.health.vaccinations.map(item => <Body key={item.id}>{item.id === 'routine' ? 'Routine protection' : 'Seasonal flu protection'} · {item.expiresMonth > world.date.year * 12 + world.date.month - 1 ? 'Current until ' + Math.floor(item.expiresMonth / 12) + '-' + String(item.expiresMonth % 12 + 1).padStart(2, '0') : 'Expired'}</Body>)}</Card>}
    <EventModal event={event} busy={busy} error={error} onCancel={() => { if (!busy) setChoosing(false); }} onChoose={id => {
      const vaccine = choices.find(item => item.id === id); if (busy || !vaccine || vaccine.disabledReason) return;
      review.confirm({ type: 'vaccinate', vaccine: vaccine.id }, 'Receive this vaccination?', quote.payer.id === person.id ? 'The fee is paid from your available balance.' : quote.payer.firstName + ' will pay for your care.', [{ id: 'protection', label: 'Protection', value: vaccine.label, tone: 'neutral' }, { id: 'cost', label: 'Patient fee', value: formatMoney({ minor: cost, currency: countries[person.country].currency }), tone: 'neutral' }], 'care', 'Receive Vaccination');
      setChoosing(false);
    }} />{review.modal}
  </Page>;
}
