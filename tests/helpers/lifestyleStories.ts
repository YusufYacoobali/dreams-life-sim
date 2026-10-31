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
export function prepared(template: LifestyleTemplate) {
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