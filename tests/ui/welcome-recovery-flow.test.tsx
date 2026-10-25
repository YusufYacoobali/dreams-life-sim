import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { encodeWorld } from '../../src/game/model';
import { decodeSave } from '../../src/persistence/archive';
import { SaveRepository } from '../../src/persistence/repository';
import { ThemeProvider } from '../../src/ui/theme';
import { database } from '../support/sqlite';
import archive from '../fixtures/v28-ordinary-hobby-archive.json';

let mockStore: ReturnType<typeof createGameStore>, mockRepository: SaveRepository;
const mockPickFile = jest.fn();
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector), freshSeed: () => 42 }));
jest.mock('../../src/persistence/native', () => ({ openRepository: async () => mockRepository }));
jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));
jest.mock('expo-file-system', () => ({ File: { pickFileAsync: (...args: unknown[]) => mockPickFile(...args) }, Directory: { pickDirectoryAsync: jest.fn() }, Paths: { cache: 'file:///cache' } }));
import { router } from 'expo-router';
import Welcome from '../../app/index';
import SavedLives from '../../app/saved-lives';

const frame = (children: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 320, height: 568 }, insets: { top: 24, bottom: 24, left: 0, right: 0 } }}><ThemeProvider>{children}</ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
async function setup() {
  const context = database(); mockRepository = new SaveRepository(context.driver); await mockRepository.initialise();
  mockStore = createGameStore({ repository: async () => mockRepository, date: () => ({ year: 2026, month: 10, day: 25 }), id: () => 'unexpected_new_life' });
  const tables = () => Object.fromEntries(context.sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, context.sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  return { ...context, tables };
}
beforeEach(() => { jest.clearAllMocks(); });

test('a corrupt active save can reach Saved Lives from startup and explicitly recover its genuine checkpoint', async () => {
  const { sqlite, driver, tables } = await setup();
  try {
    const original = await mockRepository.import(JSON.stringify(archive)), encoded = encodeWorld(original);
    sqlite.prepare('UPDATE lives SET payload=? WHERE id=?').run('damaged checkpoint', original.id);
    const damaged = tables(), view = render(frame(<Welcome />));
    await act(async () => { expect(await mockStore.getState().bootstrap()).toBe(false); });
    expect(mockStore.getState()).toMatchObject({ ready: true, world: null, busy: false });
    expect(screen.getByRole('alert')).toHaveTextContent(/This life could not be read/);
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeEnabled();
    await press('Saved Lives'); expect(router.push).toHaveBeenLastCalledWith('/saved-lives');
    expect(tables()).toEqual(damaged);
    view.rerender(frame(<SavedLives />));
    await press(/^Previous checkpoint\./);
    await waitFor(() => expect(screen.getByText('Restore previous checkpoint?')).toBeOnTheScreen());
    expect(tables()).toEqual(damaged); expect(mockStore.getState().world).toBeNull();
    await press('Restore Checkpoint');
    await waitFor(() => expect(mockStore.getState().world?.id).toBe(original.id));
    expect(router.replace).toHaveBeenLastCalledWith('/life');
    expect(encodeWorld(mockStore.getState().world!)).toBe(encoded);
    expect(encodeWorld((await mockRepository.active())!)).toBe(encoded);
    expect(await mockRepository.list()).toHaveLength(1);
    // Reopen the same persisted database rather than relying on the active cache.
    const loaded = new SaveRepository(driver);
    expect(encodeWorld((await loaded.active())!)).toBe(encoded);
    view.unmount();
  } finally { sqlite.close(); }
});

test('a fresh install opens the existing import flow without creating a disposable life', async () => {
  const { sqlite, tables } = await setup();
  try {
    const text = JSON.stringify(archive), expected = decodeSave(text).world;
    mockPickFile.mockResolvedValueOnce({ canceled: false, result: { size: text.length, text: async () => text } });
    await mockStore.getState().bootstrap();
    const before = tables(), view = render(frame(<Welcome />));
    await press('Saved Lives'); expect(router.push).toHaveBeenLastCalledWith('/saved-lives'); expect(tables()).toEqual(before);
    view.rerender(frame(<SavedLives />));
    expect(screen.getByText('No lives saved yet.')).toBeOnTheScreen();
    await press('Import a Save'); await waitFor(() => expect(screen.getByText('Import this life?')).toBeOnTheScreen());
    expect(tables()).toEqual(before); expect(mockStore.getState().world).toBeNull();
    await press('Import Life');
    await waitFor(() => expect(mockStore.getState().world?.id).toBe(expected.id));
    expect(router.replace).toHaveBeenLastCalledWith('/life');
    expect(encodeWorld(mockStore.getState().world!)).toBe(encodeWorld(expected)); expect(await mockRepository.list()).toHaveLength(1);
    expect((await mockRepository.list())[0].id).not.toBe('unexpected_new_life');
    view.unmount();
  } finally { sqlite.close(); }
});
