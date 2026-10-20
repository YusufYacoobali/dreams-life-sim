import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { countries } from '../../src/game/countries';
import { destinationIds, destinations } from '../../src/game/content/travel';
import { tripQuote } from '../../src/game/systems/travel';
import { formatMoney } from '../../src/game/money';
import { TravelArt } from '../../src/assets/TravelArt';
import { ActionRow, Body, Card, Header, Page } from '../../src/ui/components';
import { useColors } from '../../src/ui/theme';
export default function Destinations() {
  const world = useGame(s => s.world)!, params = useLocalSearchParams<{ duration?: string }>(), duration = params.duration === '12' ? 12 : 1, [filter, setFilter] = useState('Popular'), c = useColors();
  return <Page><Header title={duration === 12 ? 'Gap Year' : 'Vacation'} onBack={() => router.back()} /><View style={{ flexDirection: 'row', gap: 6 }}>{['Popular', 'All', 'Beach', 'City'].map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: item === filter }} onPress={() => setFilter(item)} style={{ flex: 1, backgroundColor: filter === item ? c.actionBlue : c.inset, paddingVertical: 10, borderRadius: 10 }}><Text style={{ color: filter === item ? '#fff' : c.ink, textAlign: 'center', fontWeight: '600', fontSize: 14 }}>{item}</Text></Pressable>)}</View><Body muted>From prices are for one adult, including transport and accommodation. Your party and duration determine the final quote.</Body><Card>{destinationIds.filter(id => filter === 'All' || filter === 'Popular' && destinations[id].popular || filter === 'Beach' && destinations[id].setting === 'beach' || filter === 'City' && destinations[id].setting === 'city').map(id => { const destination = destinations[id], quote = tripQuote(world, id, duration); return <ActionRow key={id} title={destination.city + ', ' + countries[destination.country].name} subtitle={destination.setting === 'beach' ? 'Coast · Relaxation' : 'Culture · Sightseeing'} value={formatMoney({ minor: quote.total, currency: quote.currency })} icon={<TravelArt id={id} />} onPress={() => router.push({ pathname: '/destination/[id]', params: { id, duration: String(duration) } })} />; })}</Card></Page>;
}
