import { z } from 'zod';

export const dateSchema = z.object({ year: z.number().int().positive().max(999999), month: z.number().int().min(1).max(12), day: z.number().int().min(1).max(31) }).refine(date => date.day <= daysInMonth(date.year, date.month), 'Invalid calendar date');
export type GameDate = z.infer<typeof dateSchema>;

export function daysInMonth(year: number, month: number): number {
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}
/** Preserve the original anchor, so a leap-day life returns to February 29. */
export function monthFrom(start: GameDate, months: number, anchorDay = start.day): GameDate {
  const index = start.year * 12 + start.month - 1 + months;
  const year = Math.floor(index / 12);
  const month = index % 12 + 1;
  return { year, month, day: Math.min(anchorDay, daysInMonth(year, month)) };
}
