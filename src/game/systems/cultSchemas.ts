import { z } from 'zod';
import type { World } from '../model';
import { dateSchema } from '../calendar';
import { countryCodes } from '../countries';
import {
  cultCeremonyIds,
  cultDoctrineIds,
  cultFoundingMethods,
  cultHeadquartersIds,
  cultMemberRoles,
  cultPhilosophies,
  cultRecruitmentIds,
  cultRuleIds,
  cultUpgradeIds,
} from '../content/cults';
import { cultClaimIds } from '../content/cultClaims';
const pct = z.number().int().min(0).max(100),
  month = z.number().int(),
  money = z.bigint().nonnegative();
const name = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .refine(
    (value) => !/[\u0000-\u001F\u007F]/.test(value),
    'Use a readable name',
  );
export const cultPhilosophyIds = cultPhilosophies.map((row) => row.id);
export const cultCurrencySchema = z.enum([
  'USD',
  'CAD',
  'GBP',
  'AUD',
  'EUR',
  'BRL',
  'INR',
  'JPY',
  'ZAR',
]);
export const cultChoiceEffectSchema = z
  .object({
    kind: z.literal('cult-choice'),
    cultId: z.string(),
    threadId: z.string(),
    offerId: z.string(),
    choiceId: z.string().min(1).max(40),
    claimRevision: z.literal(2).optional(),
  })
  .strict();
export const cultCommandSchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('found-cult'),
      name,
      leaderTitle: name,
      philosophy: z.enum(cultPhilosophyIds),
      doctrines: z.array(z.enum(cultDoctrineIds)).length(2),
      rules: z.array(z.enum(cultRuleIds)).length(2),
      headquarters: z.enum(cultHeadquartersIds),
      method: z.enum(cultFoundingMethods),
      joiningFee: money,
      recurringFee: money,
      quotedCost: money,
    })
    .strict(),
  z
    .object({
      type: z.literal('cult-recruit'),
      cultId: z.string(),
      method: z.enum(cultRecruitmentIds),
      quotedCost: money,
    })
    .strict(),
  z.object({ type: z.literal('cult-preach'), cultId: z.string() }).strict(),
  z
    .object({
      type: z.literal('cult-ceremony'),
      cultId: z.string(),
      ceremony: z.enum(cultCeremonyIds),
      quotedCost: money,
    })
    .strict(),
  z
    .object({
      type: z.literal('cult-beliefs'),
      cultId: z.string(),
      leaderTitle: name,
      philosophy: z.enum(cultPhilosophyIds),
      doctrines: z.array(z.enum(cultDoctrineIds)).min(2).max(6),
      rules: z.array(z.enum(cultRuleIds)).min(2).max(6),
    })
    .strict(),
  z
    .object({
      type: z.literal('cult-claim'),
      cultId: z.string(),
      claim: z.enum(cultClaimIds),
      approach: z.enum(['double-down', 'explain', 'viewing']),
    })
    .strict(),
  z
    .object({
      type: z.literal('cult-member'),
      cultId: z.string(),
      personId: z.string(),
      action: z.enum([
        'talk',
        'praise',
        'promote',
        'assign',
        'reward',
        'confront',
        'expel',
      ]),
      role: z.enum(cultMemberRoles).optional(),
      quotedCost: money.optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal('cult-fill-vacancy'),
      cultId: z.string(),
      personId: z.string(),
      role: z.enum(cultMemberRoles),
      quotedCost: money,
    })
    .strict(),
  z
    .object({
      type: z.literal('cult-headquarters'),
      cultId: z.string(),
      headquarters: z.enum(cultHeadquartersIds),
      quotedCost: money,
    })
    .strict(),
  z
    .object({
      type: z.literal('cult-upgrade'),
      cultId: z.string(),
      upgrade: z.enum(cultUpgradeIds),
      quotedCost: money,
    })
    .strict(),
  z
    .object({
      type: z.literal('cult-fees'),
      cultId: z.string(),
      joiningFee: money,
      recurringFee: money,
    })
    .strict(),
  z
    .object({
      type: z.literal('cult-contribute'),
      cultId: z.string(),
      amount: money.positive(),
    })
    .strict(),
  z
    .object({
      type: z.literal('cult-payout'),
      cultId: z.string(),
      amount: money.positive(),
    })
    .strict(),
  z
    .object({
      type: z.literal('cult-rival'),
      cultId: z.string(),
      rivalId: z.string(),
      action: z.enum([
        'challenge',
        'publicity',
        'alliance',
        'reconcile',
        'ignore',
      ]),
      quotedCost: money,
    })
    .strict(),
  z
    .object({
      type: z.literal('cult-recovery'),
      cultId: z.string(),
      action: z.enum([
        'apologise',
        'transparent',
        'open-gathering',
        'replace-deputy',
        'ignore',
        'rebrand',
      ]),
      name: name.optional(),
      quotedCost: money,
    })
    .strict(),
  z.object({ type: z.literal('cult-disband'), cultId: z.string() }).strict(),
]);
export type CultCommand = z.infer<typeof cultCommandSchema>;
export const cultBookKinds = [
  'capital',
  'income',
  'expense',
  'payout',
  'distribution',
  'misuse',
] as const;
const bookSchema = z.object({
  id: z.string(),
  sequence: z.number().int().nonnegative(),
  date: dateSchema,
  kind: z.enum(cultBookKinds),
  category: z.string().max(60),
  description: z.string().max(240),
  delta: z.bigint(),
  personId: z.string().nullable(),
  personalTransactionId: z.string().nullable(),
});
const bookTotals = z.object({
  cashDelta: z.bigint(),
  capital: money,
  income: money,
  expenses: money,
  payouts: money,
  distribution: money,
  misuse: money,
  count: z.number().int().nonnegative(),
});
export const cultThreadSchema = z.object({
  id: z.string(),
  kind: z.enum(['claim', 'story', 'callback']),
  templateId: z.string().max(80),
  created: dateSchema,
  dueMonth: month,
  settledMonth: month.nullable(),
  fulfilledMonth: month.nullable(),
  status: z.enum(['scheduled', 'offered', 'resolved', 'cancelled']),
  offerId: z.string().nullable(),
  participantIds: z.array(z.string()).max(4),
  philosophy: z.enum(cultPhilosophyIds),
  doctrineId: z.enum(cultDoctrineIds).nullable(),
  ruleId: z.enum(cultRuleIds).nullable(),
  approach: z.enum(['double-down', 'explain', 'viewing', 'none']),
  roll: z.number().int().min(1).max(100),
  postponements: z.number().int().min(0).max(1),
  outcome: z.enum(['success', 'failure', 'postponed', 'cancelled']).nullable(),
  response: z.string().max(40).nullable(),
  baseline: z.object({
    followers: z.number().int().nonnegative(),
    ceremonies: z.number().int().nonnegative(),
    sermons: z.number().int().nonnegative(),
    fees: money,
  }),
  followersTaken: z.number().int().min(0).max(50000),
  title: z.string().max(120),
  body: z.string().max(1200),
});
const memberSchema = z.object({
  personId: z.string(),
  role: z.enum(cultMemberRoles),
  joined: dateSchema,
  ended: dateSchema.nullable(),
  status: z.enum(['active', 'left', 'expelled', 'deceased']),
  personality: z.enum([
    'earnest',
    'practical',
    'showy',
    'sceptic',
    'opportunist',
  ]),
  loyalty: pct,
  ambition: pct,
  grievance: pct,
  resident: z.boolean(),
  memories: z
    .array(
      z.object({
        id: z.string(),
        month,
        kind: z.string().max(40),
        text: z.string().max(360),
      }),
    )
    .max(16),
});
const yearSchema = z.object({
  year: z.number().int(),
  openingFollowers: z.number().int().min(0).max(50000),
  gained: z.number().int().nonnegative(),
  lost: z.number().int().nonnegative(),
  followers: z.number().int().min(0).max(50000),
  revenue: money,
  expenses: money,
  capital: money,
  payouts: money,
  treasury: money,
  loyaltyStart: pct,
  loyalty: pct,
  reputationStart: pct,
  reputation: pct,
  events: z.array(z.string().max(240)).max(12),
});
export const cultSchema = z.object({
  id: z.string(),
  founderId: z.string(),
  leaderId: z.string().nullable(),
  name,
  leaderTitle: name,
  country: z.enum(countryCodes),
  city: z.string().max(80),
  currency: cultCurrencySchema,
  started: dateSchema,
  ended: dateSchema.nullable(),
  status: z.enum(['active', 'disbanded', 'collapsed', 'deceased']),
  lastMonth: month,
  lastSceneMonth: month.nullable(),
  monthsActive: z.number().int().nonnegative(),
  sequence: z.number().int().nonnegative(),
  philosophy: z.enum(cultPhilosophyIds),
  doctrines: z.array(z.enum(cultDoctrineIds)).min(2).max(6),
  rules: z.array(z.enum(cultRuleIds)).min(2).max(6),
  foundingMethod: z.enum(cultFoundingMethods),
  names: z
    .array(z.object({ name, date: dateSchema }))
    .min(1)
    .max(12),
  followers: z.number().int().min(0).max(50000),
  loyalty: pct,
  satisfaction: pct,
  reputation: pct,
  heat: pct,
  headquarters: z.enum(cultHeadquartersIds),
  upgrades: z.array(z.enum(cultUpgradeIds)).max(6),
  headquartersHistory: z
    .array(
      z.object({
        headquarters: z.enum(cultHeadquartersIds),
        date: dateSchema,
        paid: money,
      }),
    )
    .min(1)
    .max(5),
  joiningFee: money,
  recurringFee: money,
  cash: money,
  capital: money,
  income: money,
  expenses: money,
  payouts: money,
  distribution: money,
  misuse: money,
  memberRewards: money,
  arrears: money,
  writtenOff: money,
  distressMonths: z.number().int().nonnegative(),
  fragileMonths: z.number().int().nonnegative(),
  book: z.array(bookSchema).max(512),
  bookBase: bookTotals,
  claimsMade: z.array(z.enum(cultClaimIds)).max(18),
  legalIncidents: z.array(z.string()).max(64),
  // Five active seats; former real people remain in the organisation's history.
  // Replacement never creates a person, and each identity has only one record.
  members: z.array(memberSchema).min(3),
  threads: z.array(cultThreadSchema).max(72),
  threadArchive: z.object({
    resolved: z.number().int().nonnegative(),
    cancelled: z.number().int().nonnegative(),
  }),
  storyLast: z.record(z.string(), month),
  rivals: z
    .array(
      z.object({
        id: z.string(),
        name,
        leaderId: z.string(),
        sourceMemberId: z.string().nullable(),
        started: dateSchema,
        followers: z.number().int().min(0).max(50000),
        reputation: pct,
        relationship: pct,
        status: z.enum(['active', 'allied', 'reconciled', 'closed']),
        history: z.array(z.string().max(300)).max(12),
        lastMonth: month,
      }),
    )
    .max(6),
  scandals: z
    .array(
      z.object({
        id: z.string(),
        month,
        reason: z.string().max(300),
        severity: pct,
        resolvedMonth: month.nullable(),
      }),
    )
    .max(32),
  archivedScandals: z.number().int().nonnegative(),
  recovery: z
    .object({
      kind: z.enum([
        'apologise',
        'transparent',
        'open-gathering',
        'replace-deputy',
        'ignore',
        'rebrand',
      ]),
      startedMonth: month,
      remaining: z.number().int().min(0).max(12),
    })
    .nullable(),
  ceremonies: z.number().int().nonnegative(),
  sermons: z.number().int().nonnegative(),
  lastCeremony: z
    .object({ id: z.enum(cultCeremonyIds), month, success: z.boolean() })
    .nullable(),
  months: z
    .array(
      z.object({
        month,
        followers: z.number().int().min(0).max(50000),
        gained: z.number().int().nonnegative(),
        lost: z.number().int().nonnegative(),
        revenue: money,
        expenses: money,
        openingCash: money,
        cash: money,
        loyalty: pct,
        heat: pct,
      }),
    )
    .max(60),
  report: yearSchema,
  years: z.array(yearSchema).max(120),
});
export type Cult = z.infer<typeof cultSchema>;
export type CultMember = Cult['members'][number];
export type CultThread = z.infer<typeof cultThreadSchema>;
export type CultChoiceEffect = z.infer<typeof cultChoiceEffectSchema>;
export const activeCult = (world: World, personId = world.activePersonId) =>
  world.cults.find(
    (row) => row.leaderId === personId && row.status === 'active',
  );
export const cultMonthNumber = (world: World) =>
  world.date.year * 12 + world.date.month - 1;
