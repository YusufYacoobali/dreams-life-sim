import type { World } from '../model';
import type { Tenancy } from './lifestyleSchemas';
import { fullName } from '../personHelpers';
import { post, fact } from './common';
export const namedTenancy = (world: World, assetId: string) => world.lifestyle?.tenancies.find(row => row.assetId === assetId && !row.ended);
export function endNamedTenancy(world: World, row: Tenancy, reason: string) {
    if (row.ended)
        return;
    // Deposits are held outside personal cash. They are never income or estate assets.
    const tenant = world.people[row.tenantId];
    if (row.depositHeld) {
        post(world, row.depositHeld, 0n, 'lifestyle-deposit-refund', 'Tenancy deposit returned: ' + row.id, null, tenant, row.currency);
        row.depositRefundId = world.ledger.at(-1)!.id;
        row.depositRecipientId = tenant.id;
        row.depositHeld = 0n;
    }
    row.ended = { ...world.date };
    row.endReason = reason;
    const asset = world.assets.find(asset => asset.id === row.assetId)!;
    asset.rental = 'none';
    asset.rentPerMonth = 0n;
    fact(world, 'The tenancy of ' + fullName(tenant) + ' at ' + asset.name + ' ended. ' + reason + (row.arrears ? ' Unpaid rent remains recorded as arrears; it was not collected.' : ''), 'property', '', row.landlordId);
}
export function refreshNamedTenancies(world: World) { if (!world.lifestyle)
    return; for (const row of world.lifestyle.tenancies)
    if (!row.ended) {
        const asset = world.assets.find(asset => asset.id === row.assetId), landlord = world.people[row.landlordId], tenant = world.people[row.tenantId];
        if (!asset || asset.ownerId !== row.landlordId || landlord.died || tenant.died || tenant.country !== asset.country || tenant.city !== asset.city)
            endNamedTenancy(world, row, landlord.died ? 'The landlord died; the deposit was returned before estate settlement.' : tenant.died ? 'The tenant died; their deposit was returned before estate settlement.' : 'Ownership or the tenant’s permanent residence changed.');
    } }
