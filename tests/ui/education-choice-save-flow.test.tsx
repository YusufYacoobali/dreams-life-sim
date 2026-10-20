import React from 'react';
import { Modal } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { createLife, randomCreation } from '../../src/game/createLife';
import { copyWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { monthFrom } from '../../src/game/calendar';
import { randomInteger } from '../../src/game/random';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { accountFor, availableCash } from '../../src/game/systems/common';
import { educationActionReason, educationMonth, enrollmentReason, tuitionFor } from '../../src/game/systems/education';
import { isConfined } from '../../src/game/systems/legalSchemas';
import { rules } from '../../src/game/rules';
import { pupil } from '../support/pupil';
import { createContact } from '../../src/game/systems/npcs';
import { SaveRepository } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { database } from '../support/sqlite';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import archive from '../fixtures/v24-university-loan-archive.json';

let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Education from '../../app/(game)/education';
import School from '../../app/(game)/school';

const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><Education /><PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const choose = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('radio', { name })); }); };
const world = () => mockStore.getState().world!;
const acknowledge = (initial: World) => resolveCommand(initial, { type: 'acknowledge', resultId: initial.pending!.id }, true);
const perform = (initial: World, command: GameCommand) => acknowledge(resolveCommand(initial, command, true));
const category = (program: 'university' | 'trade' | 'graduate') => program === 'graduate' ? /^Professional Study\./ : program === 'trade' ? /^Trade School\./ : /^University\./;

// Explicit generated eligibility scenarios: the ordinary NPC constructor records
// earned qualifications and wages. Normal resignation frees the applicant to
// study. Seed selection exercises both actual admission outcomes without editing
// saved RNG, qualifications, grades or application counters.
function applicant(role = 'administrator', accepted?: boolean, cashForOneYear = false): World {
  for (let seed = 1; seed < 1000; seed++) {
    const initial = createLife('life_education_' + seed, seed, { ...randomCreation(seed), country: 'US', city: 'New York' }, { year: 2026, month: 1, day: 1 });
    initial.birthAcknowledged = true; const person = createContact(initial, { age: 35, qualifiedRole: role }); initial.activePersonId = person.id;
    if (person.education.grades < 55) continue;
    const chance = Math.min(95, 20 + Math.round((person.education.grades + person.stats.smarts) / 2));
    if (accepted !== undefined && (randomInteger(initial.random.outcomes, 1, 100).value <= chance) !== accepted) continue;
    const tuition = tuitionFor(person, 'university'), cash = availableCash(accountFor(initial));
    if (cashForOneYear && (cash < tuition || cash >= tuition * 2n)) continue;
    return perform(initial, { type: 'quit-job' });
  }
  throw new Error('No eligible configured education scenario');
}

// These configured courses advance through the real monthly education system;
// they are not whole-life or whole-economy simulation claims.
function courseMonths(initial: World, months: number) {
  const current = copyWorld(initial);
  for (let month = 0; month < months; month++) { current.date = monthFrom(current.date, 1); educationMonth(current, current.people[current.activePersonId]); }
  return validateWorld(current);
}

async function setup(initial?: World) {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver);
  await repository.initialise(); await repository.import(JSON.stringify(archive)); if (initial) await repository.create(initial);
  let nextYield: Promise<void> | undefined;
  const pauseNextSave = () => { let release!: () => void; nextYield = new Promise<void>(resolve => { release = resolve; }); return release; };
  const cold = async (repo = new SaveRepository(driver)) => {
    mockStore = createGameStore({ repository: async () => repo, date: () => ({ year: 2026, month: 1, day: 1 }), id: () => 'unused', yieldToUI: async () => { const pause = nextYield; nextYield = undefined; if (pause) await pause; } });
    expect(await mockStore.getState().bootstrap()).toBe(true);
  };
  await cold(repository);
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  const expectOldMoments = () => { for (const point of archive.snapshots) expect(sqlite.prepare('SELECT payload FROM snapshots WHERE snapshot_id=?').get(point.summary.id)?.payload).toBe(point.payload); };
  return { sqlite, rows, cold, pauseNextSave, expectOldMoments };
}

const categoryCases = [
  ['university', 'business degree', 'business', 'computing', 'You already hold this qualification'],
  ['university', 'declined business application', 'business', 'computing', 'You already applied for this course this year'],
  ['trade', 'business trade qualification', 'business', 'computing', 'You already hold this qualification'],
  ['trade', 'declined business application', 'business', 'computing', 'You already applied for this course this year'],
  ['graduate', 'medicine qualification', 'medicine', 'law', 'You already hold this qualification'],
  ['graduate', 'declined medicine application', 'medicine', 'law', 'You already applied for this course this year'],
] as const;

test.each(categoryCases)('%s remains open after a %s and keeps exact individual subject reasons', async (program, scenario, blockedField, eligibleField, reason) => {
  let initial = applicant(scenario === 'medicine qualification' ? 'doctor' : scenario === 'business degree' || program === 'graduate' ? 'accountant' : 'administrator', scenario.includes('declined') ? false : scenario === 'business trade qualification' ? true : undefined);
  if (scenario.includes('declined')) initial = perform(initial, { type: 'enroll', program, field: blockedField, funding: 'loan' });
  if (scenario === 'business trade qualification') initial = courseMonths(perform(initial, { type: 'enroll', program: 'trade', field: 'business', funding: 'loan' }), 24);
  expect(enrollmentReason(initial, program, blockedField)).toBe(reason); expect(enrollmentReason(initial, program, eligibleField)).toBeUndefined();
  const { sqlite, rows, expectOldMoments } = await setup(initial);
  try {
    const beforeRows = rows(), before = encodeWorld(world()), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), view = render(frame());
    expect(screen.getByRole('button', { name: category(program) })).toBeEnabled(); await press(category(program));
    const blockedLabel = blockedField[0].toUpperCase() + blockedField.slice(1), eligibleLabel = eligibleField[0].toUpperCase() + eligibleField.slice(1);
    expect(screen.getByRole('radio', { name: blockedLabel + '. ' + reason })).toBeDisabled(); expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    await choose(blockedLabel + '. ' + reason); expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    await choose(eligibleLabel); await press('Next'); await choose(/Student loan/); await press('Review Application'); expect(screen.getByText('Apply to study ' + eligibleField + '?')).toBeOnTheScreen();
    await press('Never mind'); expect(encodeWorld(world())).toBe(before); expect(rows()).toEqual(beforeRows); expect(unpack).not.toHaveBeenCalled(); expectOldMoments(); view.unmount();
  } finally { jest.restoreAllMocks(); sqlite.close(); }
});

test('a category with no eligible offered subjects stays disabled with its shared exact reason', async () => {
  const { sqlite, rows } = await setup();
  try {
    const before = rows(), view = render(frame());
    for (const program of ['university', 'trade', 'graduate'] as const) { const row = screen.getByRole('button', { name: category(program) }); expect(row).toBeDisabled(); expect(row.props.accessibilityLabel).toContain('You are already enrolled'); await press(category(program)); }
    expect(screen.queryByText('Choose your subject')).toBeNull(); expect(rows()).toEqual(before); view.unmount();
  } finally { sqlite.close(); }
});

test.each(['relaxed', 'balanced', 'focused'] as const)('the current %s study routine and cancelled changed draft do not save or decode', async effort => {
  const { sqlite, rows, expectOldMoments } = await setup();
  try {
    if (effort !== 'focused') { expect(await mockStore.getState().dispatch({ type: 'study-effort', effort })).toBe(true); expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: world().pending!.id })).toBe(true); }
    const beforeRows = rows(), before = encodeWorld(world()), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), view = render(frame());
    await press('Study routine. ' + effort); const label = effort[0].toUpperCase() + effort.slice(1);
    expect(screen.getByRole('radio', { name: label + '. This is your current routine' })).toBeDisabled(); await choose(label + '. This is your current routine'); await press('Set Routine'); expect(screen.getByRole('button', { name: 'Set Routine' })).toBeDisabled();
    await choose(effort === 'focused' ? 'Balanced' : 'Focused'); expect(screen.getByRole('button', { name: 'Set Routine' })).toBeEnabled(); await press('Never mind');
    await press('Study routine. ' + effort); expect(screen.getByRole('button', { name: 'Set Routine' })).toBeDisabled(); await press('Never mind');
    expect(encodeWorld(world())).toBe(before); expect(rows()).toEqual(beforeRows); expect(unpack).not.toHaveBeenCalled(); expectOldMoments(); view.unmount();
  } finally { jest.restoreAllMocks(); sqlite.close(); }
});

test.each(['relaxed', 'balanced'] as const)('a real %s study routine rolls back every table, retains draft/alert, retries warm and cold-resumes exactly once', async effort => {
  const { sqlite, rows, cold, expectOldMoments } = await setup();
  try {
    const initial = world(), beforeRows = rows(), command: GameCommand = { type: 'study-effort', effort }, predicted = resolveCommand(initial, command, true), label = effort[0].toUpperCase() + effort.slice(1);
    let view = render(frame()); await press('Study routine. focused'); await choose(label); const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    sqlite.exec("CREATE TRIGGER fail_education BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press('Set Routine'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/)); expect(screen.getByRole('radio', { name: label, checked: true })).toBeOnTheScreen(); expect(world()).toEqual(initial); expect(rows()).toEqual(beforeRows);
    sqlite.exec('DROP TRIGGER fail_education'); await press('Set Routine'); expect(world()).toEqual(predicted); expect(screen.queryByRole('button', { name: 'Set Routine' })).toBeNull(); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    const savedRows = rows(); view.unmount(); await cold(); view = render(frame()); expect(world()).toEqual(predicted); expect(rows()).toEqual(savedRows); await press('Continue'); expect(world()).toEqual(acknowledge(predicted)); expect(world().people).toEqual(predicted.people); expect(world().ledger).toEqual(initial.ledger); expect(world().liabilities).toEqual(initial.liabilities); expect(world().random).toEqual(initial.random);
    const done = world(), doneRows = rows(); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: predicted.pending!.id })).toBe(false); }); expect(world()).toEqual(done); expect(rows()).toEqual(doneRows); expectOldMoments(); view.unmount();
  } finally { jest.restoreAllMocks(); sqlite.close(); }
});

test.each([true, false])('an actual admission accepted=%s keeps field/funding confirmation after rollback and retries without rerolling or duplicate tuition', async accepted => {
  const { sqlite, rows, cold, pauseNextSave, expectOldMoments } = await setup(applicant('administrator', accepted));
  try {
    const initial = world(), beforeRows = rows(), command: GameCommand = { type: 'enroll', program: 'university', field: 'science', funding: 'loan' }, predicted = resolveCommand(initial, command, true);
    let view = render(frame()); await press(category('university')); await choose('Science'); await press('Next'); await choose(/Student loan/); await press('Review Application'); expect(world()).toEqual(initial); expect(rows()).toEqual(beforeRows);
    const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); sqlite.exec("CREATE TRIGGER fail_education BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press('Apply'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/)); expect(screen.getByText('Apply to study science?')).toBeOnTheScreen(); expect(screen.getByText(/a student loan funds the tuition/)).toBeOnTheScreen(); expect(world()).toEqual(initial); expect(rows()).toEqual(beforeRows);
    sqlite.exec('DROP TRIGGER fail_education'); const release = pauseNextSave(); await press('Apply'); expect(mockStore.getState().busy).toBe(true);
    for (const program of ['university', 'trade', 'graduate'] as const) expect(screen.getByRole('button', { name: category(program) })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled(); expect(screen.getByRole('button', { name: 'Never mind' })).toBeDisabled();
    await press('Apply'); await press('Never mind'); await act(async () => { screen.UNSAFE_getByType(Modal).props.onRequestClose(); }); expect(screen.getByText('Apply to study science?')).toBeOnTheScreen(); expect(rows()).toEqual(beforeRows);
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false)); expect(world()).toEqual(predicted); expect(screen.queryByText('Apply to study science?')).toBeNull(); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    expect(world().people[world().activePersonId].education.stage).toBe(accepted ? 'university' : 'none');
    expect(world().ledger.filter(item => item.category === 'tuition')).toHaveLength(initial.ledger.filter(item => item.category === 'tuition').length + (accepted ? 1 : 0));
    if (accepted) { expect(world().people[world().activePersonId].education.months).toBe(0); expect(world().people[world().activePersonId].education.qualifications).toEqual(initial.people[initial.activePersonId].education.qualifications); }
    else { expect(world().accounts).toEqual(initial.accounts); expect(world().liabilities).toEqual(initial.liabilities); }
    const savedRows = rows(); view.unmount(); await cold(); view = render(frame()); expect(world()).toEqual(predicted); expect(rows()).toEqual(savedRows); await press('Continue'); expect(world()).toEqual(acknowledge(predicted)); expect(world().people).toEqual(predicted.people); expect(world().ledger).toEqual(predicted.ledger); expect(world().liabilities).toEqual(predicted.liabilities); expect(world().random).toEqual(predicted.random);
    const done = world(), doneRows = rows(); await act(async () => { expect(await mockStore.getState().dispatch(command)).toBe(false); }); expect(world()).toEqual(done); expect(rows()).toEqual(doneRows); expectOldMoments(); view.unmount();
  } finally { jest.restoreAllMocks(); sqlite.close(); }
});

test.each(['leave-school', 'fund-studies'] as const)('%s keeps its confirmation/draft through SQLite failure, retries warm and cold-resumes without duplicate money or credit', async type => {
  const paused = type === 'fund-studies' ? courseMonths(perform(applicant('administrator', true, true), { type: 'enroll', program: 'university', field: 'science', funding: 'cash' }), 13) : undefined;
  if (paused) expect(paused.people[paused.activePersonId].education).toMatchObject({ paused: true, months: 12, tuitionPaidMonths: 12 });
  const { sqlite, rows, cold, pauseNextSave, expectOldMoments } = await setup(paused);
  try {
    const initial = world(), beforeRows = rows(), command: GameCommand = type === 'fund-studies' ? { type, funding: 'loan' } : { type }, predicted = resolveCommand(initial, command, true);
    const launch = type === 'fund-studies' ? 'Fund Next Year' : 'Leave course', confirm = type === 'fund-studies' ? 'Resume Studies' : 'Leave Course';
    let view = render(frame()); await press(launch); if (type === 'fund-studies') await choose(/Borrow tuition/); await press('Never mind'); expect(rows()).toEqual(beforeRows); expect(world()).toEqual(initial);
    await press(launch); if (type === 'fund-studies') await choose(/Borrow tuition/);
    const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); sqlite.exec("CREATE TRIGGER fail_education BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press(confirm); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/)); expect(screen.getByRole('button', { name: confirm })).toBeEnabled(); if (type === 'fund-studies') expect(screen.getByRole('radio', { name: /Borrow tuition/, checked: true })).toBeOnTheScreen(); expect(world()).toEqual(initial); expect(rows()).toEqual(beforeRows);
    sqlite.exec('DROP TRIGGER fail_education'); const release = pauseNextSave(); await press(confirm); expect(screen.getByRole('button', { name: launch })).toBeDisabled(); expect(screen.getByRole('button', { name: confirm })).toBeDisabled(); expect(screen.getByRole('button', { name: 'Never mind' })).toBeDisabled();
    if (type === 'leave-school') { expect(screen.getByRole('button', { name: /^Study routine\./ })).toBeDisabled(); expect(screen.getByRole('button', { name: /^Study harder\./ })).toBeDisabled(); }
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false)); expect(world()).toEqual(predicted); expect(screen.queryByRole('button', { name: confirm })).toBeNull(); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    expect(world().people[world().activePersonId].education.months).toBe(initial.people[initial.activePersonId].education.months); expect(world().people[world().activePersonId].education.qualifications).toEqual(initial.people[initial.activePersonId].education.qualifications);
    if (type === 'leave-school') { expect(world().accounts).toEqual(initial.accounts); expect(world().liabilities).toEqual(initial.liabilities); expect(world().ledger).toEqual(initial.ledger); }
    const savedRows = rows(); view.unmount(); await cold(); view = render(frame()); expect(world()).toEqual(predicted); expect(rows()).toEqual(savedRows); await press('Continue'); expect(world()).toEqual(acknowledge(predicted)); expect(world().people).toEqual(predicted.people); expect(world().ledger).toEqual(predicted.ledger); expect(world().liabilities).toEqual(predicted.liabilities); expect(world().random).toEqual(predicted.random);
    const done = world(), doneRows = rows(); await act(async () => { expect(await mockStore.getState().dispatch(command)).toBe(false); }); expect(world()).toEqual(done); expect(rows()).toEqual(doneRows); expectOldMoments(); view.unmount();
  } finally { jest.restoreAllMocks(); sqlite.close(); }
});

// Fixed ordinary command trace: genuine studying save / generated cash-funded
// course, followed by actual offences and remand. No legal state or roll edits.
async function enterActualRemand() {
  for (const offence of ['shoplift', 'vandalism', 'burglary'] as const) {
    expect(await mockStore.getState().dispatch({ type: 'crime', offence })).toBe(true);
    if (world().pending?.kind === 'decision') break;
    expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: world().pending!.id })).toBe(true);
  }
  let advanced = false;
  const arrestOpen = () => { const pending = world().pending; return pending?.kind === 'decision' && pending.templateId === 'arrest'; };
  for (let step = 0; step < 60 && !arrestOpen(); step++) {
    const current = world();
    if (current.pending?.kind === 'decision') {
      const choice = current.pending.choices.find(item => !choiceUnavailable(current, item))!;
      expect(await mockStore.getState().dispatch({ type: 'choose', eventId: current.pending.id, choiceId: choice.id })).toBe(true);
    } else if (current.pending) expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: current.pending.id })).toBe(true);
    else if (current.annual) expect(await mockStore.getState().dispatch({ type: 'resume' })).toBe(true);
    else if (!advanced) { advanced = true; expect(await mockStore.getState().dispatch({ type: 'advance' })).toBe(true); }
    else break;
  }
  expect(world().pending).toMatchObject({ kind: 'decision', templateId: 'arrest' });
  expect(await mockStore.getState().dispatch({ type: 'choose', eventId: world().pending!.id, choiceId: 'remand' })).toBe(true);
  expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: world().pending!.id })).toBe(true);
  expect(isConfined(world())).toBe(true);
}

test.each([false, true])('real remand exposes the same existing education refusal for paused=%s and blocked controls never save', async paused => {
  const initial = paused ? courseMonths(perform(applicant('administrator', true, true), { type: 'enroll', program: 'university', field: 'science', funding: 'cash' }), 13) : undefined;
  const { sqlite, rows, cold, expectOldMoments } = await setup(initial);
  try {
    await enterActualRemand();
    const confined = world(), beforeRows = rows(), before = encodeWorld(confined), reason = 'This activity is unavailable while you are in custody';
    const commands: GameCommand[] = [{ type: 'study' }, { type: 'study-effort', effort: 'relaxed' }, { type: 'leave-school' }, { type: 'fund-studies', funding: 'loan' }];
    for (const command of commands) {
      expect(educationActionReason(confined, command.type as 'study' | 'study-effort' | 'leave-school' | 'fund-studies')).toBe(reason);
      expect(() => resolveCommand(confined, command, true)).toThrow(reason);
    }
    const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); let view = render(frame());
    for (const name of paused ? [/^Fund Next Year\./, /^Leave course\./] : [/^Study harder\./, /^Study routine\./, /^Leave course\./]) {
      const control = screen.getByRole('button', { name }); expect(control).toBeDisabled(); expect(control.props.accessibilityLabel).toContain(reason); await press(name);
    }
    expect(screen.queryByText('Leave this course?')).toBeNull(); expect(screen.queryByText('Fund your next year')).toBeNull(); expect(screen.queryByRole('button', { name: 'Set Routine' })).toBeNull();
    expect(world()).toEqual(confined); expect(encodeWorld(world())).toBe(before); expect(rows()).toEqual(beforeRows); expect(unpack).not.toHaveBeenCalled(); expectOldMoments(); unpack.mockRestore();
    view.unmount(); await cold(); view = render(frame()); expect(world()).toEqual(confined); expect(rows()).toEqual(beforeRows); expect(screen.getByRole('button', { name: /^Leave course\./ })).toBeDisabled(); expectOldMoments(); view.unmount();
  } finally { jest.restoreAllMocks(); sqlite.close(); }
});

test('the once-yearly study refusal is shared by direct commands and Education without another receipt or RNG change', async () => {
  const { sqlite, rows, expectOldMoments } = await setup();
  try {
    expect(await mockStore.getState().dispatch({ type: 'study' })).toBe(true);
    expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: world().pending!.id })).toBe(true);
    const initial = world(), before = rows(), reason = 'You have already done extra study this year';
    expect(educationActionReason(initial, 'study')).toBe(reason); expect(() => resolveCommand(initial, { type: 'study' }, true)).toThrow(reason);
    const view = render(frame()); const button = screen.getByRole('button', { name: /^Study harder\./ }); expect(button).toBeDisabled(); expect(button.props.accessibilityLabel).toContain(reason);
    await press(/^Study harder\./); expect(world()).toEqual(initial); expect(rows()).toEqual(before); expectOldMoments(); view.unmount();
  } finally { sqlite.close(); }
});

test.each(['US', 'IT'] as const)('%s school and education explain the actual game assessment age without granting withdrawal or qualifications', async code => {
  const { sqlite, rows, expectOldMoments } = await setup(pupil(code, rules[code].secondaryStart));
  try {
    const initial = world(), before = rows(), payload = encodeWorld(initial), explanation = "This game's school course is assessed at age " + rules[code].schoolEnd + '.';
    expect(educationActionReason(initial, 'leave-school')).toBe('You cannot withdraw from compulsory education');
    expect(() => resolveCommand(initial, { type: 'leave-school' }, true)).toThrow(/compulsory/);
    let view = render(frame()); expect(screen.getByText(new RegExp(explanation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeOnTheScreen(); expect(screen.queryByRole('button', { name: /^Leave course/ })).toBeNull(); view.unmount();
    view = render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><School /></ThemeProvider></SafeAreaProvider>);
    expect(screen.getByText(new RegExp(explanation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeOnTheScreen();
    expect(encodeWorld(world())).toBe(payload); expect(world()).toEqual(initial); expect(rows()).toEqual(before); expectOldMoments(); view.unmount();
  } finally { sqlite.close(); }
});
