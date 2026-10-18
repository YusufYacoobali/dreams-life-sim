import { z } from 'zod';
import { dateSchema } from '../calendar';
import { platforms, postKinds } from '../content/social';
const percentage = z.number().int().min(0).max(100);
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const currency = z.enum(['USD', 'CAD', 'GBP', 'AUD', 'EUR', 'BRL', 'INR', 'JPY', 'ZAR']);
const money = z.object({ minor: z.bigint().nonnegative(), currency });
export const publicLifeSchema = z.object({ image: percentage, attention: percentage, earnedFame: percentage, peakFame: percentage, lastMonth: z.number().int(), interviews: count, appearances: count });
export const newPublicLife = (month: number, earnedFame = 0): z.infer<typeof publicLifeSchema> => ({ image: 50, attention: 0, earnedFame, peakFame: earnedFame, lastMonth: month, interviews: 0, appearances: 0 });
export const socialIntent = z.enum(['authentic', 'polished', 'provocative']);
export const socialPostSchema = z.object({ id: z.string(), accountId: z.string(), date: dateSchema, periodMonth: z.number().int(), kind: z.enum(postKinds), intent: socialIntent, caption: z.string().max(220), sponsored: z.boolean(), sponsorId: z.string().nullable(), collaborationId: z.string().nullable(), views: count, likes: count, comments: count, followerDelta: z.number().int(), response: z.enum(['quiet', 'steady', 'well-received', 'viral', 'controversial']), income: money });
export const socialAccountSchema = z.object({
  id: z.string(), ownerId: z.string(), platform: z.enum(platforms), handle: z.string().regex(/^[a-zA-Z0-9_]{3,24}$/), bio: z.string().max(120), created: dateSchema,
  status: z.enum(['active', 'suspended', 'deleted', 'memorial']), suspendedUntil: z.number().int().nullable(), strikes: z.number().int().nonnegative(),
  followers: count.max(1000000000), baselineFollowers: count.max(1000000000), peakFollowers: count.max(1000000000), followerDrift: z.number().int(), verified: z.boolean(), monetised: z.boolean(), currency,
  cadence: z.enum(['off', 'monthly', 'twice-monthly', 'weekly']), topic: z.enum(postKinds), intent: socialIntent, lastMonth: z.number().int(),
  posts: z.array(socialPostSchema).max(60), archived: z.array(z.object({ year: z.number().int(), posts: count, virals: count, views: count, likes: count, comments: count, followerDelta: z.number().int(), income: z.bigint().nonnegative() })),
  totalPosts: count, totalLikes: count, income: z.bigint().nonnegative(), periods: z.array(z.object({ month: z.number().int(), posts: count, sponsored: count })).max(3),
});
export const sponsorshipSchema = z.object({
  id: z.string(), accountId: z.string(), ownerId: z.string(), brand: z.string(), category: z.string(), topic: z.enum(postKinds), offered: dateSchema, expiresMonth: z.number().int(),
  status: z.enum(['offered', 'active', 'declined', 'expired', 'completed', 'terminated', 'ended-death']), monthlyPay: money, termMonths: z.number().int().positive().max(12), requiredPosts: z.number().int().positive().max(4),
  startMonth: z.number().int().nullable(), lastMonth: z.number().int(), earned: z.bigint().nonnegative(), misses: count, deliveries: z.array(z.object({ month: z.number().int(), posts: count, paid: z.bigint().nonnegative() })).max(12), endReason: z.string().nullable(),
});
export const controversySchema = z.object({ id: z.string(), personId: z.string(), accountId: z.string().nullable(), postId: z.string().nullable(), date: dateSchema, title: z.string(), body: z.string(), impact: percentage, responseRoll: z.number().int().min(1).max(100), response: z.enum(['apologise', 'clarify', 'ignore']).nullable(), resolved: dateSchema.nullable() });
export const collaborationSchema = z.object({ id: z.string(), a: z.string(), b: z.string(), date: dateSchema, accepted: z.boolean(), fee: money, postIds: z.array(z.string()).max(2) });
export const followSchema = z.object({ from: z.string(), to: z.string(), date: dateSchema });
