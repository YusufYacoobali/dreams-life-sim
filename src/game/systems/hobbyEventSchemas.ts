import { z } from 'zod';
import { dateSchema } from '../calendar';
import { countryCodes } from '../countries';
import { hobbyKinds } from '../content/leisure';
import { hobbyEventApproaches } from '../content/hobbyEvents';
import { earningsCurrencySchema } from './earningsSchemas';
import { leisureConsentSchema } from './leisureSchemas';
const percent = z.number().int().min(0).max(100);
export const hobbyEventSchema = z.object({
  id: z.string(), personId: z.string(), hobbyId: z.string(), planId: z.string(), kind: z.enum(hobbyKinds), payerId: z.string(),
  date: dateSchema, country: z.enum(countryCodes), city: z.string(), currency: earningsCurrencySchema,
  approach: z.enum(hobbyEventApproaches), quotedFee: z.bigint().positive(), available: z.bigint().nonnegative(),
  consent: leisureConsentSchema, practiceCursor: z.number().int().nonnegative(), proficiency: percent, discipline: percent,
  chance: percent, roll: z.number().int().min(1).max(100).nullable(), recognized: z.boolean(), paid: z.bigint().nonnegative(),
  ledgerCursor: z.number().int().nonnegative(), paymentId: z.string().nullable(),
  effects: z.array(z.object({ stat: z.enum(['energy', 'happiness', 'stress', 'respect']), before: percent, after: percent })).max(4),
});
export type HobbyEvent = z.infer<typeof hobbyEventSchema>;
