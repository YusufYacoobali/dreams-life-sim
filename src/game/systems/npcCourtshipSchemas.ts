import { z } from 'zod';
import { dateSchema } from '../calendar';
import { countryCodes } from '../countries';
import { earningsCurrencySchema } from './earningsSchemas';

const percent = z.number().int().min(0).max(100);
const money = z.object({ minor: z.bigint(), currency: earningsCurrencySchema });
export const npcCourtshipSchema = z.object({
  id: z.string(), relationshipId: z.string(), a: z.string(), b: z.string(),
  observedSince: dateSchema, lastChecked: dateSchema,
  observedCountryA: z.enum(countryCodes), observedCountryB: z.enum(countryCodes),
  ended: dateSchema.nullable(), endReason: z.enum(['separated', 'death', 'player-controlled']).nullable(),
  marriageId: z.string().nullable(),
  proposals: z.array(z.object({
    date: dateSchema, country: z.enum(countryCodes), city: z.string(), currency: earningsCurrencySchema,
    fee: z.bigint().positive(), shareA: z.bigint().positive(), shareB: z.bigint().positive(),
    availableA: z.bigint().nonnegative(), availableB: z.bigint().nonnegative(),
    wealthA: money, wealthB: money, trust: percent, chance: percent,
    rollA: z.number().int().min(1).max(100), rollB: z.number().int().min(1).max(100), accepted: z.boolean(),
    ledgerCursor: z.number().int().nonnegative(), paymentAId: z.string().nullable(), paymentBId: z.string().nullable(), marriageId: z.string().nullable(),
  })),
});
export type NpcCourtship = z.infer<typeof npcCourtshipSchema>;
export const npcWeddingChance = (trust: number) => Math.min(90, 40 + Math.floor(trust / 2));
