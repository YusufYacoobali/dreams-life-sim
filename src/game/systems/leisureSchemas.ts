import { z } from 'zod';
import { dateSchema } from '../calendar';
import { countryCodes } from '../countries';
import { hobbyKinds, hobbyModes, outingKinds } from '../content/leisure';
import { earningsCurrencySchema } from './earningsSchemas';
import type { World } from '../model';
const percent = z.number().int().min(0).max(100), money = z.bigint().nonnegative();
export const leisureConsentSchema = z.object({ strength: percent.nullable(), chance: percent, roll: z.number().int().min(1).max(100), accepted: z.boolean() });
export const leisureEffectSchema = z.object({ stat: z.enum(['happiness', 'stress', 'energy', 'smarts', 'music']), before: percent, after: percent });
export const hobbyPlanSchema = z.object({ id: z.string(), payerId: z.string(), country: z.enum(countryCodes), city: z.string(), currency: earningsCurrencySchema, mode: z.enum(hobbyModes), monthlyFee: money, consent: leisureConsentSchema, started: dateSchema, ended: dateSchema.nullable(), endReason: z.string().nullable(), status: z.enum(['active', 'declined', 'stopped', 'moved', 'died', 'payer-lost', 'adult-review']), lastMonth: z.number().int() });
export const hobbySchema = z.object({
  id: z.string(), personId: z.string(), kind: z.enum(hobbyKinds), proficiency: percent, plans: z.array(hobbyPlanSchema),
  practices: z.array(z.object({ sequence: z.number().int().nonnegative(), planId: z.string(), date: dateSchema, source: z.enum(['monthly', 'manual']), attended: z.boolean(), reason: z.enum(['away', 'restricted', 'health', 'fatigue', 'payer-away', 'funds', 'career-training']).nullable(), before: percent, gain: z.number().int().min(0).max(4), after: percent, due: money, available: money, paid: money, paymentId: z.string().nullable(), ledgerCursor: z.number().int().nonnegative(), effects: z.array(leisureEffectSchema) })).max(5000),
});
export const outingSchema = z.object({ id: z.string(), personId: z.string(), payerId: z.string(), kind: z.enum(outingKinds), date: dateSchema, country: z.enum(countryCodes), city: z.string(), currency: earningsCurrencySchema, participants: z.array(z.string()).min(1).max(2), quotedTotal: money, available: money, consent: leisureConsentSchema, paid: money, paymentId: z.string().nullable(), outcome: z.number().int().min(1).max(3).nullable(), effects: z.array(leisureEffectSchema) });
export type Hobby = z.infer<typeof hobbySchema>;
export type HobbyPlan = z.infer<typeof hobbyPlanSchema>;
export type LeisureEffect = z.infer<typeof leisureEffectSchema>;
export const activeHobbyPlan = (hobby: Hobby) => hobby.plans.find(plan => plan.status === 'active');
export const personHobbies = (world: World, personId = world.activePersonId) => world.hobbies.filter(hobby => hobby.personId === personId);
