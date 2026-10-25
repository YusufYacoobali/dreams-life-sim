const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { writeSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
let completed = 0;
const expected = 3;
// A file-level exit-0 result alone must never stand in for these assertions.
// Keep third-party imports inside registered tests so an import failure is named.
process.once('exit', () => {
  if (completed !== expected) {
    writeSync(2, 'Notification plugin assertions incomplete: ' + completed + '/' + expected + ' cases completed.\n');
    process.exitCode = 1;
  }
});

test('notification mods add one private clock receiver, preserve foreign components and emit its Kotlin source for the configured package', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'dreams-notification-plugin-'));
  try {
    const withLocalNotifications = require('../../plugins/withLocalNotifications.cjs');
    const config = withLocalNotifications({ name: 'Dreams', slug: 'dreams', android: { package: 'com.example.dreams' } });
    const foreign = { $: { 'android:name': '.AnotherFeature', 'android:exported': 'false' }, 'intent-filter': [{ action: [{ $: { 'android:name': 'example.KEEP' } }] }] };
    const manifest = { manifest: { application: [{ $: { 'android:name': '.MainApplication' }, receiver: [structuredClone(foreign)] }] } };
    const request = { projectRoot: root, platformProjectRoot: path.join(root, 'android'), platform: 'android', modName: 'manifest', introspect: false };
    const once = await config.mods.android.manifest({ ...config, modResults: manifest, modRequest: request });
    const twice = await config.mods.android.manifest({ ...config, modResults: once.modResults, modRequest: request });
    const receivers = twice.modResults.manifest.application[0].receiver;
    assert.deepEqual(receivers.find(receiver => receiver.$['android:name'] === '.AnotherFeature'), foreign);
    const clock = receivers.filter(receiver => receiver.$['android:name'] === '.DreamsReminderClockReceiver');
    assert.equal(clock.length, 1);
    assert.deepEqual(clock[0].$, { 'android:name': '.DreamsReminderClockReceiver', 'android:enabled': 'true', 'android:exported': 'false' });
    assert.deepEqual(clock[0]['intent-filter'][0].action.map(action => action.$['android:name']), ['android.intent.action.TIME_SET', 'android.intent.action.TIMEZONE_CHANGED']);
    assert.equal(twice.modResults.manifest['uses-permission'], undefined);
    await config.mods.android.dangerous({ ...config, modResults: null, modRequest: { ...request, modName: 'dangerous' } });
    const file = path.join(root, 'android/app/src/main/java/com/example/dreams/DreamsReminderClockReceiver.kt');
    const source = await fs.readFile(file, 'utf8');
    const template = await fs.readFile(path.join(__dirname, '../../plugins/templates/DreamsReminderClockReceiver.kt'), 'utf8');
    assert.equal(source, template.replace('__DREAMS_PACKAGE__', 'com.example.dreams'));
    await config.mods.android.dangerous({ ...config, modResults: null, modRequest: { ...request, modName: 'dangerous' } });
    assert.equal(await fs.readFile(file, 'utf8'), source);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
  completed++;
});

test('local-only notification configuration removes APNs entitlement and retains unrelated entitlements', async () => {
  const withLocalNotifications = require('../../plugins/withLocalNotifications.cjs');
  const config = withLocalNotifications({ name: 'Dreams', slug: 'dreams', android: { package: 'com.example.dreams' } }, { enableBackgroundRemoteNotifications: true });
  const result = await config.mods.ios.entitlements({ ...config, modResults: { 'aps-environment': 'development', 'com.apple.developer.associated-domains': ['applinks:example.test'] }, modRequest: { platform: 'ios', modName: 'entitlements', projectRoot: '/tmp' } });
  assert.equal(result.modResults['aps-environment'], undefined);
  assert.deepEqual(result.modResults['com.apple.developer.associated-domains'], ['applinks:example.test']);
  completed++;
});

test('clock re-arming reads current owned requests and cannot restore a cancelled persistent request', async () => {
  const source = await fs.readFile(path.join(__dirname, '../../plugins/templates/DreamsReminderClockReceiver.kt'), 'utf8');
  // State-changing SDK calls must not return here: they would re-save a stale
  // snapshot after a concurrent JS cancellation removed its persistent record.
  assert.doesNotMatch(source, /\b(?:scheduleNotification|saveNotificationRequest|setupScheduledNotifications|schedule)\s*\(/);
  assert.doesNotMatch(source, /\b(?:SharedPreferences|SharedPreferencesNotificationsStore|putString|edit)\b/);
  assert.deepEqual([...source.matchAll(/scheduler\.(\w+)\(/g)].map(match => match[1]).sort(), ['getAllScheduledNotifications', 'getScheduledNotification']);
  assert.match(source, /\.filter\s*\{\s*it\.identifier\.startsWith\("dreams\.daily-reminder\.v1\.weekday\."\)/);
  assert.match(source, /val current = scheduler\.getScheduledNotification\(identifier\) \?: return@forEach/);
  assert.match(source, /val next = trigger\.nextTriggerDate\(\) \?: return@forEach/);
  assert.match(source, /NotificationsService\.createNotificationTrigger\(appContext, identifier\)/);
  assert.match(source, /Build\.VERSION\.SDK_INT < Build\.VERSION_CODES\.S \|\| alarms\.canScheduleExactAlarms\(\)/);
  assert.match(source, /AlarmManagerCompat\.setExactAndAllowWhileIdle\(alarms, AlarmManager\.RTC_WAKEUP, next\.time, operation\)/);
  assert.match(source, /AlarmManagerCompat\.setAndAllowWhileIdle\(alarms, AlarmManager\.RTC_WAKEUP, next\.time, operation\)/);
  completed++;
});
