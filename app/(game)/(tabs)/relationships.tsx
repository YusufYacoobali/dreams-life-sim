import React, { useMemo, useRef, useState } from 'react';
import { FlatList, Keyboard, Pressable, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useGame } from '../../../src/state/useGame';
import { ageOn, fullName } from '../../../src/game/model';
import { Body, Button, Card, Header } from '../../../src/ui/components';
import { RelationshipRow } from '../../../src/ui/RelationshipRow';
import { ThemedStatusBar, useColors } from '../../../src/ui/theme';
import { FilterTabs } from '../../../src/ui/FilterTabs';
import { Relationship, relationLabel } from '../../../src/game/systems/relationships';
import { DisplayText as Text, displayText } from '../../../src/ui/DisplayText';

const filters = [{ id: 'all', label: 'All' }, { id: 'family', label: 'Family' }, { id: 'friends', label: 'Friends' }, { id: 'romance', label: 'Romance' }] as const;
type Filter = typeof filters[number]['id'];
const shortcuts = [
  { label: 'Pets', accessible: 'Household Pets', icon: 'paw', route: '/pets' },
  { label: 'Family', accessible: 'Family & Children', icon: 'people', route: '/family' },
  { label: 'Tree', accessible: 'Family Tree', icon: 'git-network', route: '/family-tree' },
  { label: 'Home', accessible: 'My Household', icon: 'home', route: '/household' },
] as const;

export default function Relationships() {
  const world = useGame(s => s.world), c = useColors(), list = useRef<FlatList<Relationship>>(null);
  const { width, fontScale } = useWindowDimensions(), wrapShortcuts = width < 360 || fontScale >= 1.2;
  const [filter, setFilter] = useState<Filter>('all'), [query, setQuery] = useState('');
  const contacts = useMemo(() => {
    if (!world) return [];
    const search = query.trim().toLocaleLowerCase();
    return world.relationships.filter(edge => {
      if (edge.from !== world.activePersonId && edge.to !== world.activePersonId) return false;
      if (filter === 'family' && !edge.roles.some(role => role === 'parent' || role === 'guardian' || role === 'sibling') && edge.romance !== 'married' && edge.romance !== 'widowed') return false;
      if (filter === 'friends' && !edge.roles.includes('friend')) return false;
      if (filter === 'romance' && edge.romance === 'none') return false;
      return !search || fullName(world.people[edge.from === world.activePersonId ? edge.to : edge.from]).toLocaleLowerCase().includes(search);
    });
  }, [world?.relationships, world?.people, world?.activePersonId, filter, query]);
  if (!world) return <Redirect href="/" />;
  const open = (route: typeof shortcuts[number]['route'] | '/meet-people') => { Keyboard.dismiss(); router.push(route); };
  return <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}><ThemedStatusBar />
    <FlatList ref={list} data={contacts} keyExtractor={item => item.id} initialNumToRender={8} maxToRenderPerBatch={8} windowSize={7} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      ListHeaderComponent={<View style={{ gap: 16, paddingBottom: 16 }}>
        <Header title="Relationships" trailing={<Pressable accessibilityRole="button" accessibilityLabel="Meet New People" onPress={() => open('/meet-people')} style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="add" size={28} color={c.blue} /></Pressable>} />
        <FilterTabs values={filters} selected={filter} onSelect={value => { setFilter(value); list.current?.scrollToOffset({ offset: 0, animated: false }); }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, borderRadius: 12 }}>
          <TextInput accessibilityLabel="Search relationships" placeholder="Search by name" placeholderTextColor={c.muted} value={query} onChangeText={setQuery} style={{ flex: 1, minHeight: 48, paddingHorizontal: 14, color: c.ink, fontSize: 16 }} />
          {!!query && <Pressable accessibilityRole="button" accessibilityLabel="Clear relationship search" onPress={() => setQuery('')} style={{ minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="close-circle" size={22} color={c.muted} /></Pressable>}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{shortcuts.map(item => <Pressable key={item.route} accessibilityRole="button" accessibilityLabel={displayText(item.accessible)} onPress={() => open(item.route)} style={({ pressed }) => ({ flexGrow: 1, flexBasis: wrapShortcuts ? '46%' : 0, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8, borderRadius: 10, backgroundColor: pressed ? c.selected : c.inset })}><Ionicons name={item.icon} color={c.blue} size={20} /><Text style={{ color: c.ink, fontSize: 13, flexShrink: 1 }}>{item.label}</Text></Pressable>)}</View>
      </View>}
      ListEmptyComponent={<Card><Body muted>{query.trim() ? 'No matching names in this view.' : filter === 'all' ? 'Your connections will appear here.' : filter === 'family' ? 'No family connections in this record yet.' : filter === 'friends' ? 'Your friendships will appear here as you get to know people.' : 'Your current and past partners will appear here.'}</Body>{(query.trim() || filter !== 'all') ? <Button label="Show All Connections" tone="secondary" onPress={() => { setQuery(''); setFilter('all'); Keyboard.dismiss(); list.current?.scrollToOffset({ offset: 0, animated: false }); }} /> : <Body muted>Use the + button to meet someone new.</Body>}</Card>}
      renderItem={({ item: edge, index }) => {
        const person = world.people[edge.from === world.activePersonId ? edge.to : edge.from], name = fullName(person);
        return <RelationshipRow person={person} name={name} role={relationLabel(world,edge)} age={ageOn(person,world.date)} strength={edge.strength}
          first={index===0} last={index===contacts.length-1} onPress={()=>{Keyboard.dismiss();router.push({pathname:'/person/[id]',params:{id:person.id}});}} />;
      }}
    />
  </SafeAreaView>;
}
