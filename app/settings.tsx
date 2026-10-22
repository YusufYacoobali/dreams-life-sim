import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Switch, Text, View, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { usePreferences } from '../src/state/usePreferences';
import { ActionRow, Body, Button, Card, Header, Heading, Page } from '../src/ui/components';
import { EventModal } from '../src/ui/EventModal';
import { useColors } from '../src/ui/theme';
import { useFeedback } from '../src/ui/feedback';
import { DailyReminderSettings } from '../src/ui/DailyReminderSettings';

const choices = [{ id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }, { id: 'system', label: 'Use Device Appearance' }] as const;
export default function Settings() {
  const settings = usePreferences(s => s.settings), ready = usePreferences(s => s.ready), busy = usePreferences(s => s.busy), error = usePreferences(s => s.error), loadFailed = usePreferences(s => s.loadFailed);
  const change = usePreferences(s => s.setAppearance), retry = usePreferences(s => s.retry), reset = usePreferences(s => s.reset), [confirm, setConfirm] = useState(false), c = useColors();
  const setReducedMotion = usePreferences(s => s.setReducedMotion), setHaptics = usePreferences(s => s.setHaptics), setSoundEffects = usePreferences(s => s.setSoundEffects);
  const { deviceReducedMotion, hapticsSupported, soundSupported } = useFeedback();
  const { width, fontScale } = useWindowDimensions(), stacked = width < 360 || fontScale >= 1.2;
  const unavailable = busy || !ready || loadFailed;
  // Keep this footer present so a failure does not remount the scroll content.
  return <Page bottomSafeArea footer={error && !confirm ? <><Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, fontSize: 15, lineHeight: 23 }}>{error}</Text><Button label="Try Again" disabled={busy} onPress={() => { void retry(); }} /></> : <Body muted>These settings apply to all your lives on this device.</Body>}><Header title="Settings" onBack={() => router.back()} />
    <Card><View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}><View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ padding: 12, borderRadius: 16, backgroundColor: c.inset }}><Ionicons name="settings-outline" size={32} color={c.link} /></View><View style={{ flex: 1, minWidth: 0 }}><Heading size={21}>App Preferences</Heading><Body muted>Choose your appearance, feedback and daily reminders.</Body></View></View></Card>
    <Card><Heading size={19}>Appearance</Heading><Body muted>Choose a look, or follow your device’s light and dark appearance.</Body>
      {!ready ? <ActivityIndicator accessibilityLabel="Opening display settings" /> : <View accessibilityRole="radiogroup" accessibilityLabel="Appearance">{choices.map(choice => <Pressable key={choice.id} accessibilityRole="radio" accessibilityLabel={choice.label} accessibilityState={{ checked: settings.appearance === choice.id, disabled: busy || loadFailed }} disabled={busy || loadFailed} onPress={() => { void change(choice.id); }} style={({ pressed }) => ({ minHeight: 56, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, marginTop: 8, backgroundColor: pressed || settings.appearance === choice.id ? c.selected : c.surface, borderWidth: 1, borderColor: settings.appearance === choice.id ? c.link : c.line, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: busy || loadFailed ? 0.5 : 1 })}><Text style={{ flex: 1, minWidth: 0, color: c.ink, fontSize: 16, lineHeight: 23, fontWeight: settings.appearance === choice.id ? '700' : '400' }}>{choice.label}</Text><View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Ionicons name={settings.appearance === choice.id ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={settings.appearance === choice.id ? c.link : c.muted} /></View></Pressable>)}</View>}
      <Button label="Restore Default Appearance" tone="secondary" disabled={busy || !ready} onPress={() => setConfirm(true)} />
    </Card>
    <Card><Heading size={19}>Motion and feedback</Heading>
      <FeedbackSetting label="Reduce Motion" description="Use still artwork and turn off page and dialog animations. Your device’s reduced-motion setting is always honoured." checked={settings.reducedMotion} disabled={unavailable} stacked={stacked} onChange={enabled => { void setReducedMotion(enabled); }} />
      {deviceReducedMotion && <Body muted>Your device requests reduced motion, so animations stay off.</Body>}
      <FeedbackSetting label="Haptic Feedback" description={hapticsSupported ? 'A light tap for buttons, choices and Age Up, on supported devices.' : 'Haptics are available on supported iOS and Android devices.'} checked={settings.haptics} disabled={unavailable || !hapticsSupported} stacked={stacked} onChange={enabled => { void setHaptics(enabled); }} />
      <FeedbackSetting label="Sound Effects" description={soundSupported ? 'A quiet button tap. Respects silent mode and media volume.' : 'Button sounds are available on iOS and Android devices.'} checked={settings.soundEffects} disabled={unavailable || !soundSupported} stacked={stacked} onChange={enabled => { void setSoundEffects(enabled); }} />
      {busy && <ActivityIndicator accessibilityLabel="Saving app settings" />}
    </Card>
    <DailyReminderSettings stacked={stacked} />
    <Card><Heading size={19}>Your saved lives</Heading><Body>Your progress stays on this device. Export a file to keep a copy somewhere you choose.</Body><ActionRow title="Saved Lives" subtitle="Open, import, export or recover a life" onPress={() => router.push('/saved-lives')} /></Card>
    <Card><Heading size={19}>Help</Heading><ActionRow title="How to Play" subtitle="Years, routines, milestones and local progress" onPress={() => router.push('/help')} /></Card>
    <EventModal event={confirm ? { id: 'reset-appearance', kind: 'confirmation', title: 'Restore the default appearance?', body: loadFailed ? 'The unreadable app settings will be replaced with Light appearance, device motion settings, and haptics, sounds and daily reminders off. Your lives and historical moments are kept.' : 'The app will use Light appearance. Your motion, haptic, sound and reminder choices, lives and historical moments are kept.', terms: [], confirmLabel: 'Restore Appearance' } : null} busy={busy} error={error} onCancel={() => setConfirm(false)} onChoose={() => { void reset().then(saved => { if (saved) setConfirm(false); }); }} />
  </Page>;
}

function FeedbackSetting({ label, description, checked, disabled, stacked, onChange }: { label: string; description: string; checked: boolean; disabled: boolean; stacked: boolean; onChange: (enabled: boolean) => void }) {
  const c = useColors();
  return <View style={{ flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'stretch' : 'center', gap: 10, minHeight: 56, borderBottomWidth: 1, borderBottomColor: c.line, paddingBottom: 12 }}>
    <View style={{ flex: stacked ? undefined : 1, minWidth: 0, gap: 4 }}><Text style={{ color: c.ink, fontSize: 16, lineHeight: 23, fontWeight: '600' }}>{label}</Text><Body muted>{description}</Body></View>
    <View style={{ minHeight: 48, justifyContent: 'center', alignSelf: stacked ? 'flex-start' : 'center' }}><Switch accessibilityRole="switch" accessibilityLabel={label} accessibilityHint={description} accessibilityState={{ disabled, checked }} value={checked} disabled={disabled} onValueChange={onChange} hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }} trackColor={{ false: c.track, true: c.actionBlue }} /></View>
  </View>;
}
