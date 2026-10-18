import React, { useCallback } from 'react';
import { BackHandler, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useGame, freshSeed } from '../src/state/useGame';
import { ageOn, fullName } from '../src/game/model';
import { formatMoney } from '../src/game/money';
import { countries } from '../src/game/countries';

export default function Death() {
  const world = useGame(s => s.world);
  useFocusEffect(useCallback(() => { const subscription = BackHandler.addEventListener('hardwareBackPress', () => true); return () => subscription.remove(); }, []));
  if (!world) return <Redirect href="/" />;
  const player = world.people[world.activePersonId];
  if (!player.died) return <Redirect href="/life" />;
  const cash = world.accounts.filter(account => account.ownerId === player.id);
  const children = world.relationships.filter(relation => relation.kind === 'parent' && relation.from === player.id);
  return <SafeAreaView style={{ flex: 1, backgroundColor: '#1B2433' }}><StatusBar style="light" /><ScrollView contentContainerStyle={{ padding: 26, gap: 18, alignItems: 'center' }}>
    <Image source={require('../assets/generated/death-memorial.png')} accessibilityLabel="A stone memorial with a pink heart" style={{ width: 170, height: 170, marginTop: 18 }} resizeMode="contain" />
    <Text accessibilityRole="header" style={{ color: 'white', fontWeight: '700', fontSize: 36 }}>You Died</Text>
    <Text style={{ color: 'white', fontSize: 22, fontWeight: '600', textAlign: 'center' }}>{fullName(player)}</Text>
    <Text style={{ color: '#C3CEDB', fontSize: 17 }}>Age {ageOn(player, world.date)} · {player.born.year}–{player.died.year}</Text>
    <Text style={{ color: '#C3CEDB', fontSize: 16, lineHeight: 24, textAlign: 'center' }}>Cause of death: {player.causeOfDeath}</Text>
    <Text style={{ color: '#E5EAF0', fontSize: 16, lineHeight: 24, textAlign: 'center' }}>Your life began in {player.city}. {world.journal.filter(entry => entry.personId === player.id && entry.category === 'event').length} choices became part of your story.</Text>
    <View style={{ backgroundColor: '#FFFFFF', width: '100%', borderRadius: 18, padding: 20, gap: 16 }}>
      {[
        ['Cash at death', cash.map(account => formatMoney({ minor: account.cash, currency: account.currency }, countries[player.country].locale)).join(' + ')],
        ['Children', children.length.toString()], ['Happiness', player.stats.happiness + '%'],
      ].map(([label, value]) => <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}><Text style={{ color: '#61718B', fontSize: 15 }}>{label}</Text><Text style={{ color: '#0B1545', fontWeight: '600', fontSize: 15 }}>{value}</Text></View>)}
    </View>
    <DeathButton label="View Life Summary" onPress={() => router.push('/life-summary')} />
    <DeathButton label="Start a New Life" onPress={() => router.push({ pathname: '/new-life', params: { seed: freshSeed().toString() } })} />
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: true }} accessibilityLabel="Continue as Child. No living child is available." disabled style={{ width: '100%', minHeight: 52, backgroundColor: '#354050', padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#C3CEDB', fontSize: 16, fontWeight: '600' }}>Continue as Child</Text></Pressable>
    <Text style={{ color: '#C3CEDB', textAlign: 'center', fontSize: 14 }}>No living child is available to continue this life.</Text>
  </ScrollView></SafeAreaView>;
}
function DeathButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={{ width: '100%', minHeight: 52, backgroundColor: '#FFFFFF', padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#0B1545', fontSize: 16, fontWeight: '600' }}>{label}</Text></Pressable>;
}
