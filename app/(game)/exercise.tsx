import React, { useState } from 'react';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { ageOn } from '../../src/game/model';
import { countries } from '../../src/game/countries';
import { hospitalized, medicalQuote } from '../../src/game/systems/health';
import { rules } from '../../src/game/rules';
import { formatMoney } from '../../src/game/money';
import { ActionRow, Body, Card, Header, Page, StatBar } from '../../src/ui/components';
import { EventModal } from '../../src/ui/EventModal';
import { HealthLegalArt } from '../../src/assets/HealthLegalArt';
import { useColors } from '../../src/ui/theme';
const activities = [{ id: 'walk', title: 'Go for a Walk', age: 6, divisor: 0n }, { id: 'run', title: 'Go for a Run', age: 10, divisor: 0n }, { id: 'gym', title: 'Go to the Gym', age: 16, divisor: 2000n }, { id: 'sport', title: 'Play a Sport', age: 6, divisor: 4000n }, { id: 'class', title: 'Take a Class', age: 6, divisor: 1000n }, { id: 'trainer', title: 'Hire a Personal Trainer', age: 18, divisor: 200n }] as const;
export default function Exercise() {
  const world = useGame(s => s.world)!, dispatch = useGame(s => s.dispatch), busy = useGame(s => s.busy), error = useGame(s => s.error), c = useColors();
  const person = world.people[world.activePersonId], [selected, setSelected] = useState<typeof activities[number] | null>(null), currency = countries[person.country].currency;
  const cost = selected?.divisor ? rules[person.country].baseWage / selected.divisor : 0n, energy = selected?.id === 'walk' ? 5 : selected?.id === 'trainer' ? 18 : 12;
  return <Page><Header title="Exercise" onBack={() => router.back()} /><Card><HealthLegalArt id="exercise" size={72} /><StatBar label="Fitness" value={person.stats.fitness} color={c.green} /><StatBar label="Energy" value={person.stats.energy} color={c.blue} /><Body muted>One focused session each year. A saved exercise routine handles regular activity between sessions.</Body></Card>{error && <Body>{error}</Body>}
    <Card>{activities.map(activity => <ActionRow key={activity.id} title={activity.title} subtitle={activity.divisor ? formatMoney({ minor: rules[person.country].baseWage / activity.divisor, currency }) : 'No fee'} disabledReason={busy ? 'Saving' : ageOn(person, world.date) < activity.age ? 'Available from age ' + activity.age : hospitalized(world, person) || person.stats.health < 20 ? 'Unavailable at your current health' : world.actionCounts[person.id + ':health:' + world.date.year + ':exercise'] ? 'Your focused session is complete this year' : undefined} icon={<HealthLegalArt id="exercise" size={36} />} onPress={() => setSelected(activity)} />)}</Card>
    <EventModal event={selected ? { id: 'exercise:' + selected.id, kind: 'confirmation', title: selected.title + '?', body: 'The session uses real energy and any stated fee. Fitness gains are bounded; strenuous activity carries a small injury risk.' + (medicalQuote(world, cost).payer.id === person.id ? '' : ' Your caregiver covers the fee.'), terms: [{ id: 'fee', label: 'Fee', value: formatMoney({ minor: cost, currency }), tone: 'neutral' }, { id: 'energy', label: 'Energy', value: '−' + energy + '%', tone: 'negative' }], confirmLabel: 'Begin Session' } : null} busy={busy} onCancel={() => setSelected(null)} onChoose={() => { if (selected) { const activity = selected.id; setSelected(null); void dispatch({ type: 'exercise', activity }); } }} />
  </Page>;
}
