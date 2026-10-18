import { z } from 'zod';
import { dateSchema } from '../calendar';
import { countryCodes } from '../countries';
import type { World } from '../model';
export const agendaIds = ['education', 'health', 'housing'] as const;
export const campaignEfforts = ['balanced', 'focused', 'publicity'] as const;
export const electionSchema = z.object({
    id: z.string(), country: z.enum(countryCodes), city: z.string(), currency: z.enum(['USD', 'CAD', 'GBP', 'AUD', 'EUR', 'BRL', 'INR', 'JPY', 'ZAR']), started: dateSchema, resolved: dateSchema.nullable(), electionMonth: z.number().int(), lastMonth: z.number().int(), months: z.number().int().min(0).max(6), status: z.enum(['campaign', 'completed']), responseRoll: z.number().int().min(1).max(100),
    priorities: z.object({ education: z.number().int().positive(), health: z.number().int().positive(), housing: z.number().int().positive() }), winnerId: z.string().nullable(), winningEmploymentId: z.string().nullable(),
    candidates: z.array(z.object({ personId: z.string(), platform: z.enum(agendaIds), effort: z.enum(campaignEfforts), status: z.enum(['active', 'withdrawn', 'disqualified', 'deceased']), registration: z.bigint().positive(), monthlyBudget: z.bigint().positive(), spent: z.bigint().nonnegative(), quotedAnnualPay: z.bigint().positive(), votesBps: z.number().int().min(0).max(10000), periods: z.array(z.object({ month: z.number().int(), funded: z.boolean(), spent: z.bigint().nonnegative(), score: z.number().int().min(0).max(100) })).max(6) })).length(2),
});
export const campaignCommitment = (world: World, personId = world.activePersonId) => world.elections.find(election => election.status === 'campaign' && election.candidates.some(item => item.personId === personId && item.status === 'active'));
