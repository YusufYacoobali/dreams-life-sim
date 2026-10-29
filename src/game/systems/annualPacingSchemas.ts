import { z } from 'zod';
import { dateSchema } from '../calendar';

/** Frozen V1 scheduled decisions; manual activities/results do not create load. */
export const importantDecisionTemplatesV1 = [
  'medical-emergency', 'arrest', 'court-hearing', 'public-controversy',
  'brand-offer', 'property-sale-offer', 'story-arcade-invitation',
  'story-project-promise', 'story-project-recall',
] as const;
export type ImportantDecisionTemplate = typeof importantDecisionTemplatesV1[number];
export const annualPacingSchema = z.object({
  ruleVersion: z.literal(1),
  decisions: z.array(z.object({
    eventId: z.string().min(1), templateId: z.enum(importantDecisionTemplatesV1), personId: z.string(), date: dateSchema,
    journalIndex: z.number().int().nonnegative(),
  })).max(3),
});
/** Authored optional-scene odds, not playtest measurements or national rules. */
export const optionalSceneChancesV1 = Object.freeze([78, 50, 25, 10] as const);
