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

test('public and unknown builds cannot embed the hidden testing bypass, even with the flag enabled', () => {
  const configure = require('../../app.config.cjs'), previous = { ...process.env };
  try {
    for (const profile of ['production', 'unknown', '', 'development', 'internal', 'preview']) {
      for (const distribution of ['store', 'internal', '']) {
        for (const flag of ['1', '0', '', 'true']) {
          Object.assign(process.env, { EAS_BUILD_PROFILE: profile, EAS_BUILD_DISTRIBUTION: distribution, DREAMS_GOD_MODE_TESTING: flag });
          const allowed = distribution === 'internal' && ['internal', 'preview', 'development'].includes(profile) && flag === '1';
          expect(configure({ config: { extra: { godModeTesting: true, unrelated: 1 } } }).extra)
            .toEqual({ godModeTesting: allowed, unrelated: 1 });
        }
      }
    }
  } finally { process.env = previous; }
});
