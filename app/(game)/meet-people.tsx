import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { ageOn } from '../../src/game/model';
import { genders } from '../../src/game/systems/familySchemas';
import { socialActionUsed } from '../../src/game/systems/relationships';
import { rules } from '../../src/game/rules';
import { ActionRow, Body, Button, Card, Header, Heading, Page } from '../../src/ui/components';
import { genderLabel } from '../../src/ui/FamilyPreferences';
import { FamilyArt } from '../../src/assets/FamilyArt';
import { useColors } from '../../src/ui/theme';

export default function MeetPeople() {
  const world = useGame(s => s.world)!; const dispatch = useGame(s => s.dispatch); const busy = useGame(s => s.busy); const error = useGame(s => s.error);
  const player = world.people[world.activePersonId], age = ageOn(player, world.date);
  const c = useColors(), friendsUsed = socialActionUsed(world, 'friend', 'meet'), datesUsed = socialActionUsed(world, 'dating', 'meet');
  const [gender, setGender] = useState<'any' | typeof genders[number]>('any');
  return <Page><Header title="Meet New People" onBack={() => router.back()} />
    <Card><View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}><FamilyArt id="conversation" size={72} /><View style={{ flex: 1, minWidth: 0 }}><Heading>A New Connection</Heading></View></View><Body>A community afternoon is a good place to begin. You can attend one friendship event and one dating event each year.</Body><Body muted>Introductions create people who remain in this world. Mutual interest and consent decide what follows.</Body></Card>
    <Card><Heading size={20}>Who Would You Like to Meet?</Heading><Body muted>This preference applies to both kinds of introduction.</Body>{(['any', ...genders] as const).map(value => <ActionRow key={value} title={value === 'any' ? 'Everyone' : genderLabel(value)} accessibilityRole="radio" accessibilityState={{ checked: gender === value }} disabled={busy} onPress={() => setGender(value)} />)}</Card>
    <Card><Heading size={20}>Friendship</Heading><Body muted>{age < 6 ? 'Friendship introductions unlock at age six.' : friendsUsed ? 'You have attended this year’s friendship event.' : 'Your friendship event is available this year.'}</Body><Button label="Meet Potential Friends" disabled={busy || age < 6 || friendsUsed} onPress={() => void dispatch({ type: 'meet-people', purpose: 'friend', gender })} /></Card>
    <Card><Heading size={20}>Dating</Heading><Body muted>{age < rules[player.country].adultAge ? 'Dating introductions unlock in adulthood.' : datesUsed ? 'You have attended this year’s dating event.' : 'Your dating event is available this year.'}</Body><Button label="Meet Potential Dates" disabled={busy || age < rules[player.country].adultAge || datesUsed} onPress={() => void dispatch({ type: 'meet-people', purpose: 'dating', gender })} /></Card>
    {error && !world.pending && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, fontSize: 15, lineHeight: 22 }}>{error}</Text>}
  </Page>;
}
