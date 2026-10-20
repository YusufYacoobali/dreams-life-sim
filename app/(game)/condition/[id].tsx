import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useGame } from '../../../src/state/useGame';
import { conditions } from '../../../src/game/content/health';
import { medicalQuote, treatmentCost } from '../../../src/game/systems/health';
import { isConfined } from '../../../src/game/systems/legalSchemas';
import { countries } from '../../../src/game/countries';
import { rules } from '../../../src/game/rules';
import { formatMoney } from '../../../src/game/money';
import { Body, Button, Card, Header, Heading, Page, StatBar } from '../../../src/ui/components';
import { HealthReviewError, healthReviewReason, useHealthReview } from '../../../src/ui/HealthReview';
import { HealthLegalArt } from '../../../src/assets/HealthLegalArt';
import { useColors } from '../../../src/ui/theme';
export default function ConditionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>(); const world = useGame(s => s.world)!, busy = useGame(s => s.busy), error = useGame(s => s.error), c = useColors(), review = useHealthReview(id);
  const person = world.people[world.activePersonId], condition = person.health.conditions.find(item => item.id === id);
  const cost = condition ? treatmentCost(world, condition) : 0n, currency = countries[person.country].currency, quote = medicalQuote(world, cost);
  const monthlyCost = isConfined(world, person) ? 0n : rules[person.country].doctorVisit / 6n;
  const startReason = healthReviewReason(world, { type: 'treat', conditionId: id });
  const confirm = (start: boolean) => {
    const command = { type: start ? 'treat' as const : 'stop-treatment' as const, conditionId: id };
    if (healthReviewReason(world, command)) return;
    review.confirm(command, start ? 'Begin this care programme?' : 'Stop this treatment?', start ? quote.payer.firstName + ' pays the initial fee. Ongoing care is billed monthly and pauses if funding is unavailable. Improvement takes time.' : 'Future programme costs stop. The condition remains in your record and can worsen without care.', start ? [{ id: 'cost', label: 'Initial fee', value: formatMoney({ minor: cost, currency }), tone: 'neutral' }, { id: 'ongoing', label: 'Monthly fee', value: formatMoney({ minor: monthlyCost, currency }), tone: 'neutral' }] : [], 'medicine', start ? 'Begin Treatment' : 'Stop Treatment');
  };
  return <Page><Header title="Condition & Care" onBack={() => router.back()} />{condition ? <><Card><HealthLegalArt id="medicine" size={80} /><Heading>{condition.diagnosed ? conditions[condition.type].name : 'Undiagnosed symptoms'}</Heading><Body>{conditions[condition.type].symptoms}</Body><Body>Noticed {condition.onset.year}-{String(condition.onset.month).padStart(2, '0')} · {condition.months} months recorded</Body><Body>{condition.status === 'recovered' ? 'Resolved' : condition.status === 'controlled' ? 'Controlled with ongoing care' : 'Active'}</Body>{condition.diagnosed && <StatBar label="Severity" value={condition.severity} color={c.red} />}</Card>
      {condition.status !== 'recovered' && <Card>{condition.diagnosed ? <><Heading size={18}>{conditions[condition.type].treatment[0].toUpperCase() + conditions[condition.type].treatment.slice(1)} programme</Heading><Body>Care progresses as months pass. It may help, have a limited effect, or cause a side effect that needs review.</Body>{condition.treatment ? <><Body>Started {condition.treatment.started.year}-{String(condition.treatment.started.month).padStart(2, '0')} · {condition.treatment.months} months</Body><Body>Programme payments: {formatMoney({ minor: condition.treatment.paid, currency: condition.treatment.currency })}</Body><Button label="Review Stopping Treatment" tone="secondary" disabled={busy} onPress={() => confirm(false)} /></> : <><Body>Initial fee: {formatMoney({ minor: cost, currency })}</Body><Body>Ongoing monthly fee: {formatMoney({ minor: monthlyCost, currency })}</Body><Button label="Review Treatment" disabled={busy || !!startReason} accessibilityLabel={['Review Treatment', startReason].filter(Boolean).join('. ')} onPress={() => confirm(true)} />{startReason && <Body muted>{startReason}</Body>}</>}</> : <><Body>Assessment is needed before a treatment programme can begin.</Body><Button label="Get an Assessment" onPress={() => router.push('/doctor')} /></>}</Card>}
      {!review.isOpen && <HealthReviewError error={error} />}<Card><Heading size={18}>Care history</Heading>{person.health.records.filter(item => item.conditionId === id).map(item => <React.Fragment key={item.id}><Body>{item.text}</Body><Body muted>{item.date.year}-{String(item.date.month).padStart(2, '0')} · {formatMoney({ minor: item.cost, currency: item.currency })}</Body></React.Fragment>)}</Card>
      {review.modal}
    </> : <Body>This condition is unavailable.</Body>}</Page>;
}
