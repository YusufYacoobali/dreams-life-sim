import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { countries } from '../../src/game/countries';
import { destinationIds, destinations } from '../../src/game/content/travel';
import { tripQuote } from '../../src/game/systems/travel';
import { formatMoney } from '../../src/game/money';
import { TravelArt } from '../../src/assets/TravelArt';
import { ActionRow, Body, Card, Header, Heading, Page } from '../../src/ui/components';
import { FilterTabs } from '../../src/ui/FilterTabs';

const filters = ['Popular', 'All', 'Beach', 'City'].map(id => ({ id, label: id }));
export default function Destinations() {
  const world = useGame(s => s.world)!, params = useLocalSearchParams<{ duration?: string }>(), duration = params.duration === '12' ? 12 : 1, [filter, setFilter] = useState('Popular');
  return <Page><Header title={duration === 12 ? 'Gap Year' : 'Vacation'} onBack={() => router.back()} />
    <FilterTabs values={filters} selected={filter} onSelect={setFilter} />
    <Card><Heading size={18}>{duration}-month packages</Heading><Body muted>Totals are for you travelling alone, including transport, accommodation and any currency conversion fee. You can add companions when planning your stay.</Body></Card>
    <Card>{destinationIds.filter(id => filter === 'All' || filter === 'Popular' && destinations[id].popular || filter === 'Beach' && destinations[id].setting === 'beach' || filter === 'City' && destinations[id].setting === 'city').map(id => { const destination = destinations[id], quote = tripQuote(world, id, duration); return <ActionRow key={id} title={destination.city + ', ' + countries[destination.country].name} subtitle={destination.setting === 'beach' ? 'Coast · Relaxation' : 'Culture · Sightseeing'} value={formatMoney({ minor: quote.total, currency: quote.currency })} icon={<TravelArt id={id} />} onPress={() => router.push({ pathname: '/destination/[id]', params: { id, duration: String(duration) } })} />; })}</Card></Page>;
}
