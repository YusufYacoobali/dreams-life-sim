import React from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { createPreferencesStore } from '../../src/state/preferencesStore';
import { reminderStatusStore } from '../../src/state/reminderStatus';
import { createLife, randomCreation } from '../../src/game/createLife';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { ThemeProvider } from '../../src/ui/theme';
import { AppReminders } from '../../src/ui/AppReminders';

let mockPreferences: ReturnType<typeof createPreferencesStore>, mockContinue: () => void;
const mockPermission = jest.fn(), mockReconcile = jest.fn(), mockRemoveResponse = jest.fn();
jest.mock('../../src/state/usePreferences', () => ({ usePreferences: (selector: unknown) => require('zustand').useStore(mockPreferences, selector) }));
jest.mock('../../src/notifications/dailyReminders', () => ({
  requestDailyReminderPermission: () => mockPermission(),
  reconcileDailyReminders: (config: unknown) => mockReconcile(config),
  subscribeToDailyReminderResponses: (onContinue: () => void) => { mockContinue = onContinue; return mockRemoveResponse; },
}));
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn(), navigate: jest.fn() } }));
import Settings from '../../app/settings';

let foreground: (state: AppStateStatus) => void;
const removeForeground = jest.fn();
beforeEach(() => {
  reminderStatusStore.setState({ status: 'idle', message: undefined });
  mockPermission.mockResolvedValue({ status: 'granted', canAskAgain: true });
  mockReconcile.mockImplementation(async (config: { enabled: boolean }) => ({ status: config.enabled ? 'scheduled' : 'off' }));
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => { foreground = listener; return { remove: removeForeground }; });
});
afterEach(() => { jest.restoreAllMocks(); });

async function fixture(raw?: string) {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise();
  const world = createLife('life_reminder_ui', 42, randomCreation(42), { year: 2026, month: 10, day: 22 }); await repository.create(world);
  if (raw) await repository.saveAppSettings(raw);
  mockPreferences = createPreferencesStore({ repository: async () => repository }); await mockPreferences.getState().bootstrap();
  const archive = await repository.export(world.id);
  const view = render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, bottom: 48, left: 0, right: 0 } }}><ThemeProvider><Settings /><AppReminders /></ThemeProvider></SafeAreaProvider>);
  await act(async () => {});
  return { sqlite, repository, archive, world, view };
}
const toggle = async (enabled: boolean) => { await act(async () => { fireEvent(screen.getByRole('switch', { name: 'Daily Reminders' }), 'valueChange', enabled); }); };
const press = async (name: string) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const time = (hour: string, minute: string) => { fireEvent.changeText(screen.getByLabelText('Reminder hour, 24-hour clock'), hour); fireEvent.changeText(screen.getByLabelText('Reminder minute'), minute); };

test('startup never requests permission and an explicitly denied reminder preserves all settings and the actual saved life', async () => {
  const context = await fixture('{"version":1,"appearance":"dark"}');
  try {
    expect(mockPermission).not.toHaveBeenCalled(); expect(screen.getByRole('switch', { name: 'Daily Reminders' })).not.toBeChecked();
    const before = await context.repository.loadAppSettings();
    mockPermission.mockResolvedValue({ status: 'denied', canAskAgain: false }); await toggle(true);
    expect(mockPermission).toHaveBeenCalledTimes(1); expect(screen.getByRole('button', { name: 'Open Notification Settings' })).toBeOnTheScreen();
    expect(screen.getByRole('switch', { name: 'Daily Reminders' })).not.toBeChecked(); expect(await context.repository.loadAppSettings()).toBe(before);
    expect(mockReconcile).not.toHaveBeenCalledWith(expect.objectContaining({ enabled: true })); expect(await context.repository.export(context.world.id)).toBe(context.archive);
  } finally { context.view.unmount(); context.sqlite.close(); }
});

test('an explicit permission grant precedes saving/scheduling, local time is configurable, and switching off does not prompt again', async () => {
  const context = await fixture();
  try {
    let allow!: (value: unknown) => void; mockPermission.mockImplementationOnce(() => new Promise(resolve => { allow = resolve; }));
    await toggle(true); await toggle(true);
    expect(mockPermission).toHaveBeenCalledTimes(1); expect(await context.repository.loadAppSettings()).toBeNull();
    expect(screen.getByRole('switch', { name: 'Daily Reminders' })).toBeDisabled(); expect(mockReconcile).not.toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
    await act(async () => { allow({ status: 'granted', canAskAgain: true }); });
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Daily Reminders' })).toBeChecked());
    expect(mockReconcile).toHaveBeenLastCalledWith({ enabled: true, hour: 19, minute: 0 });
    time('21', '30'); await press('Save Reminder Time');
    await waitFor(() => expect(mockReconcile).toHaveBeenLastCalledWith({ enabled: true, hour: 21, minute: 30 }));
    expect(screen.getByText('Daily at 21:30, in your device’s local time.')).toBeOnTheScreen();
    await toggle(false); await waitFor(() => expect(mockReconcile).toHaveBeenLastCalledWith({ enabled: false, hour: 21, minute: 30 }));
    expect(mockPermission).toHaveBeenCalledTimes(1); expect(await context.repository.export(context.world.id)).toBe(context.archive);
  } finally { context.view.unmount(); context.sqlite.close(); }
});

test('a failed time save retains the draft and old schedule until actual SQLite retry commits both fields', async () => {
  const context = await fixture('{"version":1,"appearance":"light","dailyReminder":true}');
  try {
    const before = await context.repository.loadAppSettings();
    time('24', '00'); await press('Save Reminder Time'); expect(screen.getByRole('alert')).toHaveTextContent(/hour from 00 to 23/);
    expect(await context.repository.loadAppSettings()).toBe(before);
    context.sqlite.exec("CREATE TRIGGER fail_reminder_ui BEFORE INSERT ON preferences WHEN NEW.key='app_settings' BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    time('20', '45'); await press('Save Reminder Time'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/could not be saved/));
    expect(screen.getByDisplayValue('20')).toBeOnTheScreen(); expect(screen.getByDisplayValue('45')).toBeOnTheScreen();
    expect(await context.repository.loadAppSettings()).toBe(before); expect(mockReconcile).toHaveBeenLastCalledWith({ enabled: true, hour: 19, minute: 0 });
    context.sqlite.exec('DROP TRIGGER fail_reminder_ui'); await press('Try Again');
    await waitFor(() => expect(mockReconcile).toHaveBeenLastCalledWith({ enabled: true, hour: 20, minute: 45 }));
    expect(await context.repository.export(context.world.id)).toBe(context.archive);
  } finally { context.view.unmount(); context.sqlite.close(); }
});

test('returning to foreground refreshes reminders and tapping one only opens the ordinary Continue route', async () => {
  const context = await fixture('{"version":1,"appearance":"light","dailyReminder":true,"reminderHour":18}');
  try {
    const before = await context.repository.loadAppSettings(), calls = mockReconcile.mock.calls.length;
    await act(async () => { foreground('background'); }); expect(mockReconcile).toHaveBeenCalledTimes(calls);
    await act(async () => { foreground('active'); mockContinue(); });
    expect(mockReconcile).toHaveBeenLastCalledWith({ enabled: true, hour: 18, minute: 0 }); expect(router.navigate).toHaveBeenCalledWith('/');
    expect(await context.repository.loadAppSettings()).toBe(before); expect(await context.repository.export(context.world.id)).toBe(context.archive);
    context.view.unmount(); expect(removeForeground).toHaveBeenCalledTimes(1); expect(mockRemoveResponse).toHaveBeenCalledTimes(1);
  } finally { context.view.unmount(); context.sqlite.close(); }
});
