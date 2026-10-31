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
import { prepared } from '../helpers/lifestyleStories';

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
