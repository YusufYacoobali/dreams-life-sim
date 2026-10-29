import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { encodeWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import * as eventRarity from '../../src/game/content/eventRarity';
import { currentSchool } from '../../src/game/systems/schoolSchemas';
import { relationFor } from '../../src/game/systems/relationships';
import { randomInteger } from '../../src/game/random';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { pupil } from '../support/pupil';
import { ThemeProvider } from '../../src/ui/theme';
let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() }, useLocalSearchParams: () => ({}), Redirect: () => null }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Life from '../../app/(game)/(tabs)/life';
import { PendingEvent } from '../../src/ui/PendingEvent';
const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><Life /><PendingEvent /></ThemeProvider></SafeAreaProvider>;
// A declared UI-unit selector arrangement: the real annual engine still checks
// eligibility, advances months and binds its own people/effects. Preserve its
// one selection draw; only the eligible ticket is arranged, without seed search.
function arrangeEligibleTicket(templateId: string) {
  const select = eventRarity.weightedEvent; let arranged = false;
  return jest.spyOn(eventRarity, 'weightedEvent').mockImplementation((pool, draw) => {
    const index = pool.findIndex(template => template.id === templateId);
    if (arranged || index < 0) return select(pool, draw);
    arranged = true;
    const ticket = pool.slice(0, index).reduce((sum, template) => sum + eventRarity.eventWeight(template), 0);
    return select(pool, total => { draw(total); return ticket; });
  });
}
afterEach(() => { jest.restoreAllMocks(); });

test('Age Up with an arranged eligible ticket offers a named school story; a failed choice saves no grades or teacher bond, retry applies once and cold resume preserves the result', async () => {
  const initial = pupil('US', 7); initial.random.events = 1;
  expect(randomInteger(1, 1, 100).value).toBe(63);
  arrangeEligibleTicket('school-homework-soap');
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.create(initial);
  mockStore = createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'life_unused' }); await mockStore.getState().bootstrap(); const view = render(frame());
  await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Age Up' })));
  await waitFor(() => expect(screen.getByText('The homework needs rinsing')).toBeOnTheScreen());
  const offered = mockStore.getState().world!, expected = encodeWorld(offered), teacherId = currentSchool(offered)!.currentTeacherId, beforeGrade = offered.people[offered.activePersonId].education.grades, beforeBond = relationFor(offered, offered.activePersonId, teacherId)!.strength;
  expect(offered.annual?.stage).toBe('complete');
  expect(offered.pending?.kind === 'decision' && offered.pending.personIds).toContain(teacherId);
  sqlite.exec("CREATE TRIGGER fail_child_story BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Offer to do it again' })));
  await waitFor(() => screen.getAllByRole('alert').forEach(message => expect(message).toHaveTextContent(/couldn't be saved/))); expect(encodeWorld(mockStore.getState().world!)).toBe(expected); expect(await repository.load(offered.id)).toEqual(offered);
  sqlite.exec('DROP TRIGGER fail_child_story'); await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Offer to do it again' })));
  await waitFor(() => expect(screen.getByText('Second attempt')).toBeOnTheScreen()); const result = mockStore.getState().world!;
  expect(result.people[result.activePersonId].education.grades).toBe(Math.min(100, beforeGrade + 2)); expect(relationFor(result, result.activePersonId, teacherId)!.strength).toBe(Math.min(100, beforeBond + 2)); expect(result.random).toEqual(offered.random); expect(currentSchool(result)!.periods).toHaveLength(13);
  expect(await repository.load(result.id)).toEqual(result); view.unmount();
  const coldStore = createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'life_unused' }); mockStore = coldStore; await coldStore.getState().bootstrap(); const coldView = render(frame()); expect(screen.getByText('Second attempt')).toBeOnTheScreen();
  await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Continue' }))); const completed = coldStore.getState().world!; expect(completed.pending).toBeNull(); expect(completed.annual).toBeNull(); expect(completed.people).toEqual(result.people); expect(completed.random).toEqual(result.random); expect(await repository.load(completed.id)).toEqual(completed); coldView.unmount(); sqlite.close();
});
