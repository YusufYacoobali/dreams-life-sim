export type DailyReminderConfig = Readonly<{ enabled: boolean; hour: number; minute: number }>;
export type DailyReminderResult = { status: 'scheduled' | 'off' | 'denied' | 'unavailable' | 'error'; message?: string };
export type DailyReminderPermission = { status: 'granted' | 'undetermined' | 'denied' | 'unavailable' | 'error'; canAskAgain: boolean; message?: string };
export type WeeklyReminderTrigger = { weekday: number; hour: number; minute: number };
export type PlannedReminder = {
  identifier: string; title: string; body: string;
  data: Record<string, string | number>;
  trigger: WeeklyReminderTrigger;
};
export type ScheduledReminder = {
  identifier: string; title: string | null; body: string | null;
  data: unknown; trigger: WeeklyReminderTrigger | null;
};
export type ReminderResponse = { identifier: string; date: number; defaultAction: boolean; data: unknown };
export interface ReminderAdapter {
  getPermission(): Promise<DailyReminderPermission>;
  requestPermission(): Promise<DailyReminderPermission>;
  scheduled(): Promise<ScheduledReminder[]>;
  cancel(identifier: string): Promise<void>;
  schedule(reminder: PlannedReminder): Promise<string>;
  onResponse(listener: (response: ReminderResponse) => void): () => void;
  initialResponse(): Promise<ReminderResponse | null>;
}

export const DEFAULT_REMINDER_HOUR = 19;
export const DEFAULT_REMINDER_MINUTE = 0;
export const REMINDER_PREFIX = 'dreams.daily-reminder.v1.weekday.';
export const REMINDER_OWNER = 'dreams.daily-reminder.v1';
export const REMINDER_MESSAGES = [
  'Your next chapter is ready whenever you are.',
  'A little time for a life with different possibilities.',
  'Continue your story at your own pace.',
  'Take a moment to see where your choices lead.',
  'There is room for another chapter when it suits you.',
  'Spend a little time with the life you are building.',
  'A quiet moment for your next choice.',
  'A different life, a few new possibilities.',
  'Pick up your story whenever you feel like playing.',
  'What would you like to do next in Dreams?',
  'Make a little room for imagination today.',
  'Your story can continue with one small choice.',
  'Try a new direction, or enjoy the path you have chosen.',
  'Settle in for a chapter of your own.',
  'A few minutes, a different perspective.',
  'Continue building a life one choice at a time.',
  'Return to Dreams when you have a moment to spare.',
  'Choose your own pace and your own next step.',
  'A story to return to, whenever you like.',
  'Where might your next chapter take you?',
  'Enjoy a little time in another life.',
  'Your next choice is yours to make.',
  'Take your story in a direction that interests you.',
  'There is always another way to imagine a life.',
  'A moment of play, on your own terms.',
  'Return for the choices, stay for the story.',
  'Find a comfortable moment for Dreams.',
  'Let your next chapter unfold at your own pace.',
] as const;

export function isOwnedReminder(identifier: string): boolean { return identifier.startsWith(REMINDER_PREFIX); }
export function isOwnedContinue(response: ReminderResponse): boolean {
  const data = response.data as Record<string, unknown> | null;
  return isOwnedReminder(response.identifier) && response.defaultAction && !!data
    && data.owner === REMINDER_OWNER && data.action === 'continue';
}
export function localTimeZone(now: Date): string {
  let name = '';
  try { name = Intl.DateTimeFormat().resolvedOptions().timeZone ?? ''; } catch { /* Older native Intl may omit the zone. */ }
  return `${name}|${now.getTimezoneOffset()}`;
}

/** Seven local weekly repeats never expire. Content rotates only when the app reconciles in a new local week. */
export function planDailyReminders(config: DailyReminderConfig, now = new Date(), zone = localTimeZone(now)): PlannedReminder[] {
  if (!config.enabled) return [];
  if (!Number.isInteger(config.hour) || config.hour < 0 || config.hour > 23
    || !Number.isInteger(config.minute) || config.minute < 0 || config.minute > 59 || !Number.isFinite(now.getTime())) {
    throw new Error('Choose a valid local reminder time.');
  }
  const day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
  const week = Math.floor((day + 4) / 7), bank = ((week % 4) + 4) % 4;
  return Array.from({ length: 7 }, (_, index) => ({
    identifier: REMINDER_PREFIX + (index + 1), title: 'Dreams', body: REMINDER_MESSAGES[bank * 7 + index],
    data: { owner: REMINDER_OWNER, action: 'continue', weekday: index + 1, hour: config.hour, minute: config.minute, bank, zone },
    trigger: { weekday: index + 1, hour: config.hour, minute: config.minute },
  }));
}

export function matchesReminder(existing: ScheduledReminder, wanted: PlannedReminder): boolean {
  const data = existing.data as Record<string, unknown> | null;
  return existing.identifier === wanted.identifier && existing.title === wanted.title && existing.body === wanted.body
    && existing.trigger?.weekday === wanted.trigger.weekday && existing.trigger.hour === wanted.trigger.hour
    && existing.trigger.minute === wanted.trigger.minute && !!data
    && Object.entries(wanted.data).every(([key, value]) => data[key] === value);
}
