import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import { preferencesStore, usePreferences } from '../state/usePreferences';
import { useGame } from '../state/useGame';
import { refreshDailyReminders } from '../state/reminderStatus';
import { getDailyReminderPermission, requestDailyReminderPermission, subscribeToDailyReminderResponses } from '../notifications/dailyReminders';

export function AppReminders() {
  const ready = usePreferences(state => state.ready), failed = usePreferences(state => state.loadFailed);
  const enabled = usePreferences(state => state.settings.dailyReminder);
  const hour = usePreferences(state => state.settings.reminderHour), minute = usePreferences(state => state.settings.reminderMinute);
  const begunLife = useGame(state => !!state.world?.birthAcknowledged);
  const permissionRequested = useRef(false);

  useEffect(() => subscribeToDailyReminderResponses(() => router.navigate('/')), []);
  useEffect(() => {
    if (!ready || failed) return;
    let active = true;
    const refresh = async () => {
      // Ask once after the first life begins, rather than interrupting the
      // opening screen. Existing denied permission is never requested again.
      if (enabled && begunLife && !permissionRequested.current && AppState.currentState === 'active') {
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
  }, [ready, failed, enabled, hour, minute, begunLife]);
  return null;
}
