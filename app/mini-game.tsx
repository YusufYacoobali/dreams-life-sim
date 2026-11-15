import React from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LiveMiniGame } from '../src/minigames/LiveMiniGame';

/** Full-screen native modals need their own window-relative notch/home insets. */
export default function MiniGameRoute() {
  const screen = <LiveMiniGame />;
  return Platform.OS === 'web' ? screen : <SafeAreaProvider>{screen}</SafeAreaProvider>;
}
