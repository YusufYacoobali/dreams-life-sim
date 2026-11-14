export type CommandSpan = 'simulation' | 'validation' | 'checkpoint' | 'sqlite' | 'native:transaction' | 'load' | 'load:decode' | 'feedback' | 'review' | 'store' | 'copy' | 'draft:finish' | 'schema' | 'freeze' | 'ledger-index' | 'month' | 'annual' | 'journal' | 'checkpoint:serialize' | 'checkpoint:utf8' | 'checkpoint:hash' | 'checkpoint:compress' | 'checkpoint:base64' | 'checkpoint:main' | 'checkpoint:people' | 'checkpoint:ledger' | 'checkpoint:journal' | 'checkpoint:relationships';
export type CommandPhase = 'press' | 'busy' | 'after-yield' | `${CommandSpan}:start` | `${CommandSpan}:end` | 'publication' | 'ui:busy-commit' | 'ui:busy-frame' | 'ui:world-commit' | 'ui:world-frame' | 'ui:journal-scroll' | 'ui:journal-layout' | 'ui:journal-content' | 'ui:journal-drag' | 'ui:react-render' | 'complete' | 'failed';
export type CommandTimingEvent = { trace: number; command: string; age: number; phase: CommandPhase; elapsedMs: number; durationMs?: number };
type TimingSink = (trace: number, command: string, age: number, phase: CommandPhase, elapsedMs: number, durationMs?: number) => void;
type Trace = { id: number; command: string; age: number; started: number; lifeId: string; beforeRevision: number; publishedRevision?: number; observer: TimingSink };
let listener: TimingSink | null = null, active: Trace | null = null, last: Trace | null = null, sequence = 0, pressedAt: number | null = null;
const now = () => typeof performance !== 'undefined' ? performance.now() : Date.now();
function emit(trace: Trace, phase: CommandPhase, durationMs?: number) {
  if (listener !== trace.observer) return;
  try { listener(trace.id, trace.command, trace.age, phase, Math.max(0, now() - trace.started), durationMs); } catch { /* Optional observation cannot fail gameplay or persistence. */ }
}
/** Opt-in, process-local observation. No names, world content or saved metadata. */
export function observeCommandTimings(next: (event: CommandTimingEvent) => void) {
  return observeCommandTimingValues((trace, command, age, phase, elapsedMs, durationMs) => next({ trace, command, age, phase, elapsedMs, ...(durationMs === undefined ? {} : { durationMs }) }));
}
/** Allocation-free event delivery for the bounded internal recorder. */
export function observeCommandTimingValues(next: TimingSink) {
  listener = next;
  active = null; last = null;
  return () => { if (listener === next) { listener = null; active = null; last = null; pressedAt = null; } };
}
/** The synchronous native press handler, before dispatch or any UI work. */
export function beginCommandPress() {
  if (!listener) return undefined;
  const previous = pressedAt; pressedAt = now();
  return () => { pressedAt = previous; };
}
export function beginCommandTiming(command: string, lifeId: string, beforeRevision: number, age: number) {
  if (!listener || active) return null;
  const trace: Trace = { id: ++sequence, command, age, lifeId, beforeRevision, started: pressedAt ?? now(), observer: listener };
  active = trace; emit(trace, 'press');
  return { finish(ok: boolean) { emit(trace, ok ? 'complete' : 'failed'); if (active === trace) { last = trace; active = null; } } };
}
export function markCommandPhase(phase: CommandPhase) { if (active) emit(active, phase); }
export function beginCommandSpan(phase: CommandSpan) {
  if (!active) return undefined;
  const trace = active; emit(trace, `${phase}:start`);
  return () => emit(trace, `${phase}:end`);
}
/** UI work may run after dispatch's promise settles. Match the exact published
 * revision; the observer never receives identity or saved content. */
export function measurePublishedUi<T>(lifeId:string,revision:number,phase:'journal',work:()=>T):T {
  const trace=listener && [active,last].find(row=>row?.lifeId===lifeId && row.publishedRevision===revision);
  if(!trace) return work();
  emit(trace,`${phase}:start`); try{return work();}finally{emit(trace,`${phase}:end`);}
}
export function markJournalScroll(lifeId:string,revision:number) {
  const trace=listener && [active,last].find(row=>row?.lifeId===lifeId && row.publishedRevision===revision);
  if(trace) emit(trace,'ui:journal-scroll');
}
export function markPublishedUiEvent(lifeId: string, revision: number, phase: 'ui:journal-layout' | 'ui:journal-content' | 'ui:journal-drag' | 'ui:react-render', durationMs?: number) {
  if (!listener) return;
  const trace = active?.lifeId === lifeId && active.publishedRevision === revision ? active : last?.lifeId === lifeId && last.publishedRevision === revision ? last : null;
  if (trace) emit(trace, phase, durationMs);
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
