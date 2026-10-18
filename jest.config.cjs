module.exports = {
  preset: '@react-native/jest-preset',
  testMatch: ['<rootDir>/tests/**/*.test.[jt]s?(x)'],
  cacheDirectory: require('node:path').join(require('node:os').tmpdir(), 'dreams-life-sim-jest'),
  clearMocks: true,
};
