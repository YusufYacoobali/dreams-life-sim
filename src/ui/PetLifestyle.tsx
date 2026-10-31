import { LifestylePetArt } from '../assets/LifestylePetArt';
import React, { useState } from 'react';
import type { Pet } from '../game/systems/petSchemas';
import { householdPets } from '../game/systems/petSchemas';
import { useGame } from '../state/useGame';
import { petActivities, petActivityCost, petActivityReason } from '../game/systems/petTraining';
import { countries } from '../game/countries';
import { formatMoney } from '../game/money';
import { localContactReason, lifestyleReason } from '../game/systems/lifestyleCommon';
import { ActionRow, Body, Card, Heading, StatBar } from './components';
import { LifestyleEnable } from './PropertyLifestyle';
import { useLifestyleReview } from './LifestyleReview';
import { useColors } from './theme';
const labels = { train: 'Train Together', trick: 'Teach a Trick', groom: 'Groom / Habitat Care', outing: 'Take an Outing', quiet: 'Spend Quiet Time', introduce: 'Introduce to Another Pet', competition: 'Small Pet Event', treat: 'Treat Additional Condition', prevent: 'Preventive Veterinary Care', family: 'Spend Time with Family' };
export function PetLifestyle({ pet }: {
    pet: Pet;
}) {
    const world = useGame(s => s.world)!, { ask, modal, busy } = useLifestyleReview(), c = useColors(), [expanded, setExpanded] = useState(false), [pick, setPick] = useState<'family' | 'introduce' | null>(null);
    if (!world.lifestyle)
        return <LifestyleEnable />;
    if (pet.status !== 'active')
        return null;
    if (!pet.companion)
        return <Card><ActionRow title="Review Expanded Pet Activities" disabled={busy} disabledReason={lifestyleReason(world, false)} onPress={() => ask({ type: 'enable-pet-training', petId: pet.id }, 'More time with ' + pet.name + '?', 'Keep original care, age, lifespan and bonds. Add a consistent personality, optional training and species-appropriate activities. No extra mandatory care charge is introduced.')}/>{modal}</Card>;
    const life = pet.companion, money = (minor: bigint) => formatMoney({ minor, currency: countries[pet.country].currency }), action = (activity: typeof petActivities[number], otherId: string | null = null) => ask({ type: 'pet-activity', petId: pet.id, activity, otherId, quotedFee: petActivityCost(world, pet, activity), reviewedOwnerId: pet.ownerId }, labels[activity], activity === 'family' ? 'Ask this household member to join you. Only actual participation builds their own bond with ' + pet.name + '.' : activity === 'treat' ? 'Treatment costs ' + money(petActivityCost(world, pet, activity)) + ' and may fail. Successful treatment takes three funded care months. Ageing cannot be cured.' : activity === 'prevent' ? 'Pay ' + money(petActivityCost(world, pet, activity)) + ' for twelve months of protection against additional minor conditions.' : activity === 'competition' ? 'Enter a small companion event for ' + money(petActivityCost(world, pet, activity)) + '. Training and bond affect recognition. No cash prize is awarded.' : 'Optional time together uses four energy, with at most one of this activity per pet each month. Routine feeding and basic care remain automatic.');
    return <Card><Heading size={18}>Their Own Character</Heading><Body>{life.trait} · {life.condition === 'well' ? 'Comfortable' : life.condition === 'minor-injury' ? 'Minor injury' : life.condition === 'ageing' ? 'Age-related discomfort' : life.condition === 'recovering' ? 'Recovering · ' + life.recovery + ' funded months' : 'Anxious'}</Body><StatBar label="Training" value={life.training} color={c.green}/><Body muted>Learned cues: {life.tricks.join(', ') || 'None yet'}. Basic monthly care continues automatically.</Body><ActionRow title="Training, Care & Company" onPress={() => setExpanded(!expanded)}/>{expanded && petActivities.map(activity => <ActionRow key={activity} title={labels[activity]} icon={activity === 'competition' ? <LifestylePetArt id="rosette" size={40}/> : undefined} value={petActivityCost(world, pet, activity) ? money(petActivityCost(world, pet, activity)) : 'No fee'} disabled={busy} disabledReason={activity === 'family' || activity === 'introduce' ? lifestyleReason(world, false) : petActivityReason(world, pet, activity)} onPress={() => activity === 'family' || activity === 'introduce' ? setPick(activity) : action(activity)}/>)}
  {expanded && pick === 'introduce' && householdPets(world).filter(other => other.id !== pet.id && other.species === pet.species).map(other => <ActionRow key={other.id} title={'Introduce to ' + other.name} disabled={busy} disabledReason={petActivityReason(world, pet, 'introduce', other.id)} onPress={() => action('introduce', other.id)}/>)}{expanded && pick === 'family' && Object.values(world.people).filter(person => person.householdId && person.householdId === world.people[world.activePersonId].householdId && !localContactReason(world, person.id, true)).slice(0, 10).map(person => <ActionRow key={person.id} title={person.firstName + ' · Bond ' + (pet.bonds[person.id] ?? 0) + '%'} disabled={busy} disabledReason={petActivityReason(world, pet, 'family', person.id)} onPress={() => action('family', person.id)}/>)}
  {world.lifestyle.records.filter(row => row.subjectId === pet.id && row.kind.startsWith('pet-')).slice(-3).reverse().map(row => <Body muted key={row.id}>{row.date.year} · {row.body}</Body>)}{modal}</Card>;
}
