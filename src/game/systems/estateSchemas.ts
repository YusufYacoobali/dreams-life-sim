import { z } from 'zod';
import { dateSchema } from '../calendar';
const money = z.object({ minor: z.bigint(), currency: z.enum(['USD', 'CAD', 'GBP', 'AUD', 'EUR', 'BRL', 'INR', 'JPY', 'ZAR']) });
export const annualSchema = z.object({ id: z.string(), startDate: dateSchema, targetDate: dateSchema, monthsProcessed: z.number().int().min(0).max(12), stage: z.enum(['months', 'complete']), pausedForPlanning: z.boolean().default(false) });
export const willSchema = z.object({ personId: z.string(), updated: dateSchema, executorId: z.string(), shares: z.array(z.object({ personId: z.string(), bps: z.number().int().positive().max(10000) })).min(1), bequests: z.array(z.object({ assetId: z.string(), personId: z.string() })) });
export const estateSchema = z.object({
  id: z.string(), personId: z.string(), settled: dateSchema, netWorthAtDeath: money, propertiesAtDeath: z.number().int().nonnegative(), executorId: z.string().nullable(),
  fees: money, debtPaid: money, debtWrittenOff: money, tax: money,
  distributions: z.array(z.object({ personId: z.string(), cash: money, assets: z.array(z.string()), assetValue: money })),
  charity: money, notes: z.array(z.string()),
});
