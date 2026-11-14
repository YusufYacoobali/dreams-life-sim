import React, { useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Redirect, router } from 'expo-router';
import Constants from 'expo-constants';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { isCommandProfilingEnabled } from '../src/access/buildAccess';
import { commandProfiler } from '../src/performance/internalProfiler';
import { beginCommandTiming } from '../src/performance/commandTiming';
import { readProfilingCheckpoint } from '../src/persistence/native';
import { gameStore, useGame } from '../src/state/useGame';
import { ageOn } from '../src/game/model';
import { Body, Button, Card, Header, Heading, Page } from '../src/ui/components';

export default function PerformanceDiagnostics() {
  return isCommandProfilingEnabled() ? <Diagnostics /> : <Redirect href="/settings" />;
}
function Diagnostics() {
  const busy = useGame(s => s.busy), world = useGame(s => s.world);
  const [status, setStatus] = useState(commandProfiler.status), [snapshot, setSnapshot] = useState(commandProfiler.snapshot), [message, setMessage] = useState<string | null>(null), [working, setWorking] = useState(false);
  const operating = useRef(false);
  const refresh = () => { setStatus(commandProfiler.status()); setSnapshot(commandProfiler.snapshot()); };
  const run = async (action: () => Promise<void>) => {
    if (operating.current || gameStore.getState().busy) return;
    operating.current = true; setWorking(true); setMessage(null);
    try { await action(); } catch { setMessage('The diagnostic operation could not finish. Your saved lives were kept.'); }
    finally { operating.current = false; setWorking(false); refresh(); }
  };
  const exportReport = async (share: boolean) => {
    commandProfiler.stop();
    const config = Constants.expoConfig, hermes = 'HermesInternal' in globalThis, revision = config?.extra?.profileSourceRevision;
    // Expo can normalize an unset extra value to an object in its manifest.
    const sourceRevision = typeof revision === 'string' && /^[a-f0-9]{7,40}$/.test(revision) ? revision : null;
    const report = commandProfiler.report({ platform: Platform.OS, osVersion: String(Platform.Version), appVersion: config?.version ?? 'unknown', build: Platform.OS === 'ios' ? config?.ios?.buildNumber ?? 'unknown' : String(config?.android?.versionCode ?? 'unknown'), sourceRevision, engine: hermes ? 'Hermes' : 'other', isolatedStorage: true });
    if (!report) return;
    const name = 'Dreams-performance-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json', text = JSON.stringify(report);
    if (share) {
      if (!await Sharing.isAvailableAsync()) { setMessage('Sharing is unavailable. Use Save JSON Report to choose a folder.'); return; }
      const file = new File(Paths.cache, name);
      try { file.write(text); await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: 'Dreams performance report' }); }
      finally { try { file.delete(); } catch { /* Cache cleanup is best effort. */ } }
    } else {
      const directory = await Directory.pickDirectoryAsync(), file = directory.createFile(name, 'application/json');
      try { file.write(text); } catch (error) { try { file.delete(); } catch {} throw error; }
      setMessage('Performance report saved.');
    }
  };
  const breakdown = Object.entries(snapshot?.summary ?? {}).filter(([key]) => /\/(complete|simulation|copy|draft:finish|validation|ledger-index|checkpoint|sqlite|native:transaction|store|journal|load|ui:busy-commit|ui:world-commit|ui:react-render)$/.test(key));
  return <Page bottomSafeArea><Header title="Performance Diagnostics" onBack={() => router.back()} />
    <Card><Heading size={19}>Internal performance recording</Heading><Body>Benchmark saves use a separate database. Import them from Saved Lives in this profiling app.</Body><Body muted>Recording retains up to 16,384 timing events in memory. It contains command types and ages, with no save names, text or financial values. Export stops recording.</Body>
      <Body>{status.recording ? 'Recording' : 'Stopped'} · {status.retainedEvents} retained · {status.overwrittenEvents} overwritten</Body>
      <Button label="Start Recording" disabled={status.recording || busy || working} onPress={() => { commandProfiler.start(); refresh(); }} />
      <Button label="Stop Recording" tone="secondary" disabled={!status.recording || busy || working} onPress={() => { commandProfiler.stop(); refresh(); }} />
      <Button label="Refresh Breakdown" tone="secondary" disabled={busy || working} onPress={refresh} />
      <Button label="Clear Recording" tone="secondary" disabled={busy || working} onPress={() => { commandProfiler.clear(); refresh(); }} />
    </Card>
    <Card><Heading size={19}>Collection</Heading><Body>Start recording, return to the game and perform the actions. Come back here to stop and export. Native first paint, frame stalls and memory require Instruments or Perfetto; JS frame callbacks do not measure visible paint.</Body>
      <Button label="Open Benchmark Saved Lives" disabled={busy || working} onPress={() => router.push('/saved-lives')} />
      <Button label="Cold Read Active Save" tone="secondary" disabled={!world || busy || working} onPress={() => { void run(async () => {
        const current = gameStore.getState().world; if (!current) return;
        const timing = beginCommandTiming('cold-reload',current.id,current.revision,ageOn(current.people[current.activePersonId],current.date));
        let ok = false;
        try { const loaded = await readProfilingCheckpoint(current.id); if (loaded.revision !== current.revision) throw new Error('Changed save'); ok = true; setMessage('Cold read completed using an independent connection and repository cache.'); }
        finally { timing?.finish(ok); }
      }); }} />
      <Button label="Share JSON Report" disabled={busy || working || !snapshot?.retainedEvents} onPress={() => { void run(() => exportReport(true)); }} />
      <Button label="Save JSON Report" tone="secondary" disabled={busy || working || !snapshot?.retainedEvents} onPress={() => { void run(() => exportReport(false)); }} />
    </Card>
    {message && <Card><Body>{message}</Body></Card>}
    <Card><Heading size={19}>Breakdown</Heading><Body muted>Milliseconds: p50 / p95 / maximum. Spans overlap. Completed traces only; overwritten or unfinished traces are excluded.</Body>
      {breakdown.length ? breakdown.map(([key,value]) => <Body key={key}>{key}: {value.p50.toFixed(1)} / {value.p95.toFixed(1)} / {value.max.toFixed(1)} ({value.samples})</Body>) : <Body>No completed measurements yet.</Body>}
    </Card>
  </Page>;
}
