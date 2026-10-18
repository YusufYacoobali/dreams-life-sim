import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useGame } from '../../../src/state/useGame';
import { ageOn, fullName } from '../../../src/game/model';
import { Body, Card, Header, Heading, Page, Portrait } from '../../../src/ui/components';

export default function PersonProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const world = useGame(s => s.world)!;
  const person = world.people[id];
  return <Page><Header title="Person Profile" onBack={() => router.back()} />
    {person ? <Card>
      <Portrait name={fullName(person)} appearance={person.appearance} age={ageOn(person, world.date)} size={88} /><Heading>{fullName(person)}</Heading>
      <Body>Age {ageOn(person, world.date)}</Body><Body>{person.city}</Body>
      <Body>{person.traits.join(', ')}</Body>
      {person.died && <Body>Died in {person.died.year}: {person.causeOfDeath}</Body>}
    </Card> : <Body>This person could not be found.</Body>}
  </Page>;
}
