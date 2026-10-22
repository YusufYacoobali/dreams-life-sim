import React, { useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useGame } from '../src/state/useGame';
import { ageOn, fullName } from '../src/game/model';
import { childrenOf } from '../src/game/systems/family';
import { Body, Button, Card, Header, Heading, Page, Portrait } from '../src/ui/components';
import { EventModal } from '../src/ui/EventModal';
import { EstateDetails } from '../src/ui/EstateDetails';
import { FamilyArt } from '../src/assets/FamilyArt';
import { countries } from '../src/game/countries';
import { formatMoney } from '../src/game/money';
import { useColors } from '../src/ui/theme';
export default function Legacy() {
  const world = useGame(s => s.world), dispatch = useGame(s => s.dispatch), busy = useGame(s => s.busy), error = useGame(s => s.error);
  const c = useColors(), { width, fontScale } = useWindowDimensions(), stacked = width < 360 || fontScale >= 1.2;
  const [selected, setSelected] = useState<string | null>(null);
  if (!world) return <Redirect href="/" />;
  const person = world.people[world.activePersonId]; if (!person.died) return <Redirect href="/life" />;
  const children = childrenOf(world).filter(child => !child.died), child = children.find(item => item.id === selected);
  const estate = world.estates.find(item => item.personId === person.id);
  return <Page bottomSafeArea><Header title="Continue as Child" onBack={() => router.back()} />
    <Card><View style={{ flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'stretch' : 'center', gap: 16 }}><FamilyArt id="family-tree" size={80} /><View style={{ flex: stacked ? undefined : 1, minWidth: 0, gap: 6 }}><Heading>Choose the Next Chapter</Heading><Body muted>After the life of {fullName(person)}</Body></View></View><Body>Continue the family story through one of your children, with their own life and finances. The date stays {world.date.year}-{String(world.date.month).padStart(2, '0')}.</Body><Body muted>{children.length} living {children.length === 1 ? 'child is' : 'children are'} available. Review a child before deciding.</Body></Card>
    {children.map(item => { const inheritance = estate?.distributions.find(share => share.personId === item.id); return <Card key={item.id} style={{ borderWidth: 1, borderColor: selected === item.id ? c.link : c.line }}><View style={{ flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'stretch' : 'center', gap: 16 }}><Portrait name={fullName(item)} personId={item.id} appearance={item.appearance} age={ageOn(item, world.date)} size={72} /><View style={{ flex: stacked ? undefined : 1, minWidth: 0, gap: 6 }}><Heading size={20}>{fullName(item)}</Heading><Body>Age {ageOn(item, world.date)} · {item.city}</Body><Body muted>{countries[item.country].name}</Body></View></View>{inheritance ? <View style={{ padding: 12, borderRadius: 12, backgroundColor: c.inset, gap: 6 }}><Heading size={17}>Recorded Inheritance</Heading><Body>{formatMoney(inheritance.cash)} cash</Body>{inheritance.assets.length > 0 && <Body muted>{inheritance.assets.length} specific {inheritance.assets.length === 1 ? 'bequest' : 'bequests'} · {formatMoney(inheritance.assetValue)}</Body>}<Body muted>From the recorded settlement of {fullName(person)}’s estate.</Body></View> : estate && <Body muted>No estate distribution is recorded for this child.</Body>}<Button label={'Continue as ' + item.firstName} accessibilityState={{ selected: selected === item.id }} disabled={busy} onPress={() => setSelected(item.id)} /></Card>; })}
    {children.length === 0 && <Card><FamilyArt id="blanket" size={64} /><Heading size={20}>No Living Child</Heading><Body>No living child is available.</Body></Card>}{error && !child && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, fontSize: 15, lineHeight: 22 }}>{error}</Text>}<EstateDetails world={world} personId={person.id} />
    <EventModal event={child ? { id: 'legacy:' + child.id, kind: 'confirmation', title: 'Continue as ' + child.firstName + '?', body: 'You will play as ' + fullName(child) + ' at their current age, with their own life and inheritance. A minor’s inheritance stays in trust until adulthood, except for necessary inherited-property costs.', terms: [], confirmLabel: 'Continue Their Life' } : null} busy={busy} error={error} onCancel={() => setSelected(null)} onChoose={async () => { if (child && await dispatch({ type: 'continue-child', personId: child.id })) { setSelected(null); router.replace('/life'); } }} />
  </Page>;
}
