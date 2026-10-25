import { isOwnedContinue, isOwnedReminder, localTimeZone, matchesReminder, planDailyReminders } from './reminderPlan';
import type { DailyReminderConfig, DailyReminderPermission, DailyReminderResult, ReminderAdapter, ReminderResponse } from './reminderPlan';
export type { DailyReminderConfig, DailyReminderPermission, DailyReminderResult } from './reminderPlan';

function unavailable(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  return code === 'REMINDERS_UNAVAILABLE' || code === 'ERR_UNAVAILABLE';
}
function failure(error: unknown): { status: 'unavailable' | 'error'; message: string } {
  return unavailable(error) ? { status: 'unavailable', message: 'Daily reminders require a supported installed app.' }
    : { status: 'error', message: 'Reminders could not be updated. Try again when the app is open.' };
}

/** A single FIFO protects enable/off/time changes; native state is re-read on every reconciliation, including cold starts. */
export function createDailyReminderService(dependencies: {
  loadAdapter: () => Promise<ReminderAdapter>; now?: () => Date; timeZone?: (now: Date) => string;
}) {
  let tail: Promise<void> = Promise.resolve();
  const delivered = new Set<string>();
  function serial<T>(job: () => Promise<T>): Promise<T> {
    const result = tail.then(job, job);
    tail = result.then(() => undefined, () => undefined);
    return result;
  }
  async function permission(request: boolean): Promise<DailyReminderPermission> {
    try {
      const adapter = await dependencies.loadAdapter();
      return await (request ? adapter.requestPermission() : adapter.getPermission());
    } catch (error) { return { ...failure(error), canAskAgain: false }; }
  }
  return {
    getDailyReminderPermission: () => serial(() => permission(false)),
    requestDailyReminderPermission: () => serial(() => permission(true)),
    reconcileDailyReminders: (config: DailyReminderConfig): Promise<DailyReminderResult> => {
      // Snapshot the caller's settings before queuing; subsequent edits cannot mutate this job.
      const requested = { ...config };
      return serial(async () => {
        try {
          const now = dependencies.now?.() ?? new Date();
          const wanted = planDailyReminders(requested, now, dependencies.timeZone?.(now) ?? localTimeZone(now));
          const adapter = await dependencies.loadAdapter(), scheduled = await adapter.scheduled();
          const owned = scheduled.filter(row => isOwnedReminder(row.identifier));
          const removeOwned = async () => { for (const id of new Set(owned.map(row => row.identifier))) await adapter.cancel(id); };
          if (!requested.enabled) { await removeOwned(); return { status: 'off' }; }
          const allowed = await adapter.getPermission(); // Reconciliation never opens a permission prompt.
          if (allowed.status !== 'granted') {
            await removeOwned();
            if (allowed.status === 'unavailable' || allowed.status === 'error') return { status: allowed.status, message: allowed.message };
            return { status: 'denied', message: allowed.message ?? 'Allow notifications to receive daily reminders.' };
          }
          // iOS supports 64 pending notifications in total. Never evict another feature's requests.
          if (scheduled.length - owned.length + wanted.length > 64) {
            await removeOwned();
            return { status: 'error', message: 'There is not enough notification space for daily reminders.' };
          }
          const desired = new Map(wanted.map(row => [row.identifier, row]));
          for (const id of new Set(owned.map(row => row.identifier))) {
            const rows = owned.filter(row => row.identifier === id), target = desired.get(id);
            if (rows.length !== 1 || !target || !matchesReminder(rows[0], target)) await adapter.cancel(id);
            else desired.delete(id);
          }
          for (const row of desired.values()) {
            const identifier = await adapter.schedule(row);
            if (identifier !== row.identifier) {
              await adapter.cancel(identifier); // This returned request was created by this call, not another feature.
              throw new Error('The reminder identifier was not retained.');
            }
          }
          return { status: 'scheduled' };
        } catch (error) { return failure(error); }
      });
    },
    subscribeToDailyReminderResponses: (onContinue: () => void): (() => void) => {
      let active = true, remove: (() => void) | undefined;
      const receive = (response: ReminderResponse | null) => {
        if (!active || !response || !isOwnedContinue(response)) return;
        const key = `${response.identifier}|${response.date}`;
        if (delivered.has(key)) return;
        delivered.add(key);
        if (delivered.size > 32) delivered.delete(delivered.values().next().value!);
        onContinue();
      };
      void dependencies.loadAdapter().then(async adapter => {
        if (!active) return;
        // Install first so a live response cannot fall into an initial-response loading gap.
        remove = adapter.onResponse(receive);
        receive(await adapter.initialResponse());
      }).catch(() => { /* Unsupported local notifications must not prevent ordinary startup. */ });
      return () => { active = false; remove?.(); };
    },
  };
}

let adapterPromise: Promise<ReminderAdapter> | undefined;
const service = createDailyReminderService({ loadAdapter: () => {
  adapterPromise ??= import('./expoReminderAdapter').then(module => module.createExpoReminderAdapter()).catch(error => {
    adapterPromise = undefined;
    throw error;
  });
  return adapterPromise;
} });
export const reconcileDailyReminders = service.reconcileDailyReminders;
export const getDailyReminderPermission = service.getDailyReminderPermission;
export const requestDailyReminderPermission = service.requestDailyReminderPermission;
export const subscribeToDailyReminderResponses = service.subscribeToDailyReminderResponses;
