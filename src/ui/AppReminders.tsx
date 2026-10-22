import { useEffect } from 'react';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import { usePreferences } from '../state/usePreferences';
import { refreshDailyReminders } from '../state/reminderStatus';
import { subscribeToDailyReminderResponses } from '../notifications/dailyReminders';

export function AppReminders() {
  const ready = usePreferences(state => state.ready), failed = usePreferences(state => state.loadFailed);
  const enabled = usePreferences(state => state.settings.dailyReminder);
  const hour = usePreferences(state => state.settings.reminderHour), minute = usePreferences(state => state.settings.reminderMinute);

  useEffect(() => subscribeToDailyReminderResponses(() => router.navigate('/')), []);
  useEffect(() => {
    if (!ready || failed) return;
    const refresh = () => { void refreshDailyReminders({ enabled, hour, minute }); };
    refresh();
    const listener = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    return () => listener.remove();
  }, [ready, failed, enabled, hour, minute]);
  return null;
}
