import { z } from 'zod';
import { earningsCurrencySchema } from './earningsSchemas';

export const storyTrustRoles = ['parent', 'peer', 'teacher', 'coworker', 'supervisor', 'friend', 'partner', 'child'] as const;
export type StoryTrustRole = typeof storyTrustRoles[number];
const delta = z.number().int().min(-100).max(100);
export const storyImmediateExtrasSchema = z.object({
  cash: z.number().int().min(-100000).max(100000).refine(value => value !== 0).optional(),
  workPerformance: delta.optional(), trust: z.partialRecord(z.enum(storyTrustRoles), delta).optional(),
  endFriendship: z.literal(true).optional(), loseJob: z.literal(true).optional(), publicImage: delta.optional(),
});
export type StoryImmediateExtras = z.infer<typeof storyImmediateExtrasSchema>;
export const storyImmediateSchema = z.object({
  kind: z.literal('story-immediate'), ruleVersion: z.literal(1), personId: z.string(),
  cash: z.object({ accountId: z.string(), currency: earningsCurrencySchema, minor: z.bigint().refine(value => value !== 0n), usdWhole: z.number().int().min(-100000).max(100000).refine(value => value !== 0), numerator: z.bigint().positive(), denominator: z.bigint().positive() }).optional(),
  work: z.object({ employmentId: z.string(), performance: delta.optional(), loseJob: z.literal(true).optional() }).optional(),
  trust: z.array(z.object({ role: z.enum(storyTrustRoles), otherId: z.string(), relationshipId: z.string(), contextId: z.string().optional(), label: z.string().min(1).max(240), delta })).min(1).max(8).optional(),
  endFriendship: z.object({ friendId: z.string(), relationshipId: z.string(), label: z.string().min(1).max(240) }).optional(),
  publicImage: delta.optional(),
});
export type StoryImmediateEffect = z.infer<typeof storyImmediateSchema>;
