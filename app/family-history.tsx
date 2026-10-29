import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useGame } from '../src/state/useGame';
import { FamilyTreeContent } from '../src/ui/FamilyTreeContent';

/** Outside the gameplay stack so a memorial can open its family safely. */
export default function FamilyHistory() {
  const world = useGame(s => s.world);
  const { id } = useLocalSearchParams<{ id?: string }>();
  if (!world || !world.people[id ?? world.activePersonId]) return <Redirect href="/" />;
  return <FamilyTreeContent world={world} personId={id} readOnly />;
}
