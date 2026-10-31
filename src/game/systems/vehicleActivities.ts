import { vehicleMinimumAge } from './vehicleAgePolicy';
import { ageOn } from '../personHelpers';
import { parentOf } from './travel';
import { completeAssetSale, resolveAssets, saleQuote } from './assets';
import { assetPrice } from './assetPricing';
import { z } from 'zod';
import type { World } from '../model';
import { assetCatalog } from '../content/assets';
import { countries } from '../countries';
import { IneligibleAction } from '../errors';
import { licenceKinds } from './lifestyleSchemas';
import { accountFor, active, availableCash, bounded, draw, fact, post, result } from './common';
import { hasLicence, licenceFee, licenceQuiz, licenceReason } from './vehicleLicences';
import { contactConsent, lifestyleMonthNumber as month, lifestylePayment, lifestyleReason, lifestyleState, localContactReason, nameOf, recordLifestyle, requireLifestyle, sharedMemory } from './lifestyleCommon';
import { homeAmenity } from './propertyAmenities';
import { stolenAssetReason } from './stolenVehicles';
export const vehicleActivities = ['drive', 'road-trip', 'service', 'repair', 'customise', 'brakes', 'suspension', 'navigation', 'gift', 'scrap'] as const;
export const vehicleCommandSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('take-licence-test'), kind: z.enum(licenceKinds), answers: z.array(z.number().int().min(0).max(2)).length(3), quotedFee: z.bigint().positive() }).strict(),
    z.object({ type: z.literal('trade-in-vehicle'), assetId: z.string(), catalogId: z.string(), quotedSale: z.bigint().nonnegative(), quotedPrice: z.bigint().positive() }).strict(),
    z.object({ type: z.literal('enable-vehicle-activities'), assetId: z.string() }).strict(),
    z.object({ type: z.literal('vehicle-activity'), assetId: z.string(), activity: z.enum(vehicleActivities), contactId: z.string().nullable(), quotedCost: z.bigint().nonnegative() }).strict(),
]);
export type VehicleCommand = z.infer<typeof vehicleCommandSchema>;
export const vehicleLicenceKind = (asset: Pick<World['assets'][number], 'catalogId'>) => assetCatalog.find(row => row.id === asset.catalogId)?.licenceKind ?? 'road';
/** Earlier activity sessions retain their v1 distance policy when this revision is absent. */
export function vehicleTripDistance(asset: World['assets'][number], activity: 'drive' | 'road-trip') {
    if (asset.vehicleLife?.usageVersion !== 2) return activity === 'road-trip' ? 300 : 40;
    const kind = vehicleLicenceKind(asset), range = assetCatalog.find(row => row.id === asset.catalogId)?.rangeMiles;
    const desired = kind === 'boat' ? activity === 'drive' ? 12 : 60 : kind === 'pilot' ? activity === 'drive' ? 120 : 400 : activity === 'drive' ? 40 : 300;
    return kind !== 'road' && range ? Math.min(desired, Math.floor(range * 0.7)) : desired;
}
export function vehicleActivityCost(world: World, asset: World['assets'][number], activity: typeof vehicleActivities[number]) { const base = asset.pricePaid || asset.costBasis || asset.value || 1n; if (activity === 'gift' || activity === 'scrap')
    return 0n; if (activity === 'drive' || activity === 'road-trip') {
    const distance = vehicleTripDistance(asset, activity), classMultiplier = vehicleLicenceKind(asset) === 'pilot' ? 8n : vehicleLicenceKind(asset) === 'boat' ? 3n : 1n;
    return (base * BigInt(distance) * classMultiplier / 40000n) || 1n;
} if (activity === 'service')
    return (base * (homeAmenity(world, 'garage') && asset.country === active(world).country && asset.city === active(world).city ? 85n : 100n) / 10000n) || 1n; if (activity === 'repair')
    return base * BigInt(Math.min(30, 100 - asset.condition)) / 1000n || 1n; if (activity === 'customise')
    return base / 100n || 1n; return base / 20n || 1n; }
export function vehicleUseReason(world: World, asset: Pick<World['assets'][number], 'catalogId'>) {
    const reason = lifestyleReason(world, false); if (reason) return reason;
    const minimum = vehicleMinimumAge(active(world).country, vehicleLicenceKind(asset));
    if (ageOn(active(world), world.date) < minimum) return 'Game policy: available from age ' + minimum;
}
export function vehicleActivityReason(world: World, asset: World['assets'][number], activity: typeof vehicleActivities[number], contactId: string | null = null) {
    const common = vehicleUseReason(world, asset) ?? (activity === 'gift' || activity === 'scrap' ? lifestyleReason(world) : undefined);
    if (common)
        return common;
    if (asset.ownerId !== world.activePersonId || asset.kind !== 'vehicle')
        return 'Choose your own vehicle';
    if (stolenAssetReason(asset))
        return stolenAssetReason(asset);
    if (!asset.vehicleLife)
        return 'Review vehicle activities first';
    if (asset.country !== active(world).country || asset.city !== active(world).city)
        return 'Return to the vehicle’s registered city';
    if (contactId && !['drive', 'road-trip', 'gift'].includes(activity)) return 'Only trips and vehicle gifts can include an invitation';
    if (contactId) {
        const reason = localContactReason(world, contactId, activity !== 'gift');
        if (reason)
            return reason;
        const contact = world.people[contactId];
        if (ageOn(contact, world.date) < 18 && (contact.householdId !== active(world).householdId || !parentOf(world, world.activePersonId, contactId)))
            return 'A child passenger must be your actual co-resident child';
    }
    if (activity === 'drive' || activity === 'road-trip') {
        if (!hasLicence(world, vehicleLicenceKind(asset)))
            return 'Pass the appropriate ' + vehicleLicenceKind(asset) + ' licence first';
        if (asset.condition < 35)
            return 'Repair this vehicle before using it';
        if (asset.vehicleLife.lastUseMonth === month(world))
            return 'One recorded trip per vehicle each month';
        if (active(world).stats.energy < (activity === 'road-trip' ? 8 : 4))
            return 'Rest before this journey';
    }
    if (activity === 'service' && asset.vehicleLife.lastServiceMonth !== null && month(world) - asset.vehicleLife.lastServiceMonth < 6)
        return 'Service again after six months';
    if (activity === 'repair' && asset.condition >= 95)
        return 'Already in excellent condition';
    if (['brakes', 'suspension', 'navigation'].includes(activity) && asset.vehicleLife.upgrades.includes(activity as 'brakes' | 'suspension' | 'navigation'))
        return 'This upgrade is already fitted';
    if ((activity === 'brakes' || activity === 'suspension') && vehicleLicenceKind(asset) !== 'road')
        return 'This upgrade is for road vehicles';
    if (activity === 'gift' && (!contactId || asset.mortgageId))
        return 'Select an available adult contact for a debt-free vehicle gift';
    if (activity === 'scrap' && asset.condition > 30)
        return 'Scrapping is reserved for severely damaged vehicles';
    if (availableCash(accountFor(world, active(world), asset.currency)) < vehicleActivityCost(world, asset, activity))
        return 'Insufficient available funds';
}
export function resolveVehicle(world: World, command: VehicleCommand) {
    requireLifestyle(world, false);
    const person = active(world), state = lifestyleState(world), current = month(world);
    if (command.type === 'take-licence-test') {
        const reason = licenceReason(world, command.kind);
        if (reason)
            throw new IneligibleAction(reason);
        if (state.licences.length >= 1024)
            throw new IneligibleAction('The licence history limit has been reached');
        const fee = licenceFee(world, command.kind);
        if (fee !== command.quotedFee)
            throw new IneligibleAction('Review the licence test fee');
        const paymentIds = lifestylePayment(world, fee, 'Game ' + command.kind + ' licence test');
        const score = command.answers.filter((answer, index) => answer === licenceQuiz[command.kind][index].correct).length;
        state.licences.push({ id: 'licence_' + world.revision, personId: person.id, kind: command.kind, country: person.country, date: { ...world.date }, answers: [...command.answers], score, passed: score === 3, fee, paymentId: paymentIds[0] });
        fact(world, 'I ' + (score === 3 ? 'passed' : 'did not pass') + ' the game’s ' + command.kind + ' awareness test (' + score + '/3).', 'vehicle');
        result(world, score === 3 ? 'Ready for the journey' : 'A little more preparation', 'Score: ' + score + '/3. ' + (score === 3 ? 'You passed. The next journey is yours to plan.' : 'The fee stings more than the score. You can try again in a later month, up to three attempts this year.') + ' This is a simplified game system, not real-world certification.', 'vehicle');
        return;
    }
    const asset = world.assets.find(row => row.id === command.assetId && row.ownerId === person.id && row.kind === 'vehicle');
    if (!asset)
        throw new IneligibleAction('Choose your own vehicle');
    if (stolenAssetReason(asset))
        throw new IneligibleAction(stolenAssetReason(asset)!);
    if (command.type === 'enable-vehicle-activities') {
        const reason = vehicleUseReason(world, asset); if (reason) throw new IneligibleAction(reason);
        if (asset.vehicleLife)
            throw new IneligibleAction('Vehicle activities are already enabled');
        const mileage = assetCatalog.find(row => row.id === asset.catalogId)?.listingMileage ?? 0;
        asset.vehicleLife = { version: 1, usageVersion: 2, enabled: { ...world.date }, mileage, initialMileage: mileage, lastServiceMonth: null, appearance: 'original', upgrades: [], lastUseMonth: null };
        asset.provenance.push('Vehicle activities enabled in ' + world.date.year + '; listing mileage carried forward, prior use unknown.');
        result(world, 'More than a parked asset', 'The vehicle is ready for you to make plans. You will need its game licence before setting off, and trips bring running costs and wear.', 'vehicle');
        return;
    }
    if (command.type === 'trade-in-vehicle') {
        requireLifestyle(world);
        if (!asset.vehicleLife || asset.country !== person.country || asset.city !== person.city)
            throw new IneligibleAction('Choose a managed local vehicle');
        const offer = assetCatalog.find(row => row.id === command.catalogId && row.kind === 'vehicle');
        if (!offer || offer.id === asset.catalogId)
            throw new IneligibleAction('Choose a different available vehicle');
        const sale = saleQuote(world, asset);
        if (command.quotedSale !== sale.price || command.quotedPrice !== assetPrice(world, offer))
            throw new IneligibleAction('Review the actual trade-in and purchase prices');
        if (availableCash(accountFor(world, person, asset.currency)) + sale.proceeds < command.quotedPrice)
            throw new IneligibleAction('The trade-in and available cash cannot cover the replacement');
        completeAssetSale(world, asset.id, sale.price);
        resolveAssets(world, { type: 'buy-asset', catalogId: offer.id, financing: 'cash', depositBps: 10000, termMonths: 120, quotedPrice: command.quotedPrice }, false);
        const replacement = world.assets.at(-1)!;
        recordLifestyle(world, { kind: 'vehicle-trade-in', subjectId: asset.id, body: 'I traded in ' + asset.name + ' and purchased ' + replacement.name + '. It was a more expensive conversation than simply admiring the replacement.' });
        result(world, 'A different set of keys', 'You hand over ' + asset.name + ' and take ownership of ' + replacement.name + '. The familiar search for the controls can begin again.', 'vehicle');
        return;
    }
    const reason = vehicleActivityReason(world, asset, command.activity, command.contactId);
    if (reason)
        throw new IneligibleAction(reason);
    const cost = vehicleActivityCost(world, asset, command.activity);
    if (cost !== command.quotedCost)
        throw new IneligibleAction('Review the current vehicle quote');
    const life = asset.vehicleLife!, before = asset.condition, contact = command.contactId ? world.people[command.contactId] : undefined;
    const consent = contact ? contactConsent(world, contact) : { chance: 100, roll: 100, accepted: true };
    let paymentIds: string[] = [], paid = 0n, received = 0n, distance = 0, body: string, narrative: string | undefined, outcomeChance: number | undefined, outcomeRoll: number | undefined, success: boolean | undefined;
    // Refusal consumes a trip/gift invitation; save/load never rerolls a refusal.
    const key = person.id + ':vehicle-invite:' + asset.id + ':' + command.activity + ':' + (command.contactId ?? '') + ':' + current;
    if (world.actionCounts[key])
        throw new IneligibleAction('This invitation or activity is already recorded this month');
    world.actionCounts[key] = 1;
    if (!consent.accepted)
        { body = 'I invited ' + nameOf(world, contact!.id) + ', but they declined.'; narrative = nameOf(world, contact!.id) + ' declines. You put the plan aside for another day.'; }
    else {
        paymentIds = lifestylePayment(world, cost, 'Vehicle ' + command.activity, asset.currency);
        paid = cost;
        if (command.activity === 'drive' || command.activity === 'road-trip') {
            distance = vehicleTripDistance(asset, command.activity);
            life.mileage += distance;
            life.lastUseMonth = current;
            const serviced = life.lastServiceMonth !== null && current - life.lastServiceMonth <= 12, chance = Math.min(20, Math.max(1, Math.floor((100 - asset.condition) / 8) + (serviced ? -3 : 2) - (life.upgrades.includes('brakes') ? 2 : 0)));
            const roll = draw(world, 'outcomes', 1, 100), breakdown = roll <= chance;
            outcomeChance = chance;
            outcomeRoll = roll;
            success = !breakdown;
            asset.condition = bounded(asset.condition - Math.max(1, Math.floor(distance / 100)) - (breakdown ? 12 : 0));
            person.stats.energy = bounded(person.stats.energy - (command.activity === 'road-trip' ? 8 : 4));
            person.stats.happiness = bounded(person.stats.happiness + (breakdown ? 0 : 3));
            body = 'I took ' + asset.name + ' on a ' + distance + '-mile ' + (vehicleLicenceKind(asset) === 'road' ? 'drive' : vehicleLicenceKind(asset) === 'boat' ? 'boat outing' : 'leisure flight') + (contact ? ' with ' + nameOf(world, contact.id) : '') + '. ' + (breakdown ? 'A warning light ended the outing. The vehicle needs a paid repair; no injury occurred.' : 'We returned to the same city. The distance and running cost are recorded.');
            if (life.usageVersion === 2) {
                body = 'I took ' + asset.name + ' on a ' + distance + '-mile outing' + (contact ? ' with ' + nameOf(world, contact.id) : '') + '. ' + (breakdown ? 'A warning light brought it to an early end.' : 'It was good to get out and return home.');
                narrative = breakdown ? 'A warning light ends your outing in ' + asset.name + '. You return with a fresh appreciation of uneventful journeys.' : 'You take ' + asset.name + ' out' + (contact ? ' with ' + nameOf(world, contact.id) : '') + ' and return to the same city. For once, the journey gives you nothing to complain about.';
            }
            if (contact)
                sharedMemory(world, contact.id, 'vehicle-trip:' + asset.id + ':' + current, breakdown ? 1 : 4);
        }
        else if (command.activity === 'service') {
            life.lastServiceMonth = current;
            asset.condition = bounded(asset.condition + 5);
            body = 'I had ' + asset.name + ' serviced.'; narrative = 'You pay for servicing on ' + asset.name + '. The maintenance checklist looks less accusing afterwards.';
        }
        else if (command.activity === 'repair') {
            asset.condition = bounded(asset.condition + 30);
            body = 'I paid for repairs to ' + asset.name + '.'; narrative = 'You pay for repairs to ' + asset.name + '. It is one less piece of work to keep putting off.';
        }
        else if (command.activity === 'customise') {
            life.appearance = (['midnight', 'sunrise', 'forest'] as const)[draw(world, 'outcomes', 0, 2)];
            body = 'I chose a ' + life.appearance + ' finish for ' + asset.name + '.'; narrative = 'You give ' + asset.name + ' a ' + life.appearance + ' finish. You take a slightly longer look before leaving it parked.';
        }
        else if (command.activity === 'gift') {
            asset.ownerId = contact!.id;
            asset.ownershipSource = 'gift';
            asset.titleSince = { ...world.date };
            asset.provenance.push('Gifted by ' + nameOf(world, person.id) + ' to ' + nameOf(world, contact!.id) + ' in ' + world.date.year);
            sharedMemory(world, contact!.id, 'vehicle-gift:' + asset.id + ':' + current, 8);
            body = 'I gave ' + asset.name + ' to ' + nameOf(world, contact!.id) + '. Handing over the keys felt rather final.';
        }
        else if (command.activity === 'scrap') {
            received = asset.value / 20n;
            if (received) {
                post(world, received, 0n, 'lifestyle-scrap', 'Scrapped ' + asset.name, null, person, asset.currency);
                paymentIds.push(world.ledger.at(-1)!.id);
            }
            asset.ownerId = null;
            asset.insured = false;
            asset.provenance.push('Scrapped by ' + nameOf(world, person.id) + ' in ' + world.date.year);
            body = 'I scrapped the damaged ' + asset.name + ' for its salvage value.'; narrative = 'You say goodbye to ' + asset.name + '. ' + (received ? 'The salvage payment is welcome; the end of the repair bills is rather more welcome.' : 'There is nothing left to recover, but there are no more repair bills to pay.');
        }
        else {
            life.upgrades.push(command.activity);
            asset.costBasis += cost;
            asset.value += cost * 3n / 10n;
            body = 'I paid to fit ' + command.activity + ' to ' + asset.name + '.'; narrative = 'You have ' + command.activity + ' fitted to ' + asset.name + '. You are briefly very interested in explaining the improvement to anyone who asks.';
        }
    }
    recordLifestyle(world, { kind: 'vehicle-' + command.activity, ...(contact ? { invitedId: contact.id } : {}), subjectId: asset.id, currency: asset.currency, participants: [person.id, ...(consent.accepted && contact ? [contact.id] : [])], ...consent, paid, received, paymentIds, before, after: asset.condition, distance, ...(outcomeChance !== undefined ? { outcomeChance, outcomeRoll, success } : {}), body });
    if (command.activity === 'gift' && consent.accepted) narrative = 'You give ' + asset.name + ' to ' + nameOf(world, contact!.id) + '. Your carefully prepared advice is less exciting than the keys.';
    result(world, consent.accepted ? life.usageVersion === 2 ? command.activity === 'gift' ? 'A different owner' : command.activity === 'drive' || command.activity === 'road-trip' ? 'Out and back' : 'Looking after it' : 'Vehicle record updated' : 'Invitation declined', narrative ?? body, 'vehicle');
}
