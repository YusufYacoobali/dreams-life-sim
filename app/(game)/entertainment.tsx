import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { countries } from '../../src/game/countries';
import { ageOn, fullName } from '../../src/game/model';
import { formatMoney } from '../../src/game/money';
import { outingContent, outingKinds, OutingKind } from '../../src/game/content/leisure';
import { leisurePayer, outingFee, outingReason, LeisureCommand } from '../../src/game/systems/leisure';
import { ActionRow, Body, Button, Card, Header, Heading, Page } from '../../src/ui/components';
import { EventModal, EventPresentation } from '../../src/ui/EventModal';
import { PetsLeisureArt } from '../../src/assets/PetsLeisureArt';
import { CareerArt } from '../../src/assets/CareerArt';
import { useColors } from '../../src/ui/theme';
import { DisplayText as Text } from '../../src/ui/DisplayText';

export default function Entertainment() {
  const world = useGame(s => s.world)!, busy = useGame(s => s.busy), error = useGame(s => s.error), dispatch = useGame(s => s.dispatch), person = world.people[world.activePersonId], payer = leisurePayer(world), c = useColors();
  const [review, setReview] = useState<{ command: LeisureCommand; event: EventPresentation } | null>(null), [historyLimit, setHistoryLimit] = useState(6), history = world.leisureOutings.filter(item => item.personId === person.id).slice().reverse();
  const money = (minor: bigint, country = person.country) => formatMoney({ minor, currency: countries[country].currency }, countries[country].locale);
  const open = (kind: OutingKind) => { if (!payer || outingReason(world, kind)) return; const total = outingFee(world, kind); setReview({ command: { type: 'leisure-outing', kind, reviewedPayerId: payer.id, quotedTotal: total }, event: { id: 'outing-review-' + kind + '-' + payer.id, kind: 'confirmation', title: outingContent[kind].name, body: outingContent[kind].description + (payer.id === person.id ? ' You pay for your own admission.' : ' ' + fullName(payer) + ' must agree and accompany you. Both tickets are included; refusal charges nothing.') + ' The experience can disappoint; accepted admission stays paid.', terms: [{ id: 'payer', label: 'Paid by', value: fullName(payer), tone: 'neutral' }, { id: 'tickets', label: payer.id === person.id ? 'One admission' : 'Two admissions', value: money(total), tone: 'negative' }, { id: 'energy', label: 'Energy needed', value: outingContent[kind].energy + '%', tone: 'neutral' }], confirmLabel: payer.id === person.id ? 'Go To This Outing' : 'Ask For This Outing' } }); };
  return <Page footer={error && !review && !world.pending ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, fontSize: 15, lineHeight: 22 }}>{error}</Text> : undefined}>
    <Header title="Entertainment" onBack={() => router.back()} />
    <Card>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
        <PetsLeisureArt id="cinema" size={64} />
        <View style={{ flexGrow: 1, flexBasis: 170, minWidth: 0, gap: 5 }}>
          <Heading>Go out</Heading>
          <Body muted>{ageOn(person, world.date) < 18 ? 'Prices include your admission and an accompanying adult’s ticket. Their agreement is needed before you go.' : 'Prices cover one admission. Review the cost and energy needed before you go.'}</Body>
        </View>
      </View>
      <Body muted>Reviewing an outing is free. Tickets are charged only when you confirm and attend; a declined request costs nothing. One visit to each venue is available per month.</Body>
      {outingKinds.map(kind => <ActionRow key={kind} title={outingContent[kind].name} subtitle={outingContent[kind].description + ' Energy needed: ' + outingContent[kind].energy + '%.'} icon={<PetsLeisureArt id={kind} size={40} />} value={money(outingFee(world, kind))} disabled={busy} disabledReason={outingReason(world, kind)} onPress={() => open(kind)} />)}
    </Card>
    <Card><Heading size={18}>Create and Perform</Heading><ActionRow title="Acting & Stage Work" subtitle="Auditions, contracts and roles" icon={<CareerArt id="actor" size={40} />} onPress={() => router.push('/career/actor')} /><ActionRow title="Music Studio" subtitle="Your recordings, budget and releases" icon={<CareerArt id="musician" size={40} />} onPress={() => router.push('/music-studio')} /><ActionRow title="Video Studio" subtitle="Your channel, production and crew" icon={<CareerArt id="video" size={40} />} onPress={() => router.push({ pathname: '/creator-studio/[kind]', params: { kind: 'youtuber' } })} /><ActionRow title="Streaming Studio" subtitle="Your live channel and recorded production" icon={<CareerArt id="streamer" size={40} />} onPress={() => router.push({ pathname: '/creator-studio/[kind]', params: { kind: 'streamer' } })} /></Card>
    <Card>
      <Heading size={18}>Outing History</Heading>
      {history.length === 0 ? <Body muted>No outings recorded yet. Choose a venue above to review its tickets and energy cost.</Body> : history.slice(0, historyLimit).map(item => <View key={item.id} style={{ gap: 5, paddingVertical: 8 }}>
        <Heading size={16}>{outingContent[item.kind].name}</Heading>
        <Body muted>{item.date.day}/{item.date.month}/{item.date.year} · {item.city}, {countries[item.country].name}</Body>
        <Body>{item.consent.accepted ? item.participants.length + (item.participants.length === 1 ? ' admission' : ' admissions') + ' · Paid ' + money(item.paid, item.country) : 'Permission declined · no tickets charged'}</Body>
        <Body muted>{item.consent.accepted ? 'Paid by ' : 'Asked '}{fullName(world.people[item.payerId])}</Body>
        {item.effects.length > 0 && <Body muted>{item.effects.map(effect => effect.stat[0].toUpperCase() + effect.stat.slice(1) + ' ' + (effect.after >= effect.before ? '+' : '') + (effect.after - effect.before) + '%').join(' · ')}</Body>}
      </View>)}
      {history.length > historyLimit && <Button label="Show Earlier Outings" tone="secondary" onPress={() => setHistoryLimit(historyLimit + 6)} />}
    </Card>
    <EventModal event={review?.event ?? null} busy={busy} error={error} onCancel={() => setReview(null)} onChoose={() => { if (review) void dispatch(review.command).then(ok => { if (ok) setReview(null); }); }} />
  </Page>;
}
