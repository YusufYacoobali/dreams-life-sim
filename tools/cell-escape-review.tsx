// Isolated presentation fixture. Never imports a saved life or repository.
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SafeAreaInsetsContext, SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../src/ui/theme';
import { FeedbackProvider } from '../src/ui/feedback';
import { MiniGameScreen } from '../src/minigames/components/MiniGameScreen';
import { cellBoard } from '../src/minigames/escape/cellEscapeLogic';
import { evaluateSession } from '../src/minigames/core/evaluation';
import { ratingFor } from '../src/minigames/core/scoring';
import type { MiniGameSession } from '../src/minigames/core/types';

const params = new URLSearchParams(location.search);
const insets = { top: Number(params.get('top') ?? 59), bottom: Number(params.get('bottom') ?? 34), left: 0, right: 0 };
function Review() {
  const [session, setSession] = useState<MiniGameSession>({
    id: 'cell-layout-review', kind: 'escape', escapeVersion: 3, lifeId: 'practice', personId: 'practice',
    ownerId: 'practice', contextId: 'practice', started: { year: 2026, month: 1, day: 1 }, startedRevision: 0,
    difficulty: Number(params.get('difficulty') ?? 2), seed: 413, assisted: false,
    status: 'active', paused: false, elapsedMs: 0, inputs: [], score: null, rating: null, settled: null, appliedMonth: null,
  });
  const current = useRef(session); current.current = session;
  const update = (next: MiniGameSession) => { current.current = next; setSession(next); return true; };
  useEffect(() => { Object.assign(globalThis, { __cellSession: session, __cellBoard: cellBoard(session) }); }, [session]);
  return <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: innerWidth, height: innerHeight }, insets }}>
    <SafeAreaInsetsContext.Provider value={insets}>
      <ThemeProvider appearance={params.get('appearance') === 'light' ? 'light' : 'dark'}>
        <FeedbackProvider reducedMotion={params.get('motion') === 'reduce'} haptics={false} soundEffects={false}>
          <MiniGameScreen kind="escape" session={session} difficulty={session.difficulty} practice busy={false} error={null}
            onStart={async () => false} onSkip={async () => false} onExit={() => {}}
            onInput={async (action, at) => {
              const next = { ...current.current, elapsedMs: at, inputs: [...current.current.inputs, { at, action }] };
              evaluateSession(next); return update(next);
            }}
            onPause={async at => update({ ...current.current, elapsedMs: at, paused: true })}
            onResume={async () => update({ ...current.current, paused: false })}
            onForfeit={async () => update({ ...current.current, status: 'forfeited', paused: false, score: 0, rating: 'failed' })}
            onComplete={async at => {
              const outcome = evaluateSession(current.current);
              return outcome.finished && update({ ...current.current, elapsedMs: at, status: 'completed', paused: false, score: outcome.score, rating: ratingFor(outcome.score) });
            }} />
        </FeedbackProvider>
      </ThemeProvider>
    </SafeAreaInsetsContext.Provider>
  </SafeAreaProvider>;
}
createRoot(document.getElementById('root')!).render(<Review />);
