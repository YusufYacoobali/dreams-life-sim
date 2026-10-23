import React, { useCallback, useMemo } from 'react';
import { BackHandler, Image, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useGame, freshSeed } from '../src/state/useGame';
import { ageOn, fullName } from '../src/game/model';
import { deathSummary } from '../src/ui/deathSummary';
import { Illustration } from '../src/assets/Illustration';
import { FamilyArt } from '../src/assets/FamilyArt';
import { LifeMilestoneArt } from '../src/ui/LifeMilestoneArt';
import { useFeedbackPress } from '../src/ui/feedback';
import { statTrackHeight } from '../src/ui/components';
import { DisplayText as Text, displayText } from '../src/ui/DisplayText';

export default function Death() {
  const world = useGame(s => s.world);
  const summary = useMemo(() => world ? deathSummary(world) : null, [world, world?.activePersonId]);
  const { width, fontScale } = useWindowDimensions(), stacked = width < 360 || fontScale >= 1.2;
  useFocusEffect(useCallback(() => { const subscription = BackHandler.addEventListener('hardwareBackPress', () => true); return () => subscription.remove(); }, []));
  if (!world) return <Redirect href="/" />;
  const player = world.people[world.activePersonId];
  if (!player.died) return <Redirect href="/life" />;
  const children = world.relationships.filter(relation => relation.kind === 'parent' && relation.from === player.id);
  const livingChildren = children.filter(relation => !world.people[relation.to].died);
  return <SafeAreaView style={{ flex: 1, backgroundColor: '#1B2433' }}><StatusBar style="light" /><ScrollView contentContainerStyle={{ padding: 26, gap: 18, alignItems: 'center' }}>
    <LifeMilestoneArt kind="death" identity={JSON.stringify([world.id, player.id, player.died])}><Image source={require('../assets/generated/death-memorial.png')} accessible={false} style={{ width: 170, height: 170 }} resizeMode="contain" /></LifeMilestoneArt>
    <Text accessibilityRole="header" style={{ color: 'white', fontWeight: '700', fontSize: 36 }}>You Died</Text>
    <Text style={{ color: 'white', fontSize: 22, fontWeight: '600', textAlign: 'center' }}>{fullName(player)}</Text>
    <Text style={{ color: '#C3CEDB', fontSize: 17 }}>Age {ageOn(player, world.date)} · {player.born.year}–{player.died.year}</Text>
    <Text style={{ color: '#C3CEDB', fontSize: 16, lineHeight: 24, textAlign: 'center' }}>Cause of death: {player.causeOfDeath || 'Not recorded'}</Text>
    <View style={{ backgroundColor: '#FFFFFF', width: '100%', borderRadius: 18, paddingHorizontal: 16 }}>
      <View style={{ paddingVertical: 18, gap: 9, borderBottomWidth: 1, borderBottomColor: '#E5EAF0' }}>
        <Text accessibilityRole="header" style={{ color: '#0B1545', fontSize: 22, fontWeight: '700' }}>Life at a Glance</Text>
        <Text style={{ color: '#40516C', fontSize: 16, lineHeight: 24 }}>{summary?.summary}</Text>
      </View>
      {summary?.rows.map(({ id, label, value, icon, tone }) => <View key={id} accessible accessibilityLabel={displayText(label + ': ' + value)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E5EAF0' }}>
        {icon === 'family' ? <FamilyArt id="family-tree" size={30} /> : <Illustration id={icon} size={30} />}
        <View style={{ flex: 1, minWidth: 0, flexDirection: stacked ? 'column' : 'row', gap: stacked ? 5 : 12 }}>
          <Text style={{ color: '#40516C', fontSize: 15, flex: stacked ? undefined : 1 }}>{label}</Text>
          <Text style={{ color: tone === 'negative' ? '#B72D39' : tone === 'positive' ? '#13823B' : '#0B1545', fontWeight: '600', fontSize: 15, flex: stacked ? undefined : 1, minWidth: 0, textAlign: stacked ? 'left' : 'right' }}>{value}</Text>
        </View>
      </View>)}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 15 }}>
        <Illustration id="wellbeing" size={30} />
        <View style={{ flex: 1, gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}><Text style={{ color: '#40516C', fontSize: 15, flex: 1 }}>Final happiness</Text><Text style={{ color: '#0B1545', fontSize: 15, fontWeight: '600', flexShrink: 1, textAlign: 'right' }}>{summary?.finalHappiness}%</Text></View>
          <View accessible accessibilityRole="progressbar" accessibilityLabel="Final happiness" accessibilityValue={{ min: 0, max: 100, now: summary?.finalHappiness }} style={{ height: statTrackHeight, borderRadius: statTrackHeight/2, backgroundColor: '#E5EAF0', overflow: 'hidden' }}><View style={{ width: `${summary?.finalHappiness ?? 0}%`, height: '100%', borderRadius: statTrackHeight/2, backgroundColor: '#28B65A' }} /></View>
        </View>
      </View>
      <Text style={{ color: '#61718B', fontSize: 15, lineHeight: 22, fontStyle: 'italic', textAlign: 'center', paddingTop: 2, paddingBottom: 18 }}>{summary?.epitaph}</Text>
    </View>
    <DeathButton label="View Life Summary" icon="chevron-forward" primary onPress={() => router.push('/life-summary')} />
    <DeathButton label="Start a New Life" icon="refresh" onPress={() => router.push({ pathname: '/new-life', params: { seed: freshSeed().toString() } })} />
    {livingChildren.length ? <DeathButton label="Continue as Child" icon="people" onPress={() => router.push('/legacy')} /> : <><Pressable accessibilityRole="button" accessibilityState={{ disabled: true }} accessibilityLabel="Continue as Child. No living child is available." disabled style={{ width: '100%', minHeight: 52, backgroundColor: '#354050', padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#C3CEDB', fontSize: 16, fontWeight: '600' }}>Continue as Child</Text></Pressable><Text style={{ color: '#C3CEDB', textAlign: 'center', fontSize: 14 }}>No living child is available to continue this life.</Text></>}
    <View style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
      <HistoryLink label="Journal" icon="book-outline" onPress={() => router.push('/life-summary')} />
      <HistoryLink label="Family Tree" icon="git-network-outline" onPress={() => router.push('/family-history')} />
    </View>
  </ScrollView></SafeAreaView>;
}
function HistoryLink({ label, icon, onPress }: { label: string; icon: 'book-outline' | 'git-network-outline'; onPress: () => void }) {
  const press = useFeedbackPress(onPress);
  return <Pressable accessibilityRole="button" accessibilityLabel={displayText(label)} onPress={press} style={({ pressed }) => ({ minHeight: 44, paddingHorizontal: 12, paddingVertical: 10, opacity: pressed ? 0.7 : 1, flexDirection: 'row', alignItems: 'center', gap: 8 })}>
    <Ionicons name={icon} size={20} color="#C3CEDB" accessible={false} /><Text style={{ color: '#E5EAF0', fontSize: 15, fontWeight: '600' }}>{label}</Text>
  </Pressable>;
}
function DeathButton({ label, onPress, icon, primary = false }: { label: string; onPress: () => void; icon: 'chevron-forward' | 'refresh' | 'people'; primary?: boolean }) {
  const color = primary ? '#FFFFFF' : '#0B1545', press = useFeedbackPress(onPress);
  return <Pressable accessibilityRole="button" accessibilityLabel={displayText(label)} onPress={press} style={({ pressed }) => ({ width: '100%', minHeight: 56, backgroundColor: primary ? pressed ? '#0063DC' : '#006DE5' : pressed ? '#E5EAF0' : '#FFFFFF', padding: 14, borderRadius: 12, flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'center' })}>
    {!primary && <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Ionicons name={icon} color="#61718B" size={24} /></View>}
    <Text style={{ color, fontSize: 16, fontWeight: '600', flexShrink: 1, textAlign: 'center' }}>{label}</Text>
    {primary && <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Ionicons name={icon} color={color} size={24} /></View>}
  </Pressable>;
}
