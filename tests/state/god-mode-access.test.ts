import { canAccessGodMode } from '../../src/access/godMode';
import Constants from 'expo-constants';
import { isGodModeBuild } from '../../src/access/buildAccess';

test('runtime access accepts development or an explicit testing capability', () => {
  expect(canAccessGodMode({ development: true, internalTesting: false })).toBe(true);
  expect(canAccessGodMode({ development: false, internalTesting: true })).toBe(true);
  expect(canAccessGodMode({ development: false, internalTesting: false })).toBe(false);
  const globals = globalThis as unknown as { __DEV__: boolean }, old = __DEV__, oldExtra = Constants.expoConfig!.extra; globals.__DEV__ = false;
  try {
    Constants.expoConfig!.extra = { godModeTesting: 'true' }; expect(isGodModeBuild()).toBe(false);
    Constants.expoConfig!.extra = { godModeTesting: true }; expect(isGodModeBuild()).toBe(true);
    Constants.expoConfig!.extra = {}; expect(isGodModeBuild()).toBe(false);
  } finally { globals.__DEV__ = old; Constants.expoConfig!.extra = oldExtra; }
});

test('production and store distributions deny testing access even when testing flags or inherited extras are enabled', () => {
  const configure = require('../../app.config.cjs'), previous = { ...process.env };
  const globals = globalThis as unknown as { __DEV__: boolean }, oldDev = __DEV__, oldExtra = Constants.expoConfig!.extra;
  try {
    globals.__DEV__ = false;
    for (const profile of ['production', 'unknown', '', 'development', 'internal', 'preview']) {
      process.env.EAS_BUILD_PROFILE = profile;
      for (const distribution of ['store', 'internal']) {
        process.env.EAS_BUILD_DISTRIBUTION = distribution;
        for (const flag of ['1', '0', '']) {
          process.env.DREAMS_GOD_MODE_TESTING = flag;
          const allowed = profile !== 'production' && distribution !== 'store',
            extra = configure({ config: { extra: { godModeTesting: true, unrelated: 1 } } }).extra;
          expect(extra).toEqual({ godModeTesting: allowed, unrelated: 1 });
          Constants.expoConfig!.extra = extra;
          expect(isGodModeBuild()).toBe(allowed);
        }
      }
    }
  } finally { process.env = previous; globals.__DEV__ = oldDev; Constants.expoConfig!.extra = oldExtra; }
});

test('internal and preview builds retain testing access; unmarked local release builds default off', () => {
  const configure = require('../../app.config.cjs'), previous = { ...process.env };
  try {
    delete process.env.EAS_BUILD_DISTRIBUTION;
    delete process.env.DREAMS_GOD_MODE_TESTING;
    process.env.EXPO_PUBLIC_GOD_MODE_TESTING = '1';
    for (const profile of ['development', 'internal', 'preview', 'unknown', '']) {
      process.env.EAS_BUILD_PROFILE = profile;
      expect(configure({ config: { extra: { godModeTesting: true } } }).extra.godModeTesting)
        .toBe(['development', 'internal', 'preview'].includes(profile));
    }
    delete process.env.EAS_BUILD_PROFILE;
    process.env.DREAMS_GOD_MODE_TESTING = '1';
    expect(configure({ config: {} }).extra.godModeTesting).toBe(true);
    process.env.DREAMS_GOD_MODE_TESTING = 'true';
    expect(configure({ config: {} }).extra.godModeTesting).toBe(false);
  } finally { process.env = previous; }
});
