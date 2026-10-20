import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { hobbyKinds, type HobbyKind } from '../../../src/game/content/leisure';
import { Body, Header, Page } from '../../../src/ui/components';
import { HobbyCommunityEvent } from '../../../src/ui/HobbyCommunityEvent';
export default function HobbyEvent() {
  const { kind } = useLocalSearchParams<{ kind?: string | string[] }>();
  if (typeof kind !== 'string' || !hobbyKinds.includes(kind as HobbyKind)) return <Page><Header title="Community Events" onBack={() => router.back()} /><Body>This hobby is unavailable.</Body></Page>;
  return <HobbyCommunityEvent key={kind} kind={kind as HobbyKind} />;
}
