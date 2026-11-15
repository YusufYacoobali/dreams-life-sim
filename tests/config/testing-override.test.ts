import Constants from 'expo-constants';
import { getConfig } from 'expo/config';
import { resolve } from 'node:path';
import { isCommandProfilingEnabled, isUnlockAllTestingEnabled } from '../../src/access/buildAccess';

const configure = require('../../app.config.cjs');
const globals = globalThis as unknown as { __DEV__: boolean };
let previousEnv: NodeJS.ProcessEnv, previousDev: boolean, previousExtra: NonNullable<typeof Constants.expoConfig>['extra'];
beforeEach(() => {
  previousEnv = { ...process.env }; previousDev = __DEV__; previousExtra = Constants.expoConfig!.extra;
  for (const key of ['EAS_BUILD_PROFILE', 'EAS_BUILD_DISTRIBUTION', 'EAS_BUILD', 'EAS_ENVIRONMENT', 'DREAMS_UNLOCK_ALL_TESTING', 'DREAMS_PROFILE_COMMANDS']) delete process.env[key];
  globals.__DEV__ = false;
});
afterEach(() => { process.env = previousEnv; globals.__DEV__ = previousDev; Constants.expoConfig!.extra = previousExtra; });

test.each([
  ['internal', 'internal', '1'], ['preview', 'internal', '1'], ['development', 'internal', '1'],
  ['internal', 'internal', '0'], ['internal', 'internal', ''], ['internal', 'internal', 'true'],
  ['production', 'store', '1'], ['production', 'internal', '1'], ['production', '', '1'],
  ['internal', 'store', '1'], ['development', 'store', '1'], ['preview', 'store', '1'],
  ['unknown', 'internal', '1'], ['unknown', '', '1'], ['', 'internal', '1'],
] as const)('resolved Expo config and runtime: profile=%s distribution=%s flag=%s', (profile, distribution, flag) => {
  Object.assign(process.env, { EAS_BUILD_PROFILE: profile, EAS_BUILD_DISTRIBUTION: distribution, DREAMS_UNLOCK_ALL_TESTING: flag, NODE_ENV: 'production' });
  const { exp } = getConfig(resolve(__dirname, '../..'), { skipPlugins: true });
  expect(exp.extra?.unlockAllTesting).toBe(false);
  Constants.expoConfig!.extra = exp.extra;
  expect(isUnlockAllTestingEnabled()).toBe(false);
  globals.__DEV__ = true;
  expect(isUnlockAllTestingEnabled()).toBe(false);
});

test('local development and release builds ignore legacy unlock flags', () => {
  process.env.NODE_ENV = 'development'; globals.__DEV__ = true;
  Constants.expoConfig!.extra = configure({ config: {} }).extra;
  expect(isUnlockAllTestingEnabled()).toBe(false);
  process.env.DREAMS_UNLOCK_ALL_TESTING = '1';
  Constants.expoConfig!.extra = configure({ config: {} }).extra;
  expect(isUnlockAllTestingEnabled()).toBe(false);
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

test('stale, missing and invalid embedded metadata never grants testing access', () => {
  for (const extra of [{ unlockAllTesting: true, unlockAllTestingBuild: 'internal' }, { unlockAllTesting: true, unlockAllTestingBuild: 'development' }, {}, { unlockAllTesting: true }, { unlockAllTesting: 'true', unlockAllTestingBuild: 'internal' },
    { unlockAllTesting: true, unlockAllTestingBuild: 'production' }, { unlockAllTesting: false, unlockAllTestingBuild: 'internal' }]) {
    Constants.expoConfig!.extra = extra;
    globals.__DEV__ = true; expect(isUnlockAllTestingEnabled()).toBe(false);
    globals.__DEV__ = false; expect(isUnlockAllTestingEnabled()).toBe(false);
  }
});

test('every EAS profile explicitly disables premium testing access', () => {
  const { build } = require('../../eas.json');
  for (const profile of ['internal', 'preview', 'performance']) {
    expect(build[profile].distribution).toBe('internal');
    expect(build[profile].env.DREAMS_UNLOCK_ALL_TESTING).toBe('0');
  }
  expect(build.production.distribution).toBe('store');
  expect(build.production.env.DREAMS_UNLOCK_ALL_TESTING).toBe('0');
});

test.each([
  ['preview', 'internal', '', true], ['development', 'internal', '', true], ['performance', 'internal', '', true], ['production', 'store', '', false],
  ['production', 'internal', '', false], ['preview', 'store', '', false], ['unknown', 'internal', '', false], ['preview', 'internal', 'production', false],
] as const)('command profiling stays opt-in and rejects public build metadata: %s/%s/%s', (profile, distribution, environment, allowed) => {
  Object.assign(process.env, { EAS_BUILD_PROFILE: profile, EAS_BUILD_DISTRIBUTION: distribution, EAS_ENVIRONMENT: environment, NODE_ENV: 'production' });
  Constants.expoConfig!.extra = configure({ config: {} }).extra; expect(isCommandProfilingEnabled()).toBe(false);
  process.env.DREAMS_PROFILE_COMMANDS = '1'; Constants.expoConfig!.extra = configure({ config: {} }).extra;
  expect(isCommandProfilingEnabled()).toBe(allowed); expect(Constants.expoConfig!.extra?.profileCommands).toBe(allowed);
});

test('the internal performance app has separate identifiers, keeps purchases normal and public builds discard profiling flags', () => {
  const {build}=require('../../eas.json');
  Object.assign(process.env,build.performance.env,{EAS_BUILD_PROFILE:'performance',NODE_ENV:'production',DREAMS_SOURCE_REVISION:'26930868'});
  const config={name:'Dreams',scheme:'dreams-life',ios:{bundleIdentifier:'com.yacoobali.lifesim'},android:{package:'com.yacoobali.lifesim'}};
  const profiled=configure({config});
  expect(profiled.ios.bundleIdentifier).toBe('com.yacoobali.lifesim.profile');expect(profiled.android.package).toBe('com.yacoobali.lifesim.profile');
  expect(profiled.extra).toMatchObject({profileCommands:true,unlockAllTesting:false,profileSourceRevision:'26930868'});
  Object.assign(process.env,build.production.env,{EAS_BUILD_PROFILE:'production',DREAMS_PROFILE_COMMANDS:'1'});
  const production=configure({config});expect(production.ios.bundleIdentifier).toBe(config.ios.bundleIdentifier);expect(production.android.package).toBe(config.android.package);expect(production.extra.profileCommands).toBe(false);
});
