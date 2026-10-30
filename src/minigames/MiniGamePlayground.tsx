import React, { useRef, useState } from 'react';
import { Redirect, router } from 'expo-router';
import { Image, Text } from 'react-native';
import { useInternalGodModeAccess } from '../ui/GodModeAccess';
import {
  ActionRow,
  Body,
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
import { challengeSeed, newChallengeDifficulty } from './core/difficulty';
import { evaluateSession } from './core/evaluation';
import { ratingFor } from './core/scoring';
import { sceneArt } from './components/sceneArtwork';

/** Deliberately has no store, repository, command-dispatch or native-save import. */
export function MiniGamePlayground() {
  const allowed = useInternalGodModeAccess(),
    [kind, setKind] = useState<MiniGameKind | null>(null),
    [session, setSession] = useState<MiniGameSession | null>(null),
    sequence = useRef(0),
    ref = useRef(session);
  ref.current = session;
  if (!allowed) return <Redirect href="/settings" />;
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
      difficulty: newChallengeDifficulty,
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
        difficulty={session?.difficulty ?? newChallengeDifficulty}
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
        <Heading size={22}>Just one more go</Heading>
        <Body>Pick a game. Practice freely without changing your saved life.</Body>
      </Card>
      <Card>
        {gameKinds.map((game) => (
          <ActionRow
            key={game}
            title={titles[game]}
            icon={game === 'escape' ? <Text accessible={false} style={{ fontSize: 32 }}>☆</Text> : <Image source={game === 'sports' ? sceneArt.ball : game === 'crime' ? sceneArt.dial : sceneArt.ship} resizeMode="contain" style={{ width: 40, height: 44 }} accessible={false} />}
            subtitle={
              game === 'sports'
                ? 'A penalty under stadium lights'
                : game === 'crime'
                  ? 'Three bolts before the alarm'
                  : game === 'escape'
                    ? 'Follow the stamps through a shifting board'
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
