import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { preferencesStore, usePreferences } from '../state/usePreferences';
import { FeedbackProvider } from './feedback';
import { useActionSound } from './useActionSound';
import { audioController } from './audioController';
import { subscribeGameplayFeedback } from '../feedback/gameplayFeedback';

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
  useEffect(() => {
    if (!soundEffects || !supported) return;
    return subscribeGameplayFeedback(event => {
      const latest = preferencesStore.getState();
      if (latest.ready && !latest.loadFailed && latest.settings.soundEffects) audioController.gameplay(event);
    });
  }, [soundEffects, supported]);
  return <FeedbackProvider reducedMotion={!ready || loadFailed || settings.reducedMotion} haptics={ready && !loadFailed && settings.haptics}
    hapticsSupported={supported} onButtonFeedback={buttonFeedback} soundEffects={soundEffects} soundSupported={supported} onButtonSound={playSound}>{children}</FeedbackProvider>;
}
