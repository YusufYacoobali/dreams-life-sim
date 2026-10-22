import React, { useCallback, useMemo } from 'react';
import { BackHandler, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useGame, freshSeed } from '../src/state/useGame';
import { ageOn, fullName } from '../src/game/model';
import { formatMoney } from '../src/game/money';
import { countries } from '../src/game/countries';
import { netWorth } from '../src/game/systems/markets';
import { terminalBiography } from '../src/ui/terminalBiography';
import { Illustration, type IllustrationId } from '../src/assets/Illustration';
import { FamilyArt } from '../src/assets/FamilyArt';
import { LifeMilestoneArt } from '../src/ui/LifeMilestoneArt';
import { useFeedbackPress } from '../src/ui/feedback';

export default function Death() {
  const world = useGame(s => s.world);
  const biography = useMemo(() => world && world.people[world.activePersonId].died ? terminalBiography(world) : null, [world, world?.activePersonId]);
  useFocusEffect(useCallback(() => { const subscription = BackHandler.addEventListener('hardwareBackPress', () => true); return () => subscription.remove(); }, []));
  if (!world) return <Redirect href="/" />;
  const player = world.people[world.activePersonId];
  if (!player.died) return <Redirect href="/life" />;
  const children = world.relationships.filter(relation => relation.kind === 'parent' && relation.from === player.id);
  const livingChildren = children.filter(relation => !world.people[relation.to].died);
  const estate = world.estates.find(item => item.personId === player.id);
  const wealth = estate?.netWorthAtDeath ?? netWorth(world);
  const details: { label: string; value: string; icon: IllustrationId | 'family'; color?: string }[] = [
    { label: 'Net worth', value: formatMoney(wealth, countries[player.country].locale), icon: 'money', color: wealth.minor < 0n ? '#B72D39' : '#13823B' },
    { label: 'Children', value: children.length.toString(), icon: 'family' },
    { label: 'Career', value: biography?.careerTitle ?? 'No retained job record', icon: 'career' },
    { label: 'Properties', value: (estate?.propertiesAtDeath ?? world.assets.filter(asset => asset.ownerId === player.id && asset.kind === 'property').length).toString(), icon: 'property' },
  ];
  return <SafeAreaView style={{ flex: 1, backgroundColor: '#1B2433' }}><StatusBar style="light" /><ScrollView contentContainerStyle={{ padding: 26, gap: 18, alignItems: 'center' }}>
    <LifeMilestoneArt kind="death" identity={JSON.stringify([world.id, player.id, player.died])}><Image source={require('../assets/generated/death-memorial.png')} accessible={false} style={{ width: 170, height: 170 }} resizeMode="contain" /></LifeMilestoneArt>
    <Text accessibilityRole="header" style={{ color: 'white', fontWeight: '700', fontSize: 36 }}>You Died</Text>
    <Text style={{ color: 'white', fontSize: 22, fontWeight: '600', textAlign: 'center' }}>{fullName(player)}</Text>
    <Text style={{ color: '#C3CEDB', fontSize: 17 }}>Age {ageOn(player, world.date)} · {player.born.year}–{player.died.year}</Text>
    <Text style={{ color: '#C3CEDB', fontSize: 16, lineHeight: 24, textAlign: 'center' }}>Cause of death: {player.causeOfDeath}</Text>
    <Text style={{ color: '#E5EAF0', fontSize: 16, lineHeight: 24, textAlign: 'center' }}>{biography?.text}</Text>
    <Text style={{ color: '#C3CEDB', fontSize: 14, lineHeight: 20, textAlign: 'center' }}>{biography?.scope}</Text>
    <View style={{ backgroundColor: '#FFFFFF', width: '100%', borderRadius: 18, paddingHorizontal: 16 }}>
      {details.map(({ label, value, icon, color }) => <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#E5EAF0' }}>
        {icon === 'family' ? <FamilyArt id="family-tree" size={30} /> : <Illustration id={icon} size={30} />}
        <Text style={{ color: '#0B1545', fontSize: 15, flex: 1 }}>{label}</Text>
        <Text style={{ color: color ?? '#0B1545', fontWeight: '600', fontSize: 15, flex: 1, minWidth: 0, textAlign: 'right' }}>{value}</Text>
      </View>)}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 15 }}>
        <Illustration id="wellbeing" size={30} />
        <View style={{ flex: 1, gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}><Text style={{ color: '#0B1545', fontSize: 15, flex: 1 }}>Happiness</Text><Text style={{ color: '#0B1545', fontSize: 15, fontWeight: '600', flexShrink: 1, textAlign: 'right' }}>{player.stats.happiness}%</Text></View>
          <View accessible accessibilityRole="progressbar" accessibilityLabel="Happiness" accessibilityValue={{ min: 0, max: 100, now: player.stats.happiness }} style={{ height: 10, borderRadius: 5, backgroundColor: '#E5EAF0', overflow: 'hidden' }}><View style={{ width: `${player.stats.happiness}%`, height: '100%', borderRadius: 5, backgroundColor: '#28B65A' }} /></View>
        </View>
      </View>
    </View>
    <DeathButton label="View Life Summary" icon="chevron-forward" primary onPress={() => router.push('/life-summary')} />
    <DeathButton label="Start a New Life" icon="refresh" onPress={() => router.push({ pathname: '/new-life', params: { seed: freshSeed().toString() } })} />
    {livingChildren.length ? <DeathButton label="Continue as Child" icon="people" onPress={() => router.push('/legacy')} /> : <><Pressable accessibilityRole="button" accessibilityState={{ disabled: true }} accessibilityLabel="Continue as Child. No living child is available." disabled style={{ width: '100%', minHeight: 52, backgroundColor: '#354050', padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#C3CEDB', fontSize: 16, fontWeight: '600' }}>Continue as Child</Text></Pressable><Text style={{ color: '#C3CEDB', textAlign: 'center', fontSize: 14 }}>No living child is available to continue this life.</Text></>}
  </ScrollView></SafeAreaView>;
}
function DeathButton({ label, onPress, icon, primary = false }: { label: string; onPress: () => void; icon: 'chevron-forward' | 'refresh' | 'people'; primary?: boolean }) {
  const color = primary ? '#FFFFFF' : '#0B1545', press = useFeedbackPress(onPress);
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={press} style={({ pressed }) => ({ width: '100%', minHeight: 56, backgroundColor: primary ? pressed ? '#0063DC' : '#006DE5' : pressed ? '#E5EAF0' : '#FFFFFF', padding: 14, borderRadius: 12, flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'center' })}>
    {!primary && <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Ionicons name={icon} color="#61718B" size={24} /></View>}
    <Text style={{ color, fontSize: 16, fontWeight: '600', flexShrink: 1, textAlign: 'center' }}>{label}</Text>
    {primary && <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Ionicons name={icon} color={color} size={24} /></View>}
  </Pressable>;
}
