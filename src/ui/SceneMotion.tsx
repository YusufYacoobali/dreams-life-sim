import React, { useEffect, useRef, useState } from 'react';
import { Animated, AppState, Easing, View, type StyleProp, type ViewStyle } from 'react-native';
import { useFeedback } from './feedback';

export type SceneMotionFrame = { progress: Animated.Value; motionEnabled: boolean };

/** Decorative only: never wrap a heading, form, button or other accessible content. */
export function SceneMotion({ identity, duration = 1600, style, children }: {
  identity: string; duration?: number; style?: StyleProp<ViewStyle>;
  children: (frame: SceneMotionFrame) => React.ReactNode;
}) {
  const { reducedMotion, deviceReducedMotion } = useFeedback();
  const progress = useRef(new Animated.Value(1)).current;
  const visit = useRef({ identity, appeared: Date.now(), started: false, finished: false });
  const [motionEnabled, setMotionEnabled] = useState(false);
  const milliseconds = Number.isFinite(duration) ? Math.max(1, Math.min(1800, duration)) : 1600;

  useEffect(() => {
    let active = true, animation: Animated.CompositeAnimation | undefined;
    if (visit.current.identity !== identity) visit.current = { identity, appeared: Date.now(), started: false, finished: false };
    const current = visit.current;
    const settle = () => {
      const running = animation;
      animation = undefined;
      running?.stop();
      progress.setValue(1);
      if (active) setMotionEnabled(false);
    };
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') { current.finished = true; settle(); }
      // Returning to the foreground does not replay a scene already seen.
    });

    if (deviceReducedMotion === null) settle();
    else if (reducedMotion || AppState.currentState !== 'active') { current.finished = true; settle(); }
    else if (!current.started && !current.finished) {
      // A late OS answer leaves the existing composition still, rather than making it jump backwards.
      if (Date.now() - current.appeared > 500) { current.finished = true; settle(); }
      else {
        current.started = true;
        progress.setValue(0);
        setMotionEnabled(true);
        animation = Animated.timing(progress, { toValue: 1, duration: milliseconds, easing: Easing.out(Easing.cubic), useNativeDriver: true, isInteraction: false });
        animation.start(() => { current.finished = true; if (active) settle(); });
      }
    }
    return () => {
      active = false;
      subscription.remove();
      animation?.stop();
      progress.setValue(1);
    };
  }, [identity, milliseconds, reducedMotion, deviceReducedMotion, progress]);

  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={style}>
    {children({ progress, motionEnabled })}
  </View>;
}
