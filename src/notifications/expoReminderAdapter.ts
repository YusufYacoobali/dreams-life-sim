import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import type { NotificationResponse } from 'expo-notifications';
import type { DailyReminderPermission, ReminderAdapter, ReminderResponse, WeeklyReminderTrigger } from './reminderPlan';

const CHANNEL = 'dreams-daily-reminders';

export async function createExpoReminderAdapter(environment: {
  platform?: string; isExpoGo?: () => boolean;
  loadNotifications?: () => Promise<typeof import('expo-notifications')>;
} = {}): Promise<ReminderAdapter> {
  const platform = environment.platform ?? Platform.OS;
  // Importing expo-notifications itself emits Expo Go warnings and loads unsupported native paths.
  if ((environment.isExpoGo ?? isRunningInExpoGo)() || (platform !== 'android' && platform !== 'ios')) {
    throw Object.assign(new Error('Native local notifications are unavailable.'), { code: 'REMINDERS_UNAVAILABLE' });
  }
  const notifications = await (environment.loadNotifications ?? (() => import('expo-notifications')))();
  const permission = async (value: Awaited<ReturnType<typeof notifications.getPermissionsAsync>>): Promise<DailyReminderPermission> => {
    const ios = value.ios?.status;
    const granted = value.granted || ios === notifications.IosAuthorizationStatus.AUTHORIZED
      || ios === notifications.IosAuthorizationStatus.PROVISIONAL || ios === notifications.IosAuthorizationStatus.EPHEMERAL;
    if (granted && platform === 'android') {
      const channel = await notifications.getNotificationChannelAsync(CHANNEL);
      if (channel && channel.importance === notifications.AndroidImportance.NONE) {
        return { status: 'denied', canAskAgain: false, message: 'Allow Daily game reminders in your device’s notification settings.' };
      }
    }
    if (granted && platform === 'ios' && value.ios
      && [value.ios.allowsAlert, value.ios.allowsDisplayInNotificationCenter, value.ios.allowsDisplayOnLockScreen].every(allowed => allowed === false)) {
      return { status: 'denied', canAskAgain: false, message: 'Allow a notification display option in your device’s notification settings.' };
    }
    return { status: granted ? 'granted' : value.status === 'undetermined' ? 'undetermined' : 'denied', canAskAgain: value.canAskAgain };
  };
  const ensureChannel = async () => {
    if (platform !== 'android' || await notifications.getNotificationChannelAsync(CHANNEL)) return;
    await notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Daily game reminders', importance: notifications.AndroidImportance.DEFAULT,
      sound: null, enableVibrate: false, showBadge: false,
    });
  };
  const trigger = (value: unknown): WeeklyReminderTrigger | null => {
    if (!value || typeof value !== 'object') return null;
    const raw = value as Record<string, unknown>;
    const weekly = (date: Record<string, unknown>): WeeklyReminderTrigger | null => {
      const { weekday, hour, minute } = date;
      return typeof weekday === 'number' && Number.isInteger(weekday) && weekday >= 1 && weekday <= 7
        && typeof hour === 'number' && Number.isInteger(hour) && hour >= 0 && hour <= 23
        && typeof minute === 'number' && Number.isInteger(minute) && minute >= 0 && minute <= 59 ? { weekday, hour, minute } : null;
    };
    if (raw.type === 'weekly') return weekly(raw);
    if (raw.type === 'calendar' && raw.repeats && raw.dateComponents && typeof raw.dateComponents === 'object') {
      const date = raw.dateComponents as Record<string, unknown>;
      if (weekly(date)
        && [date.year, date.month, date.day, date.weekdayOrdinal, date.quarter, date.weekOfMonth, date.weekOfYear, date.yearForWeekOfYear].every(part => part === undefined)
        && (date.second === undefined || date.second === 0)) {
        return weekly(date);
      }
    }
    return null;
  };
  const response = (value: NotificationResponse | null): ReminderResponse | null => value && ({
    identifier: value.notification.request.identifier, date: value.notification.date,
    defaultAction: value.actionIdentifier === notifications.DEFAULT_ACTION_IDENTIFIER,
    data: value.notification.request.content.data,
  });
  return {
    getPermission: async () => permission(await notifications.getPermissionsAsync()),
    requestPermission: async () => {
      const current = await permission(await notifications.getPermissionsAsync());
      if (current.status === 'granted' || !current.canAskAgain) return current;
      await ensureChannel(); // Android 13 requires a channel before its first notification permission request.
      return permission(await notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: false, allowSound: false } }));
    },
    scheduled: async () => (await notifications.getAllScheduledNotificationsAsync()).map(row => ({
      identifier: row.identifier, title: row.content.title, body: row.content.body,
      data: row.content.data, trigger: row.trigger ? trigger(row.trigger) : null,
    })),
    cancel: identifier => notifications.cancelScheduledNotificationAsync(identifier),
    schedule: async row => {
      await ensureChannel();
      return notifications.scheduleNotificationAsync({
        identifier: row.identifier, content: { title: row.title, body: row.body, data: row.data, sound: false },
        trigger: { type: notifications.SchedulableTriggerInputTypes.WEEKLY, ...row.trigger, channelId: CHANNEL },
      });
    },
    onResponse: listener => {
      const subscription = notifications.addNotificationResponseReceivedListener(value => listener(response(value)!));
      return () => subscription.remove();
    },
    initialResponse: async () => response(notifications.getLastNotificationResponse()),
  };
}
