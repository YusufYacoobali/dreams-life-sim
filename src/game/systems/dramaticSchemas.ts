import { z } from 'zod';

export const dramaticEventIds = [
  'dramatic-boss-criminal', 'dramatic-double-fiance', 'dramatic-best-friend-secrets',
  'dramatic-child-exam-scam', 'dramatic-courtroom-defence', 'dramatic-cellmate-escape',
  'dramatic-accomplice-wire', 'dramatic-unpaid-employees', 'dramatic-suspicious-property',
  'dramatic-dishonest-sponsor', 'dramatic-funeral-stream', 'dramatic-dating-profile',
  'dramatic-election-scandal', 'dramatic-athlete-doping', 'dramatic-scandal-movie',
] as const;
export type DramaticEventId = typeof dramaticEventIds[number];
/** Saved V1 choices retain their original rules; new dinner/doping choices use V2. */
export const dramaticEffectSchema = z.object({
  kind: z.literal('dramatic-choice'), ruleVersion: z.union([z.literal(1), z.literal(2)]), eventId: z.enum(dramaticEventIds),
  choiceId: z.string(), subjectId: z.string(), contextId: z.string().optional(),
  copyVersion: z.literal(25).optional(),
  relatedId: z.string().optional(), otherId: z.string().optional(), quote: z.bigint().nonnegative().optional(),
});
export type DramaticEffect = z.infer<typeof dramaticEffectSchema>;
