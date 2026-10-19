import { create } from 'zustand';
import { Creation, randomCreation } from '../game/createLife';

type Draft = { seed: number; input: Creation; mode: 'custom' | 'random' };
type CreationDraft = {
  draft: Draft | null;
  begin: (seed: number, mode: Draft['mode']) => void;
  update: (input: Creation) => void;
  randomise: (seed: number) => void;
  customise: () => void;
};
/** A navigation draft, separate from saved lives and simulation randomness. */
export const useCreationDraft = create<CreationDraft>((set, get) => ({
  draft: null,
  begin: (seed, mode) => { if (get().draft?.seed !== seed || get().draft?.mode !== mode) set({ draft: { seed, mode, input: randomCreation(seed) } }); },
  update: input => set(state => ({ draft: state.draft ? { ...state.draft, input } : null })),
  randomise: seed => set({ draft: { seed, input: randomCreation(seed), mode: 'random' } }),
  customise: () => set(state => ({ draft: state.draft ? { ...state.draft, mode: 'custom' } : null })),
}));
