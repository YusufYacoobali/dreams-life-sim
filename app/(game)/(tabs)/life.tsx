import { CultArt } from '../../../src/assets/CultArt';
import { activeCult } from '../../../src/game/systems/cultSchemas';
import { activeTrip, physicalLocation } from '../../../src/game/systems/travelSchemas';
import { publicRoyalDuty,royalMembership } from '../../../src/game/systems/royaltySchemas';
import { royalTitle } from '../../../src/game/systems/royaltyMath';
import { serviceCareer,serviceQualified,serviceAway } from '../../../src/game/systems/serviceSchemas';
import { serviceCatalog } from '../../../src/game/content/services';
import { fullTimeCreator } from '../../../src/game/systems/creatorSchemas';
import { creatorCatalog } from '../../../src/game/content/creators';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { countryFlags } from '../../../src/ui/CreationElements';
import { router } from 'expo-router';
import { useGame } from '../../../src/state/useGame';
import { ageOn, fullName, type World } from '../../../src/game/model';
import { countries } from '../../../src/game/countries';
import { formatMoney } from '../../../src/game/money';
import { Body, Portrait, StatBar } from '../../../src/ui/components';
import { useColors } from '../../../src/ui/theme';
import { jobs } from '../../../src/game/content/jobs';
import { accountFor } from '../../../src/game/systems/common';
import { activeSentence, isConfined } from '../../../src/game/systems/legalSchemas';
import { useDelayedBusy } from '../../../src/ui/useDelayedBusy';
import { useFeedbackPress } from '../../../src/ui/feedback';
import { rentalResidence } from '../../../src/game/systems/rentalSchemas';
import { resolveLifeContext, type LifeContext } from '../../../src/ui/lifeContext';
import { CareerArt } from '../../../src/assets/CareerArt';
import { Illustration } from '../../../src/assets/Illustration';
import { HealthLegalArt } from '../../../src/assets/HealthLegalArt';
import { FameBusinessArt } from '../../../src/assets/FameBusinessArt';
import { DisplayText as Text, displayText } from '../../../src/ui/DisplayText';
import { createJournalProjection, type JournalRow } from '../../../src/ui/journalProjection';

// Derive only displayed facts and the identity/date scope, never a cached World.
function identityPresentation(world: World) {
  const player = world.people[world.activePersonId];
  const account = accountFor(world);
  const bankBalance = formatMoney({ minor: account.cash, currency: account.currency }, countries[player.country].locale);
  const occupation = activeSentence(world) ? 'Prisoner' : isConfined(world) ? 'Held on remand' : player.legal.wanted ? 'Fugitive' : activeCult(world) ? 'Cult Leader' : world.businesses.some(item => item.ownerId === player.id && item.status === 'active') && ageOn(player, world.date) >= 18 ? 'Business Owner' : world.musicReleases.some(item=>item.personId===player.id&&['recording','paused'].includes(item.status)) ? 'Musician' : world.elections.some(item=>item.status==='campaign'&&item.candidates.some(candidate=>candidate.personId===player.id&&candidate.status==='active')) ? 'Political Candidate' : publicRoyalDuty(world) ? royalTitle(world,publicRoyalDuty(world)!.house,player.id) : serviceCareer(world) ? serviceCatalog[serviceCareer(world)!.kind].title+(serviceQualified(serviceCareer(world)!)?'':' Trainee') : fullTimeCreator(world) ? creatorCatalog[fullTimeCreator(world)!.kind].title : player.employment ? jobs.find(role => role.id === player.employment!.roleId)?.title : player.education.stage !== 'none' ? 'Student' : ageOn(player, world.date) === 0 ? 'Newborn' : ageOn(player, world.date) < 18 ? 'Child' : player.finance.pensionAnnual > 0n ? 'Retired' : 'Unemployed';
  const membership = royalMembership(world), assignment = serviceAway(world);
  return {
    scope: [world.id, player.id, account.currency, world.date.year, world.date.month, world.date.day, player.born.year, player.born.month, player.born.day],
    personId: player.id, name: fullName(player), age: ageOn(player, world.date), appearance: player.appearance,
    country: player.country, bankBalance, occupation,
    royalLabel: membership ? royalTitle(world, membership.house, player.id) : null,
    serviceLocation: assignment ? assignment.location : null,
    tripCity: activeTrip(world) ? physicalLocation(world).city : null,
    rentedHome: rentalResidence(world)?.name ?? null,
    stats: { happiness: player.stats.happiness, health: player.stats.health, smarts: player.stats.smarts, looks: player.stats.looks, respect: player.stats.respect },
  };
}
type IdentityPresentation = ReturnType<typeof identityPresentation>;

// Theme context still updates this memoized child independently of its facts.
const LifeIdentity = React.memo(function LifeIdentity({ data }: { data: IdentityPresentation }) {
  const c = useColors();
  const openProfile = useFeedbackPress(() => router.push('/profile'));
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel={displayText('My Life profile. ' + data.name + '. Age ' + data.age + '. ' + data.occupation + '. Bank balance ' + data.bankBalance)} onPress={openProfile} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13 }}>
      <Portrait decorative name={data.name} personId={data.personId} appearance={data.appearance} age={data.age} size={52} />
      <View style={{ flex: 1 }}><Text style={{ color: c.ink, fontSize: 18, fontWeight: '700' }} numberOfLines={2}>{data.name}</Text>
        {data.royalLabel !== null && <Text style={{ color: c.muted, fontSize: 11 }}>{data.royalLabel}</Text>}
        <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>{countryFlags[data.country]} {data.occupation} · {'Age\u00a0' + data.age}</Text>
        {data.serviceLocation !== null && <Text style={{ color: c.muted, fontSize: 11 }}>Away: {data.serviceLocation}</Text>}
        {data.tripCity !== null && <Text style={{ color: c.muted, fontSize: 11 }}>Away: {data.tripCity}</Text>}
        {data.rentedHome !== null && <Text style={{ color: c.muted, fontSize: 11 }}>Home: {data.rentedHome}</Text>}
      </View>
      <View style={{ maxWidth: '35%', alignItems: 'flex-end' }}><Text adjustsFontSizeToFit minimumFontScale={0.55} numberOfLines={1} style={{ color: c.positiveText, fontSize: 18, fontWeight: '700' }}>{data.bankBalance}</Text><Text style={{ color: c.muted, fontSize: 10, marginTop: 3 }}>Bank Balance</Text></View>
    </Pressable>
    <View style={{ paddingHorizontal: 16, paddingBottom: 12, gap: 2 }}>
      <StatBar label="Happiness" value={data.stats.happiness} color={c.green} icon={<Ionicons name="heart" size={22} color="#FF665D" />} />
      <StatBar label="Health" value={data.stats.health} color={c.teal} icon={<Ionicons name="bulb" size={22} color="#EAC54E" />} />
      <StatBar label="Smarts" value={data.stats.smarts} color={c.blue} icon={<Ionicons name="book" size={22} color="#419BF8" />} />
      <StatBar label="Looks" value={data.stats.looks} color={c.purple} icon={<Ionicons name="people" size={22} color="#A36BE3" />} />
      <StatBar label="Respect" value={data.stats.respect} color={c.amber} icon={<Ionicons name="star" size={22} color="#F6BE30" />} />
    </View>
  </>;
});

const journalKey = (row: JournalRow) => row.entry.id;
const JournalFact = React.memo(function JournalFact({ row, followJournal }: { row: JournalRow; followJournal: () => void }) {
  const c = useColors();
  return <View onLayout={followJournal} style={{ paddingHorizontal: 16, paddingTop: row.startsYear ? 18 : 7, gap: 7 }}>{row.startsYear && <Text style={{ color: c.blue, fontSize: 19, fontWeight: '700' }}>Age: {row.age}</Text>}<Body muted>{row.entry.text}</Body></View>;
});
function EmptyJournal() {
  return <View style={{ padding: 16 }}><Body muted>Your journal is ready for your first year.</Body></View>;
}

// Keep FlatList's render props stable while only save status changes.
const LifeJournal = React.memo(function LifeJournal({ rows, listRef, followJournal, stopFollowing, firstYearHint }: {
  rows: readonly JournalRow[]; listRef: React.RefObject<FlatList<JournalRow> | null>;
  followJournal: () => void; stopFollowing: () => void; firstYearHint: string | null;
}) {
  const c = useColors();
  const renderFact = useCallback(({ item }: { item: JournalRow }) => <JournalFact row={item} followJournal={followJournal} />, [followJournal]);
  return <FlatList ref={listRef} data={rows} keyExtractor={journalKey} style={{ flex: 1, marginHorizontal: 16, borderRadius: 16, backgroundColor: c.surface }} contentContainerStyle={{ paddingBottom: 16 }} initialNumToRender={12} maxToRenderPerBatch={12} windowSize={7} removeClippedSubviews={false}
      // Keep native row views attached while a frozen tab acquires new facts.
      // Android 24 can crash its RenderThread when clipped rows are reattached.
      // Keep following while virtualised rows acquire their real heights. The
      // first content event can precede layout and cannot settle the position.
      onLayout={followJournal} onContentSizeChange={followJournal}
      onScrollBeginDrag={stopFollowing}
      renderItem={renderFact}
      ListEmptyComponent={EmptyJournal}
      ListFooterComponent={firstYearHint ? <View style={{ paddingHorizontal: 16, paddingTop: 20 }}><Body muted>{firstYearHint}</Body></View> : null}
    />;
});

function LifeContextIcon({ icon }: { icon:LifeContext['icon'] }) {
  const c = useColors();
  if (icon.kind === 'cult') return <CultArt size={30} />;
  if (icon.kind === 'career') return <CareerArt id={icon.id} size={30} />;
  if (icon.kind === 'illustration') return <Illustration id={icon.id} size={30} />;
  if (icon.kind === 'legal') return <HealthLegalArt id={icon.id} size={30} />;
  if (icon.kind === 'business') return <FameBusinessArt id={icon.id} size={30} />;
  return <Ionicons name="person-circle-outline" size={30} color={c.link} />;
}

export default function Life() {
  const world = useGame(s => s.world)!;
  const c = useColors();
  const dispatch = useGame(s => s.dispatch);
  const busy = useGame(s => s.busy);
  const error = useGame(s => s.error);
  const { width,fontScale } = useWindowDimensions();
  const context = useMemo(() => resolveLifeContext(world),[world]);
  const showContextLabel = width / fontScale >= 300;
  const [advancing, setAdvancing] = useState(false);
  const showYearProgress = useDelayedBusy(busy && advancing);
  const player = world.people[world.activePersonId];
  const identityCache = useRef<{ key: string; data: IdentityPresentation } | null>(null);
  const identity = useMemo(() => {
    const data = identityPresentation(world), key = JSON.stringify(data);
    if (identityCache.current?.key === key) return identityCache.current.data;
    identityCache.current = { key, data }; return data;
  }, [world]);
  const [projectJournal] = useState(createJournalProjection);
  const projection = useMemo(() => projectJournal(world.journal, { lifeId: world.id, personId: player.id, born: player.born }, world), [projectJournal, world]);
  const journalRows = projection.rows;
  // New openings begin at their first fact; retained saves and later entries
  // keep the existing follow-to-end behavior without changing the journal UI.
  const showingBirthIntroduction = world.date.year === player.born.year && world.date.month === player.born.month && world.date.day === player.born.day
    && projection.birthIntroduction;
  const journal = useRef<FlatList<JournalRow>>(null), shouldScroll = useRef(true), scrollFrame = useRef<number | null>(null);
  const openingJournal = useRef(showingBirthIntroduction); openingJournal.current = showingBirthIntroduction;
  const cancelJournalScroll = useCallback(() => {
    if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
    scrollFrame.current = null;
  }, []);
  const followJournal = useCallback(() => {
    if (!shouldScroll.current || scrollFrame.current !== null) return;
    scrollFrame.current = requestAnimationFrame(() => {
      scrollFrame.current = null;
      if (shouldScroll.current && openingJournal.current) { journal.current?.scrollToOffset({ offset: 0, animated: false }); return; }
      // FlatList.scrollToEnd estimates the last row from cell metrics, which
      // can lag new journal facts. Use the native ScrollView's actual end.
      const scroll = shouldScroll.current ? journal.current?.getScrollResponder() : null;
      if (scroll && 'scrollToEnd' in scroll && typeof scroll.scrollToEnd === 'function') scroll.scrollToEnd({ animated: false });
    });
  }, []);
  const stopFollowing = useCallback(() => { shouldScroll.current = false; cancelJournalScroll(); }, [cancelJournalScroll]);
  // A frozen tab reconnects layout effects when shown again. Keep this passive
  // so returning to Life preserves the player's place in older entries.
  useEffect(() => {
    shouldScroll.current = true;
    followJournal();
    return cancelJournalScroll;
  }, [world.id, player.id, journalRows.length, showingBirthIntroduction, followJournal, cancelJournalScroll]);
  const pendingKind = world.pending?.kind, previousPendingKind = useRef(pendingKind);
  useEffect(() => {
    // A new entry may have laid out behind its result modal. Retry once it
    // closes, while keeping an intentional drag through older entries intact.
    if (previousPendingKind.current === 'result' && pendingKind === undefined) followJournal();
    previousPendingKind.current = pendingKind;
  }, [pendingKind, followJournal]);
  const firstYearHint = ageOn(player, world.date) === 0 ? world.annual ? 'Your first year is in progress. Continue when you are ready.' : 'Tap Age Up to live your first year.' : null;
  const advanceYear = useFeedbackPress(async () => { setAdvancing(true); try { return await dispatch({ type: world.annual ? 'resume' : 'advance' }); } finally { setAdvancing(false); } }, busy || !!world.pending);
  const contextScope = JSON.stringify([world.id,player.id,context.href]), currentContext = useRef(contextScope);
  currentContext.current = contextScope;
  const openContext = useFeedbackPress(() => {
    if (currentContext.current !== contextScope) return false;
    router.push(context.href);
  },busy || !!world.pending);
  return <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
    <LifeIdentity data={identity} />
    {error && <Text accessibilityRole="alert" style={{ color: c.red, paddingHorizontal: 16, marginBottom: 10 }}>{error}</Text>}
    <LifeJournal rows={journalRows} listRef={journal} followJournal={followJournal} stopFollowing={stopFollowing} firstYearHint={firstYearHint} />
    <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={displayText(world.annual ? 'Continue This Year' : 'Age Up')} accessibilityState={{ disabled: busy || !!world.pending, busy: busy && advancing }} disabled={busy || !!world.pending} onPress={advanceYear} style={({ pressed }) => ({ flex: 1, minWidth: 0, minHeight: 62, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 15, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? c.actionGreenPressed : c.actionGreen, opacity: busy || world.pending ? 0.5 : 1 })}>
        {showYearProgress ? <ActivityIndicator color="#FFFFFF" accessibilityLabel="Saving your year" /> : <Ionicons name="add-circle" size={32} color="#FFFFFF" />}<Text style={{ color: '#FFFFFF', fontSize: world.annual ? 19 : 25, fontWeight: '700',flexShrink:1,minWidth:0,textAlign:'center' }}>{world.annual ? 'Continue This Year' : 'Age Up'}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={displayText(context.label)} accessibilityState={{ disabled:busy || !!world.pending }} disabled={busy || !!world.pending} onPress={openContext} style={({ pressed }) => ({ width:showContextLabel ? 88 : 54,flexShrink:0,minHeight:62,paddingHorizontal:6,paddingVertical:8,gap:3,borderRadius:15,borderWidth:1,borderColor:c.line,backgroundColor:pressed ? c.inset : c.selected,alignItems:'center',justifyContent:'center',opacity:busy || world.pending ? 0.5 : 1 })}>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><LifeContextIcon icon={context.icon} /></View>
        {showContextLabel && <Text style={{ color:c.link,fontSize:12,fontWeight:'700',textAlign:'center' }}>{context.label}</Text>}
      </Pressable>
    </View>
  </SafeAreaView>;
}
