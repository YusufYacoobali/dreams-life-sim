import React, { useEffect, useRef, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { ageOn, fullName } from '../../src/game/model';
import { adoptionFee, childrenOf } from '../../src/game/systems/family';
import { otherPerson, partnerRelation } from '../../src/game/systems/relationships';
import { accountFor } from '../../src/game/systems/common';
import { formatMoney } from '../../src/game/money';
import { rules } from '../../src/game/rules';
import { ActionRow, Body, Button, Card, Header, Heading, Page, Portrait } from '../../src/ui/components';
import { EventModal, EventPresentation } from '../../src/ui/EventModal';
import { isConfined } from '../../src/game/systems/legalSchemas';
import { FamilyArt } from '../../src/assets/FamilyArt';
import { useColors } from '../../src/ui/theme';
import { DisplayText as Text, displayText } from '../../src/ui/DisplayText';

type AdoptionReview = { lifeId: string; personId: string; revision: number; age: number };

export default function Family() {
  const world = useGame(s => s.world)!, dispatch = useGame(s => s.dispatch), busy = useGame(s => s.busy), error = useGame(s => s.error);
  const colors = useColors(), { width, fontScale } = useWindowDimensions(), stacked = width < 360 || fontScale >= 1.2;
  const player = world.people[world.activePersonId], relation = partnerRelation(world), partner = relation && otherPerson(world, relation), children = childrenOf(world);
  const [confirm, setConfirm] = useState<AdoptionReview | null>(null), [adoptionAge, setAdoptionAge] = useState(0);
  const liveReview = useRef(confirm), submitting = useRef(false), mounted = useRef(true);
  const latest = useRef({ world, busy, adoptionAge });
  liveReview.current = confirm; latest.current = { world, busy, adoptionAge };
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; liveReview.current = null; }; }, []);
  useEffect(() => { liveReview.current = null; setConfirm(null); setAdoptionAge(0); }, [world.id, world.activePersonId]);
  useEffect(() => {
    const review = liveReview.current;
    if (review && (review.lifeId !== world.id || review.personId !== world.activePersonId || review.revision !== world.revision)) { liveReview.current = null; setConfirm(null); }
  }, [world.id, world.activePersonId, world.revision]);
  const scoped = !!confirm && confirm.lifeId === world.id && confirm.personId === world.activePersonId && confirm.revision === world.revision;
  const openAdoption = () => {
    const state = latest.current;
    if (!mounted.current || state.busy || submitting.current || liveReview.current) return;
    const review = { lifeId: state.world.id, personId: state.world.activePersonId, revision: state.world.revision, age: state.adoptionAge };
    liveReview.current = review; setConfirm(review);
  };
  const pregnancy = world.pregnancies.find(item => item.status === 'pregnant' && (item.carrierId === player.id || item.otherParentId === player.id));
  const adult = ageOn(player, world.date) >= rules[player.country].adultAge;
  const adoptedThisYear = !!world.actionCounts[player.id + ':adopt:' + world.date.year];
  const event: EventPresentation | null = confirm && scoped ? { id: 'family-adopt', kind: 'confirmation', title: 'Apply to adopt?', body: 'The assessment and placement fee is ' + formatMoney({ minor: adoptionFee(world), currency: accountFor(world).currency }) + '. Placement requires a stable household, income and health. The child will become a permanent member of this world.', terms: [{ id: 'age', label: 'Child age', value: confirm.age === 0 ? 'Infant' : confirm.age + ' years', tone: 'neutral' }], confirmLabel: 'Adopt a Child' } : null;
  return <Page><Header title="Family" backDisabled={!!confirm && busy} onBack={() => { if (!submitting.current) router.back(); }} />
    <Card><View style={{ flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'stretch' : 'center', gap: 16 }}><FamilyArt id="family-tree" size={80} /><View style={{ flex: stacked ? undefined : 1, minWidth: 0, gap: 6 }}><Heading>{player.lastName} Family</Heading><Body muted>Generation {world.generation}</Body><Body>The people and connections in your family record.</Body></View></View><ActionRow title="Family Tree" subtitle="Parents, children and generations" icon={<FamilyArt id="family-tree" size={40} />} onPress={() => router.push('/family-tree')} />{partner && <ActionRow title="Your Partner" subtitle={fullName(partner)} icon={<Portrait name={fullName(partner)} personId={partner.id} appearance={partner.appearance} age={ageOn(partner, world.date)} size={40} />} onPress={() => router.push({ pathname: '/person/[id]', params: { id: partner.id } })} />}<ActionRow title="My Household" onPress={() => router.push('/household')} /><ActionRow title="My Will" subtitle="Executor, protected shares and specific bequests" icon={<FamilyArt id="will" size={40} />} disabledReason={!adult ? 'Available in adulthood' : undefined} onPress={() => router.push('/will')} /></Card>
    {pregnancy && <Card><View style={{ flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'stretch' : 'center', gap: 12 }}><FamilyArt id="carriage" size={64} /><View style={{ flex: stacked ? undefined : 1, minWidth: 0, gap: 6 }}><Heading size={20}>A baby on the way</Heading><Body>{fullName(world.people[pregnancy.carrierId])} is pregnant.</Body></View></View><View accessible accessibilityLabel={displayText('Due ' + pregnancy.due.year + '-' + String(pregnancy.due.month).padStart(2, '0'))} style={{ backgroundColor: colors.inset, padding: 12, borderRadius: 12, gap: 4 }}><Body muted>Due date</Body><Heading size={22}>{pregnancy.due.year}-{String(pregnancy.due.month).padStart(2, '0')}</Heading></View></Card>}
    {(adult || children.length > 0) && <Card><Heading size={20}>Your children</Heading>{children.length === 0 && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><FamilyArt id="blanket" size={52} /><View style={{ flex: 1, minWidth: 0 }}><Body muted>You have no children.</Body></View></View>}{children.map(child => <ActionRow key={child.id} title={fullName(child)} subtitle={'Age ' + ageOn(child, world.date) + (child.died ? ' · Deceased' : child.householdId === player.householdId ? ' · Lives with you' : ' · Another household')} icon={<Portrait name={fullName(child)} personId={child.id} appearance={child.appearance} age={ageOn(child, world.date)} size={44} />} onPress={() => router.push({ pathname: '/person/[id]', params: { id: child.id } })} />)}</Card>}
    {error && !confirm && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: colors.red, fontSize: 15, lineHeight: 22 }}>{error}</Text>}
    {adult && <Card><View style={{ flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'stretch' : 'center', gap: 12 }}><FamilyArt id="adoption" size={64} /><View style={{ flex: stacked ? undefined : 1, minWidth: 0, gap: 4 }}><Heading size={20}>Adoption</Heading><Body muted>Welcome a child into your household.</Body></View></View><Body>Adoption is open to adults aged 21–65 with a stable household, health, income and a wish to parent. A partner also needs to be ready. It is independent of gender or reproductive capacity.</Body><View accessible accessibilityLabel={displayText('Assessment and placement fee: ' + formatMoney({ minor: adoptionFee(world), currency: accountFor(world).currency }))} style={{ backgroundColor: colors.inset, padding: 12, borderRadius: 12, gap: 6 }}><Body muted>Assessment and placement fee</Body><Text style={{ color: colors.ink, fontSize: 24, lineHeight: 31, fontWeight: '700' }}>{formatMoney({ minor: adoptionFee(world), currency: accountFor(world).currency })}</Text></View><Body muted>Paid when placement succeeds. Choosing an age or reviewing the plan spends nothing.</Body><Heading size={18}>Child Age</Heading><View accessibilityRole="radiogroup" accessibilityLabel="Child age" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{[0, 2, 4, 6].map(age => <View key={age} style={{ flexBasis: 130, flexGrow: 1 }}><Button label={(adoptionAge === age ? '✓ ' : '') + (age === 0 ? 'Infant' : 'Age ' + age)} accessibilityLabel={displayText(age === 0 ? 'Infant' : 'Age ' + age)} accessibilityRole="radio" accessibilityState={{ checked: adoptionAge === age }} tone={adoptionAge === age ? 'primary' : 'secondary'} disabled={busy} onPress={() => setAdoptionAge(age)} /></View>)}</View>{(isConfined(world) || adoptedThisYear) && <Body muted>{isConfined(world) ? 'Adoption placement is unavailable in custody.' : 'You already adopted this year. You can apply again next calendar year.'}</Body>}<Button label="Review Adoption" disabled={!adult || isConfined(world) || busy || adoptedThisYear} onPress={openAdoption} /></Card>}
    <EventModal event={event} busy={busy} error={error} onCancel={() => {
      if (!latest.current.busy && !submitting.current && liveReview.current === confirm) { liveReview.current = null; setConfirm(null); }
    }} onChoose={async () => {
      const state = latest.current;
      if (!mounted.current || !confirm || liveReview.current !== confirm || state.busy || submitting.current || state.world.id !== confirm.lifeId || state.world.activePersonId !== confirm.personId || state.world.revision !== confirm.revision) return;
      submitting.current = true;
      try { if (await dispatch({ type: 'adopt', age: confirm.age }) && mounted.current && liveReview.current === confirm) { liveReview.current = null; setConfirm(null); } }
      finally { submitting.current = false; }
    }} />
  </Page>;
}
