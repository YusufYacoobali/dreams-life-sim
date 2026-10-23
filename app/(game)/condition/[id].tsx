import React from 'react';
import { View } from 'react-native';
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
import type { GameDate } from '../../../src/game/calendar';
import { fullName } from '../../../src/game/model';
import { DisplayText as Text, displayText } from '../../../src/ui/DisplayText';

const dateLabel = (date: GameDate) => date.year + '-' + String(date.month).padStart(2, '0') + '-' + String(date.day).padStart(2, '0');
const careLabels = { support: 'Supportive care', rehabilitation: 'Rehabilitation', medication: 'Medication', therapy: 'Therapy', specialist: 'Specialist care', rehab: 'Recovery support' } as const;
export default function ConditionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>(); const world = useGame(s => s.world)!, busy = useGame(s => s.busy), error = useGame(s => s.error), c = useColors(), review = useHealthReview(id);
  const person = world.people[world.activePersonId], condition = person.health.conditions.find(item => item.id === id);
  const cost = condition ? treatmentCost(world, condition) : 0n, currency = countries[person.country].currency, quote = medicalQuote(world, cost);
  const monthlyCost = isConfined(world, person) ? 0n : rules[person.country].doctorVisit / 6n;
  const startReason = healthReviewReason(world, { type: 'treat', conditionId: id });
  const history = person.health.records.filter(item => item.conditionId === id);
  const method = condition?.diagnosed ? condition.treatment?.method ?? conditions[condition.type].treatment : null;
  const confirm = (start: boolean) => {
    const command = { type: start ? 'treat' as const : 'stop-treatment' as const, conditionId: id };
    if (healthReviewReason(world, command)) return;
    review.confirm(command, start ? 'Begin this care programme?' : 'Stop this treatment?', start ? quote.payer.firstName + ' pays the initial fee. Care continues monthly while funded; improvement takes time.' : 'Future programme costs stop. The condition remains in your record and can worsen without care.', start ? [{ id: 'cost', label: 'Initial fee', value: formatMoney({ minor: cost, currency }), tone: 'neutral' }, { id: 'ongoing', label: 'Monthly fee', value: formatMoney({ minor: monthlyCost, currency }), tone: 'neutral' }] : [], 'medicine', start ? 'Begin Treatment' : 'Stop Treatment');
  };
  return <Page><Header title="Condition & Care" onBack={() => router.back()} />{condition ? <>
    <Card>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
        <HealthLegalArt id={method === 'therapy' || method === 'rehab' ? 'meditation' : 'medicine'} size={76} />
        <View style={{ flexGrow: 1, flexBasis: 170, minWidth: 0, gap: 5 }}>
          <Body muted>{condition.diagnosed ? 'Recorded diagnosis' : condition.status === 'recovered' ? 'Past symptoms' : 'Assessment not recorded'}</Body>
          <Heading>{condition.diagnosed ? conditions[condition.type].name : condition.status === 'recovered' ? 'Resolved symptoms' : 'Undiagnosed symptoms'}</Heading>
        </View>
      </View>
      <Body>{conditions[condition.type].symptoms}</Body>
      <View style={{ backgroundColor: c.inset, borderRadius: 12, padding: 12, gap: 6 }}>
        <Text style={{ color: c.ink, fontSize: 16, fontWeight: '600' }}>{condition.status === 'recovered' ? 'Resolved' : condition.status === 'controlled' ? 'Controlled with ongoing care' : 'Active'}</Text>
        <Body muted>First noticed: {dateLabel(condition.onset)}</Body>
        {condition.diagnosed && <Body muted>First diagnosis: {dateLabel(condition.diagnosed)}</Body>}
        {condition.resolved && <Body muted>Resolution recorded: {dateLabel(condition.resolved)}</Body>}
        <Body muted>{condition.months} recorded months</Body>
      </View>
      {condition.diagnosed && <StatBar label="Severity" value={condition.severity} color={c.red} />}
    </Card>
    {condition.status !== 'recovered' && <Card>{condition.diagnosed && method ? <>
      <Heading size={20}>{careLabels[method]} programme</Heading>
      <Body>Care progresses as months pass. It may help, have a limited effect, or cause a side effect that needs review.</Body>
      {condition.treatment ? <>
        <View style={{ backgroundColor: c.inset, borderRadius: 12, padding: 12, gap: 6 }}>
          <Text style={{ color: c.ink, fontSize: 16, fontWeight: '600' }}>Programme in progress</Text>
          <Body>Started {dateLabel(condition.treatment.started)}</Body>
          <Body muted>{condition.treatment.months} recorded programme months</Body>
          <Body>Programme payments: {formatMoney({ minor: condition.treatment.paid, currency: condition.treatment.currency })}</Body>
          <Body muted>Current monthly fee: {formatMoney({ minor: monthlyCost, currency })}</Body>
        </View>
        <Body muted>Stopping ends future programme charges.</Body>
        <Button label="Review Stopping Treatment" tone="secondary" disabled={busy} onPress={() => confirm(false)} />
      </> : <>
        <View style={{ backgroundColor: c.inset, borderRadius: 12, padding: 12, gap: 6 }}>
          <Body>Initial fee: {formatMoney({ minor: cost, currency })}</Body>
          <Body>Ongoing monthly fee: {formatMoney({ minor: monthlyCost, currency })}</Body>
          <Body muted>Initial payer: {fullName(quote.payer)}</Body>
        </View>
        <Body muted>Pay monthly while care continues. Unpaid fees pause treatment; recovery takes time.</Body>
        <Button label="Review Treatment" disabled={busy || !!startReason} accessibilityLabel={displayText(['Review Treatment', startReason].filter(Boolean).join('. '))} onPress={() => confirm(true)} />
        {startReason && <Body muted>{startReason}</Body>}
      </>}
    </> : <>
      <Heading size={20}>Assessment first</Heading>
      <Body>See a clinician for a diagnosis before starting treatment.</Body>
      <Button label="Get an Assessment" onPress={() => router.push('/doctor')} />
    </>}</Card>}
    {!review.isOpen && <HealthReviewError error={error} />}
    <Card><Heading size={20}>Care history</Heading>
      {!history.length && <Body muted>No clinical care entries are recorded for this concern.</Body>}
      {history.map(item => <View key={item.id} style={{ backgroundColor: c.inset, borderRadius: 12, padding: 12, gap: 5 }}>
        <Text style={{ color: c.muted, fontSize: 13 }}>{dateLabel(item.date)}</Text>
        <Body>{item.text}</Body>
        <Body muted>Patient fee: {formatMoney({ minor: item.cost, currency: item.currency })}</Body>
        {item.payerId !== person.id && <Body muted>Recorded payer: {fullName(world.people[item.payerId])} · {formatMoney({ minor: item.paidMinor, currency: item.paidCurrency })}</Body>}
      </View>)}
    </Card>
    {review.modal}
  </> : <Body>This condition is unavailable.</Body>}</Page>;
}
