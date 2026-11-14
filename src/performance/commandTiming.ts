export type CommandPhase = 'press' | 'busy' | 'after-yield' | 'simulation:start' | 'simulation:end' | 'validation:start' | 'validation:end' | 'checkpoint:start' | 'checkpoint:end' | 'sqlite:start' | 'sqlite:end' | 'feedback:start' | 'feedback:end' | 'review:start' | 'review:end' | 'publication' | 'ui:busy-commit' | 'ui:busy-frame' | 'ui:world-commit' | 'ui:world-frame' | 'complete' | 'failed';
export type CommandTimingEvent = { trace: number; command: string; age: number; phase: CommandPhase; elapsedMs: number };
type Trace = { id: number; command: string; age: number; started: number; lifeId: string; beforeRevision: number; publishedRevision?: number; observer: (event: CommandTimingEvent) => void };
let listener: ((event: CommandTimingEvent) => void) | null = null, active: Trace | null = null, last: Trace | null = null, sequence = 0;
const now = () => typeof performance !== 'undefined' ? performance.now() : Date.now();
function emit(trace: Trace, phase: CommandPhase) {
  if (listener !== trace.observer) return;
  try { listener({ trace: trace.id, command: trace.command, age: trace.age, phase, elapsedMs: Math.max(0, now() - trace.started) }); } catch { /* Optional observation cannot fail gameplay or persistence. */ }
}
/** Opt-in, process-local observation. No names, world content or saved metadata. */
export function observeCommandTimings(next: (event: CommandTimingEvent) => void) {
  listener = next;
  return () => { if (listener === next) { listener = null; active = null; last = null; } };
}
export function beginCommandTiming(command: string, lifeId: string, beforeRevision: number, age: number) {
  if (!listener || active || !['advance', 'resume'].includes(command)) return null;
  const trace: Trace = { id: ++sequence, command, age, lifeId, beforeRevision, started: now(), observer: listener };
  active = trace; emit(trace, 'press');
  return { finish(ok: boolean) { emit(trace, ok ? 'complete' : 'failed'); if (active === trace) { last = trace; active = null; } } };
}
export function markCommandPhase(phase: CommandPhase) { if (active) emit(active, phase); }
export function beginCommandSpan(phase: 'simulation' | 'validation' | 'checkpoint' | 'sqlite' | 'feedback' | 'review') {
  if (!active) return undefined;
  const trace = active; emit(trace, `${phase}:start`);
  return () => emit(trace, `${phase}:end`);
}
export function measureCommandPhase<T>(phase: Parameters<typeof beginCommandSpan>[0], work: () => T): T {
  const end = beginCommandSpan(phase); try { return work(); } finally { end?.(); }
}
export function measureCommandAsync<T>(phase: Parameters<typeof beginCommandSpan>[0], work: () => Promise<T>): Promise<T> {
  const end = beginCommandSpan(phase);
  if (!end) return work();
  try { return work().finally(end); } catch (error) { end(); throw error; }
}
export function markCommandPublished(lifeId: string, revision: number) {
  if (active?.lifeId === lifeId) { active.publishedRevision = revision; emit(active, 'publication'); }
}
/** Commit and frame opportunities are JS observations, not GPU-paint measurements. */
export function markCommandUi(lifeId: string, revision: number, busy: boolean) {
  if (!listener) return;
  const trace = [active, last].find(row => row?.lifeId === lifeId && (busy ? row.beforeRevision === revision : row.publishedRevision === revision));
  if (!trace || !listener) return;
  emit(trace, busy ? 'ui:busy-commit' : 'ui:world-commit');
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => emit(trace, busy ? 'ui:busy-frame' : 'ui:world-frame'));
}
