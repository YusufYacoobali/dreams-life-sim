import { canAccessGodMode } from '../../src/access/godMode';
import Constants from 'expo-constants';
import { isGodModeBuild } from '../../src/access/buildAccess';

test('development and configured internal access are separate from public builds', () => {
  expect(canAccessGodMode({ development: true, internalTesting: false })).toBe(true);
  expect(canAccessGodMode({ development: false, internalTesting: true })).toBe(true);
  expect(canAccessGodMode({ development: false, internalTesting: false })).toBe(false);
  const globals = globalThis as unknown as { __DEV__: boolean }, old = __DEV__; globals.__DEV__ = false;
  try {
    Constants.expoConfig!.extra = { godModeTesting: 'true' }; expect(isGodModeBuild()).toBe(false);
    Constants.expoConfig!.extra = { godModeTesting: true }; expect(isGodModeBuild()).toBe(true);
    Constants.expoConfig!.extra = {}; expect(isGodModeBuild()).toBe(false);
  } finally { globals.__DEV__ = old; }
});

test('production configuration clears stale testing flags; preview requires all internal switches', () => {
  const configure = require('../../app.config.cjs'), previous = { ...process.env };
  try {
    for (const profile of ['production', 'unknown', '', 'development']) {
      process.env.EAS_BUILD_PROFILE = profile; process.env.EAS_BUILD_DISTRIBUTION = 'internal'; process.env.DREAMS_GOD_MODE_TESTING = '1';
      expect(configure({ config: { extra: { godModeTesting: true, unrelated: 1 } } }).extra).toEqual({ godModeTesting: false, unrelated: 1 });
    }
    for (const profile of ['internal', 'preview']) {
      process.env.EAS_BUILD_PROFILE = profile; expect(configure({ config: {} }).extra.godModeTesting).toBe(true);
      process.env.EAS_BUILD_DISTRIBUTION = 'store'; expect(configure({ config: {} }).extra.godModeTesting).toBe(false);
      process.env.EAS_BUILD_DISTRIBUTION = 'internal'; process.env.DREAMS_GOD_MODE_TESTING = '0'; expect(configure({ config: {} }).extra.godModeTesting).toBe(false);
      process.env.DREAMS_GOD_MODE_TESTING = '1';
    }
  } finally { process.env = previous; }
});
