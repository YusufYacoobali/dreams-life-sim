import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGameStore } from '../../src/state/gameStore';
import { createLife, randomCreation } from '../../src/game/createLife';
import { encodeWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { accountFor, availableCash } from '../../src/game/systems/common';
import { tuitionFor } from '../../src/game/systems/education';
import { createContact } from '../../src/game/systems/npcs';
import { moveQuote, relocationFee } from '../../src/game/systems/relocation';
import { investmentQuote } from '../../src/game/systems/markets';
import { rules } from '../../src/game/rules';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import archive from '../fixtures/v24-university-loan-archive.json';

let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Education from '../../app/(game)/education';
import Bank from '../../app/(game)/bank';

const frame = (bank = false) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{bank ? <Bank /> : <Education />}<PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const choose = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('radio', { name })); }); };
const world = () => mockStore.getState().world!;
const acknowledge = (initial: World) => resolveCommand(initial, { type: 'acknowledge', resultId: initial.pending!.id }, true);
const perform = (initial: World, command: GameCommand) => acknowledge(resolveCommand(initial, command, true));
const debt = (initial: World, kind: 'student' | 'personal', currency = accountFor(initial).currency) => initial.liabilities.find(item => item.id === 'debt_' + kind + '_' + initial.activePersonId + '_' + currency)!;

function move(initial: World, destinationId: 'berlin' | 'london') {
  const approved = perform(initial, { type: 'apply-relocation', destinationId, route: 'work', roleId: 'developer', program: null, field: null, quotedFee: relocationFee(initial) });
  const application = approved.relocations.at(-1)!; expect(application.status).toBe('approved');
  return perform(approved, { type: 'relocate', applicationId: application.id, companionIds: [], reserveMonths: 3, reviewedQuote: moveQuote(approved, application, [], 3) });
}

// A configured ordinary developer background, not a natural birth-to-career
// claim. Everything after that initial setup uses real unchanged commands:
// borrowing both loan kinds in France, withdrawal and an approved move to Germany.
// No cash, debt, grade, application-counter or RNG edits fund this journey.
function germanBorrower() {
  let initial = createLife('life_loan_rate_3', 3, { ...randomCreation(3), country: 'FR', city: 'Paris', background: 'ordinary' }, { year: 2026, month: 1, day: 1 });
  initial.birthAcknowledged = true; const person = createContact(initial, { age: 35, qualifiedRole: 'developer' }); initial.activePersonId = person.id;
  initial = perform(initial, { type: 'borrow', amount: 10000n }); initial = perform(initial, { type: 'quit-job' });
  initial = perform(initial, { type: 'enroll', program: 'university', field: 'science', funding: 'loan' });
  expect(initial.people[person.id].education.stage).toBe('university'); initial = perform(initial, { type: 'leave-school' });
  initial = move(initial, 'berlin'); expect(initial.people[person.id].country).toBe('DE');
  expect(debt(initial, 'student')).toMatchObject({ principal: 60000n, interestBps: 200 });
  expect(debt(initial, 'personal')).toMatchObject({ principal: 10000n, interestBps: 650 });
  return initial;
}

function pausedCourse() {
  let initial = perform(germanBorrower(), { type: 'quit-job' });
  initial = perform(initial, { type: 'enroll', program: 'university', field: 'arts', funding: 'cash' });
  expect(initial.people[initial.activePersonId].education.stage).toBe('university');
  let quantity = availableCash(accountFor(initial)) / investmentQuote(initial, 'NORTH', 1n).buyCost;
  while (investmentQuote(initial, 'NORTH', quantity).buyCost > availableCash(accountFor(initial))) quantity--;
  initial = perform(initial, { type: 'buy-investment', instrumentId: 'NORTH', quantity, quotedMinor: investmentQuote(initial, 'NORTH', quantity).value });
  for (let year = 0; year < 2; year++) {
    initial = resolveCommand(initial, { type: 'advance' }, true); let guard = 0;
    while ((initial.pending || initial.annual) && guard++ < 100) {
      if (initial.pending?.kind === 'decision') { const choice = initial.pending.choices.find(item => !choiceUnavailable(initial, item))!; initial = resolveCommand(initial, { type: 'choose', eventId: initial.pending.id, choiceId: choice.id }, true); }
      else if (initial.pending) initial = acknowledge(initial);
      else initial = resolveCommand(initial, { type: 'resume' }, true);
    }
    expect(guard).toBeLessThan(100);
  }
  expect(initial.people[initial.activePersonId].education).toMatchObject({ paused: true, months: 12, tuitionPaidMonths: 12 });
  return initial;
}

async function setup(initial: World) {
  const directory = mkdtempSync(join(tmpdir(), 'dreams-loan-rate-')), path = join(directory, 'dreams.db'); let sqlite: DatabaseSync;
  function connect(): SqlDatabase {
    sqlite = new DatabaseSync(path); sqlite.exec('PRAGMA foreign_keys=ON'); const connection = sqlite;
    const session: SqlSession = {
      run: async (sql, values = []) => { connection.prepare(sql).run(...values); },
      get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null,
      all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[],
    };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => {
      connection.exec('BEGIN IMMEDIATE'); try { const value = await action(session); connection.exec('COMMIT'); return value; } catch (error) { connection.exec('ROLLBACK'); throw error; }
    } };
  }
  const repository = new SaveRepository(connect()); await repository.initialise(); await repository.import(JSON.stringify(archive)); await repository.create(initial);
  const bootstrap = async (repo: SaveRepository) => { mockStore = createGameStore({ repository: async () => repo, date: () => initial.date, id: () => 'unused' }); expect(await mockStore.getState().bootstrap()).toBe(true); };
  await bootstrap(repository);
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  return { get sqlite() { return sqlite; }, rows,
    cold: async () => { sqlite.close(); await bootstrap(new SaveRepository(connect())); },
    oldMoments: () => { for (const point of archive.snapshots) expect(sqlite.prepare('SELECT payload FROM snapshots WHERE snapshot_id=?').get(point.summary.id)?.payload).toBe(point.payload); },
    close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); },
  };
}
type Context = Awaited<ReturnType<typeof setup>>;

async function requestUniversityPlace(context: Context, field: string) {
  const initial = world(), beforeRows = context.rows();
  await press(/^University\./); await choose(field); await press('Review Free Application');
  expect(screen.getByText('No fee or loan')).toBeOnTheScreen(); expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows);
  await press('Submit University Application');
  const item = world().universityApplications.at(-1)!;
  // One actual application of the already fixed Arts subject/seed/context.
  // Never search another subject/seed or reroll a rejected/waitlisted outcome.
  expect(item).toMatchObject({ status: 'accepted', field: field.toLowerCase(), enrolment: null });
  expect(world().people).toEqual(initial.people); expect(world().accounts).toEqual(initial.accounts); expect(world().liabilities).toEqual(initial.liabilities); expect(world().ledger).toEqual(initial.ledger);
  await press('Continue'); return item.id;
}

async function admission(program: 'university' | 'trade' | 'graduate', field: string, rate: number, existing = true) {
  if (program === 'university') await press('Review Offered Place');
  else { await press(program === 'graduate' ? /^Professional Study\./ : /^Trade School\./); await choose(field); await press('Next'); }
  expect(screen.getByRole('radio', { name: 'Student loan · ' + rate + '% annual interest' })).toBeOnTheScreen();
  if (existing) expect(screen.getByText(program === 'university' ? /joins your existing EUR student loan/ : /added to your existing EUR student loan at 2%/)).toBeOnTheScreen();
  else expect(screen.queryByText(/(?:added to|joins) your existing/)).toBeNull();
  await choose(/Student loan/); await press(program === 'university' ? 'Review Enrolment' : 'Review Application');
  expect(screen.getByText('Student loan annual interest')).toBeOnTheScreen(); expect(screen.getByText(rate + '%')).toBeOnTheScreen();
}

async function retryEducation(context: Context, command: GameCommand, confirm: string, checkDraft: () => void) {
  const initial = world(), beforeRows = context.rows(), predicted = resolveCommand(initial, command, true), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
  const previousPayload = context.sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(initial.id)!.payload;
  context.sqlite.exec("CREATE TRIGGER fail_loan_rate BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  await press(confirm); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/)); checkDraft();
  expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows);
  context.sqlite.exec('DROP TRIGGER fail_loan_rate'); await press(confirm); expect(world()).toEqual(predicted); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
  expect(context.sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(initial.id)?.payload).toBe(previousPayload);
  const borrowed = world().ledger.slice(initial.ledger.length).filter(item => item.category === 'borrowing'), tuition = world().ledger.slice(initial.ledger.length).filter(item => item.category === 'tuition');
  expect(borrowed).toHaveLength(1); expect(tuition).toHaveLength(1); expect(borrowed[0].cashDelta).toBe(-tuition[0].cashDelta);
  expect(debt(world(), 'student').principal).toBe((debt(initial, 'student')?.principal ?? 0n) + borrowed[0].cashDelta);
  expect(world().people[world().activePersonId].education.months).toBe(command.type === 'fund-studies' ? 12 : 0);
  return { predicted, savedRows: context.rows() };
}

async function coldAndAcknowledge(context: Context, predicted: World, savedRows: ReturnType<Context['rows']>, bank = false) {
  await context.cold(); const view = render(frame(bank)); expect(world()).toEqual(predicted); expect(context.rows()).toEqual(savedRows);
  await press('Continue'); expect(world()).toEqual(acknowledge(predicted)); expect(world().accounts).toEqual(predicted.accounts); expect(world().liabilities).toEqual(predicted.liabilities); expect(world().ledger).toEqual(predicted.ledger); expect(world().random).toEqual(predicted.random);
  const afterRows = context.rows(); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: predicted.pending!.id })).toBe(false); }); expect(context.rows()).toEqual(afterRows); context.oldMoments(); view.unmount();
}

test.each([['university', 'Arts'], ['trade', 'Arts'], ['graduate', 'Medicine'], ['graduate', 'Law']] as const)('%s %s quotes the reused French EUR rate through local review, rollback, retry and cold acknowledgement', async (program, field) => {
  const initial = perform(germanBorrower(), { type: 'quit-job' }), context = await setup(initial);
  try {
    expect(rules.DE.studentInterestBps).toBe(150); const view = render(frame()), applicationId = program === 'university' ? await requestUniversityPlace(context, field) : null;
    const before = encodeWorld(world()), beforeRows = context.rows(), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    await admission(program, field, 2); await press('Never mind'); expect(encodeWorld(world())).toBe(before); expect(context.rows()).toEqual(beforeRows); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    await admission(program, field, 2);
    const command = applicationId ? { type: 'accept-university-place', applicationId, funding: 'loan' } as const : { type: 'enroll', program, field: field.toLowerCase(), funding: 'loan' } as GameCommand;
    const { predicted, savedRows } = await retryEducation(context, command, applicationId ? 'Accept Place And Enrol' : 'Apply', () => { expect(screen.getByText(applicationId ? 'Accept your university place?' : 'Apply to study ' + field.toLowerCase() + '?')).toBeOnTheScreen(); expect(screen.getByText('2%')).toBeOnTheScreen(); });
    expect(debt(world(), 'student')).toMatchObject({ interestBps: 200, principal: 60000n + tuitionFor(initial.people[initial.activePersonId], program) });
    view.unmount(); await coldAndAcknowledge(context, predicted, savedRows);
  } finally { jest.restoreAllMocks(); context.close(); }
});

test('a cash-funded course paused by actual annual processing resumes at its existing EUR loan rate without losing completed months', async () => {
  const context = await setup(pausedCourse());
  try {
    const initial = world(), beforeRows = context.rows(), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), view = render(frame());
    const review = async () => { await press('Fund Next Year'); expect(screen.getByText(/added to your existing EUR student loan at 2%/)).toBeOnTheScreen(); await choose('Borrow tuition at 2% annual interest'); };
    await review(); await press('Never mind'); expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore(); await review();
    const { predicted, savedRows } = await retryEducation(context, { type: 'fund-studies', funding: 'loan' }, 'Resume Studies', () => expect(screen.getByRole('radio', { name: 'Borrow tuition at 2% annual interest', checked: true })).toBeOnTheScreen());
    expect(debt(world(), 'student').interestBps).toBe(200); expect(world().people[world().activePersonId].education).toMatchObject({ paused: false, months: 12, tuitionPaidMonths: 24 });
    view.unmount(); await coldAndAcknowledge(context, predicted, savedRows);
  } finally { jest.restoreAllMocks(); context.close(); }
});

test('a fully repaid canonical EUR student line still quotes and reuses its original rate', async () => {
  let initial = perform(germanBorrower(), { type: 'quit-job' }); initial = perform(initial, { type: 'repay', liabilityId: debt(initial, 'student').id, amount: debt(initial, 'student').principal }); expect(debt(initial, 'student').principal).toBe(0n);
  const context = await setup(initial);
  try {
    const view = render(frame()), applicationId = await requestUniversityPlace(context, 'Arts'); await admission('university', 'Arts', 2);
    const { predicted, savedRows } = await retryEducation(context, { type: 'accept-university-place', applicationId, funding: 'loan' }, 'Accept Place And Enrol', () => expect(screen.getByText('2%')).toBeOnTheScreen());
    expect(debt(world(), 'student')).toMatchObject({ principal: 60000n, interestBps: 200 }); expect(world().liabilities.filter(item => item.kind === 'student' && item.ownerId === initial.activePersonId)).toHaveLength(1);
    view.unmount(); await coldAndAcknowledge(context, predicted, savedRows);
  } finally { jest.restoreAllMocks(); context.close(); }
});

test('after an actual move to London an existing EUR student loan does not replace the new GBP country rate', async () => {
  const initial = perform(move(germanBorrower(), 'london'), { type: 'quit-job' }), oldEUR = debt(initial, 'student', 'EUR'), context = await setup(initial);
  try {
    expect(initial.people[initial.activePersonId].country).toBe('GB'); expect(accountFor(initial).currency).toBe('GBP'); expect(debt(initial, 'student')).toBeUndefined();
    const view = render(frame()), applicationId = await requestUniversityPlace(context, 'Arts'); await admission('university', 'Arts', 4, false);
    const { predicted, savedRows } = await retryEducation(context, { type: 'accept-university-place', applicationId, funding: 'loan' }, 'Accept Place And Enrol', () => expect(screen.getByText('4%')).toBeOnTheScreen());
    expect(debt(world(), 'student')).toMatchObject({ interestBps: 400, principal: rules.GB.universityTuition }); expect(debt(world(), 'student', 'EUR')).toEqual(oldEUR);
    view.unmount(); await coldAndAcknowledge(context, predicted, savedRows);
  } finally { jest.restoreAllMocks(); context.close(); }
});

test.each(['DE', 'GB'] as const)('Bank personal borrowing in %s reviews the exact reused or new currency rate before committing', async country => {
  const initial = country === 'DE' ? germanBorrower() : move(germanBorrower(), 'london'), context = await setup(initial);
  try {
    const rate = country === 'DE' ? 6.5 : 8, oldEUR = debt(initial, 'personal', 'EUR'), beforeRows = context.rows(), before = encodeWorld(world()), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    const view = render(frame(true)); await act(async () => fireEvent.changeText(screen.getByLabelText('Amount in ' + accountFor(initial).currency), '100'));
    await press('Review Personal Loan'); expect(screen.getByText('Annual interest')).toBeOnTheScreen(); expect(screen.getByText(rate + '%')).toBeOnTheScreen(); await press('Never mind'); expect(encodeWorld(world())).toBe(before); expect(context.rows()).toEqual(beforeRows); expect(unpack).not.toHaveBeenCalled();
    await press('Review Personal Loan'); const predicted = resolveCommand(initial, { type: 'borrow', amount: 10000n }, true); await press('Accept Loan'); expect(world()).toEqual(predicted); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    expect(debt(world(), 'personal')).toMatchObject({ interestBps: rate * 100, principal: (country === 'DE' ? oldEUR.principal : 0n) + 10000n }); if (country === 'GB') expect(debt(world(), 'personal', 'EUR')).toEqual(oldEUR);
    const savedRows = context.rows(); view.unmount(); await coldAndAcknowledge(context, predicted, savedRows, true);
  } finally { jest.restoreAllMocks(); context.close(); }
});
