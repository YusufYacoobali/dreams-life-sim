// Keep God Mode available in every build, including production/store, while
// release testing is ongoing. The saved Settings toggle still controls use.
module.exports = ({ config }) => ({
  ...config,
  extra: { ...config.extra, godModeTesting: true },
});
