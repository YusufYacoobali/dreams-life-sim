import { z } from 'zod';
import type { World } from '../model';
import { dateSchema } from '../calendar';
import { countryCodes } from '../countries';
export const creatorKinds=['youtuber','streamer'] as const;
export const creatorRoles=['editor','moderator'] as const;
const currency=z.enum(['USD','CAD','GBP','AUD','EUR','BRL','INR','JPY','ZAR']);
export const creatorStudioSchema=z.object({
  id:z.string(),personId:z.string(),accountId:z.string(),kind:z.enum(creatorKinds),country:z.enum(countryCodes),city:z.string(),currency,started:dateSchema,ended:dateSchema.nullable(),status:z.enum(['active','left','deceased']),focus:z.enum(['part-time','full-time']),laptopId:z.string().nullable(),cameraId:z.string().nullable(),useCrew:z.boolean(),lastWorkMonth:z.number().int(),lastNoticeMonth:z.number().int().nullable(),warningReason:z.string().nullable(),
  crew:z.array(z.object({id:z.string(),personId:z.string(),role:z.enum(creatorRoles),hired:dateSchema,ended:dateSchema.nullable(),currency,feePerPost:z.bigint().positive(),agencyFee:z.bigint().nonnegative()})),
});
export const creatorInvoiceSchema=z.object({studioId:z.string(),crewId:z.string(),year:z.number().int(),month:z.number().int().min(1).max(12).nullable(),currency,posts:z.number().int().positive(),firstPost:z.number().int().nonnegative(),lastPost:z.number().int().nonnegative(),paid:z.bigint().positive()});
export const fullTimeCreator=(world:World,personId=world.activePersonId)=>world.creatorStudios.find(item=>item.personId===personId&&item.status==='active'&&item.focus==='full-time');
export const studioForAccount=(world:World,accountId:string)=>world.creatorStudios.find(item=>item.accountId===accountId&&item.status==='active');
