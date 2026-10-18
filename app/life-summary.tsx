import React from 'react';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useGame } from '../src/state/useGame';
import { ageOn, fullName } from '../src/game/model';
import { Body, Card, Header, Heading, Page } from '../src/ui/components';
import { EstateDetails } from '../src/ui/EstateDetails';

export default function LifeSummary() {
  const world = useGame(s => s.world);
  const { id } = useLocalSearchParams<{ id?: string }>();
  if (!world) return <Redirect href="/" />;
  const person = world.people[id ?? world.activePersonId]; if (!person) return <Redirect href="/" />;
  return <Page><Header title="Life Summary" onBack={() => router.back()} /><Heading>{fullName(person)}</Heading><Body>Age {ageOn(person, world.date)} · {person.born.year}–{person.died?.year ?? world.date.year}</Body>
    <EstateDetails world={world} personId={person.id} />
    {world.journal.filter(entry => entry.personId === person.id).map(entry => <Card key={entry.id}><Heading size={16}>{entry.date.year}</Heading><Body>{entry.text}</Body></Card>)}
  </Page>;
}
