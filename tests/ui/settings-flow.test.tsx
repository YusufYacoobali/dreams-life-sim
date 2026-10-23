import React from 'react';
// Keep the real in-memory settings repository; shared portraits need no device database.
jest.mock('../../src/persistence/native', () => ({ openRepository: async () => { throw new Error('Unexpected device database access in UI fixture'); } }));
import * as ReactNative from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useStore } from 'zustand';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { createPreferencesStore } from '../../src/state/preferencesStore';
import { createLife, randomCreation } from '../../src/game/createLife';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { ThemeProvider } from '../../src/ui/theme';
let mockPreferences: ReturnType<typeof createPreferencesStore>;
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('../../src/state/usePreferences', () => ({ usePreferences: (selector: unknown) => require('zustand').useStore(mockPreferences, selector) }));
jest.mock('expo-status-bar', () => ({ StatusBar: ({ style }: { style: string }) => require('react').createElement(require('react-native').Text, { testID: 'page-status-bar' }, style) }));
import Settings from '../../app/settings';
function Frame() { const appearance = useStore(mockPreferences, state => state.settings.appearance); return <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider appearance={appearance}><Settings /></ThemeProvider></SafeAreaProvider>; }
const press = async (name: string) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
test('saved appearance drives actual page colours and status contrast only after a successful write, retries and cold-resumes without touching a life', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise();
  const world = createLife('life_display_ui', 42, randomCreation(42), { year: 2026, month: 10, day: 19 }); await repository.create(world); const archive = await repository.export(world.id);
  const cold = async () => { mockPreferences = createPreferencesStore({ repository: async () => repository }); await mockPreferences.getState().bootstrap(); }; await cold();
  const view = render(<Frame />); expect(screen.getByRole('header', { name: 'Settings' })).toHaveStyle({ color: '#0B1545' }); expect(screen.getByTestId('page-status-bar')).toHaveTextContent('dark');
  sqlite.exec("CREATE TRIGGER fail_display_ui BEFORE INSERT ON preferences WHEN NEW.key='app_settings' BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  await act(async () => { fireEvent.press(screen.getByRole('radio', { name: 'Dark' })); }); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/could not be saved/));
  expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked(); expect(screen.getByRole('header', { name: 'Settings' })).toHaveStyle({ color: '#0B1545' }); expect(await repository.loadAppSettings()).toBeNull();
  sqlite.exec('DROP TRIGGER fail_display_ui'); await press('Try Again'); await waitFor(() => expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked()); expect(screen.getByRole('header', { name: 'Settings' })).toHaveStyle({ color: '#F6F8FF' }); expect(screen.getByTestId('page-status-bar')).toHaveTextContent('light');
  await act(async () => { await cold(); }); view.rerender(<Frame />); expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked(); expect(screen.getByRole('header', { name: 'Settings' })).toHaveStyle({ color: '#F6F8FF' });
  await press('Restore Default Appearance'); await press('Never mind'); expect(mockPreferences.getState().settings.appearance).toBe('dark');
  await press('Restore Default Appearance'); await press('Restore Appearance'); await waitFor(() => expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked());
  await press('Saved Lives. Open, import, export or recover a life'); expect(router.push).toHaveBeenCalledWith('/saved-lives'); expect(await repository.export(world.id)).toBe(archive); expect(await repository.active()).toEqual(world);
  view.unmount(); sqlite.close();
});
test('Use Device Appearance follows the actual colour-scheme hook, including a later device-mode change', async () => {
  const scheme = jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); mockPreferences = createPreferencesStore({ repository: async () => repository }); await mockPreferences.getState().bootstrap();
  const view = render(<Frame />); await act(async () => { fireEvent.press(screen.getByRole('radio', { name: 'Use Device Appearance' })); }); await waitFor(() => expect(screen.getByRole('header', { name: 'Settings' })).toHaveStyle({ color: '#F6F8FF' }));
  scheme.mockReturnValue('light'); view.rerender(<Frame />); expect(screen.getByRole('header', { name: 'Settings' })).toHaveStyle({ color: '#0B1545' }); expect(JSON.parse((await repository.loadAppSettings())!).appearance).toBe('system'); view.unmount(); scheme.mockRestore(); sqlite.close();
});
