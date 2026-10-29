import { z } from 'zod';
import { dateSchema } from '../calendar';
import { countryCodes } from '../countries';

/** Authored compatibility rules, not a claim of unobserved score deterioration. */
export const npcSeparationChanceV1 = (strength: number, trust: number) => Math.min(25, Math.max(5, Math.floor((100 - Math.min(strength, trust)) / 4)));
export const npcSeparationAtRiskV1 = (strength: number, trust: number) => strength < 50 || trust < 50;
// Freeze the current authored country-pack adult thresholds for old V1 facts.
export const npcSeparationAdultAgesV1 = { US: 18, CA: 18, GB: 18, AU: 18, FR: 18, DE: 18, ES: 18, IT: 18, BR: 18, IN: 18, JP: 18, ZA: 18 } as const;
export const npcSeparationAttemptKey = (year: number) => 'npc-separation:' + year;
const score = z.number().int().min(0).max(100);
export const npcSeparationSchema = z.object({
  id: z.string(), ruleVersion: z.literal(1), courtshipId: z.string(), relationshipId: z.string(), a: z.string(), b: z.string(),
  observerId: z.string(), observerPartnerId: z.string().nullable(), date: dateSchema,
  countryA: z.enum(countryCodes), countryB: z.enum(countryCodes), city: z.string().min(1),
  strength: score, trust: score, chance: z.number().int().min(5).max(25), roll: z.number().int().min(1).max(100),
  outcome: z.enum(['continued', 'separated']),
});
export type NpcSeparation = z.infer<typeof npcSeparationSchema>;
