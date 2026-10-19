import { ageOn, compareDates, World } from '../model';
import { monthFrom } from '../calendar';
import { countries } from '../countries';
import { destinations } from '../content/travel';
import { petOffers, petRules } from '../content/pets';
import { roundRatio } from '../money';
import { rules } from '../rules';
import { petBoardingCost, petFoodCost, petVetCost } from './pets';

/** History reconciles to the actual people, monthly cursor and financial ledger. */
export function validatePets(world: World) {
  if (!world.pets.length && !world.petAdoptions.length) {
    if (world.ledger.some(row => ['pet-adoption', 'pet-care', 'pet-vet'].includes(row.category))) throw new Error('Pet ledger entry lacks its actual care history');
    return;
  }
  const month = (date: World['date']) => date.year * 12 + date.month - 1;
  const transactions = new Map(world.ledger.map((row, index) => [row.id, { row, index }]));
  const adoptedIds = new Set<string>();
  const now = month(world.date), ids = new Set<string>(), attempts = new Set<string>(), requests = new Set<string>(), payments = new Set<string>();
  const aliveAt = (id: string, date: World['date']) => {
    const person = world.people[id];
    return person && compareDates(person.born, date) <= 0 && (!person.died || compareDates(person.died, date) >= 0);
  };
  const payment = (id: string, personId: string, currency: string, amount: bigint, category: string, date: World['date']) => {
    const row = transactions.get(id)?.row;
    if (!row || payments.has(id) || row.personId !== personId || row.currency !== currency || row.cashDelta !== -amount || row.debtDelta !== 0n || row.category !== category || row.year !== date.year || row.month !== date.month) throw new Error('Pet payment does not reconcile with ledger');
    payments.add(id);
  };
  for (const attempt of world.petAdoptions) {
    const person = world.people[attempt.personId], owner = world.people[attempt.ownerId], adult = attempt.ownerId === attempt.personId;
    const key = attempt.personId + ':' + attempt.date.year + ':' + attempt.offerId;
    if (!person || !owner || attempts.has(attempt.id) || requests.has(key) || compareDates(attempt.date, world.date) > 0 || !aliveAt(person.id, attempt.date) || !aliveAt(owner.id, attempt.date) || ageOn({ ...person, died: null }, attempt.date) < 6 || ageOn({ ...owner, died: null }, attempt.date) < 18 || (attempt.roll <= attempt.chance) !== attempt.accepted || attempt.accepted !== !!attempt.petId) throw new Error('Invalid pet adoption request');
    if (adult ? attempt.relationshipStrength !== null || attempt.chance !== 100 || attempt.roll !== 100 : attempt.relationshipStrength === null || attempt.chance !== Math.min(95, 45 + Math.floor(attempt.relationshipStrength / 2))) throw new Error('Invalid pet adoption consent');
    if (!adult && !world.relationships.some(edge => edge.from === owner.id && edge.to === person.id && edge.roles.some(role => role === 'parent' || role === 'guardian')) && !world.custody.some(item => item.childId === person.id && item.primaryId === owner.id)) throw new Error('Pet adoption has no actual parent or guardian');
    if (!world.actionCounts[person.id + ':pet-adopt:' + attempt.date.year + ':' + attempt.offerId] || attempt.petId && !world.pets.some(pet => pet.id === attempt.petId)) throw new Error('Pet adoption lacks its saved outcome');
    if (attempt.petId) { if (adoptedIds.has(attempt.petId)) throw new Error('Multiple requests cannot adopt the same pet'); adoptedIds.add(attempt.petId); }
    attempts.add(attempt.id); requests.add(key);
  }
  for (const pet of world.pets) {
    const offer = petOffers[pet.offerId], definition = petRules[pet.species], adoption = world.petAdoptions.find(item => item.petId === pet.id);
    if (ids.has(pet.id) || !pet.id.startsWith('pet_') || !adoption?.accepted || pet.species !== offer.species || pet.breed !== offer.breed || pet.adoptedById !== adoption.personId || pet.originalOwnerId !== adoption.ownerId || compareDates(pet.adopted, adoption.date) !== 0 || compareDates(pet.adopted, world.date) > 0 || pet.consent.roll !== adoption.roll || pet.consent.chance !== adoption.chance || pet.adoptionCurrency !== countries[adoption.country].currency || pet.adoptionFee !== roundRatio(rules[adoption.country].baseWage * BigInt(definition.adoptionBps), 10000n)) throw new Error('Invalid adopted pet');
    ids.add(pet.id);
    const expectedBorn = monthFrom(pet.adopted, -Math.min(offer.ageMonths, month(pet.adopted) - 12), world.calendarAnchorDay);
    if (compareDates(pet.born, expectedBorn) !== 0 || pet.lifespanMonths < definition.minimumLife || pet.lifespanMonths > definition.maximumLife || pet.lastMonth > now || pet.lastMonth < month(pet.adopted) || pet.lastMonth !== month(pet.adopted) + pet.periods.length) throw new Error('Invalid pet lifetime or monthly cursor');
    if (!pet.owners.length || pet.owners[0].personId !== pet.originalOwnerId || compareDates(pet.owners[0].since, pet.adopted) !== 0 || pet.owners.at(-1)!.personId !== pet.ownerId || !world.people[pet.ownerId]) throw new Error('Invalid pet ownership history');
    pet.owners.forEach((owner, index) => {
      const person = world.people[owner.personId], previous = pet.owners[index - 1];
      if (!person || !aliveAt(person.id, owner.since) || ageOn({ ...person, died: null }, owner.since) < 18 || compareDates(owner.since, world.date) > 0 || owner.ended && (compareDates(owner.ended, owner.since) < 0 || compareDates(owner.ended, world.date) > 0)) throw new Error('Invalid responsible pet owner');
      if (previous && (!previous.ended || !world.people[previous.personId].died || compareDates(previous.ended, owner.since) !== 0 || compareDates(world.people[previous.personId].died!, owner.since) !== 0 || previous.personId === owner.personId)) throw new Error('Pet responsibility changed without its recorded death');
      if (index < pet.owners.length - 1 && !owner.ended) throw new Error('Pet has multiple active owners');
    });
    const owner = world.people[pet.ownerId];
    if (pet.status === 'active' ? !!pet.ended || !!pet.endReason || !!pet.endKind || !!pet.owners.at(-1)!.ended || !!owner.died || pet.lastMonth !== now || owner.country !== pet.country || owner.city !== pet.city || pet.health === 0 || pet.unfundedMonths >= 2 : !pet.ended || !pet.endReason || compareDates(pet.ended, pet.adopted) < 0 || compareDates(pet.ended, world.date) > 0 || compareDates(pet.owners.at(-1)!.ended!, pet.ended) !== 0 || pet.lastMonth > month(pet.ended)) throw new Error('Invalid pet ending or active home');
    if (pet.status !== 'active') {
      const at = pet.ended!, monthsLived = month(at) - month(pet.born);
      if (!pet.endKind || pet.status === 'deceased' && (!['health', 'age'].includes(pet.endKind) || pet.endKind === 'health' && pet.health !== 0 || pet.endKind === 'age' && monthsLived < pet.lifespanMonths || pet.lastMonth !== month(at)) || pet.status === 'rehomed' && (!['owner-unavailable', 'unfunded', 'voluntary'].includes(pet.endKind) || pet.endKind === 'unfunded' && (pet.unfundedMonths !== 2 || pet.lastMonth !== month(at)) || pet.endKind === 'owner-unavailable' && (!owner.died || compareDates(owner.died, at) !== 0) || pet.endKind === 'voluntary' && (!aliveAt(owner.id, at) || ageOn({ ...owner, died: null }, at) < 18))) throw new Error('Pet ending lacks its actual cause');
    }
    if ((pet.illness === 'recovering') !== (pet.recoveryMonths > 0) || Object.keys(pet.bonds).some(id => !world.people[id]) || pet.bonds[pet.adoptedById] === undefined || pet.bonds[pet.originalOwnerId] === undefined) throw new Error('Invalid pet condition or bond');
    payment(pet.adoptionTransactionId, pet.originalOwnerId, pet.adoptionCurrency, pet.adoptionFee, 'pet-adoption', pet.adopted);
    const locationAt = (date: World['date'], ledgerCursor: number) => {
      let country = adoption.country, city = adoption.city;
      for (const move of pet.moves) if (compareDates(move.date, date) < 0 || compareDates(move.date, date) === 0 && (transactions.get(move.transactionId)?.index ?? Infinity) < ledgerCursor) { country = move.country; city = move.city; }
      return { country, city };
    };
    let unfunded = 0;
    pet.periods.forEach((period, index) => {
      const date = monthFrom(pet.adopted, index + 1, world.calendarAnchorDay);
      const location = locationAt(date, period.ledgerCursor);
      if (period.ledgerCursor > world.ledger.length || period.country !== location.country || period.city !== location.city || period.month !== month(date) || period.currency !== countries[period.country].currency || !pet.owners.some(item => item.personId === period.ownerId && compareDates(item.since, date) <= 0 && (!item.ended || compareDates(item.ended, date) >= 0)) || !aliveAt(period.ownerId, date) || period.foodDue !== petFoodCost(period.country, pet.species) || ![0n, petBoardingCost(period.country)].includes(period.boardingDue)) throw new Error('Invalid monthly pet care');
      if (period.care === 'unfunded') {
        if (period.paid !== 0n || period.paymentId) throw new Error('Unfunded pet care cannot create a payment'); unfunded++;
      } else {
        if (period.paid !== period.foodDue + period.boardingDue || !period.paymentId || transactions.get(period.paymentId)?.index !== period.ledgerCursor || unfunded >= 2) throw new Error('Invalid funded pet care');
        payment(period.paymentId, period.ownerId, period.currency, period.paid, 'pet-care', date); unfunded = 0;
      }
      if (unfunded > 2 || period.boardingDue > 0n && period.carerId || period.care === 'boarding' && !period.boardingDue || period.care === 'owner' && (period.carerId !== period.ownerId || period.boardingDue) || period.care === 'family' && (!period.carerId || period.carerId === period.ownerId || period.boardingDue) || period.carerId && (!aliveAt(period.carerId, date) || ageOn({ ...world.people[period.carerId], died: null }, date) < 18)) throw new Error('Invalid monthly pet carer');
    });
    if (pet.unfundedMonths !== unfunded || unfunded >= 2 && pet.status !== 'rehomed') throw new Error('Pet unfunded care outcome is inconsistent');
    const vetMonths = new Set<number>();
    for (const visit of pet.visits) {
      const at = month(visit.date);
      if (vetMonths.has(at) || compareDates(visit.date, pet.adopted) < 0 || compareDates(visit.date, world.date) > 0 || pet.ended && compareDates(visit.date, pet.ended) > 0 || !aliveAt(visit.personId, visit.date) || !pet.owners.some(item => item.personId === visit.ownerId && compareDates(item.since, visit.date) <= 0 && (!item.ended || compareDates(item.ended, visit.date) >= 0)) || (visit.roll <= 90) !== visit.successful) throw new Error('Invalid veterinary visit');
      const location = locationAt(visit.date, transactions.get(visit.paymentId)?.index ?? -1);
      if (visit.country !== location.country || visit.city !== location.city || visit.currency !== countries[visit.country].currency || visit.paid !== petVetCost(visit.country)) throw new Error('Invalid veterinary fee');
      payment(visit.paymentId, visit.ownerId, visit.currency, visit.paid, 'pet-vet', visit.date); vetMonths.add(at);
    }
    if (pet.lastVetMonth !== (pet.visits.length ? month(pet.visits.at(-1)!.date) : null)) throw new Error('Invalid veterinary cursor');
    let country = adoption.country, city = adoption.city, previousMove = pet.adopted;
    const moveIds = new Set<string>();
    for (const move of pet.moves) {
      const relocation = world.relocations.find(item => item.id === move.relocationId), paymentRow = transactions.get(move.transactionId)?.row;
      if (!relocation?.move || moveIds.has(move.relocationId) || relocation.personId !== move.payerId || !relocation.move.participantIds.includes(move.ownerId) || compareDates(move.date, relocation.move.date) !== 0 || compareDates(move.date, previousMove) < 0 || move.fromCountry !== country || move.fromCity !== city || move.currency !== countries[move.fromCountry].currency || move.fee !== roundRatio(rules[move.fromCountry].baseWage, 200n) || !paymentRow || paymentRow.personId !== move.payerId || paymentRow.category !== 'relocation-transport' || paymentRow.currency !== move.currency || paymentRow.cashDelta !== -relocation.move.quote.transport || !relocation.move.transactionIds.includes(paymentRow.id) || move.country !== world.people[move.ownerId]?.country && pet.status === 'active' && move === pet.moves.at(-1)) throw new Error('Pet transport does not reconcile with the actual move');
      const destination = relocation.move, location = destinations[relocation.destinationId];
      if (move.country !== location.country || move.city !== location.city) throw new Error('Pet transport destination differs from the household move');
      if (!destination.participantIds.includes(move.ownerId) || !pet.owners.some(item => item.personId === move.ownerId && compareDates(item.since, move.date) <= 0 && (!item.ended || compareDates(item.ended, move.date) >= 0))) throw new Error('Pet move lacks its responsible owner');
      moveIds.add(move.relocationId); country = move.country; city = move.city; previousMove = move.date;
    }
    if (pet.country !== country || pet.city !== city) throw new Error('Pet location lacks its transport history');
  }
  for (const row of world.ledger) if (['pet-adoption', 'pet-care', 'pet-vet'].includes(row.category) && !payments.has(row.id)) throw new Error('Pet ledger entry lacks its actual care history');
  for (const relocation of world.relocations.filter(item => item.move)) {
    const fees = world.pets.flatMap(pet => pet.moves.filter(move => move.relocationId === relocation.id)).reduce((sum, item) => sum + item.fee, 0n);
    if (fees > relocation.move!.quote.transport) throw new Error('Pet transport fees exceed the paid move');
  }
}
