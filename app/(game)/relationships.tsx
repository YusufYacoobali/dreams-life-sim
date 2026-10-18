import React from 'react';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { fullName } from '../../src/game/model';
import { ActionRow, Card, Header, Page, Portrait, StatBar } from '../../src/ui/components';
import { useColors } from '../../src/ui/theme';

export default function Relationships() {
  const world = useGame(s => s.world)!;
  const c = useColors();
  const edges = world.relationships.filter(edge => edge.from === world.activePersonId || edge.to === world.activePersonId);
  return <Page><Header title="Relationships" />
    <Card>{edges.map(edge => {
      const person = world.people[edge.from === world.activePersonId ? edge.to : edge.from];
      return <React.Fragment key={edge.id}>
        <ActionRow title={fullName(person)} subtitle={edge.kind === 'parent' ? 'Parent' : edge.kind} icon={<Portrait name={fullName(person)} size={44} />} onPress={() => router.push({ pathname: '/person/[id]', params: { id: person.id } })} />
        <StatBar label="Relationship" value={edge.strength} color={c.green} />
      </React.Fragment>;
    })}</Card>
  </Page>;
}
