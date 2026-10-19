import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { countries } from '../../src/game/countries';
import { fullName } from '../../src/game/model';
import { formatMoney } from '../../src/game/money';
import { outingContent, outingKinds, OutingKind } from '../../src/game/content/leisure';
import { leisurePayer, outingFee, outingReason, LeisureCommand } from '../../src/game/systems/leisure';
import { ActionRow, Body, Button, Card, Header, Heading, Page } from '../../src/ui/components';
import { EventModal, EventPresentation } from '../../src/ui/EventModal';
import { PetsLeisureArt } from '../../src/assets/PetsLeisureArt';
export default function Entertainment() {
  const world = useGame(s => s.world)!, busy = useGame(s => s.busy), error = useGame(s => s.error), dispatch = useGame(s => s.dispatch), person = world.people[world.activePersonId], payer = leisurePayer(world);
  const [review, setReview] = useState<{ command: LeisureCommand; event: EventPresentation } | null>(null), [historyLimit, setHistoryLimit] = useState(6), history = world.leisureOutings.filter(item => item.personId === person.id).slice().reverse();
  const money = (minor: bigint, country = person.country) => formatMoney({ minor, currency: countries[country].currency }, countries[country].locale);
  const open = (kind: OutingKind) => { if (!payer || outingReason(world, kind)) return; const total = outingFee(world, kind); setReview({ command: { type: 'leisure-outing', kind, reviewedPayerId: payer.id, quotedTotal: total }, event: { id: 'outing-review-' + kind + '-' + payer.id, kind: 'confirmation', title: outingContent[kind].name, body: outingContent[kind].description + (payer.id === person.id ? ' You pay for your own admission.' : ' ' + fullName(payer) + ' must agree and accompany you. Both tickets are included; refusal charges nothing.') + ' The experience can disappoint; accepted admission stays paid.', terms: [{ id: 'payer', label: 'Paid by', value: fullName(payer), tone: 'neutral' }, { id: 'tickets', label: payer.id === person.id ? 'One admission' : 'Two admissions', value: money(total), tone: 'negative' }, { id: 'energy', label: 'Energy needed', value: outingContent[kind].energy + '%', tone: 'neutral' }], confirmLabel: payer.id === person.id ? 'Go To This Outing' : 'Ask For This Outing' } }); };
  return <Page><Header title="Entertainment" onBack={() => router.back()} /><Card>{outingKinds.map(kind => <ActionRow key={kind} title={outingContent[kind].name} subtitle={outingContent[kind].description} icon={<PetsLeisureArt id={kind} size={40} />} value={money(outingFee(world, kind))} disabled={busy} disabledReason={outingReason(world, kind)} onPress={() => open(kind)} />)}</Card>
    <Card><Heading size={18}>Create and Perform</Heading><ActionRow title="Acting & Stage Work" subtitle="Actual auditions, contracts and roles" onPress={() => router.push('/career/actor')} /><ActionRow title="Music Studio" subtitle="Your recordings, budget and releases" onPress={() => router.push('/music-studio')} /><ActionRow title="Video Studio" subtitle="Your actual channel, production and crew" onPress={() => router.push({ pathname: '/creator-studio/[kind]', params: { kind: 'youtuber' } })} /><ActionRow title="Streaming Studio" subtitle="Your live channel and recorded production" onPress={() => router.push({ pathname: '/creator-studio/[kind]', params: { kind: 'streamer' } })} /></Card>
    {history.length > 0 && <Card><Heading size={18}>Outing History</Heading>{history.slice(0, historyLimit).map(item => <View key={item.id} style={{ gap: 3 }}><Body>{outingContent[item.kind].name} · {item.date.month}/{item.date.year}</Body><Body muted>{item.city}, {countries[item.country].name} · {item.consent.accepted ? 'Paid ' + money(item.paid, item.country) + ' by ' + fullName(world.people[item.payerId]) : 'Declined · no charge'}</Body></View>)}{history.length > historyLimit && <Button label="Show Earlier Outings" tone="secondary" onPress={() => setHistoryLimit(historyLimit + 6)} />}</Card>}
    {error && !review && <Body>{error}</Body>}<EventModal event={review?.event ?? null} busy={busy} error={error} onCancel={() => setReview(null)} onChoose={() => { if (review) void dispatch(review.command).then(ok => { if (ok) setReview(null); }); }} />
  </Page>;
}
