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
import { ageOn, decodeWorld, encodeWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { coachingCost } from '../../src/game/systems/careers';
import { assignmentReason, servicePayQuote, serviceSelectionReason } from '../../src/game/systems/services';
import { serviceAway, serviceQualified } from '../../src/game/systems/serviceSchemas';
import { formatMoney } from '../../src/game/money';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import { EventModal } from '../../src/ui/EventModal';
import graduate from '../fixtures/v3-employed-graduate.json';
import inactiveArchive from '../fixtures/v30-native-workplace-story-archive.json';

let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ kind: 'astronaut' }), router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Service from '../../app/(game)/service/[kind]';

const world = () => mockStore.getState().world!;
const person = (value = world()) => value.people[value.activePersonId];
const astronaut = (value = world()) => value.serviceCareers.find(item => item.personId === value.activePersonId && item.kind === 'astronaut')!;
const absolute = (value = world()) => value.date.year * 12 + value.date.month - 1;
const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><Service /><PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const modal = () => within(screen.UNSAFE_getByType(Modal));
const pressModal = async (name: string) => { await act(async () => { fireEvent.press(modal().getByRole('button', { name })); }); };
const reviewEvent = () => screen.UNSAFE_getAllByType(EventModal).find(item => item.props.event?.kind === 'confirmation')!.props.event;

async function setup() {
  const initial = decodeWorld(JSON.stringify(graduate)), directory = mkdtempSync(join(tmpdir(), 'dreams-astronaut-acceptance-')), path = join(directory, 'dreams.db'); let sqlite!: DatabaseSync;
  const connect = (): SqlDatabase => {
    const connection = sqlite = new DatabaseSync(path); connection.exec('PRAGMA foreign_keys=ON');
    const session: SqlSession = { run: async (sql, values = []) => { connection.prepare(sql).run(...values); }, get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null, all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[] };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => { connection.exec('BEGIN IMMEDIATE'); try { const result = await action(session); connection.exec('COMMIT'); return result; } catch (error) { connection.exec('ROLLBACK'); throw error; } } };
  };
  let repository = new SaveRepository(connect()); await repository.initialise(); await repository.import(JSON.stringify(inactiveArchive));
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [String(row.name), sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])) as Record<string, Record<string, unknown>[]>;
  const original = rows(); expect(Object.keys(original)).toHaveLength(8); expect(original.lives[0].id).not.toBe(initial.id); await repository.create(initial);
  let pause: Promise<void> | undefined;
  const pauseNextSave = () => { let release!: () => void; pause = new Promise<void>(resolve => { release = resolve; }); return release; };
  const bootstrap = async () => { mockStore = createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'unused', yieldToUI: async () => { const current = pause; pause = undefined; if (current) await current; } }); expect(await mockStore.getState().bootstrap()).toBe(true); };
  await bootstrap();
  return { get sqlite() { return sqlite; }, rows, pauseNextSave, cold: async () => { sqlite.close(); repository = new SaveRepository(connect()); await bootstrap(); },
    original: () => {
      const now = rows();
      for (const table of ['lives', 'backups', 'snapshots', 'snapshot_metadata', 'receipts', 'branches', 'restore_receipts']) for (const row of original[table]) expect(now[table]).toContainEqual(row);
      for (const point of inactiveArchive.snapshots) expect(now.snapshots.some(item => item.snapshot_id === point.summary.id && item.payload === point.payload)).toBe(true);
    }, close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); } };
}

test('the genuine computing graduate earns astronaut eligibility and qualification, records actual flight work, then leaves without future service pay', async () => {
  const context = await setup(), trace: GameCommand[] = [];
  let view: ReturnType<typeof render> | undefined;
  const dispatch = async (command: GameCommand) => { trace.push(command); await act(async () => { expect(await mockStore.getState().dispatch(command)).toBe(true); }); };
  const next = async () => {
    const pending = world().pending, choice = pending?.kind === 'decision' ? pending.choices.find(item => !choiceUnavailable(world(), item)) : undefined;
    if (pending?.kind === 'decision' && !choice) throw Error('No currently available ordinary choice');
    await dispatch(pending?.kind === 'decision' ? { type: 'choose', eventId: pending.id, choiceId: choice!.id } : pending ? { type: 'acknowledge', resultId: pending.id } : { type: 'resume' });
  };
  const finish = async () => { let guard = 0; while (world().pending || world().annual) { if (++guard > 100 || person().died) throw Error('Bounded ordinary Astronaut continuation stopped'); await next(); } };
  const year = async () => { expect(world().pending).toBeNull(); expect(world().annual).toBeNull(); const before = absolute(); await dispatch({ type: 'advance' }); await finish(); expect(absolute() - before).toBe(12); };
  const cold = async () => { const before = world(), saved = context.rows(); view?.unmount(); await context.cold(); view = render(frame()); expect(world()).toEqual(before); expect(context.rows()).toEqual(saved); context.original(); };
  const acknowledgeOnce = async () => {
    const initial = world(), pending = initial.pending; if (pending?.kind !== 'result') throw Error('Expected actual saved result');
    await press('Continue'); expect(world()).toEqual(resolveCommand(initial, { type: 'acknowledge', resultId: pending.id }, true));
    const done = world(), rows = context.rows(); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: pending.id })).toBe(false); }); expect(world()).toEqual(done); expect(context.rows()).toEqual(rows); await act(async () => { mockStore.getState().clearError(); });
  };
  const durableReview = async (launch: string | RegExp, confirm: string, command: GameCommand) => {
    const initial = world(), canonical = encodeWorld(initial), before = context.rows(); await press(launch); const reviewed = reviewEvent(); await press('Never mind'); expect(world()).toBe(initial); expect(context.rows()).toEqual(before);
    await press(launch); const retained = reviewEvent(); expect(retained).toEqual(reviewed); const expected = resolveCommand(initial, command, true), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), release = context.pauseNextSave();
    context.sqlite.exec("CREATE TRIGGER fail_astronaut_command BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await pressModal(confirm); expect(mockStore.getState().busy).toBe(true); expect(modal().getByRole('button', { name: confirm })).toHaveProp('accessibilityState', { disabled: true, busy: true }); await pressModal(confirm); await press('Never mind'); await act(async () => { screen.UNSAFE_getByType(Modal).props.onRequestClose(); }); expect(reviewEvent()).toBe(retained); expect(context.rows()).toEqual(before); expect(world()).toBe(initial);
    await act(async () => { release(); }); await waitFor(() => expect(modal().getByRole('alert')).toHaveTextContent(/couldn't be saved/)); expect(screen.getAllByRole('alert')).toHaveLength(1); expect(reviewEvent()).toBe(retained); expect(modal().getByText(retained.body)).toBeOnTheScreen(); expect(encodeWorld(world())).toBe(canonical); expect(context.rows()).toEqual(before);
    context.sqlite.exec('DROP TRIGGER fail_astronaut_command'); await pressModal(confirm); expect(world()).toEqual(expected); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore(); expect(context.sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(initial.id)?.payload).toBe(before.lives.find(item => item.id === initial.id)!.payload);
    await cold(); await acknowledgeOnce(); context.original();
  };
  try {
    const archived = world(), degree = person().education.qualifications.find(item => item.level === 'degree' && item.field === 'computing')!;
    expect(archived.revision).toBe(67); expect(ageOn(person(), archived.date)).toBe(23); expect(degree.year).toBe(2022); expect(person().skills.science).toBe(0); expect(world().workHistory.find(item => item.id === person().employment!.id)?.grossEarned).toBe(7200000n);
    // Original Smarts/Discipline were arranged by the v3 producer. Subsequent
    // eligibility is earned here only through ordinary saved player commands.
    expect(serviceSelectionReason(world(), 'astronaut')).toMatch(/ages 25/);
    await dispatch({ type: 'health-routine', routine: { exercise: 'walking', diet: 'balanced', sleep: 'restful', mindfulness: true, smoking: false, drinking: 'none' } }); await finish();
    await dispatch({ type: 'career-training', skill: 'science', mode: 'coached' }); expect(person().skills.science).toBe(0); await finish(); const unitCost = coachingCost(world());
    await year(); await year(); await year();
    const training = person().training!; expect(training.months).toBe(36); expect(training.fees).toBe(unitCost * 36n); expect(person().skills.science).toBe(72); expect(person().education.qualifications).toContainEqual(degree);
    const fees = world().ledger.filter(item => item.personId === world().activePersonId && item.category === 'skill-training'); expect(fees).toHaveLength(36); expect(fees.reduce((sum, item) => sum - item.cashDelta, 0n)).toBe(training.fees); expect(person().employment?.roleId).toBe('developer');
    await dispatch({ type: 'stop-career-training' }); await finish(); await dispatch({ type: 'quit-job' }); await finish(); expect(serviceSelectionReason(world(), 'astronaut')).toBeUndefined();
    const prepared = world(), quote = servicePayQuote(prepared, 'astronaut'); view = render(frame());
    await durableReview('Review Service Application', 'Apply for Service', { type: 'apply-service', kind: 'astronaut', branch: 'space-program', quotedAnnualPay: quote });
    if (!astronaut()) { expect(world().journal.at(-1)?.text).toMatch(/did not lead to a place/); await press('Review Service Application'); await press('Apply for Service'); await acknowledgeOnce(); }
    expect(astronaut()?.status).toBe('active'); expect(astronaut().contracts[0].trainingScores).toHaveLength(0); expect(astronaut().periods).toHaveLength(0); expect(serviceQualified(astronaut())).toBe(false); expect(person().employment?.paidMonths).toBe(0); expect(person().employment?.annualPay).toBe(quote);
    for (const account of prepared.accounts) expect(world().accounts).toContainEqual(account); expect(world().accounts.filter(item => item.ownerId === world().activePersonId)).toEqual(prepared.accounts.filter(item => item.ownerId === prepared.activePersonId)); expect(world().ledger).toEqual(prepared.ledger); expect(astronaut().contacts).toHaveLength(2);
    const selectionAttempts = world().actionCounts[world().activePersonId + ':service-selection:astronaut:' + world().date.year], selected = world(), selectedRows = context.rows(); expect(selectionAttempts).toBeGreaterThanOrEqual(1); expect(selectionAttempts).toBeLessThanOrEqual(2);
    const current = screen.getByRole('button', { name: /^Balanced Routine\..*This is your current service routine$/ }); expect(current).toBeDisabled(); await act(async () => { fireEvent.press(current); }); expect(world()).toBe(selected); expect(context.rows()).toEqual(selectedRows); expect(screen.queryByText('Set your working routine?')).toBeNull();
    const notReady = screen.getByRole('button', { name: /^Orbital Research\..*Complete the actual training and assessment first$/ }); expect(notReady).toBeDisabled(); await act(async () => { fireEvent.press(notReady); }); expect(world()).toBe(selected); expect(context.rows()).toEqual(selectedRows);
    view.unmount(); view = undefined; await year(); expect(astronaut().contracts[0].trainingScores).toHaveLength(12); expect(astronaut().contracts[0].trainingResult).toBe('pending'); expect(astronaut().periods.reduce((sum, item) => sum + item.gross, 0n)).toBe(quote); expect(person().employment?.annualPay).toBe(quote);
    await cold(); view!.unmount(); view = undefined; await year();
    const qualified = world(), contract = astronaut().contracts[0]; expect(contract.trainingCalendar).toBe(24); expect(contract.trainingScores).toHaveLength(24); expect(contract.trainingResult).toBe('passed'); expect(serviceQualified(astronaut())).toBe(true); expect(astronaut().periods.every(item => item.phase === 'training' && item.attended)).toBe(true); expect(astronaut().periods.reduce((sum, item) => sum + item.gross, 0n)).toBe(quote * 2n); expect(person().employment!.annualPay).toBeGreaterThan(quote); expect(assignmentReason(qualified, astronaut(), 'orbital-research')).toBeUndefined();
    await cold(); const qualifiedPay = person().employment!.annualPay;
    await press(/^Careful Routine\./); await press('Set Routine'); await acknowledgeOnce();
    const ground = world(), home = person().householdId, country = person().country, city = person().city;
    await durableReview(/^Orbital Research\./, 'Depart on Assignment', { type: 'start-assignment', serviceId: astronaut().id, kind: 'orbital-research' });
    expect(serviceAway(world())?.kind).toBe('orbital-research'); expect(astronaut().assignments[0].periods).toHaveLength(0); expect(world().accounts).toEqual(ground.accounts); expect(world().ledger).toEqual(ground.ledger);
    view!.unmount(); view = undefined; await dispatch({ type: 'advance' }); let guard = 0;
    while (astronaut().assignments[0].status === 'active') { if (++guard > 50 || person().died) throw Error('Bounded flight progression stopped'); await next(); }
    const flight = astronaut().assignments[0]; expect(['completed', 'failed', 'returned']).toContain(flight.status); expect(flight.periods.length).toBeGreaterThan(0); expect(flight.periods.length).toBeLessThanOrEqual(6); expect(flight.units).toBe(flight.periods.reduce((sum, item) => sum + item.units, 0)); expect(flight.periods.every(item => item.focus === 'careful')).toBe(true); expect(world().annual?.pausedForPlanning).toBe(true); expect(person().householdId).toBe(home); expect(person().country).toBe(country); expect(person().city).toBe(city); expect(serviceAway(world())).toBeUndefined();
    const missionPeriods = astronaut().periods.filter(item => item.phase === 'assignment'); expect(missionPeriods).toHaveLength(flight.periods.length); expect(missionPeriods.reduce((sum, item) => sum + item.gross, 0n)).toBe(qualifiedPay / 12n * BigInt(flight.periods.length));
    await cold(); expect(screen.getByText(flight.status + ' · ' + flight.periods.length + '/6 periods · ' + flight.units + ' recorded units')).toBeOnTheScreen(); await acknowledgeOnce();
    const read = world(), readRows = context.rows(); await press(/^View Monthly Record/); for (const period of flight.periods) expect(screen.getByText(Math.floor(period.month / 12) + '-' + String(period.month % 12 + 1).padStart(2, '0') + ' · ' + period.units + ' units · ' + (period.risk === 'none' ? 'No incident' : 'Injury'))).toBeOnTheScreen(); await press(/^Hide Monthly Record/); expect(world()).toBe(read); expect(context.rows()).toEqual(readRows);
    expect(screen.getByLabelText('Actual contract earnings: ' + formatMoney({ minor: astronaut().periods.reduce((sum, item) => sum + item.gross, 0n), currency: astronaut().currency }))).toBeOnTheScreen();
    const beforeLeave = world(); await durableReview(/^Leave Service\./, 'Leave Service', { type: 'leave-service', serviceId: astronaut().id });
    const left = world(); expect(astronaut().status).toBe('left'); expect(person().employment).toBeNull(); expect(astronaut().periods).toEqual(astronaut(beforeLeave).periods); expect(astronaut().assignments).toEqual(astronaut(beforeLeave).assignments); expect(astronaut().contracts[0]).toEqual({ ...astronaut(beforeLeave).contracts[0], ended: left.date }); expect(serviceQualified(astronaut())).toBe(true); expect(left.accounts).toEqual(beforeLeave.accounts); expect(left.ledger).toEqual(beforeLeave.ledger); expect(left.random).toEqual(beforeLeave.random);
    view!.unmount(); view = undefined; await finish(); await year(); expect(astronaut()).toEqual(astronaut(left)); expect(person().finance.lifetimeGross).toBe(person(left).finance.lifetimeGross); expect(world().workHistory.filter(item => item.personId === world().activePersonId)).toEqual(left.workHistory.filter(item => item.personId === left.activePersonId)); await cold(); expect(screen.queryByRole('button', { name: /^Leave Service\./ })).toBeNull(); context.original();
    console.info('Astronaut archive continuation', JSON.stringify({ sourceRevision: archived.revision, sourceDate: archived.date, preparedDate: prepared.date, coachedMonths: training.months, coachingFees: training.fees.toString(), preparedScience: person(prepared).skills.science, selectionAttempts, traineeAnnualPay: quote.toString(), trainingMonths: contract.trainingScores.length, trainingResult: contract.trainingResult, qualifiedDate: contract.qualifiedAt, qualifiedAnnualPay: qualifiedPay.toString(), mission: { status: flight.status, periods: flight.periods.length, units: flight.units, distinction: flight.distinction }, leaveContractMonths: astronaut(left).contracts[0].months, serviceGross: astronaut(left).periods.reduce((sum, item) => sum + item.gross, 0n).toString(), finalDate: world().date, finalRevision: world().revision, ordinaryPreparationAndContinuationCommands: trace.length, originalFixtureSha256: createHash('sha256').update(readFileSync(join(__dirname, '../fixtures/v3-employed-graduate.json'))).digest('hex') }));
  } finally { view?.unmount(); jest.restoreAllMocks(); context.close(); }
}, 90000);
