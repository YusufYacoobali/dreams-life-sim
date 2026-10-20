import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { encodeWorld, fullName } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { randomInteger } from '../../src/game/random';
import { eligibleTemplates } from '../../src/game/content/events';
import { relationFor } from '../../src/game/systems/relationships';
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

test('Age Up binds actual work contacts; a failed shared-credit choice rolls back all tables, retries warm and cold-resumes once', async () => {
  const initial = employee(), preview = resolveCommand(initial, { type: 'advance' }); expect(preview.annual?.stage).toBe('complete');
  const eligible = eligibleTemplates({ ...preview, eventHistory: initial.eventHistory }), index = eligible.findIndex(item => item.id === 'work-shared-credit'); expect(index).toBeGreaterThanOrEqual(0);
  // Deterministic domain input; Age Up itself selects/binds the scene and pays the year.
  for (let seed = 1; seed < 10000; seed++) { const chance = randomInteger(seed, 1, 100), pick = randomInteger(chance.state, 0, eligible.length - 1); if (chance.value <= 78 && pick.value === index) { initial.random.events = seed; break; } }
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.create(initial);
  const cold = async (repo = repository) => { mockStore = createGameStore({ repository: async () => repo, date: () => initial.date, id: () => 'unused' }); await mockStore.getState().bootstrap(); };
  await cold(); let view = render(frame(<Life />)); await press('Age Up'); await waitFor(() => expect(screen.getByText('There were two of us')).toBeOnTheScreen());
  const offered = mockStore.getState().world!; if (offered.pending?.kind !== 'decision') throw new Error('Missing workplace decision'); const event = offered.pending, coworkerId = event.personIds[1], supervisorId = event.personIds[2];
  expect(event.body).toContain(fullName(offered.people[coworkerId])); expect(event.body).toContain(fullName(offered.people[supervisorId]));
  const choice = event.choices.find(item => item.id === 'name')!, before = encodeWorld(offered), rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])), originalRows = rows();
  const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); sqlite.exec("CREATE TRIGGER fail_work_story BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  await press(choice.label); await waitFor(() => expect(mockStore.getState().error).toMatch(/couldn't be saved/)); expect(encodeWorld(mockStore.getState().world!)).toBe(before); expect(rows()).toEqual(originalRows);
  sqlite.exec('DROP TRIGGER fail_work_story'); await press(choice.label); await waitFor(() => expect(screen.getByText('The complete version')).toBeOnTheScreen());
  const result = mockStore.getState().world!; expect(result).toEqual(resolveCommand(offered, { type: 'choose', eventId: event.id, choiceId: 'name' }, true)); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
  expect(result.accounts).toEqual(offered.accounts); expect(result.ledger).toEqual(offered.ledger); expect(result.workHistory).toEqual(offered.workHistory); expect(result.workplaces).toEqual(offered.workplaces);
  expect(relationFor(result, offered.activePersonId, coworkerId)!.strength).toBe(Math.min(100, relationFor(offered, offered.activePersonId, coworkerId)!.strength + 5));
  expect(relationFor(result, offered.activePersonId, supervisorId)!.strength).toBe(Math.min(100, relationFor(offered, offered.activePersonId, supervisorId)!.strength + 2));
  view.unmount(); await cold(new SaveRepository(driver)); view = render(frame(<Life />)); expect(mockStore.getState().world).toEqual(result); expect(screen.getByText('The complete version')).toBeOnTheScreen(); await press('Continue');
  const completed = mockStore.getState().world!; expect(completed.pending).toBeNull(); expect(completed.annual).toBeNull(); expect(completed.people).toEqual(result.people); expect(completed.relationships).toEqual(result.relationships); expect(completed.random).toEqual(result.random);
  expect(await repository.load(completed.id)).toEqual(completed); expect(completed.journal.filter(item => item.text === choice.journal)).toHaveLength(1); view.unmount(); sqlite.close();
});

test.each([['adult', nativeRaise, true], ['pupil', nativeTeen, false]] as const)('existing %s part-time native life gives school-leaver guidance only when appropriate', async (_label, archive, shown) => {
  const initial = decodeSave(JSON.stringify(archive)).world, world = resolveCommand(initial, { type: 'acknowledge', resultId: initial.pending!.id });
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.create(world);
  mockStore = createGameStore({ repository: async () => repository, date: () => world.date, id: () => 'unused' }); await mockStore.getState().bootstrap(); const before = encodeWorld(mockStore.getState().world!), view = render(frame(<Work />));
  const guidance = screen.queryByText('This is a part-time role. You can compare full-time options in Find a Job.'); expect(!!guidance).toBe(shown);
  if (shown) { await press('Find a Job. Browse pay and qualification requirements'); expect(router.push).toHaveBeenLastCalledWith('/jobs'); }
  expect(encodeWorld(mockStore.getState().world!)).toBe(before); expect(await repository.load(world.id)).toEqual(world); view.unmount(); sqlite.close();
});
