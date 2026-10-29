import { z } from 'zod';
import { dateSchema } from '../calendar';
import { earningsCurrencySchema } from './earningsSchemas';

const percent = z.number().int().min(0).max(100);
export const personSupportCommandSchema = z.discriminatedUnion('type', [
  z.object({ type:z.literal('ask-person-support'),lifeId:z.string(),actorId:z.string(),personId:z.string(),kind:z.enum(['money','loan']),amount:z.bigint().positive(),currency:earningsCurrencySchema }),
  z.object({ type:z.literal('respond-person-loan'),lifeId:z.string(),actorId:z.string(),requestId:z.string(),accept:z.boolean() }),
]);
export type PersonSupportCommand = z.infer<typeof personSupportCommandSchema>;
export const personSupportRequestSchema = z.object({
  id:z.string(),ruleVersion:z.literal(1),actorId:z.string(),targetId:z.string(),relationshipId:z.string(),
  kind:z.enum(['money','loan']),requested:z.bigint().positive(),offered:z.bigint().nonnegative(),currency:earningsCurrencySchema,
  proposed:dateSchema,expires:dateSchema,strength:percent,trust:percent,actorAge:z.number().int().nonnegative(),targetAge:z.number().int().nonnegative(),
  generosity:z.number().int().min(-30).max(30),parent:z.boolean(),available:z.bigint().nonnegative(),owed:z.bigint().nonnegative(),
  chance:z.number().int().min(5).max(95),roll:z.number().int().min(1).max(100),
  outcome:z.enum(['gift','partial','loan-offered','refused','annoyed']),status:z.enum(['completed','offered','accepted','declined','expired']),
  interestBps:z.literal(0),resolved:dateSchema.nullable(),liabilityId:z.string().nullable(),
  debitId:z.string().nullable(),creditId:z.string().nullable(),
});
export type PersonSupportRequest = z.infer<typeof personSupportRequestSchema>;
export const supportAttemptKey = (actor:string,target:string,year:number) => actor+':person-support:'+target+':'+year;
export const supportChanceV1 = (row:Pick<PersonSupportRequest,'strength'|'trust'|'generosity'|'parent'|'actorAge'|'owed'|'requested'|'available'>) =>
  Math.max(5,Math.min(95,Math.round(20+row.strength*.45+row.trust*.2+row.generosity+(row.parent&&row.actorAge<18?12:0)-(row.owed>0n?25:0)-(row.requested>row.available/2n?20:0))));
