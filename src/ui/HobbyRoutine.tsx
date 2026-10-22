import React, { useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../state/useGame';
import { countries } from '../game/countries';
import { fullName } from '../game/model';
import { formatMoney } from '../game/money';
import { hobbyContent, HobbyKind, hobbyModes } from '../game/content/leisure';
import { activeHobbyPlan, personHobbies } from '../game/systems/leisureSchemas';
import { hobbyContacts, hobbyFee, hobbyIntroductionReason, hobbyPauseLabels, hobbyPracticeReason, hobbyReason, leisurePayer, LeisureCommand } from '../game/systems/leisure';
import { ActionRow, Body, Button, Card, Header, Heading, Page, StatBar } from './components';
import { EventModal, EventPresentation } from './EventModal';
import { useColors } from './theme';
import { hobbyEventContent } from '../game/content/hobbyEvents';
import { HobbyArt } from '../assets/HobbyArt';
const routineNudge: Record<HobbyKind, string> = {
  guitar: 'Your neighbours may eventually applaud.', painting: 'Try keeping more paint on the canvas.',
  photography: 'Give your camera roll a little ambition.', chess: 'Your king could use some protection.',
  reading: 'Your bookmark has waited long enough.', gaming: 'Finally, a plan involving a controller.',
  cooking: 'The smoke alarm could use a day off.', gardening: 'Try growing something that survives the week.',
};
const planLabels = { active: 'Current', declined: 'Permission declined', stopped: 'Stopped', moved: 'Ended after moving', died: 'Ended', 'payer-lost': 'Payer unavailable', 'adult-review': 'Choose your own funding' };
export function HobbyRoutine({ kind }: { kind: HobbyKind }) {
  const world = useGame(s => s.world)!, busy = useGame(s => s.busy), error = useGame(s => s.error), dispatch = useGame(s => s.dispatch), c = useColors(), person = world.people[world.activePersonId], payer = leisurePayer(world);
  const hobbies = personHobbies(world), hobby = hobbies.find(item => item.kind === kind), plan = hobby && activeHobbyPlan(hobby);
  const [mode, setMode] = useState<typeof hobbyModes[number]>(plan?.mode ?? 'community'), [review, setReview] = useState<{ command: LeisureCommand; event: EventPresentation } | null>(null), [historyLimit, setHistoryLimit] = useState(4);
  const submitting = useRef(false);
  const reason = hobbyReason(world, kind, mode);
  const money = (minor: bigint, country = person.country) => formatMoney({ minor, currency: countries[country].currency }, countries[country].locale);
  const reviewPlan = () => {
    if (busy || submitting.current || !payer || reason) return; const fee = hobbyFee(person.country, kind, mode);
    setReview({ command: { type: 'hobby-plan', kind, mode, reviewedPayerId: payer.id, quotedMonthlyFee: fee }, event: { id: 'hobby-review-' + kind + '-' + mode + '-' + payer.id, kind: 'confirmation', title: hobbyContent[kind].name + ' Routine', body: (mode === 'lessons' ? 'Start ' + hobbyContent[kind].name.toLowerCase() + ' lessons' : 'Join ' + hobbyContent[kind].name.toLowerCase() + ' sessions') + ' for ' + money(fee) + ' a month? ' + routineNudge[kind] + (payer.id === person.id ? '' : ' ' + fullName(payer) + ' needs to agree.'), terms: [{ id: 'payer', label: 'Responsible payer', value: fullName(payer), tone: 'neutral' }, { id: 'mode', label: 'Routine', value: mode === 'lessons' ? 'Guided lessons' : 'Community access', tone: 'neutral' }, { id: 'fee', label: 'Per attended month', value: money(fee), tone: 'negative' }, { id: 'progress', label: 'Practice progress', value: 'Up to ' + (mode === 'lessons' ? 4 : 2) + ' points per attended month', tone: 'neutral' }, { id: 'now', label: 'Paid to set this plan', value: money(0n), tone: 'neutral' }, { id: 'included', label: 'Included', value: 'Shared equipment and materials', tone: 'neutral' }, { id: 'pause', label: 'Fees pause', value: 'When you cannot attend or afford it', tone: 'neutral' }], confirmLabel: payer.id === person.id ? 'Set Hobby Routine' : 'Ask For This Routine' } });
  };
  const lastMonth = hobby && plan ? hobby.practices.filter(item => item.planId === plan.id && item.source === 'monthly').at(-1) : undefined;
  const introductionReason = hobby && plan ? hobbyIntroductionReason(world, hobby, plan) : 'Arrange and attend a current local routine first';
  const contacts = useMemo(() => hobby ? hobbyContacts(world, hobby) : [], [world, person.id, kind, hobby]);
  return <Page><Header title={hobbyContent[kind].name} onBack={() => router.back()} />
    <Card><View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><HobbyArt kind={kind} size={64} /><View style={{ flex: 1, minWidth: 0 }}><Heading size={20}>{hobbyContent[kind].name}</Heading><Body muted>{hobbyContent[kind].description}</Body></View></View><StatBar label="Proficiency" value={hobby?.proficiency ?? 0} color={c.green} /><Body>{hobby?.practices.filter(item => item.source === 'monthly' && item.attended).length ?? 0} months of practice</Body>{kind === 'guitar' && <Body muted>Three months of practice can add one Music point.</Body>}{(kind === 'chess' || kind === 'reading') && <Body muted>Six months of practice can add one Smarts point.</Body>}
      {plan && hobby && <><Body>Current payer: {fullName(world.people[plan.payerId])}</Body><Body>Per attended month: {money(plan.monthlyFee, plan.country)}</Body><Body muted>{lastMonth ? lastMonth.attended ? 'Last month: attended.' : 'Last month paused: ' + hobbyPauseLabels[lastMonth.reason!] : 'Your first practice month is still ahead.'}</Body><Button label="Extra Practice" disabled={busy || !!hobbyPracticeReason(world, hobby, plan)} onPress={() => void dispatch({ type: 'practise-hobby', hobbyId: hobby.id, planId: plan.id })} />{hobbyPracticeReason(world, hobby, plan) && <Body muted>{hobbyPracticeReason(world, hobby, plan)}</Body>}<Button label="Stop Routine" tone="secondary" disabled={busy} onPress={() => setReview({ command: { type: 'stop-hobby', hobbyId: hobby.id, planId: plan.id }, event: { id: 'stop-' + plan.id, kind: 'confirmation', title: 'Stop this routine?', body: 'Keep your progress. Future fees stop; past sessions are not refunded.', terms: [], confirmLabel: 'Stop This Routine' } })} /></>}
      <Heading size={18}>Choose a Routine</Heading>{hobbyModes.map(value => <Pressable key={value} accessibilityRole="radio" accessibilityLabel={value === 'lessons' ? 'Guided lessons' : 'Community access'} accessibilityState={{ checked: mode === value, disabled: busy }} disabled={busy} onPress={() => setMode(value)} style={{ borderWidth: 1, borderColor: mode === value ? c.blue : c.line, backgroundColor: mode === value ? c.selected : c.surface, borderRadius: 12, padding: 14, minHeight: 52 }}><Text style={{ color: c.ink, fontWeight: '600', fontSize: 16 }}>{value === 'lessons' ? 'Guided lessons' : 'Community access'}</Text><Body muted>{money(hobbyFee(person.country, kind, value))} per attended month</Body></Pressable>)}{reason && <Body muted>{reason}</Body>}<Button label="Review Hobby Routine" disabled={busy || !!reason} onPress={reviewPlan} /></Card>
      <Card><Heading size={18}>Meet Someone at Practice</Heading><Body muted>Meet someone around your age after a month of practice. One introduction per hobby each year; children attend with their responsible adult.</Body>{introductionReason && <Body muted>{introductionReason}</Body>}<Button label="Review Practice Introduction" disabled={busy || !!introductionReason} onPress={() => {
        if (busy || submitting.current || !hobby || !plan || introductionReason) return;
        setReview({ command: { type: 'meet-hobby-peer', hobbyId: hobby.id, planId: plan.id, reviewedPayerId: plan.payerId, reviewedMonth: world.date.year * 12 + world.date.month - 1 }, event: { id: 'hobby-introduction-' + plan.id + '-' + world.date.year, kind: 'confirmation', title: 'An Introduction After Practice?', body: 'Say hello to someone around your age. A great friendship has to start somewhere.', terms: [{ id: 'access', label: 'Access', value: 'Current month already attended and paid', tone: 'neutral' }, { id: 'adult', label: plan.payerId === person.id ? 'Attending' : 'Accompanying adult', value: fullName(world.people[plan.payerId]), tone: 'neutral' }, { id: 'cost', label: 'Additional cost', value: money(0n, plan.country), tone: 'neutral' }, { id: 'limit', label: 'Introduction limit', value: 'One in this hobby during ' + world.date.year, tone: 'neutral' }], confirmLabel: 'Make an Introduction' } });
      }} />{contacts.length > 0 && <><Heading size={18}>People You Met Through Practice</Heading>{contacts.slice(-4).reverse().map(contact => <ActionRow key={contact.id} title={fullName(contact)} subtitle={contact.died ? 'Met through practice · Deceased' : 'Met through practice · View relationship'} onPress={() => router.push({ pathname: '/person/[id]', params: { id: contact.id } })} />)}{contacts.length > 4 && <Body muted>All earlier acquaintances remain in Relationships.</Body>}</>}</Card>
      <Card><Heading size={18}>Community Event</Heading><Body>{hobbyEventContent[kind].name}</Body><Body muted>After 12 attended monthly practices, bring your skills to a local club event.</Body><Button label="View Community Event" tone="secondary" disabled={busy} onPress={() => router.push({ pathname: '/hobby-event/[kind]', params: { kind } })} /></Card>
      {hobby && <Card><Heading size={18}>Routine History</Heading>{hobby.plans.slice().reverse().slice(0, historyLimit).map(item => { const rows = hobby.practices.filter(row => row.planId === item.id && row.source === 'monthly'); return <View key={item.id} style={{ gap: 3 }}><Body>{planLabels[item.status]} · {item.started.year}</Body><Body muted>{fullName(world.people[item.payerId])} · {rows.filter(row => row.attended).length} attended / {rows.length} months · paid {money(rows.reduce((sum, row) => sum + row.paid, 0n), item.country)}</Body>{item.endReason && <Body muted>{item.endReason}</Body>}</View>; })}{hobby.plans.length > historyLimit && <Button label="Show Earlier Routines" tone="secondary" onPress={() => setHistoryLimit(historyLimit + 4)} />}</Card>}
    {error && !review && <Body>{error}</Body>}<EventModal event={review?.event ?? null} busy={busy} error={error} onCancel={() => { if (!busy && !submitting.current) setReview(null); }} onChoose={() => {
      if (!review || busy || submitting.current) return;
      submitting.current = true;
      void dispatch(review.command).then(ok => { if (ok) setReview(null); }).finally(() => { submitting.current = false; });
    }} />
  </Page>;
}
