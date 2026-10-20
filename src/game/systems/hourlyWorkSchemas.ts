import { z } from 'zod';
import { dateSchema } from '../calendar';
import { countryCodes } from '../countries';
import { earningsCurrencySchema } from './earningsSchemas';

export const hourlyHours = [8, 12, 20] as const;
export const hourlyTermsSchema = z.object({ hourlyRate: z.bigint().positive(), weeklyHours: z.union([z.literal(8), z.literal(12), z.literal(20)]), paidWeeks: z.literal(52) });
export type HourlyTerms = z.infer<typeof hourlyTermsSchema>;
export const hourlyRaiseSchema = z.object({ hourlyRateBefore: z.bigint().positive(), hourlyRateAfter: z.bigint().positive(), weeklyHours: z.union([z.literal(8), z.literal(12), z.literal(20)]), paidWeeks: z.literal(52) });
export const hourlyContractSchema = z.object({
  employmentId: z.string(), personId: z.string(), roleId: z.enum(['shop-assistant-part', 'cafe-part']), country: z.enum(countryCodes), currency: earningsCurrencySchema, started: dateSchema,
  terms: hourlyTermsSchema,
  rates: z.array(z.object({ kind: z.enum(['raise', 'promotion']), date: dateSchema, firstPeriod: z.number().int().nonnegative(), hourlyRateBefore: z.bigint().positive(), hourlyRateAfter: z.bigint().positive(), rankBefore: z.number().int().min(0).max(3), rankAfter: z.number().int().min(0).max(3), raiseId: z.string().nullable() })),
  periods: z.array(z.object({ date: dateSchema, firstPeriod: z.number().int().nonnegative(), periods: z.number().int().positive(), hourlyRate: z.bigint().positive(), factorBps: z.union([z.literal(5000), z.literal(10000)]), attendance: z.enum(['worked', 'paid-leave', 'hospital', 'background']), paidMinutes: z.number().int().nonnegative(), workedMinutes: z.number().int().nonnegative(), gross: z.bigint().nonnegative(), transactionId: z.string().nullable() })),
});
export type HourlyContract = z.infer<typeof hourlyContractSchema>;
