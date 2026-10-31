/** Explicit opt-in Node/React audit. It measures test-renderer work, not native navigation/FPS. */
import React, { Profiler } from 'react';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import type { World } from '../../src/game/model';
import { ThemeProvider } from '../../src/ui/theme';
import { LifetimeStatisticsContent } from '../../src/ui/LifetimeStatisticsContent';
let mockWorld: World;
const mockDispatch = jest.fn(async () => true);
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() }, Redirect: () => null, useLocalSearchParams: () => ({}) }));
jest.mock('../../src/state/useGame', () => ({ useGame: (select: (state: unknown) => unknown) => select({ world: mockWorld, busy: false, error: null, dispatch: mockDispatch }) }));
import Life from '../../app/(game)/(tabs)/life';
import Relationships from '../../app/(game)/(tabs)/relationships';
import Assets from '../../app/(game)/(tabs)/assets';
import Activities from '../../app/(game)/(tabs)/activities';
const sha = (text: string) => createHash('sha256').update(text).digest('hex');
const summary = (values: number[]) => { const sorted = [...values].sort((a,b) => a-b); return { samples: values.length, medianMs: sorted[Math.floor(sorted.length/2)], p95Ms: sorted[Math.ceil(sorted.length * .95)-1] }; };
test('profile opening and unchanged-world updates for the current mobile screens', () => {
  const file = process.env.DREAMS_MOBILE_SCREEN_INPUTS!, destination = process.env.DREAMS_MOBILE_SCREEN_OUTPUT!;
  if (!file || !destination) throw Error('Set DREAMS_MOBILE_SCREEN_INPUTS and DREAMS_MOBILE_SCREEN_OUTPUT');
  const input = JSON.parse(readFileSync(file, 'utf8')) as { snapshots: { summary: { age: number }; payload: string }[] };
  const results = [];
  jest.spyOn(global, 'requestAnimationFrame').mockReturnValue(1);
  jest.spyOn(global, 'cancelAnimationFrame').mockImplementation(() => {});
  for (const snapshot of input.snapshots) {
    mockWorld = unpackCheckpoint(snapshot.payload, true);
    const screens: [string, React.ComponentType][] = [['Life', Life], ['Relationships', Relationships], ['Assets', Assets], ['Activities', Activities], ['Statistics', () => <LifetimeStatisticsContent world={mockWorld} personId={mockWorld.activePersonId} onBack={() => {}} />]];
    for (const [name, Screen] of screens) {
      const opening: number[] = [], updates: number[] = [], react: number[] = [];
      for (let i=0;i<14;i++) {
        let actualDuration = 0;
        const frame = () => <Profiler id={name} onRender={(_id,_phase,duration) => { actualDuration += duration; }}><SafeAreaProvider initialMetrics={{ frame: { x: 0,y: 0,width: 390,height: 844 },insets: { top: 47,bottom: 34,left: 0,right: 0 } }}><ThemeProvider><Screen /></ThemeProvider></SafeAreaProvider></Profiler>;
        let began = performance.now(); const view = render(frame()); const mounted = performance.now()-began;
        actualDuration = 0; began = performance.now(); view.rerender(frame()); const updated = performance.now()-began;
        if (i>=3) { opening.push(mounted); updates.push(updated); react.push(actualDuration); }
        view.unmount();
      }
      results.push({ age: snapshot.summary.age, screen: name, open: summary(opening), unchangedWorldUpdate: summary(updates), reactActualDuration: summary(react) });
    }
  }
  jest.restoreAllMocks();
  writeFileSync(destination, JSON.stringify({ scope: 'Cloud Node/Jest React test renderer, 390x844, three warm-ups and eleven measured samples. Mount/update/unmount proxies include all displayed history. Not native tab navigation, frames, memory or touch latency.', inputsSha256: sha(readFileSync(file,'utf8')), sourceHashes: Object.fromEntries(['app/(game)/(tabs)/life.tsx','app/(game)/(tabs)/relationships.tsx','app/(game)/(tabs)/assets.tsx','app/(game)/(tabs)/activities.tsx','src/ui/LifetimeStatisticsContent.tsx'].map(file => [file,sha(readFileSync(file,'utf8'))])), results },null,2)+'\n');
}, 300000);
