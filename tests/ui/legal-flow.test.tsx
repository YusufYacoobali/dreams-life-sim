import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { decodeWorld, encodeWorld, World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { accountFor } from '../../src/game/systems/common';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { ThemeProvider } from '../../src/ui/theme';
import fixture from '../fixtures/v3-employed-graduate.json';
let mockStore: ReturnType<typeof createGameStore>, mockCaseId: string;
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() }, useLocalSearchParams: () => ({ id: mockCaseId }) }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import CaseDetail from '../../app/(game)/case/[id]';
import { PendingEvent } from '../../src/ui/PendingEvent';
function awaitingTrial(): World {
  for (let seed = 1; seed < 100; seed++) {
    let world = decodeWorld(JSON.stringify(fixture)); const account = accountFor(world); account.cash += 10000000n; account.openingCash += 10000000n; world.random.outcomes = seed;
    world = resolveCommand(world, { type: 'crime', offence: 'vandalism' });
    if (world.pending?.kind !== 'decision') continue;
    world = resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: 'bail' });
    return resolveCommand(world, { type: 'acknowledge', resultId: world.pending!.id });
  }
  throw new Error('No court fixture seed');
}
test('court preparation and a saved verdict survive SQLite failure, retry and cold load without duplicate fees or sentencing', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise();
  const initial = awaitingTrial(); mockCaseId = initial.cases[0].id; await repository.create(initial);
  mockStore = createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'life_unused' }); await mockStore.getState().bootstrap();
  const view = render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><CaseDetail /><PendingEvent /></ThemeProvider></SafeAreaProvider>);
  expect(encodeWorld(mockStore.getState().world!)).toBe(encodeWorld(initial));
  sqlite.exec("CREATE TRIGGER fail_receipt BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  fireEvent.press(screen.getByRole('button', { name: /Private Counsel\./ })); await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Choose Counsel' })); });
  await waitFor(() => expect(screen.getByText(/couldn't be saved/)).toBeOnTheScreen()); expect(await repository.load(initial.id)).toEqual(initial);
  sqlite.exec('DROP TRIGGER fail_receipt'); fireEvent.press(screen.getByRole('button', { name: /Private Counsel\./ })); await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Choose Counsel' })); });
  await waitFor(() => expect(screen.getByText('Representation recorded')).toBeOnTheScreen());
  expect(accountFor(mockStore.getState().world!).cash).toBe(accountFor(initial).cash - initial.cases[0].counselFee.minor);
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Continue' })); });
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Age Up to Hearing' })); });
  await waitFor(() => expect(screen.getByText('Your day in court')).toBeOnTheScreen()); const hearing = mockStore.getState().world!;
  sqlite.exec("CREATE TRIGGER fail_verdict BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Plead guilty' })); });
  await waitFor(() => expect(screen.getAllByText(/couldn't be saved/).length).toBeGreaterThan(0)); expect(await repository.load(initial.id)).toEqual(hearing); expect(mockStore.getState().world!.sentences).toHaveLength(0);
  sqlite.exec('DROP TRIGGER fail_verdict'); await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Plead guilty' })); });
  await waitFor(() => expect(screen.getByText('The court has decided')).toBeOnTheScreen()); expect(mockStore.getState().world!.sentences).toHaveLength(1);
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Continue' })); });
  const cold = await repository.load(initial.id); expect(cold.cases[0].status).toBe('convicted'); expect(cold.cases[0].bailState).toBe('returned'); expect(cold.annual?.pausedForPlanning).toBe(true); expect(cold.people[cold.activePersonId].employment).toBeNull(); expect(cold.sentences).toHaveLength(1); expect(cold.ledger.filter(item => item.category === 'legal-fee')).toHaveLength(1);
  view.unmount(); sqlite.close();
});
