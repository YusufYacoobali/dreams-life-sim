import { useStore } from 'zustand';
import { createPreferencesStore, PreferencesState } from './preferencesStore';

export const preferencesStore = createPreferencesStore({ repository: async () => (await import('../persistence/native')).openRepository() });
export function usePreferences<T>(selector: (state: PreferencesState) => T): T { return useStore(preferencesStore, selector); }
