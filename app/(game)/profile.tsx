import React, { useState } from 'react';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { ageOn, fullName } from '../../src/game/model';
import { countries } from '../../src/game/countries';
import { Body, Button, Card, Header, Heading, Page, Portrait } from '../../src/ui/components';
import { FamilyPreferences } from '../../src/ui/FamilyPreferences';
import { rules } from '../../src/game/rules';

export default function Profile() {
  const world = useGame(s => s.world)!;
  const player = world.people[world.activePersonId];
  const dispatch = useGame(s => s.dispatch), busy = useGame(s => s.busy), error = useGame(s => s.error);
  const [preferences, setPreferences] = useState({ attractedTo: player.attractedTo, wantsChildren: player.wantsChildren });
  return <Page><Header title="My Life" onBack={() => router.back()} />
    <Card><Portrait name={fullName(player)} appearance={player.appearance} age={ageOn(player, world.date)} size={88} /><Heading>{fullName(player)}</Heading>
      <Body>Age {ageOn(player, world.date)}</Body>
      <Body>{countries[player.nationality].name}</Body>
      <Body>Born {player.born.year}-{String(player.born.month).padStart(2, '0')}-{String(player.born.day).padStart(2, '0')}</Body>
      <Body>{player.city}, {countries[player.country].name}</Body>
    </Card>
    {ageOn(player, world.date) >= rules[player.country].adultAge && <Card><Heading size={18}>Dating & family preferences</Heading><FamilyPreferences {...preferences} onChange={setPreferences} />{error && <Body>{error}</Body>}<Button label="Save Preferences" busy={busy} onPress={() => void dispatch({ type: 'relationship-preferences', ...preferences })} /></Card>}
  </Page>;
}
