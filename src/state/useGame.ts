import { useStore } from 'zustand';
import { createGameStore, GameState } from './gameStore';
import { openRepository } from '../persistence/native';
import { isGodModeBuild } from '../access/buildAccess';
import { preferencesStore } from './usePreferences';
import { godModeSessionStore } from './godModeSession';

let sequence = 0;
export const freshSeed = () => Math.floor(Math.random() * 0x100000000);
export const gameStore = createGameStore({
  repository: openRepository,
  godModeAccess: () => {
    const { ready, loadFailed, settings } = preferencesStore.getState();
    return isGodModeBuild() && godModeSessionStore.getState().revealed && ready && !loadFailed && settings.godModeEnabled;
  },
  yieldToUI: () => new Promise(resolve => { requestAnimationFrame(() => setTimeout(resolve, 0)); }),
  date: () => {
    const date = new Date();
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
  },
  id: () => 'life_' + Date.now().toString(36) + '_' + freshSeed().toString(36) + '_' + sequence++,
});
export function useGame<T>(selector: (state: GameState) => T): T {
  return useStore(gameStore, selector);
}
