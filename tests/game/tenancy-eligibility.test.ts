import { copyWorld, encodeWorld, validateWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { tenancyActionReason, type TenancyCommand } from '../../src/game/systems/tenancyEligibility';
import { tenancyReviewFee, tenantCheckFee } from '../../src/game/systems/landlordTenancies';
import { accountFor, availableCash, post } from '../../src/game/systems/common';
import { landlordFixture, landlordPeriod, reviewReadyTenancy, clearTenantRepairs, ordinaryReadyTenancy } from '../support/landlord';
import { act, buyLifestyle, lifestyleFixture } from '../helpers/lifestyle';
import { askingRent } from '../../src/game/systems/landlordPricing';

function command(world: ReturnType<typeof landlordFixture>, action: TenancyCommand['action'], amount = 0n): TenancyCommand { return { type: 'manage-tenancy', tenancyId: world.lifestyle!.tenancies[0].id, action, quotedAmount: amount }; }
function blocked(world: ReturnType<typeof landlordFixture>, next: TenancyCommand, expected: RegExp) {
  const before = encodeWorld(world), reason = tenancyActionReason(world, next);
  expect(reason).toMatch(expected); expect(() => resolveCommand(world, next)).toThrow(reason!); expect(encodeWorld(world)).toBe(before);
}
test('notice, actual overdue periods, maintenance, an independent review and its further month guard the same command', () => {
  let world = landlordFixture();
  blocked(world, command(world, 'evict'), /review/);
  blocked(world, command(world, 'review-eviction', tenancyReviewFee(world.assets[0].country)), /two months/);
  world = act(world, command(world, 'notice')); blocked(world, command(world, 'notice'), /already/);
  world = landlordPeriod(world); blocked(world, command(world, 'review-eviction', tenancyReviewFee(world.assets[0].country)), /two months/);
  world = clearTenantRepairs(landlordPeriod(world));
  const fee = tenancyReviewFee(world.assets[0].country);
  blocked(world, command(world, 'review-eviction', fee + 1n), /actual review fee/);
  expect(tenancyActionReason(world, command(world, 'review-eviction', fee))).toBeUndefined();
  world = act(world, command(world, 'review-eviction', fee));
  blocked(world, command(world, 'evict'), /further month/);
  world = clearTenantRepairs(landlordPeriod(world));
  const row = world.lifestyle!.tenancies[0], tenantCash = accountFor(world, world.people[row.tenantId], row.currency).cash, unpaid = row.arrears;
  expect(tenancyActionReason(world, command(world, 'evict'))).toBeUndefined();
  world = act(world, command(world, 'evict'));
  expect(accountFor(world, world.people[row.tenantId], row.currency).cash).toBe(tenantCash + row.deposit);
  expect(world.lifestyle!.tenancies[0].arrears).toBe(unpaid); expect(world.lifestyle!.tenancies[0].depositHeld).toBe(0n);
  blocked(world, command(world, 'evict'), /current tenancy/);
});

test('real reported maintenance and insufficient funds block an independent review without changing payments', () => {
  let world = reviewReadyTenancy();
  while ((world.date.year * 12 + world.date.month) % 6 !== 0) world = landlordPeriod(world);
  world = landlordPeriod(world, true, true);
  const fee = tenancyReviewFee(world.assets[0].country);
  expect(world.lifestyle!.tenancies[0].maintenance).toBeGreaterThan(0n);
  blocked(world, command(world, 'review-eviction', fee), /completed repairs/);
  blocked(world, command(world, 'repair', 0n), /actual outstanding/);
  world = clearTenantRepairs(world);
  post(world, -availableCash(accountFor(world)), 0n, 'unit-expense', 'Explicit budget fixture'); validateWorld(world);
  blocked(world, command(world, 'review-eviction', fee), /Insufficient available funds/);
});

test('annual rent reviews validate timing, market bounds and the ten-percent cap while preserving the deposit and history', () => {
  let world = landlordFixture(), row = world.lifestyle!.tenancies[0];
  blocked(world, command(world, 'rent', row.rent), /once a year/);
  for (let i = 0; i < 12; i++) world = landlordPeriod(world, false);
  row = world.lifestyle!.tenancies[0];
  blocked(world, command(world, 'rent', row.rent * 111n / 100n), /10%/);
  blocked(world, command(world, 'rent', row.rent / 4n), /50%/);
  const deposit = row.deposit, periods = structuredClone(row.periods);
  expect(tenancyActionReason(world, command(world, 'rent', row.rent))).toBeUndefined();
  world = act(world, command(world, 'rent', row.rent));
  expect(world.lifestyle!.tenancies[0].deposit).toBe(deposit); expect(world.lifestyle!.tenancies[0].periods).toEqual(periods);
  blocked(world, command(world, 'rent', row.rent), /once a year/);
  expect(tenantCheckFee('US')).toBe(4000n); expect(tenancyReviewFee('US')).toBe(10000n);
});


test('a new background check verifies its displayed country quote, charges once and retains actual history', () => {
  let world = buyLifestyle(lifestyleFixture(), 'family-house'); const asset = world.assets[0];
  world = act(world, { type: 'find-tenants', assetId: asset.id, quotedRent: askingRent(asset) });
  const app = world.lifestyle!.applications[0], fee = tenantCheckFee(asset.country), before = encodeWorld(world);
  const command = { type: 'review-tenant' as const, applicationId: app.id, action: 'check' as const, quotedDeposit: world.assets[0].rentPerMonth, quotedCheckFee: fee };
  expect(() => resolveCommand(world, { ...command, quotedCheckFee: fee + 1n })).toThrow(/fee/); expect(encodeWorld(world)).toBe(before);
  const cash = accountFor(world).cash; world = act(world, command);
  expect(accountFor(world).cash).toBe(cash - fee); expect(world.lifestyle!.records.at(-1)!.paid).toBe(fee);
  expect(() => act(world, command)).toThrow(/already complete/);
});

test.each(['zero', 'partial', 'substantial'] as const)('ordinary ending permits %s arrears without changing escrow or historic rent records', arrears => {
  const world = ordinaryReadyTenancy(arrears), before = encodeWorld(world), row = world.lifestyle!.tenancies[0];
  expect(tenancyActionReason(world, command(world, 'end'))).toBeUndefined();
  const next = act(world, command(world, 'end'));
  expect(encodeWorld(world)).toBe(before);
  expect(next.lifestyle!.tenancies[0]).toMatchObject({ arrears: row.arrears, periods: row.periods, depositHeld: 0n });
  expect(next.lifestyle!.tenancies[0].ended).not.toBeNull();
  expect(next.ledger.filter(entry => entry.category === 'lifestyle-deposit-refund')).toHaveLength(1);
  expect(() => resolveCommand(next, command(next, 'end'))).toThrow(/current tenancy/);
});
