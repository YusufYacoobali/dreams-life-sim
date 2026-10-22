import React from 'react';
import { Switch, View } from 'react-native';
import { router } from 'expo-router';
import { isGodModeBuild } from '../access/buildAccess';
import { usePreferences } from '../state/usePreferences';
import { ActionRow, Body, Button, Card, Heading } from './components';
import { useColors } from './theme';

export function useGodModeAccess() {
  const enabled = usePreferences(s => s.settings.godModeEnabled), ready = usePreferences(s => s.ready), failed = usePreferences(s => s.loadFailed);
  return isGodModeBuild() && ready && !failed && enabled;
}

export function GodModeSettings() {
  const enabled = usePreferences(s => s.settings.godModeEnabled), ready = usePreferences(s => s.ready), busy = usePreferences(s => s.busy), failed = usePreferences(s => s.loadFailed);
  const change = usePreferences(s => s.setGodModeEnabled), c = useColors();
  if (!isGodModeBuild()) return null;
  return <Card><Heading size={19}>God Mode</Heading><Body muted>Testing controls for money, stats, skills and relationships. Switching off keeps saved changes.</Body>
    <View style={{ minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start' }}><Switch accessibilityRole="switch" accessibilityLabel="God Mode" accessibilityState={{ checked: enabled, disabled: !ready || busy || failed }} value={enabled} disabled={!ready || busy || failed} onValueChange={value => { void change(value); }} trackColor={{ false: c.track, true: c.actionBlue }} /></View>
    {enabled && ready && !failed && <Button label="Open God Mode Editor" disabled={busy} onPress={() => router.push('/god-mode')} />}
  </Card>;
}

export function GodModeShortcut() {
  const allowed = useGodModeAccess();
  return allowed ? <ActionRow title="God Mode Editor" subtitle="Edit this character for testing" onPress={() => router.push('/god-mode')} /> : null;
}
