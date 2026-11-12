import Constants from 'expo-constants';
import { getConfig } from 'expo/config';
import { resolve } from 'node:path';
import { isUnlockAllTestingEnabled } from '../../src/access/buildAccess';

const configure = require('../../app.config.cjs');
const globals = globalThis as unknown as { __DEV__: boolean };
let previousEnv: NodeJS.ProcessEnv, previousDev: boolean, previousExtra: NonNullable<typeof Constants.expoConfig>['extra'];
beforeEach(() => {
  previousEnv = { ...process.env }; previousDev = __DEV__; previousExtra = Constants.expoConfig!.extra;
  for (const key of ['EAS_BUILD_PROFILE', 'EAS_BUILD_DISTRIBUTION', 'EAS_BUILD', 'EAS_ENVIRONMENT', 'DREAMS_UNLOCK_ALL_TESTING']) delete process.env[key];
  globals.__DEV__ = false;
});
afterEach(() => { process.env = previousEnv; globals.__DEV__ = previousDev; Constants.expoConfig!.extra = previousExtra; });

test.each([
  ['internal', 'internal', '1', true], ['preview', 'internal', '1', true], ['development', 'internal', '1', true],
  ['internal', 'internal', '0', false], ['internal', 'internal', '', false], ['internal', 'internal', 'true', false],
  ['production', 'store', '1', false], ['production', 'internal', '1', false], ['production', '', '1', false],
  ['internal', 'store', '1', false], ['development', 'store', '1', false], ['preview', 'store', '1', false],
  ['unknown', 'internal', '1', false], ['unknown', '', '1', false], ['', 'internal', '1', false],
] as const)('resolved Expo config and runtime: profile=%s distribution=%s flag=%s access=%s', (profile, distribution, flag, allowed) => {
  Object.assign(process.env, { EAS_BUILD_PROFILE: profile, EAS_BUILD_DISTRIBUTION: distribution, DREAMS_UNLOCK_ALL_TESTING: flag, NODE_ENV: 'production' });
  const { exp } = getConfig(resolve(__dirname, '../..'), { skipPlugins: true });
  expect(exp.extra?.unlockAllTesting).toBe(allowed);
  Constants.expoConfig!.extra = exp.extra;
  expect(isUnlockAllTestingEnabled()).toBe(allowed);
  globals.__DEV__ = true;
  expect(isUnlockAllTestingEnabled()).toBe(allowed);
});

test('local development is opt-in and a local release bundle rejects development metadata', () => {
  process.env.NODE_ENV = 'development'; globals.__DEV__ = true;
  Constants.expoConfig!.extra = configure({ config: {} }).extra;
  expect(isUnlockAllTestingEnabled()).toBe(false);
  process.env.DREAMS_UNLOCK_ALL_TESTING = '1';
  Constants.expoConfig!.extra = configure({ config: {} }).extra;
  expect(isUnlockAllTestingEnabled()).toBe(true);
  globals.__DEV__ = false;
  expect(isUnlockAllTestingEnabled()).toBe(false);
  process.env.NODE_ENV = 'production';
  expect(configure({ config: {} }).extra.unlockAllTesting).toBe(false);
});

test('production or unidentified EAS builds overwrite stale testing metadata and keep unrelated config', () => {
  process.env.DREAMS_UNLOCK_ALL_TESTING = '1';
  for (const env of [{ EAS_BUILD: 'true' }, { EAS_ENVIRONMENT: 'production' }]) {
    Object.assign(process.env, env);
    const result = configure({ config: { name: 'Dreams', extra: { unrelated: 1, unlockAllTesting: true, unlockAllTestingBuild: 'internal' } } });
    expect(result).toMatchObject({ name: 'Dreams', extra: { unrelated: 1, unlockAllTesting: false, unlockAllTestingBuild: null } });
  }
  Object.assign(process.env, { EAS_BUILD_PROFILE: 'internal', EAS_BUILD_DISTRIBUTION: 'internal', EAS_ENVIRONMENT: 'production' });
  expect(configure({ config: {} }).extra.unlockAllTesting).toBe(false);
});

test('missing, invalid or production capability metadata never grants testing access', () => {
  for (const extra of [{}, { unlockAllTesting: true }, { unlockAllTesting: 'true', unlockAllTestingBuild: 'internal' },
    { unlockAllTesting: true, unlockAllTestingBuild: 'production' }, { unlockAllTesting: false, unlockAllTestingBuild: 'internal' }]) {
    Constants.expoConfig!.extra = extra;
    globals.__DEV__ = true; expect(isUnlockAllTestingEnabled()).toBe(false);
    globals.__DEV__ = false; expect(isUnlockAllTestingEnabled()).toBe(false);
  }
});

test('EAS internal profiles enable the flag and the store profile explicitly disables it', () => {
  const { build } = require('../../eas.json');
  for (const profile of ['internal', 'preview']) {
    expect(build[profile].distribution).toBe('internal');
    expect(build[profile].env.DREAMS_UNLOCK_ALL_TESTING).toBe('1');
  }
  expect(build.production.distribution).toBe('store');
  expect(build.production.env.DREAMS_UNLOCK_ALL_TESTING).toBe('0');
});
