import { z } from 'zod';
import { dateSchema } from '../calendar';
export const personActionIds = ['insult','distance','ask-advice','ask-permission','ask-activity','request-gift','praise','scold','ask-help'] as const;
export type PersonAction = typeof personActionIds[number];
export const personActionCommandSchema = z.discriminatedUnion('type', [
  z.object({type:z.literal('person-action'),lifeId:z.string(),actorId:z.string(),personId:z.string(),action:z.enum(personActionIds)}),
]);
export type PersonActionCommand = z.infer<typeof personActionCommandSchema>;
export const personActionRecordSchema = z.object({
  id:z.string(),actorId:z.string(),targetId:z.string(),relationshipId:z.string(),action:z.enum(personActionIds),date:dateSchema,
  outcome:z.enum(['completed','approved','declined']),chance:z.number().int().min(0).max(100),roll:z.number().int().min(1).max(100),
  assetId:z.string().nullable(),transactionId:z.string().nullable(),permissionId:z.string().nullable(),
});
export const personActionKey = (actor:string,target:string,action:PersonAction,year:number) => actor+':person-action:'+target+':'+action+':'+year;
