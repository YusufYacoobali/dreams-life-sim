import { BestFriendshipCard } from '../../../src/ui/BestFriendship';
import React, { useState } from 'react';
import { Text, TextInput } from 'react-native';
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
import { isConfined } from '../../../src/game/systems/legalSchemas';
import { FamilyCommand } from '../../../src/game/systems/family';
import { TeenRelationshipCard } from '../../../src/ui/TeenRelationship';
import { currentSchool } from '../../../src/game/systems/schoolSchemas';
import { schoolHelpReason } from '../../../src/game/systems/school';
import { currentWorkplace } from '../../../src/game/systems/workplaceSchemas';
import { workFeedbackReason, workRaiseReason } from '../../../src/game/systems/workplaces';

export default function PersonProfile() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const identity = useGame(s => s.world?.id + ':' + s.world?.activePersonId);
  const personId = typeof id === 'string' ? id : '';
  return <PersonDetails key={identity + ':' + personId} id={personId} />;
}

function PersonDetails({ id }: { id: string }) {
  const world = useGame(s => s.world)!;
  const person = world.people[id];
  const dispatch = useGame(s => s.dispatch), busy = useGame(s => s.busy), error = useGame(s => s.error), c = useColors();
  const [friendshipReviewOpen, setFriendshipReviewOpen] = useState(false);
  const [teenReviewOpen, setTeenReviewOpen] = useState(false);
  const [panel, setPanel] = useState<'gift' | 'wedding' | null>(null), [amount, setAmount] = useState(''), [message, setMessage] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ command: SocialCommand | FamilyCommand; event: EventPresentation } | null>(null), [childName, setChildName] = useState('');
  const player = world.people[world.activePersonId], relation = person && relationFor(world, player.id, person.id), age = ageOn(player, world.date);
  const money = (minor: bigint) => formatMoney({ minor, currency: accountFor(world).currency });
  const school = currentSchool(world);
  const workplace = currentWorkplace(world), colleague = workplace?.members.find(item => item.personId === id && !item.left);
  const custody = world.custody.find(item => item.childId === id && !item.ended && (item.a === player.id || item.b === player.id));
  const currentName = childName.trim() === person?.firstName;
  const confirm = (command: SocialCommand | FamilyCommand, title: string, body: string, confirmLabel: string) => setConfirmation({ command, event: { id: command.type + ':' + id, kind: 'confirmation', title, body, terms: [], confirmLabel } });
  const used = (action: string) => socialActionUsed(world, id, action) ? 'Already tried this year' : undefined;
  return <Page><Header title="Person Profile" onBack={() => router.back()} />
    {person ? <Card>
      <Portrait name={fullName(person)} appearance={person.appearance} age={ageOn(person, world.date)} size={88} /><Heading>{fullName(person)}</Heading>
      <Body>Age {ageOn(person, world.date)}</Body><Body>{person.city}</Body>
      <Body>{person.traits.join(', ')}</Body>
      <StatBar label="Health" value={person.stats.health} color={c.teal} />
      {relation && <><Body>{relationLabel(world, relation)}</Body><StatBar label="Relationship" value={relation.strength} color={c.green} /><StatBar label="Trust" value={relation.trust} color={c.blue} /></>}
      <Body>{isConfined(world, person) ? 'In custody' : person.employment ? jobs.find(job => job.id === person.employment!.roleId)?.title : person.finance.pensionAnnual > 0n ? 'Retired' : person.education.school ?? 'No current occupation'}</Body>
      {world.socialAccounts.filter(item => item.ownerId === person.id).map(item => <ActionRow key={item.id} title={'@' + item.handle} subtitle={item.status === 'memorial' ? 'Memorial social profile' : 'Social profile'} onPress={() => router.push({ pathname: '/social-profile/[id]', params: { id: item.id } })} />)}
      {person.died && <><Body>Died in {person.died.year}: {person.causeOfDeath}</Body><Button label="View Life & Estate Summary" tone="secondary" onPress={() => router.push({ pathname: '/life-summary', params: { id: person.id } })} /></>}
    </Card> : <Body>This person could not be found.</Body>}
    {!confirmation && !friendshipReviewOpen && !teenReviewOpen && (error || message) && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, fontSize: 16 }}>{message ?? error}</Text>}
    {person && relation && <TeenRelationshipCard key={'teen:' + world.id + ':' + player.id + ':' + person.id} world={world} personId={person.id} onReviewChange={setTeenReviewOpen} />}
    {person && relation && <BestFriendshipCard key={world.id + ':' + player.id + ':' + person.id + ':' + player.country + ':' + player.city + ':' + person.country + ':' + person.city} world={world} personId={person.id} onReviewChange={setFriendshipReviewOpen} />}
    {person && !person.died && relation && <>
      {school?.currentTeacherId === id && <Card><Heading size={18}>School Support</Heading><ActionRow title="Ask for Academic Help" subtitle="An extra session once each school year" disabled={busy} disabledReason={schoolHelpReason(world, school, id)} onPress={() => void dispatch({ type: 'school-help', communityId: school.id, teacherId: id })} /></Card>}
      {colleague && <Card><Heading size={18}>{colleague.role === 'supervisor' ? 'Your Supervisor' : 'Your Coworker'}</Heading><Body muted>{workplace!.employer}</Body>{colleague.role === 'supervisor' && <><ActionRow title="Ask for Work Feedback" subtitle="Once a year · Uses 4 energy" disabled={busy} disabledReason={workFeedbackReason(world, workplace, id)} onPress={() => void dispatch({ type: 'work-feedback', workplaceId: workplace!.id, supervisorId: id })} /><ActionRow title="Ask for a Raise" subtitle="5% higher pay · Uses 6 energy" disabled={busy} disabledReason={workRaiseReason(world, workplace, id)} onPress={() => void dispatch({ type: 'request-raise', workplaceId: workplace!.id, supervisorId: id })} /></>}</Card>}
      {relation.roles.includes('parent') && relation.from === player.id && ageOn(person, world.date) < rules[person.country].adultAge && <Card><Heading size={18}>Care & identity</Heading><Body>Lives in {person.city}{person.householdId === player.householdId ? ' with you' : ' in another household'}.</Body>{person.householdId === player.householdId && <><TextInput accessibilityLabel="Child first name" editable={!busy} value={childName} onChangeText={setChildName} maxLength={40} placeholder={person.firstName} placeholderTextColor={c.muted} style={{ color: c.ink, backgroundColor: c.inset, padding: 12, borderRadius: 10 }} /><Button label="Save Child’s Name" accessibilityLabel={currentName ? "Save Child’s Name. This is their current name" : undefined} busy={busy} disabled={!childName.trim() || currentName} onPress={async () => { if (!person || childName.trim() === person.firstName) return; setMessage(null); if (await dispatch({ type: 'name-child', childId: id, firstName: childName })) setChildName(''); }} />{currentName && <Body muted>This is their current name.</Body>}</>}{custody && <><Body>{custody.arrangement === 'shared' ? 'Shared care' : 'Primary care'} · Primary home with {world.people[custody.primaryId].firstName}</Body>{(['shared', 'me', 'them'] as const).map(preference => <ActionRow disabled={busy} key={preference} title={preference === 'shared' ? 'Request Shared Care' : preference === 'me' ? 'Request Primary Care' : 'Request Other Parent’s Care'} disabledReason={custody.lastReviewYear === world.date.year ? 'Reviewed this year' : undefined} onPress={() => confirm({ type: 'review-custody', childId: id, preference }, 'Review custody?', 'The arrangement considers the child’s needs, both parents’ ability to care and your preference.', 'Review Custody')} />)}</>}</Card>}
      <Card><Heading size={18}>Time together</Heading>{(['talk', 'compliment', 'spend-time', 'argue', 'apologise'] as const).map(action => <ActionRow disabled={busy} key={action} title={{ talk: 'Have a Conversation', compliment: 'Give a Compliment', 'spend-time': 'Spend Time Together', argue: 'Argue', apologise: 'Apologise' }[action]} subtitle={action === 'spend-time' && age >= 18 ? 'Budget ' + money(dateBudget(world) / 2n) : undefined} disabledReason={age < 3 ? 'Available from age three' : action === 'apologise' && !relation.memories.some(memory => memory.startsWith('argument:')) ? 'No unresolved argument' : used(action)} onPress={() => action === 'argue' ? confirm({ type: 'interact', action, personId: id }, 'Start an argument?', 'This can damage trust and leave an unresolved disagreement.', 'Argue') : void dispatch({ type: 'interact', action, personId: id })} />)}
        <ActionRow disabled={busy} title="Give Money" icon={<FamilyArt id="gift" size={40} />} disabledReason={age < 8 ? 'Available from age eight' : used('gift')} onPress={() => setPanel(panel === 'gift' ? null : 'gift')} />
        {panel === 'gift' && <><TextInput accessibilityLabel="Gift amount" editable={!busy} value={amount} onChangeText={setAmount} placeholder={'Amount in ' + accountFor(world).currency} placeholderTextColor={c.muted} keyboardType="decimal-pad" style={{ color: c.ink, backgroundColor: c.inset, padding: 12, borderRadius: 10, fontSize: 18 }} /><Button label="Review Gift" disabled={busy} onPress={() => { try { const minor = parseMoney(amount, accountFor(world).currency).minor; if (minor <= 0n) throw new Error(); setMessage(null); confirm({ type: 'gift-money', personId: id, amount: minor }, 'Give ' + money(minor) + '?', person.firstName + ' will receive the gift in their own account. Currency exchange fees apply if needed.', 'Give Gift'); } catch { setMessage('Enter a positive gift amount.'); } }} /></>}
      </Card>
      {age >= rules[player.country].adultAge && <Card><Heading size={18}>Your relationship</Heading>
        <ActionRow disabled={busy} title={relation.romance === 'none' || relation.romance === 'ex' ? 'Ask on a Date' : 'Go on a Date'} subtitle={'Budget ' + money(dateBudget(world))} icon={<FamilyArt id="rose" size={40} />} disabledReason={romanceReason(world, person) ?? used('date')} onPress={() => confirm({ type: 'ask-date', personId: id }, 'Invite ' + person.firstName + '?', 'If they accept, you will spend ' + money(dateBudget(world)) + ' on the date.', 'Ask on a Date')} />
        {relation.romance === 'dating' && <ActionRow disabled={busy} title="Propose" subtitle="Give a ring and ask about your future" icon={<FamilyArt id="rings" size={40} />} disabledReason={relation.strength < 75 || relation.trust < 60 ? 'Build a stronger bond and trust first' : used('propose')} onPress={() => confirm({ type: 'propose', personId: id }, 'Ask them to marry you?', 'An engagement ring you own will be offered, or a new ring will be purchased from your balance. If they decline, you keep the ring.', 'Propose')} />}
        {relation.romance === 'engaged' && <><ActionRow disabled={busy} title="Plan Your Wedding" icon={<FamilyArt id="rings" size={40} />} onPress={() => setPanel(panel === 'wedding' ? null : 'wedding')} />{panel === 'wedding' && weddingBudgets(world).map(budget => <ActionRow disabled={busy} key={budget.id} title={budget.label} value={money(budget.amount)} onPress={() => confirm({ type: 'marry', personId: id, budget: budget.amount }, 'Celebrate your wedding?', 'Your balance will pay ' + money(budget.amount) + '. You will share a household while retaining your accounts and ownership.', 'Get Married')} />)}</>}
        {relation.romance === 'married' && <><ActionRow title="Family Planning" icon={<FamilyArt id="carriage" size={40} />} onPress={() => router.push('/family')} /><ActionRow title="Divorce & Settlement" icon={<FamilyArt id="breakup" size={40} />} onPress={() => router.push('/divorce')} /></>}
        {(relation.romance === 'dating' || relation.romance === 'engaged') && <ActionRow disabled={busy} title="End Relationship" icon={<FamilyArt id="breakup" size={40} />} onPress={() => confirm({ type: 'breakup', personId: id }, 'Go separate ways?', 'The relationship will end. Gifts already given remain with their recipient.', 'End Relationship')} />}
        {relation.roles.some(role => role === 'parent' || role === 'guardian') && person.householdId !== player.householdId && relation.to === player.id && <ActionRow disabled={busy} title="Ask to Move In" disabledReason={used('move-in')} onPress={() => confirm({ type: 'ask-to-move-in', personId: id }, 'Ask to share their household?', 'They can accept or decline. If accepted, you will share living costs in their city.', 'Ask to Move In')} />}
      </Card>}
    </>}
    <EventModal event={person && !person.died && relation ? confirmation?.event ?? null : null} busy={busy} error={error} onCancel={() => setConfirmation(null)} onChoose={async () => { if (person && !person.died && relation && confirmation && await dispatch(confirmation.command)) { setConfirmation(null); setPanel(null); } }} />
  </Page>;
}
