import { z } from 'zod';

export const statKeys = ['happiness', 'health', 'smarts', 'looks', 'respect', 'energy', 'fitness', 'stress', 'discipline', 'fame'] as const;
export const effectSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('stat'), personId: z.string(), stat: z.enum(statKeys), delta: z.number().int().min(-100).max(100) }),
  z.object({ kind: z.literal('relationship'), relationshipId: z.string(), delta: z.number().int().min(-100).max(100) }),
  z.object({ kind: z.literal('transfer'), fromAccountId: z.string(), toAccountId: z.string(), minor: z.bigint().nonnegative() }),
]);
export type Effect = z.infer<typeof effectSchema>;
export const effectRowSchema = z.object({ id: z.string(), label: z.string(), value: z.string(), tone: z.enum(['positive', 'negative', 'neutral']) });
export type RuntimeEffectRow = z.infer<typeof effectRowSchema>;
export const choiceSchema = z.object({
  id: z.string(), label: z.string(), effects: z.array(effectSchema),
  resultTitle: z.string(), resultBody: z.string(), journal: z.string(),
});
export type BoundChoice = z.infer<typeof choiceSchema>;
export const pendingSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('decision'), id: z.string(), templateId: z.string(), title: z.string(), body: z.string(), illustration: z.string(), personIds: z.array(z.string()), choices: z.array(choiceSchema).min(2).max(4) }),
  z.object({ kind: z.literal('result'), id: z.string(), title: z.string(), body: z.string(), illustration: z.string(), effects: z.array(effectRowSchema) }),
]);
export type Pending = z.infer<typeof pendingSchema>;
