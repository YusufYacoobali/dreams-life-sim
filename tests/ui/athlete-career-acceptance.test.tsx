import { purchases } from '../../src/purchases/native';
import { features } from '../../src/purchases/catalog';
// This existing gameplay/save journey uses a licensed-player fixture.
beforeEach(() => { purchases.setState({ ownership: Object.fromEntries(features.map(feature => [feature, true])) as Record<typeof features[number], boolean> }); });
import { displayText } from '../../src/ui/displayNumbers';
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
import { careerPayQuote, coachingCost, selectionReason } from '../../src/game/systems/careers';
import { formatMoney } from '../../src/game/money';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import { EventModal } from '../../src/ui/EventModal';
import actorArchive from '../fixtures/v12-career-archive.json';
import pinnedArchive from '../fixtures/v30-native-workplace-story-archive.json';

jest.setTimeout(90000);
let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() }, useLocalSearchParams: () => ({ kind: 'athlete' }) }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Athlete from '../../app/(game)/career/[kind]';
import Training from '../../app/(game)/career-training';

const world = () => mockStore.getState().world!;
const person = () => world().people[world().activePersonId];
const athlete = () => world().careers.find(item => item.personId === world().activePersonId && item.kind === 'athlete');
const frame = (training = false) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, bottom: 48, left: 0, right: 0 } }}><ThemeProvider>{training ? <Training /> : <Athlete />}<PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const modal = () => within(screen.UNSAFE_getByType(Modal));
const confirm = async (name: string) => { await act(async () => { fireEvent.press(modal().getByRole('button', { name })); }); };
const review = () => screen.UNSAFE_getAllByType(EventModal).find(item => item.props.event?.kind === 'confirmation')!;
const absolute = (value: World) => value.date.year * 12 + value.date.month - 1;
const dispatch = async (command: GameCommand) => { expect(await mockStore.getState().dispatch(command)).toBe(true); };

async function settle() {
  let guard = 0;
  while (world().pending || world().annual) {
    if (++guard > 160) throw new Error('Athlete annual continuation exceeded its bound');
    if (person().died) throw new Error('Actual death interrupted Athlete acceptance');
    const pending = world().pending, choice = pending?.kind === 'decision' ? pending.choices.find(item => !choiceUnavailable(world(), item)) : undefined;
    if (pending?.kind === 'decision' && !choice) throw new Error('No eligible ordinary decision');
    await dispatch(pending?.kind === 'decision' ? { type: 'choose', eventId: pending.id, choiceId: choice!.id } : pending ? { type: 'acknowledge', resultId: pending.id } : { type: 'resume' });
  }
}
async function year() { const start = absolute(world()); await dispatch({ type: 'advance' }); await settle(); expect(absolute(world()) - start).toBe(12); }

async function setup() {
  const directory = mkdtempSync(join(tmpdir(), 'dreams-athlete-acceptance-')), path = join(directory, 'dreams.db'); let sqlite: DatabaseSync, repository: SaveRepository;
  function connect(): SqlDatabase {
    const connection = sqlite = new DatabaseSync(path); connection.exec('PRAGMA foreign_keys=ON');
    const session: SqlSession = { run: async (sql, values = []) => { connection.prepare(sql).run(...values); }, get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null, all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[] };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => { connection.exec('BEGIN IMMEDIATE'); try { const value = await action(session); connection.exec('COMMIT'); return value; } catch (error) { connection.exec('ROLLBACK'); throw error; } } };
  }
  repository = new SaveRepository(connect()); await repository.initialise(); await repository.import(JSON.stringify(pinnedArchive));
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])) as Record<string, Record<string, unknown>[]>;
  const pinned = rows(); await repository.import(JSON.stringify(actorArchive)); const original = rows(), initial = (await repository.active())!;
  let nextYield: Promise<void> | undefined;
  const pause = () => { let release!: () => void; nextYield = new Promise<void>(resolve => { release = resolve; }); return release; };
  async function bootstrap() { mockStore = createGameStore({ premiumAccess: () => true,  repository: async () => repository, date: () => initial.date, id: () => 'unused', yieldToUI: async () => { const pending = nextYield; nextYield = undefined; if (pending) await pending; } }); expect(await mockStore.getState().bootstrap()).toBe(true); }
  await bootstrap();
  return { get sqlite() { return sqlite; }, rows, pause, cold: async () => { sqlite.close(); repository = new SaveRepository(connect()); await bootstrap(); }, original: () => {
    const current = rows(); for (const table of ['lives', 'backups']) for (const row of pinned[table]) expect(current[table]).toContainEqual(row);
    for (const table of ['snapshots', 'snapshot_metadata', 'branches', 'restore_receipts']) for (const row of original[table]) expect(current[table]).toContainEqual(row);
    for (const row of original.receipts) expect(sqlite.prepare('SELECT * FROM receipts WHERE life_id=? AND command_id=?').get(String(row.life_id), String(row.command_id))).toEqual(row);
    for (const [archive, id] of [[actorArchive, initial.id], [pinnedArchive, String(pinned.lives[0].id)]] as const) for (const point of archive.snapshots) expect(sqlite.prepare('SELECT payload FROM snapshots WHERE life_id=? AND snapshot_id=?').get(id, point.summary.id)?.payload).toBe(point.payload);
  }, close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); } };
}

async function durableReview(context: Awaited<ReturnType<typeof setup>>, launch: string | RegExp, label: string, command: GameCommand) {
  const initial = world(), before = context.rows(); await press(launch); await press('Never mind'); expect(world()).toBe(initial); expect(context.rows()).toEqual(before);
  await press(launch); const selected = review().props.event, submit = review().props.onChoose, unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), release = context.pause();
  context.sqlite.exec("CREATE TRIGGER fail_athlete_acceptance BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  await act(async () => { fireEvent.press(modal().getByRole('button', { name: label })); submit('confirm'); }); expect(mockStore.getState().busy).toBe(true); expect(modal().getByRole('button', { name: label })).toBeDisabled();
  await press('Never mind'); await act(async () => { screen.UNSAFE_getByType(Modal).props.onRequestClose(); }); expect(review().props.event).toBe(selected); expect(world()).toBe(initial); expect(context.rows()).toEqual(before);
  await act(async () => { release(); }); await waitFor(() => expect(modal().getByRole('alert')).toHaveTextContent(/couldn't be saved/));
  expect(screen.getAllByRole('alert')).toHaveLength(1); expect(review().props.event).toBe(selected); expect(modal().getByText(selected.body)).toBeOnTheScreen(); expect(world()).toBe(initial); expect(context.rows()).toEqual(before);
  context.sqlite.exec('DROP TRIGGER fail_athlete_acceptance'); await confirm(label);
  // Resolve for comparison only AFTER the real retry; no predicted outcome chooses a tryout or policy action.
  const expected = resolveCommand(initial, command, true); expect(world()).toEqual(expected); expect(world().revision).toBe(initial.revision + 1); expect(context.rows().receipts).toHaveLength(before.receipts.length + 1);
  expect(context.sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(initial.id)?.payload).toBe(before.lives.find(row => row.id === initial.id)!.payload);
  expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore(); context.original(); return expected;
}

test('an archived actor earns Athletics through paid months, signs a real team, plays a paid season and exits durably without erasing work or paying again', async () => {
  const context = await setup(); let view: ReturnType<typeof render> | undefined;
  try {
    const importedActor = world().careers.find(item => item.kind === 'actor')!; expect(importedActor.projects[0].grossEarned).toBe(2000000n);
    await settle(); expect(person().skills.sport).toBe(0); expect(person().employment).toBeNull();
    const initial = world(), before = context.rows(); expect(Object.keys(before)).toHaveLength(8); view = render(frame());
    expect(screen.getByText('Athletics skill of 60% is required')).toBeOnTheScreen(); expect(screen.getByRole('button', { name: 'Review Tryout' })).toBeDisabled(); await press('Review Tryout');
    await act(async () => { expect(await mockStore.getState().dispatch({ type: 'select-career', kind: 'athlete', quotedAnnualPay: careerPayQuote(initial, 'athlete') })).toBe(false); }); expect(world()).toBe(initial); expect(context.rows()).toEqual(before);
    view.rerender(frame(true)); await act(async () => { fireEvent.press(screen.getByRole('radio', { name: /^Athletics\./ })); }); await act(async () => { fireEvent.press(screen.getByRole('radio', { name: /^Coached Sessions\./ })); }); await press('Review Training Routine');
    expect(modal().getByText(displayText(formatMoney({ minor: coachingCost(world()), currency: 'USD' })))).toBeOnTheScreen(); await confirm('Set Training Routine'); await press('Continue');
    expect(person().skills.sport).toBe(0); expect(person().training).toMatchObject({ skill: 'sport', mode: 'coached', months: 0, fees: 0n }); view.unmount(); view = undefined;
    // Preregistered bounded preparation: at most four ordinary years, no monthly helper or saved-world edit.
    for (let count = 0; count < 4 && person().skills.sport < 60; count++) await year();
    const training = person().training!, trained = world(); expect(training.months).toBeGreaterThanOrEqual(30); expect(person().skills.sport).toBeGreaterThanOrEqual(60); expect(selectionReason(trained, 'athlete')).toBeUndefined();
    const tuition = trained.ledger.slice(initial.ledger.length).filter(row => row.personId === trained.activePersonId && row.category === 'skill-training');
    expect(tuition).toHaveLength(training.months); expect(tuition.every(row => row.currency === training.currency && row.cashDelta < 0n)).toBe(true); expect(-tuition.reduce((sum, row) => sum + row.cashDelta, 0n)).toBe(training.fees);
    view = render(frame(true)); await press('Stop Training'); await confirm('Stop Training'); await press('Continue'); expect(person().training).toBeNull(); expect(person().skills).toEqual(trained.people[trained.activePersonId].skills); view.unmount(); view = undefined;
    const selectionOutcomes: string[] = [];
    // At most two normal attempts per year in at most two calendar years. Rejections remain saved; RNG is never searched or changed.
    for (let calendar = 0; calendar < 2 && !athlete(); calendar++) {
      if (calendar) await year();
      for (let attempt = 0; attempt < 2 && !athlete(); attempt++) {
        expect(selectionReason(world(), 'athlete')).toBeUndefined(); const start = world(), command: GameCommand = { type: 'select-career', kind: 'athlete', quotedAnnualPay: careerPayQuote(start, 'athlete') };
        view = render(frame()); const expected = await durableReview(context, 'Review Tryout', 'Attend Tryout', command); selectionOutcomes.push(expected.pending!.title);
        expect(expected.accounts.filter(row => row.ownerId === start.activePersonId)).toEqual(start.accounts.filter(row => row.ownerId === start.activePersonId));
        const committed = context.rows(); view.unmount(); await context.cold(); view = render(frame()); expect(world()).toEqual(expected); expect(context.rows()).toEqual(committed); await press('Continue'); const acknowledged = world(), acknowledgedRows = context.rows();
        await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: expected.pending!.id })).toBe(false); }); expect(world()).toBe(acknowledged); expect(context.rows()).toEqual(acknowledgedRows); view.unmount(); view = undefined;
      }
    }
    expect(athlete()?.status).toBe('active'); const signed = athlete()!, employed = world(), personId = employed.activePersonId, historyId = signed.employmentId!;
    expect(signed.contractMonthsRemaining).toBe(36); expect(signed.projects[0].grossEarned).toBe(0n); expect(signed.projects[0].periods).toHaveLength(0); expect(signed.contacts).toHaveLength(2);
    for (const id of signed.contacts) expect(employed.relationships.some(row => row.roles.includes('coworker') && [row.from, row.to].includes(id) && [row.from, row.to].includes(personId))).toBe(true);
    await year(); const played = world(), recorded = athlete()!, season = recorded.projects[0], history = played.workHistory.find(row => row.id === historyId)!;
    expect(recorded.status).toBe('active'); expect(recorded.contractMonthsRemaining).toBe(24); expect(season.months).toBe(12); expect(season.periods).toHaveLength(12); expect(new Set(season.periods.map(row => row.month)).size).toBe(12); expect(['completed', 'cancelled']).toContain(season.status); expect(season.grossEarned).toBeGreaterThan(0n);
    expect(season.periods.filter(row => row.success).every(row => row.attended)).toBe(true);
    const wages = played.ledger.slice(employed.ledger.length).filter(row => row.personId === personId && row.category === 'income'); expect(wages).toHaveLength(12); expect(wages.every(row => row.currency === signed.currency && row.cashDelta > 0n)).toBe(true); expect(wages.reduce((sum, row) => sum + row.cashDelta, 0n)).toBe(season.grossEarned); expect(history.grossEarned).toBe(season.grossEarned);
    expect(played.careers.find(row => row.id === importedActor.id)).toEqual(importedActor); context.original(); await context.cold(); expect(world()).toEqual(played);
    view = render(frame()); const ended = await durableReview(context, /^Leave This Career\./, 'Leave Career', { type: 'leave-career', careerId: recorded.id });
    expect(ended.careers.find(row => row.id === recorded.id)!.projects[0]).toEqual(season); expect(ended.workHistory.find(row => row.id === historyId)).toMatchObject({ ...history, ended: ended.date }); expect(ended.accounts).toEqual(played.accounts);
    const exitRows = context.rows(); view.unmount(); await context.cold(); view = render(frame()); expect(world()).toEqual(ended); expect(context.rows()).toEqual(exitRows); await press('Continue'); const left = world(), leftCareer = athlete()!, leftRows = context.rows();
    expect(leftCareer.status).toBe('left'); expect(leftCareer.projects[1]).toMatchObject({ status: 'cancelled', months: 0, grossEarned: 0n }); expect(person().employment).toBeNull();
    await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: ended.pending!.id })).toBe(false); }); expect(world()).toBe(left); expect(context.rows()).toEqual(leftRows); view.unmount(); view = undefined;
    await year(); const final = world(); expect(athlete()).toEqual(leftCareer); expect(final.workHistory.filter(row => row.personId === personId)).toEqual(left.workHistory.filter(row => row.personId === personId)); expect(person().finance.serviceMonths).toBe(left.people[personId].finance.serviceMonths); expect(person().employment).toBeNull();
    expect(final.ledger.slice(left.ledger.length).filter(row => row.personId === personId && ['income', 'skill-training'].includes(row.category))).toEqual([]); context.original();
    const finalRows = context.rows(); await context.cold(); view = render(frame()); expect(world()).toEqual(final); expect(context.rows()).toEqual(finalRows); expect(screen.queryByRole('button', { name: /^Leave This Career\./ })).toBeNull(); expect(screen.getByText('You have left this career')).toBeOnTheScreen(); context.original();
    console.info('ATHLETE_OBSERVATION', JSON.stringify({ trainingMonths: training.months, tuitionMinor: training.fees.toString(), trainedSport: trained.people[personId].skills.sport, selectionOutcomes, attended: season.periods.filter(row => row.attended).length, wins: season.periods.filter(row => row.success).length, seasonStatus: season.status, seasonGrossMinor: season.grossEarned.toString(), award: season.award, finalRevision: final.revision }));
  } finally { view?.unmount(); jest.restoreAllMocks(); context.close(); }
});
