import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Keyboard, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { ageOn, fullName } from '../../src/game/model';
import { currentWorkplace, Workplace, WorkplaceMember } from '../../src/game/systems/workplaceSchemas';
import { colleagueAway, workplaceReason } from '../../src/game/systems/workplaces';
import { relationFor } from '../../src/game/systems/relationships';
import { ActionRow, Body, Button, Card, Header, Heading, Portrait, StatBar } from '../../src/ui/components';
import { ThemedStatusBar, useColors } from '../../src/ui/theme';

type Row = { key: string; kind: 'person'; member: WorkplaceMember } | { key: string; kind: 'history'; place: Workplace } | { key: string; kind: 'history-heading' };
export default function Coworkers() {
  const { workplace: selectedId } = useLocalSearchParams<{ workplace?: string }>();
  const world = useGame(s => s.world), busy = useGame(s => s.busy), error = useGame(s => s.error), dispatch = useGame(s => s.dispatch), c = useColors();
  const [query, setQuery] = useState('');
  const current = world && currentWorkplace(world), place = world && (selectedId ? world.workplaces.find(item => item.id === selectedId && item.personId === world.activePersonId) : current);
  useEffect(() => { setQuery(''); }, [place?.id]);
  const history = useMemo(() => world ? world.workplaces.filter(item => item.personId === world.activePersonId && item.ended).slice().reverse() : [], [world]);
  const rows = useMemo<Row[]>(() => {
    if (!world) return [];
    const search = query.trim().toLocaleLowerCase(), latest = new Map<string, WorkplaceMember>();
    for (const member of place?.members ?? []) latest.set(member.personId, member);
    const contacts: Row[] = [...latest.values()].filter(member => fullName(world.people[member.personId]).toLocaleLowerCase().includes(search))
      .sort((a, b) => Number(!!a.left) - Number(!!b.left) || Number(a.role !== 'supervisor') - Number(b.role !== 'supervisor') || fullName(world.people[a.personId]).localeCompare(fullName(world.people[b.personId])))
      .map(member => ({ key: 'person:' + member.personId, kind: 'person', member }));
    if (!selectedId && !search && history.length) contacts.push({ key: 'history-heading', kind: 'history-heading' }, ...history.map(item => ({ key: item.id, kind: 'history' as const, place: item })));
    return contacts;
  }, [world, place, query, history, selectedId]);
  if (!world) return <Redirect href="/" />;
  const player = world.people[world.activePersonId], introductionReason = workplaceReason(world);
  return <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}><ThemedStatusBar />
    <FlatList data={rows} keyExtractor={item => item.key} initialNumToRender={8} maxToRenderPerBatch={8} windowSize={7} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      ListHeaderComponent={<View style={{ gap: 16, paddingBottom: 16 }}>
        <Header title="Coworkers" onBack={() => router.back()} />
        {place ? <><Heading size={18}>{place.employer}</Heading><Body muted>{place.city} · {place.ended ? 'Former workplace · ' + place.started.year + '–' + place.ended.year : 'Your current team'}</Body>
          <TextInput accessibilityLabel="Search coworkers" placeholder="Search by name" placeholderTextColor={c.muted} value={query} onChangeText={setQuery} style={{ color: c.ink, backgroundColor: c.surface, minHeight: 48, padding: 14, borderRadius: 12, fontSize: 16 }} />
        </> : selectedId ? <Card><Body>This workplace is not in your employment history.</Body></Card> : <Card>
          <Heading size={18}>{player.employment?.employer ?? 'No current workplace'}</Heading>
          <Body muted>{introductionReason ?? 'Introduce yourself to your supervisor and the people on your team.'}</Body>
          {!introductionReason && <Button label="Introduce Yourself" busy={busy} onPress={() => void dispatch({ type: 'meet-coworkers' })} />}
          {!player.employment && <Button label="Find a Job" onPress={() => router.push('/jobs')} />}
        </Card>}
        {error && <Body>{error}</Body>}
      </View>}
      ListEmptyComponent={place ? <Card><Body muted>{query.trim() ? 'No matching names.' : 'No colleagues are recorded here.'}</Body></Card> : null}
      renderItem={({ item }) => {
        if (item.kind === 'history-heading') return <View style={{ paddingVertical: 16 }}><Heading size={18}>Previous Workplaces</Heading></View>;
        if (item.kind === 'history') return <Card style={{ marginBottom: 12 }}><ActionRow title={item.place.employer} subtitle={item.place.started.year + '–' + item.place.ended!.year + ' · ' + item.place.city} onPress={() => { Keyboard.dismiss(); router.push({ pathname: '/coworkers', params: { workplace: item.place.id, tab: 'activities' } }); }} /></Card>;
        const member = item.member, person = world.people[member.personId], relation = relationFor(world, world.activePersonId, person.id)!;
        const former = !!place?.ended || !!member.left, role = member.role === 'supervisor' ? 'Supervisor' : 'Coworker';
        const subtitle = person.died ? role + ' · Died in ' + person.died.year : former ? 'Former ' + role.toLowerCase() : role + (colleagueAway(world, person) ? ' · Currently away' : '');
        return <Card style={{ marginBottom: 12 }}><ActionRow title={fullName(person)} subtitle={subtitle} icon={<Portrait name={fullName(person)} appearance={person.appearance} age={ageOn(person, world.date)} size={48} />} onPress={() => { Keyboard.dismiss(); router.push({ pathname: '/person/[id]', params: { id: person.id, tab: 'activities' } }); }} /><StatBar label="Relationship" value={relation.strength} color={c.green} /></Card>;
      }} />
  </SafeAreaView>;
}
