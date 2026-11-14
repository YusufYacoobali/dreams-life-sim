import { copyWorld, validateWorld, type World } from '../../src/game/model';
import { monthFrom } from '../../src/game/calendar';
import { askingRent, landlordMonth } from '../../src/game/systems/landlordTenancies';
import { buyLifestyle, lifestyleFixture, act } from '../helpers/lifestyle';
import { accountFor, availableCash, post } from '../../src/game/systems/common';
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

/** Arrears come from actual unpaid periods and, where requested, a real repayment. */
export function ordinaryReadyTenancy(arrears: 'zero' | 'partial' | 'substantial') {
  let world = reviewReadyTenancy();
  if (arrears === 'substantial') return world;
  const row = world.lifestyle!.tenancies[0], tenant = world.people[row.tenantId], funds = availableCash(accountFor(world, tenant, row.currency));
  if (arrears === 'partial') {
    const target = row.arrears - row.rent / 2n, payable = funds < target ? funds : target;
    if (payable <= 0n) throw Error('Partial repayment fixture requires actual available tenant funds');
    if (funds > payable) post(world, payable - funds, 0n, 'unit-expense', 'Explicit tenant budget fixture before arrears repayment', null, tenant, row.currency);
  } else if (funds < row.arrears) throw Error('Zero-arrears fixture requires sufficient actual tenant funds');
  world = act(validateWorld(world), { type: 'manage-tenancy', tenancyId: row.id, action: 'discuss', quotedAmount: 0n });
  const remaining = world.lifestyle!.tenancies[0].arrears;
  if (arrears === 'zero' ? remaining !== 0n : remaining <= 0n || remaining >= row.rent * 2n) throw Error('Actual arrears repayment did not reach the requested fixture');
  return world;
}
