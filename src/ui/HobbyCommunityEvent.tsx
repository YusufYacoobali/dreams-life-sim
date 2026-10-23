import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { HobbyArt } from '../assets/HobbyArt';
import { countries } from '../game/countries';
import { hobbyContent, type HobbyKind } from '../game/content/leisure';
import { hobbyEventApproaches, hobbyEventApproachContent, hobbyEventChance, hobbyEventContent, type HobbyEventApproach } from '../game/content/hobbyEvents';
import { fullName } from '../game/model';
import { formatMoney } from '../game/money';
import { hobbyEventFee, hobbyEventReason } from '../game/systems/hobbyEvents';
import { leisurePayer } from '../game/systems/leisure';
import { personHobbies } from '../game/systems/leisureSchemas';
import { useGame } from '../state/useGame';
import { Body, Button, Card, Header, Heading, Page } from './components';
import { useColors } from './theme';
import { DisplayText as Text, displayText } from './DisplayText';

export function HobbyCommunityEvent({ kind }: { kind: HobbyKind }) {
  const world = useGame(s => s.world)!, busy = useGame(s => s.busy), error = useGame(s => s.error), dispatch = useGame(s => s.dispatch), c = useColors();
  const [approach, setApproach] = useState<HobbyEventApproach>('familiar'), [historyLimit, setHistoryLimit] = useState(4);
  const person = world.people[world.activePersonId], payer = leisurePayer(world), hobby = personHobbies(world).find(item => item.kind === kind), content = hobbyEventContent[kind], choice = hobbyEventApproachContent[approach], reason = hobbyEventReason(world, kind, approach), fee = hobbyEventFee(person.country, kind);
  const history = world.hobbyEvents.filter(row => row.personId === person.id && row.kind === kind).slice().reverse();
  const money = (minor: bigint, country = person.country) => formatMoney({ minor, currency: countries[country].currency }, countries[country].locale);
  return <Page footer={<><Body>Entry fee: {money(fee)}</Body><Body muted>{reason ?? (payer?.id === person.id ? 'Entry is paid from your account.' : 'Your adult must agree; a refusal charges nothing.')}</Body>{error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, fontSize: 15, lineHeight: 22 }}>{error}</Text>}<Button label={payer && payer.id !== person.id ? 'Ask To Enter Event' : 'Enter Community Event'} disabled={busy || !!reason} busy={busy} onPress={() => { if (payer && !reason) void dispatch({ type: 'enter-hobby-event', kind, approach, reviewedPayerId: payer.id, quotedFee: fee }); }} /></>}>
    <Header title="Community Event" onBack={() => { if (!busy) router.back(); }} />
    <Card><View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><HobbyArt kind={kind} size={64} /><View style={{ flex: 1, minWidth: 0 }}><Heading>{content.name}</Heading><Body muted>{hobbyContent[kind].name} · local club event</Body></View></View><Body>{content.prompt}</Body><Body muted>Shared equipment and materials are included. One entry or permission request each year.</Body><Body>{hobby?.practices.filter(row => row.source === 'monthly' && row.attended).length ?? 0} attended months · {hobby?.proficiency ?? 0}% proficiency</Body></Card>
    <Card><Heading size={18}>Your Approach</Heading>{hobbyEventApproaches.map(value => <Pressable key={value} accessibilityRole="radio" accessibilityLabel={displayText(hobbyEventApproachContent[value].name)} accessibilityState={{ checked: approach === value, disabled: busy }} disabled={busy} onPress={() => setApproach(value)} style={{ borderWidth: 1, borderColor: approach === value ? c.blue : c.line, backgroundColor: approach === value ? c.selected : c.surface, borderRadius: 12, padding: 14, minHeight: 52 }}><Text style={{ color: c.ink, fontWeight: '600', fontSize: 16 }}>{hobbyEventApproachContent[value].name}</Text><Body muted>{hobbyEventApproachContent[value].description}</Body></Pressable>)}</Card>
    <Card><Heading size={18}>Entry Details</Heading><Body>Entry fee: {money(fee)}</Body><Body>Responsible payer: {payer ? fullName(payer) : 'No available payer'}</Body><Body>Energy used: {choice.energy}</Body><Body>Chance of a club commendation: {hobbyEventChance(hobby?.proficiency ?? 0, person.stats.discipline, approach)}%</Body><Body muted>{approach === 'relaxed' ? 'Taking part can add up to 5 Happiness and ease Stress by up to 5. A commendation can add 1 Respect.' : approach === 'stretch' ? 'A commendation can add 4 Respect and 4 Happiness, with 1 Stress. Without one, gain up to 1 Happiness with 3 Stress.' : 'A commendation can add 2 Respect and 4 Happiness. Otherwise, gain up to 1 Happiness. Taking part eases Stress by up to 1.'}</Body><Body muted>{payer && payer.id !== person.id ? 'Your adult must agree before you can attend.' : 'Ready for an audience?'}</Body></Card>
    {history.length > 0 && <Card><Heading size={18}>Event History</Heading>{history.slice(0, historyLimit).map(row => <View key={row.id} style={{ gap: 3 }}><Body>{row.date.year} · {row.consent.accepted ? row.recognized ? 'Club commendation' : 'Took part' : 'Permission declined'}</Body><Body muted>{hobbyEventApproachContent[row.approach].name} · paid {money(row.paid, row.country)} · {fullName(world.people[row.payerId])}</Body></View>)}{history.length > historyLimit && <Button label="Show Earlier Events" tone="secondary" disabled={busy} onPress={() => setHistoryLimit(historyLimit + 4)} />}</Card>}
  </Page>;
}
