import React from 'react';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { Card, Header, Page, StatBar } from '../../src/ui/components';
import { Illustration } from '../../src/assets/Illustration';
import { useColors } from '../../src/ui/theme';

export default function Health() {
  const world = useGame(s => s.world)!;
  const stats = world.people[world.activePersonId].stats;
  const c = useColors();
  return <Page><Header title="Health" onBack={() => router.back()} />
    <Card><Illustration id="relationship" size={56} />
      <StatBar label="Health" value={stats.health} color={c.green} />
      <StatBar label="Energy" value={stats.energy} color={c.blue} />
      <StatBar label="Fitness" value={stats.fitness} color={c.teal} />
      <StatBar label="Stress" value={stats.stress} color={c.red} />
    </Card>
  </Page>;
}
