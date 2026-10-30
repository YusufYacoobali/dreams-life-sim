import { countryCodes } from '../countries';
import { z } from 'zod';
import { agencyTiers, industryStateSchema, creativeOfferSchema } from './creativeSchemas';
export const actingStyles = ['versatile', 'craft', 'popular'] as const;
export const actorProductionActionIds = ['prepare', 'stunt', 'improvise', 'reshoot', 'publicity', 'cooperate'] as const;
export const actorStateSchema = z.object({
  industry: industryStateSchema, boardCountry: z.enum(countryCodes), boardSeed: z.number().int().min(0).max(0xFFFFFFFF),
  savedBoards: z.array(z.object({ country: z.enum(countryCodes), season: z.number().int(), offers: z.array(creativeOfferSchema).max(8) })).max(9),
  credits: z.number().int().nonnegative(), leadingCredits: z.number().int().nonnegative(), hits: z.number().int().nonnegative(),
  nominations: z.number().int().nonnegative(), awards: z.number().int().nonnegative(), collapseCount: z.number().int().nonnegative(),
  comeback: z.boolean(), style: z.enum(actingStyles), lastStyleMonth: z.number().int().optional(),
});
export const actorCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('actor-enter') }).strict(),
  z.object({ type: z.literal('actor-refresh-offers') }).strict(),
  z.object({ type: z.literal('actor-agency'), tier: z.enum(agencyTiers), negotiate: z.boolean() }).strict(),
  z.object({ type: z.literal('actor-audition'), offerId: z.string(), quotedAnnualPay: z.bigint().nonnegative(), negotiate: z.boolean() }).strict(),
  z.object({ type: z.literal('actor-decline'), offerId: z.string() }).strict(),
  z.object({ type: z.literal('actor-production'), action: z.enum(actorProductionActionIds) }).strict(),
  z.object({ type: z.literal('actor-style'), style: z.enum(actingStyles) }).strict(),
]);
export type ActorState = z.infer<typeof actorStateSchema>;
export type ActorCommand = z.infer<typeof actorCommandSchema>;
export type ActorProductionAction = typeof actorProductionActionIds[number];
