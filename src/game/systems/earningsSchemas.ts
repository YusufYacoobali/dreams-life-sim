import { z } from 'zod';
import type { Currency } from '../money';

export const earningsCurrencySchema = z.enum(['USD', 'CAD', 'GBP', 'AUD', 'EUR', 'BRL', 'INR', 'JPY', 'ZAR']);
export const savedRateSchema = z.object({ numerator: z.bigint().positive(), denominator: z.bigint().positive() });
export const wageConversionSchema = z.object({ month: z.number().int(), native: z.bigint().positive(), reference: z.bigint().nonnegative(), rate: savedRateSchema });
export const workEarningsSchema = z.object({ currency: earningsCurrencySchema, normalizedGross: z.bigint().nonnegative(), conversions: z.array(wageConversionSchema) });
export const pensionReceiptSchema = z.object({
  month: z.number().int(), firstPeriod: z.number().int().nonnegative(), periods: z.number().int().positive(),
  sourceCurrency: earningsCurrencySchema, currency: earningsCurrencySchema, annualPay: z.bigint().positive(), nativeGross: z.bigint().nonnegative(), rate: savedRateSchema,
  gross: z.bigint().nonnegative(), fee: z.bigint().nonnegative(), withheld: z.bigint().nonnegative(),
  grossTransactionId: z.string().nullable(), feeTransactionId: z.string().nullable(), taxTransactionId: z.string().nullable(),
});
export const newWorkEarnings = (currency: Currency, gross = 0n): z.infer<typeof workEarningsSchema> => ({ currency, normalizedGross: gross, conversions: [] });
