// Internal testing is opt-in and never embedded in a public/store build.
module.exports = ({ config }) => {
  const internal = process.env.EAS_BUILD_DISTRIBUTION === 'internal'
    && ['internal', 'preview', 'development'].includes(process.env.EAS_BUILD_PROFILE)
    && process.env.DREAMS_GOD_MODE_TESTING === '1';
  return { ...config, extra: { ...config.extra, godModeTesting: internal } };
};
