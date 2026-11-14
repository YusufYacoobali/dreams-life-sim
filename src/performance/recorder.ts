import { observeCommandTimingValues, type CommandPhase, type CommandTimingEvent } from './commandTiming';

export type PerformanceEnvironment = { platform: string; osVersion: string; appVersion: string; build: string; sourceRevision: string | null; engine: 'Hermes' | 'other'; isolatedStorage: boolean };
const quantiles = (values: number[]) => {
  values.sort((a, b) => a - b);
  return { samples: values.length, p50: values[Math.ceil(values.length * .5) - 1], p95: values[Math.ceil(values.length * .95) - 1], max: values[values.length - 1] };
};

/** No subscription, clocks, buffers or event objects until explicitly started.
 * Slots are overwritten in place; snapshots/aggregation happen on request only. */
export function createPerformanceRecorder(permitted: () => boolean, capacity = 16_384) {
  if (!Number.isInteger(capacity) || capacity < 16 || capacity > 65_536) throw new Error('Invalid profiler capacity');
  let rows: { trace: Float64Array; elapsed: Float64Array; duration: Float64Array; age: Uint16Array; command: string[]; phase: CommandPhase[] } | null = null;
  let cursor = 0, count = 0, overwritten = 0, total = 0, startedAt: string | null = null, stoppedAt: string | null = null, detach: (() => void) | null = null;
  function stop() { detach?.(); detach = null; if (startedAt && !stoppedAt) stoppedAt = new Date().toISOString(); }
  function clear() { stop(); rows = null; cursor = count = overwritten = total = 0; startedAt = stoppedAt = null; }
  function start() {
    if (!permitted()) return false;
    clear();
    rows = { trace: new Float64Array(capacity), elapsed: new Float64Array(capacity), duration: new Float64Array(capacity), age: new Uint16Array(capacity), command: new Array(capacity), phase: new Array(capacity) };
    startedAt = new Date().toISOString();
    detach = observeCommandTimingValues((trace, command, age, phase, elapsed, duration) => {
      const data = rows!;
      data.trace[cursor] = trace; data.command[cursor] = command; data.age[cursor] = age; data.phase[cursor] = phase; data.elapsed[cursor] = elapsed; data.duration[cursor] = duration ?? NaN;
      cursor = (cursor + 1) % capacity; total++;
      if (count < capacity) count++; else overwritten++;
    });
    return true;
  }
  function snapshot() {
    if (!permitted()) return null;
    const events: CommandTimingEvent[] = [];
    if (rows) for (let offset = 0; offset < count; offset++) {
      const i = (cursor - count + offset + capacity) % capacity, durationMs = rows.duration[i];
      events.push({ trace: rows.trace[i], command: rows.command[i], age: rows.age[i], phase: rows.phase[i], elapsedMs: rows.elapsed[i], ...(Number.isNaN(durationMs) ? {} : { durationMs }) });
    }
    const traces = new Map<number, CommandTimingEvent[]>();
    for (const event of events) { const trace = traces.get(event.trace) ?? []; trace.push(event); traces.set(event.trace, trace); }
    const groups: Record<string, number[]> = {}, counts: Record<string, number> = {};
    let completeTraces = 0, partialTraces = 0;
    for (const trace of traces.values()) {
      // Never turn an overwritten start or interrupted trace into a latency.
      if (trace[0].phase !== 'press' || !trace.some(row => row.phase === 'complete' || row.phase === 'failed')) { partialTraces++; continue; }
      completeTraces++;
      const starts = new Map<string, number[]>();
      for (const event of trace) {
        const prefix = event.command + '/age-' + event.age + '/', key = prefix + event.phase;
        counts[key] = (counts[key] ?? 0) + 1;
        if (event.phase.endsWith(':start')) { const name = event.phase.slice(0, -6), stack = starts.get(name) ?? []; stack.push(event.elapsedMs); starts.set(name, stack); }
        else if (event.phase.endsWith(':end')) { const name = event.phase.slice(0, -4), start = starts.get(name)?.pop(); if (start !== undefined) (groups[prefix + name] ??= []).push(event.elapsedMs - start); }
        else (groups[key] ??= []).push(event.durationMs ?? event.elapsedMs);
      }
    }
    return { format: 'dreams-performance-report' as const, version: 1 as const, startedAt, stoppedAt, recording: detach !== null, capacity, retainedEvents: count, totalEvents: total, overwrittenEvents: overwritten, completeTraces, partialTraces,
      interpretation: { press: 'Synchronous JS press-handler entry, or dispatch entry for programmatic commands.', phases: 'Inclusive JS durations; nested spans overlap. Native transaction includes asynchronous bridge scheduling and SQLite.', feedback: 'Busy/world commits and animation frames are JS observations, not native visible-paint timestamps.', react: 'React onRender duration is present only when the installed React build supports profiling.', privacy: 'Command type, age, phase and durations only. No save identity or content.', nativeMeasurements: 'Not collected by this recorder. Attach Instruments/Perfetto results separately.' },
      summary: Object.fromEntries(Object.entries(groups).map(([key, values]) => [key, quantiles(values)])), counts, events };
  }
  function report(environment: PerformanceEnvironment) { const result = snapshot(); return result ? { ...result, environment, native: { firstVisibleFeedbackMs: null, updatedScreenPaintMs: null, frameStalls: null, allocationBytes: null, peakMemoryBytes: null } } : null; }
  return { start, stop, clear, snapshot, report, status: () => ({ recording: detach !== null, retainedEvents: count, overwrittenEvents: overwritten }) };
}
