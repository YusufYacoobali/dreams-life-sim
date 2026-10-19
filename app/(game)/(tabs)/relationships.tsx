import { PetsLeisureArt } from '../../../src/assets/PetsLeisureArt';
import React from 'react';
import { router } from 'expo-router';
import { useGame } from '../../../src/state/useGame';
import { ageOn, fullName } from '../../../src/game/model';
import { ActionRow, Body, Card, Header, Page, Portrait, StatBar } from '../../../src/ui/components';
import { useColors } from '../../../src/ui/theme';
import { FamilyArt } from '../../../src/assets/FamilyArt';
import { relationLabel } from '../../../src/game/systems/relationships';

export default function Relationships() {
  const world = useGame(s => s.world)!;
  const c = useColors();
  const edges = world.relationships.filter(edge => edge.from === world.activePersonId || edge.to === world.activePersonId);
  return <Page><Header title="Relationships" />
    <Card><ActionRow title="Household Pets" subtitle="Companions, adoption and care" icon={<PetsLeisureArt id="paw" size={40} />} onPress={() => router.push('/pets')} /><ActionRow title="Meet New People" subtitle="Friendship, introductions and dating" icon={<FamilyArt id="rose" size={40} />} onPress={() => router.push('/meet-people')} /><ActionRow title="Family & Children" icon={<FamilyArt id="carriage" size={40} />} onPress={() => router.push('/family')} /><ActionRow title="My Household" subtitle="Living arrangements and shared costs" icon={<FamilyArt id="family-tree" size={40} />} onPress={() => router.push('/household')} /></Card>
    <Card>{edges.map(edge => {
      const person = world.people[edge.from === world.activePersonId ? edge.to : edge.from];
      return <React.Fragment key={edge.id}>
        <ActionRow title={fullName(person)} subtitle={relationLabel(world, edge) + (person.died ? ' · Deceased' : ' · Age ' + ageOn(person, world.date))} icon={<Portrait name={fullName(person)} appearance={person.appearance} age={ageOn(person, world.date)} size={44} />} onPress={() => router.push({ pathname: '/person/[id]', params: { id: person.id } })} />
        <StatBar label="Relationship" value={edge.strength} color={c.green} />
      </React.Fragment>;
    })}{edges.length === 0 && <Body muted>Your connections will appear here.</Body>}</Card>
  </Page>;
}
