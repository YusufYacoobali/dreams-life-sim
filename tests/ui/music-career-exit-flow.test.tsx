import { displayText } from '../../src/ui/displayNumbers';
import React from 'react';
import { Modal } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGameStore } from '../../src/state/gameStore';
import { encodeWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { formatMoney } from '../../src/game/money';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import { EventModal } from '../../src/ui/EventModal';
import musicArchive from '../fixtures/v13-music-archive.json';
import pinnedArchive from '../fixtures/v30-native-workplace-story-archive.json';

let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ kind: 'musician' }), router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Career from '../../app/(game)/career/[kind]';
import MusicStudio from '../../app/(game)/music-studio';

const world = () => mockStore.getState().world!;
const frame = (studio = false) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{studio ? <MusicStudio /> : <Career />}<PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const modal = () => within(screen.UNSAFE_getByType(Modal));
const pressModal = async (name: string) => { await act(async () => { fireEvent.press(modal().getByRole('button', { name })); }); };
const reviewEvent = () => screen.UNSAFE_getAllByType(EventModal).find(item => item.props.event?.kind === 'confirmation')!.props.event;
const personalWork = (value: World) => value.workHistory.filter(item => item.personId === value.activePersonId);
const absolute = (value: World) => value.date.year * 12 + value.date.month - 1;
async function setup() {
  const directory = mkdtempSync(join(tmpdir(), 'dreams-music-career-exit-')), path = join(directory, 'dreams.db'); let sqlite: DatabaseSync;
  const connect = (): SqlDatabase => {
    sqlite = new DatabaseSync(path); sqlite.exec('PRAGMA foreign_keys=ON'); const connection = sqlite;
    const session: SqlSession = { run: async (sql, values = []) => { connection.prepare(sql).run(...values); }, get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null, all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[] };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => { connection.exec('BEGIN IMMEDIATE'); try { const result = await action(session); connection.exec('COMMIT'); return result; } catch (error) { connection.exec('ROLLBACK'); throw error; } } };
  };
  let repository = new SaveRepository(connect()); await repository.initialise(); await repository.import(JSON.stringify(pinnedArchive));
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])) as Record<string, Record<string, unknown>[]>;
  const pinned = rows(); await repository.import(JSON.stringify(musicArchive)); const imported = rows(), recorded = (await repository.active())!;
  let nextYield: Promise<void> | undefined;
  const pauseNextSave = () => { let release!: () => void; nextYield = new Promise<void>(resolve => { release = resolve; }); return release; };
  const bootstrap = async () => { mockStore = createGameStore({ repository: async () => repository, date: () => recorded.date, id: () => 'unused', yieldToUI: async () => { const pause = nextYield; nextYield = undefined; if (pause) await pause; } }); expect(await mockStore.getState().bootstrap()).toBe(true); }; await bootstrap();
  return { get sqlite() { return sqlite; }, rows, pauseNextSave, cold: async () => { sqlite.close(); repository = new SaveRepository(connect()); await bootstrap(); },
    original: () => {
      const now = rows();
      for (const table of ['lives', 'backups']) for (const row of pinned[table]) expect(now[table]).toContainEqual(row);
      for (const table of ['snapshots', 'snapshot_metadata', 'branches', 'restore_receipts']) for (const row of imported[table]) expect(now[table]).toContainEqual(row);
      for (const row of imported.receipts) expect(sqlite.prepare('SELECT * FROM receipts WHERE life_id=? AND command_id=?').get(String(row.life_id), String(row.command_id))).toEqual(row);
      for (const [input, lifeId] of [[musicArchive, recorded.id], [pinnedArchive, String(pinned.lives[0].id)]] as const) for (const point of input.snapshots) expect(sqlite.prepare('SELECT payload FROM snapshots WHERE life_id=? AND snapshot_id=?').get(lifeId, point.summary.id)?.payload).toBe(point.payload);
    }, close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); } };
}
async function ordinaryYear() {
  const start = absolute(world()); expect(world().annual).toBeNull(); expect(world().pending).toBeNull(); expect(await mockStore.getState().dispatch({ type: 'advance' })).toBe(true); let guard = 0;
  while ((world().pending || world().annual) && !world().people[world().activePersonId].died) {
    if (++guard > 80) throw new Error('Music exit year stalled'); const pending = world().pending;
    const choice = pending?.kind === 'decision' ? pending.choices.find(item => !choiceUnavailable(world(), item)) : undefined;
    if (pending?.kind === 'decision' && !choice) throw new Error('No available ordinary decision');
    const command: GameCommand = pending?.kind === 'decision' ? { type: 'choose', eventId: pending.id, choiceId: choice!.id } : pending ? { type: 'acknowledge', resultId: pending.id } : { type: 'resume' };
    expect(await mockStore.getState().dispatch(command)).toBe(true);
  }
  expect(absolute(world()) - start).toBe(12); expect(world().annual).toBeNull(); expect(world().pending).toBeNull();
}

test('leaving a genuinely released Musician career keeps earned work and continues the same paid licence after rollback, retry and cold resume', async () => {
  const context = await setup();
  try {
    const initial = world(), personId = initial.activePersonId, career = initial.careers.find(item => item.kind === 'musician')!, licence = initial.musicReleases[0], before = context.rows(), canonical = encodeWorld(initial);
    expect(Object.keys(before)).toHaveLength(8); expect(career.status).toBe('between'); expect(career.projects[0].grossEarned).toBe(1000000n); expect(licence.status).toBe('released'); expect(licence.totalUnits).toBe(121470); expect(licence.royalties).toBe(242940n); expect(licence.periods).toHaveLength(6); expect(licence.paidProduction).toBe(licence.productionCost);
    const command: GameCommand = { type: 'leave-career', careerId: career.id }, expected = resolveCommand(initial, command, true), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); let view = render(frame());
    await press(/^Leave This Career\./); await press('Never mind'); expect(context.rows()).toEqual(before); expect(encodeWorld(world())).toBe(canonical);
    await press(/^Leave This Career\./); const review = reviewEvent(), release = context.pauseNextSave(); context.sqlite.exec("CREATE TRIGGER fail_music_exit BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await pressModal('Leave Career'); expect(modal().getByRole('button', { name: 'Leave Career' })).toHaveProp('accessibilityState', { disabled: true, busy: true });
    await pressModal('Leave Career'); await press('Never mind'); await act(async () => { screen.UNSAFE_getByType(Modal).props.onRequestClose(); }); expect(reviewEvent()).toBe(review); expect(context.rows()).toEqual(before);
    await act(async () => { release(); }); await waitFor(() => expect(modal().getByRole('alert')).toHaveTextContent(/couldn't be saved/)); expect(screen.getAllByRole('alert')).toHaveLength(1); expect(reviewEvent()).toBe(review); expect(modal().getByText(review.body)).toBeOnTheScreen(); expect(encodeWorld(world())).toBe(canonical); expect(context.rows()).toEqual(before);
    context.sqlite.exec('DROP TRIGGER fail_music_exit'); await pressModal('Leave Career'); expect(world()).toEqual(expected); expect(screen.queryByText('Leave this career?')).toBeNull(); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore(); expect(context.sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(initial.id)?.payload).toBe(before.lives.find(item => item.id === initial.id)!.payload);
    const committedRows = context.rows(); view.unmount(); await context.cold(); view = render(frame()); expect(world()).toEqual(expected); expect(context.rows()).toEqual(committedRows); await press('Continue'); const done = resolveCommand(expected, { type: 'acknowledge', resultId: expected.pending!.id }, true); expect(world()).toEqual(done);
    expect(done.careers.find(item => item.id === career.id)).toEqual({ ...career, status: 'left', ended: done.date }); expect(done.musicReleases).toEqual(initial.musicReleases); expect(done.people[personId].employment).toBeNull(); expect(personalWork(done)).toEqual(personalWork(initial)); expect(done.accounts).toEqual(initial.accounts); expect(done.ledger).toEqual(initial.ledger); expect(done.random).toEqual(initial.random);
    const acknowledgedRows = context.rows(); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: expected.pending!.id })).toBe(false); }); expect(world()).toEqual(done); expect(context.rows()).toEqual(acknowledgedRows); context.original(); view.unmount();
    await ordinaryYear(); const final = world(), later = final.musicReleases.find(item => item.id === licence.id)!;
    expect(final.careers.find(item => item.id === career.id)).toEqual(done.careers.find(item => item.id === career.id)); expect(personalWork(final)).toEqual(personalWork(done)); expect(final.people[personId].employment).toBeNull(); expect(final.people[personId].finance.serviceMonths).toBe(done.people[personId].finance.serviceMonths);
    expect(later.status).toBe('released'); expect(later.monthsReleased).toBe(18); expect(later.periods.slice(0, 6)).toEqual(licence.periods); const newPeriods = later.periods.slice(6); expect(newPeriods).toHaveLength(12);
    const terms = ['id', 'personId', 'careerId', 'title', 'currency', 'unitPay', 'productionCost', 'paidProduction', 'released', 'responseRoll', 'scores', 'quality'] as const; for (const key of terms) expect(later[key]).toEqual(licence[key]);
    const paid = newPeriods.reduce((sum, item) => sum + item.royalty, 0n), units = newPeriods.reduce((sum, item) => sum + item.units, 0); expect(paid).toBeGreaterThan(0n); for (const item of newPeriods) expect(item.royalty).toBe(BigInt(item.units) * licence.unitPay); expect(later.royalties).toBe(licence.royalties + paid); expect(later.totalUnits).toBe(licence.totalUnits + units);
    const newLedger = final.ledger.slice(done.ledger.length), royalties = newLedger.filter(item => item.personId === personId && item.category === 'career-royalties'); expect(royalties).toHaveLength(12); expect(royalties.every(item => item.currency === licence.currency && item.cashDelta > 0n)).toBe(true); expect(royalties.reduce((sum, item) => sum + item.cashDelta, 0n)).toBe(paid); expect(newLedger.filter(item => item.personId === personId && item.category === 'income')).toEqual([]); expect(newLedger.filter(item => item.personId === personId && item.category === 'music-production')).toEqual([]); context.original();
    const finalRows = context.rows(); await context.cold(); view = render(frame()); expect(world()).toEqual(final); expect(context.rows()).toEqual(finalRows); expect(screen.queryByRole('button', { name: /^Leave This Career\./ })).toBeNull(); await press(/^Music Studio\./); expect(router.push).toHaveBeenCalledWith('/music-studio'); view.rerender(frame(true)); expect(screen.getByText('18 of 60 listening periods')).toBeOnTheScreen(); expect(screen.getByLabelText('Royalties received: ' + displayText(formatMoney({ minor: later.royalties, currency: later.currency })))).toBeOnTheScreen(); expect(context.rows()).toEqual(finalRows); context.original(); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});
