import React, { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { countries } from '../../src/game/countries';
import { destinations } from '../../src/game/content/travel';
import { activeTrip } from '../../src/game/systems/travelSchemas';
import { formatMoney } from '../../src/game/money';
import { TravelArt } from '../../src/assets/TravelArt';
import { ActionRow, Body, Button, Card, Header, Heading, Page } from '../../src/ui/components';
import { useColors } from '../../src/ui/theme';

export default function Travel() {
  const world = useGame(s => s.world)!, current = activeTrip(world), [page, setPage] = useState(0), trips = world.trips.filter(item => item.participantIds.includes(world.activePersonId));
  const person = world.people[world.activePersonId], colors = useColors(), { width, fontScale } = useWindowDimensions(), stacked = width < 360 || fontScale >= 1.2;
  return <Page><Header title="Travel" onBack={() => router.back()} />
    <Card><View style={{ flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'stretch' : 'center', gap: 16 }}><TravelArt id="passport" width={88} /><View style={{ flex: stacked ? undefined : 1, minWidth: 0, gap: 6 }}><Heading>Explore the World</Heading><Body>Find somewhere new for a holiday or take a longer break.</Body></View></View><View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.inset, gap: 4 }}><Body muted>Home</Body><Body>{person.city}, {countries[person.country].name}</Body></View></Card>
    {current && <Card style={{ borderWidth: 1, borderColor: colors.blue }}><Heading size={20}>Your Current Trip</Heading><ActionRow title={destinations[current.destinationId].city} subtitle={current.periods.length + ' of ' + current.duration + ' months away'} icon={<TravelArt id={current.destinationId} />} onPress={() => router.push({ pathname: '/destination/[id]', params: { id: current.destinationId, tripId: current.id } })} /><Body muted>Expected return: {current.expectedReturn.month}/{current.expectedReturn.year} · {current.participantIds.length === 1 ? 'Travelling alone' : current.participantIds.length + ' people travelling'}</Body></Card>}
    <Card><Heading size={20}>Take a Break</Heading><ActionRow title="Vacation" subtitle="Get away for a month" icon={<TravelArt id="holiday" />} onPress={() => router.push({ pathname: '/destinations', params: { duration: '1' } })} /><ActionRow title="Gap Year" subtitle="Take twelve months abroad" icon={<TravelArt id="flight" />} onPress={() => router.push({ pathname: '/destinations', params: { duration: '12' } })} /></Card>
    <Card><Heading size={20}>Build a Life Abroad</Heading><Body muted>Find a job, a course or a fresh start.</Body><ActionRow title="Emigration" subtitle="Move to a new country" icon={<TravelArt id="passport" />} onPress={() => router.push('/emigrate')} /><ActionRow title="Work Abroad" subtitle="Apply for a qualified job in another country" icon={<TravelArt id="abroad" />} onPress={() => router.push({ pathname: '/emigrate', params: { route: 'work' } })} /><ActionRow title="Study Abroad" subtitle="Course admission and funded tuition overseas" icon={<TravelArt id="abroad" />} onPress={() => router.push({ pathname: '/emigrate', params: { route: 'study' } })} /></Card>
    <Card><Heading size={20}>Your Travel History</Heading>{trips.length ? <><Body muted>{trips.length} {trips.length === 1 ? 'trip' : 'trips'}. Open a trip to look back.</Body>{[...trips].reverse().slice(page * 12, (page + 1) * 12).map(trip => <ActionRow key={trip.id} title={destinations[trip.destinationId].city + ', ' + countries[destinations[trip.destinationId].country].name} subtitle={trip.started.year + ' · ' + trip.status + ' · ' + trip.periods.length + ' months · ' + formatMoney({ minor: trip.paid - trip.refund, currency: trip.quote.currency })} icon={<TravelArt id={trip.destinationId} />} onPress={() => router.push({ pathname: '/destination/[id]', params: { id: trip.destinationId, tripId: trip.id } })} />)}<Button label="Newer Trips" tone="secondary" disabled={!page} onPress={() => setPage(page - 1)} /><Button label="Earlier Trips" tone="secondary" disabled={(page + 1) * 12 >= trips.length} onPress={() => setPage(page + 1)} /></> : <><TravelArt id="holiday" width={88} /><Body>No trips yet. Your suitcase is getting bored.</Body></>}</Card>
  </Page>;
}
