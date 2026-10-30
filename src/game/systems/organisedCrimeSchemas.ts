import { organisedMissionResultSchema } from './organisedMissionSchemas';
import { z } from "zod";
import { dateSchema } from "../calendar";
import { countryCodes } from "../countries";
import { crimeStoryConsequenceSchema } from './storyConsequenceSchemas';
export const organisationStyles = [
  "street-syndicate",
  "fraud-network",
  "smuggling-ring",
] as const;
export const crimeApproaches = ["cautious", "bold", "crew-led"] as const;
export const organisedRanks = [
  "Recruit",
  "Trusted Member",
  "Crew Leader",
  "Underboss",
  "Boss",
] as const;
const pct = z.number().int().min(0).max(100);
export const organisedCrimeStateSchema = z.object({
  rulesVersion: z.literal(1),
  worldId: z.string().regex(/^life_[a-zA-Z0-9_-]+$/),
  style: z.enum(organisationStyles),
  country: z.enum(countryCodes),
  city: z.string().min(1).max(80),
  rank: z.number().int().min(0).max(4),
  loyalty: pct,
  reputation: pct,
  completedJobs: z.number().int().nonnegative(),
  decisions: z.number().int().nonnegative(),
  leaderId: z.string(),
  suspended: z.boolean(),
  lastProcessedMonth: z.number().int(),
  members: z
    .array(
      z.object({
        personId: z.string(),
        loyalty: pct,
        ambition: pct,
        role: z.enum(["leader", "lieutenant", "member", "former"]),
        memories: z.array(z.string().max(180)).max(16),
      }),
    )
    .max(8),
  rivals: z
    .array(
      z.object({
        personId: z.string(),
        influence: pct,
        reputation: pct,
        resolved: z.boolean(),
        memories: z.array(z.string().max(180)).max(12),
      }),
    )
    .max(3),
  jobs: z
    .array(
      z.object({
        id: z.string(),
        category: z.string(),
        approach: z.enum(crimeApproaches),
        participantIds: z.array(z.string()).min(1).max(6),
        date: dateSchema,
        incidentId: z.string(),
        transactionId: z.string().nullable(),
        proceeds: z.bigint().nonnegative(),
        success: z.boolean(),
        mission: organisedMissionResultSchema.optional(),
      }),
    )
    .max(32),
  archivedJobs: z.number().int().nonnegative(),
  archivedCompleted: z.number().int().nonnegative(),
  archivedProceeds: z.bigint().nonnegative(),
  history: z
    .array(
      z.object({
        date: dateSchema,
        kind: z.string().max(60),
        personId: z.string().nullable(),
        text: z.string().max(260),
      }),
    )
    .max(64),
  seenStories: z.array(z.string()).max(20),
  lastStoryYear: z.number().int(),
  activeStory: z
    .object({
      rulesVersion: z.union([z.literal(1), z.literal(2)]),
      target: z.enum(['member', 'leader', 'rival']).optional(),
      choices: z
        .array(
          z.object({
            action: z.enum([
              "negotiate",
              "refuse",
              "expose",
              "support",
              "betray",
              "leave",
            ]),
            journal: z.string().max(300),
            title: z.string().max(120),
            body: z.string().max(1200),
            loyalty: z.number().int().min(-100).max(100),
            reputation: z.number().int().min(-100).max(100),
            member: z.number().int().min(-100).max(100),
            evidence: z.boolean().optional(),
            rival: z.number().int().min(-100).max(100).optional(),
            expel: z.boolean().optional(),
            consequence: crimeStoryConsequenceSchema.optional(),
          }),
        )
        .min(2)
        .max(4),
      id: z.string(),
      offerId: z.string(),
      personId: z.string(),
      roll: z.number().int().min(1).max(100),
      year: z.number().int(),
    })
    .nullable(),
});
export type OrganisedCrimeState = z.infer<typeof organisedCrimeStateSchema>;
export const organisedCrimeChoiceSchema = z
  .object({
    kind: z.literal("organised-choice"),
    gangId: z.string(),
    offerId: z.string(),
    storyId: z.string(),
    action: z.enum([
      "negotiate",
      "refuse",
      "expose",
      "support",
      "betray",
      "leave",
    ]),
  })
  .strict();
export const organisedCrimeCommandSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("organised-join"),
      style: z.enum(organisationStyles),
    })
    .strict(),
  z
    .object({
      type: z.literal("organised-refuse"),
      style: z.enum(organisationStyles),
    })
    .strict(),
  z
    .object({
      type: z.literal("organised-upgrade"),
      gangId: z.string(),
      style: z.enum(organisationStyles),
    })
    .strict(),
  z
    .object({
      type: z.literal("organised-mission"),
      gangId: z.string(),
      mission: z.string(),
      approach: z.enum(crimeApproaches),
    })
    .strict(),
  z
    .object({ type: z.literal("organised-promotion"), gangId: z.string() })
    .strict(),
  z
    .object({
      type: z.literal("organised-member"),
      gangId: z.string(),
      personId: z.string(),
      action: z.enum(["talk", "trust", "confront", "expel"]),
    })
    .strict(),
  z
    .object({
      type: z.literal("organised-recruit"),
      gangId: z.string(),
      personId: z.string(),
    })
    .strict(),
  z
    .object({
      type: z.literal("organised-rival"),
      gangId: z.string(),
      personId: z.string(),
      action: z.enum(["negotiate", "refuse", "betray"]),
    })
    .strict(),
  z
    .object({
      type: z.literal("organised-challenge"),
      gangId: z.string(),
      action: z.enum(["support", "challenge"]),
    })
    .strict(),
  z
    .object({ type: z.literal("organised-decision"), gangId: z.string() })
    .strict(),
  z.object({ type: z.literal("organised-leave"), gangId: z.string() }).strict(),
]);
export type OrganisedCrimeCommand = z.infer<typeof organisedCrimeCommandSchema>;
export type OrganisedCrimeChoice = z.infer<typeof organisedCrimeChoiceSchema>;
