import { displayText } from '../../src/ui/displayNumbers';
import React from 'react';
import { Modal } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGameStore } from '../../src/state/gameStore';
import { encodeWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { coachingCost, selectionReason } from '../../src/game/systems/careers';
import { modelOfferReason } from '../../src/game/systems/modelCareer';
import { formatMoney } from '../../src/game/money';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import { EventModal } from '../../src/ui/EventModal';
import actorArchive from '../fixtures/v12-career-archive.json';
import inactiveArchive from '../fixtures/v30-native-workplace-story-archive.json';

let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ kind: 'model' }), router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Career from '../../app/(game)/career/[kind]';

const world = () => mockStore.getState().world!;
const actor = (value = world()) => value.people[value.activePersonId];
const model = (value = world()) => value.careers.find(item => item.personId === value.activePersonId && item.kind === 'model')!;
const absolute = (value = world()) => value.date.year * 12 + value.date.month - 1;
const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><Career /><PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const modal = () => within(screen.UNSAFE_getByType(Modal));
const reviewEvent = () => screen.UNSAFE_getAllByType(EventModal).find(item => item.props.event?.kind === 'confirmation')!.props.event;

async function setup() {
  const directory = mkdtempSync(join(tmpdir(), 'dreams-model-acceptance-')), path = join(directory, 'dreams.db'); let sqlite!: DatabaseSync;
  const connect = (): SqlDatabase => {
    const connection = sqlite = new DatabaseSync(path); connection.exec('PRAGMA foreign_keys=ON');
    const session: SqlSession = { run: async (sql, values = []) => { connection.prepare(sql).run(...values); }, get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null, all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[] };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => { connection.exec('BEGIN IMMEDIATE'); try { const result = await action(session); connection.exec('COMMIT'); return result; } catch (error) { connection.exec('ROLLBACK'); throw error; } } };
  };
  let repository = new SaveRepository(connect()); await repository.initialise(); await repository.import(JSON.stringify(inactiveArchive)); await repository.import(JSON.stringify(actorArchive));
  let pause: Promise<void> | undefined;
  const pauseNextSave = () => { let release!: () => void; pause = new Promise<void>(resolve => { release = resolve; }); return release; };
  const bootstrap = async () => { mockStore = createGameStore({ repository: async () => repository, date: () => ({ year: 2023, month: 7, day: 1 }), id: () => 'unused', yieldToUI: async () => { const current = pause; pause = undefined; if (current) await current; } }); expect(await mockStore.getState().bootstrap()).toBe(true); };
  await bootstrap();
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [String(row.name), sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])) as Record<string, Record<string, unknown>[]>;
  const originals = rows(), actorId = world().id; expect(Object.keys(originals)).toHaveLength(8);
  return { get sqlite() { return sqlite; }, rows, pauseNextSave, cold: async () => { sqlite.close(); repository = new SaveRepository(connect()); await bootstrap(); },
    original: () => {
      const now = rows();
      for (const table of ['lives', 'backups']) for (const row of originals[table].filter(item => (item.id ?? item.life_id) !== actorId)) expect(now[table]).toContainEqual(row);
      for (const table of ['snapshots', 'snapshot_metadata', 'receipts', 'branches', 'restore_receipts']) for (const row of originals[table]) expect(now[table]).toContainEqual(row);
      for (const archive of [actorArchive, inactiveArchive]) for (const point of archive.snapshots) expect(now.snapshots.some(item => item.snapshot_id === point.summary.id && item.payload === point.payload)).toBe(true);
    }, close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); } };
}

test('the unchanged actor archive earns modelling training, signs and completes a real model contract, then leaves durably without future model pay', async () => {
  const context = await setup(), trace: GameCommand[] = [];
  let view: ReturnType<typeof render> | undefined;
  const dispatch = async (command: GameCommand) => { trace.push(command); await act(async () => { expect(await mockStore.getState().dispatch(command)).toBe(true); }); };
  const finish = async () => {
    let guard = 0;
    while (world().pending || world().annual) {
      if (++guard > 100 || actor().died) throw Error('Bounded ordinary Model continuation stopped');
      const pending = world().pending, choice = pending?.kind === 'decision' ? pending.choices.find(item => !choiceUnavailable(world(), item)) : undefined;
      if (pending?.kind === 'decision' && !choice) throw Error('No currently available ordinary choice');
      await dispatch(pending?.kind === 'decision' ? { type: 'choose', eventId: pending.id, choiceId: choice!.id } : pending ? { type: 'acknowledge', resultId: pending.id } : { type: 'resume' });
    }
  };
  const year = async () => { expect(world().pending).toBeNull(); expect(world().annual).toBeNull(); const before = absolute(); await dispatch({ type: 'advance' }); await finish(); expect(absolute() - before).toBe(12); };
  const cold = async () => { const before = world(), saved = context.rows(); view?.unmount(); await context.cold(); view = render(frame()); expect(world()).toEqual(before); expect(context.rows()).toEqual(saved); context.original(); };
  const acknowledgeOnce = async () => {
    const initial = world(), pending = initial.pending; if (pending?.kind !== 'result') throw Error('Expected saved result');
    await press('Continue'); expect(world()).toEqual(resolveCommand(initial, { type: 'acknowledge', resultId: pending.id }, true));
    const done = world(), rows = context.rows(); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: pending.id })).toBe(false); }); expect(world()).toEqual(done); expect(context.rows()).toEqual(rows);
    await act(async () => { mockStore.getState().clearError(); });
  };
  const durableReview = async (launch: string | RegExp, confirm: string, command: GameCommand) => {
    const initial = world(), canonical = encodeWorld(initial), before = context.rows();
    await press(launch); const reviewed = reviewEvent(); await press('Never mind'); expect(world()).toBe(initial); expect(context.rows()).toEqual(before);
    await press(launch); const retained = reviewEvent(); expect({ ...retained, id: undefined, illustration: undefined }).toEqual({ ...reviewed, id: undefined, illustration: undefined }); const expected = resolveCommand(initial, command, true), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), release = context.pauseNextSave();
    context.sqlite.exec("CREATE TRIGGER fail_model_command BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press(confirm); expect(mockStore.getState().busy).toBe(true); expect(modal().getByRole('button', { name: confirm })).toHaveProp('accessibilityState', { disabled: true, busy: true });
    await press(confirm); await press('Never mind'); await act(async () => { screen.UNSAFE_getByType(Modal).props.onRequestClose(); }); expect(reviewEvent()).toBe(retained); expect(context.rows()).toEqual(before); expect(world()).toBe(initial);
    await act(async () => { release(); }); await waitFor(() => expect(modal().getByRole('alert')).toHaveTextContent(/couldn't be saved/)); expect(screen.getAllByRole('alert')).toHaveLength(1); expect(reviewEvent()).toBe(retained); expect(modal().getByText(retained.body)).toBeOnTheScreen(); expect(encodeWorld(world())).toBe(canonical); expect(context.rows()).toEqual(before);
    context.sqlite.exec('DROP TRIGGER fail_model_command'); await press(confirm); expect(world()).toEqual(expected); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    expect(context.sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(initial.id)?.payload).toBe(before.lives.find(item => item.id === initial.id)!.payload);
    await cold(); await acknowledgeOnce(); context.original();
  };
  try {
    const archived = world(), actorCareer = archived.careers[0];
    expect(archived.revision).toBe(70); expect(archived.pending?.title).toBe('The project is complete'); expect(actorCareer.projects[0].grossEarned).toBe(2000000n); expect(actorCareer.projects[0].periods).toHaveLength(6);
    // Original producer background already has Looks100; this continuation never
    // changes it, any funds/stat/skill/date/RNG, or a saved selection/response.
    expect(actor().stats.looks).toBe(100); expect(actor().skills.modeling).toBe(0); expect(selectionReason(archived, 'model')).toMatch(/Modelling skill/);
    await dispatch({ type: 'acknowledge', resultId: archived.pending!.id });
    await dispatch({ type: 'career-training', skill: 'modeling', mode: 'coached' }); expect(actor().skills.modeling).toBe(0);
    const unitCost = coachingCost(world()); await finish(); await year(); await year();
    const training = actor().training!; expect(training.skill).toBe('modeling'); expect(training.months).toBe(30); expect(training.fees).toBe(unitCost * 30n); expect(actor().skills.modeling).toBe(60);
    const paidTraining = world().ledger.filter(item => item.personId === world().activePersonId && item.category === 'skill-training'); expect(paidTraining).toHaveLength(30); expect(paidTraining.reduce((sum, item) => sum - item.cashDelta, 0n)).toBe(training.fees);
    expect(world().careers.find(item => item.id === actorCareer.id)).toEqual(actorCareer);
    await dispatch({ type: 'stop-career-training' }); await finish(); expect(selectionReason(world(), 'model')).toBeUndefined();
    view = render(frame()); const prepared = world(), accounts = prepared.accounts, ledger = prepared.ledger;
    await durableReview('Explore Modelling Opportunities', 'Explore Modelling', { type: 'model-enter' });
    expect(model().status).toBe('between'); expect(model().projects).toHaveLength(0); expect(actor().employment).toBeNull();
    expect(model().modelCareer!.industry.board).toHaveLength(6);
    // Industry contacts have their own opening balances; entry pays the player nothing.
    for (const account of accounts) expect(world().accounts).toContainEqual(account);
    expect(world().accounts.filter(item => item.ownerId === world().activePersonId)).toEqual(accounts.filter(item => item.ownerId === prepared.activePersonId));
    for (const account of world().accounts.filter(item => !accounts.some(before => before.id === item.id))) expect(model().contacts).toContain(account.ownerId);
    expect(world().ledger).toEqual(ledger);
    // Follow the saved board normally: a rejection stays recorded, and another
    // eligible brief or a later year's board provides the next genuine attempt.
    let selectionAttempts = 0, seasons = 0, reviewedCasting = false;
    while (model().status !== 'active') {
      const offer = model().modelCareer!.industry.board.find(item => !modelOfferReason(world(), item));
      if (!offer) {
        if (++seasons > 3) throw Error('No model booking after four ordinary saved casting boards');
        view.unmount(); view = undefined; await year(); view = render(frame());
        await press('Review New Bookings'); await press('Review Booking List'); await acknowledgeOnce(); continue;
      }
      const launch = 'Review Casting for ' + offer.title, beforeCasting = world();
      if (!reviewedCasting) { await durableReview(launch, 'Attend Casting', { type: 'model-casting', offerId: offer.id, quotedAnnualPay: offer.annualPay }); reviewedCasting = true; }
      else { await press(launch); await press('Attend Casting'); await acknowledgeOnce(); }
      selectionAttempts++;
      expect(world().accounts).toEqual(beforeCasting.accounts); expect(world().ledger).toEqual(beforeCasting.ledger);
      expect(model().modelCareer!.industry.board.find(item => item.id === offer.id)!.status).not.toBe('open');
      expect(model().modelCareer!.industry.board.find(item => item.id === offer.id)!.auditionRoll).toBe(offer.auditionRoll);
    }
    const quote = actor().employment!.annualPay, booked = model().projects.find(item => item.status === 'active')!;
    expect(model()?.status).toBe('active'); expect(model().projects[0].grossEarned).toBe(0n); expect(model().projects[0].periods).toHaveLength(0); expect(actor().employment?.paidMonths).toBe(0); expect(actor().employment?.annualPay).toBe(quote);
    expect(selectionAttempts).toBeGreaterThanOrEqual(1); expect(selectionAttempts).toBeLessThanOrEqual(16);
    expect(model().contacts).toHaveLength(4); expect(Object.keys(model().modelCareer!.industry.contacts)).toHaveLength(4); for (const id of model().contacts) expect(world().people[id]).toBeDefined();
    expect(screen.getByLabelText('Contract progress: 0 / ' + booked.targetMonths + ' months')).toBeOnTheScreen();
    await durableReview(/^Prepare the Presentation\./, 'Choose This Approach', { type: 'model-production', projectId: booked.id, action: 'prepare' });
    expect(model().projects[0].creative!.choices.some(item => item.id === 'model:prepare')).toBe(true);
    await finish();
    view.unmount(); view = undefined; await year();
    expect(model().status).toBe('between'); expect(model().projects[0].status).toBe('completed'); expect(model().projects[0].months).toBe(booked.targetMonths); expect(model().projects[0].periods).toHaveLength(booked.targetMonths); expect(model().projects[0].periods.every(item => item.attended)).toBe(true); expect(model().projects[0].grossEarned).toBeGreaterThan(0n); expect(actor().employment).toBeNull();
    const completed = model(), employment = world().workHistory.find(item => item.id === completed.projects[0].employmentId)!; expect(employment.monthsWorked).toBe(booked.targetMonths); expect(employment.grossEarned).toBe(completed.projects[0].grossEarned); expect(completed.modelCareer!.industry.totalGross).toBe(employment.normalizedGross);
    view = render(frame()); expect(screen.getByText('Completed · ' + completed.projects[0].ended!.year + ' · ' + booked.targetMonths + ' contract months')).toBeOnTheScreen(); expect(screen.getByLabelText('Actual gross earnings: ' + displayText(formatMoney({ minor: completed.projects[0].grossEarned, currency: completed.projects[0].currency })))).toBeOnTheScreen(); expect(screen.getByLabelText('Recorded gross earnings: ' + displayText(formatMoney({ minor: employment.normalizedGross, currency: actor().finance.earningsCurrency })) + '. Before commission and tax')).toBeOnTheScreen();
    const beforeLeave = world(); await durableReview(/^Leave This Modelling Career\./, 'Leave Modelling', { type: 'leave-career', careerId: completed.id });
    const left = world(); expect(model().status).toBe('left'); expect(model().projects).toEqual(completed.projects); expect(model().contacts).toEqual(completed.contacts); expect(left.accounts).toEqual(beforeLeave.accounts); expect(left.ledger).toEqual(beforeLeave.ledger); expect(left.random).toEqual(beforeLeave.random); expect(left.workHistory).toEqual(beforeLeave.workHistory);
    view.unmount(); view = undefined; await year(); expect(model()).toEqual(model(left)); expect(world().workHistory.filter(item => item.personId === world().activePersonId)).toEqual(left.workHistory.filter(item => item.personId === left.activePersonId)); expect(actor().finance.lifetimeGross).toBe(actor(left).finance.lifetimeGross); expect(world().careers.find(item => item.id === actorCareer.id)).toEqual(actorCareer);
    await cold(); expect(screen.queryByRole('button', { name: /^Leave This Modelling Career\./ })).toBeNull(); context.original();
    console.info('Model archive continuation', JSON.stringify({ sourceRevision: archived.revision, sourceDate: archived.date, preparedDate: prepared.date, trainedMonths: training.months, trainingFees: training.fees.toString(), skill: actor(prepared).skills.modeling, selectionAttempts, annualPay: quote.toString(), projectPeriods: completed.projects[0].months, modelGross: completed.projects[0].grossEarned.toString(), currency: completed.currency, finalDate: world().date, finalRevision: world().revision, ordinaryPreparationAndContinuationCommands: trace.length, originalFixtureSha256: createHash('sha256').update(readFileSync(join(__dirname, '../fixtures/v12-career-archive.json'))).digest('hex') }));
  } finally { view?.unmount(); jest.restoreAllMocks(); context.close(); }
}, 90000);
