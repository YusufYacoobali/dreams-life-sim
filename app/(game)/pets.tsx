import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { fullName } from '../../src/game/model';
import { countries } from '../../src/game/countries';
import { petOfferIds, petOffers } from '../../src/game/content/pets';
import { petAdoptionFee, petAdoptionOwner, petAdoptionReason, petFoodCost, petBoardingCost, PetCommand } from '../../src/game/systems/pets';
import { householdPets } from '../../src/game/systems/petSchemas';
import { formatMoney } from '../../src/game/money';
import { PetsLeisureArt } from '../../src/assets/PetsLeisureArt';
import { ActionRow, Body, Button, Card, Header, Heading, Page } from '../../src/ui/components';
import { EventModal, EventPresentation } from '../../src/ui/EventModal';
import { useColors } from '../../src/ui/theme';

export default function Pets() {
  const world = useGame(s => s.world)!, busy = useGame(s => s.busy), error = useGame(s => s.error), dispatch = useGame(s => s.dispatch), c = useColors();
  const [segment, setSegment] = useState<'owned' | 'adopt'>(() => householdPets(world).length ? 'owned' : 'adopt');
  const [offerId, setOffer] = useState<typeof petOfferIds[number] | null>(null), [name, setName] = useState(''), [review, setReview] = useState<{ event: EventPresentation; command: PetCommand } | null>(null), [historyLimit, setHistoryLimit] = useState(6);
  const person = world.people[world.activePersonId], owner = petAdoptionOwner(world), pets = householdPets(world), own = world.pets.filter(pet => !pets.includes(pet) && (pet.adoptedById === person.id || pet.bonds[person.id] !== undefined)), offer = offerId && petOffers[offerId], reason = offerId ? petAdoptionReason(world, offerId) : undefined;
  const money = (amount: bigint) => formatMoney({ minor: amount, currency: countries[person.country].currency }, countries[person.country].locale);
  const openReview = () => {
    if (!offerId || !offer || !owner || reason || !name.trim() || name.trim().length > 40 || /[\u0000-\u001f]/.test(name)) return;
    const fee = petAdoptionFee(world, offerId);
    setReview({ command: { type: 'adopt-pet', offerId, name: name.trim(), reviewedOwnerId: owner.id, quotedFee: fee }, event: { id: 'adopt-' + offerId + '-' + owner.id, kind: 'confirmation', title: 'Welcome ' + name.trim() + '?', body: owner.id === person.id ? 'You will take responsibility for this pet. Regular food and care are automatic as time passes; walks and play are optional.' : fullName(owner) + ' must agree to take responsibility. A refusal adopts no pet and charges no fee. Regular care is automatic as time passes.', terms: [{ id: 'payer', label: 'Responsible adult', value: fullName(owner), tone: 'neutral' }, { id: 'fee', label: 'Adoption fee if accepted', value: money(fee), tone: 'negative' }, { id: 'food', label: 'Monthly food and basic care', value: money(petFoodCost(person.country, offer.species)), tone: 'negative' }, { id: 'boarding', label: 'Extra monthly boarding if no carer', value: money(petBoardingCost(person.country)), tone: 'negative' }], confirmLabel: owner.id === person.id ? 'Adopt Pet' : 'Ask For This Adoption' } });
  };
  return <Page><Header title="Household Pets" onBack={() => router.back()} />
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', gap: 8 }}>{(['owned', 'adopt'] as const).map(value => <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: segment === value }} accessibilityLabel={value === 'owned' ? 'My Pets' : 'Adopt'} onPress={() => setSegment(value)} style={{ flex: 1, minHeight: 44, padding: 12, borderRadius: 12, alignItems: 'center', backgroundColor: segment === value ? c.blue : c.inset }}><Text style={{ color: segment === value ? '#FFFFFF' : c.ink, fontWeight: '600' }}>{value === 'owned' ? 'My Pets' : 'Adopt'}</Text></Pressable>)}</View>
    {segment === 'owned' && <Card><Heading size={18}>At Home</Heading>{pets.length ? pets.map(pet => <ActionRow key={pet.id} title={pet.name} subtitle={pet.breed + ' · ' + (pet.illness === 'none' ? 'Companion' : pet.illness === 'recovering' ? 'Recovering' : 'Unwell')} icon={<PetsLeisureArt id={pet.species} size={40} />} onPress={() => router.push({ pathname: '/pet/[id]', params: { id: pet.id } })} />) : <Body muted>No pets currently live in your household.</Body>}<Body muted>Food and basic care are funded each actual month. Optional play and walks are for time together. Two unfunded care months lead to shelter rehoming.</Body>{pets.length === 0 && <Button label="Find A Companion" tone="secondary" onPress={() => setSegment('adopt')} />}</Card>}
    {segment === 'adopt' && <Card><Heading size={18}>Shelter Adoptions</Heading><Body muted>From age six, an available parent or guardian can take responsibility. Adults adopt in their own name. Your household can have four pets.</Body>{petOfferIds.map(id => <ActionRow key={id} title={petOffers[id].name} subtitle={petOffers[id].breed + ' · ' + Math.floor(petOffers[id].ageMonths / 12) + ' years'} icon={<PetsLeisureArt id={petOffers[id].species} size={40} />} disabled={busy} disabledReason={petAdoptionReason(world, id)} onPress={() => { setOffer(id); setName(petOffers[id].name); }} />)}</Card>}
    {segment === 'adopt' && offer && <Card><Heading size={18}>{offer.name} · {offer.breed}</Heading><Body>{offer.description}</Body><Body muted>Illustrations represent the species.</Body><Body>Pet’s name</Body><TextInput accessibilityLabel="Pet name" value={name} onChangeText={setName} maxLength={40} editable={!busy} style={{ color: c.ink, backgroundColor: c.inset, borderColor: c.line, borderWidth: 1, padding: 14, borderRadius: 12, minHeight: 48, fontSize: 16 }} />{reason && <Body muted>{reason}</Body>}<Button label="Review Adoption" disabled={busy || !!reason || !name.trim() || /[\u0000-\u001f]/.test(name)} onPress={openReview} /><Button label="Close Adoption Details" tone="secondary" disabled={busy} onPress={() => setOffer(null)} /></Card>}
    {segment === 'owned' && own.length > 0 && <Card><Heading size={18}>Companion History</Heading>{own.slice().reverse().slice(0, historyLimit).map(pet => <ActionRow key={pet.id} title={pet.name} subtitle={pet.status === 'active' ? 'Lives with ' + fullName(world.people[pet.ownerId]) : pet.status === 'deceased' ? 'Remembered' : 'Rehomed'} icon={<PetsLeisureArt id={pet.species} size={40} />} onPress={() => router.push({ pathname: '/pet/[id]', params: { id: pet.id } })} />)}{own.length > historyLimit && <Button label="Show Earlier Companions" tone="secondary" onPress={() => setHistoryLimit(historyLimit + 6)} />}</Card>}
    {error && !review && <Body>{error}</Body>}<EventModal event={review?.event ?? null} busy={busy} error={error} onCancel={() => setReview(null)} onChoose={() => { if (review) void dispatch(review.command).then(ok => { if (ok) { setReview(null); setOffer(null); setSegment('owned'); } }); }} />
  </Page>;
}
