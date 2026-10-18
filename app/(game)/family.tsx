import React, { useState } from 'react';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { ageOn, fullName } from '../../src/game/model';
import { adoptionFee, childrenOf, conceptionReason } from '../../src/game/systems/family';
import { otherPerson, partnerRelation } from '../../src/game/systems/relationships';
import { accountFor } from '../../src/game/systems/common';
import { formatMoney } from '../../src/game/money';
import { rules } from '../../src/game/rules';
import { ActionRow, Body, Button, Card, Header, Heading, Page, Portrait } from '../../src/ui/components';
import { EventModal, EventPresentation } from '../../src/ui/EventModal';
import { FamilyArt } from '../../src/assets/FamilyArt';

export default function Family() {
  const world = useGame(s => s.world)!, dispatch = useGame(s => s.dispatch), busy = useGame(s => s.busy), error = useGame(s => s.error);
  const player = world.people[world.activePersonId], relation = partnerRelation(world), partner = relation && otherPerson(world, relation), children = childrenOf(world);
  const [confirm, setConfirm] = useState<'try' | 'adopt' | null>(null), [adoptionAge, setAdoptionAge] = useState(0);
  const pregnancy = world.pregnancies.find(item => item.status === 'pregnant' && (item.carrierId === player.id || item.otherParentId === player.id));
  const reason = conceptionReason(world, player, partner), adult = ageOn(player, world.date) >= rules[player.country].adultAge;
  const event: EventPresentation | null = confirm ? { id: 'family-' + confirm, kind: 'confirmation', title: confirm === 'try' ? 'Try for a child together?' : 'Apply to adopt?', body: confirm === 'try' ? 'Both partners want a child. Conception depends on health, age and fertility; a pregnancy lasts nine months and brings care costs.' : 'The assessment and placement fee is ' + formatMoney({ minor: adoptionFee(world), currency: accountFor(world).currency }) + '. Placement requires a stable household, income and health. The child will become a permanent member of this world.', terms: [], confirmLabel: confirm === 'try' ? 'Try for a Child' : 'Adopt a Child' } : null;
  return <Page><Header title="Family" onBack={() => router.back()} /><Card><FamilyArt id="family-tree" size={88} /><Heading size={18}>{player.lastName} family</Heading><ActionRow title="Family Tree" subtitle="Parents, children and generations" onPress={() => router.push('/family-tree')} /><ActionRow title="My Household" onPress={() => router.push('/household')} /></Card>
    {pregnancy && <Card><FamilyArt id="carriage" size={64} /><Heading size={18}>A baby on the way</Heading><Body>{world.people[pregnancy.carrierId].firstName} is pregnant. Due {pregnancy.due.year}-{String(pregnancy.due.month).padStart(2, '0')}.</Body></Card>}
    <Card><Heading size={18}>Your children</Heading>{children.length === 0 && <Body muted>You have no children.</Body>}{children.map(child => <ActionRow key={child.id} title={fullName(child)} subtitle={'Age ' + ageOn(child, world.date) + (child.died ? ' · Deceased' : child.householdId === player.householdId ? ' · Lives with you' : ' · Another household')} icon={<Portrait name={fullName(child)} appearance={child.appearance} age={ageOn(child, world.date)} size={44} />} onPress={() => router.push({ pathname: '/person/[id]', params: { id: child.id } })} />)}</Card>
    {error && <Body>{error}</Body>}<Card><Heading size={18}>Family planning</Heading>{reason && <Body muted>{reason}</Body>}<Button label="Try for a Child" disabled={busy || !!reason || !!world.actionCounts[player.id + ':try-child:' + world.date.year]} onPress={() => setConfirm('try')} /><Body muted>Adoption is open to adults aged 21–65 with a stable household, health and income. It is independent of gender or reproductive capacity.</Body>{[0, 2, 4, 6].map(age => <Button key={age} label={(adoptionAge === age ? '✓ ' : '') + (age === 0 ? 'Infant' : 'Age ' + age)} tone={adoptionAge === age ? 'primary' : 'secondary'} onPress={() => setAdoptionAge(age)} />)}<Button label="Review Adoption" disabled={!adult || busy || !!world.actionCounts[player.id + ':adopt:' + world.date.year]} onPress={() => setConfirm('adopt')} /></Card>
    <EventModal event={event} busy={busy} onCancel={() => setConfirm(null)} onChoose={() => { const choice = confirm; setConfirm(null); void dispatch(choice === 'try' ? { type: 'try-child' } : { type: 'adopt', age: adoptionAge }); }} />
  </Page>;
}
