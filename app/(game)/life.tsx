import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { ageOn, fullName } from '../../src/game/model';
import { countries } from '../../src/game/countries';
import { formatMoney } from '../../src/game/money';
import { Body, Card, Heading, Page, Portrait, StatBar } from '../../src/ui/components';
import { useColors } from '../../src/ui/theme';

export default function Life() {
  const world = useGame(s => s.world)!;
  const c = useColors();
  const player = world.people[world.activePersonId];
  const account = world.accounts.find(a => a.ownerId === player.id)!;
  const entries = world.journal.filter(entry => entry.personId === player.id);
  return <Page>
    <Pressable accessibilityRole="button" accessibilityLabel="My Life profile" onPress={() => router.push('/profile')} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 12 }}>
      <Portrait name={fullName(player)} />
      <View style={{ flex: 1 }}><Heading size={20}>{fullName(player)}</Heading><Body muted>{ageOn(player, world.date) === 0 ? 'Newborn' : 'Age ' + ageOn(player, world.date)} · {player.country}</Body></View>
      <View style={{ alignItems: 'flex-end' }}><Heading size={17}>{formatMoney({ minor: account.cash, currency: account.currency }, countries[player.country].locale)}</Heading><Body muted>Bank Balance</Body></View>
    </Pressable>
    <View>
      <StatBar label="Happiness" value={player.stats.happiness} color={c.green} />
      <StatBar label="Health" value={player.stats.health} color={c.teal} />
      <StatBar label="Smarts" value={player.stats.smarts} color={c.blue} />
      <StatBar label="Looks" value={player.stats.looks} color={c.purple} />
      <StatBar label="Respect" value={player.stats.respect} color={c.amber} />
    </View>
    <Card>
      <Heading size={20}>Age: {ageOn(player, world.date)}</Heading>
      {entries.map(entry => <Body key={entry.id} muted>{entry.text}</Body>)}
    </Card>
  </Page>;
}
