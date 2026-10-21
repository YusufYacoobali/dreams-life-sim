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
import { enrollmentReason } from '../../src/game/systems/education';
import { scholarshipReason } from '../../src/game/systems/scholarships';
import { moveQuote } from '../../src/game/systems/relocation';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import { EventModal } from '../../src/ui/EventModal';
import schoolArchive from '../fixtures/v24-university-loan-archive.json';
import pinnedArchive from '../fixtures/v30-native-workplace-story-archive.json';
import relocationArchive from '../fixtures/v20-relocation-archive.json';
import incompleteFixture from '../fixtures/v35-legacy-incomplete-course.json';

let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Education from '../../app/(game)/education';
import Life from '../../app/(game)/(tabs)/life';

const world = () => mockStore.getState().world!;
const frame = (life = false) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{life ? <Life /> : <Education />}<PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const choose = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('radio', { name })); }); };
const modal = () => within(screen.UNSAFE_getByType(Modal));
const review = () => screen.UNSAFE_getAllByType(EventModal).find(item => item.props.event?.kind === 'confirmation')!.props.event;
async function command(command: GameCommand) { expect(await mockStore.getState().dispatch(command)).toBe(true); }
async function finishYear() {
  let guard = 0;
  while (world().pending || world().annual) {
    if (++guard > 120) throw new Error('Ordinary admissions progression stalled');
    const pending = world().pending, choice = pending?.kind === 'decision' ? pending.choices.find(item => !choiceUnavailable(world(), item)) : undefined;
    await command(pending?.kind === 'decision' ? { type: 'choose', eventId: pending.id, choiceId: choice!.id } : pending ? { type: 'acknowledge', resultId: pending.id } : { type: 'resume' });
  }
}
async function setup(mode: 'pupil' | 'move' | 'legacy' | 'incomplete' = 'pupil') {
  const directory = mkdtempSync(join(tmpdir(), 'dreams-university-admissions-')), path = join(directory, 'dreams.db'); let sqlite: DatabaseSync;
  const connect = (): SqlDatabase => {
    sqlite = new DatabaseSync(path); sqlite.exec('PRAGMA foreign_keys=ON'); const connection = sqlite;
    const session: SqlSession = { run: async (sql, values = []) => { connection.prepare(sql).run(...values); }, get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null, all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[] };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => { connection.exec('BEGIN IMMEDIATE'); try { const result = await action(session); connection.exec('COMMIT'); return result; } catch (error) { connection.exec('ROLLBACK'); throw error; } } };
  };
  let repository = new SaveRepository(connect()); await repository.initialise(); await repository.import(JSON.stringify(pinnedArchive));
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])) as Record<string, Record<string, unknown>[]>;
  const selectedArchive = mode === 'move' ? relocationArchive : mode === 'incomplete' ? { ...schoolArchive, checkpoint: incompleteFixture.after.checkpoint } : schoolArchive;
  const pinned = rows(); await repository.import(JSON.stringify(selectedArchive)); const original = (await repository.active())!, imported = rows();
  if (mode === 'pupil' || mode === 'move') await repository.restoreBranch(original.id, selectedArchive.snapshots[0].summary.id, original.revision, 'life_university_admissions', 'admissions_original_checkpoint');
  let nextYield: Promise<void> | undefined;
  const pause = () => { let release!: () => void; nextYield = new Promise<void>(resolve => { release = resolve; }); return release; };
  const bootstrap = async () => { mockStore = createGameStore({ repository: async () => repository, date: () => original.date, id: () => 'unused', yieldToUI: async () => { const wait = nextYield; nextYield = undefined; if (wait) await wait; } }); expect(await mockStore.getState().bootstrap()).toBe(true); }; await bootstrap();
  if (mode === 'pupil') {
    expect(world().date.year).toBe(2017); expect(world().people[world().activePersonId].education.qualifications).toEqual([]);
    await command({ type: 'advance' }); await finishYear();
    expect(world().date.year).toBe(2018); expect(world().schoolCompletions.find(item => item.personId === world().activePersonId)?.passed).toBe(true); expect(world().people[world().activePersonId].education.stage).toBe('none');
  } else if (mode === 'move') { await command({ type: 'quit-job' }); await command({ type: 'acknowledge', resultId: world().pending!.id }); }
  else { expect(world().people[world().activePersonId].education).toMatchObject({ stage: mode === 'legacy' ? 'university' : 'none', months: 12 }); expect(world().studyCourses).toEqual([]); }
  return { get sqlite() { return sqlite; }, rows, pause, cold: async () => { sqlite.close(); repository = new SaveRepository(connect()); await bootstrap(); },
    original: () => {
      const now = rows(); for (const table of ['lives', 'backups']) for (const row of imported[table]) if (mode !== 'legacy' && mode !== 'incomplete' || row.id !== original.id && row.life_id !== original.id) expect(now[table]).toContainEqual(row);
      for (const table of ['snapshots', 'snapshot_metadata', 'branches', 'restore_receipts']) for (const row of imported[table]) expect(now[table]).toContainEqual(row);
      for (const row of imported.receipts) expect(sqlite.prepare('SELECT * FROM receipts WHERE life_id=? AND command_id=?').get(String(row.life_id), String(row.command_id))).toEqual(row);
      for (const [input, lifeId] of [[selectedArchive, original.id], [pinnedArchive, String(pinned.lives[0].id)]] as const) for (const point of input.snapshots) expect(sqlite.prepare('SELECT payload FROM snapshots WHERE life_id=? AND snapshot_id=?').get(lifeId, point.summary.id)?.payload).toBe(point.payload);
    }, close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); } };
}
async function applyReview() { await press(/^University\./); await choose('Computing'); await press('Review Free Application'); }
async function failureRetry(context: Awaited<ReturnType<typeof setup>>, confirm: string, actual: GameCommand) {
  const initial = world(), before = context.rows(), event = review(), expected = resolveCommand(initial, actual, true), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
  const release = context.pause(); context.sqlite.exec("CREATE TRIGGER fail_admission BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  try {
    await press(confirm); expect(modal().getByRole('button', { name: confirm })).toHaveProp('accessibilityState', { disabled: true, busy: true });
    await act(async () => { fireEvent.press(modal().getByRole('button', { name: confirm })); fireEvent.press(modal().getByRole('button', { name: 'Never mind' })); screen.UNSAFE_getByType(Modal).props.onRequestClose(); }); expect(review()).toEqual(event); expect(context.rows()).toEqual(before);
    await act(async () => { release(); }); await waitFor(() => expect(modal().getByRole('alert')).toHaveTextContent(/couldn't be saved/)); expect(screen.getAllByRole('alert')).toHaveLength(1); expect(review()).toEqual(event); expect(world()).toEqual(initial); expect(context.rows()).toEqual(before);
    context.sqlite.exec('DROP TRIGGER fail_admission'); await press(confirm); expect(world()).toEqual(expected); expect(screen.queryByRole('button', { name: confirm })).toBeNull(); expect(unpack).not.toHaveBeenCalled();
    expect(context.sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(initial.id)?.payload).toBe(before.lives.find(item => item.id === initial.id)!.payload);
    return expected;
  } finally {
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false)); unpack.mockRestore();
  }
}

test('a genuine pupil applies for free, separately consents to exact student debt/tuition and cold resumes both durable steps without duplicate payment', async () => {
  const context = await setup();
  try {
    const initial = world(), before = context.rows(), canonical = encodeWorld(initial), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); let view = render(frame());
    await applyReview(); expect(screen.getByText('No fee or loan')).toBeOnTheScreen(); expect(screen.queryByText('First-year tuition billed')).toBeNull(); await press('Never mind'); expect(context.rows()).toEqual(before); expect(encodeWorld(world())).toBe(canonical); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    await applyReview(); const applied = await failureRetry(context, 'Submit University Application', { type: 'apply-university', field: 'computing' }), item = applied.universityApplications[0];
    expect(item.status).toBe('accepted'); expect(applied.people).toEqual(initial.people); expect(applied.accounts).toEqual(initial.accounts); expect(applied.ledger).toEqual(initial.ledger); expect(applied.liabilities).toEqual(initial.liabilities); expect(applied.scholarships).toEqual([]); expect(applied.random.outcomes).not.toBe(initial.random.outcomes);
    const appliedRows = context.rows(); view.unmount(); await context.cold(); view = render(frame()); expect(world()).toEqual(applied); expect(context.rows()).toEqual(appliedRows); await press('Continue');
    expect(enrollmentReason(world(), 'university', 'computing')).toBe('You already applied for this course this year'); expect(scholarshipReason(world(), 'merit', 'university', 'computing')).toBeUndefined();
    const offered = world(), offeredRows = context.rows(); await press('Review Offered Place'); await choose(/Student loan/); await press('Review Enrolment'); expect(screen.getByText('First-year tuition billed')).toBeOnTheScreen(); expect(screen.getAllByText('$14,000.00').length).toBeGreaterThan(0); await press('Never mind'); expect(world()).toEqual(offered); expect(context.rows()).toEqual(offeredRows);
    await press('Review Offered Place'); await choose(/Student loan/); await press('Review Enrolment'); const enrolled = await failureRetry(context, 'Accept Place And Enrol', { type: 'accept-university-place', applicationId: item.id, funding: 'loan' }), entry = enrolled.universityApplications[0].enrolment!;
    expect(enrolled.people[enrolled.activePersonId].education).toMatchObject({ stage: 'university', months: 0, tuitionPaidMonths: 12, tuition: 1400000n }); expect(entry).toMatchObject({ billed: 1400000n, waived: 0n, funding: 'loan', scholarshipId: null });
    expect(enrolled.ledger.slice(offered.ledger.length).map(row => [row.id, row.category, row.cashDelta, row.debtDelta])).toEqual([[entry.loanTransactionId, 'borrowing', 1400000n, 1400000n], [entry.transactionId, 'tuition', -1400000n, 0n]]); expect(enrolled.random).toEqual(offered.random);
    const savedRows = context.rows(); view.unmount(); await context.cold(); view = render(frame()); expect(world()).toEqual(enrolled); expect(context.rows()).toEqual(savedRows); await press('Continue');
    const acknowledged = world(), acknowledgedRows = context.rows(); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: enrolled.pending!.id })).toBe(false); expect(await mockStore.getState().dispatch({ type: 'accept-university-place', applicationId: item.id, funding: 'loan' })).toBe(false); }); expect(world()).toEqual(acknowledged); expect(context.rows()).toEqual(acknowledgedRows); context.original(); view.unmount();
    await command({ type: 'advance' }); await finishYear(); const later = world(); expect(later.people[later.activePersonId].education.months).toBeGreaterThan(0); expect(later.universityApplications[0]).toEqual(acknowledged.universityApplications[0]); expect(later.ledger.filter(row => row.category === 'tuition')).toHaveLength(1); context.original();
    expect(later.studyCourses[0]).toMatchObject({ origin: 'enrolment', status: 'active', started: entry.date, admissionId: item.id, months: later.people[later.activePersonId].education.months, firstPayment: { transactionId: entry.transactionId, loanTransactionId: entry.loanTransactionId, billed: 1400000n } });
    view = render(frame()); await press('Leave course'); const left = await failureRetry(context, 'Leave Course', { type: 'leave-school' }); expect(left.accounts).toEqual(later.accounts); expect(left.liabilities).toEqual(later.liabilities); expect(left.ledger).toEqual(later.ledger); expect(left.people[left.activePersonId].education.qualifications).toEqual(later.people[later.activePersonId].education.qualifications); expect(left.studyCourses[0]).toEqual({ ...later.studyCourses[0], status: 'withdrawn', ended: left.date, recorded: left.date });
    const leftRows = context.rows(); view.unmount(); await context.cold(); view = render(frame()); expect(world()).toEqual(left); expect(context.rows()).toEqual(leftRows); await press('Continue'); expect(screen.getByText('Previous courses')).toBeOnTheScreen(); expect(screen.getByText('Left the course')).toBeOnTheScreen(); const viewed = context.rows(); expect(screen.getByText('Started 1/1/2018 · Ended 1/1/2019')).toBeOnTheScreen(); expect(context.rows()).toEqual(viewed); context.original(); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
}, 60000);

test('an actual approved move resets the same person’s free application draft and old callbacks cannot submit stale residence terms', async () => {
  const context = await setup('move');
  try {
    const dispatch = jest.spyOn(mockStore.getState(), 'dispatch'), initial = world(), before = context.rows(), view = render(frame());
    await press(/^University\./); await choose('Arts'); await press('Review Free Application'); expect(screen.getByText('$14,000.00')).toBeOnTheScreen(); const callback = screen.UNSAFE_getAllByType(EventModal).find(item => item.props.event?.kind === 'confirmation')!.props.onChoose;
    expect(context.rows()).toEqual(before); expect(world()).toEqual(initial);
    const retained = review(); await act(async () => { await command({ type: 'meditate' }); await command({ type: 'acknowledge', resultId: world().pending!.id }); }); expect(review()).toBe(retained);
    const application = world().relocations[0], quote = moveQuote(world(), application); expect(application.status).toBe('approved'); expect(application.destinationId).toBe('tokyo');
    await act(async () => { await command({ type: 'relocate', applicationId: application.id, companionIds: [], reserveMonths: 3, reviewedQuote: quote }); });
    const moved = world(), movedRows = context.rows(), count = dispatch.mock.calls.length; expect(moved.id).toBe(initial.id); expect(moved.activePersonId).toBe(initial.activePersonId); expect(moved.people[moved.activePersonId]).toMatchObject({ country: 'JP', nationality: 'US', city: 'Tokyo' }); expect(screen.queryByText('Apply to study arts?')).toBeNull();
    await act(async () => { await callback('confirm'); }); expect(dispatch).toHaveBeenCalledTimes(count); expect(world()).toEqual(moved); expect(context.rows()).toEqual(movedRows); expect(moved.universityApplications).toEqual([]);
    await act(async () => { await command({ type: 'acknowledge', resultId: world().pending!.id }); await command({ type: 'quit-job' }); await command({ type: 'acknowledge', resultId: world().pending!.id }); });
    const settled = world(), settledRows = context.rows(); await press(/^University\./); await choose('Arts'); await press('Review Free Application'); expect(screen.getByText('¥600,000')).toBeOnTheScreen(); expect(screen.queryByText('$14,000.00')).toBeNull(); await press('Never mind'); expect(world()).toEqual(settled); expect(context.rows()).toEqual(settledRows); context.original(); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
}, 60000);

test('withdrawing the actual offered place retains review after rollback, changes no money and cannot reset this year’s legacy attempt', async () => {
  const context = await setup();
  try {
    await command({ type: 'apply-university', field: 'computing' }); expect(world().universityApplications[0].status).toBe('accepted'); await command({ type: 'acknowledge', resultId: world().pending!.id });
    const initial = world(), item = initial.universityApplications[0], before = context.rows(); let view = render(frame());
    await press('Withdraw University Application'); await press('Never mind'); expect(context.rows()).toEqual(before); expect(world()).toEqual(initial);
    await press('Withdraw University Application'); const withdrawn = await failureRetry(context, 'Withdraw Application', { type: 'withdraw-university-application', applicationId: item.id });
    expect(withdrawn.universityApplications[0]).toMatchObject({ status: 'withdrawn', enrolment: null, transitions: [{ status: 'accepted' }, { status: 'withdrawn' }] }); expect(withdrawn.accounts).toEqual(initial.accounts); expect(withdrawn.ledger).toEqual(initial.ledger); expect(withdrawn.liabilities).toEqual(initial.liabilities); expect(withdrawn.people).toEqual(initial.people); expect(withdrawn.random).toEqual(initial.random);
    const savedRows = context.rows(); view.unmount(); await context.cold(); view = render(frame()); expect(world()).toEqual(withdrawn); expect(context.rows()).toEqual(savedRows); await press('Continue');
    const done = world(), doneRows = context.rows(); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'enroll', program: 'university', field: 'computing', funding: 'loan' })).toBe(false); expect(await mockStore.getState().dispatch({ type: 'apply-university', field: 'computing' })).toBe(false); expect(await mockStore.getState().dispatch({ type: 'withdraw-university-application', applicationId: item.id })).toBe(false); }); expect(world()).toEqual(done); expect(context.rows()).toEqual(doneRows); expect(enrollmentReason(world(), 'university', 'computing')).toBe('You already applied for this course this year'); context.original(); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
}, 60000);

test('the genuinely reached 2020 waitlist survives a failed ordinary month and cold resumes its one final rejection without a planning pause', async () => {
  const context = await setup();
  try {
    // Current combined runtime's first actual waitlist; no search past a refusal for an offer.
    const observed = ['accepted', 'accepted', 'waitlisted'];
    for (let index = 0; index < observed.length; index++) {
      if (world().people[world().activePersonId].employment) { await command({ type: 'quit-job' }); await command({ type: 'acknowledge', resultId: world().pending!.id }); }
      await command({ type: 'apply-university', field: 'computing' }); expect(world().universityApplications.at(-1)!.status).toBe(observed[index]); await command({ type: 'acknowledge', resultId: world().pending!.id });
      if (index === observed.length - 1) break;
      if (index > 0 && world().universityApplications.at(-1)!.status === 'accepted') { await command({ type: 'withdraw-university-application', applicationId: world().universityApplications.at(-1)!.id }); await command({ type: 'acknowledge', resultId: world().pending!.id }); }
      await command({ type: 'advance' }); await finishYear();
    }
    const initial = world(), waiting = initial.universityApplications.at(-1)!, before = context.rows(), expected = resolveCommand(initial, { type: 'advance' }, true), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    expect(initial.date).toEqual({ year: 2020, month: 1, day: 1 }); expect(waiting.status).toBe('waitlisted'); expect(waiting.reviewDue).toEqual({ year: 2020, month: 2, day: 1 }); expect(waiting.review).toBeNull(); expect(initial.people[initial.activePersonId].education.stage).toBe('none'); let view = render(frame(true));
    const release = context.pause(); context.sqlite.exec("CREATE TRIGGER fail_waitlist_month BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await press('Age Up'); expect(mockStore.getState().busy).toBe(true); expect(screen.getByRole('button', { name: 'Age Up' })).toBeDisabled(); await press('Age Up'); expect(world()).toBe(initial); expect(context.rows()).toEqual(before); await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().error).toMatch(/couldn't be saved/)); expect(screen.getAllByRole('alert')).toHaveLength(1); expect(world()).toBe(initial); expect(context.rows()).toEqual(before);
    context.sqlite.exec('DROP TRIGGER fail_waitlist_month'); await press('Age Up'); expect(world()).toEqual(expected); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore(); const rejected = expected.universityApplications.at(-1)!;
    expect(expected.revision).toBe(initial.revision + 1); expect(context.rows().receipts).toHaveLength(before.receipts.length + 1);
    expect(expected.date).toEqual({ year: 2020, month: 2, day: 1 }); expect(expected.annual).toMatchObject({ monthsProcessed: 1, pausedForPlanning: false }); expect(expected.pending).toMatchObject({ kind: 'result', id: waiting.id + '_review', title: 'Waitlist decision' });
    expect(rejected).toMatchObject({ status: 'rejected', roll: waiting.roll, chance: waiting.chance, review: { date: expected.date }, offered: null, expires: null, ended: expected.date, enrolment: null }); expect(rejected.transitions.map(step => step.status)).toEqual(['waitlisted', 'rejected']);
    expect(expected.ledger.filter(row => row.category === 'tuition')).toEqual([]); expect(expected.liabilities.filter(row => row.kind === 'student')).toEqual([]); expect(expected.people[expected.activePersonId].education.stage).toBe('none'); expect(context.sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(initial.id)?.payload).toBe(before.lives.find(row => row.id === initial.id)!.payload);
    const saved = context.rows(); view.unmount(); await context.cold(); view = render(frame(true)); expect(world()).toEqual(expected); expect(context.rows()).toEqual(saved); expect(screen.getByText('Waitlist decision')).toBeOnTheScreen(); await press('Continue');
    // Rejection presents a saved result but does not create the offer's planning pause.
    // Acknowledging it therefore continues actual remaining annual months immediately.
    expect(world().date).not.toEqual(expected.date); expect(world().annual?.pausedForPlanning ?? false).toBe(false);
    const acknowledged = world(), acknowledgedRows = context.rows(); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: expected.pending!.id })).toBe(false); }); expect(world()).toEqual(acknowledged); expect(context.rows()).toEqual(acknowledgedRows);
    view.unmount(); await finishYear(); const completed = world(), completedRows = context.rows(); expect(completed.date).toEqual({ year: 2021, month: 1, day: 1 }); expect(completed.annual).toBeNull(); expect(completed.pending).toBeNull(); expect(completed.universityApplications).toHaveLength(3); expect(completed.universityApplications.at(-1)).toEqual(rejected);
    expect(completed.journal.filter(row => row.text === 'My waitlisted application to study computing was rejected at its final review.')).toHaveLength(1); expect(completed.ledger.filter(row => row.category === 'tuition')).toEqual([]); expect(completed.liabilities.filter(row => row.kind === 'student')).toEqual([]);
    await context.cold(); view = render(frame()); expect(world()).toEqual(completed); expect(context.rows()).toEqual(completedRows); expect(screen.getByText('Waitlisted 1/1/2020 → Rejected 1/2/2020')).toBeOnTheScreen(); expect(screen.queryByRole('button', { name: 'Review Offered Place' })).toBeNull(); expect(screen.queryByRole('button', { name: 'Withdraw University Application' })).toBeNull();
    await act(async () => { expect(await mockStore.getState().dispatch({ type: 'accept-university-place', applicationId: waiting.id, funding: 'loan' })).toBe(false); expect(await mockStore.getState().dispatch({ type: 'withdraw-university-application', applicationId: waiting.id })).toBe(false); }); expect(world()).toEqual(completed); expect(context.rows()).toEqual(completedRows); context.original(); view.unmount();
    console.info('UNIVERSITY_WAITLIST_CURRENT_OBSERVATION', JSON.stringify({ applied: waiting.applied, review: rejected.review, transitions: rejected.transitions, savedRoll: waiting.roll, savedChance: waiting.chance, planningPausedAtReview: expected.annual!.pausedForPlanning, dateAfterAcknowledgement: acknowledged.date, finalDate: completed.date, finalRevision: completed.revision }));
  } finally { jest.restoreAllMocks(); context.close(); }
}, 120000);

test('actually leaving the unchanged legacy course records its real incomplete study while keeping past dates, currency and costs unknown', async () => {
  const context = await setup('legacy');
  try {
    const initial = world(), education = initial.people[initial.activePersonId].education; let view = render(frame()); expect(screen.queryByText('Previous courses')).toBeNull(); await press('Leave course'); const left = await failureRetry(context, 'Leave Course', { type: 'leave-school' });
    expect(left.studyCourses).toHaveLength(1); expect(left.studyCourses[0]).toMatchObject({ origin: 'legacy-current', status: 'withdrawn', program: 'university', field: 'computing', school: education.school, months: 12, requiredMonths: 48, tuitionPaidMonths: 12, annualTuition: 1400000n, funding: 'loan', started: null, ended: initial.date, recorded: initial.date, country: null, city: null, currency: null, firstPayment: null, admissionId: null });
    expect(left.ledger).toEqual(initial.ledger); expect(left.accounts).toEqual(initial.accounts); expect(left.liabilities).toEqual(initial.liabilities); expect(left.people[left.activePersonId].education.qualifications).toEqual(education.qualifications); expect(left.random).toEqual(initial.random);
    const saved = context.rows(); view.unmount(); await context.cold(); view = render(frame()); expect(world()).toEqual(left); expect(context.rows()).toEqual(saved); await press('Continue'); expect(screen.getByText('12 of 48 study months recorded · 12 months of tuition coverage recorded')).toBeOnTheScreen(); expect(screen.getByText('Start date unrecorded · Ended 1/1/2019')).toBeOnTheScreen(); expect(screen.getByText(/Earlier payment amounts and course currency were not reconstructed/)).toBeOnTheScreen(); const viewed = context.rows(); expect(context.rows()).toEqual(viewed); context.original(); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
}, 60000);

test('a genuine old-runtime incomplete slot is observed only when an actual new course overwrites it, with rollback and exact cold history', async () => {
  const context = await setup('incomplete');
  try {
    const initial = world(), old = initial.people[initial.activePersonId].education, before = context.rows(); let view = render(frame()); expect(screen.queryByText('Previous courses')).toBeNull();
    await press(/^Trade School\./); await choose('Business'); await press('Next'); await choose(/Student loan/); await press('Review Application'); await press('Never mind'); expect(world()).toEqual(initial); expect(context.rows()).toEqual(before);
    await press(/^Trade School\./); await choose('Business'); await press('Next'); await choose(/Student loan/); await press('Review Application'); const enrolled = await failureRetry(context, 'Apply', { type: 'enroll', program: 'trade', field: 'business', funding: 'loan' });
    expect(enrolled.people[enrolled.activePersonId].education.stage).toBe('trade'); expect(enrolled.studyCourses).toHaveLength(2); expect(enrolled.studyCourses[0]).toMatchObject({ origin: 'legacy-incomplete', status: 'observed-incomplete', program: null, field: 'computing', school: old.school, months: 12, requiredMonths: 48, tuitionPaidMonths: 12, annualTuition: old.tuition, recorded: initial.date, started: null, ended: null, country: null, city: null, currency: null, firstPayment: null, admissionId: null }); expect(enrolled.studyCourses[1]).toMatchObject({ origin: 'enrolment', status: 'active', program: 'trade', field: 'business', started: initial.date, months: 0, firstPayment: { billed: 450000n, waived: 0n, funding: 'loan' } });
    expect(enrolled.people[enrolled.activePersonId].education.qualifications).toEqual(old.qualifications); expect(enrolled.universityApplications).toEqual([]); expect(enrolled.ledger.slice(0, initial.ledger.length)).toEqual(initial.ledger); expect(enrolled.ledger.slice(initial.ledger.length).map(row => [row.category, row.cashDelta, row.debtDelta])).toEqual([['borrowing', 450000n, 450000n], ['tuition', -450000n, 0n]]);
    const saved = context.rows(); view.unmount(); await context.cold(); view = render(frame()); expect(world()).toEqual(enrolled); expect(context.rows()).toEqual(saved); await press('Continue'); expect(screen.getByText('Earlier incomplete course observed')).toBeOnTheScreen(); expect(screen.getByText('Start date unrecorded · Historical end date unrecorded')).toBeOnTheScreen(); context.original(); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
}, 60000);
