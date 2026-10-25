// Testing access is a build capability, separate from the saved user toggle.
// Production/store always wins over testing flags, including inherited extras.
module.exports = ({ config }) => {
  const profile = (process.env.EAS_BUILD_PROFILE ?? '').trim().toLowerCase();
  const distribution = (process.env.EAS_BUILD_DISTRIBUTION ?? '').trim().toLowerCase();
  const storeBuild = profile === 'production' || distribution === 'store';
  const testing = !storeBuild && (
    ['development', 'internal', 'preview'].includes(profile) ||
    distribution === 'internal' || process.env.DREAMS_GOD_MODE_TESTING === '1'
  );
  return {
    ...config,
    extra: { ...config.extra, godModeTesting: testing },
  };
};
