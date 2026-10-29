import { z } from 'zod';
import { dateSchema } from '../calendar';
import { conditionIds } from '../content/health';
import type { GameDate } from '../calendar';
const currency = z.enum(['USD', 'CAD', 'GBP', 'AUD', 'EUR', 'BRL', 'INR', 'JPY', 'ZAR']);
export const routineSchema = z.object({ exercise: z.enum(['none', 'walking', 'gym', 'sport']), diet: z.enum(['balanced', 'nutritious', 'fast-food', 'restrictive']), sleep: z.enum(['regular', 'short', 'restful']), mindfulness: z.boolean(), smoking: z.boolean(), drinking: z.enum(['none', 'moderate', 'heavy']) });
export const medicalEpisodeSchema = z.object({ notified: z.boolean(), assessed: z.boolean(), admissionAt: dateSchema.nullable(), stabilized: z.boolean() });
export const newMedicalEpisode = (): z.infer<typeof medicalEpisodeSchema> => ({ notified: false, assessed: false, admissionAt: null, stabilized: false });
export const healthSchema = z.object({
  familyRisks: z.array(z.enum(conditionIds)),
  routine: routineSchema, providerId: z.string().nullable(), hospitalizedUntil: z.number().int().nullable(), vaccinations: z.array(z.object({ id: z.enum(['routine', 'seasonal']), date: dateSchema, expiresMonth: z.number().int() })),
  conditions: z.array(z.object({ id: z.string(), type: z.enum(conditionIds), onset: dateSchema, severity: z.number().int().min(0).max(100), status: z.enum(['active', 'controlled', 'recovered']), diagnosed: dateSchema.nullable(), resolved: dateSchema.nullable(), months: z.number().int().nonnegative(), lastEmergencyYear: z.number().int().nullable(), episode: medicalEpisodeSchema, treatment: z.object({ method: z.enum(['support', 'rehabilitation', 'medication', 'therapy', 'specialist', 'rehab']), started: dateSchema, months: z.number().int().nonnegative(), outcome: z.enum(['effective', 'limited', 'side-effect']), paid: z.bigint().nonnegative(), currency, lastPaymentMonth: z.number().int() }).nullable() })),
  records: z.array(z.object({ id: z.string(), date: dateSchema, providerId: z.string().nullable(), kind: z.string(), text: z.string(), cost: z.bigint().nonnegative(), currency, paidMinor: z.bigint().nonnegative(), paidCurrency: currency, payerId: z.string(), conditionId: z.string().nullable() })),
  lastMonth: z.number().int(),
});
export const newHealth = (month: number): z.infer<typeof healthSchema> => ({ familyRisks: [], routine: { exercise: 'none', diet: 'balanced', sleep: 'regular', mindfulness: false, smoking: false, drinking: 'none' }, providerId: null, hospitalizedUntil: null, vaccinations: [], conditions: [], records: [], lastMonth: month });
export const hospitalized = (world: { date: GameDate }, person: { health: z.infer<typeof healthSchema> }) => person.health.hospitalizedUntil !== null && world.date.year * 12 + world.date.month - 1 <= person.health.hospitalizedUntil;
