import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { eligibleTemplates } from '../../src/game/content/events';
import { resolveCommand } from '../../src/game/engine';
import { encodeWorld, fullName } from '../../src/game/model';
import { randomInteger } from '../../src/game/random';
import { currentSchool } from '../../src/game/systems/schoolSchemas';
import { relationFor } from '../../src/game/systems/relationships';
import { SaveRepository } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { database } from '../support/sqlite';
import { pupil } from '../support/pupil';
import { ThemeProvider } from '../../src/ui/theme';
let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Life from '../../app/(game)/(tabs)/life';
import { PendingEvent } from '../../src/ui/PendingEvent';
const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><Life /><PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (label: string) => { await act(async () => fireEvent.press(screen.getByRole('button', { name: label }))); };

test('a real Age Up shows both named school consequences after durable retry, retains them cold and applies neither bond twice', async () => {
  const initial = pupil('US', 7), preview = resolveCommand(initial, { type: 'advance' });
  expect(preview.annual?.stage).toBe('complete');
  const eligible = eligibleTemplates({ ...preview, eventHistory: initial.eventHistory }), target = eligible.findIndex(template => template.id === 'school-volcano-breach');
  expect(target).toBeGreaterThanOrEqual(0);
  // Controlled event-stream setup; normal Age Up still selects and binds all people/effects.
  let found = false;
  for (let seed = 1; seed < 10000; seed++) {
    const offer = randomInteger(seed, 1, 100), pick = randomInteger(offer.state, 0, eligible.length - 1);
    if (offer.value <= 78 && pick.value === target) { initial.random.events = seed; found = true; break; }
  }
  expect(found).toBe(true);
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.create(initial);
  const cold = async () => { const repo = new SaveRepository(driver); mockStore = createGameStore({ repository: async () => repo, date: () => initial.date, id: () => 'unused' }); await mockStore.getState().bootstrap(); };
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  let view: ReturnType<typeof render> | undefined;
  try {
    await cold(); view = render(frame()); await press('Age Up');
    await waitFor(() => expect(screen.getByText('The volcano has escaped')).toBeOnTheScreen());
    const offered = mockStore.getState().world!, school = currentSchool(offered)!, peer = offered.people[school.classmateIds[0]], teacher = offered.people[school.currentTeacherId];
    if (offered.pending?.kind !== 'decision') throw new Error('Expected the actual annual school decision');
    expect(offered.pending.personIds).toEqual([offered.activePersonId, peer.id, teacher.id]);
    const command = { type: 'choose' as const, eventId: offered.pending.id, choiceId: 'clean' }, before = rows(), original = encodeWorld(offered);
    const peerBefore = relationFor(offered, offered.activePersonId, peer.id)!.strength, teacherBefore = relationFor(offered, offered.activePersonId, teacher.id)!.strength;
    const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    sqlite.exec("CREATE TRIGGER fail_named_consequences BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press('Help clean the desk'); await waitFor(() => expect(mockStore.getState().error).toMatch(/couldn't be saved/));
    expect(rows()).toEqual(before); expect(encodeWorld(mockStore.getState().world!)).toBe(original);
    sqlite.exec('DROP TRIGGER fail_named_consequences'); await press('Help clean the desk');
    await waitFor(() => expect(screen.getByText(fullName(peer) + ' · relationship')).toBeOnTheScreen());
    expect(screen.getByText(fullName(teacher) + ' · relationship')).toBeOnTheScreen(); expect(screen.queryAllByText('Relationship')).toHaveLength(0);
    const result = mockStore.getState().world!; expect(result).toEqual(resolveCommand(offered, command, true));
    expect(relationFor(result, offered.activePersonId, peer.id)?.strength).toBe(Math.min(100, peerBefore + 3)); expect(relationFor(result, offered.activePersonId, teacher.id)?.strength).toBe(Math.min(100, teacherBefore + 2));
    expect(result.random).toEqual(offered.random); expect(result.accounts).toEqual(offered.accounts); expect(result.ledger).toEqual(offered.ledger); expect(Object.keys(result.people)).toEqual(Object.keys(offered.people)); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    const saved = rows(); view.unmount(); view = undefined; await cold(); view = render(frame());
    expect(rows()).toEqual(saved); expect(mockStore.getState().world).toEqual(result);
    expect(screen.getByText(fullName(peer) + ' · relationship')).toBeOnTheScreen(); expect(screen.getByText(fullName(teacher) + ' · relationship')).toBeOnTheScreen();
    await press('Continue'); const done = mockStore.getState().world!;
    expect(done.annual).toBeNull(); expect(done.pending).toBeNull(); expect(done.relationships).toEqual(result.relationships); expect(done.people).toEqual(result.people); expect(done.random).toEqual(result.random);
    const acknowledged = rows(); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: result.pending!.id })).toBe(false); }); expect(rows()).toEqual(acknowledged);
  } finally { jest.restoreAllMocks(); view?.unmount(); sqlite.close(); }
});
