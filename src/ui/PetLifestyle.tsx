import React, { useState } from 'react';
import { LifestylePetArt } from '../assets/LifestylePetArt';
import { PetsLeisureArt } from '../assets/PetsLeisureArt';
import { CompanionArt } from '../assets/CompanionArt';
import type { Pet } from '../game/systems/petSchemas';
import { householdPets } from '../game/systems/petSchemas';
import { petActivities, petActivityCost, petActivityReason } from '../game/systems/petTraining';
import { countries } from '../game/countries';
import { formatMoney } from '../game/money';
import { localContactReason, lifestyleReason } from '../game/systems/lifestyleCommon';
import { ActionRow, Body, Card, Heading, StatBar } from './components';
import { useLifestyleReview } from './LifestyleReview';
import { useLifestyleWorld } from './useLifestyleWorld';
import { PersonPicker } from './PersonPicker';
import { EventModal } from './EventModal';
import { useColors } from './theme';

type Activity = typeof petActivities[number];
const labels: Record<Activity, string> = { train: 'Train Together', trick: 'Teach a Trick', groom: 'Groom / Habitat Care', outing: 'Take an Outing', quiet: 'Spend Quiet Time', introduce: 'Introduce to Another Pet', competition: 'Small Pet Event', treat: 'Treat Additional Condition', prevent: 'Preventive Veterinary Care', family: 'Spend Time with Family' };
const groups = { training: ['train', 'trick', 'competition'], care: ['groom', 'treat', 'prevent'], company: ['outing', 'quiet', 'introduce', 'family'] } as const;
const groupLabels = { training: 'Training & Events', care: 'Health & Care', company: 'Company & Outings' };
function ActivityArt({ activity, pet, size = 40 }: { activity: Activity; pet: Pet; size?: number }) {
  return activity === 'competition' ? <LifestylePetArt id="rosette" size={size} /> : activity === 'treat' || activity === 'prevent' ? <PetsLeisureArt id="vet" size={size} /> : activity === 'family' || activity === 'introduce' ? <CompanionArt species={pet.species} size={size} /> : <PetsLeisureArt id="paw" size={size} />;
}
export function PetLifestyle({ pet: savedPet }: { pet: Pet }) {
  const world = useLifestyleWorld()!, { ask, modal, busy } = useLifestyleReview('companion:' + savedPet.id), c = useColors();
  const [group, setGroup] = useState<keyof typeof groups | null>(null), [pick, setPick] = useState<'family' | 'introduce' | null>(null);
  const pet = world.pets.find(row => row.id === savedPet.id) ?? savedPet;
  if (!world.lifestyle || pet.status !== 'active' || !pet.companion) return null;
  const life = pet.companion, money = (minor: bigint) => formatMoney({ minor, currency: countries[pet.country].currency });
  const action = (activity: Activity, otherId: string | null = null) => {
    if (petActivityReason(world, pet, activity, otherId)) return;
    const fee = petActivityCost(world, pet, activity);
    ask({ type: 'pet-activity', petId: pet.id, activity, otherId, quotedFee: fee, reviewedOwnerId: pet.ownerId }, labels[activity], activity === 'family' ? 'Invite someone from your household to join you and ' + pet.name + '.' : activity === 'treat' ? life.condition === 'ageing' ? 'Provide a twelve-month comfort plan. Age-related discomfort may return.' : 'Treatment may fail. Recovery needs three funded care months.' : activity === 'prevent' ? 'Protect against additional minor conditions for twelve months.' : activity === 'competition' ? 'Training and your bond affect your chance of recognition.' : 'Make some time for ' + pet.name + '.', [{ id: 'energy', label: 'Energy', value: '4', tone: 'neutral' }, ...(fee ? [{ id: 'cost', label: 'Paid by owner', value: money(fee), tone: 'negative' as const }] : [])], <ActivityArt activity={activity} pet={pet} size={64} />);
  };
  const others = householdPets(world).filter(other => other.id !== pet.id && other.species === pet.species);
  return <Card><Heading size={18}>Training, Care & Company</Heading><Body>{life.trait} · {life.condition === 'well' ? 'Comfortable' : life.condition === 'minor-injury' ? 'Minor injury' : life.condition === 'ageing' ? 'Age-related discomfort' : life.condition === 'recovering' ? 'Recovering · ' + life.recovery + ' funded months' : 'Anxious'}</Body><StatBar label="Training" value={life.training} color={c.green} /><Body muted>Learned cues: {life.tricks.join(', ') || 'None yet'}</Body>
    {(Object.keys(groups) as (keyof typeof groups)[]).map(key => <React.Fragment key={key}><ActionRow title={groupLabels[key]} icon={key === 'care' ? <PetsLeisureArt id="vet" /> : key === 'training' ? <LifestylePetArt id="rosette" /> : <CompanionArt species={pet.species} />} value={group === key ? 'Hide' : undefined} onPress={() => setGroup(group === key ? null : key)} />{group === key && groups[key].filter(activity => activity !== 'treat' || !['well', 'recovering'].includes(life.condition)).filter(activity => activity !== 'outing' || ['dog', 'horse'].includes(pet.species)).filter(activity => activity !== 'introduce' || others.length > 0).map(activity => <ActionRow key={activity} title={labels[activity]} icon={<ActivityArt activity={activity} pet={pet} />} value={petActivityCost(world, pet, activity) ? money(petActivityCost(world, pet, activity)) : '4 energy'} disabled={busy} disabledReason={activity === 'family' || activity === 'introduce' ? lifestyleReason(world, false) : petActivityReason(world, pet, activity)} onPress={() => activity === 'family' || activity === 'introduce' ? setPick(activity) : action(activity)} />)}</React.Fragment>)}
    <EventModal event={pick === 'introduce' ? { id: 'pet-introduce:' + pet.id, kind: 'selection', title: 'Introduce to Another Pet', body: 'Choose a household companion for a supervised introduction.', choices: others.map(other => ({ id: other.id, label: other.name, illustration: <CompanionArt species={other.species} />, disabledReason: petActivityReason(world, pet, 'introduce', other.id) })), confirmLabel: 'Choose Companion' } : null} busy={busy} onCancel={() => setPick(null)} onChoose={id => { setPick(null); action('introduce', id); }} />
    {pick === 'family' && <PersonPicker world={world} title="Spend Time with Family" personIds={Object.values(world.people).filter(person => person.householdId && person.householdId === world.people[world.activePersonId].householdId).map(person => person.id)} busy={busy} eligibility={id => localContactReason(world, id, true) ?? petActivityReason(world, pet, 'family', id)} onCancel={() => setPick(null)} onChoose={id => { setPick(null); action('family', id); }} />}
    {world.lifestyle.records.filter(row => row.subjectId === pet.id && row.kind.startsWith('pet-')).slice(-3).reverse().map(row => <Body muted key={row.id}>{row.date.year} · {row.body}</Body>)}{modal}
  </Card>;
}
