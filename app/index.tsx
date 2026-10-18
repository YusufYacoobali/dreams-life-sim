import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import { Body, Button, Card, Heading, Page } from '../src/ui/components';
import { Illustration } from '../src/assets/Illustration';
import { freshSeed, gameStore, useGame } from '../src/state/useGame';
import { fullName } from '../src/game/model';

export default function Welcome() {
  const ready = useGame(s => s.ready);
  const world = useGame(s => s.world);
  const busy = useGame(s => s.busy);
  const error = useGame(s => s.error);
  const bootstrap = useGame(s => s.bootstrap);
  const lives = useGame(s => s.lives);
  const selectLife = useGame(s => s.selectLife);
  if (!ready) return <Page><ActivityIndicator accessibilityLabel="Opening your saved lives" /></Page>;
  const open = () => router.push(world?.birthAcknowledged ? '/life' : '/birth');
  return <Page>
    <View style={{ alignItems: 'center', paddingTop: 54, paddingBottom: 22, gap: 10 }}>
      <Illustration id="property" size={150} label="A home for your next life" />
      <Heading size={40} centered>Dreams</Heading>
      <Heading size={22} centered>Life Simulator</Heading>
      <Body muted centered>A whole life. A few questionable decisions.</Body>
    </View>
    {error && <Card><Body>{error}</Body><Button label="Try again" onPress={() => { void bootstrap(); }} busy={busy} /></Card>}
    {world && <Button label={'Continue as ' + fullName(world.people[world.activePersonId])} onPress={open} />}
    <Button label="Create a Life" onPress={() => router.push({ pathname: '/new-life', params: { seed: freshSeed().toString() } })} />
    <Button label="Random Life" tone="secondary" onPress={() => router.push({ pathname: '/new-life', params: { seed: freshSeed().toString() } })} />
    {lives.length > 1 && <Card>
      <Heading size={18}>Saved lives</Heading>
      {lives.filter(life => life.id !== world?.id).map(life => <Button key={life.id} label={life.name} tone="secondary" disabled={busy} onPress={async () => {
        if (await selectLife(life.id)) {
          const current = gameStore.getState().world;
          router.push(current?.birthAcknowledged ? '/life' : '/birth');
        }
      }} />)}
    </Card>}
  </Page>;
}
