import { z } from 'zod';
import { dateSchema } from '../calendar';
export const creativeKinds = ['actor', 'model'] as const;
export type CreativeKind = typeof creativeKinds[number];
export const agencyTiers = ['independent', 'boutique', 'major'] as const;
export const creativePercent = z.number().int().min(0).max(100);
const month = z.number().int(), money = z.bigint().nonnegative();
export const representationSchema = z.object({
  tier: z.enum(agencyTiers), agentId: z.string().nullable(), commissionBps: z.number().int().min(0).max(3000), rapport: creativePercent,
  failures: z.number().int().nonnegative(), history: z.array(z.object({ tier: z.enum(agencyTiers), agentId: z.string().nullable(), commissionBps: z.number().int().min(0).max(3000), started: dateSchema, ended: dateSchema.nullable(), reason: z.string() })).max(24), archived: z.number().int().nonnegative(),
});
export const creativeOfferSchema = z.object({
  id: z.string(), title: z.string(), category: z.string(), genre: z.string(), role: z.string(),
  annualPay: money, months: z.number().int().min(1).max(12), prestige: creativePercent, popularity: creativePercent, difficulty: creativePercent, risk: creativePercent,
  minSkill: creativePercent, minReputation: creativePercent, minAgency: z.number().int().min(0).max(2), exclusivity: z.boolean(),
  auditionRoll: z.number().int().min(1).max(100), negotiationRoll: z.number().int().min(1).max(100), expires: month,
  status: z.enum(['open', 'rejected', 'accepted', 'declined']),
});
export const creativeReleaseSchema = z.object({ critical: creativePercent, audience: creativePercent, commercial: z.enum(['flop', 'modest', 'hit', 'blockbuster']), nomination: z.boolean(), fame: z.number().int(), reputation: z.number().int(), summary: z.string() });
export const creativeProjectSchema = z.object({
  kind: z.enum(creativeKinds), offerId: z.string(), category: z.string(), genre: z.string(), role: z.string(), term: z.number().int().min(1).max(12),
  prestige: creativePercent, popularity: creativePercent, risk: creativePercent, exclusivity: z.boolean(),
  commissionBps: z.number().int().min(0).max(3000), agentId: z.string().nullable(), processedGross: money, commissionPaid: money, commissionTransactions: z.array(z.string()).max(12),
  referenceCurrency: z.enum(['USD','CAD','GBP','AUD','EUR','BRL','INR','JPY','ZAR']), normalizedGross: money, normalizedCommission: money,
  commissionConversions: z.array(z.object({ transactionId: z.string(), reference: money, numerator: z.bigint().positive(), denominator: z.bigint().positive() })).max(12),
  preparation: creativePercent, qualityBonus: z.number().int().min(-50).max(50), publicity: z.number().int().min(-50).max(50),
  criticRoll: z.number().int().min(1).max(100), audienceRoll: z.number().int().min(1).max(100),
  choices: z.array(z.object({ id: z.string(), choice: z.string(), month, note: z.string() })).max(12), release: creativeReleaseSchema.nullable(),
});
export const industryStateSchema = z.object({
  version: z.literal(1), representation: representationSchema, contacts: z.record(z.string(), z.string()),
  board: z.array(creativeOfferSchema).max(8), boardSeason: month,
  decision: z.object({ id: z.string(), storyId: z.string(), projectId: z.string().nullable(), offeredMonth: month }).nullable(),
  seenStories: z.array(z.string()).max(32), lastDecisionQuarter: month, decisionCount: z.number().int().nonnegative(),
  milestones: z.array(z.string()).max(32), completed: z.number().int().nonnegative(), totalGross: money, totalCommission: money,
  bookingHoldUntil: month,
  opportunityBoost: z.number().int().min(-30).max(30), archivedProjects: z.number().int().nonnegative(),
});
export const creativeImpactSchema = z.object({
  reputation: z.number().int().min(-100).max(100).optional(), quality: z.number().int().min(-100).max(100).optional(), publicity: z.number().int().min(-100).max(100).optional(), relationship: z.number().int().min(-100).max(100).optional(),
  stress: z.number().int().min(-100).max(100).optional(), health: z.number().int().min(-100).max(100).optional(), publicImage: z.number().int().min(-100).max(100).optional(), portfolio: z.number().int().min(-100).max(100).optional(),
  payBps: z.number().int().min(-5000).max(5000).optional(), costBps: z.number().int().min(0).max(10000).optional(), commissionBps: z.number().int().min(-3000).max(3000).optional(), agencyRisk: z.number().int().min(-100).max(100).optional(), opportunity: z.number().int().min(-100).max(100).optional(), obligation: z.number().int().min(-12).max(12).optional(), leaveAgency: z.boolean().optional(),
}).strict();
export const creativeChoiceEffectSchema = z.object({ kind: z.literal('creative-choice'), careerId: z.string(), decisionId: z.string(), choiceId: z.string(), snapshot: z.object({ version: z.literal(1), storyId: z.string(), title: z.string(), contactId: z.string(), projectId: z.string().nullable(), cost: z.object({ minor: z.bigint().nonnegative(), currency: z.enum(['USD','CAD','GBP','AUD','EUR','BRL','INR','JPY','ZAR']) }), impact: creativeImpactSchema }).strict() }).strict();
export type CreativeOffer = z.infer<typeof creativeOfferSchema>;
export type CreativeProject = z.infer<typeof creativeProjectSchema>;
export type IndustryState = z.infer<typeof industryStateSchema>;
export type Representation = z.infer<typeof representationSchema>;
export type CreativeChoiceEffect = z.infer<typeof creativeChoiceEffectSchema>;
export const creativeMonthNumber = (world: { date: { year: number; month: number } }) => world.date.year * 12 + world.date.month - 1;
export const newIndustryState = (): IndustryState => ({ version: 1, representation: { tier: 'independent', agentId: null, commissionBps: 0, rapport: 55, failures: 0, history: [], archived: 0 }, contacts: {}, board: [], boardSeason: -1, decision: null, seenStories: [], lastDecisionQuarter: -1, decisionCount: 0, milestones: [], completed: 0, totalGross: 0n, totalCommission: 0n, bookingHoldUntil: -1, opportunityBoost: 0, archivedProjects: 0 });
