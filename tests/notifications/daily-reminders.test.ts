import { createDailyReminderService } from '../../src/notifications/dailyReminders';
import { DEFAULT_REMINDER_HOUR, DEFAULT_REMINDER_MINUTE, REMINDER_MESSAGES, REMINDER_PREFIX, planDailyReminders } from '../../src/notifications/reminderPlan';
import type { DailyReminderPermission, PlannedReminder, ReminderAdapter, ReminderResponse, ScheduledReminder } from '../../src/notifications/reminderPlan';
import { createExpoReminderAdapter } from '../../src/notifications/expoReminderAdapter';

jest.mock('expo', () => ({ isRunningInExpoGo: () => false }));

const enabled = { enabled: true, hour: 19, minute: 0 };
const sunday = () => new Date(2026, 9, 18, 12);
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}
function harness() {
  const pending: ScheduledReminder[] = [], listeners = new Set<(response: ReminderResponse) => void>();
  let permission: DailyReminderPermission = { status: 'granted', canAskAgain: true };
  let initial: ReminderResponse | null = null, now = sunday(), zone = 'Test/Local|0';
  const scheduled = jest.fn(async () => pending.map(row => ({ ...row })));
  const cancel = jest.fn(async (id: string) => {
    for (let i = pending.length - 1; i >= 0; i--) if (pending[i].identifier === id) pending.splice(i, 1);
  });
  const schedule = jest.fn(async (row: PlannedReminder) => { pending.push({ ...row }); return row.identifier; });
  const request = jest.fn(async () => permission);
  const adapter: ReminderAdapter = {
    getPermission: jest.fn(async () => permission), requestPermission: request, scheduled, cancel, schedule,
    onResponse: callback => { listeners.add(callback); return () => { listeners.delete(callback); }; },
    initialResponse: async () => initial,
  };
  const dependencies = { loadAdapter: async () => adapter, now: () => now, timeZone: () => zone };
  return {
    pending, listeners, scheduled, cancel, schedule, request, adapter, dependencies,
    service: createDailyReminderService(dependencies),
    permission: (value: DailyReminderPermission) => { permission = value; },
    initial: (value: ReminderResponse) => { initial = value; },
    date: (value: Date) => { now = value; }, zone: (value: string) => { zone = value; },
    emit: (value: ReminderResponse) => { listeners.forEach(listener => listener(value)); },
  };
}
function foreign(index = 0): ScheduledReminder {
  return { identifier: `another-feature-${index}`, title: 'Other', body: 'Keep me', data: {}, trigger: null };
}
async function flush() { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); }

test('seven weekly local slots use stable weekly content from 28 varied messages, with valid defaults and a new bank next week', () => {
  expect([DEFAULT_REMINDER_HOUR, DEFAULT_REMINDER_MINUTE]).toEqual([19, 0]);
  expect(new Set(REMINDER_MESSAGES).size).toBe(28);
  const first = planDailyReminders(enabled, sunday(), 'Test/Local|0');
  expect(first).toHaveLength(7);
  expect(first.map(row => row.trigger)).toEqual(Array.from({ length: 7 }, (_, index) => ({ weekday: index + 1, hour: 19, minute: 0 })));
  expect(new Set(first.map(row => row.identifier)).size).toBe(7);
  expect(planDailyReminders(enabled, new Date(2026, 9, 24, 23), 'Test/Local|0')).toEqual(first);
  expect(planDailyReminders(enabled, new Date(2026, 9, 25, 12), 'Test/Local|0').map(row => row.body)).not.toEqual(first.map(row => row.body));
  expect(() => planDailyReminders({ ...enabled, hour: 24 }, sunday())).toThrow('valid local reminder time');
  expect(() => planDailyReminders({ ...enabled, minute: 0.5 }, sunday())).toThrow('valid local reminder time');
  expect(planDailyReminders({ enabled: false, hour: NaN, minute: NaN }, sunday())).toEqual([]);
});

test('reconcile and a cold service preserve seven exact native schedules and unrelated requests without re-scheduling', async () => {
  const h = harness(), other = foreign(); h.pending.push(other);
  expect(await h.service.reconcileDailyReminders(enabled)).toEqual({ status: 'scheduled' });
  expect(h.pending).toHaveLength(8); expect(h.schedule).toHaveBeenCalledTimes(7); expect(h.request).not.toHaveBeenCalled();
  expect(await h.service.reconcileDailyReminders(enabled)).toEqual({ status: 'scheduled' });
  const cold = createDailyReminderService(h.dependencies);
  expect(await cold.reconcileDailyReminders(enabled)).toEqual({ status: 'scheduled' });
  expect(h.schedule).toHaveBeenCalledTimes(7); expect(h.cancel).not.toHaveBeenCalled(); expect(h.pending[0]).toBe(other);
});

test('changed local time, calendar week or timezone replaces only owned slots; disabling removes only those slots', async () => {
  const h = harness(), other = foreign(); h.pending.push(other);
  await h.service.reconcileDailyReminders(enabled);
  await h.service.reconcileDailyReminders({ ...enabled, hour: 8, minute: 45 });
  expect(h.pending.slice(1).every(row => row.trigger?.hour === 8 && row.trigger.minute === 45)).toBe(true);
  h.date(new Date(2026, 9, 25, 12));
  await h.service.reconcileDailyReminders({ ...enabled, hour: 8, minute: 45 });
  h.zone('Different/Zone|-60');
  await h.service.reconcileDailyReminders({ ...enabled, hour: 8, minute: 45 });
  expect(h.schedule).toHaveBeenCalledTimes(28); expect(h.cancel).toHaveBeenCalledTimes(21);
  expect(h.pending).toHaveLength(8); expect(h.pending[0]).toBe(other);
  expect(await h.service.reconcileDailyReminders({ enabled: false, hour: NaN, minute: NaN })).toEqual({ status: 'off' });
  expect(h.pending).toEqual([other]); expect(h.cancel.mock.calls.every(([id]) => id.startsWith(REMINDER_PREFIX))).toBe(true);
});

test.each(['denied', 'undetermined'] as const)('%s permissions never prompt during reconcile, and stale owned slots are removed', async status => {
  const h = harness(), other = foreign(); h.pending.push(other, ...planDailyReminders(enabled, sunday(), 'Test/Local|0'));
  h.permission({ status, canAskAgain: status === 'undetermined' });
  expect((await h.service.reconcileDailyReminders(enabled)).status).toBe('denied');
  expect(h.pending).toEqual([other]); expect(h.request).not.toHaveBeenCalled();
  expect((await h.service.getDailyReminderPermission()).status).toBe(status);
  expect((await h.service.requestDailyReminderPermission()).status).toBe(status); expect(h.request).toHaveBeenCalledTimes(1);
  expect(h.schedule).not.toHaveBeenCalled();
});

test('held native reconciliation serializes enable, changed time and off, with the last requested state winning', async () => {
  const h = harness(), held = deferred<ScheduledReminder[]>(), other = foreign(); h.pending.push(other);
  h.scheduled.mockImplementationOnce(() => held.promise);
  const first = h.service.reconcileDailyReminders(enabled);
  const second = h.service.reconcileDailyReminders({ ...enabled, hour: 10 });
  const last = h.service.reconcileDailyReminders({ ...enabled, enabled: false });
  await flush(); expect(h.scheduled).toHaveBeenCalledTimes(1); expect(h.schedule).not.toHaveBeenCalled();
  held.resolve([other]);
  expect((await first).status).toBe('scheduled'); expect((await second).status).toBe('scheduled'); expect((await last).status).toBe('off');
  expect(h.pending).toEqual([other]); expect(h.schedule).toHaveBeenCalledTimes(14);
});

test('queued settings are snapshotted, duplicates are repaired, and a failed partial schedule can be retried', async () => {
  const h = harness(), config = { ...enabled };
  h.pending.push(...planDailyReminders(enabled, sunday(), 'Test/Local|0').slice(0, 1));
  h.pending.push({ ...h.pending[0] });
  h.schedule.mockImplementationOnce(async () => { throw new Error('native scheduling failure'); });
  const first = h.service.reconcileDailyReminders(config); config.hour = 2;
  expect((await first).status).toBe('error');
  expect((await h.service.reconcileDailyReminders(enabled)).status).toBe('scheduled');
  expect(h.pending).toHaveLength(7); expect(new Set(h.pending.map(row => row.identifier)).size).toBe(7);
  expect(h.pending.every(row => row.trigger?.hour === 19)).toBe(true);
});

test('capacity errors preserve unrelated schedules and remove owned requests rather than silently evicting another feature', async () => {
  const h = harness(), others = Array.from({ length: 58 }, (_, index) => foreign(index));
  h.pending.push(...others, ...planDailyReminders(enabled, sunday(), 'Test/Local|0').slice(0, 1));
  expect((await h.service.reconcileDailyReminders(enabled)).status).toBe('error');
  expect(h.pending).toEqual(others); expect(h.schedule).not.toHaveBeenCalled();
});

test('unsupported native modules and operational errors resolve safely without breaking the queue or startup', async () => {
  const unsupported = createDailyReminderService({ loadAdapter: async () => { throw Object.assign(new Error('not available'), { code: 'ERR_UNAVAILABLE' }); } });
  expect((await unsupported.reconcileDailyReminders(enabled)).status).toBe('unavailable');
  expect(await unsupported.getDailyReminderPermission()).toMatchObject({ status: 'unavailable', canAskAgain: false });
  const h = harness(); h.pending.push(...planDailyReminders(enabled, sunday(), 'Test/Local|0'));
  h.cancel.mockImplementationOnce(async () => { throw new Error('cancel failed'); });
  expect((await h.service.reconcileDailyReminders({ ...enabled, enabled: false })).status).toBe('error');
  expect((await h.service.reconcileDailyReminders({ ...enabled, enabled: false })).status).toBe('off');
  expect(h.pending).toEqual([]);
});

test('an unexpected returned native identifier is cancelled rather than leaving an unowned duplicate', async () => {
  const h = harness(); h.schedule.mockImplementationOnce(async row => { h.pending.push({ ...row, identifier: 'native-new-id' }); return 'native-new-id'; });
  expect((await h.service.reconcileDailyReminders(enabled)).status).toBe('error');
  expect(h.cancel).toHaveBeenCalledWith('native-new-id'); expect(h.pending).toEqual([]);
});

test('owned default taps open Continue once across initial/live delivery, while another weekly occurrence remains distinct', async () => {
  const h = harness(), row = planDailyReminders(enabled, sunday(), 'Test/Local|0')[0], onContinue = jest.fn();
  const tap: ReminderResponse = { identifier: row.identifier, date: 1000, defaultAction: true, data: row.data };
  h.initial(tap);
  const remove = h.service.subscribeToDailyReminderResponses(onContinue); await flush();
  h.emit(tap); h.emit({ ...tap, identifier: 'other-feature' }); h.emit({ ...tap, defaultAction: false }); h.emit({ ...tap, data: { action: 'continue' } });
  expect(onContinue).toHaveBeenCalledTimes(1);
  h.emit({ ...tap, date: 2000 }); expect(onContinue).toHaveBeenCalledTimes(2);
  remove(); expect(h.listeners.size).toBe(0); h.emit({ ...tap, date: 3000 }); expect(onContinue).toHaveBeenCalledTimes(2);
});

test('response cleanup before lazy loading or before initial response completes cannot navigate or leak a listener', async () => {
  const h = harness(), load = deferred<ReminderAdapter>(), callback = jest.fn();
  const service = createDailyReminderService({ loadAdapter: () => load.promise });
  const remove = service.subscribeToDailyReminderResponses(callback); remove(); load.resolve(h.adapter); await flush();
  expect(h.listeners.size).toBe(0); expect(callback).not.toHaveBeenCalled();
  const initial = deferred<ReminderResponse | null>(); h.adapter.initialResponse = () => initial.promise;
  const row = planDailyReminders(enabled, sunday(), 'Test/Local|0')[0];
  const removeSecond = h.service.subscribeToDailyReminderResponses(callback); await flush(); expect(h.listeners.size).toBe(1);
  removeSecond(); initial.resolve({ identifier: row.identifier, date: 1000, defaultAction: true, data: row.data }); await flush();
  expect(h.listeners.size).toBe(0); expect(callback).not.toHaveBeenCalled();
});

test('Expo Go and unsupported platforms are rejected before importing the native notification module', async () => {
  const loadNotifications = jest.fn(async () => { throw new Error('Native module must not load'); });
  await expect(createExpoReminderAdapter({ platform: 'android', isExpoGo: () => true, loadNotifications })).rejects.toMatchObject({ code: 'REMINDERS_UNAVAILABLE' });
  await expect(createExpoReminderAdapter({ platform: 'web', isExpoGo: () => false, loadNotifications })).rejects.toMatchObject({ code: 'REMINDERS_UNAVAILABLE' });
  expect(loadNotifications).not.toHaveBeenCalled();
});

test('the native adapter creates a quiet Android channel before an explicit first permission prompt and normalizes weekly schedules', async () => {
  const order: string[] = [], row = planDailyReminders(enabled, sunday(), 'Test/Local|0')[0];
  const native = {
    IosAuthorizationStatus: { AUTHORIZED: 2, PROVISIONAL: 3, EPHEMERAL: 4 }, AndroidImportance: { DEFAULT: 3 },
    SchedulableTriggerInputTypes: { WEEKLY: 'weekly' }, DEFAULT_ACTION_IDENTIFIER: 'default',
    getPermissionsAsync: jest.fn(async () => ({ granted: false, status: 'undetermined', canAskAgain: true })),
    getNotificationChannelAsync: jest.fn(async () => null),
    setNotificationChannelAsync: jest.fn(async () => { order.push('channel'); }),
    requestPermissionsAsync: jest.fn(async () => { order.push('prompt'); return { granted: true, status: 'granted', canAskAgain: true }; }),
    scheduleNotificationAsync: jest.fn(async () => row.identifier),
    getAllScheduledNotificationsAsync: jest.fn(async () => [
      { identifier: row.identifier, content: { title: row.title, body: row.body, data: row.data }, trigger: { type: 'weekly', ...row.trigger } },
      { identifier: row.identifier, content: { title: row.title, body: row.body, data: row.data }, trigger: { type: 'calendar', repeats: true, dateComponents: { ...row.trigger, second: 0 } } },
      { identifier: 'one-date-only', content: { title: null, body: null, data: {} }, trigger: { type: 'calendar', repeats: false, dateComponents: { ...row.trigger, year: 2026 } } },
    ]),
  };
  const loadNotifications = async () => native as unknown as typeof import('expo-notifications');
  const adapter = await createExpoReminderAdapter({ platform: 'android', isExpoGo: () => false, loadNotifications });
  expect((await adapter.getPermission()).status).toBe('undetermined'); expect(order).toEqual([]);
  expect((await adapter.requestPermission()).status).toBe('granted'); expect(order).toEqual(['channel', 'prompt']);
  expect(native.setNotificationChannelAsync).toHaveBeenCalledWith('dreams-daily-reminders', expect.objectContaining({ sound: null, enableVibrate: false, showBadge: false }));
  expect(native.requestPermissionsAsync).toHaveBeenCalledWith({ ios: { allowAlert: true, allowBadge: false, allowSound: false } });
  await adapter.schedule(row);
  expect(native.scheduleNotificationAsync).toHaveBeenCalledWith({ identifier: row.identifier, content: { title: row.title, body: row.body, data: row.data, sound: false }, trigger: { type: 'weekly', ...row.trigger, channelId: 'dreams-daily-reminders' } });
  expect((await adapter.scheduled()).map(request => request.trigger)).toEqual([row.trigger, row.trigger, null]);
  // Preserve user channel settings instead of resetting an existing channel.
  native.getNotificationChannelAsync.mockResolvedValueOnce({} as never); native.setNotificationChannelAsync.mockClear();
  await adapter.schedule(row); expect(native.setNotificationChannelAsync).not.toHaveBeenCalled();
});
