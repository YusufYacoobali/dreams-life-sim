import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { usePreferences } from '../src/state/usePreferences';
import { ActionRow, Body, Button, Card, Header, Heading, Page } from '../src/ui/components';
import { EventModal } from '../src/ui/EventModal';
import { useColors } from '../src/ui/theme';

const choices = [{ id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }, { id: 'system', label: 'Use Device Appearance' }] as const;
export default function Settings() {
  const settings = usePreferences(s => s.settings), ready = usePreferences(s => s.ready), busy = usePreferences(s => s.busy), error = usePreferences(s => s.error), loadFailed = usePreferences(s => s.loadFailed);
  const change = usePreferences(s => s.setAppearance), retry = usePreferences(s => s.retry), reset = usePreferences(s => s.reset), [confirm, setConfirm] = useState(false), c = useColors();
  return <Page bottomSafeArea><Header title="Settings" onBack={() => router.back()} />
    <Card><Heading size={19}>Appearance</Heading><Body muted>Choose a look, or follow your device’s light and dark appearance.</Body>
      {!ready ? <ActivityIndicator accessibilityLabel="Opening display settings" /> : <View accessibilityRole="radiogroup" accessibilityLabel="Appearance">{choices.map(choice => <Pressable key={choice.id} accessibilityRole="radio" accessibilityLabel={choice.label} accessibilityState={{ checked: settings.appearance === choice.id, disabled: busy || loadFailed }} disabled={busy || loadFailed} onPress={() => { void change(choice.id); }} style={{ minHeight: 52, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, marginTop: 6, backgroundColor: settings.appearance === choice.id ? c.selected : c.inset, borderWidth: 1, borderColor: settings.appearance === choice.id ? c.blue : 'transparent' }}><Text style={{ color: c.ink, fontSize: 16, fontWeight: settings.appearance === choice.id ? '700' : '400' }}>{choice.label}</Text></Pressable>)}</View>}
      {busy && <ActivityIndicator accessibilityLabel="Saving display settings" />}
      {error && <><Text accessibilityRole="alert" style={{ color: c.red, lineHeight: 21 }}>{error}</Text><Button label="Try Again" disabled={busy} onPress={() => { void retry(); }} /></>}
      <Button label="Restore Default Appearance" tone="secondary" disabled={busy || !ready} onPress={() => setConfirm(true)} />
    </Card>
    <Card><Heading size={19}>Your saved lives</Heading><Body>Your progress stays on this device. Export a file to keep a copy somewhere you choose.</Body><ActionRow title="Saved Lives" subtitle="Open, import, export or recover a life" onPress={() => router.push('/saved-lives')} /></Card>
    <Card><Heading size={19}>Help</Heading><ActionRow title="How to Play" subtitle="Years, routines, milestones and local progress" onPress={() => router.push('/help')} /></Card>
    <EventModal event={confirm ? { id: 'reset-appearance', kind: 'confirmation', title: 'Restore the default appearance?', body: 'The app will use Light appearance. Your lives and historical moments are kept.', terms: [], confirmLabel: 'Restore Appearance' } : null} busy={busy} onCancel={() => setConfirm(false)} onChoose={() => { setConfirm(false); void reset(); }} />
  </Page>;
}
