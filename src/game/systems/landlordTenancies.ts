import { formatMoney } from '../money';
import { fxMoney } from '../valuation';
import { z } from 'zod';
import type { World } from '../model';
import { ageOn, fullName } from '../personHelpers';
import { IneligibleAction } from '../errors';
import { accountFor, active, availableCash, bounded, draw, fact, post, result } from './common';
import { rules } from '../rules';
import { createContact } from './npcs';
import { connectPerson } from './relationships';
import { settleBackground } from './npcBudget';
import { amenityIds, type Tenancy } from './lifestyleSchemas';
import { amenityQuote, amenityReason, homeAmenity, amenities } from './propertyAmenities';
import { contactConsent, lifestyleMonthNumber as month, lifestylePayment, lifestyleState, localContactReason, nameOf, presentAtHome, recordLifestyle, requireLifestyle, sharedMemory, transferLifestyle } from './lifestyleCommon';
export const propertyCommandSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('enable-lifestyle') }).strict(),
    z.object({ type: z.literal('inspect-property'), assetId: z.string() }).strict(),
    z.object({ type: z.literal('enable-property-management'), assetId: z.string() }).strict(),
    z.object({ type: z.literal('install-amenity'), assetId: z.string(), amenity: z.enum(amenityIds), quotedCost: z.bigint().positive() }).strict(),
    z.object({ type: z.literal('find-tenants'), assetId: z.string(), quotedRent: z.bigint().positive() }).strict(),
    z.object({ type: z.literal('review-tenant'), applicationId: z.string(), action: z.enum(['check', 'accept', 'reject']), quotedDeposit: z.bigint().nonnegative() }).strict(),
    z.object({ type: z.literal('manage-tenancy'), tenancyId: z.string(), action: z.enum(['inspect', 'repair', 'discuss', 'renew', 'notice', 'review-eviction', 'evict', 'rent', 'end']), quotedAmount: z.bigint().nonnegative() }).strict(),
    z.object({ type: z.literal('home-gathering'), assetId: z.string(), activity: z.enum(['party', 'dinner', 'celebration']), contactId: z.string(), quotedCost: z.bigint().nonnegative() }).strict(),
]);
export type PropertyCommand = z.infer<typeof propertyCommandSchema>;
export const askingRent = (asset: World['assets'][number]) => asset.value * 6n / 1200n || 1n;
export function rentalPriceReason(asset: World['assets'][number], rent: bigint) { const market = askingRent(asset); if (rent < market / 2n || rent > market * 3n / 2n || rent <= 0n)
    return 'Choose rent between 50% and 150% of the current market estimate'; }
function property(world: World, id: string) { const asset = world.assets.find(row => row.id === id && row.ownerId === world.activePersonId && row.kind === 'property'); if (!asset)
    throw new IneligibleAction('Choose your own property'); return asset; }
export { namedTenancy, endNamedTenancy, refreshNamedTenancies } from './landlordState';
import { namedTenancy, endNamedTenancy, refreshNamedTenancies } from './landlordState';
export function landlordMonth(world: World) { if (!world.lifestyle)
    return; refreshNamedTenancies(world); const current = month(world); for (const application of world.lifestyle.applications)
    if (application.status === 'open' && current > application.expiresMonth)
        application.status = 'expired'; for (const row of world.lifestyle.tenancies) {
    if (row.ended || row.lastMonth >= current)
        continue;
    if (row.lastMonth !== current - 1)
        throw new Error('Named rent must advance through actual monthly periods');
    row.lastMonth = current;
    const asset = world.assets.find(asset => asset.id === row.assetId)!, tenant = world.people[row.tenantId], landlord = world.people[row.landlordId];
    settleBackground(world, tenant, current);
    const funds = availableCash(accountFor(world, tenant, row.currency)), reliable = draw(world, 'npcs', 1, 100) <= row.reliability, paid = reliable ? (funds < row.rent ? funds : row.rent) : 0n;
    const ids = transferLifestyle(world, tenant, landlord, paid, row.currency, 'Named rent: ' + row.id);
    row.arrears += row.rent - paid;
    if (paid) {
        const income = fxMoney(world, { minor: paid, currency: row.currency }, accountFor(world, landlord).currency).minor;
        landlord.finance.cycleGross += income;
        landlord.finance.supportIncomeDue += income;
    }
    row.periods.push({ month: current, due: row.rent, paid, tenantPaymentId: ids[0] ?? null, landlordPaymentId: ids[1] ?? null, arrears: row.arrears });
    if (current % 6 === 0 && draw(world, 'npcs', 1, 100) > row.reliability) {
        const damage = asset.value / 1000n || 1n;
        row.maintenance += damage;
        asset.condition = bounded(asset.condition - 3);
        fact(world, fullName(tenant) + ' reported a leak at ' + asset.name + '. A maintenance estimate is waiting in property management.', 'property', '', row.landlordId);
    }
} }
const homeImprovementCopy: Record<typeof amenityIds[number], string> = {
    kitchen: 'Your new kitchen is finished. It looks magnificent. The invoice briefly makes you reconsider eating.',
    bathroom: 'You try the new bathroom. For once, the room is more relaxing than the work involved in getting it.',
    gym: 'Your home gym is ready. The difficult part is now finding a convincing excuse to walk past it.',
    garden: 'You look out over the improved garden. It is good to have somewhere worth lingering.',
    'gaming-room': 'Your gaming room is ready. You admire how seriously you have arranged to enjoy yourself.',
    studio: 'Your music studio is ready. You try a few notes and find it unusually difficult to stop.',
    pool: 'You stand beside your new pool. The water looks inviting; the invoice is less refreshing.',
    garage: 'Your garage is finished. There is finally a proper place for the maintenance you keep meaning to arrange.',
    cinema: 'Your home cinema is ready. You sit down to admire it and briefly lose the rest of the evening.',
    office: 'You settle into your home office. It is a promising place to do the work, once you stop rearranging it.',
    workshop: 'Your workshop is ready. You stand in the doorway imagining what you could make there.',
    stable: 'You inspect the new animal-friendly grounds. It is a considerable piece of work, and a place worth taking care of.',
};
export function gatheringCost(world: World, activity: 'party' | 'dinner' | 'celebration') { return rules[active(world).country].baseWage * BigInt(activity === 'party' ? 30 : activity === 'celebration' ? 20 : 8) / (homeAmenity(world, 'cinema') ? 12500n : 10000n); }
export function resolveProperty(world: World, command: PropertyCommand) {
    if (command.type === 'enable-lifestyle') {
        if (world.lifestyle)
            throw new IneligibleAction('Lifestyle features are already enabled');
        throw new Error('Enable lifestyle through the capability handler');
    }
    requireLifestyle(world);
    const state = lifestyleState(world), player = active(world), current = month(world);
    if (command.type === 'review-tenant') {
        const app = state.applications.find(row => row.id === command.applicationId && row.landlordId === player.id && row.status === 'open');
        if (!app || app.expiresMonth < current)
            throw new IneligibleAction('This application is no longer open');
        const asset = property(world, app.assetId);
        if (!asset.propertyLife || namedTenancy(world, asset.id) || asset.listing || asset.rental !== 'listed')
            throw new IneligibleAction('The property is no longer available');
        if (command.quotedDeposit !== asset.rentPerMonth)
            throw new IneligibleAction('Review the actual one-month deposit');
        if (command.action === 'reject') {
            app.status = 'rejected';
            result(world, 'Application declined', 'You declined ' + nameOf(world, app.tenantId) + '’s application. The place will have to wait for someone else.', 'property');
            return;
        }
        if (command.action === 'check') {
            if (app.checked)
                throw new IneligibleAction('This background check is already complete');
            const cost = rules[asset.country].baseWage / 10000n || 1n;
            const paymentIds = lifestylePayment(world, cost, 'Tenant background check', asset.currency);
            app.checked = true;
            const tenant = world.people[app.tenantId], convictions = world.sentences.filter(row => row.personId === tenant.id).length;
            recordLifestyle(world, { kind: 'tenant-check', subjectId: app.id, participants: [player.id, tenant.id], paid: cost, paymentIds, body: 'I reviewed ' + fullName(tenant) + '’s recorded employment and finances: ' + app.source + '; ' + convictions + ' recorded convictions. Reliability: ' + app.reliability + '%.' });
            result(world, 'Background check', 'You read through ' + fullName(tenant) + '’s background. Their work, finances and history give you something firmer to go on than a good first impression.', 'property');
            return;
        }
        const tenant = world.people[app.tenantId];
        if (!presentAtHome(world, tenant) || tenant.country !== asset.country || tenant.city !== asset.city || state.tenancies.some(row => !row.ended && row.tenantId === tenant.id))
            throw new IneligibleAction('The applicant is no longer available');
        settleBackground(world, tenant, current);
        const account = accountFor(world, tenant, asset.currency);
        if (availableCash(account) < asset.rentPerMonth * 2n)
            throw new IneligibleAction('The applicant cannot cover the deposit and a month of rent');
        post(world, -asset.rentPerMonth, 0n, 'lifestyle-deposit', 'Tenancy deposit held in escrow', null, tenant, asset.currency);
        const depositPaymentId = world.ledger.at(-1)!.id;
        const row: Tenancy = { id: 'tenancy_' + world.revision, applicationId: app.id, assetId: asset.id, landlordId: player.id, tenantId: tenant.id, currency: asset.currency, started: { ...world.date }, ended: null, endReason: null, rent: asset.rentPerMonth, deposit: asset.rentPerMonth, depositHeld: asset.rentPerMonth, depositPaymentId, depositRefundId: null, depositRecipientId: null, lastMonth: current, arrears: 0n, reliability: app.reliability, satisfaction: 60, maintenance: 0n, lastRentReviewMonth: current, noticeMonth: null, reviewMonth: null, reviewPaid: 0n, reviewPaymentId: null, periods: [] };
        state.tenancies.push(row);
        app.status = 'accepted';
        for (const other of state.applications)
            if (other.assetId === asset.id && other.status === 'open')
                other.status = 'expired';
        asset.rental = 'occupied';
        connectPerson(world, tenant.id);
        sharedMemory(world, tenant.id, 'tenancy:' + row.id + ':accepted', 0);
        fact(world, fullName(tenant) + ' became my tenant at ' + asset.name + '. Their deposit is held separately; rent begins next month.', 'property');
        result(world, 'A named tenant', fullName(tenant) + ' accepts the rental terms. You have a person to deal with now, rather than an empty set of rooms. Their deposit stays safely in escrow.', 'property');
        return;
    }
    if (command.type === 'manage-tenancy') {
        const row = state.tenancies.find(row => row.id === command.tenancyId && !row.ended && row.landlordId === player.id);
        if (!row)
            throw new IneligibleAction('Choose your current tenancy');
        const asset = property(world, row.assetId), tenant = world.people[row.tenantId];
        if (command.action === 'rent') {
            if (current - row.lastRentReviewMonth < 12)
                throw new IneligibleAction('Review rent at most once a year');
            const reason = rentalPriceReason(asset, command.quotedAmount);
            if (reason)
                throw new IneligibleAction(reason);
            if (command.quotedAmount > row.rent * 110n / 100n)
                throw new IneligibleAction('The increase cannot exceed 10% of the agreed rent');
            row.rent = command.quotedAmount;
            asset.rentPerMonth = row.rent;
            row.lastRentReviewMonth = current;
            row.satisfaction = bounded(row.satisfaction - 5);
        }
        else if (command.action === 'inspect') {
            if (asset.country !== player.country || asset.city !== player.city) throw new IneligibleAction('Return to the property’s city for an in-person inspection');
            if (asset.propertyLife?.lastInspectionMonth !== null && current - (asset.propertyLife?.lastInspectionMonth ?? current) < 6)
                throw new IneligibleAction('Respect privacy: inspections are available every six months');
            asset.propertyLife!.lastInspectionMonth = current;
            row.maintenance = row.maintenance || (asset.condition < 80 ? asset.value / 2000n || 1n : 0n);
        }
        else if (command.action === 'repair') {
            if (!row.maintenance || command.quotedAmount !== row.maintenance)
                throw new IneligibleAction('Review the actual outstanding maintenance estimate');
            const ids = lifestylePayment(world, row.maintenance, 'Tenant maintenance', asset.currency);
            recordLifestyle(world, { kind: 'tenant-repair', subjectId: row.id, currency: asset.currency, paid: row.maintenance, paymentIds: ids, body: 'I paid for the repairs at ' + asset.name + '.' });
            row.maintenance = 0n;
            asset.condition = bounded(asset.condition + 8);
            row.satisfaction = bounded(row.satisfaction + 12);
        }
        else if (command.action === 'discuss') {
            const key = player.id + ':tenant-discuss:' + row.id + ':' + current;
            if (world.actionCounts[key])
                throw new IneligibleAction('One rent discussion per month');
            world.actionCounts[key] = 1;
            const funds = availableCash(accountFor(world, tenant, row.currency)), paid = row.arrears < funds ? row.arrears : funds;
            const ids = transferLifestyle(world, tenant, player, paid, row.currency, 'Rent arrears: ' + row.id);
            row.arrears -= paid;
            if (paid) {
                const income = fxMoney(world, { minor: paid, currency: row.currency }, accountFor(world).currency).minor;
                player.finance.cycleGross += income;
                player.finance.supportIncomeDue += income;
            }
            row.satisfaction = bounded(row.satisfaction + 3);
            recordLifestyle(world, { kind: 'tenant-arrears', subjectId: row.id, currency: row.currency, participants: [player.id, tenant.id], received: paid, paymentIds: ids, body: 'I discussed rent with ' + fullName(tenant) + '. Afterwards, ' + formatMoney({ minor: row.arrears, currency: row.currency }) + ' remains unpaid.' });
        }
        else if (command.action === 'renew') {
            if (current - row.lastRentReviewMonth < 12)
                throw new IneligibleAction('Renew after twelve months');
            row.noticeMonth = null;
            row.reviewMonth = null;
            row.lastRentReviewMonth = current;
            row.satisfaction = bounded(row.satisfaction + 5);
        }
        else if (command.action === 'notice') {
            if (row.noticeMonth !== null)
                throw new IneligibleAction('Notice is already recorded');
            row.noticeMonth = current;
        }
        else if (command.action === 'review-eviction') {
            if (row.noticeMonth === null || current - row.noticeMonth < 2 || row.arrears < row.rent * 2n || row.maintenance > 0n)
                throw new IneligibleAction('A review requires two months’ notice, two rents in arrears and completed repairs');
            if (row.reviewMonth !== null)
                throw new IneligibleAction('An independent review is already recorded');
            const fee = rules[asset.country].baseWage / 1000n || 1n;
            if (command.quotedAmount !== fee)
                throw new IneligibleAction('Review the actual review fee');
            const ids = lifestylePayment(world, fee, 'Independent tenancy review', row.currency);
            row.reviewMonth = current;
            row.reviewPaid = fee;
            row.reviewPaymentId = ids[0];
            recordLifestyle(world, { kind: 'tenancy-review', subjectId: row.id, currency: row.currency, paid: fee, paymentIds: ids, body: 'I paid for an independent review of the tenancy at ' + asset.name + '. There was still a waiting period ahead.' });
        }
        else if (command.action === 'end') {
            if (row.noticeMonth === null || current - row.noticeMonth < 2 || row.maintenance > 0n)
                throw new IneligibleAction('Give two months’ notice and complete repairs before an ordinary ending');
            endNamedTenancy(world, row, 'The ordinary tenancy ended after two months’ notice. The deposit was returned in full.');
        }
        else {
            if (row.noticeMonth === null || row.reviewMonth === null || current <= row.reviewMonth || row.arrears < row.rent * 2n || row.maintenance > 0n)
                throw new IneligibleAction('Await an independent review and a further month before ending an unpaid tenancy');
            endNamedTenancy(world, row, 'A reviewed unpaid tenancy ended after notice. The deposit was returned in full.');
        }
        if (['notice', 'inspect', 'renew', 'rent'].includes(command.action)) fact(world, 'I ' + (command.action === 'notice' ? 'gave notice to ' : command.action === 'inspect' ? 'carried out an agreed inspection for ' : command.action === 'renew' ? 'renewed the tenancy with ' : 'reviewed the rent for ') + fullName(tenant) + ' at ' + asset.name + '.', 'property');
        const narrative = command.action === 'notice' ? 'You give ' + fullName(tenant) + ' two months’ notice. The tenancy continues while the notice period runs.' : command.action === 'inspect' ? 'You keep the agreed visit brief. ' + (row.maintenance ? 'There are repairs to arrange before this place can feel properly looked after.' : 'The place is in good enough order to leave well alone.') : command.action === 'discuss' ? 'You and ' + fullName(tenant) + ' work through the late rent. ' + (row.arrears ? 'Not all of it can be settled today.' : 'At last, the balance is clear.') : command.action === 'repair' ? 'You pay for the repairs. ' + fullName(tenant) + ' can finally stop working around the problem.' : command.action === 'renew' ? 'You renew the agreement. ' + fullName(tenant) + ' can keep calling the place home.' : command.action === 'rent' ? 'You finish reviewing the rent. It is a small line on a spreadsheet and a substantial part of somebody’s month.' : command.action === 'review-eviction' ? 'You pay for an independent review. The paperwork is clearer than the situation feels.' : 'You close the agreement with ' + fullName(tenant) + '. The deposit goes back to them, and the property is vacant again.';
        result(world, 'Looking after the tenancy', narrative, 'property');
        return;
    }
    const asset = property(world, command.assetId);
    if (command.type === 'enable-property-management') {
        if (asset.propertyLife || asset.rental !== 'none' || asset.listing)
            throw new IneligibleAction('Enable management only for a vacant, unlisted property; legacy rentals keep their original terms');
        asset.propertyLife = { version: 1, enabled: { ...world.date }, amenities: [], lastGatheringMonth: null, lastInspectionMonth: null };
        fact(world, 'I enabled prospective property management for ' + asset.name + '.', 'property');
        result(world, 'Property management enabled', 'You take a fresh look at the place: what it needs, who might live there and what you could make of it.', 'property');
        return;
    }
    if (!asset.propertyLife || asset.country !== player.country || asset.city !== player.city)
        throw new IneligibleAction('Choose a managed property in your current city');
    if (command.type === 'inspect-property') {
        if (asset.propertyLife.lastInspectionMonth !== null && current - asset.propertyLife.lastInspectionMonth < 6)
            throw new IneligibleAction('Inspect at most once every six months');
        asset.propertyLife.lastInspectionMonth = current;
        recordLifestyle(world, { kind: 'property-inspection', subjectId: asset.id, before: asset.condition, after: asset.condition, body: 'I inspected ' + asset.name + '. I took a good look at how the place was holding up.' });
        result(world, 'A look around', 'You look around ' + asset.name + ', noticing the things you usually walk past. Condition: ' + asset.condition + '%.', 'property');
        return;
    }
    if (command.type === 'install-amenity') {
        const reason = amenityReason(asset, command.amenity, world);
        if (reason)
            throw new IneligibleAction(reason);
        const quote = amenityQuote(asset, command.amenity);
        if (command.quotedCost !== quote.cost)
            throw new IneligibleAction('Review the current installation quote');
        const ids = lifestylePayment(world, quote.cost, 'Installed ' + command.amenity, asset.currency);
        asset.propertyLife.amenities.push({ kind: command.amenity, installed: { ...world.date }, paid: quote.cost, addedValue: quote.addedValue, paymentId: ids[0] });
        asset.value += quote.addedValue;
        asset.costBasis += quote.cost;
        asset.provenance.push('Installed ' + command.amenity + ' in ' + world.date.year);
        recordLifestyle(world, { kind: 'amenity', subjectId: asset.id, currency: asset.currency, paid: quote.cost, paymentIds: ids, body: 'I had ' + amenities[command.amenity].name.toLowerCase() + ' installed at ' + asset.name + '.' });
        result(world, 'Improvement finished', homeImprovementCopy[command.amenity], 'property');
        return;
    }
    if (command.type === 'find-tenants') {
        if (state.applications.some(row => row.assetId === asset.id && current - (row.date.year * 12 + row.date.month - 1) < 3)) throw new IneligibleAction('Allow three months between batches of tenant applications');
        if (asset.rental === 'occupied' || asset.listing || state.applications.some(row => row.assetId === asset.id && row.status === 'open'))
            throw new IneligibleAction('Resolve current applications or the existing tenancy first');
        const reason = rentalPriceReason(asset, command.quotedRent);
        if (reason)
            throw new IneligibleAction(reason);
        if (state.applications.length > 1021 || state.tenancies.length >= 512)
            throw new IneligibleAction('The rental history limit has been reached');
        asset.rental = 'listed';
        asset.rentPerMonth = command.quotedRent;
        asset.primaryHome = false;
        for (const household of world.households)
            if (household.homeAssetId === asset.id)
                household.homeAssetId = null;
        for (let i = 0; i < 3; i++) {
            const tenant = createContact(world, { age: draw(world, 'npcs', 23, 60), country: asset.country, city: asset.city });
            const account = accountFor(world, tenant, asset.currency);
            state.applications.push({ id: 'application_' + world.revision + '_' + i, assetId: asset.id, landlordId: player.id, tenantId: tenant.id, date: { ...world.date }, expiresMonth: current + 3, reliability: Math.min(95, 55 + Math.floor(tenant.stats.discipline / 3) + (tenant.traits.includes('practical') ? 8 : 0)), temperament: tenant.traits.includes('impulsive') ? 'chaotic' : tenant.traits.includes('reserved') ? 'private' : 'considerate', funds: availableCash(account), annualIncome: tenant.employment?.annualPay ?? 0n, source: tenant.employment ? tenant.employment.employer + ' · ' + tenant.employment.roleId : 'Recorded savings', checked: false, status: 'open' });
        }
        fact(world, 'I advertised ' + asset.name + ' and received three named applications. Nobody has moved in or paid rent.', 'property');
        result(world, 'Applications received', 'Three people would like to call the place home. You look past the introductions and consider who can afford it, and who you could work with.', 'property');
        return;
    }
    if (asset.rental !== 'none' || asset.listing || !asset.primaryHome)
        throw new IneligibleAction('Host at your own available primary home');
    const reason = localContactReason(world, command.contactId, command.activity !== 'party');
    if (reason)
        throw new IneligibleAction(reason);
    const contact = world.people[command.contactId];
    if (ageOn(contact, world.date) < 18 && contact.householdId !== player.householdId)
        throw new IneligibleAction('Invite a child from your own household');
    if (asset.propertyLife.lastGatheringMonth !== null && current - asset.propertyLife.lastGatheringMonth < 6)
        throw new IneligibleAction('One home gathering every six months');
    const cost = gatheringCost(world, command.activity);
    if (command.quotedCost !== cost)
        throw new IneligibleAction('Review the current gathering cost');
    if (availableCash(accountFor(world)) < cost)
        throw new IneligibleAction('Insufficient available funds');
    const consent = contactConsent(world, contact);
    asset.propertyLife.lastGatheringMonth = current;
    let paid = 0n, ids: string[] = [], damage = false;
    if (consent.accepted) {
        ids = lifestylePayment(world, cost, 'Home ' + command.activity, asset.currency);
        paid = cost;
        damage = command.activity === 'party' && draw(world, 'outcomes', 1, 100) <= 15;
        if (damage)
            asset.condition = bounded(asset.condition - 5);
        sharedMemory(world, contact.id, 'home-gathering:' + asset.id + ':' + current, damage ? 1 : 5);
        player.stats.happiness = bounded(player.stats.happiness + 4);
        player.stats.energy = bounded(player.stats.energy - 4);
    }
    const body = consent.accepted ? 'I welcomed ' + fullName(contact) + ' to my ' + command.activity + ' at ' + asset.name + '. ' + (damage ? 'Someone demonstrated a dance move the floor could not support. There will be repairs to arrange tomorrow.' : command.activity === 'dinner' ? 'We stayed at the table long after the plates were empty.' : 'For once, the photographs captured people actually enjoying themselves.') : 'I invited ' + fullName(contact) + ', but they declined.';
    recordLifestyle(world, { kind: 'home-' + command.activity, invitedId: contact.id, subjectId: asset.id, participants: [player.id, ...(consent.accepted ? [contact.id] : [])], ...consent, paid, paymentIds: ids, body });
    result(world, consent.accepted ? 'People under one roof' : 'Another evening', consent.accepted ? damage ? 'The party includes a dance move the floor cannot support. You have a memorable evening and a repair to arrange.' : command.activity === 'dinner' ? 'You and ' + fullName(contact) + ' stay at the table long after the plates are empty.' : 'You and ' + fullName(contact) + ' enjoy the occasion. For once, the photographs look as though you meant to be there.' : fullName(contact) + ' declines your invitation. You put the gathering off for another evening.', 'property');
}
