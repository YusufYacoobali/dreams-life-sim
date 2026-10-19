import { createStore } from 'zustand/vanilla';
import { z } from 'zod';
import type { SaveRepository } from '../persistence/repository';

export const appSettingsSchema = z.object({ version: z.literal(1), appearance: z.enum(['light', 'dark', 'system']) }).strict();
export type AppSettings = z.infer<typeof appSettingsSchema>;
export const defaultAppSettings: AppSettings = { version: 1, appearance: 'light' };
export type PreferencesState = {
  settings: AppSettings; ready: boolean; busy: boolean; error: string | null; loadFailed: boolean;
  bootstrap: () => Promise<boolean>; setAppearance: (appearance: AppSettings['appearance']) => Promise<boolean>;
  retry: () => Promise<boolean>; reset: () => Promise<boolean>;
};
type Dependencies = { repository: () => Promise<Pick<SaveRepository, 'loadAppSettings' | 'saveAppSettings'>> };
export function createPreferencesStore(deps: Dependencies) {
  return createStore<PreferencesState>((set, get) => {
    let failedWrite: AppSettings | null = null;
    const write = async (input: AppSettings) => {
      if (get().busy) return false;
      set({ busy: true, error: null });
      try {
        const settings = appSettingsSchema.parse(input);
        await (await deps.repository()).saveAppSettings(JSON.stringify(settings));
        failedWrite = null; set({ settings, ready: true, loadFailed: false }); return true;
      } catch {
        failedWrite = { ...input }; set({ error: 'Your display setting could not be saved. Try again.' }); return false;
      } finally { set({ busy: false }); }
    };
    return {
      settings: { ...defaultAppSettings }, ready: false, busy: false, error: null, loadFailed: false,
      bootstrap: async () => {
        if (get().busy) return false;
        set({ busy: true, error: null });
        try {
          const value = await (await deps.repository()).loadAppSettings();
          if (value && value.length > 1024) throw new Error('Oversize display settings');
          const settings = value === null ? { ...defaultAppSettings } : appSettingsSchema.parse(JSON.parse(value));
          failedWrite = null; set({ settings, loadFailed: false }); return true;
        } catch {
          set({ loadFailed: true, error: 'Your display settings could not be read. Try again or restore the default appearance.' }); return false;
        } finally { set({ busy: false, ready: true }); }
      },
      setAppearance: appearance => !get().ready || get().loadFailed ? Promise.resolve(false) : write({ ...get().settings, appearance }),
      retry: () => failedWrite ? write(failedWrite) : get().bootstrap(),
      reset: () => get().ready ? write({ ...defaultAppSettings }) : Promise.resolve(false),
    };
  });
}
