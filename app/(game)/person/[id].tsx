import { BestFriendshipCard } from '../../../src/ui/BestFriendship';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Text, TextInput, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useGame } from '../../../src/state/useGame';
import { ageOn, fullName } from '../../../src/game/model';
import { ActionRow, Body, Button, Card, Header, Heading, Page, Portrait, StatBar } from '../../../src/ui/components';
import { dateBudget, relationFor, relationLabel, SocialCommand, socialActionUsed, weddingBudgets } from '../../../src/game/systems/relationships';
import { EventModal, EventPresentation } from '../../../src/ui/EventModal';
import { accountFor } from '../../../src/game/systems/common';
import { formatMoney, parseMoney } from '../../../src/game/money';
import { useColors } from '../../../src/ui/theme';
import { FamilyArt } from '../../../src/assets/FamilyArt';
import { Illustration } from '../../../src/assets/Illustration';
import { PolishArt } from '../../../src/assets/PolishArt';
import { affectionColor } from '../../../src/ui/RelationshipRow';
import { countries } from '../../../src/game/countries';
import { rules } from '../../../src/game/rules';
import { jobs } from '../../../src/game/content/jobs';
import { isConfined } from '../../../src/game/systems/legalSchemas';
import { FamilyCommand } from '../../../src/game/systems/family';
import { TeenRelationshipCard } from '../../../src/ui/TeenRelationship';
import { currentSchool } from '../../../src/game/systems/schoolSchemas';
import { schoolHelpReason } from '../../../src/game/systems/school';
import { currentWorkplace } from '../../../src/game/systems/workplaceSchemas';
import { workFeedbackReason, workRaiseReason } from '../../../src/game/systems/workplaces';
import { conversationTopics } from '../../../src/game/systems/conversations';
import { dateActivities } from '../../../src/game/systems/dateActivities';
import { usePersonInteractions } from '../../../src/ui/PersonInteractions';

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
  const { width, fontScale } = useWindowDimensions(), stackedIdentity = width < 360 || fontScale >= 1.3;
  const [friendshipReviewOpen, setFriendshipReviewOpen] = useState(false);
  const [teenReviewOpen, setTeenReviewOpen] = useState(false);
  const [conversationOpen, setConversationOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const conversationOpenRef = useRef(false), conversationSubmitting = useRef(false), worldRef = useRef(world);
  const dateOpenRef = useRef(false), dateSubmitting = useRef(false);
  worldRef.current = world;
  useEffect(() => () => { conversationOpenRef.current = false; dateOpenRef.current = false; }, []);
  const [panel, setPanel] = useState<'gift' | 'wedding' | null>(null), [amount, setAmount] = useState(''), [message, setMessage] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ command: SocialCommand | FamilyCommand; event: EventPresentation } | null>(null), [childName, setChildName] = useState('');
  const interactions = usePersonInteractions(world, id, conversationOpen || dateOpen || !!confirmation || friendshipReviewOpen || teenReviewOpen);
  const player = world.people[world.activePersonId], relation = person && relationFor(world, player.id, person.id), age = ageOn(player, world.date);
  const money = (minor: bigint) => formatMoney({ minor, currency: accountFor(world).currency });
  const school = currentSchool(world);
  const workplace = currentWorkplace(world), colleague = workplace?.members.find(item => item.personId === id && !item.left);
  const custody = world.custody.find(item => item.childId === id && !item.ended && (item.a === player.id || item.b === player.id));
  const currentName = childName.trim() === person?.firstName;
  const topics = useMemo(() => person && relation ? conversationTopics(world, id) : [], [world, id]);
  const conversationReason = topics.some(topic => !topic.disabledReason) ? undefined : topics[0]?.disabledReason;
  const conversation: EventPresentation | null = conversationOpen && person && !person.died && !player.died && relation ? {
    id: 'conversation:' + id, kind: 'selection', title: 'Talk to ' + fullName(person),
    body: 'Pick a topic. One conversation per person each year.',
    confirmLabel: 'Have Conversation', choices: topics.map(topic => ({ id: topic.id, label: topic.label + '\n' + topic.body, disabledReason: topic.disabledReason })),
  } : null;
  const activities = useMemo(() => person && relation && age >= rules[player.country].adultAge ? dateActivities(world, id) : [], [world, id]);
  const dateReason = activities.some(activity => !activity.disabledReason) ? undefined : activities[0]?.disabledReason;
  const date: EventPresentation | null = dateOpen && person && !person.died && !player.died && relation ? {
    id: 'date-activity:' + id, kind: 'selection', title: 'A date with ' + fullName(person),
    body: 'Pick a plan. They can decline; you pay only if they accept.',
    confirmLabel: 'Invite ' + person.firstName, choices: activities.map(activity => ({ id: activity.id, label: activity.label + ' · ' + formatMoney({ minor: activity.cost, currency: activity.currency }) + '\n' + activity.body, disabledReason: activity.disabledReason })),
  } : null;
  const confirm = (command: SocialCommand | FamilyCommand, title: string, body: string, confirmLabel: string) => setConfirmation({ command, event: { id: command.type + ':' + id, kind: 'confirmation', title, body, terms: [], confirmLabel } });
  const used = (action: string) => socialActionUsed(world, id, action) ? 'Already tried this year' : undefined;
  const familyRelation = relation?.roles.some(role=>role==='parent'||role==='guardian'||role==='sibling');
  const bondIcon = familyRelation ? 'family-life' : 'friends';
  const parentFigure = relation?.roles.some(role => role === 'parent' || role === 'guardian') && relation.to === player.id;
  const occupation = person && (isConfined(world,person) ? 'In custody' : person.employment ? jobs.find(job=>job.id===person.employment!.roleId)?.title ?? 'Employed'
    : person.education.stage !== 'none' ? person.education.school || 'Student' : person.finance.pensionAnnual>0n ? 'Retired' : 'No current occupation');
  return <Page><Header title="Person Profile" backDisabled={(!!conversation || !!date || interactions.reviewing) && busy} onBack={() => { if (!conversationSubmitting.current && !dateSubmitting.current && interactions.canLeave()) router.back(); }} />
    {person ? <>
      <Card><View style={{flexDirection:stackedIdentity?'column':'row',alignItems:stackedIdentity?'flex-start':'center',gap:16}}>
        <Portrait name={fullName(person)} personId={person.id} appearance={person.appearance} age={ageOn(person,world.date)} size={88} />
        <View style={{flex:stackedIdentity?undefined:1,minWidth:0,gap:5}}>
          <Heading size={22}>{fullName(person)}</Heading>
          <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:8}}>
            {relation && <Text style={{color:c.muted,fontSize:14}}>{relationLabel(world,relation)}</Text>}
            <Text style={{color:c.ink,fontSize:14,fontWeight:'600'}}>Age {ageOn(person,world.date)}</Text>
          </View>
          <Text style={{color:c.muted,fontSize:14,lineHeight:20}}>{occupation}</Text>
          <Text style={{color:c.muted,fontSize:13,lineHeight:19}}>{person.city}, {countries[person.country].name}</Text>
        </View>
      </View>
        {!!person.traits.length && <View style={{backgroundColor:c.inset,borderRadius:10,padding:12}}><Body muted>{person.traits.join(' · ')}</Body></View>}
      </Card>
      <Card><Heading size={18}>Relationship & Wellbeing</Heading>
        {relation && <><StatBar label="Relationship" value={relation.strength} color={affectionColor(relation.strength,c)} icon={relation.romance==='none'?<PolishArt id={bondIcon} size={24} />:<FamilyArt id="hearts" size={24} />} /><StatBar label="Trust" value={relation.trust} color={c.blue} icon={<FamilyArt id="conversation" size={24} />} /></>}
        <StatBar label="Happiness" value={person.stats.happiness} color={c.green} icon={<Illustration id="wellbeing" size={24} />} />
        <StatBar label="Health" value={person.stats.health} color={c.teal} icon={<PolishArt id="health-check" size={24} />} />
        <StatBar label="Looks" value={person.stats.looks} color={c.purple} icon={<PolishArt id="life-star" size={24} />} />
        <StatBar label="Smarts" value={person.stats.smarts} color={c.blue} icon={<Illustration id="education" size={24} />} />
      </Card>
      {(person.died || world.socialAccounts.some(item=>item.ownerId===person.id)) && <Card><Heading size={18}>{person.died?'Life Record':'Social Profiles'}</Heading>
        {world.socialAccounts.filter(item=>item.ownerId===person.id).map(item=><ActionRow key={item.id} title={'@'+item.handle} subtitle={item.status==='memorial'?'Memorial social profile':'Social profile'} icon={<Illustration id="journal" size={40} />} onPress={()=>router.push({pathname:'/social-profile/[id]',params:{id:item.id}})} />)}
        {person.died && <><Body>Died in {person.died.year}: {person.causeOfDeath}</Body><Button label="View Life & Estate Summary" tone="secondary" onPress={()=>router.push({pathname:'/life-summary',params:{id:person.id}})} /></>}
      </Card>}
    </> : <Body>This person could not be found.</Body>}
    {!confirmation && !conversation && !date && !friendshipReviewOpen && !teenReviewOpen && !interactions.reviewing && (error || message) && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, fontSize: 16 }}>{message ?? error}</Text>}
    {person && !person.died && relation && <>
      {school?.currentTeacherId === id && <Card><Heading size={18}>School Support</Heading><ActionRow title="Ask for Academic Help" subtitle="An extra session once each school year" icon={<Illustration id="education" size={40} />} disabled={busy} disabledReason={schoolHelpReason(world, school, id)} onPress={() => void dispatch({ type: 'school-help', communityId: school.id, teacherId: id })} /></Card>}
      {colleague && <Card><Heading size={18}>{colleague.role === 'supervisor' ? 'Your Supervisor' : 'Your Coworker'}</Heading><Body muted>{workplace!.employer}</Body>{colleague.role === 'supervisor' && <><ActionRow title="Ask for Work Feedback" icon={<Illustration id="career" size={40} />} subtitle="Once a year · Uses 4 energy" disabled={busy} disabledReason={workFeedbackReason(world, workplace, id)} onPress={() => void dispatch({ type: 'work-feedback', workplaceId: workplace!.id, supervisorId: id })} /><ActionRow title="Ask for a Raise" icon={<Illustration id="money" size={40} />} subtitle="5% higher pay · Uses 6 energy" disabled={busy} disabledReason={workRaiseReason(world, workplace, id)} onPress={() => void dispatch({ type: 'request-raise', workplaceId: workplace!.id, supervisorId: id })} /></>}</Card>}
      {relation.roles.includes('parent') && relation.from === player.id && ageOn(person, world.date) < rules[person.country].adultAge && <Card><Heading size={18}>Care & identity</Heading><Body>Lives in {person.city}{person.householdId === player.householdId ? ' with you' : ' in another household'}.</Body>{person.householdId === player.householdId && <><TextInput accessibilityLabel="Child first name" editable={!busy} value={childName} onChangeText={setChildName} maxLength={40} placeholder={person.firstName} placeholderTextColor={c.muted} style={{ color: c.ink, backgroundColor: c.inset, padding: 12, borderRadius: 10 }} /><Button label="Save Child’s Name" accessibilityLabel={currentName ? "Save Child’s Name. This is their current name" : undefined} busy={busy} disabled={!childName.trim() || currentName} onPress={async () => { if (!person || childName.trim() === person.firstName) return; setMessage(null); if (await dispatch({ type: 'name-child', childId: id, firstName: childName })) setChildName(''); }} />{currentName && <Body muted>This is their current name.</Body>}</>}{custody && <><Body>{custody.arrangement === 'shared' ? 'Shared care' : 'Primary care'} · Primary home with {world.people[custody.primaryId].firstName}</Body>{(['shared', 'me', 'them'] as const).map(preference => <ActionRow disabled={busy} key={preference} title={preference === 'shared' ? 'Request Shared Care' : preference === 'me' ? 'Request Primary Care' : 'Request Other Parent’s Care'} icon={<FamilyArt id="family-tree" size={40} />} disabledReason={custody.lastReviewYear === world.date.year ? 'Reviewed this year' : undefined} onPress={() => confirm({ type: 'review-custody', childId: id, preference }, 'Review custody?', 'The arrangement considers the child’s needs, both parents’ ability to care and your preference.', 'Review Custody')} />)}</>}</Card>}
      <Card><Heading size={18}>Time together</Heading>{(['talk', 'compliment', 'spend-time'] as const).map(action => <ActionRow disabled={busy} key={action} title={{ talk: 'Have a Conversation', compliment: 'Give a Compliment', 'spend-time': 'Spend Time Together' }[action]} icon={action==='spend-time'?<PolishArt id={bondIcon} size={40} />:action==='compliment'?<PolishArt id="life-star" size={40} />:<FamilyArt id="conversation" size={40} />} subtitle={action === 'spend-time' && age >= 18 ? 'Budget ' + money(dateBudget(world) / 2n) : undefined} disabledReason={player.died ? 'This life has ended' : action === 'talk' ? conversationReason : age < 3 ? 'Available from age three' : used(action)} onPress={() => {
        if (action === 'talk') {
          if (busy || conversationSubmitting.current || dateOpenRef.current || conversationReason || confirmation || friendshipReviewOpen || teenReviewOpen || interactions.reviewing) return;
          setMessage(null); conversationOpenRef.current = true; setConversationOpen(true);
        } else void dispatch({ type: 'interact', action, personId: id });
      }} />)}</Card>
      {(interactions.supportRows.length > 0 || age >= rules[player.country].adultAge && parentFigure && person.householdId !== player.householdId) && <Card><Heading size={18}>{familyRelation ? 'Family Support' : 'Support & Advice'}</Heading>
        {interactions.supportRows}
        {age >= rules[player.country].adultAge && parentFigure && person.householdId !== player.householdId && <ActionRow disabled={busy} title="Ask to Move In" icon={<Illustration id="property" size={40} />} disabledReason={used('move-in')} onPress={() => confirm({ type: 'ask-to-move-in', personId: id }, 'Ask to share their household?', 'They can accept or decline. If accepted, you will share living costs in their city.', 'Ask to Move In')} />}
      </Card>}
      <Card><Heading size={18}>Money & Gifts</Heading>
        <ActionRow disabled={busy} title="Give Money" icon={<FamilyArt id="gift" size={40} />} disabledReason={age < 8 ? 'Available from age eight' : used('gift')} onPress={() => setPanel(panel === 'gift' ? null : 'gift')} />
        {panel === 'gift' && <><TextInput accessibilityLabel="Gift amount" editable={!busy} value={amount} onChangeText={setAmount} placeholder={'Amount in ' + accountFor(world).currency} placeholderTextColor={c.muted} keyboardType="decimal-pad" style={{ color: c.ink, backgroundColor: c.inset, padding: 12, borderRadius: 10, fontSize: 18 }} /><Button label="Review Gift" disabled={busy} onPress={() => { try { const minor = parseMoney(amount, accountFor(world).currency).minor; if (minor <= 0n) throw new Error(); setMessage(null); confirm({ type: 'gift-money', personId: id, amount: minor }, 'Give ' + money(minor) + '?', person.firstName + ' will receive the gift in their own account. Currency exchange fees apply if needed.', 'Give Gift'); } catch { setMessage('Enter a positive gift amount.'); } }} /></>}
        {interactions.moneyRows}
      </Card>
      <Card><Heading size={18}>Disagreements</Heading>
        <ActionRow title="Argue" icon={<FamilyArt id="conversation" size={40} />} disabled={busy} disabledReason={player.died ? 'This life has ended' : age < 3 ? 'Available from age three' : used('argue')} onPress={() => confirm({ type: 'interact', action: 'argue', personId: id }, 'Start an argument?', 'This can damage trust and leave an unresolved disagreement.', 'Argue')} />
        {interactions.conflictRows}
        <ActionRow title="Apologise" icon={<FamilyArt id="conversation" size={40} />} disabled={busy} disabledReason={player.died ? 'This life has ended' : age < 3 ? 'Available from age three' : !relation.memories.some(memory => memory.startsWith('argument:')) ? 'No unresolved argument' : used('apologise')} onPress={() => void dispatch({ type: 'interact', action: 'apologise', personId: id })} />
      </Card>
      {age >= rules[player.country].adultAge && ageOn(person, world.date) >= 18 && !familyRelation && <Card><Heading size={18}>Your relationship</Heading>
        <ActionRow disabled={busy} title={relation.romance === 'none' || relation.romance === 'ex' ? 'Ask on a Date' : 'Go on a Date'} subtitle="Choose an activity and see its cost" icon={<FamilyArt id="rose" size={40} />} disabledReason={dateReason} onPress={() => {
          if (busy || dateSubmitting.current || conversationOpenRef.current || dateReason || confirmation || friendshipReviewOpen || teenReviewOpen || interactions.reviewing) return;
          setMessage(null); dateOpenRef.current = true; setDateOpen(true);
        }} />
        {relation.romance === 'dating' && <ActionRow disabled={busy} title="Propose" subtitle="Give a ring and ask about your future" icon={<FamilyArt id="rings" size={40} />} disabledReason={relation.strength < 75 || relation.trust < 60 ? 'Build a stronger bond and trust first' : used('propose')} onPress={() => confirm({ type: 'propose', personId: id }, 'Ask them to marry you?', 'An engagement ring you own will be offered, or a new ring will be purchased from your balance. If they decline, you keep the ring.', 'Propose')} />}
        {relation.romance === 'engaged' && <><ActionRow disabled={busy} title="Plan Your Wedding" icon={<FamilyArt id="rings" size={40} />} onPress={() => setPanel(panel === 'wedding' ? null : 'wedding')} />{panel === 'wedding' && weddingBudgets(world).map(budget => <ActionRow disabled={busy} key={budget.id} title={budget.label} icon={<FamilyArt id="rings" size={40} />} value={money(budget.amount)} onPress={() => confirm({ type: 'marry', personId: id, budget: budget.amount }, 'Celebrate your wedding?', 'Your balance will pay ' + money(budget.amount) + '. You will share a household while retaining your accounts and ownership.', 'Get Married')} />)}</>}
        {relation.romance === 'married' && <><ActionRow title="Family Planning" icon={<FamilyArt id="carriage" size={40} />} onPress={() => router.push('/family')} /><ActionRow title="Divorce & Settlement" icon={<FamilyArt id="breakup" size={40} />} onPress={() => router.push('/divorce')} /></>}
        {(relation.romance === 'dating' || relation.romance === 'engaged') && <ActionRow disabled={busy} title="End Relationship" icon={<FamilyArt id="breakup" size={40} />} onPress={() => confirm({ type: 'breakup', personId: id }, 'Go separate ways?', 'The relationship will end. Gifts already given remain with their recipient.', 'End Relationship')} />}
      </Card>}
    </>}
    {person && relation && <TeenRelationshipCard key={'teen:' + world.id + ':' + player.id + ':' + person.id} world={world} personId={person.id} onReviewChange={setTeenReviewOpen} />}
    {person && relation && <BestFriendshipCard key={world.id + ':' + player.id + ':' + person.id + ':' + player.country + ':' + player.city + ':' + person.country + ':' + person.city} world={world} personId={person.id} onReviewChange={setFriendshipReviewOpen} />}
    {interactions.modal}
    <EventModal event={person && !person.died && relation ? confirmation?.event ?? null : null} busy={busy} error={error} onCancel={() => setConfirmation(null)} onChoose={async () => { if (person && !person.died && relation && confirmation && await dispatch(confirmation.command)) { setConfirmation(null); setPanel(null); } }} />
    <EventModal event={conversation} busy={busy} error={error} onCancel={() => {
      if (!busy && !conversationSubmitting.current) { conversationOpenRef.current = false; setConversationOpen(false); }
    }} onChoose={async selected => {
      if (!conversationOpenRef.current || !conversation || busy || conversationSubmitting.current) return;
      const topic = conversationTopics(worldRef.current, id).find(item => item.id === selected);
      if (!topic || topic.disabledReason) return;
      conversationSubmitting.current = true;
      try {
        if (await dispatch({ type: 'interact', personId: id, action: 'talk', topic: topic.id })) { conversationOpenRef.current = false; setConversationOpen(false); }
      } finally { conversationSubmitting.current = false; }
    }} />
    <EventModal event={date} busy={busy} error={error} onCancel={() => {
      if (!busy && !dateSubmitting.current) { dateOpenRef.current = false; setDateOpen(false); }
    }} onChoose={async selected => {
      if (!dateOpenRef.current || !date || busy || dateSubmitting.current) return;
      const activity = dateActivities(worldRef.current, id).find(item => item.id === selected);
      if (!activity || activity.disabledReason) return;
      dateSubmitting.current = true;
      try {
        if (await dispatch({ type: 'ask-date', personId: id, activity: activity.id })) { dateOpenRef.current = false; setDateOpen(false); }
      } finally { dateSubmitting.current = false; }
    }} />
  </Page>;
}
