import { royalMembership } from '../src/game/systems/royaltySchemas';
import { royalTitle } from '../src/game/systems/royaltyMath';
import React, { useCallback } from 'react';
import { BackHandler, View } from 'react-native';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useGame } from '../src/state/useGame';
import { countries } from '../src/game/countries';
import { fullName } from '../src/game/model';
import { Body, Button, Card, Heading, Page, Portrait } from '../src/ui/components';
import { Illustration } from '../src/assets/Illustration';

export default function Birth() {
  const world = useGame(s => s.world);
  const acknowledge = useGame(s => s.acknowledgeBirth);
  const busy = useGame(s => s.busy);
  const error = useGame(s => s.error);
  useFocusEffect(useCallback(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => listener.remove();
  }, []));
  if (!world) return <Redirect href="/" />;
  if (world.birthAcknowledged) return <Redirect href="/life" />;
  const player = world.people[world.activePersonId];
  const parents = world.relationships.filter(edge => edge.kind === 'parent' && edge.to === player.id).map(edge => world.people[edge.from]);
  return <Page>
    <View style={{ alignItems: 'center', paddingTop: 40, gap: 16 }}>
      <Portrait name={fullName(player)} appearance={player.appearance} age={0} size={112} />
      <Heading centered size={28}>Welcome to the World!</Heading>
      <Body muted centered>You were born in {player.city}, {countries[player.country].name}.</Body>
    </View>
    <Card>
      <Heading size={20}>{fullName(player)}</Heading>
      <Body>{countries[player.nationality].name}</Body>{royalMembership(world)&&<Body>{royalTitle(world,royalMembership(world)!.house,player.id)} · {royalMembership(world)!.house.name}</Body>}
      <Heading size={17}>Parents</Heading>
      {parents.map(parent => <Body key={parent.id}>{fullName(parent)}</Body>)}
      <Heading size={17}>Hometown</Heading>
      <Body>{player.city}</Body>
    </Card>
    <Card><Illustration id="relationship" size={44} /><Body>You have arrived. Nobody has asked you to pay rent yet.</Body></Card>
    {error && <Body>{error}</Body>}
    <Button label="Begin Life!" busy={busy} onPress={async () => { if (await acknowledge()) router.replace('/life'); }} />
  </Page>;
}
