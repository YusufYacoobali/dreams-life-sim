import React, { useState } from 'react';
import { TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useGame } from '../../../src/state/useGame';
import { ageOn, fullName } from '../../../src/game/model';
import { ActionRow, Body, Button, Card, Header, Heading, Page, Portrait, StatBar } from '../../../src/ui/components';
import { dateBudget, relationFor, relationLabel, romanceReason, SocialCommand, socialActionUsed, weddingBudgets } from '../../../src/game/systems/relationships';
import { EventModal, EventPresentation } from '../../../src/ui/EventModal';
import { accountFor } from '../../../src/game/systems/common';
import { formatMoney, parseMoney } from '../../../src/game/money';
import { useColors } from '../../../src/ui/theme';
import { FamilyArt } from '../../../src/assets/FamilyArt';
import { rules } from '../../../src/game/rules';
import { jobs } from '../../../src/game/content/jobs';
import { FamilyCommand } from '../../../src/game/systems/family';

export default function PersonProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const world = useGame(s => s.world)!;
  const person = world.people[id];
  const dispatch = useGame(s => s.dispatch), busy = useGame(s => s.busy), error = useGame(s => s.error), c = useColors();
  const [panel, setPanel] = useState<'gift' | 'wedding' | null>(null), [amount, setAmount] = useState(''), [message, setMessage] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ command: SocialCommand | FamilyCommand; event: EventPresentation } | null>(null), [childName, setChildName] = useState('');
  const player = world.people[world.activePersonId], relation = person && relationFor(world, player.id, person.id), age = ageOn(player, world.date);
  const money = (minor: bigint) => formatMoney({ minor, currency: accountFor(world).currency });
  const custody = world.custody.find(item => item.childId === id && !item.ended && (item.a === player.id || item.b === player.id));
  const confirm = (command: SocialCommand | FamilyCommand, title: string, body: string, confirmLabel: string) => setConfirmation({ command, event: { id: command.type + ':' + id, kind: 'confirmation', title, body, terms: [], confirmLabel } });
  const used = (action: string) => busy ? 'Saving' : socialActionUsed(world, id, action) ? 'Already tried this year' : undefined;
  return <Page><Header title="Person Profile" onBack={() => router.back()} />
    {person ? <Card>
      <Portrait name={fullName(person)} appearance={person.appearance} age={ageOn(person, world.date)} size={88} /><Heading>{fullName(person)}</Heading>
      <Body>Age {ageOn(person, world.date)}</Body><Body>{person.city}</Body>
      <Body>{person.traits.join(', ')}</Body>
      {relation && <><Body>{relationLabel(world, relation)}</Body><StatBar label="Relationship" value={relation.strength} color={c.green} /><StatBar label="Trust" value={relation.trust} color={c.blue} /></>}
      <Body>{person.employment ? jobs.find(job => job.id === person.employment!.roleId)?.title : person.finance.pensionAnnual > 0n ? 'Retired' : person.education.school ?? 'No current occupation'}</Body>
      {person.died && <Body>Died in {person.died.year}: {person.causeOfDeath}</Body>}
    </Card> : <Body>This person could not be found.</Body>}
    {(error || message) && <Body>{message ?? error}</Body>}
    {person && !person.died && relation && <>
      {relation.roles.includes('parent') && relation.from === player.id && ageOn(person, world.date) < rules[person.country].adultAge && <Card><Heading size={18}>Care & identity</Heading><Body>Lives in {person.city}{person.householdId === player.householdId ? ' with you' : ' in another household'}.</Body>{person.householdId === player.householdId && <><TextInput accessibilityLabel="Child first name" value={childName} onChangeText={setChildName} maxLength={40} placeholder={person.firstName} placeholderTextColor={c.muted} style={{ color: c.ink, backgroundColor: c.inset, padding: 12, borderRadius: 10 }} /><Button label="Save Child’s Name" disabled={busy || !childName.trim()} onPress={() => void dispatch({ type: 'name-child', childId: id, firstName: childName })} /></>}{custody && <><Body>{custody.arrangement === 'shared' ? 'Shared care' : 'Primary care'} · Primary home with {world.people[custody.primaryId].firstName}</Body>{(['shared', 'me', 'them'] as const).map(preference => <ActionRow key={preference} title={preference === 'shared' ? 'Request Shared Care' : preference === 'me' ? 'Request Primary Care' : 'Request Other Parent’s Care'} disabledReason={custody.lastReviewYear === world.date.year ? 'Reviewed this year' : undefined} onPress={() => confirm({ type: 'review-custody', childId: id, preference }, 'Review custody?', 'The arrangement considers the child’s needs, both parents’ ability to care and your preference.', 'Review Custody')} />)}</>}</Card>}
      <Card><Heading size={18}>Time together</Heading>{(['talk', 'compliment', 'spend-time', 'argue', 'apologise'] as const).map(action => <ActionRow key={action} title={{ talk: 'Have a Conversation', compliment: 'Give a Compliment', 'spend-time': 'Spend Time Together', argue: 'Argue', apologise: 'Apologise' }[action]} subtitle={action === 'spend-time' && age >= 18 ? 'Budget ' + money(dateBudget(world) / 2n) : undefined} disabledReason={age < 3 ? 'Available from age three' : action === 'apologise' && !relation.memories.some(memory => memory.startsWith('argument:')) ? 'No unresolved argument' : used(action)} onPress={() => action === 'argue' ? confirm({ type: 'interact', action, personId: id }, 'Start an argument?', 'This can damage trust and leave an unresolved disagreement.', 'Argue') : void dispatch({ type: 'interact', action, personId: id })} />)}
        <ActionRow title="Give Money" icon={<FamilyArt id="gift" size={40} />} disabledReason={age < 8 ? 'Available from age eight' : used('gift')} onPress={() => setPanel(panel === 'gift' ? null : 'gift')} />
        {panel === 'gift' && <><TextInput accessibilityLabel="Gift amount" value={amount} onChangeText={setAmount} placeholder={'Amount in ' + accountFor(world).currency} placeholderTextColor={c.muted} keyboardType="decimal-pad" style={{ color: c.ink, backgroundColor: c.inset, padding: 12, borderRadius: 10, fontSize: 18 }} /><Button label="Review Gift" onPress={() => { try { const minor = parseMoney(amount, accountFor(world).currency).minor; if (minor <= 0n) throw new Error(); setMessage(null); confirm({ type: 'gift-money', personId: id, amount: minor }, 'Give ' + money(minor) + '?', person.firstName + ' will receive the gift in their own account. Currency exchange fees apply if needed.', 'Give Gift'); } catch { setMessage('Enter a positive gift amount.'); } }} /></>}
      </Card>
      {age >= rules[player.country].adultAge && <Card><Heading size={18}>Your relationship</Heading>
        <ActionRow title={relation.romance === 'none' || relation.romance === 'ex' ? 'Ask on a Date' : 'Go on a Date'} subtitle={'Budget ' + money(dateBudget(world))} icon={<FamilyArt id="rose" size={40} />} disabledReason={romanceReason(world, person) ?? used('date')} onPress={() => confirm({ type: 'ask-date', personId: id }, 'Invite ' + person.firstName + '?', 'If they accept, you will spend ' + money(dateBudget(world)) + ' on the date.', 'Ask on a Date')} />
        {relation.romance === 'dating' && <ActionRow title="Propose" subtitle="Give a ring and ask about your future" icon={<FamilyArt id="rings" size={40} />} disabledReason={relation.strength < 75 || relation.trust < 60 ? 'Build a stronger bond and trust first' : used('propose')} onPress={() => confirm({ type: 'propose', personId: id }, 'Ask them to marry you?', 'An engagement ring you own will be offered, or a new ring will be purchased from your balance. If they decline, you keep the ring.', 'Propose')} />}
        {relation.romance === 'engaged' && <><ActionRow title="Plan Your Wedding" icon={<FamilyArt id="rings" size={40} />} onPress={() => setPanel(panel === 'wedding' ? null : 'wedding')} />{panel === 'wedding' && weddingBudgets(world).map(budget => <ActionRow key={budget.id} title={budget.label} value={money(budget.amount)} onPress={() => confirm({ type: 'marry', personId: id, budget: budget.amount }, 'Celebrate your wedding?', 'Your balance will pay ' + money(budget.amount) + '. You will share a household while retaining your accounts and ownership.', 'Get Married')} />)}</>}
        {relation.romance === 'married' && <><ActionRow title="Family Planning" icon={<FamilyArt id="carriage" size={40} />} onPress={() => router.push('/family')} /><ActionRow title="Divorce & Settlement" icon={<FamilyArt id="breakup" size={40} />} onPress={() => router.push('/divorce')} /></>}
        {(relation.romance === 'dating' || relation.romance === 'engaged') && <ActionRow title="End Relationship" icon={<FamilyArt id="breakup" size={40} />} onPress={() => confirm({ type: 'breakup', personId: id }, 'Go separate ways?', 'The relationship will end. Gifts already given remain with their recipient.', 'End Relationship')} />}
        {relation.roles.some(role => role === 'parent' || role === 'guardian') && person.householdId !== player.householdId && relation.to === player.id && <ActionRow title="Ask to Move In" disabledReason={used('move-in')} onPress={() => confirm({ type: 'ask-to-move-in', personId: id }, 'Ask to share their household?', 'They can accept or decline. If accepted, you will share living costs in their city.', 'Ask to Move In')} />}
      </Card>}
    </>}
    <EventModal event={confirmation?.event ?? null} busy={busy} onCancel={() => setConfirmation(null)} onChoose={() => { if (confirmation) { const command = confirmation.command; setConfirmation(null); setPanel(null); void dispatch(command); } }} />
  </Page>;
}
