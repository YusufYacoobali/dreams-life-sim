import React from 'react';
import { useGame } from '../../src/state/useGame';
import { FamilyTreeContent } from '../../src/ui/FamilyTreeContent';

export default function FamilyTree() {
  const world = useGame(s => s.world)!;
  return <FamilyTreeContent world={world} />;
}
