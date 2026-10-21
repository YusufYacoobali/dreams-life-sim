import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { decodeSave } from '../../src/persistence/archive';
import { decodeWorld, encodeWorld, World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { ThemeProvider } from '../../src/ui/theme';
import childArchive from '../fixtures/v28-ordinary-hobby-archive.json';
import marriage from '../fixtures/v5-marriage-result.json';
let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() }, Redirect: () => null }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import { router } from 'expo-router';
import Relationships from '../../app/(game)/(tabs)/relationships';
import Family from '../../app/(game)/family';
const frame = (children: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{children}</ThemeProvider></SafeAreaProvider>;
const ack = (world: World) => resolveCommand(world, { type: 'acknowledge', resultId: world.pending!.id }, true);

async function setup(initial: World) {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.create(initial);
  mockStore = createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'unused' }); await mockStore.getState().bootstrap();
  const names = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as { name: string }[];
  const rows = () => names.map(({ name }) => ({ name, rows: sqlite.prepare('SELECT * FROM "' + name + '" ORDER BY rowid').all() }));
  return { sqlite, rows, before: rows(), encoded: encodeWorld(initial) };
}

test('the genuine child can filter actual roles, search duplicate first names and open the same parent without saving', async () => {
  const initial = ack(decodeSave(JSON.stringify(childArchive)).world), { sqlite, rows, before, encoded } = await setup(initial), view = render(frame(<Relationships />));
  fireEvent.changeText(screen.getByLabelText('Search relationships'), '  rUbY  ');
  expect(screen.getAllByRole('button', { name: /^Ruby .*Bond/ })).toHaveLength(2);
  fireEvent.press(screen.getByRole('tab', { name: 'Family' }));
  expect(screen.getByRole('tab', { name: 'Family', selected: true })).toBeOnTheScreen();
  expect(screen.queryByText('Ruby Singh')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: /^Ruby Kelly\./ })); expect(router.push).toHaveBeenLastCalledWith({ pathname: '/person/[id]', params: { id: 'person_parent1' } });
  fireEvent.changeText(screen.getByLabelText('Search relationships'), 'nobody matches'); expect(screen.getByText('No matching names in this view.')).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: 'Show All Connections' }));
  expect(screen.getByLabelText('Search relationships')).toHaveDisplayValue(''); expect(screen.getByRole('tab', { name: 'All', selected: true })).toBeOnTheScreen();
  expect(screen.getByText('Harper Walker')).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('tab', { name: 'Family' })); fireEvent.changeText(screen.getByLabelText('Search relationships'), 'nobody matches');
  fireEvent.press(screen.getByRole('button', { name: 'Clear relationship search' })); expect(screen.getByLabelText('Search relationships')).toHaveDisplayValue('');
  expect(screen.getByText('Ruby Kelly')).toBeOnTheScreen(); expect(screen.getByText('Jack Kelly')).toBeOnTheScreen(); expect(screen.queryByText('Harper Walker')).toBeNull();
  fireEvent.press(screen.getByRole('tab', { name: 'Friends' })); expect(screen.getByText('Your friendships will appear here as you get to know people.')).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('tab', { name: 'Romance' })); expect(screen.getByText('Your current and past partners will appear here.')).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('tab', { name: 'All' })); expect(screen.getByText('Harper Walker')).toBeOnTheScreen();
  expect(screen.queryByRole('image', { name: 'Ruby Kelly' })).toBeNull();
  for (const [name, route] of [['Meet New People', '/meet-people'], ['Household Pets', '/pets'], ['Family & Children', '/family'], ['Family Tree', '/family-tree'], ['My Household', '/household']]) {
    fireEvent.press(screen.getByRole('button', { name })); expect(router.push).toHaveBeenLastCalledWith(route);
  }
  expect(screen.queryByLabelText('Saving')).toBeNull(); expect(encodeWorld(mockStore.getState().world!)).toBe(encoded); expect(rows()).toEqual(before);
  view.unmount(); sqlite.close();
});

test('a real spouse can also be a friend; filters keep overlapping roles and the same persistent identity', async () => {
  let initial = ack(decodeWorld(JSON.stringify(marriage)));
  const spouse = initial.relationships.find(edge => edge.romance === 'married')!, personId = spouse.from === initial.activePersonId ? spouse.to : spouse.from;
  initial = ack(resolveCommand(initial, { type: 'interact', personId, action: 'talk' }, true));
  expect(initial.relationships.find(edge => edge.id === spouse.id)?.roles).toContain('friend');
  const { sqlite, rows, before, encoded } = await setup(initial), view = render(frame(<Relationships />));
  for (const filter of ['Family', 'Friends', 'Romance']) {
    fireEvent.press(screen.getByRole('tab', { name: filter }));
    fireEvent.press(screen.getByRole('button', { name: /^Morgan .*Spouse/ })); expect(router.push).toHaveBeenLastCalledWith({ pathname: '/person/[id]', params: { id: personId } });
  }
  expect(screen.queryByText('Sam Rossi')).toBeNull(); expect(encodeWorld(mockStore.getState().world!)).toBe(encoded); expect(rows()).toEqual(before);
  view.unmount(); sqlite.close();
});

test('childhood Family shows actual family links and the local adult age without presenting adult planning controls', async () => {
  const initial = ack(decodeSave(JSON.stringify(childArchive)).world), { sqlite, rows, before, encoded } = await setup(initial), view = render(frame(<Family />));
  expect(screen.getByRole('button', { name: /^Family Tree\./ })).toBeOnTheScreen(); expect(screen.getByRole('button', { name: 'My Household' })).toBeOnTheScreen();
  expect(screen.getByText(/Family planning is available from age 18/)).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Try for a Child' })).toBeNull(); expect(screen.queryByRole('button', { name: 'Review Adoption' })).toBeNull();
  expect(screen.queryByText('Your children')).toBeNull();
  expect(encodeWorld(mockStore.getState().world!)).toBe(encoded); expect(rows()).toEqual(before);
  view.unmount(); sqlite.close();
});
