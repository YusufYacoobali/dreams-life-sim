import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '../support/rendering';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../../src/ui/theme';
import { LandlordDashboard } from '../../src/ui/LandlordDashboard';
import { PendingEvent } from '../../src/ui/PendingEvent';
import { createGameStore } from '../../src/state/gameStore';
import { SaveRepository } from '../../src/persistence/repository';
import { diskDatabase } from '../support/refinementSqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { landlordFixture, landlordPeriod, reviewReadyTenancy, clearTenantRepairs, ordinaryReadyTenancy } from '../support/landlord';
import { act as apply } from '../helpers/lifestyle';
import { encodeWorld, type World } from '../../src/game/model';
import { tenancyReviewFee } from '../../src/game/systems/landlordTenancies';
import { useGame } from '../../src/state/useGame';
import { monthFrom } from '../../src/game/calendar';
import { accountFor } from '../../src/game/systems/common';
import { resolveCommand } from '../../src/game/engine';
let mockStore: ReturnType<typeof createGameStore>;
jest.mock('../../src/state/useGame', () => ({ useGame: (select: unknown) => require('zustand').useStore(mockStore, select) }));
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
function Screen() { const world = useGame(state => state.world)!; return <LandlordDashboard world={world} asset={world.assets[0]} />; }
const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 320, height: 640 }, insets: { top: 24, bottom: 24, left: 0, right: 0 } }}><ThemeProvider><Screen /><PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { await fireEvent.press(screen.getByRole('button', { name })); }); };
const ending = async (mode: 'end' | 'evict') => { await act(async () => { await fireEvent.press(screen.getByRole('radio', { name: mode === 'end' ? /^End Tenancy Normally/ : /^Evict for Unpaid Rent/ })); }); };
async function saved(world: World) {
  const folder = mkdtempSync(join(tmpdir(), 'dreams-landlord-polish-')), file = join(folder, 'life.db');
  let { sqlite, driver } = diskDatabase(file), repository = new SaveRepository(driver);
  await repository.initialise(); await repository.create(world);
  const cold = async () => {
    sqlite.close(); ({ sqlite, driver } = diskDatabase(file)); repository = new SaveRepository(driver); await repository.initialise();
    mockStore = createGameStore({ repository: async () => repository, date: () => world.date, id: () => 'unused' }); await mockStore.getState().bootstrap();
  };
  await cold();
  return { get sqlite() { return sqlite; }, get repository() { return repository; }, cold, close() { sqlite.close(); rmSync(folder, { recursive: true, force: true }); } };
}

test('a genuine saved tenancy cannot complete eviction before notice or before a paid independent review', async () => {
  const initial = landlordFixture(), db = await saved(initial);
  try {
    const before = encodeWorld(initial), view = await render(frame());
    for (const name of ['Tenants & Applications', 'Rent & Payments', 'Maintenance', 'End Tenancy']) expect(screen.getByRole('button', { name })).toBeOnTheScreen();
    await press('End Tenancy'); expect(screen.queryByRole('button', { name: 'Complete Eviction' })).toBeNull();
    await press('Give Two Months’ Notice'); expect(encodeWorld(mockStore.getState().world!)).toBe(before);
    await press('Never mind'); expect(encodeWorld(await db.repository.load(initial.id))).toBe(before);
    await press('Give Two Months’ Notice'); await press('Confirm'); await press('Continue');
    expect(screen.queryByRole('button', { name: 'Complete Eviction' })).toBeNull(); expect(screen.getByText('Notice: 0 of 2 months complete')).toBeOnTheScreen();
    const checkpoint = encodeWorld(mockStore.getState().world!); expect(encodeWorld(await db.repository.load(initial.id))).toBe(checkpoint);
    await view.unmount();
  } finally { db.close(); }
});

test('reviewed eviction survives actual SQLite failure, cold reopen, the further month and a once-only deposit refund', async () => {
  const initial = reviewReadyTenancy(), db = await saved(initial);
  try {
    const view = await render(frame()), before = encodeWorld(initial), fee = tenancyReviewFee(initial.assets[0].country);
    await press('End Tenancy'); await ending('evict'); await press(/^Independent Eviction Review/);
    db.sqlite.exec("CREATE TRIGGER fail_tenancy_review BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press('Confirm'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/));
    expect(encodeWorld(await db.repository.load(initial.id))).toBe(before);
    db.sqlite.exec('DROP TRIGGER fail_tenancy_review'); await press('Confirm'); await press('Continue');
    const reviewed = mockStore.getState().world!, row = reviewed.lifestyle!.tenancies[0]; expect(row.reviewPaid).toBe(fee);
    expect(screen.queryByRole('button', { name: 'Complete Eviction' })).toBeNull();
    await view.unmount(); await db.cold(); const reopened = await render(frame());
    expect(encodeWorld(mockStore.getState().world!)).toBe(encodeWorld(reviewed));
    const next = clearTenantRepairs(landlordPeriod(mockStore.getState().world!));
    await db.repository.commit(next, reviewed.revision, 'fixture:next-real-rent-period'); await db.cold(); await reopened.rerender(frame());
    await press('End Tenancy'); await ending('evict'); await press('Complete Eviction');
    const ready = encodeWorld(mockStore.getState().world!);
    db.sqlite.exec("CREATE TRIGGER fail_tenancy_end BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press('Confirm'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/)); expect(encodeWorld(await db.repository.load(initial.id))).toBe(ready);
    db.sqlite.exec('DROP TRIGGER fail_tenancy_end'); await press('Confirm');
    const ended = mockStore.getState().world!, closed = ended.lifestyle!.tenancies[0];
    expect(closed.ended).not.toBeNull(); expect(closed.depositHeld).toBe(0n); expect(closed.arrears).toBeGreaterThan(0n);
    expect(ended.ledger.filter(item => item.category === 'lifestyle-deposit-refund')).toHaveLength(1);
    expect(encodeWorld(await db.repository.load(initial.id))).toBe(encodeWorld(ended)); await reopened.unmount();
  } finally { db.close(); }
});

test.each(['zero', 'partial', 'substantial'] as const)('ordinary ending is available with %s arrears and preserves the actual debt, periods and full escrow refund', async arrears => {
  const initial = ordinaryReadyTenancy(arrears), original = initial.lifestyle!.tenancies[0], db = await saved(initial);
  try {
    const before = encodeWorld(initial), tenantCash = accountFor(initial, initial.people[original.tenantId], original.currency).cash;
    const view = await render(frame()); await press('End Tenancy');
    expect(screen.getByRole('radio', { name: /^End Tenancy Normally/ })).toBeChecked();
    expect(screen.getByRole('button', { name: 'End Tenancy After Notice' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Complete Eviction' })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Independent Eviction Review/ })).toBeNull();
    await ending('evict');
    expect(screen.queryByRole('button', { name: 'End Tenancy After Notice' })).toBeNull();
    if (arrears !== 'substantial') expect(screen.queryByRole('button', { name: /^Independent Eviction Review/ })).toBeNull();
    await ending('end'); expect(encodeWorld(await db.repository.load(initial.id))).toBe(before);
    await press('End Tenancy After Notice'); await press('Never mind'); expect(encodeWorld(await db.repository.load(initial.id))).toBe(before);
    await press('End Tenancy After Notice'); await press('Confirm');
    const expected = resolveCommand(initial, { type: 'manage-tenancy', tenancyId: original.id, action: 'end', quotedAmount: 0n }, true);
    const world = mockStore.getState().world!, row = world.lifestyle!.tenancies[0];
    expect(world).toEqual(expected); expect(row.arrears).toBe(original.arrears); expect(row.periods).toEqual(original.periods);
    expect(row.depositHeld).toBe(0n); expect(row.depositRefundId).not.toBeNull();
    expect(accountFor(world, world.people[row.tenantId], row.currency).cash).toBe(tenantCash + original.depositHeld);
    expect(world.ledger.filter(entry => entry.category === 'lifestyle-deposit-refund')).toHaveLength(1);
    await view.unmount(); await db.cold(); expect(mockStore.getState().world).toEqual(expected);
  } finally { db.close(); }
});

test('both eligible endings have one selected termination action and mode changes never write', async () => {
  let initial = reviewReadyTenancy(), row = initial.lifestyle!.tenancies[0];
  initial = apply(initial, { type: 'manage-tenancy', tenancyId: row.id, action: 'review-eviction', quotedAmount: tenancyReviewFee(initial.assets[0].country) });
  initial = clearTenantRepairs(landlordPeriod(initial));
  const db = await saved(initial);
  try {
    const before = encodeWorld(initial); await render(frame()); await press('End Tenancy');
    expect(screen.getByRole('button', { name: 'End Tenancy After Notice' })).toBeEnabled(); expect(screen.queryByRole('button', { name: 'Complete Eviction' })).toBeNull();
    await ending('evict'); expect(screen.getByRole('button', { name: 'Complete Eviction' })).toBeEnabled(); expect(screen.queryByRole('button', { name: 'End Tenancy After Notice' })).toBeNull();
    await ending('end'); expect(screen.getByRole('button', { name: 'End Tenancy After Notice' })).toBeEnabled(); expect(screen.queryByRole('button', { name: 'Complete Eviction' })).toBeNull();
    expect(encodeWorld(await db.repository.load(initial.id))).toBe(before);
  } finally { db.close(); }
});

test('ordinary ending with partial arrears rolls back a failed save and succeeds once after a closed-connection reopen', async () => {
  const initial = ordinaryReadyTenancy('partial'), db = await saved(initial), original = initial.lifestyle!.tenancies[0];
  try {
    const view = await render(frame()); await press('End Tenancy'); await press('End Tenancy After Notice');
    db.sqlite.exec("CREATE TRIGGER fail_ordinary_end BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press('Confirm'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/));
    expect(mockStore.getState().world).toEqual(initial); expect(await db.repository.load(initial.id)).toEqual(initial);
    await view.unmount(); await db.cold(); db.sqlite.exec('DROP TRIGGER fail_ordinary_end');
    const reopened = await render(frame()); await press('End Tenancy'); await press('End Tenancy After Notice'); await press('Confirm');
    const expected = resolveCommand(initial, { type: 'manage-tenancy', tenancyId: original.id, action: 'end', quotedAmount: 0n }, true);
    expect(mockStore.getState().world).toEqual(expected);
    expect(expected.lifestyle!.tenancies[0].arrears).toBe(original.arrears);
    expect(expected.ledger.filter(entry => entry.category === 'lifestyle-deposit-refund')).toHaveLength(1);
    await reopened.unmount(); await db.cold(); expect(mockStore.getState().world).toEqual(expected);
  } finally { db.close(); }
});

test('normal ending shows the actual unfinished notice period instead of a disabled termination button', async () => {
  let initial = landlordFixture(), row = initial.lifestyle!.tenancies[0];
  initial = apply(initial, { type: 'manage-tenancy', tenancyId: row.id, action: 'notice', quotedAmount: 0n });
  initial = clearTenantRepairs(landlordPeriod(initial));
  const db = await saved(initial);
  try {
    const before = encodeWorld(initial); await render(frame()); await press('End Tenancy');
    expect(screen.getByText('Notice: 1 of 2 months complete')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'End Tenancy After Notice' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Give Two Months’ Notice' })).toBeNull();
    expect(encodeWorld(await db.repository.load(initial.id))).toBe(before);
  } finally { db.close(); }
});

test('normal ending keeps actual repairs visible and becomes available only after paying their real quote', async () => {
  let initial = reviewReadyTenancy();
  while ((initial.date.year * 12 + initial.date.month) % 6 !== 0) initial = landlordPeriod(initial);
  initial = landlordPeriod(initial, true, true);
  const row = initial.lifestyle!.tenancies[0]; expect(row.maintenance).toBeGreaterThan(0n);
  const db = await saved(initial);
  try {
    const before = encodeWorld(initial); await render(frame()); await press('End Tenancy');
    expect(screen.queryByRole('button', { name: 'End Tenancy After Notice' })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Independent Eviction Review/ })).toBeNull();
    await press(/^Arrange Outstanding Repairs/); await press('Never mind'); expect(encodeWorld(await db.repository.load(initial.id))).toBe(before);
    await press(/^Arrange Outstanding Repairs/); await press('Confirm'); await press('Continue');
    expect(mockStore.getState().world!.lifestyle!.tenancies[0].maintenance).toBe(0n);
    expect(mockStore.getState().world!.lifestyle!.tenancies[0].arrears).toBe(row.arrears);
    expect(screen.getByRole('button', { name: 'End Tenancy After Notice' })).toBeEnabled();
  } finally { db.close(); }
});

test('annual rent options use the resolver limits and cannot open a confirmation when the market has fallen', async () => {
  let initial = landlordFixture(); for (let i = 0; i < 12; i++) initial = landlordPeriod(initial, false);
  initial.assets[0].value /= 2n;
  const db = await saved(initial);
  try {
    const before = encodeWorld(initial); await render(frame()); await press('Rent & Payments');
    for (const name of ['Reduce Rent by 10%', 'Keep Current Rent', 'Increase Rent by 10%']) {
      expect(screen.getByRole('button', { name: new RegExp('^' + name.replace('%', '%')) })).toBeDisabled();
      await press(new RegExp('^' + name));
    }
    expect(screen.queryByRole('button', { name: 'Confirm' })).toBeNull(); expect(encodeWorld(await db.repository.load(initial.id))).toBe(before);
    await press('Payment History'); expect(screen.getByRole('header', { name: 'Monthly Payments' })).toBeOnTheScreen();
  } finally { db.close(); }
});
