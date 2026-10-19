import { z } from 'zod';
import { dateSchema } from '../calendar';
import { countryCodes } from '../countries';
import { assignmentKinds, serviceBranches, serviceKinds } from '../content/services';
import type { World } from '../model';
const percent=z.number().int().min(0).max(100),money=z.bigint().nonnegative();
export const serviceCareerSchema=z.object({
 id:z.string(),personId:z.string(),kind:z.enum(serviceKinds),branch:z.enum(serviceBranches),country:z.enum(countryCodes),currency:z.enum(['USD','CAD','GBP','AUD','EUR','BRL','INR','JPY','ZAR']),started:dateSchema,ended:dateSchema.nullable(),status:z.enum(['active','between','left','discharged','deceased']),employmentId:z.string().nullable(),lastMonth:z.number().int(),rank:z.number().int().min(0).max(3),focus:z.enum(['balanced','careful','focused']),contacts:z.array(z.string()),
 contracts:z.array(z.object({id:z.string(),employmentId:z.string(),currency:z.enum(['USD','CAD','GBP','AUD','EUR','BRL','INR','JPY','ZAR']),started:dateSchema,ended:dateSchema.nullable(),term:z.number().int().positive(),months:z.number().int().nonnegative(),quotedAnnualPay:money,trainingRequired:z.number().int().nonnegative(),trainingCalendar:z.number().int().nonnegative(),trainingScores:z.array(percent).max(24),examRoll:z.number().int().min(1).max(100),examDiscipline:percent.nullable(),trainingResult:z.enum(['pending','passed','failed','exempt']),qualifiedAt:dateSchema.nullable()})),
 periods:z.array(z.object({month:z.number().int(),contractId:z.string(),gross:money,phase:z.enum(['training','station','assignment']),attended:z.boolean(),score:percent})),
 assignments:z.array(z.object({id:z.string(),contractId:z.string(),kind:z.enum(assignmentKinds),location:z.string(),started:dateSchema,ended:dateSchema.nullable(),status:z.enum(['active','completed','failed','returned','cancelled','fatal']),responseRoll:z.number().int().min(1).max(100),quality:percent,units:z.number().int().nonnegative(),distinction:z.string().nullable(),periods:z.array(z.object({month:z.number().int(),attended:z.boolean(),score:percent,units:z.number().int().nonnegative(),riskRoll:z.number().int().min(1).max(10000),risk:z.enum(['none','injury','fatal']),focus:z.enum(['balanced','careful','focused'])})).max(6)})),
});
export const serviceCareer=(world:World,personId=world.activePersonId)=>world.serviceCareers.find(item=>item.personId===personId&&item.status==='active');
export const serviceAway=(world:World,personId=world.activePersonId)=>serviceCareer(world,personId)?.assignments.find(item=>item.status==='active');
export const serviceQualified=(career:World['serviceCareers'][number])=>career.contracts.some(item=>item.trainingResult==='passed');
/** Ordinary resignation, retirement and court removal end the same actual service contract. */
export function serviceContractEnded(world:World,employmentId:string){for(const career of world.serviceCareers.filter(item=>item.employmentId===employmentId)){
 const contract=career.contracts.find(item=>item.employmentId===employmentId)!;contract.ended={...world.date};career.employmentId=null;if(career.status==='active')career.status='left';career.ended={...world.date};for(const mission of career.assignments.filter(item=>item.status==='active')){mission.status='cancelled';mission.ended={...world.date};}
}}
