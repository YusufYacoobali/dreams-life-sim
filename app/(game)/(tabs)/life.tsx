import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../../src/state/useGame';
import { ageOn, fullName } from '../../../src/game/model';
import { countries } from '../../../src/game/countries';
import { formatMoney } from '../../../src/game/money';
import { Body, Button, Card, Heading, Page, Portrait, StatBar } from '../../../src/ui/components';
import { useColors } from '../../../src/ui/theme';
import { jobs } from '../../../src/game/content/jobs';
import { accountFor } from '../../../src/game/systems/common';
import { activeSentence, isConfined } from '../../../src/game/systems/legalSchemas';

export default function Life() {
  const world = useGame(s => s.world)!;
  const c = useColors();
  const dispatch = useGame(s => s.dispatch);
  const busy = useGame(s => s.busy);
  const error = useGame(s => s.error);
  const player = world.people[world.activePersonId];
  const account = accountFor(world);
  const occupation = activeSentence(world) ? 'Prisoner' : isConfined(world) ? 'Held on remand' : player.legal.wanted ? 'Fugitive' : world.businesses.some(item => item.ownerId === player.id && item.status === 'active') && ageOn(player, world.date) >= 18 ? 'Business Owner' : world.musicReleases.some(item=>item.personId===player.id&&['recording','paused'].includes(item.status)) ? 'Musician' : world.elections.some(item=>item.status==='campaign'&&item.candidates.some(candidate=>candidate.personId===player.id&&candidate.status==='active')) ? 'Political Candidate' : player.employment ? jobs.find(role => role.id === player.employment!.roleId)?.title : player.education.stage !== 'none' ? 'Student' : ageOn(player, world.date) === 0 ? 'Newborn' : ageOn(player, world.date) < 18 ? 'Child' : player.finance.pensionAnnual > 0n ? 'Retired' : 'Unemployed';
  const entries = world.journal.filter(entry => entry.personId === player.id);
  const years = new Map<number, typeof entries>();
  for (const entry of entries) {
    const age = ageOn({ ...player, died: null }, entry.date);
    years.set(age, [...(years.get(age) ?? []), entry]);
  }
  return <Page>
    <Pressable accessibilityRole="button" accessibilityLabel="My Life profile" onPress={() => router.push('/profile')} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 12 }}>
      <Portrait name={fullName(player)} appearance={player.appearance} age={ageOn(player, world.date)} />
      <View style={{ flex: 1 }}><Heading size={20}>{fullName(player)}</Heading><Body muted>{occupation} · Age {ageOn(player, world.date)} · {player.country}</Body></View>
      <View style={{ alignItems: 'flex-end' }}><Heading size={17}>{formatMoney({ minor: account.cash, currency: account.currency }, countries[player.country].locale)}</Heading><Body muted>Bank Balance</Body></View>
    </Pressable>
    <View>
      <StatBar label="Happiness" value={player.stats.happiness} color={c.green} />
      <StatBar label="Health" value={player.stats.health} color={c.teal} />
      <StatBar label="Smarts" value={player.stats.smarts} color={c.blue} />
      <StatBar label="Looks" value={player.stats.looks} color={c.purple} />
      <StatBar label="Respect" value={player.stats.respect} color={c.amber} />
    </View>
    {error && <Body>{error}</Body>}
    {(isConfined(world) || player.legal.wanted) && <Button label={isConfined(world) ? 'View Custody & Court' : 'View Outstanding Pursuit'} tone="secondary" onPress={() => router.push(isConfined(world) ? '/prison' : '/crime')} />}
    <Button label={world.annual ? 'Continue This Year' : 'Age Up'} tone="positive" busy={busy} disabled={!!world.pending} onPress={() => { void dispatch({ type: world.annual ? 'resume' : 'advance' }); }} />
    <Card>{[...years.entries()].reverse().map(([age, facts]) => <View key={age} style={{ gap: 8 }}><Heading size={20}>Age: {age}</Heading>{facts.map(entry => <Body key={entry.id} muted>{entry.text}</Body>)}</View>)}</Card>
  </Page>;
}
