import { z } from 'zod';

/** Small simulation-owned operations, frozen into new offers. No executable content. */
export const crimeStoryConsequenceSchema = z.enum(['investigation', 'named-rival', 'lieutenant', 'withdraw-role', 'leadership-objection', 'leadership-backing']);
export const prisonStoryConsequenceSchema = z.enum(['rivalry', 'repair', 'pledge-protection', 'assault', 'pause-visits', 'restore-contact', 'send-letter', 'work-suspension']);
export const romanceStoryConsequenceSchema = z.enum(['jealousy', 'repair-boundary', 'marriage-discussion', 'affair-discussion', 'temporary-space', 'no-contact', 'reconcile-request']);
export type CrimeStoryConsequence = z.infer<typeof crimeStoryConsequenceSchema>;
export type PrisonStoryConsequence = z.infer<typeof prisonStoryConsequenceSchema>;
export type RomanceStoryConsequence = z.infer<typeof romanceStoryConsequenceSchema>;
