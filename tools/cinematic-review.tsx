// Browser review of the actual bundled native asset over the existing
// welcome/birth/memorial UI. The adapter supplies read-only fixture state.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ReviewInk } from './cinematic-review/Ink';
import type { CinematicKind } from '../src/ui/cinematic/cinematicTiming';
import Welcome from '../app/index';
import Birth from '../app/birth';
import Death from '../app/death';

const params = new URLSearchParams(location.search), kind = (params.get('kind') || 'welcome') as CinematicKind;
function Review() {
  return <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: innerWidth, height: innerHeight }, insets: { top: 24, bottom: 24, left: 0, right: 0 } }}>
    {kind === 'welcome' ? <Welcome /> : kind === 'birth' ? <Birth /> : <Death />}
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, pointerEvents: 'none' }}><ReviewInk kind={kind} /></div>
  </SafeAreaProvider>;
}
createRoot(document.getElementById('root')!).render(<Review />);
