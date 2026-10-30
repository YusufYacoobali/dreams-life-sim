import React from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { World } from '../../game/model';
import { ActionRow, Body, Card } from '../../ui/components';
import { activeMiniGame, miniGameReason } from '../core/eligibility';
import { titles, type MiniGameKind } from '../core/types';
export function MiniGameEntry({
  world,
  kind,
  ownerId,
  contextId,
  busy = false,
}: {
  world: World;
  kind: MiniGameKind;
  ownerId: string;
  contextId: string;
  busy?: boolean;
}) {
  const session = world.miniGames.find(
      (row) =>
        row.personId === world.activePersonId &&
        row.kind === kind &&
        row.ownerId === ownerId &&
        row.contextId === contextId,
    ),
    active = session?.status === 'active';
  return (
    <ActionRow
      title={
        active
          ? 'Resume ' + titles[kind]
          : kind === 'sports'
            ? 'Play Match Challenge'
            : kind === 'astronaut'
              ? 'Docking Challenge'
              : kind === 'escape'
                ? 'Exit Shuffle · Escape'
              : 'Safe Cracker · Burglary'
      }
      subtitle={
        session && !active
          ? `Recorded: ${session.rating} · ${session.score}/100`
          : 'One saved attempt · ' +
            (kind === 'sports'
              ? 'affects your next match period'
              : kind === 'astronaut'
                ? 'affects your next mission period'
                : kind === 'escape'
                  ? 'commits to this year’s escape attempt'
                : 'commits to this year’s burglary attempt')
      }
      disabled={busy}
      disabledReason={
        active ? undefined : miniGameReason(world, kind, ownerId, contextId)
      }
      onPress={() =>
        router.push({
          pathname: '/mini-game',
          params: { kind, ownerId, contextId },
        })
      }
    />
  );
}
export function MiniGameResume({ world }: { world: World }) {
  const session = activeMiniGame(world);
  return session ? (
    <SafeAreaView edges={['top', 'left', 'right']}>
      <Card>
        <Body>
          A saved challenge is waiting. Resume or forfeit it before taking
          another game action.
        </Body>
        <MiniGameEntry
          world={world}
          kind={session.kind}
          ownerId={session.ownerId}
          contextId={session.contextId}
        />
      </Card>
    </SafeAreaView>
  ) : null;
}
