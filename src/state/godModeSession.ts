import { createStore } from 'zustand/vanilla';

type GodModeSession = {
  revealed: boolean;
  reveal: () => void;
  reset: () => void;
};

/** Deliberately not persisted: a fresh app session starts with testing hidden. */
export const godModeSessionStore = createStore<GodModeSession>(set => ({
  revealed: false,
  reveal: () => set({ revealed: true }),
  reset: () => set({ revealed: false }),
}));
