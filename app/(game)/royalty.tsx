import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { royalMembership } from '../../src/game/systems/royaltySchemas';
import { royalTitle, royalSuccession } from '../../src/game/systems/royaltyMath';
import { royalAllowanceQuote, royalDutyReason, royalOccasionQuote, royalReceptionQuote, royalReceptionReason } from '../../src/game/systems/royalty';
import { royalFocuses } from '../../src/game/content/royalty';
import { ageOn, fullName } from '../../src/game/personHelpers';
import { countries } from '../../src/game/countries';
import { formatMoney } from '../../src/game/money';
import { CareerArt } from '../../src/assets/CareerArt';
import { ActionRow, Body, Button, Card, Header, Heading, Page } from '../../src/ui/components';
import { useCareerReview } from '../../src/ui/CareerReview';
import { SocialBusinessFacts, SocialBusinessIntro } from '../../src/ui/SocialBusinessPresentation';
import { useColors } from '../../src/ui/theme';

const pageSize = 12;
const pageFor = (page: number, count: number) => Math.min(page, Math.max(0, Math.ceil(count / pageSize) - 1));
function RoyaltyPages({ page, total, onChange, previous, next }: { page: number; total: number; onChange: (page: number) => void; previous: string; next: string }) {
  if (total <= pageSize) return null;
  return <View style={{ gap: 10 }}>
    <Body muted>Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} of {total}</Body>
    <Button label={previous} tone="secondary" disabled={!page} onPress={() => onChange(page - 1)} />
    <Button label={next} tone="secondary" disabled={(page + 1) * pageSize >= total} onPress={() => onChange(page + 1)} />
  </View>;
}

export default function Royalty() {
  const c = useColors();
  const world = useGame(s => s.world)!, busy = useGame(s => s.busy), error = useGame(s => s.error), person = world.people[world.activePersonId], review = useCareerReview();
  const membership = royalMembership(world), house = membership?.house ?? world.royalHouses.find(item => item.members.some(member => member.personId === person.id));
  const [familyPage, setFamilyPage] = useState(0), [successionPage, setSuccessionPage] = useState(0), [paymentPage, setPaymentPage] = useState(0), [crownPage, setCrownPage] = useState(0);
  const quote = house && royalAllowanceQuote(world, house), reason = royalDutyReason(world), reception = royalReceptionQuote(world), receptionReason = royalReceptionReason(world), occasion = royalOccasionQuote(world);
  const occasionReason = reason ?? (membership?.member.mode !== 'public' ? 'Take up public duties to host an official occasion.' : world.actionCounts[person.id + ':royal-occasion:' + world.date.year] ? 'You already hosted an official occasion this year.' : undefined);
  const line = house ? royalSuccession(world, house) : [], records = house?.records.filter(item => item.personId === person.id) ?? [], archives = house?.archives.filter(item => item.personId === person.id) ?? [];
  const money = (minor: bigint) => formatMoney({ minor, currency: house?.currency ?? countries[person.country].currency });
  const payments = [...records.map(item => ({ key: item.year + ':' + item.month, period: item.year + '-' + String(item.month).padStart(2, '0'), detail: item.role + ' · ' + (item.attended ? 'Duties attended' : 'No public duties'), allowance: item.allowance })), ...archives.map(item => ({ key: item.year + ':' + item.role, period: item.year + ' annual record', detail: item.role + ' · ' + item.attended + ' attended months', allowance: item.allowance }))].sort((a, b) => b.key.localeCompare(a.key));
  const familyIndex = pageFor(familyPage, house?.members.length ?? 0), successionIndex = pageFor(successionPage, line.length), paymentIndex = pageFor(paymentPage, payments.length), crownIndex = pageFor(crownPage, house?.successions.length ?? 0);
  return <Page>
    <Header title="Royalty" onBack={() => router.back()} />
    {error && !review.reviewing && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, fontSize: 15, lineHeight: 22 }}>{error}</Text>}
    <Card>
      <SocialBusinessIntro art={<CareerArt id="royalty" size={72} />} title={house ? royalTitle(world, house, person.id) : 'Royal Life'} eyebrow={house ? house.name + ' · ' + countries[house.country].name : undefined}
        body={house ? membership ? 'A title connects you to your family. Public work, private life and the next generation are choices with consequences.' : 'Your former title and family history remain here. Descendants keep their own succession rights.' : 'Royal titles come through birth or marriage. A reception can introduce you to a family member; what happens next depends on both of you.'} />
      {house ? <>
        <SocialBusinessFacts items={[{ label: 'Your place in the house', value: membership ? membership.member.mode === 'public' ? 'Public duties' : 'Private life' : 'Former member' }]} />
        {house.headId ? <ActionRow title="Sovereign" value={fullName(world.people[house.headId])} onPress={() => router.push({ pathname: '/person/[id]', params: { id: house.headId! } })} /> : <Body muted>The crown is currently vacant.</Body>}
        {house.regentId && <ActionRow title="Regent" value={fullName(world.people[house.regentId])} onPress={() => router.push({ pathname: '/person/[id]', params: { id: house.regentId! } })} />}
      </> : <ActionRow title="Choose a Royal Background" subtitle="Start a separate life in Great Britain, Japan or Spain" icon={<CareerArt id="royalty" size={36} />} onPress={() => router.push('/new-life')} />}
    </Card>
    {membership && quote && <>
      <Card>
        <Heading size={20}>Public Duties or Private Life</Heading>
        <SocialBusinessFacts items={[{ label: 'Annual rate for attended duties', value: money(quote.annual), note: 'Paid over attended months, not when you choose a focus.' }]} />
        <Body muted>Illness, custody, living abroad or conflicting full-time work can stop attendance and payment.</Body>
        {reason && <Body muted>{reason}</Body>}
        {royalFocuses.map(focus => <ActionRow key={focus} title={focus === 'balanced' ? 'Balanced Public Duties' : focus === 'community' ? 'Community Work' : 'Ceremonial Duties'} subtitle={focus === 'community' ? 'More attention to your public image' : focus === 'ceremonial' ? 'More engagements and more stress' : 'A steady programme of public work'}
          accessibilityRole="radio" accessibilityState={{ checked: membership.member.mode === 'public' && membership.member.focus === focus }} disabled={busy} disabledReason={membership.member.mode === 'public' && membership.member.focus === focus ? 'This is your current public duty focus' : reason}
          onPress={() => review.confirm({type:'royal-duties',mode:'public',focus,quotedAnnualPay:quote.annual},'Take up these public duties?','This occupies your full-time working schedule. Allowances follow the role you hold and the months you attend; future annual pay is not handed over now.',[{id:'allowance',label:'Annual rate for attended work',value:money(quote.annual),tone:'positive'}],'royalty','Set Public Duties')} />)}
        <ActionRow title="Lead a Private Life" subtitle="Keep your title; stop public duties and future allowances" accessibilityRole="radio" accessibilityState={{ checked: membership.member.mode === 'private' }} disabled={busy} disabledReason={membership.member.mode === 'private' ? 'You already lead a private royal life' : undefined}
          onPress={() => review.confirm({type:'royal-duties',mode:'private',focus:membership.member.focus,quotedAnnualPay:quote.annual},'Choose a private royal life?','Public duties and future allowances stop. Your title, family position and personal property remain. Other work and study become possible.',[],'royalty','Choose Private Life')} />
      </Card>
      <Card>
        <Heading size={20}>An Official Occasion</Heading>
        <Body muted>A speech, a ribbon and people who would quite like you to remember their names. Fund one community occasion each year.</Body>
        <SocialBusinessFacts items={[{ label: 'Your personal contribution', value: formatMoney(occasion), note: 'Paid when you confirm the occasion.' }]} />
        {occasionReason && <Body muted>{occasionReason}</Body>}
        <Button label="Review Official Occasion" disabled={busy || !!occasionReason} onPress={() => review.confirm({type:'royal-occasion',quotedCost:occasion.minor},'Host this official occasion?','Pay the reviewed personal contribution and take part. It can improve Respect, public image and recognition, while adding stress.',[{id:'cost',label:'Your contribution',value:formatMoney(occasion),tone:'negative'}],'royalty','Host Occasion')} />
      </Card>
    </>}
    <Card>
      <Heading size={20}>Attend a Public Reception</Heading>
      <Body muted>A ticket buys an evening, with a chance to meet an available family member. An introduction leaves friendship and romance to the people involved.</Body>
      <SocialBusinessFacts items={[{ label: 'Reception ticket', value: formatMoney(reception), note: 'The ticket is charged even if no introduction takes place.' }]} />
      {receptionReason && <Body muted>{receptionReason}</Body>}
      <Button label="Review Reception" disabled={busy || !!receptionReason} onPress={() => review.confirm({type:'royal-reception',quotedCost:reception.minor},'Attend the royal reception?','Pay for this year’s reception. Schedules or security may prevent an introduction. A person you meet will appear in Relationships, with their own family and choices.',[{id:'ticket',label:'Ticket',value:formatMoney(reception),tone:'negative'}],'royalty','Attend Reception')} />
    </Card>
    {house && <>
      <Card>
        <Heading size={20}>Line of Succession</Heading>
        <Body muted>Succession follows birth order through the recognised family. Spouses do not inherit the crown through marriage alone.</Body>
        {!line.length && <Body muted>No eligible successor is currently known.</Body>}
        {line.slice(successionIndex * pageSize, (successionIndex + 1) * pageSize).map((id, index) => <ActionRow key={id} title={(successionIndex * pageSize + index + 1) + '. ' + fullName(world.people[id])} subtitle={'Age ' + ageOn(world.people[id], world.date)} onPress={() => router.push({ pathname: '/person/[id]', params: { id } })} />)}
        <RoyaltyPages page={successionIndex} total={line.length} onChange={setSuccessionPage} previous="Earlier in the Line" next="Later in the Line" />
        <ActionRow title="Family Tree" onPress={() => router.push('/family-tree')} />
      </Card>
      <Card>
        <Heading size={20}>The Household</Heading>
        <Body muted>Current and former members of {house.name}.</Body>
        {!house.members.length && <Body muted>No family members are recorded.</Body>}
        {house.members.slice(familyIndex * pageSize, (familyIndex + 1) * pageSize).map(member => <ActionRow key={member.personId} title={fullName(world.people[member.personId])} subtitle={royalTitle(world, house, member.personId) + ' · ' + member.status} onPress={() => router.push({ pathname: '/person/[id]', params: { id: member.personId } })} />)}
        <RoyaltyPages page={familyIndex} total={house.members.length} onChange={setFamilyPage} previous="Earlier Family Members" next="More Family Members" />
      </Card>
      <Card>
        <Heading size={20}>The Crown Through Time</Heading>
        {!house.successions.length && <Body muted>No changes to the crown are recorded.</Body>}
        {[...house.successions].reverse().slice(crownIndex * pageSize, (crownIndex + 1) * pageSize).map((change, index) => <View key={crownIndex * pageSize + index} style={{ gap: 4, borderBottomWidth: 1, borderBottomColor: c.line, paddingBottom: 12 }}>
          <Body muted>{change.date.year}-{String(change.date.month).padStart(2, '0')} · {change.reason}</Body>
          <Heading size={17}>{change.toId ? fullName(world.people[change.toId]) : 'Crown vacant'}</Heading>
        </View>)}
        <RoyaltyPages page={crownIndex} total={house.successions.length} onChange={setCrownPage} previous="Newer Succession Records" next="Earlier Succession Records" />
      </Card>
      <Card>
        <Heading size={20}>Your Allowances</Heading>
        <Body muted>Recorded payments, separate from the annual rate for future attended duties.</Body>
        {!payments.length && <Body muted>No monthly allowance records yet.</Body>}
        {payments.slice(paymentIndex * pageSize, (paymentIndex + 1) * pageSize).map(item => <View key={item.key} accessible accessibilityLabel={item.period + '. ' + item.detail + '. ' + money(item.allowance)} style={{ gap: 4, borderBottomWidth: 1, borderBottomColor: c.line, paddingBottom: 12 }}>
          <Body muted>{item.period} · {item.detail}</Body>
          <Text style={{ color: c.ink, fontSize: 19, fontWeight: '700' }}>{money(item.allowance)}</Text>
        </View>)}
        <RoyaltyPages page={paymentIndex} total={payments.length} onChange={setPaymentPage} previous="Newer Allowances" next="Earlier Allowances" />
      </Card>
      {membership && <Card>
        <Heading size={20}>Set the Title Aside</Heading>
        <Body muted>Renunciation is permanent for you. Duties and future allowances end. Your actual children keep their own rights, and your personal property stays yours.</Body>
        {ageOn(person, world.date) < 18 && <Body muted>Renunciation is available from age eighteen.</Body>}
        <Button label="Review Renunciation" tone="secondary" disabled={busy || ageOn(person, world.date) < 18} onPress={() => review.confirm({type:'renounce-title'},'Permanently renounce your title?','You cannot take this title back. Your descendants retain their own succession rights. The crown may pass to the next eligible family member; personal estates follow the normal will and inheritance rules.',[],'royalty','Renounce My Title')} />
      </Card>}
    </>}
    {review.modal}
  </Page>;
}
