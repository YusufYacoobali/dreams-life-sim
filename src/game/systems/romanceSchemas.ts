import { z } from 'zod';
import { dateSchema } from '../calendar';

export const romanceActions = ['affair', 'end-affair', 'confess', 'confront', 'explain', 'forgive', 'reach-out', 'discuss', 'reconcile', 'decline-contact', 'allow-contact', 'share-betrayal', 'apologise-ex'] as const;
export const romanceCommandSchema = z.object({ type: z.literal('romance-action'), personId: z.string(), action: z.enum(romanceActions) });
export type RomanceCommand = z.infer<typeof romanceCommandSchema>;
export const affairSchema = z.object({
  id: z.string(), actorId: z.string(), partnerId: z.string(), loverId: z.string(), relationshipId: z.string(),
  started: dateSchema, ended: dateSchema.nullable(), endReason: z.enum(['ended', 'confessed', 'separated', 'death', 'distance']).nullable(),
  knownBy: z.array(z.string()).min(2).max(8), discovered: dateSchema.nullable(), discoveryReason: z.enum(['confession', 'witnessed']).nullable(),
});
export type Affair = z.infer<typeof affairSchema>;
export const romanceOfferKinds = ['proposal', 'breakup', 'space', 'divorce', 'discovery', 'story', 'ex'] as const;
export const romanceOfferSchema = z.object({
  id: z.string(), ruleVersion: z.literal(1), actorId: z.string(), personId: z.string(), relationshipId: z.string(),
  kind: z.enum(romanceOfferKinds), templateId: z.string(), offered: dateSchema, resolved: dateSchema.nullable(),
  affairId: z.string().nullable(), expectedRomance: z.enum(['none', 'teen-dating', 'dating', 'engaged', 'married', 'ex', 'widowed']),
  roll: z.number().int().min(1).max(100), choiceId: z.string().nullable(), outcome: z.string().nullable(), spaceUntilMonth: z.number().int().nullable(),
  ringId: z.string().nullable(),
  storyChoices: z.array(z.object({ id:z.string(), label:z.string(), body:z.string(), journal:z.string(), bond:z.number().int(), trust:z.number().int(), happiness:z.number().int(), stress:z.number().int() })).min(2).max(4).optional(),
});
export type RomanceOffer = z.infer<typeof romanceOfferSchema>;
export const romanceChoiceEffectSchema = z.object({ kind: z.literal('romance-choice'), ruleVersion: z.literal(1), offerId: z.string(), actorId: z.string(), personId: z.string(), relationshipId: z.string(), choiceId: z.string() });
export type RomanceChoiceEffect = z.infer<typeof romanceChoiceEffectSchema>;
