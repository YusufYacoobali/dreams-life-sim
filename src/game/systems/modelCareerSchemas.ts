import { z } from 'zod';
import { countryCodes } from '../countries';
import { currencyDigits } from '../money';
import { dateSchema } from '../calendar';
import { agencyTiers, creativePercent, creativeOfferSchema, industryStateSchema } from './creativeSchemas';
export const modelSpecialisations = ['editorial', 'runway', 'commercial', 'luxury', 'lifestyle'] as const;
export type ModelSpecialisation = typeof modelSpecialisations[number];
export const modelBookingKinds = ['editorial', 'runway', 'advertising', 'designer', 'ambassador', 'luxury'] as const;
export const modelCareerStateSchema = z.object({
  version: z.literal(1), industry: industryStateSchema, boardCountry: z.enum(countryCodes), boards: z.array(z.object({ country: z.enum(countryCodes), season: z.number().int(), offers: z.array(creativeOfferSchema).max(8) })).max(countryCodes.length),
  portfolio: z.object({ editorial: creativePercent, runway: creativePercent, commercial: creativePercent, luxury: creativePercent, lifestyle: creativePercent }),
  specialisations: z.array(z.enum(modelSpecialisations)).min(1).max(3), professionalism: creativePercent,
  notableWork: z.array(z.object({ projectId: z.string(), title: z.string(), specialisation: z.enum(modelSpecialisations), currency: z.enum(Object.keys(currencyDigits) as [keyof typeof currencyDigits, ...(keyof typeof currencyDigits)[]]), quality: creativePercent, prestige: creativePercent, date: dateSchema, gross: z.bigint().nonnegative() })).max(24),
  brands: z.array(z.object({ id: z.string(), name: z.string(), sector: z.enum(modelSpecialisations), status: z.enum(['active', 'completed', 'breached', 'cancelled']), projectId: z.string(), currency: z.enum(Object.keys(currencyDigits) as [keyof typeof currencyDigits, ...(keyof typeof currencyDigits)[]]), started: z.number().int(), agreedFee: z.bigint().nonnegative(), penaltyLiabilityId: z.string().nullable(), lastFulfilledQuarter: z.number().int(), ends: z.number().int(), obligations: z.number().int().min(1).max(12), fulfilled: z.number().int().min(0).max(12), penaltyPaid: z.bigint().nonnegative(), negotiated: z.boolean() })).max(24),
  archivedBrands: z.number().int().nonnegative(), archivedWork: z.number().int().nonnegative(),
  lostRepresentation: z.boolean(), lastPortfolioQuarter: z.number().int(), lastBrandActionMonth: z.number().int(),
});
export type ModelCareerState = z.infer<typeof modelCareerStateSchema>;
export const modelCareerCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('model-enter') }).strict(),
  z.object({ type: z.literal('model-refresh-offers') }).strict(),
  z.object({ type: z.literal('model-agency'), tier: z.enum(agencyTiers), negotiate: z.boolean() }).strict(),
  z.object({ type: z.literal('model-casting'), offerId: z.string(), quotedAnnualPay: z.bigint().nonnegative() }).strict(),
  z.object({ type: z.literal('model-decline'), offerId: z.string() }).strict(),
  z.object({ type: z.literal('model-portfolio'), specialisation: z.enum(modelSpecialisations), style: z.enum(['self', 'professional']), quotedCost: z.bigint().nonnegative() }).strict(),
  z.object({ type: z.literal('model-specialise'), specialisations: z.array(z.enum(modelSpecialisations)).min(1).max(3) }).strict(),
  z.object({ type: z.literal('model-production'), projectId: z.string(), action: z.enum(['prepare', 'interpret', 'negotiate', 'publicity']) }).strict(),
  z.object({ type: z.literal('model-brand'), brandId: z.string(), action: z.enum(['fulfil', 'renegotiate', 'breach']), quotedCost: z.bigint().nonnegative() }).strict(),
]);
export type ModelCareerCommand = z.infer<typeof modelCareerCommandSchema>;
