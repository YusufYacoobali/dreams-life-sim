import { monthFrom } from '../../src/game/calendar';
import { randomInteger } from '../../src/game/random';
import { rules } from '../../src/game/rules';
import { decodeWorld, encodeWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { validateWorld, type World } from '../../src/game/model';
import { accountFor } from '../../src/game/systems/common';
import { assetCatalog } from '../../src/game/content/assets';
import { assetPrice, assetsMonth } from '../../src/game/systems/assets';
import { askingRent, landlordMonth } from '../../src/game/systems/landlordTenancies';
import { amenityQuote } from '../../src/game/systems/propertyAmenities';
import fixture from '../fixtures/v3-employed-graduate.json';
import { lifestyleFixture, act, buyLifestyle } from '../helpers/lifestyle';
function managed() { let world = buyLifestyle(lifestyleFixture(), 'family-house'); return act(world, { type: 'enable-property-management', assetId: world.assets.at(-1)!.id }); }
function withTenant() { let world = managed(); const asset = world.assets.at(-1)!; world = act(world, { type: 'find-tenants', assetId: asset.id, quotedRent: askingRent(asset) }); const app = world.lifestyle!.applications.find(row => row.funds >= askingRent(asset) * 2n)!; world = act(world, { type: 'review-tenant', applicationId: app.id, action: 'accept', quotedDeposit: world.assets.at(-1)!.rentPerMonth }); return world; }
test('capability review is explicit and leaves all historical terms literal', () => { const old = decodeWorld(JSON.stringify(fixture)); const next = act(old, { type: 'enable-lifestyle' }); expect(next.assets).toEqual(old.assets); expect(next.people).toEqual(old.people); expect(next.random).toEqual(old.random); expect(decodeWorld(encodeWorld(next))).toEqual(next); expect(() => act(next, { type: 'enable-lifestyle' })).toThrow(/already/); });
test('a saved improvement pays once and never adds more value than it costs', () => { let world = managed(); const asset = world.assets.at(-1)!, before = accountFor(world).cash, quote = amenityQuote(asset, 'studio'); world = act(world, { type: 'install-amenity', assetId: asset.id, amenity: 'studio', quotedCost: quote.cost }); expect(accountFor(world).cash).toBe(before - quote.cost); expect(world.assets.at(-1)!.value).toBe(asset.value + quote.addedValue); expect(() => act(world, { type: 'install-amenity', assetId: asset.id, amenity: 'studio', quotedCost: quote.cost })).toThrow(/already/); expect(decodeWorld(encodeWorld(world))).toEqual(world); });
test('built-in amenities cannot be duplicated', () => { let world = buyLifestyle(lifestyleFixture(), 'modern-villa'); const asset = world.assets.at(-1)!; world = act(world, { type: 'enable-property-management', assetId: asset.id }); expect(() => act(world, { type: 'install-amenity', assetId: asset.id, amenity: 'pool', quotedCost: amenityQuote(asset, 'pool').cost })).toThrow(/already/); });
test('real named tenant deposit is escrow, monthly rent conserves cash and cannot repeat', () => { const world = withTenant(), row = world.lifestyle!.tenancies[0], tenant = world.people[row.tenantId], landlord = world.people[row.landlordId], a = accountFor(world, tenant).cash, b = accountFor(world, landlord).cash; expect(row.depositHeld).toBe(row.deposit); expect(world.ledger.find(tx => tx.id === row.depositPaymentId)?.personId).toBe(tenant.id); expect(world.ledger.find(tx => tx.id === row.depositPaymentId)?.cashDelta).toBe(-row.deposit); expect(b).toBe(accountFor(managed()).cash); world.date = world.date.month === 12 ? { ...world.date, year: world.date.year + 1, month: 1 } : { ...world.date, month: world.date.month + 1 }; landlordMonth(world); const paid = row.periods[0].paid; expect(accountFor(world, landlord).cash).toBe(b + paid); const count = world.ledger.length; landlordMonth(world); expect(world.ledger.length).toBe(count); expect(row.periods).toHaveLength(1); expect(paid <= row.rent).toBe(true); expect(a).toBeGreaterThan(0n); });
test('managed vacancy never spawns anonymous rent and original rentals cannot silently transition', () => { const world = managed(), asset = world.assets.at(-1)!; asset.rental = 'listed'; asset.rentPerMonth = askingRent(asset); assetsMonth(world, undefined, 0); expect(asset.rental).toBe('listed'); expect(world.ledger.some(row => row.category === 'rent')).toBe(false); let legacy = buyLifestyle(lifestyleFixture(), 'studio'); legacy = act(legacy, { type: 'rent-property', assetId: legacy.assets.at(-1)!.id }); expect(() => act(legacy, { type: 'enable-property-management', assetId: legacy.assets.at(-1)!.id })).toThrow(/legacy rentals/); });
test('named tenancies cannot be ended, moved into or sold through old shortcuts', () => { const world = withTenant(), row = world.lifestyle!.tenancies[0]; expect(() => act(world, { type: 'stop-renting', assetId: row.assetId })).toThrow(/reviewed/); expect(() => act(world, { type: 'move-in', assetId: row.assetId })).toThrow(/tenancy/); expect(() => act(world, { type: 'list-property', assetId: row.assetId, askingPrice: world.assets.at(-1)!.value })).toThrow(/tenancy/); expect(() => act(world, { type: 'manage-tenancy', tenancyId: row.id, action: 'evict', quotedAmount: 0n })).toThrow(/review/); });
test('tampered tenant debit, escrow and capability references are rejected', () => { const original = withTenant(); for (const mutate of [(w: World) => { w.lifestyle!.tenancies[0].depositHeld++; }, (w: World) => { w.lifestyle!.tenancies[0].tenantId = w.activePersonId; }, (w: World) => { delete w.lifestyle; }]) {
    const world = decodeWorld(encodeWorld(original));
    mutate(world);
    expect(() => validateWorld(world)).toThrow();
} });
test('an unpaid tenancy requires real notice, an independent paid review and another month; escrow returns once', () => {
    let world = withTenant();
    const id = world.lifestyle!.tenancies[0].id;
    world = act(world, { type: 'manage-tenancy', tenancyId: id, action: 'notice', quotedAmount: 0n });
    const nextMonth = () => { world.date = monthFrom(world.date, 1); const reliability = world.lifestyle!.tenancies[0].reliability; world.random.npcs = Array.from({ length: 1000 }, (_, index) => index + 1).find(seed => randomInteger(seed, 1, 100).value > reliability)!; landlordMonth(world); if (world.lifestyle!.tenancies[0].maintenance)
        world = act(world, { type: 'manage-tenancy', tenancyId: id, action: 'repair', quotedAmount: world.lifestyle!.tenancies[0].maintenance }); };
    nextMonth();
    nextMonth();
    const fee = rules[world.assets.at(-1)!.country].baseWage / 1000n || 1n;
    world = act(world, { type: 'manage-tenancy', tenancyId: id, action: 'review-eviction', quotedAmount: fee });
    expect(world.lifestyle!.records.at(-1)!.kind).toBe('tenancy-review');
    expect(() => act(world, { type: 'manage-tenancy', tenancyId: id, action: 'evict', quotedAmount: 0n })).toThrow(/further month/);
    nextMonth();
    world = act(world, { type: 'manage-tenancy', tenancyId: id, action: 'evict', quotedAmount: 0n });
    expect(world.lifestyle!.tenancies[0].ended).toEqual(world.date);
    expect(world.lifestyle!.tenancies[0].depositHeld).toBe(0n);
    expect(world.lifestyle!.tenancies[0].arrears).toBeGreaterThan(0n);
    expect(decodeWorld(encodeWorld(world))).toEqual(world);
});
