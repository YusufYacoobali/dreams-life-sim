import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { ageOn, fullName } from '../../src/game/model';
import { childrenOf, divorceQuote, type FamilyCommand } from '../../src/game/systems/family';
import { otherPerson, partnerRelation, relationFor } from '../../src/game/systems/relationshipQueries';
import { isConfined } from '../../src/game/systems/legalSchemas';
import { serviceAway } from '../../src/game/systems/serviceSchemas';
import { formatMoney } from '../../src/game/money';
import { rules } from '../../src/game/rules';
import { Body, Button, Card, Header, Heading, Page } from '../../src/ui/components';
import { EventModal, type EventPresentation } from '../../src/ui/EventModal';
import { useColors } from '../../src/ui/theme';
import { FamilyArt } from '../../src/assets/FamilyArt';

type Custody = 'shared' | 'me' | 'them';
type Review = { identity: string; command: Extract<FamilyCommand, { type: 'divorce' }>; event: EventPresentation };

export default function Divorce() {
  const identity = useGame(s => s.world ? s.world.id + ':' + s.world.activePersonId : 'none');
  return <DivorceDetails key={identity} />;
}

function DivorceDetails() {
  const world = useGame(s => s.world)!, dispatch = useGame(s => s.dispatch), busy = useGame(s => s.busy), error = useGame(s => s.error), c = useColors();
  const { width, fontScale } = useWindowDimensions(), stacked = width < 360 || fontScale >= 1.3;
  const [custody, setCustody] = useState<Custody>('shared');
  const player = world.people[world.activePersonId], relation = partnerRelation(world);
  const partner = relation?.romance === 'married' ? otherPerson(world, relation) : undefined;
  const marriage = partner && world.marriages.find(item => !item.ended && (item.a === player.id && item.b === partner.id || item.b === player.id && item.a === partner.id));
  const spouse = !player.died && partner && !partner.died && marriage ? partner : undefined;
  const quote = spouse ? divorceQuote(world, spouse.id) : undefined;
  const otherChildren = new Set(spouse ? childrenOf(world, spouse.id).map(person => person.id) : []);
  const children = childrenOf(world).filter(child => !child.died && ageOn(child, world.date) < rules[child.country].adultAge && otherChildren.has(child.id));
  const identity = JSON.stringify([world.id, player.id, fullName(player), player.country, player.city, player.householdId, player.died, world.date,
    spouse && [spouse.id, fullName(spouse), spouse.country, spouse.city, spouse.householdId, spouse.died], relation?.id, relation?.romance, marriage?.id, marriage?.started,
    quote && [quote.signed.toString(), quote.currency, quote.payerId, quote.receiverId], custody,
    children.map(child => [child.id, fullName(child), child.born, child.country, child.city, child.householdId,
      relationFor(world, player.id, child.id)?.strength, spouse && relationFor(world, spouse.id, child.id)?.strength,
      world.custody.filter(item => item.childId === child.id && !item.ended)]),
    children.length ? [player.stats.health, player.stats.discipline, isConfined(world, player), !!serviceAway(world, player.id),
      spouse && [spouse.stats.health, spouse.stats.discipline, isConfined(world, spouse), !!serviceAway(world, spouse.id)]] : null]);
  const identityRef = useRef(identity), mounted = useRef(true), submitting = useRef(false), reviewRef = useRef<Review | null>(null);
  identityRef.current = identity;
  if (reviewRef.current && reviewRef.current.identity !== identity) reviewRef.current = null;
  const [review, setReview] = useState<Review | null>(null), current = review?.identity === identity && reviewRef.current === review ? review : null;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; reviewRef.current = null; }; }, []);
  useEffect(() => { setReview(saved => saved && saved.identity !== identity ? null : saved); }, [identity]);
  const careChoices: { value: Custody; label: string; detail: string }[] = [
    { value: 'shared', label: 'Shared care', detail: 'My home preferred as the primary home' },
    { value: 'me', label: 'Primary care with me', detail: fullName(player) + '’s home preferred' },
    { value: 'them', label: 'Primary care with ' + (spouse ? fullName(spouse) : 'my spouse'), detail: 'The other parent’s home preferred' },
  ];
  const careLabel = careChoices.find(item => item.value === custody)!;
  const open = () => {
    if (!mounted.current || busy || submitting.current || identityRef.current !== identity || !spouse || !quote) return;
    const amount = formatMoney({ minor: quote.amount, currency: quote.currency });
    const next: Review = { identity, command: { type: 'divorce', personId: spouse.id, custody, quotedPayment: quote.signed }, event: {
      id: 'divorce-confirm:' + identity, kind: 'confirmation', title: 'End your marriage?',
      body: 'Your marriage to ' + fullName(spouse) + ' will end and you will form separate households. Review the settlement' + (children.length ? ' and care preference' : '') + ' before confirming.',
      terms: [
        { id: 'spouse', label: 'Current spouse', value: fullName(spouse), tone: 'neutral' },
        { id: 'settlement', label: 'Marital gain settlement', value: amount, tone: 'neutral' },
        { id: 'payer', label: quote.amount ? fullName(world.people[quote.payerId]) + ' pays' : 'Payment', value: quote.amount ? fullName(world.people[quote.receiverId]) : 'No settlement payment due', tone: 'neutral' },
        { id: 'property', label: 'Property', value: 'Remains with its owner', tone: 'neutral' },
        { id: 'care', label: 'Children’s care preference', value: children.length ? careLabel.label + '. ' + careLabel.detail : 'No shared dependent children', tone: 'neutral' },
      ], confirmLabel: 'Confirm Divorce',
    } };
    reviewRef.current = next; setReview(next);
  };
  const cancel = () => {
    if (!mounted.current || !current || busy || submitting.current || reviewRef.current !== current || identityRef.current !== current.identity) return;
    reviewRef.current = null; setReview(saved => saved === current ? null : saved);
  };
  const chooseCare = (value: Custody) => {
    if (!mounted.current || busy || submitting.current || identityRef.current !== identity || custody === value) return;
    reviewRef.current = null; setReview(null); setCustody(value);
  };

  return <Page><Header title="Divorce & Settlement" backDisabled={busy} onBack={() => {
    if (mounted.current && !busy && !submitting.current && identityRef.current === identity) router.back();
  }} />{spouse && quote ? <>
    <Card>
      <View style={{ flexDirection: stacked ? 'column' : 'row', gap: 16, alignItems: stacked ? 'flex-start' : 'center' }}>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><FamilyArt id="breakup" size={80} /></View>
        <View style={{ flex: stacked ? undefined : 1, minWidth: 0, gap: 4 }}><Heading size={21}>Separate lives</Heading><Body>Marriage to {fullName(spouse)}</Body></View>
      </View>
      <View style={{ backgroundColor: c.inset, borderRadius: 12, padding: 16, gap: 6 }}>
        <Body muted>Marital gain settlement</Body><Heading size={28}>{formatMoney({ minor: quote.amount, currency: quote.currency })}</Heading>
        <Body>{quote.amount ? fullName(world.people[quote.payerId]) + ' pays ' + fullName(world.people[quote.receiverId]) + '.' : 'No settlement payment is due.'}</Body>
      </View>
      <Heading size={17}>What this settles</Heading>
      <Body muted>The settlement equalises changes in net worth since marriage. Starting wealth is retained in the calculation. Property remains with its owner.</Body>
      <Body muted>Available cash pays first. Any unpaid amount becomes a recorded debt owed to the other person; it is not cash received.</Body>
    </Card>
    <Card><Heading size={19}>Children’s living arrangements</Heading>{children.length ? <>
      <Body>{children.map(child => fullName(child)).join(', ')}</Body>
      <Body muted>Choose a care preference for your shared dependent children. The recorded primary home also considers each parent’s health, availability and ability to care.</Body>
      <View accessibilityRole="radiogroup" accessibilityLabel="Children’s care preference" style={{ gap: 10 }}>{careChoices.map(choice => <Pressable
        key={choice.value} accessibilityRole="radio" accessibilityState={{ checked: custody === choice.value, disabled: busy }}
        accessibilityLabel={choice.label + '. ' + choice.detail} disabled={busy} onPress={() => chooseCare(choice.value)}
        style={({ pressed }) => ({ minHeight: 72, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: custody === choice.value ? c.link : c.line, backgroundColor: custody === choice.value || pressed ? c.selected : c.surface, opacity: busy ? 0.5 : 1, flexDirection: 'row', gap: 12, alignItems: 'flex-start' })}
      >
        <View accessible={false} style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: custody === choice.value ? c.link : c.muted, marginTop: 2, alignItems: 'center', justifyContent: 'center' }}>{custody === choice.value && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.link }} />}</View>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}><Text style={{ color: c.ink, fontSize: 16, lineHeight: 23, fontWeight: '600' }}>{choice.label}</Text><Body muted>{choice.detail}</Body></View>
      </Pressable>)}</View>
      <Body muted>Shared care requires both parents to be available in the same country and city. Any support is collected from actual available money; unpaid support remains an obligation.</Body>
    </> : <Body muted>You have no shared dependent children with {fullName(spouse)}. No new custody arrangement will be recorded.</Body>}</Card>
    {error && !world.pending && !current && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, fontSize: 16 }}>{error}</Text>}
    <Button label="Review Divorce" tone="danger" disabled={busy} onPress={open} />
  </> : <Card><Heading size={19}>No current marriage</Heading><Body>You have no current marriage to settle. Past relationships remain in your family records.</Body></Card>}
    <EventModal event={current?.event ?? null} busy={busy} error={error} onCancel={cancel} onChoose={async () => {
      if (!mounted.current || !current || busy || submitting.current || reviewRef.current !== current || identityRef.current !== current.identity) return;
      submitting.current = true;
      try {
        if (await dispatch(current.command) && mounted.current && identityRef.current === current.identity && reviewRef.current === current) {
          reviewRef.current = null; setReview(saved => saved === current ? null : saved);
        }
      } finally { submitting.current = false; }
    }} />
  </Page>;
}
