import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { lifeStoryWorld } from '../support/lifeStory';
import { bindEvent } from '../../src/game/content/events';
import { everydayLifeTemplates } from '../../src/game/content/everydayLifeStories';
import { offerPending } from '../../src/game/pendingQueue';
import { ageOn, encodeWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { SaveRepository } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { database } from '../support/sqlite';
import { ThemeProvider } from '../../src/ui/theme';
let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Life from '../../app/(game)/(tabs)/life';
import { PendingEvent } from '../../src/ui/PendingEvent';
const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><Life /><PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (label: string) => { await act(async () => fireEvent.press(screen.getByRole('button', { name: label }))); };

function pending(id: string, child = false): World {
  const world = lifeStoryWorld();
  if (child) world.activePersonId = Object.values(world.people).find(person => ageOn(person, world.date) >= 3 && ageOn(person, world.date) <= 11)!.id;
  offerPending(world, bindEvent(world, everydayLifeTemplates.find(t => t.id === id)!)); return world;
}

test.each([
  ['pet-familiar-presence', 'company', true],
  ['pet-familiar-presence', 'distracted', false],
  ['family-bedtime-detour', 'invent', false],
] as const)('%s/%s persists exact named effects through SQLite rollback, warm retry, cold result and a single acknowledgement', async (id, choiceId, asChild) => {
  const initial = pending(id, asChild); if (initial.pending?.kind !== 'decision') throw new Error('Missing bound scene'); const event = initial.pending, choice = event.choices.find(c => c.id === choiceId)!;
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.create(initial);
  const cold = async () => { const repo = new SaveRepository(driver); mockStore = createGameStore({ repository: async () => repo, date: () => initial.date, id: () => 'unused' }); await mockStore.getState().bootstrap(); };
  await cold(); let view = render(frame()); expect(screen.getByText(event.title)).toBeOnTheScreen();
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(r => [r.name, sqlite.prepare('SELECT * FROM '+r.name+' ORDER BY 1,2').all()])), beforeRows = rows(), before = encodeWorld(mockStore.getState().world!);
  const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); sqlite.exec("CREATE TRIGGER fail_life_context BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await press(choice.label); await waitFor(() => expect(mockStore.getState().error).toMatch(/couldn't be saved/)); expect(rows()).toEqual(beforeRows); expect(encodeWorld(mockStore.getState().world!)).toBe(before);
  sqlite.exec('DROP TRIGGER fail_life_context'); await press(choice.label); await waitFor(() => expect(screen.getByText(choice.resultTitle)).toBeOnTheScreen());
  const result = mockStore.getState().world!, expected = resolveCommand(initial, { type: 'choose', eventId: event.id, choiceId }, true); expect(result).toEqual(expected); expect(result.accounts).toEqual(initial.accounts); expect(result.ledger).toEqual(initial.ledger); expect(result.hobbies).toEqual(initial.hobbies); expect(result.workHistory).toEqual(initial.workHistory); expect(result.random).toEqual(initial.random); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
  if (asChild) { expect(result.pets[0].bonds[initial.activePersonId]).toBe(4); expect(result.pets[0].ownerId).not.toBe(initial.activePersonId); }
  const resultRows = rows(); view.unmount(); await cold(); view = render(frame()); expect(rows()).toEqual(resultRows); expect(mockStore.getState().world).toEqual(result); expect(screen.getByText(choice.resultTitle)).toBeOnTheScreen(); await press('Continue');
  const done = mockStore.getState().world!; expect(done.people).toEqual(result.people); expect(done.pets).toEqual(result.pets); expect(done.relationships).toEqual(result.relationships); expect(done.random).toEqual(result.random); expect(done.revision).toBe(initial.revision + 2);
  const finalRows = rows(); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'choose', eventId: event.id, choiceId })).toBe(false); }); expect(rows()).toEqual(finalRows); view.unmount(); sqlite.close();
});
