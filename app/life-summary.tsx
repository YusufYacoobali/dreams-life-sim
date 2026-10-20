import React, { useMemo } from 'react';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useGame } from '../src/state/useGame';
import { ageOn, fullName } from '../src/game/model';
import { Body, Button, Card, Header, Heading } from '../src/ui/components';
import { EstateDetails } from '../src/ui/EstateDetails';
import { lifeProgress } from '../src/progression/progress';
import { ThemedStatusBar, useColors } from '../src/ui/theme';

export default function LifeSummary() {
  const world = useGame(s => s.world);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const c = useColors(), person = world?.people[id ?? world.activePersonId];
  const entries = useMemo(() => world && person ? world.journal.filter(entry => entry.personId === person.id) : [], [world?.journal, person?.id]);
  const progress = useMemo(() => world && person ? lifeProgress(world, person.id) : null, [world, person?.id]);
  if (!world) return <Redirect href="/" />;
  if (!person) return <Redirect href="/" />;
  const earned = progress?.achievements.filter(item => item.complete) ?? [];
  return <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: c.background }}><ThemedStatusBar />
    <FlatList key={person.id} data={entries} keyExtractor={entry => entry.id} initialNumToRender={8} maxToRenderPerBatch={8} windowSize={7} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 16 }}
      ListHeaderComponent={<View style={{ gap: 16 }}><Header title="Life Summary" onBack={() => router.back()} /><Heading>{fullName(person)}</Heading><Body>{person.died ? 'Age at death' : 'Age'} {ageOn(person, world.date)} · {person.born.year}–{person.died?.year ?? world.date.year}</Body>
        <EstateDetails world={world} personId={person.id} />
        <Card><Heading size={19}>Recorded milestones</Heading>{earned.length ? earned.map(item => <Body key={item.id}>{item.title}</Body>) : <Body muted>No completed milestones in this person’s records yet.</Body>}</Card>
        <Button label="Time Machine" tone="secondary" onPress={() => router.push('/time-machine')} />
      </View>}
      renderItem={({ item: entry }) => <Card><Heading size={16}>{entry.date.year}</Heading><Body>{entry.text}</Body></Card>}
    />
  </SafeAreaView>;
}
