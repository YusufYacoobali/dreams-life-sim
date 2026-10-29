import React, { useMemo } from 'react';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { World } from '../game/model';
import { lifetimeStatistics } from './lifetimeStatistics';
import { Body, Card, Header, Heading, Portrait, StatBar } from './components';
import { ThemedStatusBar, useColors } from './theme';
import { displayText } from './DisplayText';

export function LifetimeStatisticsContent({ world, personId, onBack, bottomSafeArea = false, readOnly = false, systemBarBackground }: {
  world: World; personId: string | undefined; onBack: () => void; bottomSafeArea?: boolean; readOnly?: boolean; systemBarBackground?: string;
}) {
  const c = useColors();
  const statistics = useMemo(() => personId ? lifetimeStatistics(world, personId) : null, [world, personId]);
  const person = personId ? world.people[personId] : undefined;
  return <SafeAreaView edges={bottomSafeArea ? ['top', 'bottom'] : ['top']} style={{ flex: 1, backgroundColor: systemBarBackground ?? c.background }}><ThemedStatusBar />
    <View style={{ paddingHorizontal: 16, paddingBottom: 16, backgroundColor: c.background }}><Header title="Statistics" onBack={onBack} /></View>
    <FlatList key={world.id + ':' + personId} accessibilityLabel="Lifetime statistics" style={{ flex: 1, backgroundColor: c.background }} data={statistics?.sections ?? []} keyExtractor={section => section.id} initialNumToRender={3} maxToRenderPerBatch={3} windowSize={5} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 16 }}
      ListHeaderComponent={<View style={{ gap: 16 }}>{readOnly && <Body muted>Saved life · Read-only</Body>}{statistics && person ? <><View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}><Portrait decorative name={statistics.name} personId={person.id} appearance={person.appearance} age={statistics.age} size={64} /><View style={{ flex: 1, minWidth: 0, gap: 4 }}><Heading size={22}>{statistics.name}</Heading><Body>{statistics.died ? 'Age at death' : 'Age'} {statistics.age}</Body><Body muted>This person and timeline</Body></View></View><Body muted>Recorded history only. Older saves and background periods can be incomplete. Zero means none recorded, not proof that something never happened. No projected income or reconstructed activity is included.</Body><Card><Heading size={19}>{statistics.died ? 'Last Recorded Stats' : 'Current Stats'}</Heading>{(['happiness', 'health', 'smarts', 'looks', 'respect', 'energy', 'fitness', 'stress', 'discipline', 'fame'] as const).map(stat => <StatBar key={stat} label={stat[0].toUpperCase() + stat.slice(1)} value={person.stats[stat]} color={stat === 'stress' ? c.amber : c.green} />)}</Card></> : <Body>This person’s statistics are unavailable.</Body>}</View>}
      renderItem={({ item: section }) => <Card><Heading size={19}>{section.title}</Heading>{section.note && <Body muted>{section.note}</Body>}{section.rows.length ? section.rows.map(row => <View key={row.id} accessible accessibilityLabel={displayText(row.label + ': ' + row.value)} style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }}><View style={{ flexBasis: '65%', flexGrow: 1 }}><Body>{row.label}</Body></View><View style={{ flexShrink: 1, maxWidth: '100%' }}><Body>{row.value}</Body></View></View>) : <Body muted>No qualifying receipts are retained for this person.</Body>}</Card>}
    />
  </SafeAreaView>;
}
