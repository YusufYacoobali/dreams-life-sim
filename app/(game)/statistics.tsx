import React, { useMemo } from 'react';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { lifetimeStatistics } from '../../src/ui/lifetimeStatistics';
import { Body, Card, Header, Heading, StatBar } from '../../src/ui/components';
import { ThemedStatusBar, useColors } from '../../src/ui/theme';

export default function Statistics() {
  const world = useGame(s => s.world), { id } = useLocalSearchParams<{ id?: string | string[] }>(), c = useColors();
  const personId = id === undefined ? world?.activePersonId : typeof id === 'string' ? id : undefined;
  const statistics = useMemo(() => world && personId ? lifetimeStatistics(world, personId) : null, [world, personId]);
  if (!world) return <Redirect href="/" />;
  const person = personId ? world.people[personId] : undefined;
  return <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: c.background }}><ThemedStatusBar />
    <FlatList key={world.id + ':' + personId} accessibilityLabel="Lifetime statistics" data={statistics?.sections ?? []} keyExtractor={section => section.id} initialNumToRender={3} maxToRenderPerBatch={3} windowSize={5} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 16 }}
      ListHeaderComponent={<View style={{ gap: 16 }}><Header title="Statistics" onBack={() => router.back()} />{statistics && person ? <><Heading>{statistics.name}</Heading><Body>{statistics.died ? 'Age at death' : 'Age'} {statistics.age} · This person and timeline</Body><Body muted>Recorded history only. Older saves and background periods can be incomplete. Zero means none recorded, not proof that something never happened. No projected income or reconstructed activity is included.</Body><Card><Heading size={19}>{statistics.died ? 'Last Recorded Stats' : 'Current Stats'}</Heading>{(['happiness', 'health', 'smarts', 'looks', 'respect', 'energy', 'fitness', 'stress', 'discipline', 'fame'] as const).map(stat => <StatBar key={stat} label={stat[0].toUpperCase() + stat.slice(1)} value={person.stats[stat]} color={stat === 'stress' ? c.amber : c.green} />)}</Card></> : <Body>This person’s statistics are unavailable.</Body>}</View>}
      renderItem={({ item: section }) => <Card><Heading size={19}>{section.title}</Heading>{section.note && <Body muted>{section.note}</Body>}{section.rows.length ? section.rows.map(row => <View key={row.id} accessible accessibilityLabel={row.label + ': ' + row.value} style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }}><View style={{ flexBasis: '65%', flexGrow: 1 }}><Body>{row.label}</Body></View><View style={{ flexShrink: 1, maxWidth: '100%' }}><Body>{row.value}</Body></View></View>) : <Body muted>No qualifying receipts are retained for this person.</Body>}</Card>}
    />
  </SafeAreaView>;
}
