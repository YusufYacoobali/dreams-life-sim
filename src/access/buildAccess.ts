import Constants from 'expo-constants';
import { canAccessGodMode } from './godMode';

export function isGodModeBuild(): boolean {
  return canAccessGodMode({ development: typeof __DEV__ !== 'undefined' && __DEV__, internalTesting: Constants.expoConfig?.extra?.godModeTesting === true });
}
