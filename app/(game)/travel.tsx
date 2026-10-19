import React, { useState } from 'react';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { countries } from '../../src/game/countries';
import { destinations } from '../../src/game/content/travel';
import { activeTrip } from '../../src/game/systems/travelSchemas';
import { formatMoney } from '../../src/game/money';
import { TravelArt } from '../../src/assets/TravelArt';
import { ActionRow, Body, Button, Card, Header, Heading, Page } from '../../src/ui/components';

export default function Travel() {
  const world = useGame(s => s.world)!, current = activeTrip(world), [page, setPage] = useState(0), trips = world.trips.filter(item => item.participantIds.includes(world.activePersonId));
  return <Page><Header title="Travel" onBack={() => router.back()} /><Card><TravelArt id="passport" width={110} /><Heading>Explore the World</Heading><Body>Find somewhere new for a holiday or take a longer break.</Body></Card>
    {current && <Card><Heading size={20}>Your Current Trip</Heading><ActionRow title={destinations[current.destinationId].city} subtitle={current.periods.length + ' of ' + current.duration + ' months away'} icon={<TravelArt id={current.destinationId} />} onPress={() => router.push({ pathname: '/destination/[id]', params: { id: current.destinationId, tripId: current.id } })} /></Card>}
    <Card><ActionRow title="Vacation" subtitle="A month away, with a complete package quote" icon={<TravelArt id="holiday" />} onPress={() => router.push({ pathname: '/destinations', params: { duration: '1' } })} /><ActionRow title="Gap Year" subtitle="Twelve months abroad after leaving work and study" icon={<TravelArt id="flight" />} onPress={() => router.push({ pathname: '/destinations', params: { duration: '12' } })} /></Card>
    <Card><ActionRow title="Emigration" subtitle="Review an actual permanent household move" icon={<TravelArt id="passport" />} onPress={() => router.push('/emigrate')} /><ActionRow title="Work Abroad" subtitle="Apply for a qualified job in another country" icon={<TravelArt id="abroad" />} onPress={() => router.push({ pathname: '/emigrate', params: { route: 'work' } })} /><ActionRow title="Study Abroad" subtitle="Course admission and funded tuition overseas" icon={<TravelArt id="abroad" />} onPress={() => router.push({ pathname: '/emigrate', params: { route: 'study' } })} /></Card>
    {!!trips.length && <Card><Heading size={20}>Your Travel History</Heading>{[...trips].reverse().slice(page * 12, (page + 1) * 12).map(trip => <ActionRow key={trip.id} title={destinations[trip.destinationId].city + ', ' + countries[destinations[trip.destinationId].country].name} subtitle={trip.started.year + ' · ' + trip.status + ' · ' + trip.periods.length + ' months · ' + formatMoney({ minor: trip.paid - trip.refund, currency: trip.quote.currency })} icon={<TravelArt id={trip.destinationId} />} onPress={() => router.push({ pathname: '/destination/[id]', params: { id: trip.destinationId, tripId: trip.id } })} />)}<Button label="Newer Trips" tone="secondary" disabled={!page} onPress={() => setPage(page - 1)} /><Button label="Earlier Trips" tone="secondary" disabled={(page + 1) * 12 >= trips.length} onPress={() => setPage(page + 1)} /></Card>}
  </Page>;
}
