import { copyWorld, validateWorld, type World } from '../../src/game/model';
import { monthFrom } from '../../src/game/calendar';
import { askingRent, landlordMonth } from '../../src/game/systems/landlordTenancies';
import { buyLifestyle, lifestyleFixture, act } from '../helpers/lifestyle';
export function landlordFixture() {
  let world = buyLifestyle(lifestyleFixture(), 'family-house');
  const asset = world.assets.at(-1)!;
  world = act(world, { type: 'find-tenants', assetId: asset.id, quotedRent: askingRent(asset) });
  const app = world.lifestyle!.applications.find(row => row.funds >= askingRent(asset) * 2n)!;
  return act(world, { type: 'review-tenant', applicationId: app.id, action: 'accept', quotedDeposit: world.assets.at(-1)!.rentPerMonth });
}
/** Search a real seeded rent period; arrears and maintenance are never fabricated. */
export function landlordPeriod(previous: World, unpaid = true, leak = false): World {
  for (let seed = 1; seed <= 2000; seed++) {
    const world = copyWorld(previous); world.date = monthFrom(world.date, 1); world.random.npcs = seed;
    landlordMonth(world); world.revision = previous.revision + 1;
    const before = previous.lifestyle!.tenancies[0], row = world.lifestyle!.tenancies[0];
    if ((!unpaid || row.periods.at(-1)!.paid === 0n) && (!leak || row.maintenance > before.maintenance)) return validateWorld(world);
  }
  throw new Error('No real rent period satisfied the seeded scenario');
}
export function clearTenantRepairs(world: World) {
  const row = world.lifestyle!.tenancies[0];
  return row.maintenance > 0n ? act(world, { type: 'manage-tenancy', tenancyId: row.id, action: 'repair', quotedAmount: row.maintenance }) : world;
}
export function reviewReadyTenancy() {
  let world = landlordFixture(), row = world.lifestyle!.tenancies[0];
  world = act(world, { type: 'manage-tenancy', tenancyId: row.id, action: 'notice', quotedAmount: 0n });
  return clearTenantRepairs(landlordPeriod(landlordPeriod(world)));
}
