import { z } from 'zod';

export const dramaticEventIds = [
  'dramatic-boss-criminal', 'dramatic-double-fiance', 'dramatic-best-friend-secrets',
  'dramatic-child-exam-scam', 'dramatic-courtroom-defence', 'dramatic-cellmate-escape',
  'dramatic-accomplice-wire', 'dramatic-unpaid-employees', 'dramatic-suspicious-property',
  'dramatic-dishonest-sponsor', 'dramatic-funeral-stream', 'dramatic-dating-profile',
  'dramatic-election-scandal', 'dramatic-athlete-doping', 'dramatic-scandal-movie',
] as const;
export type DramaticEventId = typeof dramaticEventIds[number];
/** V1 binds an existing situation's identities and quote, never a future story. */
export const dramaticEffectSchema = z.object({
  kind: z.literal('dramatic-choice'), ruleVersion: z.literal(1), eventId: z.enum(dramaticEventIds),
  choiceId: z.string(), subjectId: z.string(), contextId: z.string().optional(),
  relatedId: z.string().optional(), otherId: z.string().optional(), quote: z.bigint().nonnegative().optional(),
});
export type DramaticEffect = z.infer<typeof dramaticEffectSchema>;
