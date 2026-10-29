import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemedStatusBar, ThemeProvider } from '../src/ui/theme';
import { gameStore } from '../src/state/useGame';
import { preferencesStore, usePreferences } from '../src/state/usePreferences';
import { AppFeedback } from '../src/ui/AppFeedback';
import { useFeedback } from '../src/ui/feedback';
import { AppReminders } from '../src/ui/AppReminders';
import * as SplashScreen from 'expo-splash-screen';
import { CinematicTransitionProvider } from '../src/ui/cinematic/CinematicTransition';
import { AppEventModals } from '../src/ui/AppEventModals';

// Retain the navy native launch surface until the root overlay has painted.
void SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const appearance = usePreferences(s => s.settings.appearance);
  useEffect(() => { void gameStore.getState().bootstrap(); void preferencesStore.getState().bootstrap(); }, []);
  return <SafeAreaProvider><ThemeProvider appearance={appearance}><AppFeedback><CinematicTransitionProvider><AppEventModals><RootNavigator /><AppReminders /></AppEventModals></CinematicTransitionProvider></AppFeedback></ThemeProvider></SafeAreaProvider>;
}

function RootNavigator() {
  const { reducedMotion } = useFeedback();
  return <>
    <ThemedStatusBar />
    <Stack screenOptions={{ headerShown: false, freezeOnBlur: true, animation: reducedMotion ? 'none' : 'default' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new-life" />
      <Stack.Screen name="appearance" />
      <Stack.Screen name="help" />
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      <Stack.Screen name="god-mode" options={{ presentation: 'modal' }} />
      <Stack.Screen name="mini-game" options={{ presentation: 'fullScreenModal', gestureEnabled: false, animation: 'none' }} />
      <Stack.Screen name="mini-game-playground" options={{ presentation: 'fullScreenModal', gestureEnabled: false, animation: 'none' }} />
      <Stack.Screen name="birth" options={{ gestureEnabled: false, animation: 'none' }} />
      <Stack.Screen name="death" options={{ gestureEnabled: false, animation: 'none' }} />
      <Stack.Screen name="life-summary" />
      <Stack.Screen name="saved-life/[id]" />
      <Stack.Screen name="legacy" />
      <Stack.Screen name="time-machine" />
      <Stack.Screen name="(game)" />
    </Stack>
  </>;
}
