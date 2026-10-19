import { useStore } from 'zustand';
import { createPreferencesStore, PreferencesState } from './preferencesStore';
import { openRepository } from '../persistence/native';

export const preferencesStore = createPreferencesStore({ repository: openRepository });
export function usePreferences<T>(selector: (state: PreferencesState) => T): T { return useStore(preferencesStore, selector); }
