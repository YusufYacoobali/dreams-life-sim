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
import { amenityQuote, amenityReason, homeAmenity } from './propertyAmenities';
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
            result(world, 'Application declined', 'You declined ' + nameOf(world, app.tenantId) + '’s application. No deposit or rent changed hands.', 'property');
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
            result(world, 'Background check', state.records.at(-1)!.body, 'property');
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
        result(world, 'A named tenant', fullName(tenant) + ' has accepted the saved rental terms. Their one-month deposit is in escrow, not your income. Rent is collected only as actual months pass.', 'property');
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
            recordLifestyle(world, { kind: 'tenant-repair', subjectId: row.id, currency: asset.currency, paid: row.maintenance, paymentIds: ids, body: 'I paid for the recorded maintenance at ' + asset.name + '.' });
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
            recordLifestyle(world, { kind: 'tenant-arrears', subjectId: row.id, currency: row.currency, participants: [player.id, tenant.id], received: paid, paymentIds: ids, body: 'I discussed rent with ' + fullName(tenant) + '. We transferred only the available arrears payment; ' + formatMoney({ minor: row.arrears, currency: row.currency }) + ' remains unpaid.' });
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
            recordLifestyle(world, { kind: 'tenancy-review', subjectId: row.id, currency: row.currency, paid: fee, paymentIds: ids, body: 'I paid for an independent review of the tenancy at ' + asset.name + '. The review is recorded; eviction still requires a further month and continuing unpaid rent.' });
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
        fact(world, 'I recorded a tenancy ' + command.action + ' with ' + fullName(tenant) + ' at ' + asset.name + '.', 'property');
        result(world, 'Tenancy updated', command.action === 'notice' ? 'Two months’ notice is recorded. A paid independent review and a further month are required before eviction. Repairs must be complete; two rents must remain unpaid.' : command.action === 'inspect' ? 'Inspection complete. Outstanding maintenance: ' + formatMoney({ minor: row.maintenance, currency: row.currency }) + '. No repairs have been charged.' : command.action === 'discuss' ? state.records.at(-1)!.body : 'The saved agreement and actual transactions have been updated.', 'property');
        return;
    }
    const asset = property(world, command.assetId);
    if (command.type === 'enable-property-management') {
        if (asset.propertyLife || asset.rental !== 'none' || asset.listing)
            throw new IneligibleAction('Enable management only for a vacant, unlisted property; legacy rentals keep their original terms');
        asset.propertyLife = { version: 1, enabled: { ...world.date }, amenities: [], lastGatheringMonth: null, lastInspectionMonth: null };
        fact(world, 'I enabled prospective property management for ' + asset.name + '.', 'property');
        result(world, 'Property management enabled', 'You can improve the property, review named tenant applications or host a gathering. No tenant or cost was created.', 'property');
        return;
    }
    if (!asset.propertyLife || asset.country !== player.country || asset.city !== player.city)
        throw new IneligibleAction('Choose a managed property in your current city');
    if (command.type === 'inspect-property') {
        if (asset.propertyLife.lastInspectionMonth !== null && current - asset.propertyLife.lastInspectionMonth < 6)
            throw new IneligibleAction('Inspect at most once every six months');
        asset.propertyLife.lastInspectionMonth = current;
        recordLifestyle(world, { kind: 'property-inspection', subjectId: asset.id, before: asset.condition, after: asset.condition, body: 'I inspected ' + asset.name + '. Condition is ' + asset.condition + '%. No repair payment, improvement or damage was invented.' });
        result(world, 'A look around', state.records.at(-1)!.body, 'property');
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
        recordLifestyle(world, { kind: 'amenity', subjectId: asset.id, currency: asset.currency, paid: quote.cost, paymentIds: ids, body: 'I installed ' + command.amenity + ' at ' + asset.name + '. The estimated added value is less than the installation cost.' });
        result(world, 'Improvement installed', state.records.at(-1)!.body, 'property');
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
        result(world, 'Applications received', 'Review each applicant’s actual employment, available savings and temperament. A background check reveals reliability and recorded convictions. Acceptance requires funds for a deposit and a month’s rent.', 'property');
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
    const body = consent.accepted ? fullName(contact) + ' came to my ' + command.activity + ' at ' + asset.name + '. ' + (damage ? 'Someone demonstrated a dance move the floor could not support. The damage remains for a paid repair.' : command.activity === 'dinner' ? 'We stayed at the table long after the plates were empty.' : 'For once, the photographs captured people actually enjoying themselves.') : fullName(contact) + ' declined my invitation. Nobody attended and I paid nothing.';
    recordLifestyle(world, { kind: 'home-' + command.activity, invitedId: contact.id, subjectId: asset.id, participants: [player.id, ...(consent.accepted ? [contact.id] : [])], ...consent, paid, paymentIds: ids, body });
    result(world, consent.accepted ? 'People under one roof' : 'Another evening', body, 'property');
}
