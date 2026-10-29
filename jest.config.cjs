module.exports = {
  preset: '@react-native/jest-preset',
  testMatch: ['<rootDir>/tests/**/*.test.[jt]s?(x)'],
  cacheDirectory: require('node:path').join(require('node:os').tmpdir(), 'dreams-life-sim-jest'),
  clearMocks: true,
  // Connected save/retry journeys use the same allowance locally and in CI.
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/tests/support/native-ui.cjs'],
};
