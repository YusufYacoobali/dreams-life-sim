import React, { useRef, useState } from 'react';
import { Text, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { ageOn, fullName, type World } from '../../src/game/model';
import { estateShares, legalShares } from '../../src/game/systems/estates';
import { parseMoney } from '../../src/game/money';
import { rules } from '../../src/game/rules';
import { ActionRow, Body, Button, Card, Header, Heading, Page } from '../../src/ui/components';
import { EventModal, EventPresentation } from '../../src/ui/EventModal';
import { FamilyArt } from '../../src/assets/FamilyArt';
import { useColors } from '../../src/ui/theme';
type WillTerms = Pick<World['wills'][number], 'executorId' | 'shares' | 'bequests'>;
const willTerms = (will: WillTerms) => JSON.stringify({
  executorId: will.executorId,
  shares: will.shares.slice().sort((a, b) => a.personId.localeCompare(b.personId)).map(({ personId, bps }) => ({ personId, bps })),
  bequests: (will.bequests ?? []).slice().sort((a, b) => a.assetId.localeCompare(b.assetId) || a.personId.localeCompare(b.personId)).map(({ assetId, personId }) => ({ assetId, personId })),
});
export default function Will() {
  const identity = useGame(s => s.world ? JSON.stringify([s.world.id, s.world.activePersonId]) : 'none');
  return <WillEditor key={identity} />;
}
function WillEditor() {
  const world = useGame(s => s.world)!, dispatch = useGame(s => s.dispatch), busy = useGame(s => s.busy), error = useGame(s => s.error), c = useColors();
  const player = world.people[world.activePersonId], saved = world.wills.find(item => item.personId === player.id);
  const knownIds = new Set(world.relationships.filter(item => item.from === player.id || item.to === player.id).map(item => item.from === player.id ? item.to : item.from));
  const known = [...knownIds].map(id => world.people[id]).filter(person => !person.died), adults = known.filter(person => ageOn(person, world.date) >= 18);
  const [executorId, setExecutor] = useState(saved?.executorId ?? adults[0]?.id ?? '');
  const [shares, setShares] = useState((saved?.shares ?? legalShares(world, player.id)).map(item => ({ personId: item.personId, percent: (item.bps / 100).toString() })));
  const [bequests, setBequests] = useState(saved?.bequests ?? []), [field, setField] = useState<string | null>(null), [message, setMessage] = useState<string | null>(null);
  const submitting = useRef(false);
  let allocation: WillTerms['shares'] | null = null;
  try {
    const parsed = shares.map(item => ({ personId: item.personId, bps: Number(parseMoney(item.percent, 'USD').minor) }));
    if (parsed.every(item => item.bps > 0 && item.bps <= 10000) && parsed.reduce((sum, item) => sum + item.bps, 0) === 10000) allocation = parsed;
  } catch { /* Keep invalid drafts editable; report the existing validation on Save. */ }
  const unchanged = !!saved && !!allocation && willTerms(saved) === willTerms({ executorId, shares: allocation, bequests });
  const save = () => {
    if (busy || submitting.current || unchanged) return;
    if (!allocation) { setMessage('Allocate exactly 100%, using positive percentages with at most two decimal places.'); return; }
    setMessage(null); submitting.current = true;
    void dispatch({ type: 'save-will', executorId, shares: allocation, bequests }).finally(() => { submitting.current = false; });
  };
  const assets = [...world.assets.filter(item => item.ownerId === player.id), ...world.businesses.filter(item => item.ownerId === player.id && item.status === 'active')];
  const choices = field === 'executor' ? adults.map(person => ({ id: person.id, label: fullName(person) })) : field === 'beneficiary' ? known.filter(person => !shares.some(item => item.personId === person.id)).map(person => ({ id: person.id, label: fullName(person) })) : [{ id: 'none', label: 'Sell and distribute with the estate' }, ...shares.map(item => ({ id: item.personId, label: fullName(world.people[item.personId]) }))];
  const event: EventPresentation | null = field ? { id: 'will:' + field, kind: 'selection', title: field === 'executor' ? 'Choose an executor' : field === 'beneficiary' ? 'Add a beneficiary' : 'Specific bequest', body: field === 'executor' ? 'Choose another living adult you know.' : 'Protected family minima and estate obligations still apply.', choices, confirmLabel: 'Choose' } : null;
  return <Page><Header title="My Will" onBack={() => { if (!busy && !submitting.current) router.back(); }} /><Card><FamilyArt id="will" size={88} /><Heading size={19}>Your wishes, recorded</Heading><Body muted>{rules[player.country].protectedFamilyBps / 100}% of the estate is reserved for eligible family in this country’s simplified game model. Debts and estate tax are paid first. A bequest must fit within its recipient’s share after these obligations.</Body><ActionRow title="Executor" disabled={busy} value={world.people[executorId] ? fullName(world.people[executorId]) : 'Choose'} onPress={() => { if (!busy) setField('executor'); }} /></Card>
    <Card><Heading size={18}>Discretionary allocation</Heading><Body muted>Allocate exactly 100%. These weights divide the portion remaining after protected family shares.</Body>{shares.map(share => <React.Fragment key={share.personId}><Body>{fullName(world.people[share.personId])}</Body><TextInput accessibilityLabel={'Percentage for ' + fullName(world.people[share.personId])} keyboardType="decimal-pad" editable={!busy} value={share.percent} onChangeText={percent => { if (!busy) { setMessage(null); setShares(shares.map(item => item.personId === share.personId ? { ...item, percent } : item)); } }} style={{ color: c.ink, backgroundColor: c.inset, padding: 12, borderRadius: 10, fontSize: 18 }} /><Button label={'Remove ' + world.people[share.personId].firstName} tone="secondary" disabled={busy} onPress={() => { if (busy) return; setShares(shares.filter(item => item.personId !== share.personId)); setBequests(bequests.filter(item => item.personId !== share.personId)); }} /></React.Fragment>)}<Button label="Add Beneficiary" tone="secondary" disabled={busy} onPress={() => { if (!busy) setField('beneficiary'); }} /></Card>
    <Card><Heading size={18}>Specific bequests</Heading><Body muted>A company needs an available continuing manager to remain operating as a bequest. Otherwise the estate sells it and distributes the actual proceeds.</Body>{assets.length === 0 && <Body muted>No owned assets to assign.</Body>}{assets.map(asset => { const heir = bequests.find(item => item.assetId === asset.id); return <ActionRow key={asset.id} disabled={busy} title={asset.name} subtitle={heir ? fullName(world.people[heir.personId]) : 'Sell and distribute'} onPress={() => { if (!busy) setField('asset:' + asset.id); }} />; })}</Card>
    {(message || error) && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, fontSize: 15, lineHeight: 22 }}>{message ?? error}</Text>}{unchanged && <Body muted>This is your current saved will.</Body>}<Button label="Save Will" busy={busy} disabled={unchanged || ageOn(player, world.date) < rules[player.country].adultAge} onPress={save} />{saved && <Button label="Revoke Will" tone="secondary" busy={busy} onPress={() => { if (busy || submitting.current) return; setMessage(null); submitting.current = true; void dispatch({ type: 'revoke-will' }).finally(() => { submitting.current = false; }); }} />}
    <Card><Heading size={18}>Current effective shares</Heading>{estateShares(world, player.id).map(item => <Body key={item.personId}>{fullName(world.people[item.personId])} · {(item.bps / 100).toFixed(2)}%</Body>)}<Body muted>Based on the saved will and people alive today. Future family changes can change these shares.</Body></Card>
    <EventModal event={event} busy={busy} onCancel={() => { if (!busy) setField(null); }} onChoose={id => { if (busy || !field) return; if (field === 'executor') setExecutor(id); else if (field === 'beneficiary') setShares([...shares, { personId: id, percent: '0' }]); else if (field?.startsWith('asset:')) { const assetId = field.slice(6); setBequests([...bequests.filter(item => item.assetId !== assetId), ...(id === 'none' ? [] : [{ assetId, personId: id }])]); } setField(null); }} />
  </Page>;
}
