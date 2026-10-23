import { z } from 'zod';
import { hourlyTermsSchema } from './systems/hourlyWorkSchemas';
import { skillIds } from './content/careers';
import { storyScheduleSchema, storyResolveSchema } from './systems/storySchemas';
import { interviewExperienceSchema } from './systems/interviewExperienceSchemas';
import { dramaticEffectSchema } from './systems/dramaticSchemas';
import { storyImmediateSchema } from './systems/storyImmediateSchemas';

export const statKeys = ['happiness', 'health', 'smarts', 'looks', 'respect', 'energy', 'fitness', 'stress', 'discipline', 'fame'] as const;
export const effectSchema = z.discriminatedUnion('kind', [
  storyScheduleSchema, storyResolveSchema, dramaticEffectSchema, storyImmediateSchema,
  z.object({ kind: z.literal('job-interview'), personId: z.string(), roleId: z.string(), employer: z.string().min(1).max(160), annualPay: z.bigint().nonnegative(), hourly: hourlyTermsSchema.optional(), experience: interviewExperienceSchema.optional(), copyVersion: z.literal(18).optional(), answerId: z.enum(['careful', 'rush', 'avoid', 'withdraw']) }),
  z.object({ kind: z.literal('school-grade'), personId: z.string(), communityId: z.string(), delta: z.number().int().min(-100).max(100) }),
  z.object({ kind: z.literal('skill'), personId: z.string(), skill: z.enum(skillIds), delta: z.number().int().min(-100).max(100) }),
  z.object({ kind: z.literal('stat'), personId: z.string(), stat: z.enum(statKeys), delta: z.number().int().min(-100).max(100) }),
  z.object({ kind: z.literal('relationship'), relationshipId: z.string(), delta: z.number().int().min(-100).max(100) }),
  z.object({ kind: z.literal('pet-bond'), petId: z.string(), personId: z.string(), delta: z.number().int().min(-100).max(100) }),
  z.object({ kind: z.literal('transfer'), fromAccountId: z.string(), toAccountId: z.string(), minor: z.bigint().nonnegative() }),
  z.object({ kind: z.literal('asset-sale'), assetId: z.string(), minor: z.bigint().positive() }),
  z.object({ kind: z.literal('decline-sale'), assetId: z.string() }),
  z.object({ kind: z.literal('connect-person'), personId: z.string() }),
  z.object({ kind: z.literal('emergency-care'), personId: z.string(), conditionId: z.string(), accepted: z.boolean(), quotedCost: z.bigint().nonnegative() }),
  z.object({ kind: z.literal('legal-bail'), caseId: z.string() }),
  z.object({ kind: z.literal('legal-remand'), caseId: z.string() }),
  z.object({ kind: z.literal('legal-plea'), caseId: z.string(), plea: z.enum(['guilty', 'not-guilty', 'leniency']) }),
  z.object({ kind: z.literal('brand-decision'), sponsorId: z.string(), accepted: z.boolean() }),
  z.object({ kind: z.literal('public-response'), controversyId: z.string(), response: z.enum(['apologise', 'clarify', 'ignore']) }),
]);
export type Effect = z.infer<typeof effectSchema>;
export const effectRowSchema = z.object({ id: z.string(), label: z.string(), value: z.string(), tone: z.enum(['positive', 'negative', 'neutral']) });
export type RuntimeEffectRow = z.infer<typeof effectRowSchema>;
export const storyParticipantSchema = z.object({ personId:z.string().min(1).max(160), name:z.string().min(1).max(240), role:z.string().min(1).max(80) });
export type StoryParticipant = z.infer<typeof storyParticipantSchema>;
const participants = z.array(storyParticipantSchema).min(1).max(12).optional();
export const choiceSchema = z.object({
  id: z.string(), label: z.string(), effects: z.array(effectSchema),
  // Saved only for new ambiguous bindings; absent on all earlier choices.
  relationshipLabels: z.array(z.object({ relationshipId: z.string().min(1).max(160), label: z.string().min(1).max(240) })).min(1).max(8).optional(),
  disabledReason: z.string().optional(),
  resultTitle: z.string(), resultBody: z.string(), journal: z.string(),
}).superRefine((choice, context) => {
  const seen = new Set<string>();
  for (const [index, row] of (choice.relationshipLabels ?? []).entries()) {
    if (seen.has(row.relationshipId) || !choice.effects.some(effect => effect.kind === 'relationship' && effect.relationshipId === row.relationshipId)) context.addIssue({ code: 'custom', path: ['relationshipLabels', index], message: 'A display label must identify one of this choice’s relationship effects exactly once' });
    seen.add(row.relationshipId);
  }
});
export type BoundChoice = z.infer<typeof choiceSchema>;
export const pendingSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('decision'), id: z.string(), templateId: z.string(), title: z.string(), body: z.string(), illustration: z.string(), personIds: z.array(z.string()), choices: z.array(choiceSchema).min(2).max(4), participants }),
  z.object({ kind: z.literal('result'), id: z.string(), title: z.string(), body: z.string(), illustration: z.string(), effects: z.array(effectRowSchema), participants }),
]);
export type Pending = z.infer<typeof pendingSchema>;
