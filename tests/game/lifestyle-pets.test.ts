import { randomInteger } from '../../src/game/random';
import { lifestyleFixture, act, buyLifestyle } from '../helpers/lifestyle';
import { decodeWorld, encodeWorld, validateWorld } from '../../src/game/model';
import { petOffers, petOfferIds, petTrait } from '../../src/game/content/pets';
import { petAdoptionFee, petAdoptionOwner, petAdoptionReason, petMonth, petAgeMonths } from '../../src/game/systems/pets';
import { petActivityCost, companionMonth, petActivityReason } from '../../src/game/systems/petTraining';
import { monthFrom } from '../../src/game/calendar';
import { accountFor } from '../../src/game/systems/common';
function adopted(offerId: typeof petOfferIds[number] = 'jet') { const world = lifestyleFixture(); return act(world, { type: 'adopt-pet', offerId, name: petOffers[offerId].name, reviewedOwnerId: petAdoptionOwner(world)!.id, quotedFee: petAdoptionFee(world, offerId) }); }
test.each(petOfferIds.filter(id => id !== 'maple'))('%s has a consistent saved personality, proper species and real adoption payment', id => { const world = adopted(id), pet = world.pets.at(-1)!; expect(pet.species).toBe(petOffers[id].species); expect(pet.companion?.trait).toBe(petTrait(id)); expect(decodeWorld(encodeWorld(world))).toEqual(world); expect(world.ledger.find(row => row.id === pet.adoptionTransactionId)?.cashDelta).toBe(-petAdoptionFee(world, id)); });
test('training is earned once per month, saved across cold reload and refuses invented progress', () => { let world = adopted(), pet = world.pets.at(-1)!; world = act(world, { type: 'pet-activity', petId: pet.id, activity: 'train', otherId: null, quotedFee: 0n, reviewedOwnerId: pet.ownerId }); pet = world.pets.at(-1)!; expect([2, 8]).toContain(pet.companion!.training); expect(() => act(decodeWorld(encodeWorld(world)), { type: 'pet-activity', petId: pet.id, activity: 'train', otherId: null, quotedFee: 0n, reviewedOwnerId: pet.ownerId })).toThrow(/per pet/); const tampered = decodeWorld(encodeWorld(world)); tampered.pets.at(-1)!.companion!.training++; expect(() => validateWorld(tampered)).toThrow(/training/); });
test('small habitat animals cannot be forced into walks or training competitions', () => { const world = adopted('admiral'), pet = world.pets.at(-1)!; for (const activity of ['train', 'outing', 'competition'] as const)
    expect(() => act(world, { type: 'pet-activity', petId: pet.id, activity, otherId: null, quotedFee: petActivityCost(world, pet, activity), reviewedOwnerId: pet.ownerId })).toThrow(/species|habitat/); });
test('horse adoption needs actual suitable household grounds and never removes existing pets', () => { let world = lifestyleFixture(); expect(petAdoptionReason(world, 'maple')).toMatch(/grounds/); world = buyLifestyle(world, 'country-estate'); world = act(world, { type: 'adopt-pet', offerId: 'maple', name: 'Maple', reviewedOwnerId: world.activePersonId, quotedFee: petAdoptionFee(world, 'maple') }); expect(world.pets.at(-1)!.species).toBe('horse'); expect(decodeWorld(encodeWorld(world))).toEqual(world); });
test('paid additional treatment saves an actual outcome and ended pets never receive further care charges', () => { let world = adopted(); world.pets.at(-1)!.companion!.condition = 'minor-injury'; const pet = world.pets.at(-1)!, cost = petActivityCost(world, pet, 'treat'), cash = accountFor(world).cash; world = act(world, { type: 'pet-activity', petId: pet.id, activity: 'treat', otherId: null, quotedFee: cost, reviewedOwnerId: pet.ownerId }); expect(accountFor(world).cash).toBe(cash - cost); expect(world.lifestyle!.records.at(-1)!.outcomeRoll).toBeGreaterThan(0); world = act(world, { type: 'rehome-pet', petId: pet.id }); const ledger = world.ledger.length; world.date = monthFrom(world.date, 1); petMonth(world); expect(world.ledger.length).toBe(ledger); expect(world.pets.at(-1)!.status).toBe('rehomed'); });

test('age-related treatment improves comfort without claiming a cure or resetting age', () => {
    let world = adopted('milo');
    const healthySeed = Array.from({ length: 1000 }, (_, index) => index + 1).find(seed => randomInteger(seed, 1, 100).value > 10)!;
    const ageSeed = Array.from({ length: 1000 }, (_, index) => index + 1).find(seed => randomInteger(seed, 1, 100).value === 5)!;
    const month = () => { world.date = monthFrom(world.date, 1); world.random.outcomes = healthySeed; petMonth(world); companionMonth(world); };
    while (petAgeMonths(world, world.pets.at(-1)!) < Math.ceil(world.pets.at(-1)!.lifespanMonths * 4 / 5)) month();
    world.date = monthFrom(world.date, 1); world.random.outcomes = ageSeed; petMonth(world); companionMonth(world);
    expect(world.pets.at(-1)!.companion!.condition).toBe('ageing');
    const pet = world.pets.at(-1)!, born = { ...pet.born }; world.random.outcomes = healthySeed;
    world = act(world, { type: 'pet-activity', petId: pet.id, activity: 'treat', otherId: null, quotedFee: petActivityCost(world, pet, 'treat'), reviewedOwnerId: pet.ownerId });
    expect(world.pets.at(-1)!.companion!.recovery).toBe(3);
    for (let index = 0; index < 3; index++) month();
    expect(world.pets.at(-1)!.companion).toMatchObject({ healthVersion: 2, condition: 'ageing', ageRelated: true, recovery: 0 });
    expect(world.pets.at(-1)!.born).toEqual(born);
    expect(petActivityReason(world, world.pets.at(-1)!, 'treat')).toMatch(/remains current/);
    expect(decodeWorld(encodeWorld(world))).toEqual(world);
});
