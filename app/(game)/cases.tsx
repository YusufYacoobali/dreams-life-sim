import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { offences } from '../../src/game/content/crime';
import { ActionRow, Body, Card, Header, Heading, Page } from '../../src/ui/components';
import { HealthLegalArt } from '../../src/assets/HealthLegalArt';
export default function Cases() {
  const world = useGame(s => s.world)!, cases = world.cases.filter(item => item.personId === world.activePersonId);
  const upcoming = cases.filter(item => item.status === 'awaiting-trial').sort((a, b) => a.hearing.year - b.hearing.year || a.hearing.month - b.hearing.month || a.hearing.day - b.hearing.day), history = cases.filter(item => item.status !== 'awaiting-trial').reverse();
  const caseRow = (item: typeof cases[number]) => <ActionRow key={item.id} title={offences[item.offence].title} subtitle={item.status === 'awaiting-trial' ? 'Hearing ' + item.hearing.year + '-' + String(item.hearing.month).padStart(2, '0') + '-' + String(item.hearing.day).padStart(2, '0') + ' · ' + item.city : item.status[0].toUpperCase() + item.status.slice(1) + ' · ' + item.city} value={item.detained ? 'Remand' : undefined} icon={<HealthLegalArt id="court" size={36} />} onPress={() => router.push({ pathname: '/case/[id]', params: { id: item.id } })} />;
  return <Page><Header title="Cases & Court" onBack={() => router.back()} />
    <Card><View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><HealthLegalArt id="court" size={56} /><View style={{ flex: 1 }}><Heading size={20}>Your Cases</Heading>{cases.length > 0 && <Body muted>{upcoming.length} awaiting trial · {history.length} resolved</Body>}</View></View><Body muted>Hearings take place as time advances. You can arrange counsel while the year is paused.</Body></Card>
    <Card><Heading size={18}>Upcoming Hearings</Heading>{upcoming.length ? upcoming.map(caseRow) : <Body muted>{cases.length ? 'No hearings currently scheduled.' : 'No court cases recorded.'}</Body>}</Card>
    {history.length > 0 && <Card><Heading size={18}>Past Cases</Heading>{history.map(caseRow)}</Card>}
  </Page>;
}
