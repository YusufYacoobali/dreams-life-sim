import { z } from 'zod';
import { dateSchema } from '../calendar';
import { countryCodes } from '../countries';
import { destinationIds } from '../content/travel';
import { fields } from './schemas';
import { earningsCurrencySchema, savedRateSchema } from './earningsSchemas';

const money = z.bigint().nonnegative();
export const relocationRoutes = ['settlement', 'work', 'study'] as const;
export const relocationPrograms = ['university', 'trade', 'graduate'] as const;
export const relocationConsentSchema = z.object({ personId: z.string(), forPersonId: z.string(), roll: z.number().int().min(1).max(100), chance: z.number().int().min(0).max(100), accepted: z.boolean() });
export const moveQuoteSchema = z.object({
  currency: earningsCurrencySchema, destinationCurrency: earningsCurrencySchema, reserveMonths: z.union([z.literal(3), z.literal(6)]), transport: money, tuition: money,
  sourceDebit: money, gross: money, fee: money, net: money, rate: savedRateSchema,
  reserves: z.array(z.object({ personId: z.string(), monthly: money, required: money, transfer: money })),
  taxes: z.array(z.object({ personId: z.string(), currency: earningsCurrencySchema, gross: money, withheld: money, adjustment: z.bigint() })),
});
export const relocationSchema = z.object({
  id: z.string(), personId: z.string(), destinationId: z.enum(destinationIds), originCountry: z.enum(countryCodes), originCity: z.string(), route: z.enum(relocationRoutes),
  applied: dateSchema, anchorDay: z.number().int().min(1).max(31), expires: dateSchema, status: z.enum(['approved', 'declined', 'moved']), roll: z.number().int().min(1).max(100), chance: z.number().int().min(0).max(100),
  applicationFee: money, applicationTransactionId: z.string(),
  job: z.object({ roleId: z.string(), employer: z.string(), annualPay: money }).nullable(),
  course: z.object({ program: z.enum(relocationPrograms), field: z.enum(fields), school: z.string(), tuition: money, requiredMonths: z.number().int().positive() }).nullable(),
  attempts: z.array(z.object({ date: dateSchema, participantIds: z.array(z.string()).min(1).max(12), consents: z.array(relocationConsentSchema), accepted: z.boolean() })),
  move: z.object({
    date: dateSchema, participantIds: z.array(z.string()).min(1).max(12), householdId: z.string(), quote: moveQuoteSchema,
    transactionIds: z.array(z.string()), employmentIds: z.array(z.string()), newEmploymentId: z.string().nullable(),
    support: z.array(z.object({ personId: z.string(), before: money, after: money, rate: savedRateSchema })),
  }).nullable(),
});
export type Relocation = z.infer<typeof relocationSchema>;
