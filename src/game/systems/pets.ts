import { z } from 'zod';
import { ageOn, compareDates, fullName } from '../personHelpers';
import type { Person, World } from '../model';
import { countries, CountryCode } from '../countries';
import { monthFrom } from '../calendar';
import { petOfferIds, petOffers, petRules, PetSpecies } from '../content/pets';
import { roundRatio } from '../money';
import { rules } from '../rules';
import { IneligibleAction } from '../errors';
import { accountFor, active, availableCash, bounded, charge, draw, fact, result } from './common';
import { householdPets, Pet } from './petSchemas';
import { activeTrip } from './travelSchemas';
import { parentOf } from './travel';
import { serviceAway } from './serviceSchemas';
import { hospitalized } from './healthSchemas';
import { isConfined } from './legalSchemas';
import { offerPending } from '../pendingQueue';

const absolute = (world: World) => world.date.year * 12 + world.date.month - 1;
export const petCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('adopt-pet'), offerId: z.enum(petOfferIds), reviewedOwnerId: z.string(), name: z.string().trim().min(1).max(40).refine(value => !/[\u0000-\u001f]/.test(value)), quotedFee: z.bigint().positive() }),
  z.object({ type: z.literal('pet-care'), petId: z.string(), activity: z.enum(['walk', 'feed', 'play']) }),
  z.object({ type: z.literal('pet-vet'), petId: z.string(), reviewedOwnerId: z.string(), quotedFee: z.bigint().positive() }),
  z.object({ type: z.literal('rehome-pet'), petId: z.string() }),
]);
export type PetCommand = z.infer<typeof petCommandSchema>;
export function petAgeMonths(world: World, pet: Pet) {
  const at = pet.ended ?? world.date;
  let months = at.year * 12 + at.month - 1 - (pet.born.year * 12 + pet.born.month - 1);
  if (months > 0 && compareDates(at, monthFrom(pet.born, months, pet.born.day)) < 0) months--;
  return months;
}
const availableCarer = (world: World, person: Person) => !person.died && !person.legal.wanted && ageOn(person, world.date) >= 18 && !activeTrip(world, person.id) && !serviceAway(world, person.id) && !hospitalized(world, person) && !isConfined(world, person);
export function petAdoptionOwner(world: World) {
  const person = active(world); if (ageOn(person, world.date) >= 18) return person;
  return Object.values(world.people).find(member => availableCarer(world, member) && !!person.householdId && member.householdId === person.householdId && member.country === person.country && member.city === person.city && parentOf(world, member.id, person.id));
}
export const petFoodCost = (country: CountryCode, species: PetSpecies) => roundRatio(rules[country].baseWage * BigInt(petRules[species].foodBps), 10000n);
export const petBoardingCost = (country: CountryCode) => roundRatio(rules[country].baseWage, 500n);
export const petVetCost = (country: CountryCode) => roundRatio(rules[country].baseWage, 1000n);
export const petAdoptionFee = (world: World, offerId: typeof petOfferIds[number]) => roundRatio(rules[active(world).country].baseWage * BigInt(petRules[petOffers[offerId].species].adoptionBps), 10000n);
export const petMoveCost = (world: World, personIds: string[]) => world.pets.filter(pet => pet.status === 'active' && personIds.includes(pet.ownerId)).reduce((sum, pet) => sum + roundRatio(rules[world.people[pet.ownerId].country].baseWage, 200n), 0n);
const adoptionKey = (world: World, offerId: string) => active(world).id + ':pet-adopt:' + world.date.year + ':' + offerId;
export function petAdoptionReason(world: World, offerId: typeof petOfferIds[number]): string | undefined {
  const person = active(world), owner = petAdoptionOwner(world);
  if (person.died || ageOn(person, world.date) < 6) return 'Meet and care for household pets from age six';
  if (activeTrip(world) || serviceAway(world) || hospitalized(world, person) || isConfined(world) || person.legal.wanted) return 'Return home and resolve your current restrictions before adopting';
  if (!owner || !availableCarer(world, owner)) return 'An available adult parent or guardian in your household must take responsibility';
  if (householdPets(world).length >= 4) return 'Your household can care for at most four active pets';
  if (world.actionCounts[adoptionKey(world, offerId)]) return 'You already requested this adoption this calendar year';
  if (availableCash(accountFor(world, owner)) < petAdoptionFee(world, offerId)) return fullName(owner) + ' cannot cover the adoption fee';
}
function notify(world: World, pet: Pet, title: string, body: string, illustration = 'pet-' + pet.species, priority = 35) {
  const player = active(world), owner = world.people[pet.ownerId];
  // A known companion can have a zero bond after a falling-out. Their profile
  // and history remain accessible, so their death must not silently disappear.
  if (player.died || !(pet.adoptedById === player.id || pet.ownerId === player.id || pet.bonds[player.id] !== undefined || !!owner.householdId && owner.householdId === player.householdId)) return;
  offerPending(world, { id: 'pet_' + pet.id + '_' + world.revision + '_' + pet.periods.length + '_' + (pet.endKind ?? (pet.unfundedMonths ? 'unfunded' : 'illness')), kind: 'result', title, body, illustration, effects: [] }, priority);
  if (world.annual?.stage === 'months') world.annual.pausedForPlanning = true;
}
function endPet(world: World, pet: Pet, status: 'rehomed' | 'deceased', reason: string, kind: NonNullable<Pet['endKind']>) {
  pet.endKind = kind; pet.status = status; pet.ended = { ...world.date }; pet.endReason = reason; pet.owners.at(-1)!.ended = { ...world.date };
  fact(world, pet.name + (status === 'deceased' ? ' died. ' : ' found a new home through the shelter. ') + reason, 'pet', '', pet.ownerId);
  if (status === 'deceased') for (const [id, bond] of Object.entries(pet.bonds)) if (!world.people[id].died && bond >= 30) world.people[id].stats.happiness = bounded(world.people[id].stats.happiness - (bond >= 70 ? 12 : 6));
  notify(world, pet, status === 'deceased' ? 'Goodbye, ' + pet.name : pet.name + ' has a new home', status === 'deceased'
    ? pet.name + ' the ' + pet.species + ' died' + (kind === 'age' ? ' of old age' : '') + '. You’ll miss your time together.'
    : reason, status === 'deceased' ? 'pet-memorial' : 'pet-' + pet.species, status === 'deceased' ? 60 : 35);
}
export function petRehomeReason(world: World, pet: Pet): string | undefined {
  const person = active(world);
  if (pet.status !== 'active' || pet.ownerId !== person.id) return 'Only the responsible owner can arrange a new home';
  if (person.died || activeTrip(world) || serviceAway(world) || isConfined(world) || hospitalized(world, person) || person.legal.wanted) return 'Return home to arrange a new home';
}
export function petCareReason(world: World, pet: Pet, activity: 'walk' | 'feed' | 'play' | 'vet'): string | undefined {
  const person = active(world);
  if (pet.status !== 'active' || !householdPets(world).some(item => item.id === pet.id)) return 'Choose a current pet in your household';
  if (ageOn(person, world.date) < 6 || person.died || activeTrip(world) || serviceAway(world) || hospitalized(world, person) || isConfined(world) || person.legal.wanted) return 'Be available at home to care for your pet';
  if (activity === 'walk' && pet.species !== 'dog') return 'Choose play or gentle company for this pet';
  if (activity === 'walk' && (person.stats.energy < 4 || person.stats.health < 25)) return 'Rest and recover before a walk';
  if (world.actionCounts[person.id + ':pet-' + activity + ':' + pet.id + ':' + absolute(world)]) return 'You have already done this activity with this pet this month';
  if (activity === 'vet') {
    if (pet.lastVetMonth === absolute(world)) return 'The vet has already seen this pet this month';
    if (pet.illness === 'none' && pet.lastVetMonth !== null && absolute(world) - pet.lastVetMonth < 12) return 'A healthy pet’s routine check-up is available once a year';
    if (availableCash(accountFor(world, world.people[pet.ownerId])) < petVetCost(pet.country)) return 'The responsible owner cannot cover the veterinary fee';
  }
}
export function resolvePets(world: World, command: PetCommand) {
  const person = active(world);
  if (command.type === 'adopt-pet') {
    const reason = petAdoptionReason(world, command.offerId); if (reason) throw new IneligibleAction(reason);
    const fee = petAdoptionFee(world, command.offerId); if (fee !== command.quotedFee) throw new IneligibleAction('Review the current adoption fee');
    const owner = petAdoptionOwner(world)!; if (owner.id !== command.reviewedOwnerId) throw new IneligibleAction('The responsible adult changed; review this adoption again');
    const offer = petOffers[command.offerId], definition = petRules[offer.species], relation = world.relationships.find(item => item.from === owner.id && item.to === person.id || item.to === owner.id && item.from === person.id), chance = owner.id === person.id ? 100 : Math.min(95, 45 + Math.floor((relation?.strength ?? 20) / 2)), roll = owner.id === person.id ? 100 : draw(world, 'npcs', 1, 100), accepted = roll <= chance;
    world.actionCounts[adoptionKey(world, command.offerId)] = 1;
    const attempt = { id: 'pet_adoption_' + world.revision, personId: person.id, ownerId: owner.id, offerId: command.offerId, date: { ...world.date }, chance, roll, accepted, relationshipStrength: owner.id === person.id ? null : relation?.strength ?? 20, country: owner.country, city: owner.city, petId: accepted ? 'pet_' + world.revision + '_' + world.pets.length : null }; world.petAdoptions.push(attempt);
    if (!accepted) { fact(world, owner.firstName + ' did not agree to take responsibility for the proposed pet adoption.', 'pet-adoption'); result(world, 'Not the right time for a pet', owner.firstName + ' said no. Keep the pet photos handy for next year. No adoption fee was charged.', 'pet-paw'); return; }
    charge(world, fee, 'pet-adoption', 'Adopted ' + command.name, undefined, countries[owner.country].currency, owner);
    const pet: Pet = { id: attempt.petId!, species: offer.species, offerId: command.offerId, breed: offer.breed, name: command.name, born: monthFrom(world.date, -Math.min(offer.ageMonths, absolute(world) - 12), world.calendarAnchorDay), adopted: { ...world.date }, adoptedById: person.id, originalOwnerId: owner.id, ownerId: owner.id, country: owner.country, city: owner.city, status: 'active', ended: null, endReason: null, endKind: null, lifespanMonths: draw(world, 'outcomes', definition.minimumLife, definition.maximumLife), health: 90, happiness: 75, bonds: { [person.id]: 30, ...(owner.id === person.id ? {} : { [owner.id]: 20 }) }, temperament: (['gentle', 'playful', 'independent'] as const)[draw(world, 'outcomes', 0, 2)], illness: 'none', recoveryMonths: 0, adoptionFee: fee, adoptionCurrency: countries[owner.country].currency, adoptionTransactionId: world.ledger.at(-1)!.id, consent: { roll, chance }, lastMonth: absolute(world), unfundedMonths: 0, lastVetMonth: null, owners: [{ personId: owner.id, since: { ...world.date }, ended: null }], periods: [], visits: [], moves: [] };
    world.pets.push(pet); person.stats.happiness = bounded(person.stats.happiness + 4); fact(world, 'I welcomed ' + pet.name + ', a ' + pet.breed.toLowerCase() + ', into our household. ' + fullName(owner) + ' took responsibility for care costs.', 'pet-adoption'); result(world, 'Welcome, ' + pet.name, pet.name + ' is home. Your household just got a little livelier.', 'pet-' + pet.species); return;
  }
  const pet = world.pets.find(item => item.id === command.petId); if (!pet) throw new IneligibleAction('Choose an existing pet');
  if (command.type === 'rehome-pet') { const reason = petRehomeReason(world, pet); if (reason) throw new IneligibleAction(reason); endPet(world, pet, 'rehomed', 'I arranged for the shelter to find a suitable home. Adoption and care costs are not refunded.', 'voluntary'); return; }
  const activity = command.type === 'pet-vet' ? 'vet' : command.activity;
  const reason = petCareReason(world, pet, activity); if (reason) throw new IneligibleAction(reason);
  world.actionCounts[person.id + ':pet-' + activity + ':' + pet.id + ':' + absolute(world)] = 1;
  if (command.type === 'pet-vet') {
    const owner = world.people[pet.ownerId], paid = petVetCost(pet.country);
    if (owner.id !== command.reviewedOwnerId || paid !== command.quotedFee) throw new IneligibleAction('The owner or veterinary fee changed; review this visit again');
    charge(world, paid, 'pet-vet', 'Veterinary care: ' + pet.name, undefined, countries[pet.country].currency, owner);
    const roll = draw(world, 'outcomes', 1, 100), successful = roll <= 90; pet.lastVetMonth = absolute(world); pet.visits.push({ date: { ...world.date }, personId: person.id, ownerId: owner.id, country: pet.country, city: pet.city, currency: countries[pet.country].currency, paid, paymentId: world.ledger.at(-1)!.id, roll, successful });
    if (pet.illness !== 'none' && successful) { pet.illness = 'recovering'; pet.recoveryMonths = 2; } else if (pet.illness === 'none' && successful) pet.health = bounded(pet.health + 3);
    fact(world, 'I took ' + pet.name + ' to the vet. ' + (pet.illness === 'recovering' ? 'Treatment began; recovery will take time.' : pet.illness === 'infection' ? 'The first treatment did not resolve the illness.' : 'The routine check-up was complete.'), 'pet-care'); result(world, 'Veterinary Visit', pet.illness === 'recovering' ? 'Treatment has started. Recovery takes two months of funded care.' : pet.illness === 'infection' ? 'The treatment did not work. You can try another visit next month.' : 'The check-up is done. Keep making time for your companion.', 'pet-vet'); return;
  }
  const bond = pet.bonds[person.id] ?? 0; pet.bonds[person.id] = bounded(bond + (command.activity === 'play' ? 5 : 3)); pet.happiness = bounded(pet.happiness + (command.activity === 'play' ? 5 : 3)); person.stats.happiness = bounded(person.stats.happiness + 2); person.stats.stress = bounded(person.stats.stress - 2);
  if (command.activity === 'walk') { person.stats.energy = bounded(person.stats.energy - 4); person.stats.fitness = bounded(person.stats.fitness + 1); }
  fact(world, command.activity === 'walk' ? 'I took ' + pet.name + ' for a walk.' : command.activity === 'feed' ? 'I kept ' + pet.name + ' company at mealtime.' : 'I played with ' + pet.name + '.', 'pet-care'); result(world, 'Time with ' + pet.name, command.activity === 'walk' ? 'Fresh air, interesting smells, excellent company.' : command.activity === 'feed' ? 'You kept ' + pet.name + ' company over a meal.' : 'You made a little time for ' + pet.name + '. A good use of the day.', 'pet-' + command.activity);
}
export function petMonth(world: World) {
  const month = absolute(world);
  for (const pet of world.pets.filter(item => item.status === 'active')) {
    if (pet.lastMonth >= month) continue;
    if (pet.lastMonth !== month - 1) throw new Error('Pet care must advance through actual monthly periods');
    pet.lastMonth = month;
    const owner = world.people[pet.ownerId]; if (owner.died) throw new Error('A deceased owner cannot fund pet care');
    const family = Object.values(world.people).find(member => member.id !== owner.id && availableCarer(world, member) && !!owner.householdId && member.householdId === owner.householdId && member.country === pet.country && member.city === pet.city), carer = owner.country === pet.country && owner.city === pet.city && availableCarer(world, owner) ? owner : family;
    const currency = countries[pet.country].currency, foodDue = petFoodCost(pet.country, pet.species), boardingDue = carer ? 0n : petBoardingCost(pet.country), total = foodDue + boardingDue, funded = availableCash(accountFor(world, owner, currency)) >= total;
    const ledgerCursor = world.ledger.length;
    if (funded) charge(world, total, 'pet-care', 'Monthly care: ' + pet.name, undefined, currency, owner);
    const healthRoll = draw(world, owner.id === world.activePersonId || pet.adoptedById === world.activePersonId ? 'outcomes' : 'npcs', 1, 100);
    const newlyIll = funded && pet.illness === 'none' && healthRoll <= 2;
    pet.unfundedMonths = funded ? 0 : pet.unfundedMonths + 1;
    pet.happiness = bounded(pet.happiness + (funded ? (pet.temperament === 'independent' ? 1 : 0) : -8));
    if (!funded) pet.health = bounded(pet.health - 5);
    else if (pet.illness === 'recovering') { pet.health = bounded(pet.health + 8); pet.recoveryMonths--; if (!pet.recoveryMonths) pet.illness = 'none'; }
    else if (pet.illness === 'infection') pet.health = bounded(pet.health - 4);
    else if (healthRoll <= 2) { pet.illness = 'infection'; pet.health = bounded(pet.health - 8);  }
    pet.periods.push({ month, ledgerCursor, country: pet.country, city: pet.city, ownerId: owner.id, currency, foodDue, boardingDue, paid: funded ? total : 0n, paymentId: funded ? world.ledger.at(-1)!.id : null, care: !funded ? 'unfunded' : carer?.id === owner.id ? 'owner' : carer ? 'family' : 'boarding', carerId: carer?.id ?? null, healthRoll, health: pet.health, happiness: pet.happiness });
    if (pet.unfundedMonths >= 2) endPet(world, pet, 'rehomed', 'Two months of care went unpaid. The shelter found a new home. No payments were refunded.', 'unfunded');
    else if (pet.health === 0 || petAgeMonths(world, pet) >= pet.lifespanMonths) endPet(world, pet, 'deceased', pet.health === 0 ? 'Their health declined despite the time we had together.' : 'They reached the end of their life.', pet.health === 0 ? 'health' : 'age');
    else if (newlyIll) notify(world, pet, pet.name + ' became unwell', pet.name + ' is unwell. A vet visit may help.');
    else if (!funded) notify(world, pet, pet.name + ' needs funded care', owner.firstName + ' could not cover this month’s care. Pay next month to avoid shelter rehoming.');
  }
}
export function relocatePets(world: World, personIds: string[], country: CountryCode, city: string, relocationId: string, transactionId: string) {
  const payer = active(world), currency = countries[payer.country].currency;
  for (const pet of world.pets.filter(item => item.status === 'active' && personIds.includes(item.ownerId))) {
    const fee = roundRatio(rules[pet.country].baseWage, 200n);
    pet.moves.push({ relocationId, date: { ...world.date }, ownerId: pet.ownerId, payerId: payer.id, fromCountry: pet.country, fromCity: pet.city, country, city, currency, fee, transactionId });
    pet.country = country; pet.city = city;
  }
}
export function petOwnerDied(world: World, personId: string) {
  const oldOwner = world.people[personId];
  for (const pet of world.pets.filter(item => item.status === 'active' && item.ownerId === personId)) {
    const eligible = Object.values(world.people).filter(member => availableCarer(world, member) && member.country === pet.country && member.city === pet.city && (!!oldOwner.householdId && member.householdId === oldOwner.householdId || world.relationships.some(relation => relation.from === personId && relation.to === member.id && relation.roles.some(role => role === 'parent' || role === 'guardian') || relation.romance === 'married' && [relation.from, relation.to].includes(personId) && [relation.from, relation.to].includes(member.id))));
    const next = eligible.find(member => member.id === world.activePersonId) ?? eligible[0];
    if (!next) { endPet(world, pet, 'rehomed', 'No local adult could take over after their owner died. The shelter found a new home.', 'owner-unavailable'); continue; }
    pet.owners.at(-1)!.ended = { ...world.date }; pet.owners.push({ personId: next.id, since: { ...world.date }, ended: null }); pet.ownerId = next.id; pet.bonds[next.id] ??= 10;
    fact(world, 'I took responsibility for ' + pet.name + ' after ' + oldOwner.firstName + ' died.', 'pet-guardian', '', next.id);
  }
}
