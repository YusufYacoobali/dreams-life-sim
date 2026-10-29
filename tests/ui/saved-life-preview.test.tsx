import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { encodeWorld, fullName } from '../../src/game/model';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { ThemeProvider } from '../../src/ui/theme';
import archive from '../fixtures/v28-ordinary-hobby-archive.json';
import prior from '../../docs/verification/android24-opening-20261019/custom-result-save.json';
let mockRepository: SaveRepository, mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({ router: { back: jest.fn(), replace: jest.fn(), push: jest.fn() }, useLocalSearchParams: () => mockParams }));
jest.mock('../../src/persistence/native', () => ({ openRepository: async () => mockRepository }));
import { router } from 'expo-router';
import SavedLife from '../../app/saved-life/[id]';
const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, bottom: 48, left: 0, right: 0 } }}><ThemeProvider><SavedLife /></ThemeProvider></SafeAreaProvider>;

async function setup() {
  const { sqlite, driver } = database(); mockRepository = new SaveRepository(driver); await mockRepository.initialise();
  const other = await mockRepository.import(JSON.stringify(prior)), active = await mockRepository.import(JSON.stringify(archive));
  const store = createGameStore({ repository: async () => mockRepository, date: () => active.date, id: () => 'unused' }); await store.getState().bootstrap();
  const tables = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  mockParams = { id: other.id };
  return { sqlite, active, other, store, tables, before: tables() };
}

test('the older native life opens read-only with local loading feedback and no active-world or SQLite change', async () => {
  const { sqlite, active, other, store, tables, before } = await setup(), current = store.getState().world!, encoded = encodeWorld(current), view = render(frame());
  expect(screen.getByLabelText('Opening saved life')).toBeOnTheScreen(); expect(store.getState().busy).toBe(false);
  await waitFor(() => expect(screen.getByText(fullName(other.people[other.activePersonId]))).toBeOnTheScreen());
  expect(screen.getByText('Saved life · Read-only')).toBeOnTheScreen(); expect(screen.queryByRole('button', { name: /Continue|Age Up|Time Machine/ })).toBeNull();
  expect(store.getState().world).toBe(current); expect(encodeWorld(store.getState().world!)).toBe(encoded); expect(store.getState().world?.id).toBe(active.id); expect(tables()).toEqual(before);
  fireEvent.press(screen.getByRole('button', { name: 'Back' })); expect(router.back).toHaveBeenCalled(); view.unmount(); sqlite.close();
});

test('a late response for an older route cannot replace the newly selected saved-life summary', async () => {
  const { sqlite, active, other, store, tables, before } = await setup();
  let finish!: (world: typeof other) => void;
  const realPreview = mockRepository.previewLife.bind(mockRepository), read = jest.spyOn(mockRepository, 'previewLife').mockImplementationOnce(() => new Promise(resolve => { finish = resolve; })).mockImplementation(realPreview);
  const view = render(frame()); await waitFor(() => expect(read).toHaveBeenCalledWith(other.id));
  mockParams = { id: active.id }; view.rerender(frame()); await waitFor(() => expect(screen.getByText('Riley Kelly')).toBeOnTheScreen());
  await act(async () => { finish(other); }); expect(screen.getByText('Riley Kelly')).toBeOnTheScreen(); expect(screen.queryByText(fullName(other.people[other.activePersonId]))).toBeNull();
  expect(store.getState().world?.id).toBe(active.id); expect(tables()).toEqual(before); read.mockRestore(); view.unmount(); sqlite.close();
});

test('a damaged saved-life preview shows a retryable error and can recover without selecting either life', async () => {
  const { sqlite, active, other, store, tables, before } = await setup();
  sqlite.prepare('UPDATE lives SET revision=revision+1 WHERE id=?').run(other.id);
  const view = render(frame()); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/could not be read/));
  expect(store.getState().world?.id).toBe(active.id); expect(store.getState().error).toBeNull();
  sqlite.prepare('UPDATE lives SET revision=? WHERE id=?').run(other.revision, other.id);
  fireEvent.press(screen.getByRole('button', { name: 'Retry' })); await waitFor(() => expect(screen.getByText(fullName(other.people[other.activePersonId]))).toBeOnTheScreen());
  expect(store.getState().world?.id).toBe(active.id); expect(tables()).toEqual(before); view.unmount(); sqlite.close();
});
