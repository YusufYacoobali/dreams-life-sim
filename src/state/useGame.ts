import { useStore } from 'zustand';
import { createGameStore, GameState } from './gameStore';
import { openRepository } from '../persistence/native';

let sequence = 0;
export const freshSeed = () => Math.floor(Math.random() * 0x100000000);
export const gameStore = createGameStore({
  repository: openRepository,
  date: () => {
    const date = new Date();
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
  },
  id: () => 'life_' + Date.now().toString(36) + '_' + freshSeed().toString(36) + '_' + sequence++,
});
export function useGame<T>(selector: (state: GameState) => T): T {
  return useStore(gameStore, selector);
}
