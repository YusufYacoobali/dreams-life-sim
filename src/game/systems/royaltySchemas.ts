import { z } from 'zod';
import { dateSchema } from '../calendar';
import { royalCountries,royalFocuses } from '../content/royalty';
import type { World } from '../model';
const money=z.bigint().nonnegative(),count=z.number().int().nonnegative();
export const royalHouseSchema=z.object({
 id:z.string(),name:z.string(),country:z.enum(royalCountries),currency:z.enum(['GBP','JPY','EUR']),founderId:z.string(),headId:z.string().nullable(),regentId:z.string().nullable(),started:dateSchema,lastMonth:z.number().int(),
 members:z.array(z.object({personId:z.string(),hereditary:z.boolean(),joinedVia:z.enum(['founder','birth','marriage']),joined:dateSchema,ended:dateSchema.nullable(),status:z.enum(['active','renounced','left','deceased']),mode:z.enum(['public','private']),focus:z.enum(royalFocuses)})),
 successions:z.array(z.object({date:dateSchema,fromId:z.string().nullable(),toId:z.string().nullable(),reason:z.enum(['foundation','death','renunciation','background','vacancy'])})),
 records:z.array(z.object({personId:z.string(),year:z.number().int(),month:z.number().int().min(1).max(12),headId:z.string().nullable(),role:z.enum(['head','regent','heir','family','child']),attended:z.boolean(),score:z.number().int().min(0).max(100),engagements:count,annualPay:money,allowance:money})),
 archives:z.array(z.object({personId:z.string(),year:z.number().int(),role:z.enum(['head','regent','heir','family','child']),annualPay:money,monthsMask:z.number().int().min(1).max(4095),attendedMask:z.number().int().min(0).max(4095),months:count,attended:count,scoreTotal:count,engagements:count,allowance:money})),
});
export const royalMembership=(world:World,personId=world.activePersonId)=>{for(const house of world.royalHouses){const member=house.members.find(item=>item.personId===personId&&item.status==='active');if(member)return {house,member};}};
export const publicRoyalDuty=(world:World,personId=world.activePersonId)=>{const membership=royalMembership(world,personId);return membership?.member.mode==='public'?membership:undefined;};
