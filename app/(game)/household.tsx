import React, { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { ageOn, fullName } from '../../src/game/model';
import { householdLivingCost } from '../../src/game/systems/households';
import { accountFor } from '../../src/game/systems/common';
import { formatMoney } from '../../src/game/money';
import { countries } from '../../src/game/countries';
import { rules } from '../../src/game/rules';
import { ActionRow, Body, Button, Card, Header, Heading, Page, Portrait } from '../../src/ui/components';
import { EventModal, type EventPresentation } from '../../src/ui/EventModal';
import { useColors } from '../../src/ui/theme';

type Review = { identity: string; event: EventPresentation };

export default function Household() {
  const identity = useGame(s => s.world ? s.world.id + ':' + s.world.activePersonId : 'none');
  return <HouseholdDetails key={identity} />;
}

function HouseholdDetails() {
  const world = useGame(s => s.world)!, dispatch = useGame(s => s.dispatch), busy = useGame(s => s.busy), error = useGame(s => s.error), c = useColors();
  const player = world.people[world.activePersonId], household = world.households.find(item => item.id === player.householdId);
  const members = household?.members.map(id => world.people[id]).filter(person => !person.died) ?? [player];
  const cost = householdLivingCost(world, player);
  const identity = JSON.stringify([world.id, player.id, player.country, player.city, player.died, player.householdId, members.map(person => person.id)]);
  const identityRef = useRef(identity), mounted = useRef(true), submitting = useRef(false), reviewRef = useRef<Review | null>(null);
  identityRef.current = identity;
  if (reviewRef.current && reviewRef.current.identity !== identity) reviewRef.current = null;
  const [review, setReview] = useState<Review | null>(null), current = review?.identity === identity && reviewRef.current === review ? review : null;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; reviewRef.current = null; }; }, []);
  useEffect(() => { setReview(saved => saved && saved.identity !== identity ? null : saved); }, [identity]);
  const reason = ageOn(player, world.date) < rules[player.country].adultAge ? 'Independent housing is available from age ' + rules[player.country].adultAge + '.' : members.length < 2 ? 'You already live in an independent household.' : undefined;
  const open = () => {
    if (!mounted.current || busy || submitting.current || reason || identityRef.current !== identity) return;
    const next: Review = { identity, event: { id: 'move-out:' + identity, kind: 'confirmation', title: 'Move into your own household?', body: 'You will cover an independent household budget from this month onward. Existing property and accounts remain in their owners’ names.', terms: [{ id: 'budget', label: 'Base monthly living cost', value: formatMoney({ minor: rules[player.country].livingCost, currency: accountFor(world).currency }), tone: 'neutral' }], confirmLabel: 'Move Out' } };
    reviewRef.current = next; setReview(next);
  };
  const cancel = () => {
    if (!mounted.current || !current || busy || submitting.current || reviewRef.current !== current || identityRef.current !== current.identity) return;
    reviewRef.current = null; setReview(saved => saved === current ? null : saved);
  };

  return <Page><Header title="My Household" backDisabled={!!current && busy} onBack={() => { if (!submitting.current) router.back(); }} />
    <Card><Heading>{household?.name ?? 'Independent household'}</Heading><Body muted>{player.city}, {countries[player.country].name}</Body>
      <Heading size={17}>Your Monthly Share</Heading><Heading size={27}>{formatMoney({ minor: cost, currency: accountFor(world).currency })}</Heading>
      <Body muted>Adults share the household budget. Children add to the costs adults cover. A primary home reduces this budget; upkeep and mortgage payments are separate owner expenses.</Body>
    </Card>
    <Card><Heading size={19}>Household Members</Heading>{members.map(person => <ActionRow key={person.id} title={fullName(person)} subtitle={(person.id === player.id ? 'You · ' : '') + 'Age ' + ageOn(person, world.date)} icon={<Portrait decorative name={fullName(person)} personId={person.id} appearance={person.appearance} age={ageOn(person, world.date)} size={40} />} onPress={() => { if (person.id === player.id) router.push('/profile'); else router.push({ pathname: '/person/[id]', params: { id: person.id } }); }} />)}</Card>
    <Card><Heading size={19}>Your Next Home</Heading>{reason ? <Body muted>{reason}</Body> : <Body muted>Review the independent household budget before moving. Your family relationships, property and accounts remain recorded.</Body>}
      {error && !current && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, fontSize: 16 }}>{error}</Text>}
      <Button label="Move Out" tone="secondary" disabled={busy || !!reason} onPress={open} />
    </Card>
    <EventModal event={current?.event ?? null} busy={busy} error={error} onCancel={cancel} onChoose={async () => {
      if (!mounted.current || !current || busy || submitting.current || reviewRef.current !== current || identityRef.current !== current.identity) return;
      submitting.current = true;
      try {
        if (await dispatch({ type: 'move-out' }) && mounted.current && identityRef.current === current.identity && reviewRef.current === current) {
          reviewRef.current = null; setReview(saved => saved === current ? null : saved);
        }
      } finally { submitting.current = false; }
    }} />
  </Page>;
}
