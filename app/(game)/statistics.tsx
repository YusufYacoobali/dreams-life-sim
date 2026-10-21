import React from 'react';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { LifetimeStatisticsContent } from '../../src/ui/LifetimeStatisticsContent';

export default function Statistics() {
  const world = useGame(s => s.world), { id } = useLocalSearchParams<{ id?: string | string[] }>();
  if (!world) return <Redirect href="/" />;
  const personId = id === undefined ? world.activePersonId : typeof id === 'string' ? id : undefined;
  return <LifetimeStatisticsContent world={world} personId={personId} onBack={() => router.back()} />;
}
