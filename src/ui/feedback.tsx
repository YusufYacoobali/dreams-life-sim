import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

type Feedback = { reducedMotion: boolean; deviceReducedMotion: boolean | null; hapticsSupported: boolean; soundSupported: boolean; hapticFeedback: () => void; buttonFeedback: () => void };
const FeedbackContext = createContext<Feedback>({ reducedMotion: false, deviceReducedMotion: null,
  hapticsSupported: Platform.OS === 'ios' || Platform.OS === 'android', soundSupported: Platform.OS === 'ios' || Platform.OS === 'android', hapticFeedback: () => {}, buttonFeedback: () => {} });

export function FeedbackProvider({ children, reducedMotion, haptics, onButtonFeedback, hapticsSupported = true, soundEffects = false, onButtonSound, soundSupported = true }:
  React.PropsWithChildren<{ reducedMotion: boolean; haptics: boolean; onButtonFeedback: () => Promise<void>; hapticsSupported?: boolean; soundEffects?: boolean; onButtonSound?: () => Promise<void>; soundSupported?: boolean }>) {
  const [deviceReducedMotion, setDeviceReducedMotion] = useState<boolean | null>(null);
  const mounted = useRef(true), current = useRef({ haptics, hapticsSupported, onButtonFeedback, soundEffects, soundSupported, onButtonSound });
  current.current = { haptics, hapticsSupported, onButtonFeedback, soundEffects, soundSupported, onButtonSound };
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
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
  const hapticFeedback = useCallback(() => {
    // Optional hardware feedback never delays an action or turns a successful action into an error.
    const latest = current.current;
    if (mounted.current && latest.haptics && latest.hapticsSupported) { try { void latest.onButtonFeedback().catch(() => {}); } catch { /* Native feedback may be unavailable. */ } }
  }, []);
  const buttonFeedback = useCallback(() => {
    hapticFeedback();
    const latest = current.current;
    if (mounted.current && latest.soundEffects && latest.soundSupported && latest.onButtonSound) { try { void latest.onButtonSound().catch(() => {}); } catch { /* Native audio may be unavailable. */ } }
  }, [hapticFeedback]);
  return <FeedbackContext.Provider value={{ reducedMotion: reducedMotion || deviceReducedMotion !== false, deviceReducedMotion, hapticsSupported, soundSupported, hapticFeedback, buttonFeedback }}>{children}</FeedbackContext.Provider>;
}

export function useFeedback() { return useContext(FeedbackContext); }

/** Accept the action first. Hardware promises never hold a tap or save open. */
export function useFeedbackPress<Args extends unknown[]>(onPress: (...args: Args) => unknown, disabled = false, includeSound = false) {
  const { hapticFeedback, buttonFeedback } = useFeedback();
  const mounted = useRef(true), pressing = useRef(false), current = useRef({ disabled, feedback: includeSound ? buttonFeedback : hapticFeedback });
  current.current = { disabled, feedback: includeSound ? buttonFeedback : hapticFeedback };
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  return useCallback((...args: Args) => {
    // React may render and bail out with a new inline callback. Its identity
    // cannot invalidate the already committed native press handler.
    if (!mounted.current || current.current.disabled || pressing.current) return false;
    pressing.current = true;
    let action: unknown;
    try { action = onPress(...args); }
    catch (error) { pressing.current = false; throw error; }
    if (action !== false) current.current.feedback();
    const release = () => { pressing.current = false; };
    // A returned save promise also rejects duplicate native callbacks before a rerender.
    if (action && typeof (action as PromiseLike<unknown>).then === 'function') void Promise.resolve(action).then(release, release);
    else release();
    return action;
  }, [onPress]);
}
