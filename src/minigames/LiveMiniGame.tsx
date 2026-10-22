import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { gameStore, useGame } from '../state/useGame';
import {
  activeMiniGame,
  challengeContext,
  miniGameReason,
} from './core/eligibility';
import {
  gameKinds,
  type MiniGameAction,
  type MiniGameCommand,
} from './core/types';
import { evaluateSession } from './core/evaluation';
import { MiniGameScreen } from './components/MiniGameScreen';
import { Body, Button, Header, Page } from '../ui/components';
export function LiveMiniGame() {
  const params = useLocalSearchParams<{
      kind: string;
      ownerId: string;
      contextId: string;
    }>(),
    world = useGame((state) => state.world),
    busy = useGame((state) => state.busy),
    error = useGame((state) => state.error);
  if (
    !world ||
    !world.birthAcknowledged ||
    world.people[world.activePersonId].died
  )
    return (
      <Page>
        <Header title="Mini-game" />
        <Body>Open a living character first.</Body>
        <Button label="Back" onPress={() => router.back()} />
      </Page>
    );
  const pending = activeMiniGame(world),
    kind = gameKinds.find((value) => value === params.kind) ?? pending?.kind;
  if (!kind)
    return (
      <Page>
        <Header title="Mini-game" />
        <Body>Choose a challenge from your career or Crime screen.</Body>
        <Button label="Back" onPress={() => router.back()} />
      </Page>
    );
  const ownerId = params.ownerId ?? pending?.ownerId ?? '',
    contextId = params.contextId ?? pending?.contextId ?? '',
    session =
      world.miniGames.find(
        (row) =>
          row.personId === world.activePersonId &&
          row.kind === kind &&
          row.ownerId === ownerId &&
          row.contextId === contextId,
      ) ?? null;
  const dispatch = async (command: MiniGameCommand) => {
    const current = gameStore.getState();
    if (
      current.world?.id !== world.id ||
      current.world.activePersonId !== world.activePersonId
    )
      return false;
    return current.dispatch(command);
  };
  const getSession = () =>
    gameStore
      .getState()
      .world?.miniGames.find(
        (row) =>
          row.personId === world.activePersonId &&
          row.kind === kind &&
          row.ownerId === ownerId &&
          row.contextId === contextId,
      );
  const pause = async (at: number) => {
    const row = getSession();
    if (!row) return false;
    if (
      row.status !== 'active' ||
      (row.paused && row.elapsedMs >= Math.round(at))
    )
      return true;
    return dispatch({
      type: 'mini-game-pause',
      sessionId: row.id,
      elapsedMs: Math.max(row.elapsedMs, Math.round(at)),
    });
  };
  const complete = async (at: number) => {
    const row = getSession();
    if (!row) return false;
    if (row.status !== 'active') return true;
    if (!evaluateSession(row).finished && !(await pause(at))) return false;
    return dispatch({ type: 'mini-game-complete', sessionId: row.id });
  };
  return (
    <MiniGameScreen
      key={world.id + ':' + world.activePersonId + ':' + kind + ':' + contextId}
      kind={kind}
      session={session}
      difficulty={
        session?.difficulty ??
        challengeContext(world, kind, ownerId, contextId)?.difficulty ??
        3
      }
      error={error}
      busy={busy}
      unavailable={
        session ? undefined : miniGameReason(world, kind, ownerId, contextId)
      }
      onStart={(assisted) =>
        dispatch({
          type: 'mini-game-start',
          kind,
          ownerId,
          contextId,
          assisted,
        })
      }
      onInput={async (action: MiniGameAction, at: number) => {
        const row = getSession();
        return (
          !!row &&
          dispatch({
            type: 'mini-game-input',
            sessionId: row.id,
            index: row.inputs.length,
            input: { at: Math.round(at), action },
          })
        );
      }}
      onPause={pause}
      onResume={async () => {
        const row = getSession();
        return (
          !!row && dispatch({ type: 'mini-game-resume', sessionId: row.id })
        );
      }}
      onComplete={complete}
      onForfeit={async () => {
        const row = getSession();
        return (
          !!row && dispatch({ type: 'mini-game-forfeit', sessionId: row.id })
        );
      }}
      onExit={() => {
        void (async () => {
          if (error) await gameStore.getState().bootstrap();
          router.back();
        })();
      }}
      onReload={async () =>
        (await gameStore.getState().bootstrap()) ? (getSession() ?? null) : null
      }
      onSkip={async () => {
        if (kind === 'crime') {
          const current = gameStore.getState();
          if (
            current.world?.id !== world.id ||
            current.world.activePersonId !== world.activePersonId
          )
            return false;
          if (!(await current.dispatch({ type: 'crime', offence: 'burglary' })))
            return false;
        }
        router.back();
        return true;
      }}
    />
  );
}
