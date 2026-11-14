// Testing is opt-in; public/store builds never embed premium testing access.
module.exports = ({ config }) => {
  const internal = process.env.EAS_BUILD_DISTRIBUTION === 'internal'
    && ['internal', 'preview', 'development', 'performance'].includes(process.env.EAS_BUILD_PROFILE);
  const development = !process.env.EAS_BUILD_PROFILE && !process.env.EAS_BUILD_DISTRIBUTION
    && process.env.EAS_BUILD !== 'true' && process.env.EAS_ENVIRONMENT !== 'production'
    && process.env.NODE_ENV !== 'production';
  const unlockAllTestingBuild = internal && process.env.EAS_ENVIRONMENT !== 'production' ? 'internal' : development ? 'development' : null;
  const performanceApp = internal && process.env.EAS_BUILD_PROFILE === 'performance';
  return { ...config,
    ...(performanceApp ? { name: config.name + ' Profile', scheme: 'dreams-life-profile',
      ios: { ...config.ios, bundleIdentifier: 'com.yacoobali.lifesim.profile' },
      android: { ...config.android, package: 'com.yacoobali.lifesim.profile' } } : {}),
    extra: { ...config.extra,
    profileCommands: unlockAllTestingBuild !== null && process.env.DREAMS_PROFILE_COMMANDS === '1',
    profileCommandsBuild: unlockAllTestingBuild,
    profileSourceRevision: /^[a-f0-9]{7,40}$/.test(process.env.DREAMS_SOURCE_REVISION ?? '') ? process.env.DREAMS_SOURCE_REVISION : null,
    godModeTesting: internal && process.env.DREAMS_GOD_MODE_TESTING === '1',
    unlockAllTesting: unlockAllTestingBuild !== null && process.env.DREAMS_UNLOCK_ALL_TESTING === '1',
    unlockAllTestingBuild,
  } };
};
