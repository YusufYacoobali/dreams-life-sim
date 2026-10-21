import React from 'react';
import { useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { offences } from '../../src/game/content/crime';
import { visibleConvictions } from '../../src/game/systems/legal';
import { Body, Card, Header, Heading, Page, ActionRow } from '../../src/ui/components';
import { HealthLegalArt } from '../../src/assets/HealthLegalArt';
import { formatMoney } from '../../src/game/money';
import { useColors } from '../../src/ui/theme';
export default function CriminalRecord() {
  const world = useGame(s => s.world)!, visible = new Set(visibleConvictions(world).map(item => item.id)), history = world.cases.filter(item => item.personId === world.activePersonId && item.status !== 'awaiting-trial');
  const c = useColors(), { width, fontScale } = useWindowDimensions(), stacked = width < 360 || fontScale >= 1.2;
  return <Page><Header title="Criminal Record" onBack={() => router.back()} /><Card><View style={{ flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'stretch' : 'center', gap: 16 }}><HealthLegalArt id="justice" size={72} /><View style={{ flex: stacked ? undefined : 1, minWidth: 0, gap: 6 }}><Heading size={22}>{visible.size ? visible.size + (visible.size === 1 ? ' current conviction' : ' current convictions') : 'Clear current background check'}</Heading><Body muted>{history.length} resolved {history.length === 1 ? 'case' : 'cases'} recorded</Body></View></View><Body muted>Past cases stay in your life history. Background-check visibility expires under the local game profile; an overturned conviction is excluded.</Body></Card><Card><Heading size={20}>Resolved Cases</Heading><Body muted>Open a case for its recorded details and outcome. “History” means it is excluded from the current conviction check.</Body>{history.length ? [...history].reverse().map(item => <View key={item.id} style={{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: c.line, gap: 6 }}><ActionRow title={offences[item.offence].title} subtitle={{ 'awaiting-trial': 'Awaiting trial', acquitted: 'Acquitted', convicted: 'Convicted', dismissed: 'Dismissed', abated: 'Closed after death' }[item.status] + ' · ' + (item.resolved ? item.resolved.month + '/' + item.resolved.year : 'Resolution date not recorded') + (item.juvenile ? ' · Youth case' : '')} value={visible.has(item.id) ? 'Visible' : 'History'} onPress={() => router.push({ pathname: '/case/[id]', params: { id: item.id } })} /><Body muted>{item.city}</Body>{item.sentenceMonths > 0 && <Body>Recorded sentence: {item.sentenceMonths} {item.sentenceMonths === 1 ? 'month' : 'months'}</Body>}{item.fine.minor > 0n && <Body>{item.fineRefunded ? 'Original fine (overturned)' : 'Recorded fine'}: {formatMoney(item.fine)}</Body>}</View>) : <><HealthLegalArt id="justice" size={56} /><Body muted>No resolved cases.</Body></>}</Card></Page>;
}
