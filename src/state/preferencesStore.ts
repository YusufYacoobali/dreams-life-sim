import { createStore } from 'zustand/vanilla';
import { z } from 'zod';
import type { SaveRepository } from '../persistence/repository';

export const appSettingsSchema = z.object({
  version: z.literal(1), appearance: z.enum(['light', 'dark', 'system']),
  reducedMotion: z.boolean().default(false), haptics: z.boolean().default(false), soundEffects: z.boolean().default(false),
  dailyReminder: z.boolean().default(false), reminderHour: z.number().int().min(0).max(23).default(19), reminderMinute: z.number().int().min(0).max(59).default(0),
  godModeEnabled: z.boolean().default(false),
}).strict();
export type AppSettings = z.infer<typeof appSettingsSchema>;
export const defaultAppSettings: AppSettings = { version: 1, appearance: 'light', reducedMotion: false, haptics: false, soundEffects: false, dailyReminder: false, reminderHour: 19, reminderMinute: 0, godModeEnabled: false };
export type PreferencesState = {
  settings: AppSettings; ready: boolean; busy: boolean; error: string | null; loadFailed: boolean;
  bootstrap: () => Promise<boolean>; setAppearance: (appearance: AppSettings['appearance']) => Promise<boolean>;
  setReducedMotion: (enabled: boolean) => Promise<boolean>; setHaptics: (enabled: boolean) => Promise<boolean>;
  setSoundEffects: (enabled: boolean) => Promise<boolean>;
  setGodModeEnabled: (enabled: boolean) => Promise<boolean>;
  setDailyReminder: (enabled: boolean) => Promise<boolean>; setReminderTime: (hour: number, minute: number) => Promise<boolean>;
  retry: () => Promise<boolean>; reset: () => Promise<boolean>;
};
type Dependencies = { repository: () => Promise<Pick<SaveRepository, 'loadAppSettings' | 'saveAppSettings'>> };
export function createPreferencesStore(deps: Dependencies) {
  return createStore<PreferencesState>((set, get) => {
    let failedWrite: AppSettings | null = null;
    const write = async (input: AppSettings) => {
      if (get().busy) return false;
      const current = get().settings;
      if (!get().loadFailed && current.appearance === input.appearance && current.reducedMotion === input.reducedMotion && current.haptics === input.haptics && current.soundEffects === input.soundEffects &&
        current.dailyReminder === input.dailyReminder && current.reminderHour === input.reminderHour && current.reminderMinute === input.reminderMinute && current.godModeEnabled === input.godModeEnabled) {
        failedWrite = null; set({ error: null }); return true;
      }
      set({ busy: true, error: null });
      try {
        const settings = appSettingsSchema.parse(input);
        // Optional fields keep existing version-1 appearance records readable without an eager rewrite.
        await (await deps.repository()).saveAppSettings(JSON.stringify({ version: settings.version, appearance: settings.appearance,
          ...(settings.reducedMotion ? { reducedMotion: true } : {}), ...(settings.haptics ? { haptics: true } : {}), ...(settings.soundEffects ? { soundEffects: true } : {}),
          ...(settings.dailyReminder ? { dailyReminder: true } : {}), ...(settings.reminderHour !== defaultAppSettings.reminderHour ? { reminderHour: settings.reminderHour } : {}),
          ...(settings.reminderMinute !== defaultAppSettings.reminderMinute ? { reminderMinute: settings.reminderMinute } : {}), ...(settings.godModeEnabled ? { godModeEnabled: true } : {}) }));
        failedWrite = null; set({ settings, ready: true, loadFailed: false }); return true;
      } catch {
        failedWrite = { ...input }; set({ error: 'Your app setting could not be saved. Try again.' }); return false;
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
          set({ loadFailed: true, error: 'Your app settings could not be read. Try again or restore the default appearance.' }); return false;
        } finally { set({ busy: false, ready: true }); }
      },
      setAppearance: appearance => !get().ready || get().loadFailed ? Promise.resolve(false) : write({ ...get().settings, appearance }),
      setReducedMotion: reducedMotion => !get().ready || get().loadFailed ? Promise.resolve(false) : write({ ...get().settings, reducedMotion }),
      setHaptics: haptics => !get().ready || get().loadFailed ? Promise.resolve(false) : write({ ...get().settings, haptics }),
      setSoundEffects: soundEffects => !get().ready || get().loadFailed ? Promise.resolve(false) : write({ ...get().settings, soundEffects }),
      setGodModeEnabled: godModeEnabled => !get().ready || get().loadFailed ? Promise.resolve(false) : write({ ...get().settings, godModeEnabled }),
      setDailyReminder: dailyReminder => !get().ready || get().loadFailed ? Promise.resolve(false) : write({ ...get().settings, dailyReminder }),
      setReminderTime: (reminderHour, reminderMinute) => !get().ready || get().loadFailed ? Promise.resolve(false) : write({ ...get().settings, reminderHour, reminderMinute }),
      retry: () => failedWrite ? write(failedWrite) : get().bootstrap(),
      reset: () => get().ready ? write(get().loadFailed ? { ...defaultAppSettings } : { ...get().settings, appearance: 'light' }) : Promise.resolve(false),
    };
  });
}
