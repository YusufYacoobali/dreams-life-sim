import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Button } from '../src/ui/components';
import { freshSeed, useGame } from '../src/state/useGame';
import { fullName } from '../src/game/model';
import { useColors } from '../src/ui/theme';
import { openingBackground, OpeningBrandAccent, OpeningScene } from '../src/ui/OpeningScene';
import { useFeedbackPress } from '../src/ui/feedback';
import { DisplayText as Text, displayText } from '../src/ui/DisplayText';

export default function Welcome() {
  const c = useColors();
  const { width, height, fontScale } = useWindowDimensions();
  const compact = width < 360 || height < 740 || fontScale > 1.35;
  const ready = useGame(s => s.ready), world = useGame(s => s.world), busy = useGame(s => s.busy), error = useGame(s => s.error), bootstrap = useGame(s => s.bootstrap);
  const open = useFeedbackPress(() => { if (!world) return false; router.push(world.people[world.activePersonId].died ? '/death' : world.birthAcknowledged ? '/life' : '/birth'); }, busy || !ready);
  const create = useFeedbackPress((mode: 'custom' | 'random') => router.push({ pathname: '/new-life', params: { seed: freshSeed().toString(), mode } }), busy || !ready);
  const saved = useFeedbackPress(() => router.push('/saved-lives'), busy || !ready);
  const help = useFeedbackPress(() => router.push('/help'), !ready);
  return <View style={styles.page}>
    <LinearGradient pointerEvents="none" accessible={false} colors={['#15263F', '#101D32', openingBackground]} locations={[0, 0.48, 1]} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={StyleSheet.absoluteFill} />
    <StatusBar style="light" />
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.toolbar}><Pressable accessibilityRole="button" accessibilityLabel="Help" accessibilityHint="Open the game guide" accessibilityState={{ disabled: !ready }} disabled={!ready} onPress={help} style={({ pressed }) => [styles.help, { backgroundColor: pressed ? '#1C2B43' : 'transparent', opacity: ready ? 1 : 0.5 }]}><Ionicons name="help-circle-outline" size={23} color="#A8B6CE" /></Pressable></View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.contents, { paddingVertical: compact ? 8 : 40 }]}>
        <View style={[styles.composition, { gap: compact ? 20 : 44 }]}>
          <View style={styles.title}>
            <View style={{ marginBottom: compact ? 8 : 24 }}><OpeningScene width={compact ? 140 : 184} /></View>
            <Text accessibilityRole="header" adjustsFontSizeToFit minimumFontScale={0.6} numberOfLines={1} style={[styles.wordmark, compact && styles.compactWordmark]}>Dreams</Text>
            <OpeningBrandAccent />
            <Text style={styles.subtitle}>Life Simulator</Text>
          </View>
          <View style={[styles.actions, compact && styles.compactActions]}>{!ready ? <View style={styles.loading}><ActivityIndicator color="#FFFFFF" accessibilityLabel="Opening your saved lives" /><Text accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.loadingText}>Opening your story…</Text></View> : <>
            {error && <View style={styles.error}><Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.errorText}>{error}</Text><Button label="Try Again" busy={busy} onPress={() => { void bootstrap(); }} /></View>}
            {world && <Pressable accessibilityRole="button" accessibilityLabel={displayText('Continue Life as ' + fullName(world.people[world.activePersonId]))} accessibilityState={{ disabled: busy }} disabled={busy} onPress={open} style={({ pressed }) => [styles.primary, { backgroundColor: pressed ? c.actionGreenPressed : c.actionGreen, opacity: busy ? 0.5 : 1 }]}><Ionicons name="play" size={20} color="#FFFFFF" /><View style={styles.continueCopy}><Text style={styles.actionText}>Continue Life</Text><Text style={styles.continueName}>Continue as {fullName(world.people[world.activePersonId])}</Text></View></Pressable>}
            <Pressable accessibilityRole="button" accessibilityLabel="Start New Life" accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => create('custom')} style={({ pressed }) => [styles.primary, world && styles.secondary, { backgroundColor: world ? pressed ? '#263E60' : '#1A2D49' : pressed ? c.actionBluePressed : c.actionBlue, opacity: busy ? 0.5 : 1 }]}>{world && <Ionicons name="add-circle-outline" size={21} color="#B9D1FA" />}<Text style={[styles.actionText, world && styles.secondaryText]}>Start New Life</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Random Life" accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => create('random')} style={({ pressed }) => [styles.random, { backgroundColor: pressed ? '#162238' : 'transparent', opacity: busy ? 0.5 : 1 }]}><Ionicons name="dice-outline" size={21} color="#B5C1D7" /><Text style={styles.randomText}>Random Life</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Saved Lives" accessibilityHint="Open saved lives, import a save or restore a previous checkpoint" accessibilityState={{ disabled: busy }} disabled={busy} onPress={saved} style={({ pressed }) => [styles.random, { backgroundColor: pressed ? '#162238' : 'transparent', opacity: busy ? 0.5 : 1 }]}><Ionicons name="folder-open-outline" size={21} color="#B5C1D7" /><Text style={styles.randomText}>Saved Lives</Text></Pressable>
          </>}</View>
        </View>
      </ScrollView>
    </SafeAreaView>
  </View>;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: openingBackground }, safeArea: { flex: 1 },
  toolbar: { minHeight: 52, paddingHorizontal: 16, paddingVertical: 4, alignItems: 'flex-end' },
  help: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  contents: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 },
  composition: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  title: { alignItems: 'center' },
  wordmark: { maxWidth: '100%', color: '#F6F8FF', fontSize: 56, lineHeight: 68, fontWeight: '800', letterSpacing: -1.8, textAlign: 'center' },
  compactWordmark: { fontSize: 48, lineHeight: 60 },
  subtitle: { color: '#AFBCD2', fontSize: 17, lineHeight: 26, letterSpacing: 2.2, textAlign: 'center', marginTop: 12 },
  actions: { width: '100%', maxWidth: 360, alignSelf: 'center', gap: 12 },
  compactActions: { gap: 8 },
  loading: { alignItems: 'center', gap: 12, paddingVertical: 12 },
  loadingText: { color: '#AFBCD2', fontSize: 16, lineHeight: 24, textAlign: 'center' },
  error: { padding: 16, gap: 12, backgroundColor: '#251F32', borderWidth: 1, borderColor: '#80515F', borderRadius: 14 },
  errorText: { color: '#FFD1D7', fontSize: 15, lineHeight: 23 },
  primary: { minHeight: 56, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  continueCopy: { flexShrink: 1, alignItems: 'center', gap: 2 },
  continueName: { color: '#E4F5ED', fontSize: 14, lineHeight: 20, fontWeight: '500', textAlign: 'center' },
  secondary: { borderWidth: 1, borderColor: '#5473A1' },
  secondaryText: { color: '#DCE9FF' },
  actionText: { color: '#FFFFFF', fontSize: 17, lineHeight: 24, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
  random: { minHeight: 48, paddingHorizontal: 18, paddingVertical: 12, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  randomText: { color: '#B5C1D7', fontSize: 16, lineHeight: 24, fontWeight: '500', textAlign: 'center', flexShrink: 1 },
});
