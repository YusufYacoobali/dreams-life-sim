import { petMoveCost } from '../../src/game/systems/pets';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { ageOn, fullName } from '../../src/game/model';
import { countries } from '../../src/game/countries';
import { destinationIds, destinations, DestinationId } from '../../src/game/content/travel';
import { jobs } from '../../src/game/content/jobs';
import { fields } from '../../src/game/systems/schemas';
import { relocationPrograms, relocationRoutes } from '../../src/game/systems/relocationSchemas';
import { moveQuote, moveReason, relocationFee, relocationReason, RelocationChoice, RelocationCommand } from '../../src/game/systems/relocation';
import { formatMoney, Currency } from '../../src/game/money';
import { TravelArt } from '../../src/assets/TravelArt';
import { ActionRow, Body, Button, Card, Header, Heading, Page, Portrait } from '../../src/ui/components';
import { EventModal, EventPresentation } from '../../src/ui/EventModal';
import { useColors } from '../../src/ui/theme';

const routeLabels = { settlement: 'Emigration', work: 'Work Abroad', study: 'Study Abroad' };
const programLabels = { trade: 'Technical College', university: 'University', graduate: 'Professional Study' };
const titleCase = (text: string) => text[0].toUpperCase() + text.slice(1);

function PlanChoice({ title, subtitle, icon, selected, disabled, onPress }: { title: string; subtitle?: string; icon?: React.ReactNode; selected: boolean; disabled: boolean; onPress: () => void }) {
  const colors = useColors();
  return <Pressable accessibilityRole="button" accessibilityLabel={[title, subtitle, selected ? 'Selected' : undefined].filter(Boolean).join('. ')} accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => ({ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: selected ? colors.link : colors.line, backgroundColor: selected || pressed ? colors.selected : colors.surface })}>
    {icon}<View style={{ flex: 1, minWidth: 0, gap: 3 }}><Text style={{ color: colors.ink, fontSize: 16, fontWeight: '600' }}>{title}</Text>{subtitle && <Body muted>{subtitle}</Body>}</View>
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={selected ? colors.link : colors.muted} /></View>
  </Pressable>;
}

function MoveFact({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return <View accessible accessibilityLabel={label + ': ' + value} style={{ minWidth: 0, gap: 4 }}><Body muted>{label}</Body><Text style={{ fontSize: 19, lineHeight: 26, fontWeight: '600', color: colors.ink }}>{value}</Text></View>;
}

export default function Emigrate() {
  const params = useLocalSearchParams<{ route?: string }>();
  const identity = useGame(state => {
    const world = state.world;
    if (!world) return 'none';
    const person = world.people[world.activePersonId];
    return world.id + ':' + person.id + ':' + person.country + ':' + person.city;
  });
  return <EmigrationPlan key={identity + ':' + (params.route ?? '')} routeHint={params.route} />;
}

function EmigrationPlan({ routeHint }: { routeHint?: string }) {
  const world = useGame(s => s.world)!, dispatch = useGame(s => s.dispatch), busy = useGame(s => s.busy), error = useGame(s => s.error), colors = useColors();
  const { width, fontScale } = useWindowDimensions(), stacked = width < 360 || fontScale >= 1.2;
  const person = world.people[world.activePersonId], offers = world.relocations.filter(item => item.personId === person.id);
  const [destinationId, setDestination] = useState<DestinationId>(() => person.country === destinations.paris.country ? 'london' : 'paris'), [route, setRoute] = useState<RelocationChoice['route']>(routeHint === 'work' || routeHint === 'study' ? routeHint : 'settlement');
  const [roleId, setRole] = useState('administrator'), [program, setProgram] = useState<typeof relocationPrograms[number]>('university'), [field, setField] = useState<typeof fields[number]>('arts');
  const [offerId, setOfferId] = useState<string | null>(() => {
    const matching = routeHint === 'work' || routeHint === 'study' ? offers.filter(item => item.route === routeHint) : offers;
    return matching.at(-1)?.id ?? null;
  }), [companionIds, setCompanions] = useState<string[]>([]), [reserveMonths, setReserve] = useState<3 | 6>(3), [page, setPage] = useState(0);
  const [review, setReview] = useState<{ command: RelocationCommand; event: EventPresentation } | null>(null);
  const knownApplicationCount = useRef(world.relocations.length);
  useEffect(() => {
    if (knownApplicationCount.current === world.relocations.length) return;
    knownApplicationCount.current = world.relocations.length;
    // A new actual application follows the player's current form, even when
    // they chose a different route after entering through Work/Study Abroad.
    const last = offers.at(-1); if (last) { setOfferId(last.id); setCompanions([]); }
  }, [world.relocations.length, world.activePersonId]);
  const selected: RelocationChoice = { destinationId, route, roleId: route === 'work' ? roleId : null, program: route === 'study' ? program : null, field: route === 'study' ? field : null };
  const reason = relocationReason(world, selected), fee = relocationFee(world), money = (minor: bigint, currency: Currency = countries[person.country].currency) => formatMoney({ minor, currency });
  const offer = offers.find(item => item.id === offerId), quote = offer?.status === 'approved' ? moveQuote(world, offer, companionIds, reserveMonths) : null;
  const movingPets = world.pets.filter(pet => pet.status === 'active' && [person.id, ...companionIds].includes(pet.ownerId));
  const departureReason = offer?.status === 'approved' ? moveReason(world, offer, companionIds, reserveMonths) : undefined;
  const household = world.households.find(item => item.id === person.householdId), companions = (household?.members ?? []).filter(id => id !== person.id && !world.people[id].died).map(id => world.people[id]);
  const reviewApplication = () => { if (busy || reason) return; setReview({ command: { type: 'apply-relocation', ...selected, quotedFee: fee }, event: {
    id: 'apply-relocation', kind: 'confirmation', title: 'Apply to ' + destinations[destinationId].city + '?',
    body: 'The application fee is non-refundable. Approval offers twelve calendar months to arrange your move. Your home and current job stay in place until you accept departure costs. ' + (route === 'work' ? 'This includes a real job application; salary begins after you move and work.' : route === 'study' ? 'This includes course admission; the first annual tuition must be paid when you move.' : 'This route includes residence without a job or course.'),
    illustration: <TravelArt id="abroad" width={110} />, terms: [{ id: 'fee', label: 'Application fee', value: money(fee), tone: 'neutral' }], confirmLabel: 'Submit Application',
  } }); };
  const reviewDeparture = () => {
    if (busy || departureReason || !offer || !quote) return;
    const names = [person.id, ...companionIds].filter(id => world.people[id].employment).map(id => fullName(world.people[id])).join(', ');
    setReview({ command: { type: 'relocate', applicationId: offer.id, companionIds, reserveMonths, reviewedQuote: quote }, event: {
      id: 'relocate', kind: 'confirmation', title: 'Move to ' + destinations[offer.destinationId].city + '?',
      body: (names ? 'Current jobs end for ' + names + '. ' : '') + 'Existing income tax is settled before departure. Invited adults and other guardians must agree. Your cash funds transport and the local reserve. Reserve money stays in your accounts; companions receive their own funded share. Former homes remain owned as unoccupied property, with existing bills; the new household pays local living costs. Nationality, qualifications, foreign assets, debts and earned pension rights are retained.',
      illustration: <TravelArt id="flight" width={110} />, terms: [
        { id: 'transport', label: 'Transport', value: money(quote.transport, quote.currency), tone: 'neutral' },
        ...(movingPets.length ? [{ id: 'pets', label: 'Pets moving with their adult', value: movingPets.map(pet => pet.name).join(', '), tone: 'neutral' as const }, { id: 'pet-transport', label: 'Pet transport included above', value: money(petMoveCost(world, [person.id, ...companionIds]), quote.currency), tone: 'neutral' as const }] : []),
        ...quote.taxes.filter(item => item.adjustment !== 0n).map(item => ({ id: 'tax-' + item.personId, label: world.people[item.personId].firstName + ': tax adjustment', value: money(item.adjustment, item.currency), tone: 'neutral' as const })),
        { id: 'source', label: 'Cash exchanged', value: money(quote.sourceDebit, quote.currency), tone: 'neutral' },
        { id: 'fee', label: 'FX fee', value: money(quote.fee, quote.destinationCurrency), tone: 'neutral' },
        { id: 'received', label: 'Cash received', value: money(quote.net, quote.destinationCurrency), tone: 'neutral' },
        { id: 'reserve', label: 'Household living reserve', value: money(quote.reserves.reduce((sum, item) => sum + item.monthly * BigInt(reserveMonths), 0n), quote.destinationCurrency), tone: 'neutral' },
        { id: 'tuition', label: 'First annual tuition', value: money(quote.tuition, quote.destinationCurrency), tone: 'neutral' },
      ], confirmLabel: 'Move Household',
    } });
  };
  return <Page><Header title="A New Country" onBack={() => router.back()} />
    <Card><View style={{ flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'stretch' : 'center', gap: 16 }}><TravelArt id="abroad" width={88} /><View style={{ flex: stacked ? undefined : 1, minWidth: 0, gap: 6 }}><Heading>Start a New Chapter</Heading><Body>Choose a home abroad, find work or take your studies somewhere new.</Body></View></View><View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.inset, gap: 6 }}><Body>Current home: {person.city}, {countries[person.country].name}</Body><Body muted>Nationality: {countries[person.nationality].name}</Body></View></Card>
    {error && !review && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: colors.red, fontSize: 15, lineHeight: 22 }}>{error}</Text>}
    {offer ? <>
      <Card><View style={{ flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'stretch' : 'center', gap: 16 }}><TravelArt id={offer.destinationId} width={104} /><View style={{ flex: stacked ? undefined : 1, minWidth: 0, gap: 6 }}><Heading size={22}>{destinations[offer.destinationId].city}</Heading><Body muted>{countries[destinations[offer.destinationId].country].name}</Body><View style={{ alignSelf: 'flex-start', maxWidth: '100%', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.selected }}><Body>{routeLabels[offer.route]} · {offer.status}</Body></View></View></View>
        <Body muted>{offer.status === 'approved' ? 'Offer expires' : 'Original offer expiry'} {offer.expires.month}/{offer.expires.year}</Body>
        <MoveFact label="Application fee paid" value={money(offer.applicationFee, countries[offer.originCountry].currency)} />
        {offer.job && <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.inset, gap: 6 }}><Heading size={18}>{jobs.find(item => item.id === offer.job!.roleId)?.title}</Heading><MoveFact label="Gross annual salary" value={money(offer.job.annualPay, countries[destinations[offer.destinationId].country].currency)} /><Body muted>Salary begins after you move and work.</Body></View>}
        {offer.course && <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.inset, gap: 6 }}><Heading size={18}>{offer.course.school}</Heading><Body>{programLabels[offer.course.program]} · {titleCase(offer.course.field)}</Body><MoveFact label="Annual tuition" value={money(offer.course.tuition, countries[destinations[offer.destinationId].country].currency)} /></View>}
        {offer.status === 'declined' && <Body>The fee was spent. This route can be requested again next calendar year.</Body>}
        {offer.move && <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.inset, gap: 10 }}><Heading size={18}>Your Recorded Move</Heading><Body>Moved {offer.move.date.month}/{offer.move.date.year}</Body><Body>{offer.move.participantIds.map(id => fullName(world.people[id])).join(', ')}</Body><MoveFact label="Transport paid" value={money(offer.move.quote.transport, offer.move.quote.currency)} /><MoveFact label="Cash exchanged" value={money(offer.move.quote.sourceDebit, offer.move.quote.currency) + ' → ' + money(offer.move.quote.net, offer.move.quote.destinationCurrency)} /><MoveFact label="First annual tuition paid" value={money(offer.move.quote.tuition, offer.move.quote.destinationCurrency)} /></View>}
        <Button label="Plan Another Move" tone="secondary" disabled={busy} onPress={() => { setOfferId(null); setCompanions([]); }} />
      </Card>
      {offer.status === 'approved' && quote && <>
        <Card><Heading size={20}>Move With</Heading><Body muted>Invite current household members. Adults and other guardians can decline.</Body>
          {companions.map(member => <Pressable key={member.id} accessibilityRole="checkbox" accessibilityLabel={fullName(member)} accessibilityHint="Choose who to invite. Consent is checked when you confirm the move." accessibilityState={{ checked: companionIds.includes(member.id), disabled: busy }} disabled={busy} onPress={() => setCompanions(companionIds.includes(member.id) ? companionIds.filter(id => id !== member.id) : [...companionIds, member.id])} style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: companionIds.includes(member.id) ? colors.link : colors.line, backgroundColor: companionIds.includes(member.id) ? colors.selected : colors.surface }}><Portrait name={fullName(member)} personId={member.id} appearance={member.appearance} age={ageOn(member, world.date)} size={38} /><View style={{ flex: 1, minWidth: 0 }}><Body>{fullName(member)}</Body><Body muted>Age {ageOn(member, world.date)} · {companionIds.includes(member.id) ? 'Selected' : 'Invite'}</Body></View><View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Ionicons name={companionIds.includes(member.id) ? 'checkbox' : 'square-outline'} size={24} color={companionIds.includes(member.id) ? colors.link : colors.muted} /></View></Pressable>)}
          {!companions.length && <Body muted>You have no other household members to invite.</Body>}
        </Card>
        <Card><Heading size={20}>Settle In</Heading>{([3, 6] as const).map(months => <PlanChoice disabled={busy} key={months} title={months + '-Month Living Reserve'} selected={reserveMonths === months} onPress={() => setReserve(months)} />)}
          <Body muted>The reserve comes from your existing cash. It remains available for real bills after arrival.</Body>
          <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.inset, gap: 12 }}><Heading size={18}>Departure Costs</Heading><MoveFact label="Transport" value={money(quote.transport, quote.currency)} />{movingPets.length > 0 && <Body muted>Includes {money(petMoveCost(world, [person.id, ...companionIds]), quote.currency)} to move {movingPets.map(pet => pet.name).join(', ')} with their responsible adult.</Body>}{quote.taxes.filter(item => item.adjustment !== 0n).map(item => <MoveFact key={item.personId} label={world.people[item.personId].firstName + ': tax adjustment'} value={money(item.adjustment, item.currency)} />)}</View>
          <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.inset, gap: 12 }}><Heading size={18}>Currency Exchange</Heading><MoveFact label="Cash exchanged" value={money(quote.sourceDebit, quote.currency)} /><MoveFact label="FX fee" value={money(quote.fee, quote.destinationCurrency)} /><MoveFact label="Cash received" value={money(quote.net, quote.destinationCurrency)} /></View>
          <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.inset, gap: 12 }}><Heading size={18}>Arrival Funds</Heading><MoveFact label="Household living reserve" value={money(quote.reserves.reduce((sum, item) => sum + item.monthly * BigInt(reserveMonths), 0n), quote.destinationCurrency)} />{quote.tuition > 0n && <MoveFact label="First annual tuition" value={money(quote.tuition, quote.destinationCurrency)} />}</View>
          <Heading size={18}>Before You Leave</Heading><Body>Current jobs end when you move. Your former homes remain owned, with their existing bills, and your new household pays local living costs.</Body><Body muted>Nationality, qualifications, foreign assets, debts and earned pension rights stay yours. Review all terms before confirming.</Body>
          {departureReason && <View style={{ padding: 12, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: colors.link, backgroundColor: colors.selected }}><Body>{departureReason}</Body></View>}<Button label="Review Move" disabled={busy || !!departureReason} onPress={reviewDeparture} />
        </Card>
      </>}
    </> : <>
      <Card><Heading size={20}>Your Plans</Heading>{relocationRoutes.map(item => <PlanChoice disabled={busy} key={item} title={routeLabels[item]} selected={route === item} onPress={() => setRoute(item)} />)}</Card>
      <Card><Heading size={20}>Choose a Country</Heading>{destinationIds.filter(id => destinations[id].country !== person.country).map(id => <PlanChoice disabled={busy} key={id} title={countries[destinations[id].country].name} subtitle={destinations[id].city} icon={<TravelArt id={id} width={52} />} selected={destinationId === id} onPress={() => setDestination(id)} />)}</Card>
      {route === 'work' && <Card><Heading size={20}>Job to Apply For</Heading>{jobs.filter(item => !item.specialCareer && !item.partTime).map(job => <PlanChoice disabled={busy} key={job.id} title={job.title} selected={roleId === job.id} onPress={() => setRole(job.id)} />)}</Card>}
      {route === 'study' && <Card><Heading size={20}>Course</Heading>{relocationPrograms.map(item => <PlanChoice disabled={busy} key={item} title={programLabels[item]} selected={program === item} onPress={() => setProgram(item)} />)}<Heading size={18}>Subject</Heading>{fields.map(item => <PlanChoice disabled={busy} key={item} title={titleCase(item)} selected={field === item} onPress={() => setField(item)} />)}</Card>}
      <Card><Heading size={20}>Application</Heading><View style={{ flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'stretch' : 'center', gap: 12 }}><TravelArt id={destinationId} width={88} /><View style={{ flex: stacked ? undefined : 1, minWidth: 0, gap: 4 }}><Heading size={20}>{destinations[destinationId].city}</Heading><Body>{countries[destinations[destinationId].country].name} · {routeLabels[route]}</Body>{route === 'work' && <Body muted>{jobs.find(item => item.id === roleId)?.title}</Body>}{route === 'study' && <Body muted>{programLabels[program]} · {titleCase(field)}</Body>}</View></View><View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.inset, gap: 8 }}><MoveFact label="Non-refundable application fee" value={money(fee)} /><Body muted>Approval is not guaranteed. Moving costs and any first annual tuition are reviewed separately after approval. Your home and job stay in place until you move.</Body></View>{reason && <View style={{ padding: 12, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: colors.link, backgroundColor: colors.selected }}><Body>{reason}</Body></View>}<Button label="Review Application" disabled={busy || !!reason} onPress={reviewApplication} /></Card>
    </>}
    {!!offers.length && <Card><Heading size={20}>Your Applications</Heading>{[...offers].reverse().slice(page * 12, (page + 1) * 12).map(item => <ActionRow disabled={busy} key={item.id} title={destinations[item.destinationId].city + ' · ' + routeLabels[item.route]} subtitle={item.applied.year + ' · ' + item.status} icon={<TravelArt id={item.destinationId} />} onPress={() => { setOfferId(item.id); setCompanions([]); }} />)}<Button label="Newer Applications" tone="secondary" disabled={!page} onPress={() => setPage(page - 1)} /><Button label="Earlier Applications" tone="secondary" disabled={(page + 1) * 12 >= offers.length} onPress={() => setPage(page + 1)} /></Card>}
    <EventModal event={review?.event ?? null} busy={busy} error={error} onCancel={() => setReview(null)} onChoose={async () => { if (!busy && review && await dispatch(review.command)) setReview(null); }} />
  </Page>;
}
