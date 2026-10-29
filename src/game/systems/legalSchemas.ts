import { z } from 'zod';
import { dateSchema } from '../calendar';
import { countryCodes } from '../countries';
import { offenceIds } from '../content/crime';
import type { World, Person } from '../model';
const money = z.object({ minor: z.bigint().nonnegative(), currency: z.enum(['USD', 'CAD', 'GBP', 'AUD', 'EUR', 'BRL', 'INR', 'JPY', 'ZAR']) });
export const personLegalSchema = z.object({ wanted: z.boolean(), aliases: z.array(z.string().min(1).max(60)).max(5), crimeSkill: z.number().int().min(0).max(100), gangId: z.string().nullable() });
export const newLegal = (): z.infer<typeof personLegalSchema> => ({ wanted: false, aliases: [], crimeSkill: 0, gangId: null });
export const incidentSchema = z.object({
  id: z.string(), personId: z.string(), offence: z.enum(offenceIds), date: dateSchema, country: z.enum(countryCodes), city: z.string(),
  victimId: z.string().nullable(), victimKilled: z.boolean(), gain: money, restitution: money,
  evidence: z.number().int().min(0).max(100), detectionRoll: z.number().int().min(1).max(10000), followupRoll: z.number().int().min(1).max(100), trialRoll: z.number().int().min(1).max(100),
  riskBps: z.number().int().min(0).max(10000), investigateMonth: z.number().int(), stage: z.enum(['hidden', 'charged', 'closed']), caseId: z.string().nullable(),
});
export const caseSchema = z.object({
  id: z.string(), incidentId: z.string(), personId: z.string(), offence: z.enum(offenceIds), country: z.enum(countryCodes), city: z.string(), opened: dateSchema, hearing: dateSchema,
  status: z.enum(['awaiting-trial', 'acquitted', 'convicted', 'dismissed', 'abated']), detained: z.boolean(), bail: money, bailState: z.enum(['unpaid', 'held', 'returned', 'forfeited']),
  counsel: z.enum(['public', 'private', 'self']), counselFee: money, counselPaid: z.boolean(), evidence: z.number().int().min(0).max(100), trialRoll: z.number().int().min(1).max(100),
  baseMonths: z.number().int().nonnegative(), quotedFine: money, plea: z.enum(['guilty', 'not-guilty', 'leniency']).nullable(), resolved: dateSchema.nullable(),
  fine: money, fineDebtId: z.string().nullable(), fineRefunded: z.boolean(), sentenceMonths: z.number().int().nonnegative(), sentenceId: z.string().nullable(), juvenile: z.boolean(), cooperation: z.boolean(),
});
export const prisonRoutineSchema = z.object({ work: z.boolean(), study: z.boolean(), exercise: z.boolean(), conduct: z.enum(['quiet', 'social', 'gang']) });
export const sentenceSchema = z.object({
  id: z.string(), personId: z.string(), caseIds: z.array(z.string()).min(1), country: z.enum(countryCodes), city: z.string(), facility: z.string(), started: dateSchema,
  totalMonths: z.number().int().positive(), servedMonths: z.number().int().nonnegative(), creditedMonths: z.number().int().nonnegative(), lastServedMonth: z.number().int(),
  state: z.enum(['active', 'released', 'escaped', 'death']), ended: dateSchema.nullable(), behavior: z.number().int().min(0).max(100), routine: prisonRoutineSchema,
  studyMonths: z.number().int().nonnegative(), appealRoll: z.number().int().min(1).max(100), appealed: z.boolean(), releaseReason: z.enum(['served', 'parole', 'appeal', 'death']).nullable(),
});
export const remandSchema = z.object({ personId: z.string(), month: z.number().int(), caseIds: z.array(z.string()).min(1), usedBySentenceId: z.string().nullable() });
export const contrabandSchema = z.object({ id: z.string(), personId: z.string(), kind: z.enum(['counterfeit-watch', 'false-id', 'illicit-substance']), acquired: dateSchema, pricePaid: money, value: money, status: z.enum(['owned', 'sold', 'consumed', 'seized']), alias: z.string().nullable() });
export const gangSchema = z.object({ id: z.string(), personId: z.string(), name: z.string(), kind: z.enum(['street', 'prison']), sentenceId: z.string().nullable(), joined: dateSchema, left: dateSchema.nullable(), rank: z.number().int().min(0).max(3), standing: z.number().int().min(0).max(100), contactIds: z.array(z.string()), lastIncomeMonth: z.number().int() });
export const activeSentence = (world: World, personId = world.activePersonId) => world.sentences.find(item => item.personId === personId && item.state === 'active');
export function isConfined(world: World, person: Person | string = world.activePersonId): boolean {
  const id = typeof person === 'string' ? person : person.id;
  return !!world.people[id] && !world.people[id].died && (!!activeSentence(world, id) || world.cases.some(item => item.personId === id && item.status === 'awaiting-trial' && item.detained));
}
