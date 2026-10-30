import { z } from 'zod';
export const missionOutcomeIds = ['quiet-profit', 'exposed-profit', 'costly-respect', 'rival-advance', 'victim-complaint', 'public-scandal', 'collapsed-scheme', 'cargo-confiscation', 'associate-betrayal'] as const;
export const organisedMissionResultSchema = z.object({
  rulesVersion: z.literal(2), outcome: z.enum(missionOutcomeIds),
  loss: z.bigint().nonnegative(), lossTransactionId: z.string().nullable(), proceedsTransactionId: z.string().nullable(),
  victimId: z.string().nullable(), victimTransactionId: z.string().nullable(),
  rivalId: z.string().nullable(), memberId: z.string().nullable(), scandalId: z.string().nullable(),
  cargo: z.object({ id: z.string(), description: z.string().max(100), status: z.enum(['delivered', 'confiscated', 'lost']) }).nullable(),
  crew: z.array(z.object({ personId: z.string(), loyalty: z.number().int().min(45).max(100), skill: z.number().int().min(0).max(100) })).max(5),
  successChance: z.number().int().min(20).max(90),
  reputationDelta: z.number().int().min(-100).max(100),
  title: z.string().max(120), body: z.string().max(1500),
});
/** Prospective assignment facts; old Underground Job incidents have no such field. */
export const organisedMissionIncidentSchema = z.object({
  rulesVersion: z.literal(2), gangId: z.string(), jobId: z.string(), category: z.string(),
  style: z.enum(['street-syndicate', 'fraud-network', 'smuggling-ring']),
  outcome: z.enum(missionOutcomeIds), participantIds: z.array(z.string()).min(1).max(6),
  title: z.string().max(120), body: z.string().max(1500),
  result: organisedMissionResultSchema,
});
export type OrganisedMissionIncident = z.infer<typeof organisedMissionIncidentSchema>;
export type OrganisedMissionResult = z.infer<typeof organisedMissionResultSchema>;
