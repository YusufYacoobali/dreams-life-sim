const { AndroidConfig, withAndroidManifest, withDangerousMod, withEntitlementsPlist } = require('expo/config-plugins');
const fs = require('node:fs/promises');
const path = require('node:path');
const notificationPlugin = require('expo-notifications/app.plugin');

// Daily reminders are scheduled on the device and do not register with APNs.
module.exports = (config, options = {}) => {
  const withNotifications = notificationPlugin.default ?? notificationPlugin;
  // Expo evaluates the newer mod before its predecessor, so install the cleanup
  // first: it must run after the notification plugin adds its push entitlement.
  config = withEntitlementsPlist(config, result => {
    delete result.modResults['aps-environment'];
    return result;
  });
  config = withNotifications(config, { ...options, enableBackgroundRemoteNotifications: false });
  config = withAndroidManifest(config, result => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(result.modResults);
    const name = '.DreamsReminderClockReceiver';
    application.receiver ??= [];
    application.receiver = application.receiver.filter(receiver => receiver.$?.['android:name'] !== name);
    application.receiver.push({
      $: { 'android:name': name, 'android:enabled': 'true', 'android:exported': 'false' },
      'intent-filter': [{ action: [
        { $: { 'android:name': 'android.intent.action.TIME_SET' } },
        { $: { 'android:name': 'android.intent.action.TIMEZONE_CHANGED' } },
      ] }],
    });
    return result;
  });
  return withDangerousMod(config, ['android', async result => {
    const packageName = AndroidConfig.Package.getPackage(result);
    if (!packageName || !/^[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)+$/.test(packageName)) throw new Error('Local reminders require a valid Android package.');
    const directory = path.join(result.modRequest.platformProjectRoot, 'app/src/main/java', ...packageName.split('.'));
    const template = await fs.readFile(path.join(__dirname, 'templates/DreamsReminderClockReceiver.kt'), 'utf8');
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, 'DreamsReminderClockReceiver.kt'), template.replace('__DREAMS_PACKAGE__', packageName));
    return result;
  }]);
};
