import React from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MiniGamePlayground } from '../src/minigames/MiniGamePlayground';

/** Full-screen native modals need their own window-relative notch/home insets. */
export default function MiniGamePlaygroundRoute() {
  const screen = <MiniGamePlayground />;
  return Platform.OS === 'web' ? screen : <SafeAreaProvider>{screen}</SafeAreaProvider>;
}
