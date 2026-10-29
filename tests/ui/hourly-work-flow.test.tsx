import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { createLife, randomCreation } from '../../src/game/createLife';
import { encodeWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { jobs } from '../../src/game/content/jobs';
import { jobInterviews } from '../../src/game/content/jobInterviews';
import { hourlyAnnual, hourlyQuote } from '../../src/game/systems/hourlyWork';
import { SaveRepository } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { database } from '../support/sqlite';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import originalArchive from '../fixtures/v27-responsive-archive.json';
let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Jobs from '../../app/(game)/jobs';
import Work from '../../app/(game)/work';
const frame = (child: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{child}<PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
function applicant(student = false) {
  const world = createLife('life_hourly_ui', 42, { ...randomCreation(42), country: 'US', city: 'New York' }, { year: 2000, month: 1, day: 1 });
  world.birthAcknowledged = true; world.date.year += student ? 16 : 22; world.random.outcomes = 1;
  world.people[world.activePersonId].education.stage = student ? 'secondary' : 'none'; world.people[world.activePersonId].education.school = student ? 'New York Secondary School' : '';
  return world;
}
async function setup(student = false) {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.import(JSON.stringify(originalArchive));
  const original = Object.fromEntries(['lives', 'backups', 'snapshots', 'snapshot_metadata', 'receipts'].map(name => [name, sqlite.prepare('SELECT * FROM ' + name + ' ORDER BY 1,2').all()]));
  await repository.create(applicant(student));
  const cold = async () => { const repository = new SaveRepository(driver); mockStore = createGameStore({ repository: async () => repository, date: () => ({ year: 2026, month: 10, day: 20 }), id: () => 'unused' }); await mockStore.getState().bootstrap(); };
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  const assertOriginal = () => { for (const [name, expected] of Object.entries(original)) expect(sqlite.prepare('SELECT * FROM ' + name + " WHERE life_id != 'life_hourly_ui' ORDER BY 1,2".replace('life_id', name === 'lives' ? 'id' : 'life_id')).all()).toEqual(expected); };
  await cold(); return { sqlite, cold, rows, assertOriginal };
}

test('student hours previews and cancelled detail remain read-only, with a clear 20-hour workload reason', async () => {
  const { sqlite, rows, assertOriginal } = await setup(true);
  try {
    const before = rows(), source = encodeWorld(mockStore.getState().world!), view = render(frame(<Jobs />)); await press(/^Weekend Shop Assistant\./);
    expect(screen.getByRole('radio', { name: /12 hours per week/, checked: true })).toBeOnTheScreen(); expect(screen.getByRole('radio', { name: /20 hours per week/ })).toBeDisabled();
    expect(screen.getByText('Students can work at most 16 contracted hours each week')).toBeOnTheScreen();
    await act(async () => { fireEvent.press(screen.getByRole('radio', { name: '8 hours per week' })); }); expect(screen.getByRole('radio', { name: '8 hours per week', checked: true })).toBeOnTheScreen(); await press('Back');
    expect(rows()).toEqual(before); expect(encodeWorld(mockStore.getState().world!)).toBe(source); assertOriginal(); view.unmount();
  } finally { sqlite.close(); }
});

test('reviewed hours survive SQLite failure, warm retry, cold unanswered interview, hiring and cold result without duplicate payment/time', async () => {
  const { sqlite, cold, rows, assertOriginal } = await setup(); let view = render(frame(<Jobs />));
  try {
    await press(/^Weekend Shop Assistant\./); await act(async () => { fireEvent.press(screen.getByRole('radio', { name: '8 hours per week' })); });
    const world = mockStore.getState().world!, before = rows(), terms = hourlyQuote('US', jobs[0], 8), command = { type: 'apply-job' as const, roleId: jobs[0].id, reviewedHourlyTerms: terms }, predicted = resolveCommand(world, command, true), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    sqlite.exec("CREATE TRIGGER fail_hourly_apply BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await press('Apply for this Job');
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/)); expect(rows()).toEqual(before); expect(mockStore.getState().world).toEqual(world); expect(screen.getByRole('radio', { name: '8 hours per week', checked: true })).toBeOnTheScreen();
    sqlite.exec('DROP TRIGGER fail_hourly_apply'); await press('Apply for this Job'); expect(mockStore.getState().world).toEqual(predicted); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    expect(screen.getByText('New York Retail asks: “' + jobInterviews[jobs[0].id].question + '”')).toBeOnTheScreen();
    expect(screen.queryByText(/Reviewed contract:|Your application includes/)).toBeNull();
    const pendingRows = rows(); view.unmount(); await cold(); view = render(frame(<Jobs />)); expect(rows()).toEqual(pendingRows); expect(mockStore.getState().world).toEqual(predicted);
    expect(screen.queryByText(/Reviewed contract:|Your application includes/)).toBeNull();
    const answer = predicted.pending!.kind === 'decision' ? predicted.pending!.choices[0].label : '', answerBefore = rows(), warmUnpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    sqlite.exec("CREATE TRIGGER fail_hourly_answer BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await press(answer); await waitFor(() => expect(mockStore.getState().error).toMatch(/couldn't be saved/)); expect(rows()).toEqual(answerBefore); expect(mockStore.getState().world).toEqual(predicted);
    sqlite.exec('DROP TRIGGER fail_hourly_answer'); await press(answer); const result = mockStore.getState().world!; expect(result).toEqual(resolveCommand(predicted, { type: 'choose', eventId: predicted.pending!.id, choiceId: 'careful' }, true)); expect(warmUnpack).not.toHaveBeenCalled(); warmUnpack.mockRestore();
    expect(result.hourlyContracts[0]).toMatchObject({ terms, periods: [], rates: [] }); expect(result.people[result.activePersonId].employment!.annualPay).toBe(hourlyAnnual(terms)); expect(result.ledger).toEqual(world.ledger); expect(result.accounts).toEqual(world.accounts);
    const resultRows = rows(); view.unmount(); await cold(); view = render(frame(<Work />)); expect(rows()).toEqual(resultRows); expect(mockStore.getState().world).toEqual(result); expect(screen.getByText(/contracted hours\/week/)).toHaveTextContent(/8 contracted hours\/week/); await press('Continue');
    const done = mockStore.getState().world!; expect(done.hourlyContracts).toEqual(result.hourlyContracts); expect(done.workHistory).toEqual(result.workHistory); expect(done.random).toEqual(result.random);
    const acknowledgedRows = rows(); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'choose', eventId: predicted.pending!.id, choiceId: 'careful' })).toBe(false); }); expect(rows()).toEqual(acknowledgedRows);
    // The first actual payroll/year save also rolls back every table and RNG.
    const expectedYear = resolveCommand(done, { type: 'advance' }, true), beforeYear = rows(), beforePayload = sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(done.id)!.payload, yearUnpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    sqlite.exec("CREATE TRIGGER fail_hourly_year BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await act(async () => { expect(await mockStore.getState().dispatch({ type: 'advance' })).toBe(false); }); expect(rows()).toEqual(beforeYear); expect(mockStore.getState().world).toEqual(done);
    sqlite.exec('DROP TRIGGER fail_hourly_year'); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'advance' })).toBe(true); });
    expect(mockStore.getState().world).toEqual(expectedYear); expect(expectedYear.hourlyContracts[0].periods.length).toBeGreaterThan(0); expect(yearUnpack).not.toHaveBeenCalled(); yearUnpack.mockRestore();
    expect(sqlite.prepare('SELECT payload FROM snapshots WHERE life_id=? ORDER BY snapshot_id').all(done.id).some(row => row.payload === beforePayload)).toBe(true);
    const yearRows = rows(); view.unmount(); await cold(); view = render(frame(<Work />)); expect(rows()).toEqual(yearRows); expect(mockStore.getState().world).toEqual(expectedYear); assertOriginal();
  } finally { view.unmount(); jest.restoreAllMocks(); sqlite.close(); }
});
