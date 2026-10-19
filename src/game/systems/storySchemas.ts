import { z } from 'zod';
import { dateSchema } from '../calendar';
import { countryCodes } from '../countries';
import type { World } from '../model';
export const storyKinds = ['arcade-invitation', 'project-promise'] as const;
export type StoryKind = typeof storyKinds[number];
export const storyResolutionIds = ['attend', 'decline', 'complete', 'ask-help', 'leave-to-peer'] as const;
const currency = z.enum(['USD', 'CAD', 'GBP', 'AUD', 'EUR', 'BRL', 'INR', 'JPY', 'ZAR']);
export const storyThreadSchema = z.object({
  id: z.string(), kind: z.enum(storyKinds), personId: z.string(),
  originEventId: z.string(), originTemplateId: z.string(), originChoiceId: z.string(),
  created: dateSchema, dueMonth: z.number().int(), expiresMonth: z.number().int(),
  country: z.enum(countryCodes), city: z.string(), communityId: z.string(), peerId: z.string(), teacherId: z.string().nullable(), parentId: z.string().nullable(),
  status: z.enum(['scheduled', 'offered', 'resolved', 'cancelled']),
  permission: z.object({ personId: z.string(), trustAtRequest: z.number().int().min(0).max(100), chance: z.number().int().min(5).max(95), roll: z.number().int().min(1).max(100), accepted: z.boolean() }).nullable(),
  quote: z.object({ amount: z.bigint().nonnegative(), currency, payerId: z.string().nullable() }),
  offeredEventId: z.string().nullable(), resolution: z.enum(storyResolutionIds).nullable(),
  ended: dateSchema.nullable(), cancellationReason: z.string().nullable(), paidTransactionId: z.string().nullable(),
});
export type StoryThread = z.infer<typeof storyThreadSchema>;
export const storyScheduleSchema = z.object({
  kind: z.literal('schedule-story'), storyKind: z.enum(storyKinds), personId: z.string(), peerId: z.string(), teacherId: z.string().nullable(), parentId: z.string().nullable(), communityId: z.string(),
  originEventId: z.string(), originTemplateId: z.string(), originChoiceId: z.string(),
});
export const storyResolveSchema = z.object({ kind: z.literal('resolve-story'), threadId: z.string(), resolution: z.enum(storyResolutionIds) });
export type StorySchedule = z.infer<typeof storyScheduleSchema>;
export const storyThread = (world: World, id: string) => world.storyThreads.find(item => item.id === id);
