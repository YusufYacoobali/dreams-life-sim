import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useGame } from '../src/state/useGame';
import { LifeSummaryContent } from '../src/ui/LifeSummaryContent';

export default function LifeSummary() {
  const world = useGame(s => s.world);
  const { id, readOnly } = useLocalSearchParams<{ id?: string; readOnly?: string }>();
  if (!world) return <Redirect href="/" />;
  if (!world.people[id ?? world.activePersonId]) return <Redirect href="/" />;
  return <LifeSummaryContent world={world} personId={id} readOnly={readOnly === '1'} />;
}
