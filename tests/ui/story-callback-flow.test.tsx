import { displayText } from '../../src/ui/displayNumbers';
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { encodeWorld } from '../../src/game/model';
import { monthFrom } from '../../src/game/calendar';
import { bindEvent, eventTemplates } from '../../src/game/content/events';
import { resolveCommand } from '../../src/game/engine';
import { offerPending } from '../../src/game/pendingQueue';
import { randomInteger } from '../../src/game/random';
import { storyParent } from '../../src/game/systems/storyContext';
import { accountFor } from '../../src/game/systems/common';
import { addCondition } from '../../src/game/systems/health';
import { schoolMonth } from '../../src/game/systems/school';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
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
test('permission and actual Age Up→party→remaining year survive independent SQLite failures and cold resumes without extra draws or payments', async () => {
  const initial = pupil('US', 8), parentEdge = storyParent(initial)!, chance = Math.min(95, 50 + Math.floor(parentEdge.trust / 2));
  for (let seed = 1; seed < 10000; seed++) if (randomInteger(seed, 1, 100).value <= chance) { initial.random.npcs = seed; break; }
  const event = bindEvent(initial, eventTemplates.find(item => item.id === 'school-arcade-invitation')!); offerPending(initial, event);
  const expected = resolveCommand(initial, { type: 'choose', eventId: event.id, choiceId: 'ask' }), { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.create(initial);
  const cold = async () => { mockStore = createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'life_unused' }); await mockStore.getState().bootstrap(); };
  await cold(); let view = render(frame()); const parentName = initial.people[parentEdge.from].firstName, ask = 'Ask ' + parentName + ' for permission';
  sqlite.exec("CREATE TRIGGER fail_story_origin BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  await act(async () => fireEvent.press(screen.getByRole('button', { name: ask }))); await waitFor(() => expect(screen.getAllByRole('alert').length).toBeGreaterThan(0));
  expect(encodeWorld(mockStore.getState().world!)).toBe(encodeWorld(initial)); expect(await repository.load(initial.id)).toEqual(initial);
  sqlite.exec('DROP TRIGGER fail_story_origin'); await act(async () => fireEvent.press(screen.getByRole('button', { name: ask })));
  await waitFor(() => expect(mockStore.getState().world?.storyThreads[0]?.status).toBe('scheduled')); expect(mockStore.getState().world).toEqual(expected); expect(expected.storyThreads[0].permission?.accepted).toBe(true); expect(expected.ledger.filter(item => item.category === 'story-outing')).toEqual([]);
  view.unmount(); await cold(); view = render(frame()); expect(screen.getByText('Adults need an address')).toBeOnTheScreen(); expect(mockStore.getState().world).toEqual(expected);
  await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Continue' }))); await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Age Up' })));
  await waitFor(() => expect(screen.getByText('Party day')).toBeOnTheScreen()); const offered = mockStore.getState().world!, pending = offered.pending; if (pending?.kind !== 'decision') throw new Error('No party choice');
  expect(offered.annual?.monthsProcessed).toBe(1); expect(offered.storyThreads[0].peerId).toBe(expected.storyThreads[0].peerId); const attend = pending.choices.find(item => item.id === 'attend')!.label, cash = accountFor(offered, offered.people[parentEdge.from]).cash;
  sqlite.exec("CREATE TRIGGER fail_story_payment BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await act(async () => fireEvent.press(screen.getByRole('button', { name: displayText(attend) })));
  await waitFor(() => expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)); expect(mockStore.getState().world).toEqual(offered); expect(await repository.load(initial.id)).toEqual(offered);
  sqlite.exec('DROP TRIGGER fail_story_payment'); await act(async () => fireEvent.press(screen.getByRole('button', { name: displayText(attend) })));
  await waitFor(() => expect(screen.getByText('High score, low dignity')).toBeOnTheScreen()); const paid = mockStore.getState().world!;
  expect(accountFor(paid, paid.people[parentEdge.from]).cash).toBe(cash - paid.storyThreads[0].quote.amount); expect(paid.random).toEqual(offered.random); expect(paid.storyThreads[0].permission).toEqual(expected.storyThreads[0].permission); expect(paid.ledger.filter(item => item.category === 'story-outing')).toHaveLength(1);
  view.unmount(); await cold(); view = render(frame()); expect(screen.getByText('High score, low dignity')).toBeOnTheScreen(); expect(mockStore.getState().world).toEqual(paid);
  for (let i = 0; i < 20 && mockStore.getState().world!.pending; i++) {
    const world = mockStore.getState().world!, current = world.pending!;
    const label = current.kind === 'result' ? 'Continue' : current.choices.find(item => !choiceUnavailable(world, item))!.label;
    await act(async () => fireEvent.press(screen.getByRole('button', { name: label })));
  }
  const completed = mockStore.getState().world!; expect(completed.pending).toBeNull(); expect(completed.annual).toBeNull(); expect(completed.date.year).toBe(initial.date.year + 1); expect(completed.date.month).toBe(initial.date.month);
  expect(completed.ledger.filter(item => item.category === 'story-outing')).toHaveLength(1); expect(completed.storyThreads[0].paidTransactionId).toBe(paid.storyThreads[0].paidTransactionId); expect(await repository.load(initial.id)).toEqual(completed); view.unmount(); sqlite.close();
}, 30000);

test('month-twelve critical admission cancels both saved callbacks atomically across SQLite failure, retry and cold resume', async () => {
  let initial = pupil('US', 8);
  const project = bindEvent(initial, eventTemplates.find(item => item.id === 'school-project-promise')!); offerPending(initial, project);
  initial = resolveCommand(initial, { type: 'choose', eventId: project.id, choiceId: 'promise' });
  if (initial.pending?.kind !== 'result') throw new Error('Missing origin result');
  initial = resolveCommand(initial, { type: 'acknowledge', resultId: initial.pending.id });
  initial.date = monthFrom(initial.date, 1); schoolMonth(initial);
  const parent = storyParent(initial)!, chance = Math.min(95, 50 + Math.floor(parent.trust / 2));
  initial.random.npcs = Array.from({ length: 1000 }, (_, i) => i + 1).find(seed => randomInteger(seed, 1, 100).value <= chance)!;
  const arcade = bindEvent(initial, eventTemplates.find(item => item.id === 'school-arcade-invitation')!); offerPending(initial, arcade);
  initial = resolveCommand(initial, { type: 'choose', eventId: arcade.id, choiceId: 'ask' });
  if (initial.pending?.kind !== 'result') throw new Error('Missing permission result');
  initial = resolveCommand(initial, { type: 'acknowledge', resultId: initial.pending.id });
  // Critical untreated asthma now causes admission during the actual monthly
  // simulation. Severity 75 offers symptoms, not an annual hospital decision.
  addCondition(initial, initial.people[initial.activePersonId], 'asthma', 95);
  const startDate = monthFrom(initial.date, -11);
  initial.annual = { id: 'year_twelve_storage', startDate, targetDate: monthFrom(startDate, 12), monthsProcessed: 11, stage: 'months', pausedForPlanning: true };
  const targetDate = { ...initial.annual.targetDate }, expected = resolveCommand(initial, { type: 'resume' }, true);
  expect(initial.storyThreads.map(item => item.status)).toEqual(['scheduled', 'scheduled']);
  expect(initial.pending).toBeNull(); expect(initial.deferred).toEqual([]);
  expect(expected.pending).toMatchObject({ kind: 'result', title: 'Rushed to Hospital' });
  expect(expected.annual?.monthsProcessed).toBe(12);
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.create(initial);
  const cold = async () => { mockStore = createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'life_unused' }); await mockStore.getState().bootstrap(); };
  await cold(); let view = render(frame());
  sqlite.exec("CREATE TRIGGER fail_callback_cancellation BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Continue This Year' })));
  await waitFor(() => expect(screen.getAllByRole('alert').length).toBeGreaterThan(0));
  expect(mockStore.getState().world).toEqual(initial); expect(await repository.load(initial.id)).toEqual(initial);
  sqlite.exec('DROP TRIGGER fail_callback_cancellation');
  await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Continue This Year' })));
  await waitFor(() => expect(screen.getByText('Rushed to Hospital')).toBeOnTheScreen());
  const cancelled = mockStore.getState().world!;
  expect(cancelled).toEqual(expected); expect(await repository.load(initial.id)).toEqual(expected);
  expect(cancelled.storyThreads.map(item => item.status)).toEqual(['cancelled', 'cancelled']); expect(cancelled.deferred).toEqual([]);
  expect(cancelled.ledger.some(item => item.category === 'story-outing')).toBe(false); expect(cancelled.annual?.monthsProcessed).toBe(12);
  view.unmount(); await cold(); view = render(frame()); expect(mockStore.getState().world).toEqual(cancelled);
  expect(screen.getByText('Rushed to Hospital')).toBeOnTheScreen();
  for (let guard = 0; mockStore.getState().world!.pending && guard < 10; guard++) {
    const world = mockStore.getState().world!, event = world.pending!;
    await act(async () => fireEvent.press(screen.getByRole('button', { name: event.kind === 'result' ? 'Continue' : event.choices.find(item => !choiceUnavailable(world, item))!.label })));
  }
  const completed = mockStore.getState().world!;
  expect(completed.annual).toBeNull(); expect(completed.date).toEqual(targetDate);
  expect(completed.storyThreads).toEqual(cancelled.storyThreads);
  expect(completed.ledger.slice(0, cancelled.ledger.length)).toEqual(cancelled.ledger);
  expect(completed.people[completed.activePersonId].health.records).toEqual(cancelled.people[cancelled.activePersonId].health.records);
  expect(completed.ledger.some(item => item.category === 'story-outing')).toBe(false);
  expect(await repository.load(initial.id)).toEqual(completed); view.unmount(); sqlite.close();
}, 30000);
