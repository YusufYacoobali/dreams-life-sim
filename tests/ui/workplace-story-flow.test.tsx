import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { encodeWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { decodeSave } from '../../src/persistence/archive';
import { SaveRepository } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { database } from '../support/sqlite';
import { employee } from '../support/employee';
import { ThemeProvider } from '../../src/ui/theme';
import nativeRaise from '../fixtures/v30-native-raise-archive.json';
import nativeTeen from '../fixtures/v29-native-workplace-archive.json';
let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() }, useLocalSearchParams: () => ({}), Redirect: () => null }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import { router } from 'expo-router';
import Life from '../../app/(game)/(tabs)/life';
import Work from '../../app/(game)/work';
import { PendingEvent } from '../../src/ui/PendingEvent';
const frame = (child: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{child}<PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string) => { await act(async () => fireEvent.press(screen.getByRole('button', { name }))); };

test('a paid employee year offers its actual weighted story; its choice rolls back all tables, retries warm and reopens once', async () => {
  const initial = employee(), preview = resolveCommand(initial, { type: 'advance' }); expect(preview.annual?.stage).toBe('complete');
  // Keep the arranged employee helper's original event stream. Its one actual
  // weighted Age Up offers this wellbeing scene, without searching for work credit.
  // Specific shared-credit binding/effects and the genuine archived result retain
  // their separate workplace domain and immutable-archive checks.
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.create(initial);
  // New repository/store over the same in-memory connection: cache reopen,
  // not a process stop or closed-connection cold-resume claim.
  const reload = async (repo = repository) => { mockStore = createGameStore({ repository: async () => repo, date: () => initial.date, id: () => 'unused' }); await mockStore.getState().bootstrap(); };
  await reload(); let view = render(frame(<Life />)); await press('Age Up'); await waitFor(() => expect(screen.getByText('You must make the most of it')).toBeOnTheScreen());
  const offered = mockStore.getState().world!; if (offered.pending?.kind !== 'decision') throw new Error('Missing actual weighted decision'); const event = offered.pending;
  expect(offered).toEqual(preview); expect(event.templateId).toBe('wellbeing-good-day-pressure'); expect(event.personIds).toEqual([offered.activePersonId]); expect(offered.people[offered.activePersonId].employment!.paidMonths).toBe(initial.people[initial.activePersonId].employment!.paidMonths + 12);
  const choice = event.choices.find(item => item.id === 'pace')!, before = encodeWorld(offered), rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])), originalRows = rows(); expect(Object.keys(originalRows)).toHaveLength(8);
  const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); sqlite.exec("CREATE TRIGGER fail_work_story BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  await press(choice.label); await waitFor(() => expect(mockStore.getState().error).toMatch(/couldn't be saved/)); expect(encodeWorld(mockStore.getState().world!)).toBe(before); expect(rows()).toEqual(originalRows);
  sqlite.exec('DROP TRIGGER fail_work_story'); await press(choice.label); await waitFor(() => expect(screen.getByText('A useful day with an ending')).toBeOnTheScreen());
  const result = mockStore.getState().world!; expect(result).toEqual(resolveCommand(offered, { type: 'choose', eventId: event.id, choiceId: 'pace' }, true)); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
  expect(result.accounts).toEqual(offered.accounts); expect(result.ledger).toEqual(offered.ledger); expect(result.workHistory).toEqual(offered.workHistory); expect(result.workplaces).toEqual(offered.workplaces);
  const person = offered.people[offered.activePersonId]; expect(result.relationships).toEqual(offered.relationships); expect(result.people).toEqual({ ...offered.people, [person.id]: { ...person, stats: { ...person.stats, discipline: Math.min(100, person.stats.discipline + 3), stress: Math.max(0, person.stats.stress - 2), energy: Math.max(0, person.stats.energy - 1) } } });
  expect(result.revision).toBe(offered.revision + 1); expect(rows().receipts).toHaveLength(originalRows.receipts.length + 1); expect(sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(offered.id)?.payload).toBe(originalRows.lives.find((row: Record<string, unknown>) => row.id === offered.id)!.payload);
  const resultRows = rows(); view.unmount(); await reload(new SaveRepository(driver)); view = render(frame(<Life />)); expect(mockStore.getState().world).toEqual(result); expect(rows()).toEqual(resultRows); expect(screen.getByText('A useful day with an ending')).toBeOnTheScreen(); await press('Continue');
  const completed = mockStore.getState().world!; expect(completed.pending).toBeNull(); expect(completed.annual).toBeNull(); expect(completed.people).toEqual(result.people); expect(completed.relationships).toEqual(result.relationships); expect(completed.random).toEqual(result.random);
  expect(await repository.load(completed.id)).toEqual(completed); expect(completed.journal.filter(item => item.text === choice.journal)).toHaveLength(1); const completedRows = rows(); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: result.pending!.id })).toBe(false); }); expect(rows()).toEqual(completedRows); expect(mockStore.getState().world).toBe(completed); view.unmount(); sqlite.close();
});

test.each([['adult', nativeRaise, true], ['pupil', nativeTeen, false]] as const)('existing %s part-time native life gives school-leaver guidance only when appropriate', async (_label, archive, shown) => {
  const initial = decodeSave(JSON.stringify(archive)).world, world = resolveCommand(initial, { type: 'acknowledge', resultId: initial.pending!.id });
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.create(world);
  mockStore = createGameStore({ repository: async () => repository, date: () => world.date, id: () => 'unused' }); await mockStore.getState().bootstrap(); const before = encodeWorld(mockStore.getState().world!), view = render(frame(<Work />));
  const guidance = screen.queryByText('This is a part-time role. You can compare full-time options in Find a Job.'); expect(!!guidance).toBe(shown);
  if (shown) { await press('Find a Job. Browse pay and qualification requirements'); expect(router.push).toHaveBeenLastCalledWith('/jobs'); }
  expect(encodeWorld(mockStore.getState().world!)).toBe(before); expect(await repository.load(world.id)).toEqual(world); view.unmount(); sqlite.close();
});
