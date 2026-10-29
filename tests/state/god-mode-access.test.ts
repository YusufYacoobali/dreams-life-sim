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
    Constants.expoConfig!.extra = { godModeTesting: false }; expect(isGodModeBuild()).toBe(false);
    Constants.expoConfig!.extra = { godModeTesting: true }; expect(isGodModeBuild()).toBe(true);
    Constants.expoConfig!.extra = {}; expect(isGodModeBuild()).toBe(false);
  } finally { globals.__DEV__ = old; Constants.expoConfig!.extra = oldExtra; }
});

test('every build profile and distribution retains God Mode testing access regardless of environment switches', () => {
  const configure = require('../../app.config.cjs'), previous = { ...process.env };
  const globals = globalThis as unknown as { __DEV__: boolean }, oldDev = __DEV__, oldExtra = Constants.expoConfig!.extra;
  try {
    globals.__DEV__ = false;
    for (const profile of ['production', 'unknown', '', 'development', 'internal', 'preview']) {
      process.env.EAS_BUILD_PROFILE = profile;
      for (const distribution of ['store', 'internal', '']) {
        process.env.EAS_BUILD_DISTRIBUTION = distribution;
        for (const flag of ['1', '0', '', 'true']) {
          process.env.DREAMS_GOD_MODE_TESTING = flag;
          const extra = configure({ config: { extra: { godModeTesting: false, unrelated: 1 } } }).extra;
          expect(extra).toEqual({ godModeTesting: true, unrelated: 1 });
          Constants.expoConfig!.extra = extra;
          expect(isGodModeBuild()).toBe(true);
        }
      }
    }
  } finally { process.env = previous; globals.__DEV__ = oldDev; Constants.expoConfig!.extra = oldExtra; }
});

test('unmarked local builds retain testing capability without environment flags and preserve unrelated config', () => {
  const configure = require('../../app.config.cjs'), previous = { ...process.env };
  try {
    delete process.env.EAS_BUILD_DISTRIBUTION;
    delete process.env.DREAMS_GOD_MODE_TESTING;
    delete process.env.EAS_BUILD_PROFILE;
    expect(configure({ config: { name: 'Dreams', extra: { unrelated: 'kept', godModeTesting: false } } }))
      .toEqual({ name: 'Dreams', extra: { unrelated: 'kept', godModeTesting: true } });
    process.env.EXPO_PUBLIC_GOD_MODE_TESTING = '0';
    for (const profile of ['development', 'internal', 'preview', 'unknown', '']) {
      process.env.EAS_BUILD_PROFILE = profile;
      expect(configure({ config: { extra: { godModeTesting: true } } }).extra.godModeTesting)
        .toBe(true);
    }
    delete process.env.EAS_BUILD_PROFILE;
    process.env.DREAMS_GOD_MODE_TESTING = '1';
    expect(configure({ config: {} }).extra.godModeTesting).toBe(true);
    process.env.DREAMS_GOD_MODE_TESTING = 'true';
    expect(configure({ config: {} }).extra.godModeTesting).toBe(true);
  } finally { process.env = previous; }
});
