import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { usePreferences } from '../src/state/usePreferences';
import { ActionRow, Body, Button, Card, Header, Heading, Page } from '../src/ui/components';
import { EventModal } from '../src/ui/EventModal';
import { useColors } from '../src/ui/theme';
import { useFeedback } from '../src/ui/feedback';

const choices = [{ id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }, { id: 'system', label: 'Use Device Appearance' }] as const;
export default function Settings() {
  const settings = usePreferences(s => s.settings), ready = usePreferences(s => s.ready), busy = usePreferences(s => s.busy), error = usePreferences(s => s.error), loadFailed = usePreferences(s => s.loadFailed);
  const change = usePreferences(s => s.setAppearance), retry = usePreferences(s => s.retry), reset = usePreferences(s => s.reset), [confirm, setConfirm] = useState(false), c = useColors();
  const setReducedMotion = usePreferences(s => s.setReducedMotion), setHaptics = usePreferences(s => s.setHaptics), setSoundEffects = usePreferences(s => s.setSoundEffects);
  const { deviceReducedMotion, hapticsSupported, soundSupported } = useFeedback();
  const unavailable = busy || !ready || loadFailed;
  return <Page bottomSafeArea><Header title="Settings" onBack={() => router.back()} />
    <Card><Heading size={19}>Appearance</Heading><Body muted>Choose a look, or follow your device’s light and dark appearance.</Body>
      {!ready ? <ActivityIndicator accessibilityLabel="Opening display settings" /> : <View accessibilityRole="radiogroup" accessibilityLabel="Appearance">{choices.map(choice => <Pressable key={choice.id} accessibilityRole="radio" accessibilityLabel={choice.label} accessibilityState={{ checked: settings.appearance === choice.id, disabled: busy || loadFailed }} disabled={busy || loadFailed} onPress={() => { void change(choice.id); }} style={{ minHeight: 52, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, marginTop: 6, backgroundColor: settings.appearance === choice.id ? c.selected : c.inset, borderWidth: 1, borderColor: settings.appearance === choice.id ? c.blue : 'transparent' }}><Text style={{ color: c.ink, fontSize: 16, fontWeight: settings.appearance === choice.id ? '700' : '400' }}>{choice.label}</Text></Pressable>)}</View>}
      <Button label="Restore Default Appearance" tone="secondary" disabled={busy || !ready} onPress={() => setConfirm(true)} />
    </Card>
    <Card><Heading size={19}>Motion and feedback</Heading>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 }}>
        <View style={{ flex: 1 }}><Text style={{ color: c.ink, fontSize: 16, fontWeight: '600' }}>Reduce Motion</Text><Body muted>Turn off page and dialog animations. Your device’s reduced-motion setting is always honoured.</Body></View>
        <Switch accessibilityRole="switch" accessibilityLabel="Reduce Motion" accessibilityHint="Turn off page and dialog animations. Your device’s reduced-motion setting is always honoured." accessibilityState={{ disabled: unavailable, checked: settings.reducedMotion }} value={settings.reducedMotion} disabled={unavailable} onValueChange={enabled => { void setReducedMotion(enabled); }} />
      </View>
      {deviceReducedMotion && <Body muted>Your device requests reduced motion, so animations stay off.</Body>}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 }}>
        <View style={{ flex: 1 }}><Text style={{ color: c.ink, fontSize: 16, fontWeight: '600' }}>Haptic Feedback</Text><Body muted>{hapticsSupported ? 'A light tap when you press an action button, on supported devices.' : 'Haptics are available on supported iOS and Android devices.'}</Body></View>
        <Switch accessibilityRole="switch" accessibilityLabel="Haptic Feedback" accessibilityHint="A light tap when you press an action button, on supported devices." accessibilityState={{ disabled: unavailable || !hapticsSupported, checked: settings.haptics }} value={settings.haptics} disabled={unavailable || !hapticsSupported} onValueChange={enabled => { void setHaptics(enabled); }} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 }}>
        <View style={{ flex: 1 }}><Text style={{ color: c.ink, fontSize: 16, fontWeight: '600' }}>Sound Effects</Text><Body muted>{soundSupported ? 'A quiet button tap. Respects silent mode and media volume.' : 'Button sounds are available on iOS and Android devices.'}</Body></View>
        <Switch accessibilityRole="switch" accessibilityLabel="Sound Effects" accessibilityHint="A quiet button tap. Respects silent mode and media volume." accessibilityState={{ disabled: unavailable || !soundSupported, checked: settings.soundEffects }} value={settings.soundEffects} disabled={unavailable || !soundSupported} onValueChange={enabled => { void setSoundEffects(enabled); }} />
      </View>
      {busy && <ActivityIndicator accessibilityLabel="Saving app settings" />}
      {error && !confirm && <><Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, lineHeight: 21 }}>{error}</Text><Button label="Try Again" disabled={busy} onPress={() => { void retry(); }} /></>}
    </Card>
    <Card><Heading size={19}>Your saved lives</Heading><Body>Your progress stays on this device. Export a file to keep a copy somewhere you choose.</Body><ActionRow title="Saved Lives" subtitle="Open, import, export or recover a life" onPress={() => router.push('/saved-lives')} /></Card>
    <Card><Heading size={19}>Help</Heading><ActionRow title="How to Play" subtitle="Years, routines, milestones and local progress" onPress={() => router.push('/help')} /></Card>
    <EventModal event={confirm ? { id: 'reset-appearance', kind: 'confirmation', title: 'Restore the default appearance?', body: loadFailed ? 'The unreadable app settings will be replaced with Light appearance, device motion settings, and haptics and sounds off. Your lives and historical moments are kept.' : 'The app will use Light appearance. Your motion, haptic and sound choices, lives and historical moments are kept.', terms: [], confirmLabel: 'Restore Appearance' } : null} busy={busy} error={error} onCancel={() => setConfirm(false)} onChoose={() => { void reset().then(saved => { if (saved) setConfirm(false); }); }} />
  </Page>;
}
