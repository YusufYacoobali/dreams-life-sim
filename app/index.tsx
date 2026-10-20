import React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Button, Card } from '../src/ui/components';
import { freshSeed, useGame } from '../src/state/useGame';
import { fullName } from '../src/game/model';
import { useColors } from '../src/ui/theme';

const hero = require('../assets/generated/welcome-hero.png');
export default function Welcome() {
  const c = useColors();
  const ready = useGame(s => s.ready), world = useGame(s => s.world), busy = useGame(s => s.busy), error = useGame(s => s.error), bootstrap = useGame(s => s.bootstrap);
  const open = () => { if (world) router.push(world.people[world.activePersonId].died ? '/death' : world.birthAcknowledged ? '/life' : '/birth'); };
  const create = (mode: 'custom' | 'random') => router.push({ pathname: '/new-life', params: { seed: freshSeed().toString(), mode } });
  return <View style={styles.page}><StatusBar style="light" /><Image source={hero} accessible={false} resizeMode="cover" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} /><LinearGradient colors={['rgba(3,18,54,0.15)', 'transparent', 'rgba(2,12,31,0.96)']} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
    <SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.contents}>
      <View style={styles.title}><Text accessibilityRole="header" style={styles.wordmark}>Dreams</Text><Text style={styles.subtitle}>Life Simulator</Text><Text style={styles.tagline}>Make choices. Live different lives.{"\n"}See where your story takes you.</Text></View>
      <View style={styles.actions}>{!ready ? <ActivityIndicator color="#FFFFFF" accessibilityLabel="Opening your saved lives" /> : <>
        {error && <Card><Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, fontSize: 15, lineHeight: 22 }}>{error}</Text><Button label="Try Again" busy={busy} onPress={() => { void bootstrap(); }} /></Card>}
        {world && <Pressable accessibilityRole="button" accessibilityLabel={'Continue as ' + fullName(world.people[world.activePersonId])} accessibilityState={{ disabled: busy }} disabled={busy} onPress={open} style={({ pressed }) => [styles.continue, { backgroundColor: pressed ? c.actionGreenPressed : c.actionGreen, opacity: busy ? 0.5 : 1 }]}><Ionicons name="play" size={20} color="#FFFFFF" /><Text style={styles.actionText}>Continue as {world.people[world.activePersonId].firstName}</Text></Pressable>}
        <Pressable accessibilityRole="button" accessibilityLabel="Start Your Life" accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => create('custom')} style={({ pressed }) => [styles.primary, { backgroundColor: pressed ? c.actionBluePressed : c.actionBlue, opacity: busy ? 0.5 : 1 }]}><Text style={styles.actionText}>Start Your Life</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Random Life" accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => create('random')} style={({ pressed }) => [styles.secondary, { backgroundColor: pressed ? '#142539' : 'rgba(20,37,57,0.75)', opacity: busy ? 0.5 : 1 }]}><Ionicons name="dice-outline" size={22} color="#FFFFFF" /><Text style={styles.actionText}>Random Life</Text></Pressable>
        <View style={{ flexDirection: 'row', gap: 12 }}><Pressable accessibilityRole="button" accessibilityLabel="Saved Lives, Import and Export" accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => router.push('/saved-lives')} style={[styles.saved, { flex: 1 }]}><Ionicons name="folder-open-outline" size={18} color="#D4E1F5" /><Text style={styles.savedText}>Saved Lives</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Help" onPress={() => router.push('/help')} style={[styles.saved, { flex: 1 }]}><Ionicons name="help-circle-outline" size={20} color="#D4E1F5" /><Text style={styles.savedText}>Help</Text></Pressable></View><Text style={styles.offline}>Free to play · Offline · Your story stays with you</Text>
      </>}</View>
    </ScrollView></SafeAreaView>
  </View>;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#061633' }, safeArea: { flex: 1 }, contents: { flexGrow: 1, justifyContent: 'space-between', paddingHorizontal: 24, gap: 32 },
  title: { alignItems: 'center', paddingTop: 32, gap: 5 }, wordmark: { color: '#FFFFFF', fontSize: 48, fontWeight: '800', letterSpacing: -1.5 }, subtitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '500' }, tagline: { color: '#ECF1FC', fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 13 },
  actions: { gap: 12, paddingBottom: 12 }, primary: { minHeight: 56, paddingHorizontal: 18, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 13 },
  secondary: { minHeight: 54, paddingVertical: 14, paddingHorizontal: 18, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center', borderRadius: 13, borderWidth: 1, borderColor: '#8FABC9', backgroundColor: 'rgba(20,37,57,0.75)' },
  continue: { minHeight: 52, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 13, padding: 14 }, actionText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
  saved: { flexDirection: 'row', minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 8 }, savedText: { color: '#D4E1F5', fontSize: 14 }, offline: { color: '#A6B8CE', fontSize: 11, textAlign: 'center', paddingBottom: 2 },
});
