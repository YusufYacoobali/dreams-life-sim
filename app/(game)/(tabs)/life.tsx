import { activeTrip, physicalLocation } from '../../../src/game/systems/travelSchemas';
import { publicRoyalDuty,royalMembership } from '../../../src/game/systems/royaltySchemas';
import { royalTitle } from '../../../src/game/systems/royaltyMath';
import { serviceCareer,serviceQualified,serviceAway } from '../../../src/game/systems/serviceSchemas';
import { serviceCatalog } from '../../../src/game/content/services';
import { fullTimeCreator } from '../../../src/game/systems/creatorSchemas';
import { creatorCatalog } from '../../../src/game/content/creators';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { EventModal } from '../../../src/ui/EventModal';
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

// Save progress and local menus do not change this world's portrait or stats.
const LifeIdentity = React.memo(function LifeIdentity({ world }: { world: World }) {
  const c = useColors();
  const player = world.people[world.activePersonId];
  const account = accountFor(world);
  const bankBalance = formatMoney({ minor: account.cash, currency: account.currency }, countries[player.country].locale);
  const occupation = activeSentence(world) ? 'Prisoner' : isConfined(world) ? 'Held on remand' : player.legal.wanted ? 'Fugitive' : world.businesses.some(item => item.ownerId === player.id && item.status === 'active') && ageOn(player, world.date) >= 18 ? 'Business Owner' : world.musicReleases.some(item=>item.personId===player.id&&['recording','paused'].includes(item.status)) ? 'Musician' : world.elections.some(item=>item.status==='campaign'&&item.candidates.some(candidate=>candidate.personId===player.id&&candidate.status==='active')) ? 'Political Candidate' : publicRoyalDuty(world) ? royalTitle(world,publicRoyalDuty(world)!.house,player.id) : serviceCareer(world) ? serviceCatalog[serviceCareer(world)!.kind].title+(serviceQualified(serviceCareer(world)!)?'':' Trainee') : fullTimeCreator(world) ? creatorCatalog[fullTimeCreator(world)!.kind].title : player.employment ? jobs.find(role => role.id === player.employment!.roleId)?.title : player.education.stage !== 'none' ? 'Student' : ageOn(player, world.date) === 0 ? 'Newborn' : ageOn(player, world.date) < 18 ? 'Child' : player.finance.pensionAnnual > 0n ? 'Retired' : 'Unemployed';
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel={'My Life profile. ' + fullName(player) + '. Age ' + ageOn(player, world.date) + '. ' + occupation + '. Bank balance ' + bankBalance} onPress={() => router.push('/profile')} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13 }}>
      <Portrait decorative name={fullName(player)} appearance={player.appearance} age={ageOn(player, world.date)} size={52} />
      <View style={{ flex: 1 }}><Text style={{ color: c.ink, fontSize: 18, fontWeight: '700' }} numberOfLines={2}>{fullName(player)}</Text>
        {royalMembership(world) && <Text style={{ color: c.muted, fontSize: 11 }}>{royalTitle(world, royalMembership(world)!.house, player.id)}</Text>}
        <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>{countryFlags[player.country]} {occupation} · {'Age\u00a0' + ageOn(player, world.date)}</Text>
        {serviceAway(world) && <Text style={{ color: c.muted, fontSize: 11 }}>Away: {serviceAway(world)!.location}</Text>}
        {activeTrip(world) && <Text style={{ color: c.muted, fontSize: 11 }}>Away: {physicalLocation(world).city}</Text>}
      </View>
      <View style={{ maxWidth: '35%', alignItems: 'flex-end' }}><Text adjustsFontSizeToFit minimumFontScale={0.55} numberOfLines={1} style={{ color: c.positiveText, fontSize: 18, fontWeight: '700' }}>{bankBalance}</Text><Text style={{ color: c.muted, fontSize: 10, marginTop: 3 }}>Bank Balance</Text></View>
    </Pressable>
    <View style={{ paddingHorizontal: 16, paddingBottom: 12, gap: 2 }}>
      <StatBar label="Happiness" value={player.stats.happiness} color={c.green} icon={<Ionicons name="heart" size={22} color="#FF665D" />} />
      <StatBar label="Health" value={player.stats.health} color={c.teal} icon={<Ionicons name="bulb" size={22} color="#EAC54E" />} />
      <StatBar label="Smarts" value={player.stats.smarts} color={c.blue} icon={<Ionicons name="book" size={22} color="#419BF8" />} />
      <StatBar label="Looks" value={player.stats.looks} color={c.purple} icon={<Ionicons name="people" size={22} color="#A36BE3" />} />
      <StatBar label="Respect" value={player.stats.respect} color={c.amber} icon={<Ionicons name="star" size={22} color="#F6BE30" />} />
    </View>
  </>;
});

type JournalRow = { entry: World['journal'][number]; age: number; startsYear: boolean };

// Keep FlatList's render props stable while only save status or menus change.
const LifeJournal = React.memo(function LifeJournal({ rows, listRef, followJournal, stopFollowing, firstYearHint }: {
  rows: JournalRow[]; listRef: React.RefObject<FlatList<JournalRow> | null>;
  followJournal: () => void; stopFollowing: () => void; firstYearHint: string | null;
}) {
  const c = useColors();
  return <FlatList ref={listRef} data={rows} keyExtractor={item => item.entry.id} style={{ flex: 1, marginHorizontal: 16, borderRadius: 16, backgroundColor: c.surface }} contentContainerStyle={{ paddingBottom: 16 }} initialNumToRender={12} maxToRenderPerBatch={12} windowSize={7} removeClippedSubviews={false}
      // Keep native row views attached while a frozen tab acquires new facts.
      // Android 24 can crash its RenderThread when clipped rows are reattached.
      // Keep following while virtualised rows acquire their real heights. The
      // first content event can precede layout and cannot settle the position.
      onLayout={followJournal} onContentSizeChange={followJournal}
      onScrollBeginDrag={stopFollowing}
      renderItem={({ item }) => <View onLayout={followJournal} style={{ paddingHorizontal: 16, paddingTop: item.startsYear ? 18 : 7, gap: 7 }}>{item.startsYear && <Text style={{ color: c.blue, fontSize: 19, fontWeight: '700' }}>Age: {item.age}</Text>}<Body muted>{item.entry.text}</Body></View>}
      ListEmptyComponent={<View style={{ padding: 16 }}><Body muted>Your journal is ready for your first year.</Body></View>}
      ListFooterComponent={firstYearHint ? <View style={{ paddingHorizontal: 16, paddingTop: 20 }}><Body muted>{firstYearHint}</Body></View> : null}
    />;
});

export default function Life() {
  const world = useGame(s => s.world)!;
  const c = useColors();
  const dispatch = useGame(s => s.dispatch);
  const busy = useGame(s => s.busy);
  const error = useGame(s => s.error);
  const [advancing, setAdvancing] = useState(false);
  const showYearProgress = useDelayedBusy(busy && advancing);
  const player = world.people[world.activePersonId];
  const entries = useMemo(() => world.journal.filter(entry => entry.personId === player.id), [world.journal, player.id]);
  const journalRows = useMemo(() => {
    const person = { ...player, died: null }; let previousAge: number | undefined;
    return entries.map(entry => {
      const age = ageOn(person, entry.date), startsYear = age !== previousAge; previousAge = age;
      return { entry, age, startsYear };
    });
  }, [entries, player.born]);
  const journal = useRef<FlatList<JournalRow>>(null), shouldScroll = useRef(true), scrollFrame = useRef<number | null>(null), [menu, setMenu] = useState(false);
  const cancelJournalScroll = useCallback(() => {
    if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
    scrollFrame.current = null;
  }, []);
  const followJournal = useCallback(() => {
    if (!shouldScroll.current || scrollFrame.current !== null) return;
    scrollFrame.current = requestAnimationFrame(() => {
      scrollFrame.current = null;
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
  }, [world.id, player.id, entries.length, followJournal, cancelJournalScroll]);
  const firstYearHint = ageOn(player, world.date) === 0 ? world.annual ? 'Your first year is in progress. Continue when you are ready.' : 'Tap Age Up to live your first year.' : null;
  return <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
    <LifeIdentity world={world} />
    {error && <Text accessibilityRole="alert" style={{ color: c.red, paddingHorizontal: 16, marginBottom: 10 }}>{error}</Text>}
    <LifeJournal rows={journalRows} listRef={journal} followJournal={followJournal} stopFollowing={stopFollowing} firstYearHint={firstYearHint} />
    <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={world.annual ? 'Continue This Year' : 'Age Up'} accessibilityState={{ disabled: busy || !!world.pending, busy: busy && advancing }} disabled={busy || !!world.pending} onPress={async () => { setAdvancing(true); try { await dispatch({ type: world.annual ? 'resume' : 'advance' }); } finally { setAdvancing(false); } }} style={({ pressed }) => ({ flex: 1, minHeight: 62, borderRadius: 15, flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? c.actionGreenPressed : c.actionGreen, opacity: busy || world.pending ? 0.5 : 1 })}>
        {showYearProgress ? <ActivityIndicator color="#FFFFFF" accessibilityLabel="Saving your year" /> : <Ionicons name="add-circle" size={32} color="#FFFFFF" />}<Text style={{ color: '#FFFFFF', fontSize: world.annual ? 19 : 25, fontWeight: '700' }}>{world.annual ? 'Continue This Year' : 'Age Up'}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="More Life Options" onPress={() => setMenu(true)} style={{ minWidth: 54, minHeight: 62, borderRadius: 15, backgroundColor: '#8795A4', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="ellipsis-horizontal" size={27} color="#FFFFFF" /></Pressable>
    </View>
    <EventModal event={menu ? { id: 'life-menu', kind: 'selection', title: 'Your Life', body: 'Where would you like to go?', choices: [{ id: 'profile', label: 'My Life' }, { id: 'extras', label: 'Extras' }, { id: 'saves', label: 'Saved Lives' }, { id: 'time', label: 'Time Machine' }, { id: 'settings', label: 'Settings' }], confirmLabel: 'Open' } : null} onCancel={() => setMenu(false)} onChoose={id => { setMenu(false); router.push(id === 'profile' ? '/profile' : id === 'extras' ? '/extras' : id === 'saves' ? '/saved-lives' : id === 'settings' ? '/settings' : '/time-machine'); }} />
  </SafeAreaView>;
}
