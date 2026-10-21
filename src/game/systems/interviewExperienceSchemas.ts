import { z } from 'zod';

/** Present only on newly bound interviews; absence preserves the original policy. */
export const interviewExperienceSchema = z.object({
  policyVersion: z.literal(1), paidMonths: z.number().int().min(0).max(30),
  bonus: z.number().int().min(0).max(5), chance: z.number().int().min(15).max(95).nullable(),
});
