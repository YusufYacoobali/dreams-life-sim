import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../src/ui/theme';
import { gameStore } from '../src/state/useGame';

export default function RootLayout() {
  useEffect(() => { void gameStore.getState().bootstrap(); }, []);
  return <SafeAreaProvider><ThemeProvider>
    <StatusBar style="dark" />
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new-life" />
      <Stack.Screen name="birth" options={{ gestureEnabled: false }} />
      <Stack.Screen name="death" options={{ gestureEnabled: false }} />
      <Stack.Screen name="life-summary" />
      <Stack.Screen name="(game)" />
    </Stack>
  </ThemeProvider></SafeAreaProvider>;
}
