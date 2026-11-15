import Constants from 'expo-constants';
import { canAccessGodMode } from './godMode';

export function isGodModeBuild(): boolean {
  // Reveals internal controls only; editor and royal access require ownership.
  return canAccessGodMode({ development: typeof __DEV__ !== 'undefined' && __DEV__, internalTesting: Constants.expoConfig?.extra?.godModeTesting === true });
}

export function isUnlockAllTestingEnabled(): boolean {
  // Retained for old config consumers. Stale embedded flags never grant access.
  return false;
}

export function isCommandProfilingEnabled(): boolean {
  const extra = Constants.expoConfig?.extra;
  return extra?.profileCommands === true && (extra.profileCommandsBuild === 'internal'
    || extra.profileCommandsBuild === 'development' && typeof __DEV__ !== 'undefined' && __DEV__);
}
