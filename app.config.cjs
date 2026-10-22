// Only explicitly configured internal binaries receive testing access. Production
// and unknown profiles always override any stale flag in static configuration.
module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    godModeTesting: ['preview', 'internal'].includes(process.env.EAS_BUILD_PROFILE)
      && process.env.EAS_BUILD_DISTRIBUTION === 'internal'
      && process.env.DREAMS_GOD_MODE_TESTING === '1',
  },
});
