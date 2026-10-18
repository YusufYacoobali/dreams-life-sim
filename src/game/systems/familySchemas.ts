import { z } from 'zod';
import { dateSchema } from '../calendar';
export const genders = ['male', 'female', 'nonbinary'] as const;
export const relationKinds = ['parent', 'sibling', 'guardian', 'friend', 'acquaintance', 'partner', 'spouse', 'coworker', 'classmate'] as const;
export const relationshipSchema = z.object({
  id: z.string(), from: z.string(), to: z.string(), kind: z.enum(relationKinds), roles: z.array(z.enum(relationKinds)).min(1),
  romance: z.enum(['none', 'dating', 'engaged', 'married', 'ex', 'widowed']), since: dateSchema,
  parentType: z.enum(['biological', 'adoptive', 'guardian']).nullable(),
  strength: z.number().int().min(0).max(100), trust: z.number().int().min(0).max(100), memories: z.array(z.string()), lastInteractionYear: z.number().int(),
});
export const householdSchema = z.object({ id: z.string(), name: z.string(), members: z.array(z.string()).min(1), homeAssetId: z.string().nullable() });
const moneySchema = z.object({ minor: z.bigint(), currency: z.enum(['USD', 'CAD', 'GBP', 'AUD', 'EUR', 'BRL', 'INR', 'JPY', 'ZAR']) });
export const marriageSchema = z.object({
  id: z.string(), a: z.string(), b: z.string(), started: dateSchema, ended: dateSchema.nullable(), endReason: z.enum(['divorce', 'death']).nullable(),
  baselineA: moneySchema, baselineB: moneySchema, ledgerStart: z.number().int().nonnegative(), weddingCost: moneySchema.nullable(),
  excludedA: z.bigint().nonnegative().default(0n), excludedB: z.bigint().nonnegative().default(0n),
});
export const biologySchema = z.object({ role: z.enum(['carry', 'contribute', 'neither']), fertility: z.number().int().min(0).max(100) });
export const pregnancySchema = z.object({ id: z.string(), carrierId: z.string(), otherParentId: z.string(), conceived: dateSchema, due: dateSchema, status: z.enum(['pregnant', 'born', 'lost', 'ended-death']), childId: z.string().nullable(), ended: dateSchema.nullable() });
export const custodySchema = z.object({ id: z.string(), childId: z.string(), a: z.string(), b: z.string(), primaryId: z.string(), arrangement: z.enum(['shared', 'sole']), started: dateSchema, ended: dateSchema.nullable(), lastReviewYear: z.number().int() });
export function newFamilyPerson(gender: typeof genders[number]) {
  return { biology: { role: gender === 'female' ? 'carry' as const : gender === 'male' ? 'contribute' as const : 'neither' as const, fertility: 80 }, attractedTo: [...genders], wantsChildren: true, householdId: null as string | null };
}
