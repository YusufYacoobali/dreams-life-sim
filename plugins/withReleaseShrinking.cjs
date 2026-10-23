const { withGradleProperties } = require('expo/config-plugins');

// Expo's Android template reads these only for release builds. Native libraries
// retain their own consumer ProGuard rules; development builds stay debuggable.
module.exports = config => withGradleProperties(config, result => {
  for (const key of ['android.enableMinifyInReleaseBuilds', 'android.enableShrinkResourcesInReleaseBuilds']) {
    result.modResults = result.modResults.filter(item => item.type !== 'property' || item.key !== key);
    result.modResults.push({ type: 'property', key, value: 'true' });
  }
  return result;
});
