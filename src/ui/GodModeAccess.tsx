import { useEntitlement } from '../purchases/hooks';
import React from 'react';
import { Switch, View } from 'react-native';
import { router } from 'expo-router';
import { useStore } from 'zustand';
import { isGodModeBuild } from '../access/buildAccess';
import { usePreferences } from '../state/usePreferences';
import { godModeSessionStore } from '../state/godModeSession';
import { Body, Button, Card, Heading } from './components';
import { useColors } from './theme';

export function useInternalGodModeAccess() {
  const enabled = usePreferences(s => s.settings.godModeEnabled), ready = usePreferences(s => s.ready), failed = usePreferences(s => s.loadFailed);
  const revealed = useStore(godModeSessionStore, s => s.revealed);
  return isGodModeBuild() && revealed && ready && !failed && enabled;
}

export function useGodModeAccess() {
  const paid = useEntitlement('god_mode'), internal = useInternalGodModeAccess();
  return paid || internal;
}

export function GodModeSettings() {
  const enabled = usePreferences(s => s.settings.godModeEnabled), ready = usePreferences(s => s.ready), busy = usePreferences(s => s.busy), failed = usePreferences(s => s.loadFailed);
  const revealed = useStore(godModeSessionStore, s => s.revealed);
  const change = usePreferences(s => s.setGodModeEnabled), c = useColors();
  if (!isGodModeBuild() || !revealed) return null;
  return <Card><Heading size={19}>Internal Testing</Heading><Body muted>Testing controls for money, stats, skills and relationships. Switching off keeps saved changes.</Body>
    <View style={{ minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start' }}><Switch accessibilityRole="switch" accessibilityLabel="God Mode" accessibilityState={{ checked: enabled, disabled: !ready || busy || failed }} value={enabled} disabled={!ready || busy || failed} onValueChange={value => { void change(value); }} trackColor={{ false: c.track, true: c.actionBlue }} /></View>
    {enabled && ready && !failed && <><Button label="Open God Mode Editor" disabled={busy} onPress={() => router.push('/god-mode')} /><Button label="Mini-Game Playground" tone="secondary" disabled={busy} onPress={() => router.push('/mini-game-playground')} /></>}
  </Card>;
}
