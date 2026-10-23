import { royalMembership } from '../src/game/systems/royaltySchemas';
import { royalTitle } from '../src/game/systems/royaltyMath';
import React, { useCallback } from 'react';
import { BackHandler, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useGame } from '../src/state/useGame';
import { countries } from '../src/game/countries';
import { ageOn, fullName } from '../src/game/model';
import { Body, Button, Card, Heading, Page, Portrait } from '../src/ui/components';
import { countryFlags, nationalityLabels } from '../src/ui/CreationElements';
import { useColors } from '../src/ui/theme';
import { LifeMilestoneArt } from '../src/ui/LifeMilestoneArt';
import { DisplayText as Text } from '../src/ui/DisplayText';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export default function Birth() {
  const world = useGame(s => s.world), acknowledge = useGame(s => s.acknowledgeBirth), busy = useGame(s => s.busy), error = useGame(s => s.error), c = useColors();
  useFocusEffect(useCallback(() => { const listener = BackHandler.addEventListener('hardwareBackPress', () => true); return () => listener.remove(); }, []));
  if (!world) return <Redirect href="/" />;
  if (world.birthAcknowledged) return <Redirect href="/life" />;
  const player = world.people[world.activePersonId], parents = world.relationships.filter(edge => edge.roles.includes('parent') && edge.to === player.id).map(edge => world.people[edge.from]);
  const born = months[player.born.month - 1] + ' ' + player.born.day + ', ' + player.born.year, membership = royalMembership(world);
  return <Page bottomSafeArea footer={<>
    {error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, lineHeight: 21 }}>{error}</Text>}
    <Button label="Begin Life!" busy={busy} onPress={async () => { if (await acknowledge()) router.replace('/life'); }} />
  </>}>
    <View style={{ alignItems: 'center', paddingTop: 12, gap: 14 }}>
      <LifeMilestoneArt kind="birth" identity={JSON.stringify([world.id, player.id, player.born])}>
        <Portrait decorative name={fullName(player)} personId={player.id} appearance={player.appearance} age={0} size={145} />
      </LifeMilestoneArt>
      <Heading centered size={28}>Welcome to the World!</Heading><Body muted centered>You were born on {born}{"\n"}in {player.city}, {countries[player.country].name}.</Body>
    </View>
    <Card style={{ gap: 0 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingBottom: 14 }}><Portrait name={fullName(player)} personId={player.id} appearance={player.appearance} age={0} size={48} /><View style={{ flex: 1 }}><Heading size={20}>{fullName(player)}</Heading><Body muted>{countryFlags[player.nationality]} {nationalityLabels[player.nationality]}</Body></View></View>
      {membership && <View style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.line }}><Body>{royalTitle(world, membership.house, player.id)} · {membership.house.name}</Body></View>}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.line }}><Ionicons name={player.gender === 'male' ? 'male' : player.gender === 'female' ? 'female' : 'person'} size={28} color={c.blue} /><Body>{player.gender === 'nonbinary' ? 'Non-binary' : player.gender === 'male' ? 'Male' : 'Female'}</Body></View>
      <View style={{ flexDirection: 'row', gap: 15, paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.line }}><Ionicons name="people" size={28} color={c.purple} /><View style={{ flex: 1 }}><Heading size={16}>{parents.length === 1 ? 'Parent' : 'Parents'}</Heading>{parents.map(parent => <Body key={parent.id} muted>{fullName(parent)} · {parent.gender === 'female' ? 'Mother' : parent.gender === 'male' ? 'Father' : 'Parent'}, {ageOn(parent, world.date)}</Body>)}</View></View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.line }}><Ionicons name="home" size={28} color={c.teal} /><View style={{ flex: 1 }}><Heading size={16}>Hometown</Heading><Body muted>{player.city}, {countries[player.country].name}</Body></View></View>
    </Card>
    <Card style={{ backgroundColor: c.inset }}><Body centered>Tap Age Up to live through the next year. Your life pauses when a choice needs you.</Body></Card>
  </Page>;
}
