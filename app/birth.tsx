import { royalMembership } from '../src/game/systems/royaltySchemas';
import { royalTitle } from '../src/game/systems/royaltyMath';
import React, { useCallback } from 'react';
import { BackHandler, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useGame } from '../src/state/useGame';
import { countries } from '../src/game/countries';
import { ageOn, fullName } from '../src/game/model';
import { Body, Button, Card, Heading, Page, Portrait } from '../src/ui/components';
import { countryFlags, nationalityLabels } from '../src/ui/CreationElements';
import { useColors } from '../src/ui/theme';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export default function Birth() {
  const world = useGame(s => s.world), acknowledge = useGame(s => s.acknowledgeBirth), busy = useGame(s => s.busy), error = useGame(s => s.error), c = useColors();
  useFocusEffect(useCallback(() => { const listener = BackHandler.addEventListener('hardwareBackPress', () => true); return () => listener.remove(); }, []));
  if (!world) return <Redirect href="/" />;
  if (world.birthAcknowledged) return <Redirect href="/life" />;
  const player = world.people[world.activePersonId], parents = world.relationships.filter(edge => edge.roles.includes('parent') && edge.to === player.id).map(edge => world.people[edge.from]);
  const born = months[player.born.month - 1] + ' ' + player.born.day + ', ' + player.born.year, membership = royalMembership(world);
  return <Page bottomSafeArea><StatusBar style="dark" />
    <View style={{ alignItems: 'center', paddingTop: 26, gap: 14 }}>
      <View style={{ width: 230, height: 180, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ backgroundColor: '#D9F2FE', width: 158, height: 158, borderRadius: 79, alignItems: 'center', justifyContent: 'center' }}><Portrait name={fullName(player)} appearance={player.appearance} age={0} size={145} /></View>
        <Ionicons name="heart" color="#FF8E8A" size={24} style={{ position: 'absolute', left: 10, top: 20 }} /><Ionicons name="star" color="#FFD060" size={28} style={{ position: 'absolute', right: 0, top: 65 }} /><View style={{ position: 'absolute', left: 0, top: 110, width: 11, height: 11, borderRadius: 6, backgroundColor: '#8BDCF1' }} />
      </View>
      <Heading centered size={28}>Welcome to the World!</Heading><Body muted centered>You were born on {born}{"\n"}in {player.city}, {countries[player.country].name}.</Body>
    </View>
    <Card style={{ gap: 0 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingBottom: 14 }}><Portrait name={fullName(player)} appearance={player.appearance} age={0} size={48} /><View style={{ flex: 1 }}><Heading size={20}>{fullName(player)}</Heading><Body muted>{countryFlags[player.nationality]} {nationalityLabels[player.nationality]}</Body></View></View>
      {membership && <View style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.line }}><Body>{royalTitle(world, membership.house, player.id)} · {membership.house.name}</Body></View>}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.line }}><Ionicons name={player.gender === 'male' ? 'male' : player.gender === 'female' ? 'female' : 'person'} size={28} color={c.blue} /><Body>{player.gender === 'nonbinary' ? 'Non-binary' : player.gender === 'male' ? 'Male' : 'Female'}</Body></View>
      <View style={{ flexDirection: 'row', gap: 15, paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.line }}><Ionicons name="people" size={28} color={c.purple} /><View style={{ flex: 1 }}><Heading size={16}>{parents.length === 1 ? 'Parent' : 'Parents'}</Heading>{parents.map(parent => <Body key={parent.id} muted>{fullName(parent)} · {parent.gender === 'female' ? 'Mother' : parent.gender === 'male' ? 'Father' : 'Parent'}, {ageOn(parent, world.date)}</Body>)}</View></View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.line }}><Ionicons name="home" size={28} color={c.teal} /><View style={{ flex: 1 }}><Heading size={16}>Hometown</Heading><Body muted>{player.city}, {countries[player.country].name}</Body></View></View>
    </Card>
    <Card style={{ backgroundColor: c.inset }}><Body centered>Your story starts here. A family to meet, a world to discover, and plenty of decisions ahead.</Body></Card>
    {error && <Text accessibilityRole="alert" style={{ color: c.red, lineHeight: 21 }}>{error}</Text>}
    <Button label="Begin Life!" busy={busy} onPress={async () => { if (await acknowledge()) router.replace('/life'); }} />
  </Page>;
}
