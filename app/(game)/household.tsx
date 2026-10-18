import React, { useState } from 'react';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { ageOn, fullName } from '../../src/game/model';
import { householdLivingCost } from '../../src/game/systems/households';
import { accountFor } from '../../src/game/systems/common';
import { formatMoney } from '../../src/game/money';
import { rules } from '../../src/game/rules';
import { ActionRow, Body, Button, Card, Header, Heading, Page, Portrait } from '../../src/ui/components';
import { EventModal } from '../../src/ui/EventModal';
export default function Household() {
  const world = useGame(s => s.world)!; const dispatch = useGame(s => s.dispatch); const busy = useGame(s => s.busy); const error = useGame(s => s.error); const [confirm, setConfirm] = useState(false);
  const player = world.people[world.activePersonId], household = world.households.find(item => item.id === player.householdId);
  const members = household?.members.map(id => world.people[id]).filter(person => !person.died) ?? [player];
  const cost = householdLivingCost(world, player);
  return <Page><Header title="My Household" onBack={() => router.back()} /><Card><Heading>{household?.name ?? 'Independent household'}</Heading><Body>{player.city}</Body><Body>Your monthly living-cost share: {formatMoney({ minor: cost, currency: accountFor(world).currency })}</Body><Body muted>Adults share the household budget. Children add to the costs adults cover. A primary home reduces this budget; upkeep and mortgage payments are separate owner expenses.</Body></Card>
    <Card>{members.map(person => <ActionRow key={person.id} title={fullName(person)} subtitle={'Age ' + ageOn(person, world.date) + (person.id === player.id ? ' · You' : '')} icon={<Portrait name={fullName(person)} appearance={person.appearance} age={ageOn(person, world.date)} size={40} />} onPress={() => { if (person.id === player.id) router.push('/profile'); else router.push({ pathname: '/person/[id]', params: { id: person.id } }); }} />)}</Card>
    {error && <Body>{error}</Body>}<Button label="Move Out" tone="secondary" disabled={busy || members.length < 2 || ageOn(player, world.date) < rules[player.country].adultAge} onPress={() => setConfirm(true)} />
    <EventModal event={confirm ? { id: 'move-out', kind: 'confirmation', title: 'Move into your own household?', body: 'You will cover an independent household budget from this month onward. Existing property and accounts remain in their owners’ names.', terms: [{ id: 'budget', label: 'Base monthly living cost', value: formatMoney({ minor: rules[player.country].livingCost, currency: accountFor(world).currency }), tone: 'neutral' }], confirmLabel: 'Move Out' } : null} onCancel={() => setConfirm(false)} onChoose={() => { setConfirm(false); void dispatch({ type: 'move-out' }); }} />
  </Page>;
}
