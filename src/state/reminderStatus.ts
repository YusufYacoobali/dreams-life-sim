import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { reconcileDailyReminders, type DailyReminderConfig, type DailyReminderResult } from '../notifications/dailyReminders';

type ReminderStatus = { status: DailyReminderResult['status'] | 'idle' | 'checking'; message?: string };
export const reminderStatusStore = createStore<ReminderStatus>(() => ({ status: 'idle' }));
let request = 0;

export async function refreshDailyReminders(config: DailyReminderConfig) {
  const current = ++request;
  reminderStatusStore.setState({ status: 'checking', message: undefined });
  const result = await reconcileDailyReminders(config);
  if (current === request) reminderStatusStore.setState({ status: result.status, message: result.message });
  return result;
}

export function useReminderStatus() { return useStore(reminderStatusStore); }
