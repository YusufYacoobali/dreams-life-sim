import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { hobbyKinds, HobbyKind } from '../../../src/game/content/leisure';
import { Body, Header, Page } from '../../../src/ui/components';
import { HobbyRoutine } from '../../../src/ui/HobbyRoutine';

export default function Hobby() {
  const { kind } = useLocalSearchParams<{ kind?: string | string[] }>();
  if (typeof kind !== 'string' || !hobbyKinds.includes(kind as HobbyKind)) return <Page><Header title="Hobbies" onBack={() => router.back()} /><Body>This hobby is unavailable.</Body></Page>;
  return <HobbyRoutine key={kind} kind={kind as HobbyKind} />;
}
