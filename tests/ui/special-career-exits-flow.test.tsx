import React from 'react';
import { Modal } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGameStore } from '../../src/state/gameStore';
import { encodeWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { serviceQualified } from '../../src/game/systems/serviceSchemas';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import { decodeSave } from '../../src/persistence/archive';
import * as checkpoints from '../../src/persistence/checkpoints';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import { EventModal } from '../../src/ui/EventModal';
import actorArchive from '../fixtures/v12-career-archive.json';
import musicArchive from '../fixtures/v13-music-archive.json';
import electionArchive from '../fixtures/v14-election-archive.json';
import studioArchive from '../fixtures/v15-studio-archive.json';
import serviceArchive from '../fixtures/v16-service-archive.json';
import pinnedArchive from '../fixtures/v30-native-workplace-story-archive.json';

let mockStore: ReturnType<typeof createGameStore>, mockKind = 'actor';
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ kind: mockKind }), router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Career from '../../app/(game)/career/[kind]';
import MusicStudio from '../../app/(game)/music-studio';
import Politics from '../../app/(game)/politics';
import CreatorStudio from '../../app/(game)/creator-studio/[kind]';
import Service from '../../app/(game)/service/[kind]';

type Domain = 'actor' | 'recording' | 'campaign' | 'streamer' | 'military';
const domains: Domain[] = ['actor', 'recording', 'campaign', 'streamer', 'military'];
const world = () => mockStore.getState().world!;
const frame = (domain: Domain) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{domain === 'actor' ? <Career /> : domain === 'recording' ? <MusicStudio /> : domain === 'campaign' ? <Politics /> : domain === 'streamer' ? <CreatorStudio /> : <Service />}<PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const modal = () => within(screen.UNSAFE_getByType(Modal));
const pressModal = async (name: string) => { await act(async () => { fireEvent.press(modal().getByRole('button', { name })); }); };
const reviewEvent = () => screen.UNSAFE_getAllByType(EventModal).find(item => item.props.event?.kind === 'confirmation')!.props.event;
const absolute = (value: World) => value.date.year * 12 + value.date.month - 1;
const acknowledge = (value: World) => resolveCommand(value, { type: 'acknowledge', resultId: value.pending!.id }, true);
function prepare(domain: Domain) {
  const save = decodeSave(JSON.stringify(domain === 'actor' ? actorArchive : domain === 'recording' ? musicArchive : domain === 'campaign' ? electionArchive : domain === 'streamer' ? studioArchive : serviceArchive));
  // Actual recorded prior states, not an invented partially paid recording/campaign.
  return domain === 'recording' || domain === 'campaign' ? checkpoints.unpackCheckpoint(save.snapshots[0].payload, true) : save.world;
}
async function setup(domain: Domain) {
  mockKind = domain === 'military' ? 'military' : domain === 'streamer' ? 'streamer' : 'actor';
  const initial = prepare(domain), directory = mkdtempSync(join(tmpdir(), 'dreams-career-exit-')), path = join(directory, 'dreams.db'); let sqlite: DatabaseSync;
  const connect = (): SqlDatabase => {
    sqlite = new DatabaseSync(path); sqlite.exec('PRAGMA foreign_keys=ON'); const connection = sqlite;
    const session: SqlSession = { run: async (sql, values = []) => { connection.prepare(sql).run(...values); }, get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null, all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[] };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => { connection.exec('BEGIN IMMEDIATE'); try { const result = await action(session); connection.exec('COMMIT'); return result; } catch (error) { connection.exec('ROLLBACK'); throw error; } } };
  };
  let repository = new SaveRepository(connect()); await repository.initialise(); await repository.import(JSON.stringify(pinnedArchive));
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])) as Record<string, Record<string, unknown>[]>;
  const pinned = rows(); expect(Object.keys(pinned)).toHaveLength(8); expect(pinned.lives[0].id).not.toBe(initial.id); await repository.create(initial);
  let nextYield: Promise<void> | undefined;
  const pauseNextSave = () => { let release!: () => void; nextYield = new Promise<void>(resolve => { release = resolve; }); return release; };
  const bootstrap = async () => { mockStore = createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'unused', yieldToUI: async () => { const pause = nextYield; nextYield = undefined; if (pause) await pause; } }); expect(await mockStore.getState().bootstrap()).toBe(true); }; await bootstrap();
  return { get sqlite() { return sqlite; }, rows, pauseNextSave, cold: async () => { sqlite.close(); repository = new SaveRepository(connect()); await bootstrap(); },
    original: () => {
      const now = rows();
      for (const table of ['lives', 'backups']) for (const row of pinned[table]) expect(now[table].find(item => (item.id ?? item.life_id) === (row.id ?? row.life_id))).toEqual(row);
      for (const table of ['snapshots', 'snapshot_metadata', 'branches', 'restore_receipts']) for (const row of pinned[table]) expect(now[table]).toContainEqual(row);
      for (const row of pinned.receipts) expect(sqlite.prepare('SELECT * FROM receipts WHERE life_id=? AND command_id=?').get(String(row.life_id), String(row.command_id))).toEqual(row);
      for (const point of pinnedArchive.snapshots) expect(sqlite.prepare('SELECT payload FROM snapshots WHERE life_id=? AND snapshot_id=?').get(String(pinned.lives[0].id), point.summary.id)?.payload).toBe(point.payload);
    }, close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); } };
}
function exit(domain: Domain) {
  if (domain === 'actor') return { row: /^Leave This Career\./, confirm: 'Leave Career', title: 'Leave this career?', command: { type: 'leave-career', careerId: world().careers.find(item => item.kind === 'actor')!.id } as GameCommand };
  if (domain === 'recording') return { row: /^Cancel Recording\./, confirm: 'Cancel Recording', title: 'Cancel ' + world().musicReleases[0].title + '?', command: { type: 'cancel-recording', releaseId: world().musicReleases[0].id } as GameCommand };
  if (domain === 'campaign') return { row: /^Withdraw from the Election\./, confirm: 'Withdraw Candidacy', title: 'Withdraw your candidacy?', command: { type: 'withdraw-campaign', electionId: world().elections[0].id } as GameCommand };
  if (domain === 'streamer') return { row: /^Leave Studio\./, confirm: 'Leave Studio', title: 'Leave this studio?', command: { type: 'leave-creator', studioId: world().creatorStudios[0].id } as GameCommand };
  return { row: /^Leave Service\./, confirm: 'Leave Service', title: 'Leave your service contract?', command: { type: 'leave-service', serviceId: world().serviceCareers[0].id } as GameCommand };
}
const personalWork = (value: World) => value.workHistory.filter(item => item.personId === value.activePersonId);
const liveTotals = (value: World) => {
  const account = value.socialAccounts.find(item => item.id === value.creatorStudios[0].accountId)!;
  return { posts: account.totalPosts, minutes: account.posts.reduce((sum, item) => sum + item.liveMinutes, 0) + account.archived.reduce((sum, item) => sum + item.liveMinutes, 0), crew: value.creatorInvoices.filter(item => item.studioId === value.creatorStudios[0].id) };
};
function expectRecordedBoundary(domain: Domain, initial: World) {
  if (domain === 'actor') { expect(initial.careers[0].status).toBe('between'); expect(initial.careers[0].projects[0].grossEarned).toBe(2000000n); expect(initial.careers[0].projects[0].periods).toHaveLength(6); }
  if (domain === 'recording') { expect(initial.musicReleases[0].status).toBe('recording'); expect(initial.musicReleases[0].monthsRecorded).toBe(0); expect(initial.musicReleases[0].paidProduction).toBe(0n); expect(initial.careers[0].projects[0].grossEarned).toBe(1000000n); }
  if (domain === 'campaign') { const candidate = initial.elections[0].candidates.find(item => item.personId === initial.activePersonId)!; expect(initial.elections[0].status).toBe('campaign'); expect(candidate.spent).toBe(candidate.registration); expect(candidate.registration).toBeGreaterThan(0n); }
  if (domain === 'streamer') { const total = liveTotals(initial); expect(total.posts).toBe(102); expect(total.minutes).toBe(6120); expect(total.crew.reduce((sum, item) => sum + item.paid, 0n)).toBe(132600n); expect(initial.creatorStudios[0].laptopId).not.toBeNull(); }
  if (domain === 'military') { const career = initial.serviceCareers[0]; expect(serviceQualified(career)).toBe(true); expect(career.contracts[0].trainingResult).toBe('passed'); expect(career.periods).toHaveLength(12); expect(career.periods.reduce((sum, item) => sum + item.gross, 0n)).toBe(3600000n); expect(career.assignments[0].status).toBe('completed'); }
}
function expectExitPreserves(domain: Domain, initial: World, done: World) {
  expect(done.accounts).toEqual(initial.accounts); expect(done.ledger).toEqual(initial.ledger); expect(done.assets).toEqual(initial.assets); expect(done.random).toEqual(initial.random);
  for (const row of personalWork(initial)) { const after = done.workHistory.find(item => item.id === row.id)!; expect(after.grossEarned).toBe(row.grossEarned); expect(after.monthsWorked).toBe(row.monthsWorked); }
  if (domain === 'actor') { expect(done.careers[0].status).toBe('left'); expect(done.careers[0].projects).toEqual(initial.careers[0].projects); expect(done.careers[0].contacts).toEqual(initial.careers[0].contacts); }
  if (domain === 'recording') { const release = done.musicReleases[0]; expect(release).toEqual({ ...initial.musicReleases[0], status: 'cancelled', pauseReason: null, ended: done.date }); expect(release.paidProduction).toBe(0n); expect(done.careers).toEqual(initial.careers); }
  if (domain === 'campaign') { expect(done.elections[0].candidates.find(item => item.personId === initial.activePersonId)!.status).toBe('withdrawn'); expect(done.elections[0].candidates.find(item => item.personId !== initial.activePersonId)).toEqual(initial.elections[0].candidates.find(item => item.personId !== initial.activePersonId)); expect(done.elections[0].responseRoll).toBe(initial.elections[0].responseRoll); }
  if (domain === 'streamer') { expect(done.creatorStudios[0].status).toBe('left'); expect(done.creatorStudios[0].crew).toEqual(initial.creatorStudios[0].crew.map(item => ({ ...item, ended: item.ended ?? done.date }))); expect(done.socialAccounts[0].cadence).toBe('off'); expect(liveTotals(done)).toEqual(liveTotals(initial)); expect(done.creatorStudios[0].laptopId).toBe(initial.creatorStudios[0].laptopId); }
  if (domain === 'military') { expect(done.serviceCareers[0].status).toBe('left'); expect(done.serviceCareers[0].contracts).toEqual(initial.serviceCareers[0].contracts.map(item => ({ ...item, ended: item.employmentId === initial.serviceCareers[0].employmentId ? done.date : item.ended }))); expect(done.serviceCareers[0].periods).toEqual(initial.serviceCareers[0].periods); expect(done.serviceCareers[0].assignments).toEqual(initial.serviceCareers[0].assignments); expect(serviceQualified(done.serviceCareers[0])).toBe(true); expect(done.people[done.activePersonId].employment).toBeNull(); }
}
async function completeYear() {
  let guard = 0;
  const finish = async () => {
    while ((world().pending || world().annual) && !world().people[world().activePersonId].died) {
      if (++guard > 120) throw new Error('Ordinary exit continuation stalled');
      const pending = world().pending;
      const choice = pending?.kind === 'decision' ? pending.choices.find(item => !choiceUnavailable(world(), item)) : undefined;
      if (pending?.kind === 'decision' && !choice) throw new Error('No available ordinary continuation choice');
      const command: GameCommand = pending?.kind === 'decision' ? { type: 'choose', eventId: pending.id, choiceId: choice!.id } : pending ? { type: 'acknowledge', resultId: pending.id } : { type: 'resume' };
      expect(await mockStore.getState().dispatch(command)).toBe(true);
    }
  };
  await finish(); const start = absolute(world()); expect(world().people[world().activePersonId].died).toBeNull(); expect(await mockStore.getState().dispatch({ type: 'advance' })).toBe(true); await finish(); expect(absolute(world()) - start).toBe(12); expect(world().annual).toBeNull();
}
function expectNoFutureWork(domain: Domain, initial: World, done: World) {
  const current = world();
  if (domain === 'actor') { expect(current.careers[0]).toEqual(done.careers[0]); expect(personalWork(current)).toEqual(personalWork(done)); }
  if (domain === 'recording') { expect(current.musicReleases[0]).toEqual(done.musicReleases[0]); expect(current.ledger.filter(item => item.personId === current.activePersonId && item.category === 'music-production')).toEqual(done.ledger.filter(item => item.personId === done.activePersonId && item.category === 'music-production')); }
  if (domain === 'campaign') { const race = current.elections[0], player = race.candidates.find(item => item.personId === current.activePersonId)!, rivalId = initial.elections[0].candidates.find(item => item.personId !== initial.activePersonId)!.personId; expect(race.status).toBe('completed'); const rival = race.candidates.find(item => item.personId === rivalId)!; expect(rival.periods).toHaveLength(6); expect(rival.periods.some(item => item.funded && item.spent > 0n)).toBe(true); expect(rival.spent).toBeGreaterThan(rival.registration); expect(race.winnerId).toBe(rivalId); expect(player.periods).toHaveLength(6); expect(player.status).toBe('withdrawn'); expect(player.spent).toBe(initial.elections[0].candidates.find(item => item.personId === initial.activePersonId)!.spent); expect(player.periods.every(item => !item.funded && item.spent === 0n)).toBe(true); expect(race.winnerId).not.toBe(current.activePersonId); expect(personalWork(current)).toEqual(personalWork(done)); const licence = current.musicReleases[0], priorLicence = initial.musicReleases[0]; expect(priorLicence.status).toBe('released'); expect(licence.monthsReleased).toBe(priorLicence.monthsReleased + 12); expect(licence.periods).toHaveLength(priorLicence.periods.length + 12); expect(licence.royalties).toBeGreaterThan(priorLicence.royalties); }
  if (domain === 'streamer') { expect(liveTotals(current)).toEqual(liveTotals(done)); expect(current.creatorStudios[0]).toMatchObject({ id: done.creatorStudios[0].id, status: 'left', focus: 'part-time', ended: done.creatorStudios[0].ended, crew: done.creatorStudios[0].crew, laptopId: done.creatorStudios[0].laptopId, cameraId: done.creatorStudios[0].cameraId }); expect(current.socialAccounts[0].cadence).toBe('off'); for (const asset of done.assets) expect(current.assets.find(item => item.id === asset.id)).toMatchObject({ id: asset.id, ownerId: asset.ownerId, catalogId: asset.catalogId }); }
  if (domain === 'military') { expect(current.serviceCareers[0]).toEqual(done.serviceCareers[0]); expect(personalWork(current)).toEqual(personalWork(done)); expect(current.people[current.activePersonId].employment).toBeNull(); }
}

test.each(domains)('genuine %s exit retains failed UI review, retries durably and stops its future work through an ordinary year', async domain => {
  const context = await setup(domain);
  try {
    let view = render(frame(domain)); if (world().pending) { expect(world().pending!.kind).toBe('result'); await press('Continue'); }
    const initial = world(), before = context.rows(), canonical = encodeWorld(initial), action = exit(domain); expectRecordedBoundary(domain, initial); const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    await press(action.row); expect(modal().getByText(action.title)).toBeOnTheScreen(); await press('Never mind'); expect(world()).toEqual(initial); expect(context.rows()).toEqual(before);
    await press(action.row); const reviewed = reviewEvent(), expected = resolveCommand(initial, action.command, true), release = context.pauseNextSave();
    context.sqlite.exec("CREATE TRIGGER fail_career_exit BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await pressModal(action.confirm); expect(mockStore.getState().busy).toBe(true); expect(modal().getByRole('button', { name: action.confirm })).toHaveProp('accessibilityState', { disabled: true, busy: true });
    await pressModal(action.confirm); await press('Never mind'); await act(async () => { screen.UNSAFE_getByType(Modal).props.onRequestClose(); }); expect(reviewEvent()).toBe(reviewed); expect(context.rows()).toEqual(before);
    await act(async () => { release(); }); await waitFor(() => expect(modal().getByRole('alert')).toHaveTextContent(/couldn't be saved/)); expect(screen.getAllByRole('alert')).toHaveLength(1); expect(reviewEvent()).toBe(reviewed); expect(modal().getByText(reviewed.body)).toBeOnTheScreen(); expect(context.rows()).toEqual(before); expect(encodeWorld(world())).toBe(canonical);
    context.sqlite.exec('DROP TRIGGER fail_career_exit'); await pressModal(action.confirm); expect(world()).toEqual(expected); expect(screen.queryByText(action.title)).toBeNull(); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore(); expect(context.sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(initial.id)?.payload).toBe(before.lives.find(item => item.id === initial.id)!.payload); const savedRows = context.rows();
    view.unmount(); await context.cold(); view = render(frame(domain)); expect(world()).toEqual(expected); expect(context.rows()).toEqual(savedRows); expect(screen.getByText(expected.pending!.title)).toBeOnTheScreen(); await press('Continue'); const done = acknowledge(expected); expect(world()).toEqual(done); expectExitPreserves(domain, initial, done);
    const acknowledgedRows = context.rows(); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: expected.pending!.id })).toBe(false); }); expect(world()).toEqual(done); expect(context.rows()).toEqual(acknowledgedRows); context.original(); view.unmount();
    await completeYear(); expectNoFutureWork(domain, initial, done); context.original(); const final = world(), finalRows = context.rows(); await context.cold(); view = render(frame(domain)); expect(world()).toEqual(final); expect(context.rows()).toEqual(finalRows); expect(screen.queryByRole('button', { name: action.row })).toBeNull(); context.original(); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});
