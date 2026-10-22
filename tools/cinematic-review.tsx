// Browser review of the actual SVG/Reanimated component over the existing
// welcome/birth/memorial UI. The adapter supplies read-only fixture state.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { cancelAnimation, Easing, useSharedValue, withTiming } from 'react-native-reanimated';
import { CinematicInk } from '../src/ui/cinematic/CinematicInk';
import { DURATION, type CinematicKind } from '../src/ui/cinematic/inkGeometry';
import Welcome from '../app/index';
import Birth from '../app/birth';
import Death from '../app/death';

const params = new URLSearchParams(location.search), kind = (params.get('kind') || 'welcome') as CinematicKind;
function Review() {
  const clock = useSharedValue(Number(params.get('t') || 0));
  React.useEffect(() => {
    Object.assign(window, {
      seek: (time: number) => { cancelAnimation(clock); clock.value = time; },
      play: () => { clock.value = 0; requestAnimationFrame(() => { clock.value = withTiming(DURATION[kind], { duration: DURATION[kind], easing: Easing.linear }); }); },
      ready: true,
    });
  }, [clock]);
  return <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: innerWidth, height: innerHeight }, insets: { top: 24, bottom: 24, left: 0, right: 0 } }}>
    {kind === 'welcome' ? <Welcome /> : kind === 'birth' ? <Birth /> : <Death />}
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}><CinematicInk kind={kind} clock={clock} /></div>
  </SafeAreaProvider>;
}
createRoot(document.getElementById('root')!).render(<Review />);
