import { BestFriendshipCard } from '../../../src/ui/BestFriendship';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TextInput, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useGame } from '../../../src/state/useGame';
import { ageOn, fullName } from '../../../src/game/model';
import { ActionRow, Body, Button, Card, Header, Heading, Page, Portrait, StatBar } from '../../../src/ui/components';
import { dateBudget, relationFor, SocialCommand, socialActionUsed, weddingBudgets } from '../../../src/game/systems/relationships';
import { EventModal, EventPresentation } from '../../../src/ui/EventModal';
import { accountFor } from '../../../src/game/systems/common';
import { formatMoney, parseMoney } from '../../../src/game/money';
import { useColors } from '../../../src/ui/theme';
import { FamilyArt } from '../../../src/assets/FamilyArt';
import { Illustration } from '../../../src/assets/Illustration';
import { PolishArt } from '../../../src/assets/PolishArt';
import { affectionColor } from '../../../src/ui/RelationshipRow';
import { rules } from '../../../src/game/rules';
import { babyDiscussionReason, FamilyCommand, tryForBabyReason } from '../../../src/game/systems/family';
import { TeenRelationshipCard } from '../../../src/ui/TeenRelationship';
import { currentSchool } from '../../../src/game/systems/schoolSchemas';
import { schoolHelpReason } from '../../../src/game/systems/school';
import { currentWorkplace } from '../../../src/game/systems/workplaceSchemas';
import { workFeedbackReason, workRaiseReason } from '../../../src/game/systems/workplaces';
import { conversationTopics } from '../../../src/game/systems/conversations';
import { dateActivities } from '../../../src/game/systems/dateActivities';
import { usePersonInteractions } from '../../../src/ui/PersonInteractions';
import { PersonActionArt, type PersonActionArtId } from '../../../src/assets/PersonActionArt';
import { personProfileDisplay } from '../../../src/ui/personProfileDisplay';
import { assetCatalog } from '../../../src/game/content/assets';
import { assetPrice } from '../../../src/game/systems/assetPricing';
import { exchangeQuote } from '../../../src/game/systems/finance';
import { DisplayText as Text, displayText } from '../../../src/ui/DisplayText';

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
  const confirmationRef = useRef(confirmation), confirmationSubmitting = useRef(false);
  confirmationRef.current = confirmation;
  useEffect(() => () => { confirmationRef.current = null; }, []);
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
    id: 'conversation:' + id, kind: 'selection', illustration:'person-action:talk', title: 'Talk to ' + fullName(person),
    body: 'Pick a topic. One conversation per person each year.',
    confirmLabel: 'Have Conversation', choices: topics.map(topic => ({ id: topic.id, label: topic.label + '\n' + topic.body, disabledReason: topic.disabledReason })),
  } : null;
  const activities = useMemo(() => person && relation && age >= rules[player.country].adultAge ? dateActivities(world, id) : [], [world, id]);
  const dateReason = activities.some(activity => !activity.disabledReason) ? undefined : activities[0]?.disabledReason;
  const date: EventPresentation | null = dateOpen && person && !person.died && !player.died && relation ? {
    id: 'date-activity:' + id, kind: 'selection', illustration:'person-action:ask-date', title: 'A date with ' + fullName(person),
    body: 'Pick a plan. They can decline; you pay only if they accept.',
    confirmLabel: 'Invite ' + person.firstName, choices: activities.map(activity => ({ id: activity.id, label: activity.label + ' · ' + formatMoney({ minor: activity.cost, currency: activity.currency }) + '\n' + activity.body, disabledReason: activity.disabledReason })),
  } : null;
  const reviewArt:Partial<Record<SocialCommand['type']|FamilyCommand['type'],PersonActionArtId>>={'gift-money':'give-money','propose':'propose','marry':'plan-wedding','breakup':'breakup','ask-to-move-in':'move-in','review-custody':'review-custody','try-child':'family-planning','discuss-child':'family-planning'};
  const confirm = (command: SocialCommand | FamilyCommand, title: string, body: string, confirmLabel: string) => {
    const art=command.type==='interact'?command.action:reviewArt[command.type];
    const review = { command, event: { id: command.type + ':' + id, kind: 'confirmation' as const, illustration:art?'person-action:'+art:undefined, title, body, terms: [], confirmLabel } };
    confirmationRef.current = review; setConfirmation(review);
  };
  const used = (action: string) => socialActionUsed(world, id, action) ? 'Already tried this year' : undefined;
  const familyRelation = relation?.roles.some(role=>role==='parent'||role==='guardian'||role==='sibling');
  const romanticPartner = !!relation && ['dating', 'engaged', 'married'].includes(relation.romance) && !familyRelation;
  const babyReason = romanticPartner ? person.wantsChildren ? tryForBabyReason(world, id) : babyDiscussionReason(world, id) : undefined;
  const bondIcon = familyRelation ? 'family-life' : 'friends';
  const parentFigure = relation?.roles.some(role => role === 'parent' || role === 'guardian') && relation.to === player.id;
  const display = person && personProfileDisplay(world,person.id);
  return <Page><Header title="Person Profile" backDisabled={(!!confirmation || !!conversation || !!date || interactions.reviewing) && busy} onBack={() => { if (!confirmationSubmitting.current && !conversationSubmitting.current && !dateSubmitting.current && interactions.canLeave()) router.back(); }} />
    {person ? <>
      <Card><View style={{flexDirection:stackedIdentity?'column':'row',alignItems:stackedIdentity?'flex-start':'center',gap:16}}>
        <Portrait name={fullName(person)} personId={person.id} appearance={person.appearance} age={ageOn(person,world.date)} size={88} />
        <View style={{flex:stackedIdentity?undefined:1,minWidth:0,maxWidth:'100%',gap:5}}>
          <Heading size={22}>{fullName(person)}</Heading>
          <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:8}}>
            {display?.role && <Text style={{color:c.ink,fontSize:15,fontWeight:'700'}}>{display.role}</Text>}
            <Text style={{color:c.ink,fontSize:14,fontWeight:'600'}}>Age {ageOn(person,world.date)}</Text>
          </View>
          {display?.occupation && <Text style={{color:c.muted,fontSize:14,lineHeight:20}}>{display.occupation}</Text>}
          <Text style={{color:c.muted,fontSize:13,lineHeight:19}}>{display?.location}</Text>
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
        {world.socialAccounts.filter(item=>item.ownerId===person.id).map(item=><ActionRow key={item.id} title={'@'+item.handle} subtitle={item.status==='memorial'?'Memorial social profile':'Social profile'} icon={<PersonActionArt id="social-profile" size={40} />} onPress={()=>router.push({pathname:'/social-profile/[id]',params:{id:item.id}})} />)}
        {person.died && <><Body>Died in {person.died.year}: {person.causeOfDeath}</Body><Button label="View Life & Estate Summary" tone="secondary" onPress={()=>router.push({pathname:'/life-summary',params:{id:person.id}})} /></>}
      </Card>}
    </> : <Body>This person could not be found.</Body>}
    {!confirmation && !conversation && !date && !friendshipReviewOpen && !teenReviewOpen && !interactions.reviewing && (error || message) && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, fontSize: 16 }}>{message ?? error}</Text>}
    {person && !person.died && relation && <>
      {school?.currentTeacherId === id && <Card><Heading size={18}>School Support</Heading><ActionRow title="Ask for Academic Help" subtitle="An extra session once each school year" icon={<PersonActionArt id="academic-help" size={40} />} disabled={busy} disabledReason={schoolHelpReason(world, school, id)} onPress={() => void dispatch({ type: 'school-help', communityId: school.id, teacherId: id })} /></Card>}
      {colleague && <Card><Heading size={18}>{colleague.role === 'supervisor' ? 'Your Supervisor' : 'Your Coworker'}</Heading><Body muted>{workplace!.employer}</Body>{colleague.role === 'supervisor' && <><ActionRow title="Ask for Work Feedback" icon={<PersonActionArt id="work-feedback" size={40} />} subtitle="Once a year · Uses 4 energy" disabled={busy} disabledReason={workFeedbackReason(world, workplace, id)} onPress={() => void dispatch({ type: 'work-feedback', workplaceId: workplace!.id, supervisorId: id })} /><ActionRow title="Ask for a Raise" icon={<PersonActionArt id="request-raise" size={40} />} subtitle="5% higher pay · Uses 6 energy" disabled={busy} disabledReason={workRaiseReason(world, workplace, id)} onPress={() => void dispatch({ type: 'request-raise', workplaceId: workplace!.id, supervisorId: id })} /></>}</Card>}
      {relation.roles.includes('parent') && relation.from === player.id && ageOn(person, world.date) < rules[person.country].adultAge && <Card><Heading size={18}>Care & identity</Heading><Body>Lives in {person.city}{person.householdId === player.householdId ? ' with you' : ' in another household'}.</Body>{person.householdId === player.householdId && <><TextInput accessibilityLabel="Child first name" editable={!busy} value={childName} onChangeText={setChildName} maxLength={40} placeholder={person.firstName} placeholderTextColor={c.muted} style={{ color: c.ink, backgroundColor: c.inset, padding: 12, borderRadius: 10 }} /><Button label="Save Child’s Name" accessibilityLabel={displayText(currentName ? "Save Child’s Name. This is their current name" : undefined)} busy={busy} disabled={!childName.trim() || currentName} onPress={async () => { if (!person || childName.trim() === person.firstName) return; setMessage(null); if (await dispatch({ type: 'name-child', childId: id, firstName: childName })) setChildName(''); }} />{currentName && <Body muted>This is their current name.</Body>}</>}{custody && <><Body>{custody.arrangement === 'shared' ? 'Shared care' : 'Primary care'} · Primary home with {world.people[custody.primaryId].firstName}</Body>{(['shared', 'me', 'them'] as const).map(preference => <ActionRow disabled={busy} key={preference} title={preference === 'shared' ? 'Request Shared Care' : preference === 'me' ? 'Request Primary Care' : 'Request Other Parent’s Care'} icon={<PersonActionArt id="review-custody" size={40} />} disabledReason={custody.lastReviewYear === world.date.year ? 'Reviewed this year' : undefined} onPress={() => confirm({ type: 'review-custody', childId: id, preference }, 'Review custody?', 'Ask for a care arrangement that works for your child and both parents.', 'Review Custody')} />)}</>}</Card>}
      {age >= rules[player.country].adultAge && ageOn(person, world.date) >= rules[person.country].adultAge && !familyRelation && <Card><Heading size={18}>Your relationship</Heading>
        <ActionRow disabled={busy} title={relation.romance === 'none' || relation.romance === 'ex' ? 'Ask on a Date' : 'Go on a Date'} subtitle="Choose an activity and see its cost" icon={<PersonActionArt id="ask-date" size={40} />} disabledReason={dateReason} onPress={() => {
          if (busy || dateSubmitting.current || conversationOpenRef.current || dateReason || confirmation || friendshipReviewOpen || teenReviewOpen || interactions.reviewing) return;
          setMessage(null); dateOpenRef.current = true; setDateOpen(true);
        }} />
        {romanticPartner && <>
          <ActionRow title="Spend Time Together" subtitle={'Budget ' + money(dateBudget(world) / 2n)} icon={<PersonActionArt id="spend-time" size={40} />} disabled={busy} disabledReason={player.died ? 'This life has ended' : used('spend-time')} onPress={() => void dispatch({ type: 'interact', action: 'spend-time', personId: id })} />
          <ActionRow title={person.wantsChildren ? 'Try for a Baby' : 'Discuss Having a Baby'} icon={<PersonActionArt id="family-planning" size={40} />} disabled={busy} disabledReason={babyReason} onPress={() => {
            if (busy || babyReason || confirmation || conversationOpen || dateOpen || friendshipReviewOpen || teenReviewOpen || interactions.reviewing) return;
            setMessage(null);
            if (person.wantsChildren) confirm({ type: 'try-child', personId: id }, 'Try for a baby with ' + person.firstName + '?', 'You both want a child. Conception depends on age, health and fertility; you can try once each year.', 'Try for a Baby');
            else confirm({ type: 'discuss-child', personId: id }, 'Talk about having a baby?', 'You tell ' + person.firstName + ' you would love to have a baby. They are not so sure; hear them out and give them time if they say no.', 'Discuss Having a Baby');
          }} />
        </>}
        {relation.romance === 'dating' && <ActionRow disabled={busy} title="Propose" subtitle="Give a ring and ask about your future" icon={<PersonActionArt id="propose" size={40} />} disabledReason={relation.strength < 75 || relation.trust < 60 ? 'Build a stronger bond and trust first' : used('propose')} onPress={() => {const ring=world.assets.some(item=>item.ownerId===player.id&&item.catalogId==='engagement-ring'),offer=assetCatalog.find(item=>item.id==='engagement-ring')!;confirm({ type: 'propose', personId: id }, 'Ask them to marry you?', ring?'Offer your ring; it becomes theirs if they accept. If they decline, you keep it.':'Buy a ring for '+money(assetPrice(world,offer))+' and offer it. If they decline, you keep the ring.', 'Propose');}} />}
        {relation.romance === 'engaged' && <><ActionRow disabled={busy} title="Plan Your Wedding" icon={<PersonActionArt id="plan-wedding" size={40} />} onPress={() => setPanel(panel === 'wedding' ? null : 'wedding')} />{panel === 'wedding' && weddingBudgets(world).map(budget => <ActionRow disabled={busy} key={budget.id} title={budget.label} icon={<PersonActionArt id="plan-wedding" size={40} />} value={money(budget.amount)} onPress={() => confirm({ type: 'marry', personId: id, budget: budget.amount }, 'Celebrate your wedding?', 'The ceremony costs ' + money(budget.amount) + '. You will share a household and keep your own accounts and property.', 'Get Married')} />)}</>}
        {relation.romance === 'married' && <><ActionRow title="Family" icon={<FamilyArt id="family-tree" size={40} />} onPress={() => router.push('/family')} /><ActionRow title="Divorce & Settlement" icon={<PersonActionArt id="divorce" size={40} />} onPress={() => router.push('/divorce')} /></>}
        {(relation.romance === 'dating' || relation.romance === 'engaged') && <ActionRow disabled={busy} title="End Relationship" icon={<PersonActionArt id="breakup" size={40} />} onPress={() => confirm({ type: 'breakup', personId: id }, 'Go separate ways?', 'End the relationship; gifts already given stay with them.', 'End Relationship')} />}
      </Card>}
      <Card><Heading size={18}>Time together</Heading>{(['talk', 'compliment', 'spend-time'] as const).filter(action => !romanticPartner || action !== 'spend-time').map(action => <ActionRow disabled={busy} key={action} title={{ talk: 'Have a Conversation', compliment: 'Give a Compliment', 'spend-time': 'Spend Time Together' }[action]} icon={<PersonActionArt id={action} size={40} />} subtitle={action === 'spend-time' && age >= 18 ? 'Budget ' + money(dateBudget(world) / 2n) : undefined} disabledReason={player.died ? 'This life has ended' : action === 'talk' ? conversationReason : age < 3 ? 'Available from age three' : used(action)} onPress={() => {
        if (action === 'talk') {
          if (busy || conversationSubmitting.current || dateOpenRef.current || conversationReason || confirmation || friendshipReviewOpen || teenReviewOpen || interactions.reviewing) return;
          setMessage(null); conversationOpenRef.current = true; setConversationOpen(true);
        } else void dispatch({ type: 'interact', action, personId: id });
      }} />)}</Card>
      {(interactions.supportRows.length > 0 || age >= rules[player.country].adultAge && parentFigure && person.householdId !== player.householdId) && <Card><Heading size={18}>{familyRelation ? 'Family Support' : 'Support & Advice'}</Heading>
        {interactions.supportRows}
        {age >= rules[player.country].adultAge && parentFigure && person.householdId !== player.householdId && <ActionRow disabled={busy} title="Ask to Move In" icon={<PersonActionArt id="move-in" size={40} />} disabledReason={used('move-in')} onPress={() => confirm({ type: 'ask-to-move-in', personId: id }, 'Ask to share their household?', 'They can accept or decline. If accepted, you will share living costs in their city.', 'Ask to Move In')} />}
      </Card>}
      <Card><Heading size={18}>Money & Gifts</Heading>
        <ActionRow disabled={busy} title="Give Money" icon={<PersonActionArt id="give-money" size={40} />} disabledReason={age < 8 ? 'Available from age eight' : used('gift')} onPress={() => setPanel(panel === 'gift' ? null : 'gift')} />
        {panel === 'gift' && <><TextInput accessibilityLabel="Gift amount" editable={!busy} value={amount} onChangeText={setAmount} placeholder={'Amount in ' + accountFor(world).currency} placeholderTextColor={c.muted} keyboardType="decimal-pad" style={{ color: c.ink, backgroundColor: c.inset, padding: 12, borderRadius: 10, fontSize: 18 }} /><Button label="Review Gift" disabled={busy} onPress={() => { try { const minor = parseMoney(amount, accountFor(world).currency).minor; if (minor <= 0n) throw new Error(); setMessage(null); const targetCurrency=accountFor(world,person).currency,received=targetCurrency===accountFor(world).currency?minor:exchangeQuote(world,minor,accountFor(world).currency,targetCurrency).net; confirm({ type: 'gift-money', personId: id, amount: minor }, 'Give ' + money(minor) + '?', person.firstName+' receives '+formatMoney({minor:received,currency:targetCurrency})+(targetCurrency===accountFor(world).currency?' as a gift.':' after exchange fees.'), 'Give Gift'); } catch { setMessage('Enter a positive gift amount.'); } }} /></>}
        {interactions.moneyRows}
      </Card>
      <Card><Heading size={18}>Disagreements</Heading>
        <ActionRow title="Argue" icon={<PersonActionArt id="argue" size={40} />} disabled={busy} disabledReason={player.died ? 'This life has ended' : age < 3 ? 'Available from age three' : used('argue')} onPress={() => confirm({ type: 'interact', action: 'argue', personId: id }, 'Start an argument?', 'This can damage trust and leave an unresolved disagreement.', 'Argue')} />
        {interactions.conflictRows}
        <ActionRow title="Apologise" icon={<PersonActionArt id="apologise" size={40} />} disabled={busy} disabledReason={player.died ? 'This life has ended' : age < 3 ? 'Available from age three' : !relation.memories.some(memory => memory.startsWith('argument:')) ? 'No unresolved argument' : used('apologise')} onPress={() => void dispatch({ type: 'interact', action: 'apologise', personId: id })} />
      </Card>

    </>}
    {person && relation && <TeenRelationshipCard key={'teen:' + world.id + ':' + player.id + ':' + person.id} world={world} personId={person.id} onReviewChange={setTeenReviewOpen} />}
    {person && relation && <BestFriendshipCard key={world.id + ':' + player.id + ':' + person.id + ':' + player.country + ':' + player.city + ':' + person.country + ':' + person.city} world={world} personId={person.id} onReviewChange={setFriendshipReviewOpen} />}
    {interactions.modal}
    <EventModal event={person && !person.died && relation ? confirmation?.event ?? null : null} busy={busy} error={error} onCancel={() => {
      if (!busy && !confirmationSubmitting.current && confirmationRef.current === confirmation) { confirmationRef.current = null; setConfirmation(null); }
    }} onChoose={async () => {
      if (!person || person.died || !relation || !confirmation || confirmationRef.current !== confirmation || busy || confirmationSubmitting.current) return;
      confirmationSubmitting.current = true;
      try {
        if (await dispatch(confirmation.command) && confirmationRef.current === confirmation) { confirmationRef.current = null; setConfirmation(null); setPanel(null); }
      } finally { confirmationSubmitting.current = false; }
    }} />
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
