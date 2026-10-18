import React, { useState } from 'react';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { ageOn } from '../../src/game/model';
import { genders } from '../../src/game/systems/familySchemas';
import { socialActionUsed } from '../../src/game/systems/relationships';
import { rules } from '../../src/game/rules';
import { Body, Button, Card, Header, Page } from '../../src/ui/components';
import { genderLabel } from '../../src/ui/FamilyPreferences';
import { FamilyArt } from '../../src/assets/FamilyArt';

export default function MeetPeople() {
  const world = useGame(s => s.world)!; const dispatch = useGame(s => s.dispatch); const busy = useGame(s => s.busy); const error = useGame(s => s.error);
  const player = world.people[world.activePersonId], age = ageOn(player, world.date);
  const [gender, setGender] = useState<'any' | typeof genders[number]>('any');
  return <Page><Header title="Meet New People" onBack={() => router.back()} /><Card><FamilyArt id="conversation" size={88} /><Body>A community afternoon is a good place to begin. You can attend one friendship event and one dating event each year.</Body>{(['any', ...genders] as const).map(value => <Button key={value} label={(gender === value ? '✓ ' : '') + (value === 'any' ? 'Everyone' : genderLabel(value))} tone={gender === value ? 'primary' : 'secondary'} onPress={() => setGender(value)} />)}</Card>
    {error && <Body>{error}</Body>}<Button label="Meet Potential Friends" disabled={busy || age < 6 || socialActionUsed(world, 'friend', 'meet')} onPress={() => void dispatch({ type: 'meet-people', purpose: 'friend', gender })} /><Button label="Meet Potential Dates" disabled={busy || age < rules[player.country].adultAge || socialActionUsed(world, 'dating', 'meet')} onPress={() => void dispatch({ type: 'meet-people', purpose: 'dating', gender })} /><Body muted>{age < 6 ? 'Friendship introductions unlock at age six.' : age < rules[player.country].adultAge ? 'Dating introductions unlock in adulthood.' : 'Introductions create people who remain in this world. Mutual interest and consent decide what follows.'}</Body>
  </Page>;
}
