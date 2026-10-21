import React, { useState } from 'react';
import { TextInput } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { ageOn } from '../../src/game/model';
import { isConfined } from '../../src/game/systems/legal';
import { countries } from '../../src/game/countries';
import { rules } from '../../src/game/rules';
import { formatMoney, roundRatio } from '../../src/game/money';
import { ActionRow, Body, Card, Header, Heading, Page } from '../../src/ui/components';
import { HealthLegalArt } from '../../src/assets/HealthLegalArt';
import { LegalReviewError, useLegalReview } from '../../src/ui/LegalReview';
import { useColors } from '../../src/ui/theme';
const labels = { 'counterfeit-watch': 'Counterfeit Watch', 'false-id': 'False Identity Document', 'illicit-substance': 'Illicit Substance' };
export default function BlackMarket() {
  const identity = useGame(s => s.world?.id + ':' + s.world?.activePersonId);
  return <BlackMarketDetails key={identity} />;
}
function BlackMarketDetails() {
  const world = useGame(s => s.world)!, busy = useGame(s => s.busy), error = useGame(s => s.error), person = world.people[world.activePersonId], review = useLegalReview(), c = useColors(), [alias, setAlias] = useState('');
  const unavailable = isConfined(world) ? 'Unavailable in custody' : person.legal.wanted ? 'Resolve your outstanding arrest first' : ageOn(person, world.date) < 18 ? 'Available from age eighteen' : undefined;
  const inventory = world.contraband.filter(item => item.personId === person.id), currency = countries[person.country].currency;
  return <Page><Header title="Black Market" onBack={() => router.back()} /><LegalReviewError error={review.isOpen ? null : error} /><Card><HealthLegalArt id="handcuffs" size={80} /><Heading size={20}>Off the books</Heading><Body muted>Buying or selling here can lead to arrest and seizure. An alias does not clear your record.</Body></Card><Card><Heading size={18}>Offers</Heading><TextInput accessibilityLabel="Alias for false identity document" editable={!busy} value={alias} maxLength={60} onChangeText={setAlias} placeholder="Optional alias" placeholderTextColor={c.muted} style={{ color: c.ink, backgroundColor: c.inset, borderRadius: 10, padding: 12 }} />{(['counterfeit-watch', 'false-id', 'illicit-substance'] as const).map(kind => { const cost = roundRatio(rules[person.country].baseWage * BigInt(kind === 'counterfeit-watch' ? 100 : kind === 'false-id' ? 200 : 50), 10000n); return <ActionRow disabled={busy} key={kind} title={labels[kind]} value={formatMoney({ minor: cost, currency })} subtitle={kind === 'false-id' ? 'An alias does not clear existing charges' : kind === 'illicit-substance' ? 'Consumption harms health and can create dependence' : 'Discounted resale value; liable to seizure'} disabledReason={unavailable ?? (world.actionCounts[person.id + ':legal:' + world.date.year + ':market:' + kind] ? 'Already purchased this year' : undefined)} onPress={() => review.confirm({ type: 'black-market', kind, ...(kind === 'false-id' && alias.trim() ? { alias: alias.trim() } : {}) }, 'Buy ' + labels[kind].toLowerCase() + '?', 'You pay the listed price. Buying this item can lead to arrest or a later investigation.', [{ id: 'cost', label: 'Price', value: formatMoney({ minor: cost, currency }), tone: 'negative' }, ...(kind === 'false-id' && alias.trim() ? [{ id: 'alias', label: 'Alias', value: alias.trim(), tone: 'neutral' as const }] : [])], 'handcuffs', 'Buy Item')} />; })}</Card>
    <Card><Heading size={18}>Your inventory</Heading>{!inventory.length && <Body muted>No purchases recorded.</Body>}{[...inventory].reverse().map(item => <React.Fragment key={item.id}><Body>{labels[item.kind]} · {item.status}{item.alias ? ' · ' + item.alias : ''}</Body>{item.status === 'owned' && (item.kind === 'illicit-substance' ? <ActionRow disabled={busy} title="Consume Substance" subtitle="Harms your health and can cause dependence" disabledReason={unavailable} onPress={() => review.confirm({ type: 'contraband-action', itemId: item.id, action: 'consume' }, 'Consume this substance?', 'The item is used up. Your health declines and dependence becomes a medical condition.', [], 'medicine', 'Consume')} /> : item.value.minor > 0n && <ActionRow disabled={busy} title="Sell Item" value={formatMoney(item.value)} disabledReason={unavailable} onPress={() => review.confirm({ type: 'contraband-action', itemId: item.id, action: 'sell' }, 'Sell this item?', 'You receive the listed resale price. Selling can still lead to arrest or investigation.', [{ id: 'proceeds', label: 'Proceeds', value: formatMoney(item.value), tone: 'positive' }], 'handcuffs', 'Sell Item')} />)}</React.Fragment>)}</Card>{review.modal}</Page>;
}
