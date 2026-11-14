// Testing is opt-in; public/store builds never embed premium testing access.
module.exports = ({ config }) => {
  const internal = process.env.EAS_BUILD_DISTRIBUTION === 'internal'
    && ['internal', 'preview', 'development'].includes(process.env.EAS_BUILD_PROFILE);
  const development = !process.env.EAS_BUILD_PROFILE && !process.env.EAS_BUILD_DISTRIBUTION
    && process.env.EAS_BUILD !== 'true' && process.env.EAS_ENVIRONMENT !== 'production'
    && process.env.NODE_ENV !== 'production';
  const unlockAllTestingBuild = internal && process.env.EAS_ENVIRONMENT !== 'production' ? 'internal' : development ? 'development' : null;
  return { ...config, extra: { ...config.extra,
    profileCommands: unlockAllTestingBuild !== null && process.env.DREAMS_PROFILE_COMMANDS === '1',
    profileCommandsBuild: unlockAllTestingBuild,
    godModeTesting: internal && process.env.DREAMS_GOD_MODE_TESTING === '1',
    unlockAllTesting: unlockAllTestingBuild !== null && process.env.DREAMS_UNLOCK_ALL_TESTING === '1',
    unlockAllTestingBuild,
  } };
};
