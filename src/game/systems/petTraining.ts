import { z } from 'zod';
import type { World } from '../model';
import { countries } from '../countries';
import { rules } from '../rules';
import { IneligibleAction } from '../errors';
import { petTrait, type PetSpecies } from '../content/pets';
import { active, accountFor, availableCash, bounded, draw, fact, result } from './common';
import { householdPets, type Pet } from './petSchemas';
import { contactConsent, lifestyleMonthNumber as month, lifestylePayment, lifestyleState, localContactReason, nameOf, recordLifestyle, requireLifestyle } from './lifestyleCommon';
import { petCareReason } from './pets';
export const petActivities = ['train', 'trick', 'groom', 'outing', 'quiet', 'introduce', 'competition', 'treat', 'prevent', 'family'] as const;
export const petTrainingCommandSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('enable-pet-training'), petId: z.string() }).strict(),
    z.object({ type: z.literal('pet-activity'), petId: z.string(), activity: z.enum(petActivities), otherId: z.string().nullable(), quotedFee: z.bigint().nonnegative(), reviewedOwnerId: z.string() }).strict(),
]);
export type PetTrainingCommand = z.infer<typeof petTrainingCommandSchema>;
import { newCompanion } from './petLifestyleState';
const trainable = (species: PetSpecies) => species !== 'fish' && species !== 'turtle' && species !== 'hamster';
export function petActivityCost(world: World, pet: Pet, activity: typeof petActivities[number]) { return (activity === 'treat' ? rules[pet.country].baseWage / 800n : activity === 'prevent' ? rules[pet.country].baseWage / 2000n : activity === 'competition' ? rules[pet.country].baseWage / 5000n : 0n); }
export function petActivityReason(world: World, pet: Pet, activity: typeof petActivities[number], otherId: string | null = null) {
    if (!world.lifestyle)
        return 'Review and enable lifestyle features first';
    const base = petCareReason(world, pet, 'feed');
    if (base && !base.includes('already done'))
        return base;
    if (!pet.companion)
        return 'Review expanded pet activities first';
    if (world.actionCounts[world.activePersonId + ':pet-activity:' + pet.id + ':' + activity + ':' + month(world)])
        return 'One of this activity per pet each month';
    if ((activity === 'train' || activity === 'trick' || activity === 'competition') && !trainable(pet.species))
        return 'Choose quiet company, habitat care or gentle play for this species';
    if ((activity === 'train' || activity === 'trick' || activity === 'competition' || activity === 'outing') && (pet.illness !== 'none' || pet.companion.condition === 'minor-injury' || pet.companion.condition === 'recovering'))
        return 'Allow your companion to recover before strenuous activities';
    if (activity === 'trick' && (pet.companion.training < 25 * (pet.companion.tricks.length + 1) || pet.companion.tricks.length >= (pet.species === 'parrot' || pet.species === 'dog' ? 4 : 2)))
        return 'Build more training before another species-appropriate trick';
    if (activity === 'outing' && !['dog', 'horse'].includes(pet.species))
        return 'This pet is safer enjoying its familiar habitat';
    if (activity === 'competition' && (pet.companion.training < 40 || pet.companion.lastCompetitionYear === world.date.year))
        return 'Build 40 training; one small pet event per calendar year';
    if (activity === 'introduce' && (!otherId || !householdPets(world).some(other => other.id === otherId && other.id !== pet.id && other.species === pet.species)))
        return 'Choose another household companion of the same species for a supervised introduction';
    if (activity === 'family' && (!otherId || localContactReason(world, otherId, true) || world.people[otherId]?.householdId !== active(world).householdId))
        return 'Choose an available member of your own household';
    if ((activity === 'treat' || activity === 'prevent') && pet.ownerId !== world.activePersonId)
        return 'The responsible adult must review and fund this care';
    if (activity === 'treat' && pet.companion.condition === 'ageing' && (pet.companion.supportUntil ?? 0) > month(world)) return 'The existing age-related comfort plan remains current';
    if (activity === 'treat' && ['well', 'recovering'].includes(pet.companion.condition))
        return 'There is no untreated additional condition';
    if (activity === 'prevent' && pet.companion.preventionUntil > month(world))
        return 'Preventive care remains current';
    if (availableCash(accountFor(world, world.people[pet.ownerId], countries[pet.country].currency)) < petActivityCost(world, pet, activity))
        return 'The responsible owner cannot cover this care';
    if (active(world).stats.energy < 4)
        return 'Rest before spending active time together';
}
export function resolvePetTraining(world: World, command: PetTrainingCommand) {
    requireLifestyle(world, false);
    const pet = world.pets.find(row => row.id === command.petId);
    if (!pet || pet.status !== 'active' || !householdPets(world).some(row => row.id === pet.id))
        throw new IneligibleAction('Choose an active household companion');
    if (command.type === 'enable-pet-training') {
        if (pet.companion)
            throw new IneligibleAction('Expanded activities are already enabled');
        pet.companion = newCompanion(world, pet);
        fact(world, 'I reviewed expanded care and training for ' + pet.name + '. Existing care and histories remain.', 'pet');
        result(world, 'More time together', 'Your companion’s additional personality is fixed from their adoption profile. Existing automatic care, health, lifespan, bonds and ownership stay on record.', 'pet-paw');
        return;
    }
    const reason = petActivityReason(world, pet, command.activity, command.otherId);
    if (reason)
        throw new IneligibleAction(reason);
    const life = pet.companion!, person = active(world), owner = world.people[pet.ownerId], cost = petActivityCost(world, pet, command.activity);
    if (command.quotedFee !== cost || command.reviewedOwnerId !== owner.id)
        throw new IneligibleAction('Review the actual owner and cost');
    if (cost && owner.id !== person.id)
        throw new IneligibleAction('The responsible owner must review paid optional activities');
    world.actionCounts[person.id + ':pet-activity:' + pet.id + ':' + command.activity + ':' + month(world)] = 1;
    const family = command.activity === 'family' ? world.people[command.otherId!] : undefined, consent = family ? contactConsent(world, family) : { chance: 100, roll: 100, accepted: true };
    let paymentIds: string[] = [], paid = 0n, body: string, before = life.training, after = before, outcomeChance: number | undefined, outcomeRoll: number | undefined, success: boolean | undefined;
    if (!consent.accepted)
        body = nameOf(world, family!.id) + ' did not join my planned time with ' + pet.name + '. No shared pet memory was invented.';
    else {
        paymentIds = lifestylePayment(world, cost, 'Pet ' + command.activity, countries[pet.country].currency, owner);
        paid = cost;
        pet.bonds[person.id] = bounded((pet.bonds[person.id] ?? 0) + (life.trait === 'affectionate' || life.trait === 'loyal' ? 5 : 3));
        pet.happiness = bounded(pet.happiness + 3);
        person.stats.energy = bounded(person.stats.energy - 4);
        if (command.activity === 'train') {
            const chance = Math.min(95, 50 + Math.floor((pet.bonds[person.id] ?? 0) / 3) + (life.trait === 'stubborn' ? -15 : life.trait === 'energetic' ? 10 : 0)), roll = draw(world, 'outcomes', 1, 100);
            outcomeChance = chance;
            outcomeRoll = roll;
            success = roll <= chance;
            life.training = bounded(life.training + (success ? 8 : 2));
            after = life.training;
            body = 'I trained ' + pet.name + '. ' + (roll <= chance ? 'The cue finally made sense to both of us.' : life.trait === 'stubborn' ? 'They considered my request and proposed sitting elsewhere.' : 'We made a little progress, then stopped before frustration took over.');
        }
        else if (command.activity === 'trick') {
            const tricks = pet.species === 'dog' ? ['recall', 'settle', 'target', 'retrieve'] as const : pet.species === 'parrot' ? ['target', 'retrieve', 'settle', 'recall'] as const : ['target', 'settle'] as const;
            const trick = tricks[life.tricks.length];
            life.tricks.push(trick);
            body = 'I taught ' + pet.name + ' a species-appropriate ' + trick + ' cue. We finished while they still wanted to participate.';
        }
        else if (command.activity === 'groom') {
            pet.happiness = bounded(pet.happiness + (life.trait === 'nervous' ? 1 : 4));
            body = 'I ' + (pet.species === 'fish' || pet.species === 'turtle' ? 'cleaned the habitat for ' : 'gently groomed ') + pet.name + '. Routine feeding and basic care continue automatically.';
        }
        else if (command.activity === 'outing')
            body = 'I took ' + pet.name + ' for a suitable supervised outing. ' + (life.trait === 'energetic' ? 'They investigated every smell as if the world had been rewritten overnight.' : 'We let the slower companion set the pace.');
        else if (command.activity === 'quiet') {
            if (life.condition === 'anxiety') {
                pet.happiness = bounded(pet.happiness + 4);
            }
            body = 'I sat quietly with ' + pet.name + '. ' + (life.trait === 'nervous' ? 'Eventually they came closer without being asked.' : 'There was nothing to achieve. We stayed anyway.');
        }
        else if (command.activity === 'introduce') {
            const other = world.pets.find(row => row.id === command.otherId)!;
            const chance = 60 + Math.floor(life.training / 5) - (life.trait === 'nervous' ? 10 : 0), roll = draw(world, 'outcomes', 1, 100), settled = roll <= chance; outcomeChance = chance; outcomeRoll = roll; success = settled;
            pet.happiness = bounded(pet.happiness + (settled ? 3 : -2));
            other.happiness = bounded(other.happiness + (settled ? 3 : -2));
            body = 'I supervised an introduction between ' + pet.name + ' and ' + other.name + '. ' + (settled ? 'They tolerated sharing the room. We ended on that small victory.' : 'They wanted separate space. I separated them without forcing a friendship.');
        }
        else if (command.activity === 'competition') {
            life.lastCompetitionYear = world.date.year;
            const roll = draw(world, 'outcomes', 1, 100), recognized = roll <= Math.min(90, Math.floor(life.training / 2 + (pet.bonds[person.id] ?? 0) / 4));
            outcomeChance = Math.min(90, Math.floor(life.training / 2 + (pet.bonds[person.id] ?? 0) / 4));
            outcomeRoll = roll;
            success = recognized;
            body = pet.name + ' entered a small companion event. ' + (recognized ? 'Their training earned a rosette. They remained much more interested in the bag it came in.' : 'We finished the course in a fairly original order. Other owners applauded our persistence.');
            person.stats.happiness = bounded(person.stats.happiness + (recognized ? 5 : 2));
        }
        else if (command.activity === 'treat') {
            const roll = draw(world, 'outcomes', 1, 100), worked = roll <= 85;
            outcomeChance = 85;
            outcomeRoll = roll;
            success = worked;
            if (worked) {
                if (life.healthVersion === 2 && life.condition === 'ageing') { life.ageRelated = true; life.supportUntil = month(world) + 15; }
                life.condition = 'recovering';
                life.recovery = 3;
            }
            body = 'I paid for veterinary care for ' + pet.name + '. ' + (worked ? 'A treatment plan began; three funded care months are needed for recovery. Ageing itself cannot be cured.' : 'The treatment did not resolve the condition. A later month permits another review.');
        }
        else if (command.activity === 'prevent') {
            life.preventionUntil = month(world) + 12;
            body = 'I paid for preventive care for ' + pet.name + '. It reduces minor-illness risk for twelve months without stopping ageing.';
        }
        else {
            pet.bonds[family!.id] = bounded((pet.bonds[family!.id] ?? 0) + 8);
            body = nameOf(world, family!.id) + ' joined me for gentle time with ' + pet.name + '. Their own bond with our companion grew.';
        }
    }
    recordLifestyle(world, { kind: 'pet-' + command.activity, ...(family ? { invitedId: family.id } : {}), ...(command.activity === 'introduce' && command.otherId ? { relatedPetId: command.otherId } : {}), subjectId: pet.id, currency: countries[pet.country].currency, participants: [person.id, ...(consent.accepted && family ? [family.id] : [])], ...consent, paid, paymentIds, before, after, ...(outcomeChance !== undefined ? { outcomeChance, outcomeRoll, success } : {}), body });
    result(world, consent.accepted ? 'Time with ' + pet.name : 'Another time', body, command.activity === 'competition' ? 'pet-rosette' : 'pet-' + pet.species);
}
/** Uses the actual saved care-period draw; existing pets never gain new obligations. */
export function companionMonth(world: World) {
    if (!world.lifestyle)
        return;
    const current = month(world);
    for (const pet of world.pets) {
        const life = pet.companion;
        if (!life || pet.status !== 'active' || life.lastHealthMonth >= current)
            continue;
        life.lastHealthMonth = current;
        const period = pet.periods.at(-1);
        if (!period || period.month !== current || period.care === 'unfunded')
            continue;
        if (life.condition === 'recovering') {
            life.recovery--;
            if (!life.recovery)
                life.condition = life.healthVersion === 2 && life.ageRelated ? 'ageing' : 'well';
        }
        else if (life.condition === 'well' && current >= life.preventionUntil) {
            if (period.healthRoll === 3)
                life.condition = 'minor-injury';
            else if (period.healthRoll === 4 && life.trait === 'nervous')
                life.condition = 'anxiety';
            else if (current - (pet.born.year * 12 + pet.born.month - 1) >= pet.lifespanMonths * 4 / 5 && period.healthRoll <= 10)
                { life.condition = 'ageing'; if (life.healthVersion === 2) life.ageRelated = true; }
        }
        // Additional problems affect comfort/behaviour, not sudden mandatory vet costs or death.
        if (life.condition !== 'well' && !(life.condition === 'ageing' && (life.supportUntil ?? 0) > current))
            pet.happiness = bounded(pet.happiness - (life.condition === 'anxiety' ? 1 : 2));
        if (period.carerId && period.care === 'family')
            pet.bonds[period.carerId] = bounded((pet.bonds[period.carerId] ?? 0) + 1);
    }
}
