import React from 'react';
import { createStore, type StoreApi } from 'zustand/vanilla';
// Keep the real in-memory settings repository; shared portraits need no device database.
jest.mock('../../src/persistence/native', () => ({ openRepository: async () => { throw new Error('Unexpected device database access in UI fixture'); } }));
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

let mockPreferences: ReturnType<typeof createPreferencesStore>, mockContinue: () => void, mockBegunLife = false;
let mockLife: StoreApi<{ world: { birthAcknowledged: boolean } | null }>;
const mockGetPermission = jest.fn(), mockPermission = jest.fn(), mockReconcile = jest.fn(), mockRemoveResponse = jest.fn();
jest.mock('../../src/state/usePreferences', () => ({ usePreferences: (selector: unknown) => require('zustand').useStore(mockPreferences, selector), preferencesStore: { getState: () => mockPreferences.getState() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockLife, selector) }));
jest.mock('../../src/notifications/dailyReminders', () => ({
  getDailyReminderPermission: () => mockGetPermission(),
  requestDailyReminderPermission: () => mockPermission(),
  reconcileDailyReminders: (config: unknown) => mockReconcile(config),
  subscribeToDailyReminderResponses: (onContinue: () => void) => { mockContinue = onContinue; return mockRemoveResponse; },
}));
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn(), navigate: jest.fn() } }));
import Settings from '../../app/settings';

let foreground: (state: AppStateStatus) => void, previousAppState: AppStateStatus;
const removeForeground = jest.fn();
beforeEach(() => {
  mockBegunLife = false; previousAppState = AppState.currentState; AppState.currentState = 'active';
  mockGetPermission.mockResolvedValue({ status: 'granted', canAskAgain: true });
  reminderStatusStore.setState({ status: 'idle', message: undefined });
  mockPermission.mockResolvedValue({ status: 'granted', canAskAgain: true });
  mockReconcile.mockImplementation(async (config: { enabled: boolean }) => ({ status: config.enabled ? 'scheduled' : 'off' }));
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => { foreground = listener; return { remove: removeForeground }; });
});
afterEach(() => { AppState.currentState = previousAppState; jest.restoreAllMocks(); });

async function fixture(raw?: string) {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise();
  const world = createLife('life_reminder_ui', 42, randomCreation(42), { year: 2026, month: 10, day: 22 }); await repository.create(world);
  if (raw) await repository.saveAppSettings(raw);
  mockLife = createStore<{ world: { birthAcknowledged: boolean } | null }>(() => ({ world: mockBegunLife ? { birthAcknowledged: true } : null }));
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
  const context = await fixture('{"version":1,"appearance":"light"}');
  try {
    let allow!: (value: unknown) => void; mockPermission.mockImplementationOnce(() => new Promise(resolve => { allow = resolve; }));
    await toggle(true); await toggle(true);
    expect(mockPermission).toHaveBeenCalledTimes(1); expect(await context.repository.loadAppSettings()).toBe('{"version":1,"appearance":"light"}');
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


test('fresh reminders are on but permission is requested only once after a life begins', async () => {
  mockGetPermission.mockResolvedValue({ status: 'undetermined', canAskAgain: true });
  const context = await fixture();
  try {
    expect(screen.getByRole('switch', { name: 'Daily Reminders' })).toBeChecked();
    expect(mockGetPermission).not.toHaveBeenCalled(); expect(mockPermission).not.toHaveBeenCalled();
    await act(async () => { mockLife.setState({ world: { birthAcknowledged: true } }); });
    expect(mockPermission).toHaveBeenCalledTimes(1);
    expect(mockReconcile).toHaveBeenLastCalledWith({ enabled: true, hour: 19, minute: 0 });
    await act(async () => { foreground('active'); foreground('active'); });
    expect(mockPermission).toHaveBeenCalledTimes(1);
  } finally { context.view.unmount(); context.sqlite.close(); }
});

test('an existing denial never prompts automatically and an already-on default can explicitly obtain permission and schedule', async () => {
  mockBegunLife = true; mockGetPermission.mockResolvedValue({ status: 'denied', canAskAgain: true });
  mockReconcile.mockResolvedValue({ status: 'denied', message: 'Enable notifications in device settings.' });
  const context = await fixture();
  try {
    expect(mockPermission).not.toHaveBeenCalled(); expect(await context.repository.loadAppSettings()).toBeNull();
    mockReconcile.mockResolvedValue({ status: 'scheduled' });
    await press('Allow Notifications');
    expect(mockPermission).toHaveBeenCalledTimes(1); expect(mockReconcile).toHaveBeenLastCalledWith({ enabled: true, hour: 19, minute: 0 });
    expect(screen.getByRole('switch', { name: 'Daily Reminders' })).toBeChecked();
    expect(await context.repository.loadAppSettings()).toBeNull();
  } finally { context.view.unmount(); context.sqlite.close(); }
});

test('switching reminders off while the initial permission prompt is pending keeps the final schedule off', async () => {
  mockBegunLife = true; mockGetPermission.mockResolvedValue({ status: 'undetermined', canAskAgain: true });
  let allow!: (value: unknown) => void; mockPermission.mockImplementationOnce(() => new Promise(resolve => { allow = resolve; }));
  const context = await fixture();
  try {
    expect(mockPermission).toHaveBeenCalledTimes(1);
    await toggle(false); const calls = mockReconcile.mock.calls.length;
    await act(async () => { allow({ status: 'granted', canAskAgain: true }); });
    expect(mockReconcile).toHaveBeenCalledTimes(calls); expect(mockReconcile).toHaveBeenLastCalledWith({ enabled: false, hour: 19, minute: 0 });
  } finally { context.view.unmount(); context.sqlite.close(); }
});

test('backgrounding during a permission query defers the prompt until the app becomes active', async () => {
  mockBegunLife = true;
  mockGetPermission.mockResolvedValue({ status: 'undetermined', canAskAgain: true });
  let resolveQuery!: (value: unknown) => void;
  mockGetPermission.mockImplementationOnce(() => new Promise(resolve => { resolveQuery = resolve; }));
  const context = await fixture();
  try {
    AppState.currentState = 'background';
    await act(async () => { foreground('background'); resolveQuery({ status: 'undetermined', canAskAgain: true }); });
    expect(mockPermission).not.toHaveBeenCalled();
    AppState.currentState = 'active'; await act(async () => { foreground('active'); });
    expect(mockPermission).toHaveBeenCalledTimes(1);
  } finally { context.view.unmount(); context.sqlite.close(); }
});

test('granting notification permission in device settings clears a previous denial after foreground refresh without writing preferences or the life', async () => {
  mockBegunLife = true; mockGetPermission.mockResolvedValue({ status: 'denied', canAskAgain: false });
  mockReconcile.mockResolvedValue({ status: 'denied', message: 'Allow Daily game reminders in your device’s notification settings.' });
  const context = await fixture('{"version":1,"appearance":"light","dailyReminder":true}');
  try {
    const before = await context.repository.loadAppSettings();
    mockPermission.mockResolvedValue({ status: 'denied', canAskAgain: false, message: 'Allow Daily game reminders in your device’s notification settings.' });
    await press('Allow Notifications'); expect(screen.getByRole('alert')).toHaveTextContent(/Allow Daily game reminders/);
    mockReconcile.mockResolvedValue({ status: 'scheduled' });
    await act(async () => { foreground('active'); });
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    expect(screen.queryByRole('button', { name: 'Open Notification Settings' })).toBeNull();
    expect(screen.getByRole('switch', { name: 'Daily Reminders' })).toBeChecked();
    expect(await context.repository.loadAppSettings()).toBe(before); expect(await context.repository.export(context.world.id)).toBe(context.archive);
  } finally { context.view.unmount(); context.sqlite.close(); }
});
