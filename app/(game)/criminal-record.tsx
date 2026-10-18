import React from 'react';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { offences } from '../../src/game/content/crime';
import { visibleConvictions } from '../../src/game/systems/legal';
import { Body, Card, Header, Heading, Page, ActionRow } from '../../src/ui/components';
import { HealthLegalArt } from '../../src/assets/HealthLegalArt';
export default function CriminalRecord() {
  const world = useGame(s => s.world)!, visible = new Set(visibleConvictions(world).map(item => item.id)), history = world.cases.filter(item => item.personId === world.activePersonId && item.status !== 'awaiting-trial');
  return <Page><Header title="Criminal Record" onBack={() => router.back()} /><Card><HealthLegalArt id="justice" size={80} /><Heading size={20}>{visible.size ? visible.size + ' current convictions' : 'Clear current background check'}</Heading><Body muted>Past cases stay in your life history. Background-check visibility expires under the local game profile; an overturned conviction is excluded.</Body></Card><Card>{history.length ? [...history].reverse().map(item => <ActionRow key={item.id} title={offences[item.offence].title} subtitle={item.status + ' · ' + item.resolved?.year + (item.juvenile ? ' · Youth case' : '')} value={visible.has(item.id) ? 'Visible' : 'History'} onPress={() => router.push({ pathname: '/case/[id]', params: { id: item.id } })} />) : <Body muted>No resolved cases.</Body>}</Card></Page>;
}
