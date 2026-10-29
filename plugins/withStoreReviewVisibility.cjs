const { withAndroidManifest } = require('expo/config-plugins');

// Expo Store Review checks PackageManager for Play Store before requesting a
// review. Android 11+ must also see Play on sideloaded/internal APK installs.
module.exports = config => withAndroidManifest(config, result => {
  const manifest = result.modResults.manifest;
  manifest.queries ??= [];
  const playStore = 'com.android.vending';
  if (!manifest.queries.some(query => query.package?.some(item => item.$?.['android:name'] === playStore))) {
    if (!manifest.queries.length) manifest.queries.push({});
    manifest.queries[0].package ??= [];
    manifest.queries[0].package.push({ $: { 'android:name': playStore } });
  }
  return result;
});
