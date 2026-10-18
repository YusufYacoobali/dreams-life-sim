import React from 'react';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { offences } from '../../src/game/content/crime';
import { ActionRow, Body, Card, Header, Heading, Page } from '../../src/ui/components';
import { HealthLegalArt } from '../../src/assets/HealthLegalArt';
export default function Cases() {
  const world = useGame(s => s.world)!, cases = world.cases.filter(item => item.personId === world.activePersonId);
  return <Page><Header title="Cases & Court" onBack={() => router.back()} /><Card><HealthLegalArt id="court" size={80} /><Heading size={20}>Your cases</Heading><Body muted>Hearings take place as time advances. You can arrange counsel while the year is paused.</Body></Card><Card>{cases.length ? [...cases].reverse().map(item => <ActionRow key={item.id} title={offences[item.offence].title} subtitle={item.status === 'awaiting-trial' ? 'Hearing ' + item.hearing.year + '-' + String(item.hearing.month).padStart(2, '0') + '-' + String(item.hearing.day).padStart(2, '0') + ' · ' + item.city : item.status + ' · ' + item.city} value={item.detained ? 'Remand' : undefined} onPress={() => router.push({ pathname: '/case/[id]', params: { id: item.id } })} />) : <Body muted>No court cases recorded.</Body>}</Card></Page>;
}
