import React, { useCallback, useState } from 'react';
import { BackHandler, Keyboard, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { fullName } from '../../src/game/model';
import { countries } from '../../src/game/countries';
import { petOfferIds, petOffers } from '../../src/game/content/pets';
import { petAdoptionFee, petAdoptionOwner, petAdoptionReason, petFoodCost, petBoardingCost, PetCommand } from '../../src/game/systems/pets';
import { householdPets } from '../../src/game/systems/petSchemas';
import { formatMoney } from '../../src/game/money';
import { PolishArt } from '../../src/assets/PolishArt';
import { ActionRow, Body, Button, Card, Header, Heading, Page } from '../../src/ui/components';
import { EventModal, EventPresentation } from '../../src/ui/EventModal';
import { useColors } from '../../src/ui/theme';
import { FilterTabs } from '../../src/ui/FilterTabs';

const petTabs = [{ id: 'owned', label: 'My Pets' }, { id: 'adopt', label: 'Adopt' }] as const;

export default function Pets() {
  const world = useGame(s => s.world)!, busy = useGame(s => s.busy), error = useGame(s => s.error), dispatch = useGame(s => s.dispatch), c = useColors();
  const [segment, setSegment] = useState<'owned' | 'adopt'>(() => householdPets(world).length ? 'owned' : 'adopt');
  const [offerId, setOffer] = useState<typeof petOfferIds[number] | null>(null), [name, setName] = useState(''), [review, setReview] = useState<{ event: EventPresentation; command: PetCommand } | null>(null), [historyLimit, setHistoryLimit] = useState(6);
  useFocusEffect(useCallback(() => {
    if (segment !== 'adopt' || !offerId) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!busy) { Keyboard.dismiss(); setOffer(null); }
      return true;
    });
    return () => subscription.remove();
  }, [segment, offerId, busy]));
  const person = world.people[world.activePersonId], owner = petAdoptionOwner(world), pets = householdPets(world), own = world.pets.filter(pet => !pets.includes(pet) && (pet.adoptedById === person.id || pet.bonds[person.id] !== undefined)), offer = offerId && petOffers[offerId], reason = offerId ? petAdoptionReason(world, offerId) : undefined;
  const money = (amount: bigint) => formatMoney({ minor: amount, currency: countries[person.country].currency }, countries[person.country].locale);
  const nameReason = !name.trim() ? 'Enter a name for this pet.' : name.trim().length > 40 ? 'Use a name of at most 40 characters.' : /[\u0000-\u001f]/.test(name) ? 'Remove line breaks or control characters from the name.' : undefined;
  const formError = error && !review && !world.pending ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, fontSize: 15, lineHeight: 22 }}>{error}</Text> : null;
  const openReview = () => {
    if (!offerId || !offer || !owner || reason || !name.trim() || name.trim().length > 40 || /[\u0000-\u001f]/.test(name)) return;
    const fee = petAdoptionFee(world, offerId);
    setReview({ command: { type: 'adopt-pet', offerId, name: name.trim(), reviewedOwnerId: owner.id, quotedFee: fee }, event: {
      id: 'adopt-' + offerId + '-' + owner.id, kind: 'confirmation', title: 'Welcome ' + name.trim() + '?',
      body: owner.id === person.id ? 'Make room for your new companion.' : owner.firstName + ' will need to agree to the adoption.',
      terms: [{ id: 'payer', label: 'Responsible adult', value: fullName(owner), tone: 'neutral' },
        { id: 'fee', label: 'Adoption fee if accepted', value: money(fee), tone: 'negative' },
        { id: 'food', label: 'Monthly food and basic care', value: money(petFoodCost(person.country, offer.species)), tone: 'negative' },
        { id: 'boarding', label: 'Extra monthly boarding if no carer', value: money(petBoardingCost(person.country)), tone: 'negative' },
        { id: 'unpaid', label: 'Missed care payments', value: 'Two unpaid months mean shelter rehoming', tone: 'neutral' }],
      confirmLabel: owner.id === person.id ? 'Adopt Pet' : 'Ask For This Adoption' } });
  };
  const reviewModal = <EventModal event={review?.event ?? null} busy={busy} error={error} onCancel={() => setReview(null)} onChoose={() => { if (review) void dispatch(review.command).then(ok => { if (ok) { setReview(null); setOffer(null); setSegment('owned'); } }); }} />;
  if (segment === 'adopt' && offer && offerId) return <Page key={'adoption-' + offerId} footer={<>{formError}{nameReason && <Body muted>{nameReason}</Body>}<Button label="Review Adoption" disabled={busy || !!reason || !!nameReason} onPress={() => { Keyboard.dismiss(); openReview(); }} />{reason && <Body muted>{reason}</Body>}</>}>
    <Header title="Adoption Details" onBack={() => { Keyboard.dismiss(); setOffer(null); }} />
    <Card><View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}><PolishArt id={offer.species === 'parrot' ? 'pet-bird' : `pet-${offer.species}`} size={76} /><View style={{ flexGrow: 1, flexBasis: 170, minWidth: 0, gap: 5 }}><Heading size={22}>{offer.name}</Heading><Body muted>{offer.breed} · {offer.ageMonths < 12 ? offer.ageMonths + ' months' : Math.floor(offer.ageMonths / 12) + (offer.ageMonths < 24 ? ' year' : ' years')}</Body></View></View><Body>{offer.description}</Body></Card>
    <Card><Heading size={18}>Pet’s name</Heading><TextInput accessibilityLabel="Pet name" value={name} onChangeText={setName} maxLength={40} editable={!busy} returnKeyType="done" onSubmitEditing={Keyboard.dismiss} style={{ color: c.ink, backgroundColor: c.inset, borderColor: c.line, borderWidth: 1, padding: 14, borderRadius: 12, minHeight: 48, fontSize: 16 }} /></Card>
    <Card><Heading size={18}>Care and costs</Heading><Body>Responsible adult: {owner ? fullName(owner) : 'No available adult'}</Body><Body>Adoption fee if accepted: {money(petAdoptionFee(world, offerId))}</Body><Body>Monthly food and basic care: {money(petFoodCost(person.country, offer.species))}</Body><Body>Extra monthly boarding if no carer: {money(petBoardingCost(person.country))}</Body></Card>
    <Button label="Close Adoption Details" tone="secondary" disabled={busy} onPress={() => { Keyboard.dismiss(); setOffer(null); }} />
    {reviewModal}
  </Page>;
  return <Page footer={formError}><Header title="Household Pets" onBack={() => router.back()} />
    <Card><View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}><PolishArt id={segment === 'adopt' ? 'pet-adoption' : 'pet-bed'} size={68} /><View style={{ flexGrow: 1, flexBasis: 170, minWidth: 0, gap: 5 }}><Heading size={22}>Life with a companion</Heading><Body muted>{pets.length} {pets.length === 1 ? 'pet' : 'pets'} at home.</Body></View></View></Card>
    <FilterTabs values={petTabs} selected={segment} onSelect={setSegment} />
    {segment === 'owned' && <Card><Heading size={20}>Household companions</Heading>{pets.length ? pets.map(pet => <ActionRow key={pet.id} title={pet.name} subtitle={pet.breed + ' · ' + (pet.illness === 'none' ? 'Companion' : pet.illness === 'recovering' ? 'Recovering' : 'Unwell')} icon={<PolishArt id={pet.status === 'deceased' ? 'pet-memorial' : pet.species === 'parrot' ? 'pet-bird' : `pet-${pet.species}`} size={40} />} onPress={() => router.push({ pathname: '/pet/[id]', params: { id: pet.id } })} />) : <Body muted>No pets at home yet.</Body>}{pets.length > 0 && <Body muted>Food and basic care are paid monthly.</Body>}{pets.length === 0 && <Button label="Find A Companion" tone="secondary" onPress={() => setSegment('adopt')} />}</Card>}
    {segment === 'adopt' && <Card><Heading size={20}>Shelter Adoptions</Heading><Body muted>Choose a companion. A parent or guardian handles adoptions until you turn 18.</Body>{petOfferIds.map(id => <View key={id} style={{ borderColor: c.line, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingBottom: 12, gap: 6 }}><ActionRow title={petOffers[id].name} subtitle={[petOffers[id].breed + ' · ' + (petOffers[id].ageMonths < 12 ? petOffers[id].ageMonths + ' months' : Math.floor(petOffers[id].ageMonths / 12) + (petOffers[id].ageMonths < 24 ? ' year' : ' years')), petAdoptionReason(world, id)].filter(Boolean).join(' · ')} icon={<PolishArt id={petOffers[id].species === 'parrot' ? 'pet-bird' : `pet-${petOffers[id].species}`} size={40} />} disabled={busy} onPress={() => { Keyboard.dismiss(); setOffer(id); setName(petOffers[id].name); }} /><Body muted>Adoption if accepted: {money(petAdoptionFee(world, id))}</Body><Body muted>Monthly food and basic care: {money(petFoodCost(person.country, petOffers[id].species))}</Body></View>)}</Card>}
    {segment === 'owned' && own.length > 0 && <Card><Heading size={20}>Companion History</Heading>{own.slice().reverse().slice(0, historyLimit).map(pet => <ActionRow key={pet.id} title={pet.name} subtitle={pet.status === 'active' ? 'Lives with ' + fullName(world.people[pet.ownerId]) : pet.status === 'deceased' ? 'Remembered' : 'Rehomed'} icon={<PolishArt id={pet.status === 'deceased' ? 'pet-memorial' : pet.species === 'parrot' ? 'pet-bird' : `pet-${pet.species}`} size={40} />} onPress={() => router.push({ pathname: '/pet/[id]', params: { id: pet.id } })} />)}{own.length > historyLimit && <Button label="Show Earlier Companions" tone="secondary" onPress={() => setHistoryLimit(historyLimit + 6)} />}</Card>}
    {reviewModal}
  </Page>;
}
