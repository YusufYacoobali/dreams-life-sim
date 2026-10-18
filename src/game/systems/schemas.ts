import { z } from 'zod';
import { dateSchema } from '../calendar';
import { instrumentIds } from '../content/markets';
const currency = z.enum(['USD', 'CAD', 'GBP', 'AUD', 'EUR', 'BRL', 'INR', 'JPY', 'ZAR']);
export const fields = ['business', 'computing', 'arts', 'medicine', 'law', 'science'] as const;
export const qualificationSchema = z.object({ level: z.enum(['secondary', 'trade', 'degree', 'medicine', 'law']), field: z.string(), year: z.number().int() });
export const educationSchema = z.object({
  stage: z.enum(['none', 'primary', 'secondary', 'trade', 'university', 'graduate']), field: z.string(), school: z.string(),
  months: z.number().int().nonnegative(), requiredMonths: z.number().int().nonnegative(), grades: z.number().int().min(0).max(100),
  effort: z.enum(['relaxed', 'balanced', 'focused']), funding: z.enum(['public', 'cash', 'loan']), tuition: z.bigint().nonnegative(), tuitionPaidMonths: z.number().int().nonnegative(), paused: z.boolean(),
  qualifications: z.array(qualificationSchema), lastStudyYear: z.number().int().nullable(),
});
export const employmentSchema = z.object({
  id: z.string(), roleId: z.string(), employer: z.string(), rank: z.number().int().min(0).max(3),
  annualPay: z.bigint().nonnegative(), paidMonths: z.number().int().nonnegative(), performance: z.number().int().min(0).max(100),
  effort: z.enum(['relaxed', 'balanced', 'hard']),
});
export const financeSchema = z.object({
  cycleGross: z.bigint().nonnegative(), cycleWithheld: z.bigint().nonnegative(), lifetimeGross: z.bigint().nonnegative(),
  serviceMonths: z.number().int().nonnegative(), pensionAnnual: z.bigint().nonnegative(), pensionMonths: z.number().int().nonnegative(),
});
export const liabilitySchema = z.object({
  id: z.string(), ownerId: z.string(), currency: z.enum(['USD', 'CAD', 'GBP', 'AUD', 'EUR', 'BRL', 'INR', 'JPY', 'ZAR']),
  kind: z.enum(['student', 'personal', 'living', 'tax', 'mortgage']), principal: z.bigint().nonnegative(), interestBps: z.number().int().min(0).max(5000),
  assetId: z.string().nullable().default(null), monthlyPayment: z.bigint().nonnegative().default(0n), remainingMonths: z.number().int().nonnegative().default(0), missedPayments: z.number().int().nonnegative().default(0),
});
export const physicalAssetSchema = z.object({
  id: z.string(), ownerId: z.string().nullable(), catalogId: z.string(), kind: z.enum(['property', 'vehicle', 'possession']), name: z.string(),
  country: z.enum(['US', 'CA', 'GB', 'AU', 'FR', 'DE', 'ES', 'IT', 'BR', 'IN', 'JP', 'ZA']), city: z.string(), currency,
  pricePaid: z.bigint().nonnegative(), costBasis: z.bigint().nonnegative(), value: z.bigint().nonnegative(), condition: z.number().int().min(0).max(100), ageMonths: z.number().int().nonnegative(), acquired: dateSchema,
  mortgageId: z.string().nullable(), primaryHome: z.boolean(), rental: z.enum(['none', 'listed', 'occupied']), rentPerMonth: z.bigint().nonnegative(), upkeepBps: z.number().int().nonnegative(), insured: z.boolean(),
  listing: z.object({ askingPrice: z.bigint().positive(), nextOfferMonth: z.number().int(), offer: z.bigint().positive().nullable(), offersMade: z.number().int().nonnegative() }).nullable(),
  provenance: z.array(z.string()),
});
export const holdingSchema = z.object({ id: z.string(), ownerId: z.string(), instrumentId: z.enum(instrumentIds), quantity: z.bigint().nonnegative(), costBasis: z.bigint().nonnegative(), currency });
export const marketSchema = z.object({
  propertyIndex: z.number().int().min(100).max(10000000),
  fx: z.record(currency, z.object({ numerator: z.bigint().positive(), denominator: z.bigint().positive() })),
  prices: z.record(z.enum(instrumentIds), z.object({ minor: z.bigint().positive(), history: z.array(z.object({ year: z.number().int(), month: z.number().int().min(1).max(12), minor: z.bigint().positive() })).min(1).max(60) })),
});
export const transactionSchema = z.object({
  id: z.string(), personId: z.string(), accountId: z.string(), liabilityId: z.string().nullable(), year: z.number().int(), month: z.number().int().min(1).max(12),
  currency: z.enum(['USD', 'CAD', 'GBP', 'AUD', 'EUR', 'BRL', 'INR', 'JPY', 'ZAR']),
  cashDelta: z.bigint(), debtDelta: z.bigint(), category: z.string(), description: z.string(),
});
export const newEducation = (): z.infer<typeof educationSchema> => ({ stage: 'none', field: '', school: '', months: 0, requiredMonths: 0, grades: 50, effort: 'balanced', funding: 'public', tuition: 0n, tuitionPaidMonths: 0, paused: false, qualifications: [], lastStudyYear: null });
export const newFinance = (): z.infer<typeof financeSchema> => ({ cycleGross: 0n, cycleWithheld: 0n, lifetimeGross: 0n, serviceMonths: 0, pensionAnnual: 0n, pensionMonths: 0 });
