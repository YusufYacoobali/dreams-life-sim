import { z } from 'zod';
import { dateSchema } from '../calendar';

export const prisonActionIds = ['talk', 'befriend', 'insult', 'intimidate', 'apologise', 'offer-protection', 'ask-protection', 'exchange-favours', 'report', 'challenge', 'repair'] as const;
const percent = z.number().int().min(0).max(100);
export const prisonStoryEffectSchema = z.object({ kind: z.literal('prison-story'), prisonLifeId: z.string(), sceneId: z.string(), choiceId: z.string() });
const storyChangeSchema = z.object({ conduct: z.number().int().min(-30).max(30), bond: z.number().int().min(-30).max(30), trust: z.number().int().min(-30).max(30), stress: z.number().int().min(-20).max(20), standing: z.number().int().min(-20).max(20), health: z.number().int().min(-15).max(0) });
export const prisonSceneSchema = z.object({
  id: z.string(), templateId: z.string(), ruleVersion: z.literal(1), sentenceId: z.string(), personId: z.string(), participantId: z.string().nullable(), offered: dateSchema, resolved: dateSchema.nullable(),
  title: z.string().max(80), body: z.string().max(700), choices: z.array(z.object({ id: z.string(), label: z.string().max(80), body: z.string().max(700), journal: z.string().max(500), changes: storyChangeSchema })).min(2).max(4),
  status: z.enum(['offered', 'resolved', 'cancelled']), choiceId: z.string().nullable(),
});
export const prisonLifeSchema = z.object({
  id: z.string(), personId: z.string(), sentenceId: z.string(), standing: percent, influence: percent, loyalty: percent,
  contacts: z.array(z.object({ personId: z.string(), favours: z.number().int().min(-5).max(5), protection: z.enum(['none', 'offered', 'received']), rivalry: z.boolean(), reported: z.boolean(), memories: z.array(z.string().max(120)).max(16) })).max(12),
  interactions: z.array(z.object({ id: z.string(), personId: z.string(), action: z.enum(prisonActionIds), date: dateSchema, accepted: z.boolean(), discipline: z.number().int().nonnegative() })).max(96),
  familyContacts: z.array(z.object({ id: z.string(), personId: z.string(), action: z.enum(['visit', 'letter', 'support']), date: dateSchema, accepted: z.boolean(), amount: z.bigint().nonnegative(), transactionIds: z.array(z.string()).max(2) })).max(48),
  scenes: z.array(prisonSceneSchema).max(40), seenStoryIds: z.array(z.string()).max(25), lastStoryYear: z.number().int(),
});
export const prisonCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('prison-action'), personId: z.string(), action: z.enum(prisonActionIds) }),
  z.object({ type: z.literal('prison-family-contact'), personId: z.string(), action: z.enum(['visit', 'letter', 'support']) }),
  z.object({ type: z.literal('prison-group'), action: z.enum(['join', 'contribute', 'promote', 'dispute', 'leave', 'betray']) }),
]);
export type PrisonCommand = z.infer<typeof prisonCommandSchema>;
export type PrisonLife = z.infer<typeof prisonLifeSchema>;
export type PrisonScene = z.infer<typeof prisonSceneSchema>;
export type PrisonStoryEffect = z.infer<typeof prisonStoryEffectSchema>;
