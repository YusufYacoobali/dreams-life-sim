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

test('every build profile exposes God Mode for testing without internal-only environment switches', () => {
  const configure = require('../../app.config.cjs'), previous = { ...process.env };
  const globals = globalThis as unknown as { __DEV__: boolean }, oldDev = __DEV__, oldExtra = Constants.expoConfig!.extra;
  try {
    globals.__DEV__ = false;
    for (const profile of ['production', 'unknown', '', 'development', 'internal', 'preview']) {
      process.env.EAS_BUILD_PROFILE = profile;
      for (const distribution of ['store', 'internal']) {
        process.env.EAS_BUILD_DISTRIBUTION = distribution;
        delete process.env.DREAMS_GOD_MODE_TESTING;
        const extra = configure({ config: { extra: { godModeTesting: false, unrelated: 1 } } }).extra;
        expect(extra).toEqual({ godModeTesting: true, unrelated: 1 });
        Constants.expoConfig!.extra = extra;
        expect(isGodModeBuild()).toBe(true);
      }
    }
  } finally { process.env = previous; globals.__DEV__ = oldDev; Constants.expoConfig!.extra = oldExtra; }
});
