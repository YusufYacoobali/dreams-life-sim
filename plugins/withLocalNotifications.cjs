const { withEntitlementsPlist } = require('expo/config-plugins');
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
  return withNotifications(config, { ...options, enableBackgroundRemoteNotifications: false });
};
