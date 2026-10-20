import React, { useMemo } from 'react';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ageOn, fullName, World } from '../game/model';
import { Body, Button, Card, Header, Heading } from './components';
import { EstateDetails } from './EstateDetails';
import { lifeProgress } from '../progression/progress';
import { ThemedStatusBar, useColors } from './theme';

export function LifeSummaryContent({ world, personId = world.activePersonId, readOnly = false }: { world: World; personId?: string; readOnly?: boolean }) {
  const c = useColors(), person = world.people[personId];
  const entries = useMemo(() => world.journal.filter(entry => entry.personId === personId), [world.journal, personId]);
  const progress = useMemo(() => lifeProgress(world, personId), [world, personId]);
  if (!person) return null;
  const earned = progress?.achievements.filter(item => item.complete) ?? [];
  return <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: c.background }}><ThemedStatusBar />
    <FlatList key={person.id} data={entries} keyExtractor={entry => entry.id} initialNumToRender={8} maxToRenderPerBatch={8} windowSize={7} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 16 }}
      ListHeaderComponent={<View style={{ gap: 16 }}><Header title="Life Summary" onBack={() => router.back()} />{readOnly && <Body muted>Saved life · Read-only</Body>}<Heading>{fullName(person)}</Heading><Body>{person.died ? 'Age at death' : 'Age'} {ageOn(person, world.date)} · {person.born.year}–{person.died?.year ?? world.date.year}</Body>
        <EstateDetails world={world} personId={person.id} />
        <Card><Heading size={19}>Recorded milestones</Heading>{earned.length ? earned.map(item => <Body key={item.id}>{item.title}</Body>) : <Body muted>No completed milestones in this person’s records yet.</Body>}</Card>
        {!readOnly && <Button label="Time Machine" tone="secondary" onPress={() => router.push('/time-machine')} />}
      </View>}
      renderItem={({ item: entry }) => <Card><Heading size={16}>{entry.date.year}</Heading><Body>{entry.text}</Body></Card>}
    />
  </SafeAreaView>;
}
