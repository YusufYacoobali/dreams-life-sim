// Temporarily expose the existing God Mode toggle in every build for testing,
// including production/store builds. The saved toggle still controls editing.
module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    godModeTesting: true,
  },
});
