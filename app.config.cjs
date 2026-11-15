// Paid features require verified ownership in every build.
module.exports = ({ config }) => {
  // Expo reuses existing native folders on run:android, without re-running
  // prebuild plugins. Repair that explicit build before Gradle reads them.
  // Keep other config consumers (including EAS archives without tools/) pure.
  if (process.argv[2] === 'run:android') {
    require('./tools/repair-android-build.cjs').prepareAndroidRun(__dirname);
  }
  const internal = process.env.EAS_BUILD_DISTRIBUTION === 'internal'
    && ['internal', 'preview', 'development', 'performance'].includes(process.env.EAS_BUILD_PROFILE);
  const development = !process.env.EAS_BUILD_PROFILE && !process.env.EAS_BUILD_DISTRIBUTION
    && process.env.EAS_BUILD !== 'true' && process.env.EAS_ENVIRONMENT !== 'production'
    && process.env.NODE_ENV !== 'production';
  const profilingBuild = internal && process.env.EAS_ENVIRONMENT !== 'production' ? 'internal' : development ? 'development' : null;
  const performanceApp = internal && process.env.EAS_BUILD_PROFILE === 'performance';
  return { ...config,
    ...(performanceApp ? { name: config.name + ' Profile', scheme: 'dreams-life-profile',
      ios: { ...config.ios, bundleIdentifier: 'com.yacoobali.lifesim.profile' },
      android: { ...config.android, package: 'com.yacoobali.lifesim.profile' } } : {}),
    extra: { ...config.extra,
    profileCommands: profilingBuild !== null && process.env.DREAMS_PROFILE_COMMANDS === '1',
    profileCommandsBuild: profilingBuild,
    profileSourceRevision: /^[a-f0-9]{7,40}$/.test(process.env.DREAMS_SOURCE_REVISION ?? '') ? process.env.DREAMS_SOURCE_REVISION : null,
    godModeTesting: internal && process.env.DREAMS_GOD_MODE_TESTING === '1',
    unlockAllTesting: false,
    unlockAllTestingBuild: null,
  } };
};
