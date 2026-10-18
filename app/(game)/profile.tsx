import React from 'react';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { ageOn, fullName } from '../../src/game/model';
import { countries } from '../../src/game/countries';
import { Body, Card, Header, Heading, Page, Portrait } from '../../src/ui/components';

export default function Profile() {
  const world = useGame(s => s.world)!;
  const player = world.people[world.activePersonId];
  return <Page><Header title="My Life" onBack={() => router.back()} />
    <Card><Portrait name={fullName(player)} appearance={player.appearance} age={ageOn(player, world.date)} size={88} /><Heading>{fullName(player)}</Heading>
      <Body>Age {ageOn(player, world.date)}</Body>
      <Body>{countries[player.nationality].name}</Body>
      <Body>Born {player.born.year}-{String(player.born.month).padStart(2, '0')}-{String(player.born.day).padStart(2, '0')}</Body>
      <Body>{player.city}, {countries[player.country].name}</Body>
    </Card>
  </Page>;
}
