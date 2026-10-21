import React from 'react';
import { useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { offences } from '../../src/game/content/crime';
import { ActionRow, Body, Card, Header, Heading, Page } from '../../src/ui/components';
import { HealthLegalArt } from '../../src/assets/HealthLegalArt';
import { countries } from '../../src/game/countries';
import { useColors } from '../../src/ui/theme';
export default function Cases() {
  const world = useGame(s => s.world)!, cases = world.cases.filter(item => item.personId === world.activePersonId);
  const upcoming = cases.filter(item => item.status === 'awaiting-trial').sort((a, b) => a.hearing.year - b.hearing.year || a.hearing.month - b.hearing.month || a.hearing.day - b.hearing.day), history = cases.filter(item => item.status !== 'awaiting-trial').reverse();
  const c = useColors(), { width, fontScale } = useWindowDimensions(), stacked = width < 360 || fontScale >= 1.2, next = upcoming[0], remanded = upcoming.filter(item => item.detained).length;
  const date = (value: typeof cases[number]['hearing']) => value.year + '-' + String(value.month).padStart(2, '0') + '-' + String(value.day).padStart(2, '0');
  const caseRow = (item: typeof cases[number]) => <ActionRow key={item.id} title={offences[item.offence].title} subtitle={(item.status === 'awaiting-trial' ? 'Hearing ' + date(item.hearing) : (item.status === 'abated' ? 'Closed after death' : item.status[0].toUpperCase() + item.status.slice(1)) + ' · ' + (item.resolved ? date(item.resolved) : 'Resolution date not recorded')) + ' · ' + item.city + (item.juvenile ? ' · Youth case' : '')} value={item.detained ? 'Remand' : undefined} icon={<HealthLegalArt id="court" size={36} />} onPress={() => router.push({ pathname: '/case/[id]', params: { id: item.id } })} />;
  return <Page><Header title="Cases & Court" onBack={() => router.back()} />
    <Card><View style={{ flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'stretch' : 'center', gap: 16 }}><HealthLegalArt id="court" size={72} /><View style={{ flex: stacked ? undefined : 1, minWidth: 0, gap: 6 }}><Heading size={22}>Your Cases</Heading><Body muted>{upcoming.length} awaiting trial · {history.length} resolved</Body></View></View><Body muted>Hearings take place as time advances. You can arrange counsel while the year is paused.</Body>{remanded > 0 && <View style={{ padding: 12, backgroundColor: c.inset, borderRadius: 12 }}><Body>Remanded on {remanded} pending {remanded === 1 ? 'case' : 'cases'}.</Body></View>}</Card>
    {next && <Card style={{ borderWidth: 1, borderColor: c.link }}><Heading size={20}>Next Scheduled Hearing</Heading><Heading size={25}>{date(next.hearing)}</Heading><Body>{offences[next.offence].title}</Body><Body muted>{next.city}, {countries[next.country].name}</Body><Body muted>{next.detained ? 'Remanded on this case.' : 'Not detained on this case.'} Open the case below to review counsel and bail.</Body></Card>}
    <Card><Heading size={20}>Upcoming Hearings</Heading>{upcoming.length ? upcoming.map(caseRow) : <><HealthLegalArt id="justice" size={56} /><Body muted>{cases.length ? 'No hearings currently scheduled.' : 'No court cases recorded.'}</Body></>}</Card>
    {history.length > 0 && <Card><Heading size={20}>Past Cases</Heading><Body muted>Recorded outcomes stay in your history. Open a case for its full details.</Body>{history.map(caseRow)}</Card>}
  </Page>;
}
