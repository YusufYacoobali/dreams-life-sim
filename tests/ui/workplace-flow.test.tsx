import { interviewResult } from '../support/interview';
import React from 'react';
import { Keyboard } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { createLife, randomCreation } from '../../src/game/createLife';
import { encodeWorld, fullName, World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { monthFrom } from '../../src/game/calendar';
import { randomInteger } from '../../src/game/random';
import { employmentMonth } from '../../src/game/systems/work';
import { currentWorkplace } from '../../src/game/systems/workplaceSchemas';
import { workplaceMonth } from '../../src/game/systems/workplaces';
import { SaveRepository } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { database } from '../support/sqlite';
import { ThemeProvider } from '../../src/ui/theme';
let mockStore: ReturnType<typeof createGameStore>, mockParams: { id?: string; workplace?: string } = {};
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() }, useLocalSearchParams: () => mockParams, Redirect: () => null }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import { router } from 'expo-router';
import Work from '../../app/(game)/work';
import Coworkers from '../../app/(game)/coworkers';
import Person from '../../app/(game)/person/[id]';
import { PendingEvent } from '../../src/ui/PendingEvent';
const frame = (child: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{child}<PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string) => { await act(async () => fireEvent.press(screen.getByRole('button', { name }))); };
function employee(): World {
  const world = createLife('life_workplace_ui', 42, { ...randomCreation(42), country: 'US', city: 'New York' }, { year: 2000, month: 1, day: 1 }); world.birthAcknowledged = true; world.date.year += 22;
  for (let seed = 1; seed < 100; seed++) { world.random.outcomes = seed; const next = interviewResult(resolveCommand(world, { type: 'apply-job', roleId: 'retail' })); if (next.people[next.activePersonId].employment?.roleId === 'retail') return resolveCommand(next, { type: 'acknowledge', resultId: next.pending!.id }); }
  throw new Error('No accepted employment scenario');
}
beforeEach(() => { mockParams = {}; });

test('Occupation→coworkers browses without a save; introduction failure/retry/cold resume keeps exact people and the next warm commit avoids full decode', async () => {
  const initial = employee(), { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.create(initial);
  const cold = async (repo = repository) => { mockStore = createGameStore({ repository: async () => repo, date: () => initial.date, id: () => 'unused' }); await mockStore.getState().bootstrap(); };
  await cold(); const before = encodeWorld(mockStore.getState().world!), rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])), original = rows();
  let view = render(frame(<Work />)); await press('View Coworkers. Introduce yourself to your team'); expect(router.push).toHaveBeenLastCalledWith({ pathname: '/coworkers', params: { tab: 'activities' } });
  view.rerender(frame(<Coworkers />)); expect(screen.getByRole('button', { name: 'Introduce Yourself' })).toBeOnTheScreen(); expect(encodeWorld(mockStore.getState().world!)).toBe(before); expect(rows()).toEqual(original);
  const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); sqlite.exec("CREATE TRIGGER fail_intro BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  await press('Introduce Yourself'); await waitFor(() => expect(mockStore.getState().error).toMatch(/couldn't be saved/)); expect(encodeWorld(mockStore.getState().world!)).toBe(before); expect(rows()).toEqual(original);
  sqlite.exec('DROP TRIGGER fail_intro'); await press('Introduce Yourself'); await waitFor(() => expect(screen.getByText('Faces to the names')).toBeOnTheScreen());
  const introduced = mockStore.getState().world!; expect(introduced).toEqual(resolveCommand(initial, { type: 'meet-coworkers' }, true)); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
  view.unmount(); await cold(new SaveRepository(driver)); view = render(frame(<Coworkers />)); expect(mockStore.getState().world).toEqual(introduced); await press('Continue');
  const place = currentWorkplace(mockStore.getState().world!)!, supervisorId = place.members.find(item => item.role === 'supervisor')!.personId, boss = mockStore.getState().world!.people[supervisorId], savedRows = rows();
  fireEvent.changeText(screen.getByLabelText('Search coworkers'), '  ' + fullName(boss).toUpperCase() + '  ');
  const dismiss = jest.spyOn(Keyboard, 'dismiss'); await press(fullName(boss) + '. Supervisor'); expect(dismiss).toHaveBeenCalled(); dismiss.mockRestore();
  expect(router.push).toHaveBeenLastCalledWith({ pathname: '/person/[id]', params: { id: supervisorId, tab: 'activities' } }); expect(rows()).toEqual(savedRows);
  mockParams = { id: supervisorId }; view.rerender(frame(<Person />)); expect(screen.getByText('Your Supervisor')).toBeOnTheScreen(); expect(screen.getByText('Complete three paid months in this job first')).toBeOnTheScreen();
  expect(mockStore.getState().world!.people[initial.activePersonId].employment!.paidMonths).toBe(0); view.unmount(); sqlite.close();
});

test('supervisor feedback uses real paid tenure and SQLite rollback/retry/cold result without duplicate effects or pay', async () => {
  let initial = resolveCommand(employee(), { type: 'meet-coworkers' }); initial = resolveCommand(initial, { type: 'acknowledge', resultId: initial.pending!.id });
  for (let n = 0; n < 3; n++) { initial.date = monthFrom(initial.date, 1); workplaceMonth(initial); employmentMonth(initial); }
  const place = currentWorkplace(initial)!, supervisorId = place.members.find(item => item.role === 'supervisor')!.personId;
  initial.random.outcomes = Array.from({ length: 10000 }, (_, i) => i + 1).find(seed => randomInteger(seed, 1, 100).value <= 67)!;
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.create(initial);
  const cold = async () => { const repo = new SaveRepository(driver); mockStore = createGameStore({ repository: async () => repo, date: () => initial.date, id: () => 'unused' }); await mockStore.getState().bootstrap(); };
  await cold(); mockParams = { id: supervisorId }; let view = render(frame(<Person />)); const before = encodeWorld(mockStore.getState().world!);
  sqlite.exec("CREATE TRIGGER fail_feedback BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await press('Ask for Work Feedback. Once a year · Uses 4 energy');
  await waitFor(() => expect(mockStore.getState().error).toMatch(/couldn't be saved/)); expect(encodeWorld(mockStore.getState().world!)).toBe(before); expect(await repository.load(initial.id)).toEqual(initial);
  sqlite.exec('DROP TRIGGER fail_feedback'); await press('Ask for Work Feedback. Once a year · Uses 4 energy'); await waitFor(() => expect(screen.getByText('A clearer target')).toBeOnTheScreen());
  const resolved = mockStore.getState().world!; expect(resolved).toEqual(resolveCommand(initial, { type: 'work-feedback', workplaceId: place.id, supervisorId }, true)); expect(resolved.accounts).toEqual(initial.accounts); expect(resolved.ledger).toEqual(initial.ledger);
  view.unmount(); await cold(); view = render(frame(<Person />)); expect(mockStore.getState().world).toEqual(resolved); expect(screen.getByText('A clearer target')).toBeOnTheScreen(); await press('Continue');
  const final = mockStore.getState().world!; expect(final.people).toEqual(resolved.people); expect(final.random).toEqual(resolved.random); expect(currentWorkplace(final)?.feedback).toHaveLength(1); expect(screen.getByText('You already asked for work feedback this year')).toBeOnTheScreen();
  expect(await repository.load(final.id)).toEqual(final); view.unmount(); sqlite.close();
});

test.each([true, false])('Occupation raise %s rolls back every SQLite row, retries warm and cold-resumes the exact result once', async accepted => {
  let initial = resolveCommand(employee(), { type: 'meet-coworkers' }); initial = resolveCommand(initial, { type: 'acknowledge', resultId: initial.pending!.id });
  for (let n = 0; n < 12; n++) { initial.date = monthFrom(initial.date, 1); workplaceMonth(initial); employmentMonth(initial); }
  initial.people[initial.activePersonId].employment!.performance = 80;
  initial.random.outcomes = Array.from({ length: 1000 }, (_, i) => i + 1).find(seed => (randomInteger(seed, 1, 100).value <= 68) === accepted)!;
  const place = currentWorkplace(initial)!, supervisorId = place.members.find(item => item.role === 'supervisor')!.personId;
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.create(initial);
  const cold = async (repo = repository) => { mockStore = createGameStore({ repository: async () => repo, date: () => initial.date, id: () => 'unused' }); await mockStore.getState().bootstrap(); };
  await cold(); let view = render(frame(<Work />));
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])), originalRows = rows(), before = encodeWorld(mockStore.getState().world!);
  const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); sqlite.exec("CREATE TRIGGER fail_raise BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  await press('Ask for a Raise. 5% higher pay · Uses 6 energy'); await waitFor(() => expect(mockStore.getState().error).toMatch(/couldn't be saved/));
  expect(rows()).toEqual(originalRows); expect(encodeWorld(mockStore.getState().world!)).toBe(before);
  sqlite.exec('DROP TRIGGER fail_raise'); await press('Ask for a Raise. 5% higher pay · Uses 6 energy');
  await waitFor(() => expect(screen.getByText(accepted ? 'Worth the awkward conversation' : 'Not this year')).toBeOnTheScreen());
  const result = mockStore.getState().world!;
  expect(result).toEqual(resolveCommand(initial, { type: 'request-raise', workplaceId: place.id, supervisorId }, true));
  expect(result.workRaises).toHaveLength(1); expect(result.workRaises[0].accepted).toBe(accepted); expect(result.accounts).toEqual(initial.accounts); expect(result.ledger).toEqual(initial.ledger); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
  view.unmount(); await cold(new SaveRepository(driver)); view = render(frame(<Work />)); expect(mockStore.getState().world).toEqual(result); await press('Continue');
  expect(screen.getByText('You already asked for a raise in this job this year')).toBeOnTheScreen(); const final = mockStore.getState().world!, finalRows = rows();
  expect(final.people).toEqual(result.people); expect(final.workRaises).toEqual(result.workRaises); expect(final.random).toEqual(result.random);
  mockParams = { id: supervisorId }; view.rerender(frame(<Person />)); expect(screen.getByText('You already asked for a raise in this job this year')).toBeOnTheScreen(); expect(rows()).toEqual(finalRows);
  view.unmount(); sqlite.close();
});
