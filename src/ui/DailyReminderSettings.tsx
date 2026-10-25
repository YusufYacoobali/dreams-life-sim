import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Switch, TextInput, View } from 'react-native';
import { usePreferences } from '../state/usePreferences';
import { refreshDailyReminders, useReminderStatus } from '../state/reminderStatus';
import { requestDailyReminderPermission } from '../notifications/dailyReminders';
import { Body, Button, Card, Heading } from './components';
import { useColors } from './theme';
import { DisplayText as Text } from './DisplayText';

const pad = (value: number) => String(value).padStart(2, '0');

export function DailyReminderSettings({ stacked }: { stacked: boolean }) {
  const settings = usePreferences(state => state.settings), ready = usePreferences(state => state.ready);
  const busy = usePreferences(state => state.busy), failed = usePreferences(state => state.loadFailed);
  const setEnabled = usePreferences(state => state.setDailyReminder), setTime = usePreferences(state => state.setReminderTime);
  const status = useReminderStatus(), c = useColors();
  const [hour, setHour] = useState(pad(settings.reminderHour)), [minute, setMinute] = useState(pad(settings.reminderMinute));
  const [working, setWorking] = useState<'permission' | 'time' | null>(null), [notice, setNotice] = useState<string | null>(null);
  const [denied, setDenied] = useState(false), acting = useRef(false), mounted = useRef(true), previousStatus = useRef(status.status);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { setHour(pad(settings.reminderHour)); setMinute(pad(settings.reminderMinute)); }, [settings.reminderHour, settings.reminderMinute]);
  useEffect(() => {
    const recovered = previousStatus.current !== 'scheduled' && status.status === 'scheduled';
    previousStatus.current = status.status;
    if (recovered && denied) { setDenied(false); setNotice(null); }
  }, [status.status, denied]);

  const supported = Platform.OS === 'android' || Platform.OS === 'ios';
  const unavailable = !ready || failed || busy || working !== null || !supported;
  const config = { enabled: settings.dailyReminder, hour: settings.reminderHour, minute: settings.reminderMinute };
  const changeEnabled = async (enabled: boolean) => {
    if (acting.current || unavailable) return;
    acting.current = true; setWorking('permission'); setNotice(null);
    try {
      if (enabled) {
        const permission = await requestDailyReminderPermission();
        if (!mounted.current) return;
        if (permission.status !== 'granted') {
          setDenied(permission.status === 'denied');
          setNotice(permission.message ?? (permission.status === 'denied' ? 'Allow notifications in device settings, then turn Daily Reminders on.' : permission.status === 'undetermined' ? 'Reminders stay off until you allow notifications.' : 'Reminders are unavailable on this device. Your game and saves are unaffected.'));
          return;
        }
      }
      if (mounted.current) {
        setDenied(false);
        const saved = await setEnabled(enabled);
        // Defaults may already be on while OS permission is still pending.
        if (saved && enabled && config.enabled) await refreshDailyReminders(config);
      }
    } catch {
      if (mounted.current) setNotice('Reminders could not be updated. Please try again. Your game and saves are unaffected.');
    } finally {
      acting.current = false;
      if (mounted.current) setWorking(null);
    }
  };
  const saveTime = async () => {
    if (acting.current || unavailable) return;
    if (!/^\d{1,2}$/.test(hour) || !/^\d{1,2}$/.test(minute) || Number(hour) > 23 || Number(minute) > 59) {
      setNotice('Enter an hour from 00 to 23 and minutes from 00 to 59.'); return;
    }
    acting.current = true; setWorking('time'); setNotice(null);
    try { await setTime(Number(hour), Number(minute)); }
    finally { acting.current = false; if (mounted.current) setWorking(null); }
  };
  const inputStyle = { color: c.ink, backgroundColor: c.inset, borderColor: c.line, borderWidth: 1, borderRadius: 10, padding: 12, minHeight: 48, fontSize: 18 };
  const nativeMessage = status.status === 'error' || status.status === 'denied' || (settings.dailyReminder && status.status === 'unavailable') ? status.message : undefined;

  return <Card><Heading size={19}>Daily reminders</Heading>
    <Body muted>One optional reminder a day, with rotating messages to revisit your story. Choose a time that suits you.</Body>
    <View style={{ flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'stretch' : 'center', gap: 12 }}>
      <View style={{ flex: stacked ? undefined : 1, minWidth: 0, gap: 4 }}><Text style={{ color: c.ink, fontSize: 16, lineHeight: 23, fontWeight: '600' }}>Daily Reminders</Text><Body muted>Scheduled on this device. No account or internet needed.</Body></View>
      <View style={{ minHeight: 48, justifyContent: 'center', alignSelf: stacked ? 'flex-start' : 'center' }}><Switch accessibilityRole="switch" accessibilityLabel="Daily Reminders" accessibilityHint="Allow one local reminder each day at your chosen time" accessibilityState={{ disabled: unavailable, checked: settings.dailyReminder }} value={settings.dailyReminder} disabled={unavailable} onValueChange={enabled => { void changeEnabled(enabled); }} trackColor={{ false: c.track, true: c.actionBlue }} /></View>
    </View>
    <Body>{settings.dailyReminder ? `Daily at ${pad(settings.reminderHour)}:${pad(settings.reminderMinute)}, in your device’s local time.` : 'Reminders are off.'}</Body>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      <View style={{ flex: 1, minWidth: 110, gap: 6 }}><Body>Hour (00–23)</Body><TextInput accessibilityLabel="Reminder hour, 24-hour clock" value={hour} editable={!unavailable} keyboardType="number-pad" maxLength={2} onChangeText={value => { setHour(value); setNotice(null); }} style={inputStyle} selectTextOnFocus /></View>
      <View style={{ flex: 1, minWidth: 110, gap: 6 }}><Body>Minute (00–59)</Body><TextInput accessibilityLabel="Reminder minute" value={minute} editable={!unavailable} keyboardType="number-pad" maxLength={2} onChangeText={value => { setMinute(value); setNotice(null); }} style={inputStyle} selectTextOnFocus /></View>
    </View>
    <Button label="Save Reminder Time" tone="secondary" disabled={unavailable || (hour === pad(settings.reminderHour) && minute === pad(settings.reminderMinute))} busy={working === 'time'} onPress={() => { void saveTime(); }} />
    {working === 'permission' && <ActivityIndicator accessibilityLabel="Updating reminder permission" />}
    {settings.dailyReminder && status.status === 'checking' && <Body muted>Updating your daily reminder…</Body>}
    {notice && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, fontSize: 15, lineHeight: 23 }}>{notice}</Text>}
    {nativeMessage && !notice && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, fontSize: 15, lineHeight: 23 }}>{nativeMessage}</Text>}
    {(denied || status.status === 'denied') && <Button label="Open Notification Settings" tone="secondary" disabled={working !== null} onPress={() => { void Linking.openSettings().catch(() => { if (mounted.current) setNotice('Device settings could not be opened. You can change notification permissions in your device settings.'); }); }} />}
    {settings.dailyReminder && status.status === 'denied' && <Button label="Allow Notifications" tone="secondary" disabled={unavailable} onPress={() => { void changeEnabled(true); }} />}
    {status.status === 'error' && <Button label="Try Reminders Again" tone="secondary" disabled={unavailable} onPress={() => { setNotice(null); void refreshDailyReminders(config); }} />}
    {!supported && <Body muted>Local reminders are available in the Android and iOS apps.</Body>}
  </Card>;
}
