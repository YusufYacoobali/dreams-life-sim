import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

type Feedback = { reducedMotion: boolean; deviceReducedMotion: boolean | null; hapticsSupported: boolean; soundSupported: boolean; buttonFeedback: () => void };
const FeedbackContext = createContext<Feedback>({ reducedMotion: false, deviceReducedMotion: null,
  hapticsSupported: Platform.OS === 'ios' || Platform.OS === 'android', soundSupported: Platform.OS === 'ios' || Platform.OS === 'android', buttonFeedback: () => {} });

export function FeedbackProvider({ children, reducedMotion, haptics, onButtonFeedback, hapticsSupported = true, soundEffects = false, onButtonSound, soundSupported = true }:
  React.PropsWithChildren<{ reducedMotion: boolean; haptics: boolean; onButtonFeedback: () => Promise<void>; hapticsSupported?: boolean; soundEffects?: boolean; onButtonSound?: () => Promise<void>; soundSupported?: boolean }>) {
  const [deviceReducedMotion, setDeviceReducedMotion] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true, changed = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', enabled => {
      changed = true; if (active) setDeviceReducedMotion(enabled);
    });
    // Until the device responds, avoid animating. A newer native event wins over the initial query.
    try { void AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      if (active && !changed) setDeviceReducedMotion(enabled);
    }, () => {}); } catch { /* An unavailable accessibility API keeps motion reduced. */ }
    return () => { active = false; subscription.remove(); };
  }, []);
  const buttonFeedback = useCallback(() => {
    // Optional hardware feedback never delays an action or turns a successful action into an error.
    if (haptics && hapticsSupported) { try { void onButtonFeedback().catch(() => {}); } catch { /* Native feedback may be unavailable. */ } }
    if (soundEffects && soundSupported && onButtonSound) { try { void onButtonSound().catch(() => {}); } catch { /* Native audio may be unavailable. */ } }
  }, [haptics, hapticsSupported, onButtonFeedback, soundEffects, soundSupported, onButtonSound]);
  return <FeedbackContext.Provider value={{ reducedMotion: reducedMotion || deviceReducedMotion !== false, deviceReducedMotion, hapticsSupported, soundSupported, buttonFeedback }}>{children}</FeedbackContext.Provider>;
}

export function useFeedback() { return useContext(FeedbackContext); }
