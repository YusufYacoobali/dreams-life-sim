import React from 'react';
import { FlatList } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createLife, randomCreation } from '../../src/game/createLife';
import { copyWorld, immutableWorld, type World } from '../../src/game/model';
import { ThemeProvider } from '../../src/ui/theme';
import * as components from '../../src/ui/components';

let mockWorld: World;
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: (state: unknown) => unknown) => selector({ world: mockWorld, busy: false, error: null, dispatch: jest.fn() }) }));
import Life from '../../app/(game)/(tabs)/life';

const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><Life /></ThemeProvider></SafeAreaProvider>;
afterEach(() => jest.restoreAllMocks());

test('a different current date leaves historical rows and the list render intact; appending renders only the new fact', () => {
  // Declared read-only UI controls: these dates are not claimed as simulated
  // lives or saved outcomes. Existing connected tests cover durable progression.
  const viewModel = createLife('life_journal_view', 42, randomCreation(42), { year: 2000, month: 10, day: 24 });
  viewModel.date.year += 10; viewModel.birthAcknowledged = true; mockWorld = immutableWorld(viewModel);
  const body = jest.spyOn(components, 'Body'), list = jest.spyOn(FlatList.prototype, 'render');
  jest.spyOn(global, 'requestAnimationFrame').mockReturnValue(1); jest.spyOn(global, 'cancelAnimationFrame').mockImplementation(() => {});
  const view = render(frame());
  const originalRows = screen.UNSAFE_getByType(FlatList).props.data, counts = { body: body.mock.calls.length, list: list.mock.calls.length };
  const next = copyWorld(mockWorld); next.date.year++; mockWorld = immutableWorld(next); view.rerender(frame());
  expect(screen.getByRole('button', { name: /My Life profile\..*Age 11\./ })).toBeOnTheScreen();
  expect(screen.UNSAFE_getByType(FlatList).props.data).toBe(originalRows);
  expect(body).toHaveBeenCalledTimes(counts.body); expect(list).toHaveBeenCalledTimes(counts.list);

  const appended = copyWorld(mockWorld);
  appended.journal.push({ id: 'journal_view_append', personId: appended.activePersonId, date: { ...appended.date }, text: 'A new factual entry at the end.', category: 'life' });
  mockWorld = immutableWorld(appended); view.rerender(frame());
  const rows = screen.UNSAFE_getByType(FlatList).props.data;
  expect(rows).toHaveLength(originalRows.length + 1);
  for (let index = 0; index < originalRows.length; index++) expect(rows[index]).toBe(originalRows[index]);
  expect(body).toHaveBeenCalledTimes(counts.body + 1);
  expect(screen.getByText('A new factual entry at the end.')).toBeOnTheScreen();
  expect(screen.UNSAFE_getByType(FlatList).props.removeClippedSubviews).toBe(false);
  view.unmount();
});
