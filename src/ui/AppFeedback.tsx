import React from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { usePreferences } from '../state/usePreferences';
import { FeedbackProvider } from './feedback';
import { useActionSound } from './useActionSound';

function buttonFeedback() {
  if (Platform.OS === 'android') return Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Virtual_Key);
  if (Platform.OS === 'ios') return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  return Promise.resolve();
}

export function AppFeedback({ children }: React.PropsWithChildren) {
  const settings = usePreferences(state => state.settings), ready = usePreferences(state => state.ready), loadFailed = usePreferences(state => state.loadFailed);
  const supported = Platform.OS === 'ios' || Platform.OS === 'android';
  const soundEffects = ready && !loadFailed && settings.soundEffects;
  const playSound = useActionSound(soundEffects && supported);
  return <FeedbackProvider reducedMotion={!ready || loadFailed || settings.reducedMotion} haptics={ready && !loadFailed && settings.haptics}
    hapticsSupported={supported} onButtonFeedback={buttonFeedback} soundEffects={soundEffects} soundSupported={supported} onButtonSound={playSound}>{children}</FeedbackProvider>;
}
