import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { createLife, randomCreation } from '../../src/game/createLife';
import { encodeWorld, World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { randomInteger } from '../../src/game/random';
import { SaveRepository } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { database } from '../support/sqlite';
import { ThemeProvider } from '../../src/ui/theme';
let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Jobs from '../../app/(game)/jobs';
import Work from '../../app/(game)/work';
import { PendingEvent } from '../../src/ui/PendingEvent';
const frame = (child: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{child}<PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => fireEvent.press(screen.getByRole('button', { name }))); };
function applicant(): World {
  const world = createLife('life_interview_ui', 42, { ...randomCreation(42), country: 'US', city: 'New York' }, { year: 2000, month: 1, day: 1 });
  world.birthAcknowledged = true; world.date.year += 22; return world;
}
async function setup(initial = applicant()) {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.create(initial);
  const cold = async () => { const repository = new SaveRepository(driver); mockStore = createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'unused' }); await mockStore.getState().bootstrap(); };
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  await cold(); return { sqlite, repository, cold, rows };
}

test('job search, type filters, locked requirements and details browse without saving', async () => {
  const { sqlite, rows } = await setup(), before = rows(), original = encodeWorld(mockStore.getState().world!); const view = render(frame(<Jobs />));
  const filter = async (name: string) => { await act(async () => fireEvent.press(screen.getByRole('tab', { name }))); expect(screen.getByRole('tab', { name, selected: true })).toBeOnTheScreen(); };
  expect(screen.getByRole('tab', { name: 'All Jobs', selected: true })).toBeOnTheScreen();
  fireEvent.changeText(screen.getByLabelText('Search jobs'), ' café '); expect(screen.getByRole('button', { name: /^Part-time Café Assistant\./ })).toBeOnTheScreen();
  await filter('Full-time'); expect(screen.getByText(/No roles match/)).toBeOnTheScreen(); await filter('Part-time'); await press(/^Part-time Café Assistant\./);
  expect(screen.getByText('Work type: Part-time')).toBeOnTheScreen(); expect(screen.getByText(/First full month’s gross pay:/)).toBeOnTheScreen(); expect(screen.getByText(/once per year/)).toBeOnTheScreen();
  await press('Back'); fireEvent.changeText(screen.getByLabelText('Search jobs'), 'doctor'); await filter('All Jobs'); await press('Show All Requirements'); await press(/^Doctor\./);
  expect(screen.getByRole('button', { name: 'Apply for this Job' })).toBeDisabled(); expect(screen.getByText(/Requirements: medicine qualification/)).toBeOnTheScreen();
  expect(rows()).toEqual(before); expect(encodeWorld(mockStore.getState().world!)).toBe(original); view.unmount(); sqlite.close();
});

test.each([true, false])('application and answer %s retry atomically, cold-resume the bound interview/result and avoid warm full decode', async accepted => {
  const initial = applicant(), p = initial.people[initial.activePersonId], chance = Math.max(15, Math.min(95, 50 + Math.round((p.stats.smarts + p.stats.respect + p.stats.discipline) / 6) + Math.floor(p.stats.fame / 20)));
  initial.random.outcomes = Array.from({ length: 10000 }, (_, i) => i + 1).find(seed => (randomInteger(seed, 1, 100).value <= chance) === accepted)!;
  const { sqlite, cold, rows } = await setup(initial); let view = render(frame(<Jobs />)); const before = rows(), original = encodeWorld(mockStore.getState().world!);
  await press(/^Retail Assistant\./); const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
  sqlite.exec("CREATE TRIGGER fail_apply BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  await press('Apply for this Job'); await waitFor(() => expect(mockStore.getState().error).toMatch(/couldn't be saved/)); expect(screen.getByText('Job Detail')).toBeOnTheScreen(); expect(rows()).toEqual(before); expect(encodeWorld(mockStore.getState().world!)).toBe(original);
  sqlite.exec('DROP TRIGGER fail_apply'); await press('Apply for this Job'); await waitFor(() => expect(screen.getByText('Retail Assistant interview')).toBeOnTheScreen());
  const pending = mockStore.getState().world!, pendingRows = rows(); expect(pending).toEqual(resolveCommand(initial, { type: 'apply-job', roleId: 'retail' }, true)); expect(pending.random).toEqual(initial.random); expect(pending.people).toEqual(initial.people); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
  view.unmount(); await cold(); view = render(frame(<Jobs />)); expect(rows()).toEqual(pendingRows); expect(mockStore.getState().world).toEqual(pending);
  const answer = 'Check the label and ask a supervisor to resolve it', warmUnpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
  sqlite.exec("CREATE TRIGGER fail_answer BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await press(answer); await waitFor(() => expect(mockStore.getState().error).toMatch(/couldn't be saved/)); expect(rows()).toEqual(pendingRows); expect(mockStore.getState().world).toEqual(pending);
  sqlite.exec('DROP TRIGGER fail_answer'); await press(answer); await waitFor(() => expect(screen.getByText(accepted ? 'You got the job' : 'They chose another applicant')).toBeOnTheScreen());
  const result = mockStore.getState().world!; expect(result).toEqual(resolveCommand(pending, { type: 'choose', eventId: pending.pending!.id, choiceId: 'careful' }, true)); expect(result.accounts).toEqual(initial.accounts); expect(result.ledger).toEqual(initial.ledger); expect(warmUnpack).not.toHaveBeenCalled(); warmUnpack.mockRestore();
  const resultRows = rows(); view.unmount(); await cold(); view = render(frame(<Work />)); expect(rows()).toEqual(resultRows); expect(mockStore.getState().world).toEqual(result); await press('Continue');
  const done = mockStore.getState().world!; expect(done.people).toEqual(result.people); expect(done.random).toEqual(result.random); expect(done.workHistory).toEqual(result.workHistory); expect(done.revision).toBe(initial.revision + 3);
  await act(async () => { expect(await mockStore.getState().dispatch({ type: 'choose', eventId: pending.pending!.id, choiceId: 'careful' })).toBe(false); }); expect(mockStore.getState().world).toEqual(done); view.unmount(); sqlite.close();
});

test('cold-resumed withdrawal consumes no random draw and keeps the role unavailable until next year', async () => {
  const { sqlite, cold } = await setup(); let view = render(frame(<Jobs />)); await press(/^Cleaner\./); await press('Apply for this Job'); await waitFor(() => expect(screen.getByText('Cleaner interview')).toBeOnTheScreen()); const pending = mockStore.getState().world!;
  view.unmount(); await cold(); view = render(frame(<Jobs />)); await press('Withdraw my application'); await waitFor(() => expect(screen.getByText('Application withdrawn')).toBeOnTheScreen()); expect(mockStore.getState().world!.random).toEqual(pending.random);
  await press('Continue'); expect(screen.queryByRole('button', { name: /^Cleaner\./ })).toBeNull(); await press('Show All Requirements'); await press(/^Cleaner\./); expect(screen.getByText('You already applied for this role this year')).toBeOnTheScreen(); expect(screen.getByRole('button', { name: 'Apply for this Job' })).toBeDisabled(); view.unmount(); sqlite.close();
});
