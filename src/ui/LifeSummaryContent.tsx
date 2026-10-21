import React, { useMemo, useState } from 'react';
import { FlatList, Modal, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ageOn, fullName, World } from '../game/model';
import { Body, Button, Card, Header, Heading, Portrait } from './components';
import { countries } from '../game/countries';
import { EstateDetails } from './EstateDetails';
import { lifeProgress } from '../progression/progress';
import { LifetimeStatisticsContent } from './LifetimeStatisticsContent';
import { ThemedStatusBar, useColors } from './theme';

export function LifeSummaryContent({ world, personId = world.activePersonId, readOnly = false }: { world: World; personId?: string; readOnly?: boolean }) {
  const c = useColors(), person = world.people[personId];
  const identity = JSON.stringify([world.id, personId]);
  const [statisticsFor, setStatisticsFor] = useState<string | null>(null);
  const entries = useMemo(() => world.journal.filter(entry => entry.personId === personId), [world.journal, personId]);
  const progress = useMemo(() => lifeProgress(world, personId), [world, personId]);
  if (!person) return null;
  if (statisticsFor === identity) return <Modal visible animationType="none" presentationStyle="fullScreen" onRequestClose={() => setStatisticsFor(null)}><SafeAreaProvider style={{ flex: 1, backgroundColor: c.background }}><LifetimeStatisticsContent world={world} personId={personId} readOnly={readOnly} bottomSafeArea onBack={() => setStatisticsFor(null)} /></SafeAreaProvider></Modal>;
  const earned = progress?.achievements.filter(item => item.complete) ?? [];
  const dateLabel = (date: typeof world.date) => date.year + '-' + String(date.month).padStart(2, '0') + '-' + String(date.day).padStart(2, '0');
  return <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: c.background }}><ThemedStatusBar />
    <FlatList key={person.id} data={entries} keyExtractor={entry => entry.id} initialNumToRender={8} maxToRenderPerBatch={8} windowSize={7} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 16 }}
      ListHeaderComponent={<View style={{ gap: 16 }}><Header title="Life Summary" onBack={() => router.back()} />{readOnly && <Body muted>Saved life · Read-only</Body>}
        <Card><View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}><Portrait name={fullName(person)} appearance={person.appearance} age={ageOn(person, world.date)} size={80} decorative /><View style={{ flexGrow: 1, flexBasis: 170, minWidth: 0, gap: 6 }}><Heading>{fullName(person)}</Heading><Body>{person.died ? 'Age at death' : 'Age'} {ageOn(person, world.date)} · {person.born.year}–{person.died?.year ?? world.date.year}</Body></View></View><Body muted>Born {dateLabel(person.born)}</Body>{person.died && <><Body muted>Died {dateLabel(person.died)}</Body>{person.causeOfDeath && <Body>{person.causeOfDeath}</Body>}</>}<Body muted>Last recorded location: {person.city}, {countries[person.country].name}</Body></Card>
        <EstateDetails world={world} personId={person.id} />
        <Card><Heading size={19}>Recorded milestones</Heading><Body muted>{earned.length} completed {earned.length === 1 ? 'milestone' : 'milestones'} in this person’s records</Body>{earned.length ? earned.map(item => <Body key={item.id}>{item.title}</Body>) : <Body muted>No completed milestones in this person’s records yet.</Body>}</Card>
        <Button label="View Statistics" tone="secondary" onPress={() => setStatisticsFor(identity)} />
        {!readOnly && <Button label="Time Machine" tone="secondary" onPress={() => router.push('/time-machine')} />}
        <View style={{ gap: 6 }}><Heading size={20}>Recorded Journal</Heading><Body muted>{entries.length} {entries.length === 1 ? 'entry' : 'entries'} · Recorded order</Body></View>
      </View>}
      ListEmptyComponent={<Card><Body muted>No journal entries are recorded for this person.</Body></Card>}
      renderItem={({ item: entry }) => <Card><Heading size={16}>{dateLabel(entry.date)}</Heading><Body>{entry.text}</Body></Card>}
    />
  </SafeAreaView>;
}
