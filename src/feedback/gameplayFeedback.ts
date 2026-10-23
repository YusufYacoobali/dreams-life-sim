export type GameplayCue = 'age-up' | 'big-success' | 'purchase' | 'error';
export type GameplayFeedback = { id: string; cues: readonly GameplayCue[]; silence?: boolean };

// Live notifications only: no persisted queue, history subscription or replay.
const listeners = new Set<(event: GameplayFeedback) => void>();
export function emitGameplayFeedback(event: GameplayFeedback) {
  for (const listener of listeners) {
    try { listener(event); } catch { /* Optional feedback cannot fail a save. */ }
  }
}
export function subscribeGameplayFeedback(listener: (event: GameplayFeedback) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
