/** Opt-in cloud React/projection benchmark; never a native frame-rate claim.
 * Run this file explicitly with Jest's testMatch extended to .bench.tsx files.
 * DREAMS_JOURNAL_PHASE=baseline|after DREAMS_JOURNAL_OUTPUT=/tmp/report.json */
import React, { Profiler } from 'react';
import { FlatList } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import ts from 'typescript';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import { ageOn, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { createJournalProjection } from '../../src/ui/journalProjection';
import { ThemeProvider } from '../../src/ui/theme';
import * as components from '../../src/ui/components';

let mockWorld: World;
const mockDispatch = jest.fn(async () => true);
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: (state: unknown) => unknown) => selector({ world: mockWorld, busy: false, error: null, dispatch: mockDispatch }) }));
import Life from '../../app/(game)/(tabs)/life';

type Input = { scope: string; snapshots: { summary: { age: number; revision: number; journalRows: number; sha256: string }; payload: string }[] };
const sha = (value: string) => createHash('sha256').update(value).digest('hex');
const stats = (values: number[]) => { const sorted = [...values].sort((a, b) => a - b); return { medianMs: sorted[Math.floor(sorted.length / 2)], p95Ms: sorted[Math.ceil(sorted.length * .95) - 1], samples: sorted.length }; };

test('profile unchanged real saved lives and committed engine continuations without hiding journal rows', () => {
  const phase = process.env.DREAMS_JOURNAL_PHASE;
  if (!['baseline', 'after'].includes(phase ?? '')) throw new Error('Set DREAMS_JOURNAL_PHASE=baseline or after');
  const inputFile = process.env.DREAMS_JOURNAL_INPUTS ?? '/tmp/dreams-final-perf-inputs.json';
  const inputs: Input = JSON.parse(readFileSync(inputFile, 'utf8'));
  expect(inputs.snapshots.map(row => row.summary.age)).toEqual([10, 25, 50, 70, 90]);
  const source = readFileSync('app/(game)/(tabs)/life.tsx', 'utf8');
  const body = readFileSync('docs/verification/final-polish/performance-ui/baseline-projection-body.txt', 'utf8');
  const baselinePin = JSON.parse(readFileSync('docs/verification/final-polish/performance-ui/baseline-source.json', 'utf8'));
  expect(sha(body)).toBe(baselinePin.projectionBodySha256);
  if (phase === 'baseline') expect(sha(source)).toBe(baselinePin.sha256);
  const compiled = ts.transpileModule('exports.project = (rowCache:any,journalScope:any,entries:any,player:any,ageOn:any) => ' + body, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports: { project?: (...args: any[]) => any } = {};
  new Function('exports', compiled)(exports);
  const baselineProject = () => {
    const rowCache = { current: null };
    return (world: World) => {
      const player = world.people[world.activePersonId];
      const entries = world.journal.filter(entry => entry.personId === player.id);
      const scope = JSON.stringify([world.id, player.id, world.date.year, world.date.month, world.date.day, player.born.year, player.born.month, player.born.day]);
      return exports.project!(rowCache, scope, entries, player, ageOn);
    };
  };
  const improvedProject = () => {
    const project = createJournalProjection();
    return (world: World) => project(world.journal, { lifeId: world.id, personId: world.activePersonId, born: world.people[world.activePersonId].born }, world).rows;
  };
  jest.spyOn(global, 'requestAnimationFrame').mockReturnValue(1);
  jest.spyOn(global, 'cancelAnimationFrame').mockImplementation(() => {});
  const bodyRender = jest.spyOn(components, 'Body');
  const results: unknown[] = [];
  for (const input of inputs.snapshots) {
    const before = unpackCheckpoint(input.payload, true);
    const person = before.people[before.activePersonId];
    const routine = resolveCommand(before, { type: 'health-routine', routine: { ...person.health.routine, mindfulness: !person.health.routine.mindfulness } }, true);
    const annual = resolveCommand(before, { type: 'advance' }, true);
    for (const [label, after] of [['routine', routine], ['age-up-first-step', annual]] as const) {
      const project = phase === 'baseline' ? baselineProject() : improvedProject();
      const projectionTimes: number[] = [], reused: number[] = [];
      for (let sample = 0; sample < 34; sample++) {
        const priorRows = project(before), start = performance.now(), rows = project(after), elapsed = performance.now() - start;
        expect(rows.length).toBe(after.journal.filter(row => row.personId === person.id).length);
        if (sample >= 3) { projectionTimes.push(elapsed); reused.push(rows.filter((row: unknown, index: number) => row === priorRows[index]).length); }
      }
      mockWorld = before;
      const durations: number[] = []; let measuring = false;
      const onRender: React.ProfilerOnRenderCallback = (_id, _phase, actualDuration) => { if (measuring) durations.push(actualDuration); };
      const frame = () => <Profiler id="life" onRender={onRender}><SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><Life /></ThemeProvider></SafeAreaProvider></Profiler>;
      const view = render(frame());
      const renderTimes: number[] = [], reactTimes: number[] = [], bodyCounts: number[] = [];
      for (let sample = 0; sample < 34; sample++) {
        mockWorld = before; view.rerender(frame());
        const priorBodyCount = bodyRender.mock.calls.length, priorDurationCount = durations.length;
        mockWorld = after; measuring = true; const start = performance.now();
        act(() => { view.rerender(frame()); });
        const elapsed = performance.now() - start; measuring = false;
        expect(view.UNSAFE_getByType(FlatList).props.data).toHaveLength(after.journal.filter(row => row.personId === person.id).length);
        if (sample >= 3) {
          renderTimes.push(elapsed); reactTimes.push(durations.slice(priorDurationCount).reduce((sum, value) => sum + value, 0)); bodyCounts.push(bodyRender.mock.calls.length - priorBodyCount);
        }
      }
      view.unmount();
      results.push({ age: input.summary.age, command: label, revision: before.revision, beforeJournalRows: before.journal.length, afterJournalRows: after.journal.length, inputCheckpointSha256: sha(input.payload), inputWorldHashRecorded: input.summary.sha256, projection: stats(projectionTimes), reusedHistoricalRows: reused[0], reactRenderAndCommit: stats(renderTimes), reactProfilerActualDuration: stats(reactTimes), bodyRendersPerCommit: bodyCounts[0] });
    }
  }
  bodyRender.mockRestore(); jest.restoreAllMocks();
  const report = {
    phase, environment: 'Cloud Node/Jest React test renderer at 390×844. This is JS projection and component render/commit work, not native Android/iOS frame timing, touch latency, SQLite or engine simulation time.',
    scope: inputs.scope, inputsSha256: sha(readFileSync(inputFile, 'utf8')), baselinePin,
    sourceHashes: Object.fromEntries(['app/(game)/(tabs)/life.tsx', 'src/ui/journalProjection.ts', 'src/game/model.ts', 'tests/performance/life-journal-render.bench.tsx'].map(file => [file, sha(readFileSync(file, 'utf8'))])), results,
  };
  writeFileSync(process.env.DREAMS_JOURNAL_OUTPUT ?? '/tmp/dreams-journal-' + phase + '.json', JSON.stringify(report, null, 2) + '\n');
}, 180000);
