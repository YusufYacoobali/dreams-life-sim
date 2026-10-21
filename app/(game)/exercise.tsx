import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { ageOn } from '../../src/game/model';
import { countries } from '../../src/game/countries';
import { hospitalized, medicalQuote } from '../../src/game/systems/health';
import { rules } from '../../src/game/rules';
import { availableCash } from '../../src/game/systems/common';
import { custodyReason } from '../../src/game/systems/legal';
import { activeTrip } from '../../src/game/systems/travelSchemas';
import { serviceAway } from '../../src/game/systems/serviceSchemas';
import { formatMoney } from '../../src/game/money';
import { ActionRow, Body, Card, Header, Heading, Page, StatBar } from '../../src/ui/components';
import { HealthReviewError, useHealthReview } from '../../src/ui/HealthReview';
import { HealthLegalArt } from '../../src/assets/HealthLegalArt';
import { useColors } from '../../src/ui/theme';
const activities = [{ id: 'walk', title: 'Go for a Walk', age: 6, divisor: 0n }, { id: 'run', title: 'Go for a Run', age: 10, divisor: 0n }, { id: 'gym', title: 'Go to the Gym', age: 16, divisor: 2000n }, { id: 'sport', title: 'Play a Sport', age: 6, divisor: 4000n }, { id: 'class', title: 'Take a Class', age: 6, divisor: 1000n }, { id: 'trainer', title: 'Hire a Personal Trainer', age: 18, divisor: 200n }] as const;
export default function Exercise() {
  const world = useGame(s => s.world)!, busy = useGame(s => s.busy), error = useGame(s => s.error), c = useColors(), review = useHealthReview('exercise');
  const person = world.people[world.activePersonId], currency = countries[person.country].currency;
  const locationReason = serviceAway(world) ? 'Return from your assignment before this in-person activity' : activeTrip(world) ? 'Return from your trip before this activity at home' : custodyReason(world, 'exercise');
  const sessionEnergy = (activity: typeof activities[number]) => activity.id === 'walk' ? 5 : activity.id === 'trainer' ? 18 : 12;
  const sessionFee = (activity: typeof activities[number]) => activity.divisor ? rules[person.country].baseWage / activity.divisor : 0n;
  const sessionReason = (activity: typeof activities[number]) => {
    if (ageOn(person, world.date) < activity.age) return 'Available from age ' + activity.age;
    if (locationReason) return locationReason;
    if (hospitalized(world, person) || person.stats.health < 20) return 'Unavailable at your current health';
    if (world.actionCounts[person.id + ':health:' + world.date.year + ':exercise']) return 'Your focused session is complete this year';
    if (person.stats.energy < sessionEnergy(activity)) return 'You need more energy for this session';
    const quote = medicalQuote(world, sessionFee(activity)), account = world.accounts.find(item => item.ownerId === quote.payer.id && item.currency === quote.currency);
    if (quote.amount > (account ? availableCash(account) : 0n)) return quote.payer.id === person.id ? 'Your available balance cannot cover this session' : 'Your caregiver’s available balance cannot cover this session';
    return undefined;
  };
  const confirm = (activity: typeof activities[number]) => {
    const cost = sessionFee(activity), energy = sessionEnergy(activity);
    review.confirm({ type: 'exercise', activity: activity.id }, activity.title + '?', 'The session uses real energy and any stated fee. Fitness gains are bounded; strenuous activity carries a small injury risk.' + (medicalQuote(world, cost).payer.id === person.id ? '' : ' Your caregiver covers the fee.'), [{ id: 'fee', label: 'Fee', value: formatMoney({ minor: cost, currency }), tone: 'neutral' }, { id: 'energy', label: 'Energy', value: '−' + energy + '%', tone: 'negative' }], 'exercise', 'Begin Session');
  };
  return <Page><Header title="Exercise" onBack={() => router.back()} /><Card><View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}><HealthLegalArt id="exercise" size={72} /><View style={{ flexGrow: 1, flexBasis: 170, minWidth: 0, gap: 5 }}><Heading size={22}>Make time to move</Heading><Body muted>Your recorded fitness and energy help you choose a session you can complete.</Body></View></View><StatBar label="Fitness" value={person.stats.fitness} color={c.green} /><StatBar label="Energy" value={person.stats.energy} color={c.blue} /><Body muted>One focused session each year. A saved exercise routine handles regular activity between sessions.</Body></Card>{!review.isOpen && <HealthReviewError error={error} />}
    <Card><Heading size={20}>Choose a focused session</Heading><Body muted>Fees and energy use are shown before review. The completed-session limit is shared across all activities.</Body>{activities.map(activity => <ActionRow key={activity.id} title={activity.title} subtitle={'Energy −' + sessionEnergy(activity) + '%'} value={sessionFee(activity) ? formatMoney({ minor: sessionFee(activity), currency }) : 'No fee'} disabled={busy} disabledReason={sessionReason(activity)} icon={<HealthLegalArt id="exercise" size={36} />} onPress={() => confirm(activity)} />)}</Card>
    <Card><Heading size={18}>Regular activity</Heading><Body muted>Your saved routine covers activity as ordinary months pass. A focused session is a separate action.</Body><ActionRow title="Exercise Routine" subtitle="Review regular activity in Mind & Body" onPress={() => router.push('/lifestyle')} /></Card>
    {review.modal}
  </Page>;
}
