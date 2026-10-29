import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { hobbyKinds, HobbyKind } from '../../../src/game/content/leisure';
import { Body, Header, Page } from '../../../src/ui/components';
import { HobbyRoutine } from '../../../src/ui/HobbyRoutine';
import { useGame } from '../../../src/state/useGame';

export default function Hobby() {
  const { kind } = useLocalSearchParams<{ kind?: string | string[] }>();
  const identity = useGame(s => s.world ? s.world.id + ':' + s.world.activePersonId : 'none');
  if (typeof kind !== 'string' || !hobbyKinds.includes(kind as HobbyKind)) return <Page><Header title="Hobbies" onBack={() => router.back()} /><Body>This hobby is unavailable.</Body></Page>;
  return <HobbyRoutine key={identity + ':' + kind} kind={kind as HobbyKind} />;
}
