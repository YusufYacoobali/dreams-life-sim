import { companionMonth } from '../../src/game/systems/petTraining';
import { randomInteger } from '../../src/game/random';
import { lifestyleFixture, act, buyLifestyle } from '../helpers/lifestyle';
import { lifestyleTemplates, type LifestyleTemplate } from '../../src/game/content/lifestyleEvents';
import { offerLifestyleStory } from '../../src/game/systems/lifestyleStories';
import { ownHousehold } from '../../src/game/systems/households';
import { decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { askingRent } from '../../src/game/systems/landlordTenancies';
import { amenityQuote } from '../../src/game/systems/propertyAmenities';
import { licenceFee } from '../../src/game/systems/vehicleLicences';
import { vehicleActivityCost } from '../../src/game/systems/vehicleActivities';
import { petAdoptionFee, petMonth } from '../../src/game/systems/pets';
import { petOffers, petOfferIds, petTrait } from '../../src/game/content/pets';
import { hobbyFee, leisureMonth } from '../../src/game/systems/leisure';
import { accountFor } from '../../src/game/systems/common';
import { monthFrom } from '../../src/game/calendar';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
/** Explicit eligibility fixtures. These are not claimed as natural playthroughs. */
function prepared(template: LifestyleTemplate) {
    let world = lifestyleFixture();
    const parent = Object.values(world.people).find(person => person.id !== world.activePersonId && !person.died)!;
    ownHousehold(world, world.people[world.activePersonId], [parent.id]);
    if (template.domain === 'property') {
        world = buyLifestyle(world, template.amenity === 'pool' ? 'modern-villa' : 'family-house');
        const id = world.assets.at(-1)!.id;
        world = act(world, { type: 'enable-property-management', assetId: id });
        if (template.amenity === 'garden')
            world = act(world, { type: 'install-amenity', assetId: id, amenity: 'garden', quotedCost: amenityQuote(world.assets.at(-1)!, 'garden').cost });
        if (template.when === 'insured')
            world = act(world, { type: 'insure', assetId: id, enabled: true });
        if (template.when === 'tenant') {
            world = act(world, { type: 'find-tenants', assetId: id, quotedRent: askingRent(world.assets.at(-1)!) });
            const app = world.lifestyle!.applications.find(row => row.funds >= askingRent(world.assets.at(-1)!) * 2n)!;
            world = act(world, { type: 'review-tenant', applicationId: app.id, action: 'accept', quotedDeposit: world.assets.at(-1)!.rentPerMonth });
        }
        return { world, id };
    }
    if (template.domain === 'vehicle') {
        world = buyLifestyle(world, template.when === 'vintage' ? 'vintage-roadster' : 'used-compact');
        const id = world.assets.at(-1)!.id;
        world = act(world, { type: 'enable-vehicle-activities', assetId: id });
        if (template.when === 'insured')
            world = act(world, { type: 'insure', assetId: id, enabled: true });
        if (template.when === 'used') {
            world = act(world, { type: 'take-licence-test', kind: 'road', answers: [1, 2, 0], quotedFee: licenceFee(world, 'road') });
            world = act(world, { type: 'vehicle-activity', assetId: id, activity: 'drive', contactId: null, quotedCost: vehicleActivityCost(world, world.assets.at(-1)!, 'drive') });
        }
        if (template.when === 'damaged')
            world.assets.at(-1)!.condition = 60;
        return { world, id };
    }
    if (template.domain === 'pet') {
        const offerId = petOfferIds.find(id => (!template.species || petOffers[id].species === template.species) && (!template.trait || petTrait(id) === template.trait))!;
        if (offerId === 'maple')
            world = buyLifestyle(world, 'country-estate');
        world = act(world, { type: 'adopt-pet', offerId, name: petOffers[offerId].name, reviewedOwnerId: world.activePersonId, quotedFee: petAdoptionFee(world, offerId) });
        const pet = world.pets.at(-1)!;
        if (template.when === 'unwell')
            pet.companion!.condition = 'minor-injury';
        if (template.when === 'trained') {
            for (let i = 0; world.pets.at(-1)!.companion!.training < 25 && i < 20; i++) {
                world.people[world.activePersonId].stats.energy = 100;
                world.random.outcomes = 1;
                world = act(world, { type: 'pet-activity', petId: pet.id, activity: 'train', otherId: null, quotedFee: 0n, reviewedOwnerId: pet.ownerId });
                if (world.pets.at(-1)!.companion!.training >= 25)
                    break;
                world.date = monthFrom(world.date, 1);
                world.random.outcomes = Array.from({ length: 100 }, (_, index) => index + 1).find(seed => randomInteger(seed, 1, 100).value > 10)!;
                petMonth(world);
                companionMonth(world);
            }
        }
        return { world, id: pet.id };
    }
    const kind = template.hobby ?? 'writing';
    world = act(world, { type: 'hobby-plan', kind, mode: 'community', reviewedPayerId: world.activePersonId, quotedMonthlyFee: hobbyFee(world.people[world.activePersonId].country, kind, 'community') });
    for (let i = 0; i < (template.when === 'skilled' ? 20 : 12); i++) {
        world.people[world.activePersonId].stats.energy = 100;
        world.date = monthFrom(world.date, 1);
        leisureMonth(world);
    }
    if (template.when === 'peer')
        world = act(world, { type: 'meet-hobby-peer', hobbyId: world.hobbies[0].id, planId: world.hobbies[0].plans.at(-1)!.id, reviewedPayerId: world.activePersonId, reviewedMonth: world.date.year * 12 + world.date.month - 1 });
    if (template.when === 'project')
        world = act(world, { type: 'start-hobby-project', hobbyId: world.hobbies[0].id, title: 'A real personal project' });
    return { world, id: world.hobbies[0].id };
}
test('sixty distinct situations are balanced across the four existing systems', () => { expect(lifestyleTemplates).toHaveLength(60); expect(new Set(lifestyleTemplates.map(row => row.id)).size).toBe(60); expect(Object.fromEntries(['property', 'vehicle', 'pet', 'hobby'].map(domain => [domain, lifestyleTemplates.filter(row => row.domain === domain).length]))).toEqual({ property: 12, vehicle: 12, pet: 18, hobby: 18 }); });
test.each(lifestyleTemplates.flatMap(template => template.choices.map(choice => [template.id, choice.id] as const)))('%s / %s binds real context, saves exact terms and applies only its actual choice', (templateId, choiceId) => { const template = lifestyleTemplates.find(row => row.id === templateId)!; const initial = prepared(template); const world = validateWorld(initial.world); expect(offerLifestyleStory(world, template.id, initial.id, true)).toBe(true); const saved = decodeWorld(encodeWorld(world)); expect(saved.pending?.kind).toBe('decision'); if (saved.pending?.kind !== 'decision')
    throw Error('Expected decision'); expect(saved.pending.body).not.toMatch(/\{(?:subject|person|project)\}/); const choice = saved.pending.choices.find(choice => choice.id === choiceId)!; expect(choiceUnavailable(saved, choice)).toBeUndefined(); const outcome = act(saved, { type: 'choose', eventId: saved.pending.id, choiceId }); expect(outcome.lifestyle!.offers.at(-1)!.status).toBe('resolved'); expect(decodeWorld(encodeWorld(outcome))).toEqual(outcome); expect(() => act(outcome, { type: 'choose', eventId: saved.pending!.id, choiceId })).toThrow(/no longer open/); });
test('changed ownership cancels the saved situation without substituting a new asset or spending', () => { const { world, id } = prepared(lifestyleTemplates.find(row => row.id === 'home-lock-trouble')!); expect(offerLifestyleStory(world, 'home-lock-trouble', id, true)).toBe(true); world.assets.at(-1)!.ownerId = null; world.assets.at(-1)!.primaryHome = false; for (const household of world.households)
    if (household.homeAssetId === id)
        household.homeAssetId = null; const before = accountFor(world).cash; if (world.pending?.kind !== 'decision')
    throw Error('Expected decision'); const next = act(world, { type: 'choose', eventId: world.pending.id, choiceId: 'fix' }); expect(next.lifestyle!.offers.at(-1)!.status).toBe('cancelled'); expect(accountFor(next).cash).toBe(before); });

test('literal player-written pet names cannot act as replacement patterns or participant placeholders', () => {
    const template = lifestyleTemplates.find(row => row.id === 'pet-turtle-arrival')!;
    const { world, id } = prepared(template); world.pets.find(pet => pet.id === id)!.name = 'Pebble $& {person}';
    expect(offerLifestyleStory(world, template.id, id, true)).toBe(true);
    expect(world.pending?.body).toContain('Pebble $& {person}');
    expect(decodeWorld(encodeWorld(world))).toEqual(world);
});


test('a full activity history cannot create an unresolvable new situation or consume randomness', () => {
    const { world, id } = prepared(lifestyleTemplates.find(row => row.id === 'home-lock-trouble')!);
    world.lifestyle!.records.length = 4096;
    const random = { ...world.random };
    expect(offerLifestyleStory(world, 'home-lock-trouble', id, true)).toBe(false);
    expect(world.random).toEqual(random);
    expect(world.pending).toBeNull();
});
