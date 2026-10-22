import React, { useRef, useState } from 'react';
import { router } from 'expo-router';
import { useGodModeAccess } from '../ui/GodModeAccess';
import {
  ActionRow,
  Body,
  Button,
  Card,
  Header,
  Heading,
  Page,
} from '../ui/components';
import { MiniGameScreen } from './components/MiniGameScreen';
import {
  gameKinds,
  titles,
  type MiniGameKind,
  type MiniGameSession,
} from './core/types';
import { challengeSeed } from './core/difficulty';
import { evaluateSession } from './core/evaluation';
import { ratingFor } from './core/scoring';

/** Deliberately has no store, repository, command-dispatch or native-save import. */
export function MiniGamePlayground() {
  const allowed = useGodModeAccess(),
    [kind, setKind] = useState<MiniGameKind | null>(null),
    [difficulty, setDifficulty] = useState(3),
    [session, setSession] = useState<MiniGameSession | null>(null),
    sequence = useRef(0),
    ref = useRef(session);
  ref.current = session;
  if (!allowed)
    return (
      <Page bottomSafeArea>
        <Header title="Mini-Game Playground" onBack={() => router.back()} />
        <Body>
          The playground is available in internal/developer builds with God Mode
          enabled.
        </Body>
      </Page>
    );
  const start = async (assisted: boolean) => {
    const id = 'practice_' + ++sequence.current;
    setSession({
      id,
      lifeId: 'practice',
      personId: 'practice',
      kind: kind!,
      ownerId: 'practice',
      contextId: 'practice',
      started: { year: 2026, month: 1, day: 1 },
      startedRevision: 0,
      difficulty,
      seed: challengeSeed(id),
      assisted,
      status: 'active',
      paused: false,
      elapsedMs: 0,
      inputs: [],
      score: null,
      rating: null,
      settled: null,
      appliedMonth: null,
    });
    return true;
  };
  const update = (next: MiniGameSession) => {
    ref.current = next;
    setSession(next);
    return true;
  };
  if (kind)
    return (
      <MiniGameScreen
        key={kind + ':' + sequence.current}
        kind={kind}
        session={session}
        difficulty={difficulty}
        practice
        error={null}
        busy={false}
        onStart={start}
        onInput={async (action, at) => {
          if (!ref.current) return false;
          const next = {
            ...ref.current,
            elapsedMs: at,
            inputs: [...ref.current.inputs, { at, action }],
          };
          evaluateSession(next);
          return update(next);
        }}
        onPause={async (at) =>
          !!ref.current &&
          update({ ...ref.current, elapsedMs: at, paused: true })
        }
        onResume={async () =>
          !!ref.current && update({ ...ref.current, paused: false })
        }
        onComplete={async (at) => {
          if (!ref.current) return false;
          const next = { ...ref.current, elapsedMs: at },
            outcome = evaluateSession(next);
          if (!outcome.finished) return false;
          return update({
            ...next,
            status: 'completed',
            paused: false,
            score: outcome.score,
            rating: ratingFor(outcome.score),
            settled: { year: 2026, month: 1, day: 1 },
          });
        }}
        onForfeit={async () =>
          !!ref.current &&
          update({
            ...ref.current,
            status: 'forfeited',
            score: 0,
            rating: 'failed',
            paused: false,
            settled: { year: 2026, month: 1, day: 1 },
          })
        }
        onExit={() => {
          setKind(null);
          setSession(null);
        }}
        onSkip={async () => {
          setKind(null);
          setSession(null);
          return true;
        }}
        onRestart={() => {
          void start(ref.current?.assisted ?? false);
        }}
      />
    );
  return (
    <Page bottomSafeArea>
      <Header title="Mini-Game Playground" onBack={() => router.back()} />
      <Card>
        <Heading size={22}>Play, test, repeat</Heading>
        <Body>
          Practice freely. Saved lives and career records stay unchanged, and no
          qualifications are required.
        </Body>
        <Heading size={18}>Difficulty {difficulty} of 5</Heading>
        {[1, 2, 3, 4, 5].map((level) => (
          <Button
            key={level}
            label={'Level ' + level}
            tone={difficulty === level ? 'primary' : 'secondary'}
            accessibilityRole="radio"
            accessibilityState={{ checked: difficulty === level }}
            onPress={() => setDifficulty(level)}
          />
        ))}
      </Card>
      <Card>
        {gameKinds.map((game) => (
          <ActionRow
            key={game}
            title={titles[game]}
            subtitle={
              game === 'sports'
                ? 'A penalty under stadium lights'
                : game === 'crime'
                  ? 'Three bolts before the alarm'
                  : 'A drifting approach above Earth'
            }
            onPress={() => {
              setSession(null);
              setKind(game);
            }}
          />
        ))}
      </Card>
    </Page>
  );
}
