import { z } from 'zod';
import { dateSchema } from '../calendar';
import { countryCodes } from '../countries';
import { businessKinds, businessLogoIds, businessOfferingIds } from '../content/businesses';
const currency = z.enum(['USD', 'CAD', 'GBP', 'AUD', 'EUR', 'BRL', 'INR', 'JPY', 'ZAR']);
export const businessSchema = z.object({
  id: z.string(), name: z.string().trim().min(1).max(50), kind: z.enum(businessKinds), ownerId: z.string().nullable(), founderId: z.string(), country: z.enum(countryCodes), city: z.string(), currency,
  offering: z.enum(businessOfferingIds).optional(), logo: z.enum(businessLogoIds).optional(),
  started: dateSchema, ended: dateSchema.nullable(), status: z.enum(['active', 'sold', 'failed', 'closed']), cash: z.bigint().nonnegative(), equipment: z.bigint().nonnegative(), costBasis: z.bigint().nonnegative(), ownerOperated: z.boolean(),
  locations: z.number().int().min(1).max(5), facilities: z.number().int().min(0).max(5), condition: z.number().int().min(0).max(100), reputation: z.number().int().min(0).max(100), priceBps: z.number().int().min(7500).max(15000), marketing: z.enum(['none', 'local', 'regional']),
  lastMonth: z.number().int(), distressMonths: z.number().int().nonnegative(), cumulativeProfit: z.bigint(), dividends: z.bigint().nonnegative(), monthsOperated: z.number().int().nonnegative(), provenance: z.array(z.string()),
  pendingExpenses: z.bigint().nonnegative(), pendingPayroll: z.bigint().nonnegative(), payoutBps: z.number().int().min(0).max(8000),
  staff: z.array(z.object({ personId: z.string(), employmentId: z.string(), role: z.enum(['worker', 'manager']), hired: dateSchema, ended: dateSchema.nullable() })),
  months: z.array(z.object({ month: z.number().int(), revenue: z.bigint().nonnegative(), expenses: z.bigint().nonnegative(), profit: z.bigint(), payroll: z.bigint().nonnegative(), tax: z.bigint().nonnegative(), cash: z.bigint().nonnegative(), customers: z.number().int().nonnegative(), offering: z.enum(businessOfferingIds).optional() })).max(60),
  archives: z.array(z.object({ year: z.number().int(), months: z.number().int().positive(), revenue: z.bigint().nonnegative(), expenses: z.bigint().nonnegative(), profit: z.bigint(), payroll: z.bigint().nonnegative(), tax: z.bigint().nonnegative() })),
});
export const businessPayableSchema = z.object({ id: z.string(), businessId: z.string(), creditorId: z.string().nullable(), employmentId: z.string().nullable(), kind: z.enum(['wages', 'supplier', 'tax']), currency, principal: z.bigint().nonnegative(), writtenOff: z.bigint().nonnegative() });
export const businessTransactionSchema = z.object({ id: z.string(), businessId: z.string(), personId: z.string().nullable(), employmentId: z.string().nullable().default(null), date: dateSchema, currency, cashDelta: z.bigint(), debtDelta: z.bigint(), payableId: z.string().nullable(), category: z.string(), description: z.string() });
