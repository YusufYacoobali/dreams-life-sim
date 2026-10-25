import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import { preferencesStore, usePreferences } from '../state/usePreferences';
import { refreshDailyReminders } from '../state/reminderStatus';
import { getDailyReminderPermission, requestDailyReminderPermission, subscribeToDailyReminderResponses } from '../notifications/dailyReminders';

export function AppReminders() {
  const ready = usePreferences(state => state.ready), failed = usePreferences(state => state.loadFailed);
  const enabled = usePreferences(state => state.settings.dailyReminder);
  const hour = usePreferences(state => state.settings.reminderHour), minute = usePreferences(state => state.settings.reminderMinute);
  const permissionRequested = useRef(false);

  useEffect(() => subscribeToDailyReminderResponses(() => router.navigate('/')), []);
  useEffect(() => {
    if (!ready || failed) return;
    let active = true;
    const refresh = async () => {
      // Ask once when the app opens with readable, enabled preferences.
      // Existing denied permission is never requested automatically again.
      if (enabled && !permissionRequested.current && AppState.currentState === 'active') {
        permissionRequested.current = true;
        const permission = await getDailyReminderPermission();
        const latest = preferencesStore.getState();
        if (!active || !latest.ready || latest.loadFailed || !latest.settings.dailyReminder || AppState.currentState !== 'active') {
          permissionRequested.current = false;
          return;
        }
        if (permission.status === 'undetermined' && permission.canAskAgain) await requestDailyReminderPermission();
      }
      if (active) await refreshDailyReminders({ enabled, hour, minute });
    };
    void refresh().catch(() => {});
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void refresh().catch(() => {}); });
    return () => { active = false; listener.remove(); };
  }, [ready, failed, enabled, hour, minute]);
  return null;
}
