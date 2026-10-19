import { activeTrip, physicalLocation } from '../../../src/game/systems/travelSchemas';
import { publicRoyalDuty,royalMembership } from '../../../src/game/systems/royaltySchemas';
import { royalTitle } from '../../../src/game/systems/royaltyMath';
import { serviceCareer,serviceQualified,serviceAway } from '../../../src/game/systems/serviceSchemas';
import { serviceCatalog } from '../../../src/game/content/services';
import { fullTimeCreator } from '../../../src/game/systems/creatorSchemas';
import { creatorCatalog } from '../../../src/game/content/creators';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { EventModal } from '../../../src/ui/EventModal';
import { countryFlags } from '../../../src/ui/CreationElements';
import { router } from 'expo-router';
import { useGame } from '../../../src/state/useGame';
import { ageOn, fullName } from '../../../src/game/model';
import { countries } from '../../../src/game/countries';
import { formatMoney } from '../../../src/game/money';
import { Body, Portrait, StatBar } from '../../../src/ui/components';
import { useColors } from '../../../src/ui/theme';
import { jobs } from '../../../src/game/content/jobs';
import { accountFor } from '../../../src/game/systems/common';
import { activeSentence, isConfined } from '../../../src/game/systems/legalSchemas';

export default function Life() {
  const world = useGame(s => s.world)!;
  const c = useColors();
  const dispatch = useGame(s => s.dispatch);
  const busy = useGame(s => s.busy);
  const error = useGame(s => s.error);
  const player = world.people[world.activePersonId];
  const account = accountFor(world);
  const occupation = activeSentence(world) ? 'Prisoner' : isConfined(world) ? 'Held on remand' : player.legal.wanted ? 'Fugitive' : world.businesses.some(item => item.ownerId === player.id && item.status === 'active') && ageOn(player, world.date) >= 18 ? 'Business Owner' : world.musicReleases.some(item=>item.personId===player.id&&['recording','paused'].includes(item.status)) ? 'Musician' : world.elections.some(item=>item.status==='campaign'&&item.candidates.some(candidate=>candidate.personId===player.id&&candidate.status==='active')) ? 'Political Candidate' : publicRoyalDuty(world) ? royalTitle(world,publicRoyalDuty(world)!.house,player.id) : serviceCareer(world) ? serviceCatalog[serviceCareer(world)!.kind].title+(serviceQualified(serviceCareer(world)!)?'':' Trainee') : fullTimeCreator(world) ? creatorCatalog[fullTimeCreator(world)!.kind].title : player.employment ? jobs.find(role => role.id === player.employment!.roleId)?.title : player.education.stage !== 'none' ? 'Student' : ageOn(player, world.date) === 0 ? 'Newborn' : ageOn(player, world.date) < 18 ? 'Child' : player.finance.pensionAnnual > 0n ? 'Retired' : 'Unemployed';
  const entries = useMemo(() => world.journal.filter(entry => entry.personId === player.id), [world.journal, player.id]);
  const years = useMemo(() => {
    const groups = new Map<number, typeof entries>();
    for (const entry of entries) { const age = ageOn({ ...player, died: null }, entry.date); const facts = groups.get(age) ?? []; facts.push(entry); groups.set(age, facts); }
    return [...groups.entries()].map(([age, facts]) => ({ age, facts }));
  }, [entries, player.born]);
  const journal = useRef<FlatList<typeof years[number]>>(null), shouldScroll = useRef(true), [menu, setMenu] = useState(false);
  useEffect(() => { shouldScroll.current = true; }, [entries.length]);
  return <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
    <Pressable accessibilityRole="button" accessibilityLabel="My Life profile" onPress={() => router.push('/profile')} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13 }}>
      <Portrait name={fullName(player)} appearance={player.appearance} age={ageOn(player, world.date)} size={52} />
      <View style={{ flex: 1 }}><Text style={{ color: c.ink, fontSize: 18, fontWeight: '700' }} numberOfLines={2}>{fullName(player)}</Text>
        {royalMembership(world) && <Text style={{ color: c.muted, fontSize: 11 }}>{royalTitle(world, royalMembership(world)!.house, player.id)}</Text>}
        <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>{countryFlags[player.country]} {occupation} · Age {ageOn(player, world.date)}</Text>
        {serviceAway(world) && <Text style={{ color: c.muted, fontSize: 11 }}>Away: {serviceAway(world)!.location}</Text>}
        {activeTrip(world) && <Text style={{ color: c.muted, fontSize: 11 }}>Away: {physicalLocation(world).city}</Text>}
      </View>
      <View style={{ maxWidth: '35%', alignItems: 'flex-end' }}><Text adjustsFontSizeToFit minimumFontScale={0.55} numberOfLines={1} style={{ color: c.green, fontSize: 18, fontWeight: '700' }}>{formatMoney({ minor: account.cash, currency: account.currency }, countries[player.country].locale)}</Text><Text style={{ color: c.muted, fontSize: 10, marginTop: 3 }}>Bank Balance</Text></View>
    </Pressable>
    <View style={{ paddingHorizontal: 16, paddingBottom: 12, gap: 2 }}>
      <StatBar label="Happiness" value={player.stats.happiness} color={c.green} icon={<Ionicons name="heart" size={22} color="#FF665D" />} />
      <StatBar label="Health" value={player.stats.health} color={c.teal} icon={<Ionicons name="bulb" size={22} color="#EAC54E" />} />
      <StatBar label="Smarts" value={player.stats.smarts} color={c.blue} icon={<Ionicons name="book" size={22} color="#419BF8" />} />
      <StatBar label="Looks" value={player.stats.looks} color={c.purple} icon={<Ionicons name="people" size={22} color="#A36BE3" />} />
      <StatBar label="Respect" value={player.stats.respect} color={c.amber} icon={<Ionicons name="star" size={22} color="#F6BE30" />} />
    </View>
    {error && <Text accessibilityRole="alert" style={{ color: c.red, paddingHorizontal: 16, marginBottom: 10 }}>{error}</Text>}
    <FlatList ref={journal} data={years} keyExtractor={item => String(item.age)} style={{ flex: 1, marginHorizontal: 16, borderRadius: 16, backgroundColor: c.surface }} contentContainerStyle={{ paddingBottom: 16 }} initialNumToRender={8}
      onContentSizeChange={() => { if (shouldScroll.current) { journal.current?.scrollToEnd({ animated: false }); shouldScroll.current = false; } }}
      renderItem={({ item }) => <View style={{ paddingHorizontal: 16, paddingTop: 18, gap: 7 }}><Text style={{ color: c.blue, fontSize: 19, fontWeight: '700' }}>Age: {item.age}</Text>{item.facts.map(entry => <Body key={entry.id} muted>{entry.text}</Body>)}</View>}
      ListEmptyComponent={<View style={{ padding: 16 }}><Body muted>Your journal is ready for your first year.</Body></View>}
      ListFooterComponent={ageOn(player, world.date) === 0 ? <View style={{ paddingHorizontal: 16, paddingTop: 20 }}><Body muted>{world.annual ? 'Your first year is in progress. Continue when you are ready.' : 'Tap Age Up to live your first year.'}</Body></View> : null}
    />
    <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={world.annual ? 'Continue This Year' : 'Age Up'} accessibilityState={{ disabled: busy || !!world.pending, busy }} disabled={busy || !!world.pending} onPress={() => { void dispatch({ type: world.annual ? 'resume' : 'advance' }); }} style={({ pressed }) => ({ flex: 1, minHeight: 62, borderRadius: 15, flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: c.green, opacity: busy || world.pending ? 0.5 : pressed ? 0.8 : 1 })}>
        {busy ? <ActivityIndicator color="#FFFFFF" accessibilityLabel="Saving your year" /> : <Ionicons name="add-circle" size={32} color="#FFFFFF" />}<Text style={{ color: '#FFFFFF', fontSize: world.annual ? 19 : 25, fontWeight: '700' }}>{world.annual ? 'Continue This Year' : 'Age Up'}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="More Life Options" onPress={() => setMenu(true)} style={{ minWidth: 54, minHeight: 62, borderRadius: 15, backgroundColor: '#8795A4', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="ellipsis-horizontal" size={27} color="#FFFFFF" /></Pressable>
    </View>
    <EventModal event={menu ? { id: 'life-menu', kind: 'selection', title: 'Your Life', body: 'Where would you like to go?', choices: [{ id: 'profile', label: 'My Life' }, { id: 'saves', label: 'Saved Lives' }, { id: 'time', label: 'Time Machine' }], confirmLabel: 'Open' } : null} onCancel={() => setMenu(false)} onChoose={id => { setMenu(false); router.push(id === 'profile' ? '/profile' : id === 'saves' ? '/saved-lives' : '/time-machine'); }} />
  </SafeAreaView>;
}
