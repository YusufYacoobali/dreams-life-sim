import Constants from 'expo-constants';
import { canAccessGodMode } from './godMode';

export function isGodModeBuild(): boolean {
  return canAccessGodMode({ development: typeof __DEV__ !== 'undefined' && __DEV__, internalTesting: Constants.expoConfig?.extra?.godModeTesting === true });
}

export function isUnlockAllTestingEnabled(): boolean {
  const extra = Constants.expoConfig?.extra;
  return extra?.unlockAllTesting === true && (extra.unlockAllTestingBuild === 'internal'
    || extra.unlockAllTestingBuild === 'development' && typeof __DEV__ !== 'undefined' && __DEV__);
}
