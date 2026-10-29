import { z } from 'zod';
import type { World } from '../model';
import { dateSchema } from '../calendar';
import { countryCodes } from '../countries';
export const musicGenres = ['pop', 'rock', 'folk', 'electronic', 'classical'] as const;
export const musicFormats = ['single', 'album'] as const;
export const musicReleaseSchema = z.object({
    id: z.string(), personId: z.string(), careerId: z.string(), title: z.string().trim().min(1).max(70), genre: z.enum(musicGenres), format: z.enum(musicFormats), country: z.enum(countryCodes), currency: z.enum(['USD', 'CAD', 'GBP', 'AUD', 'EUR', 'BRL', 'INR', 'JPY', 'ZAR']),
    started: dateSchema, released: dateSchema.nullable(), ended: dateSchema.nullable(), status: z.enum(['recording', 'paused', 'released', 'cancelled', 'ended']), pauseReason: z.string().nullable(),
    requiredMonths: z.number().int().positive(), monthsRecorded: z.number().int().nonnegative(), productionCost: z.bigint().positive(), paidProduction: z.bigint().nonnegative(), scores: z.array(z.number().int().min(0).max(100)), quality: z.number().int().min(0).max(100), responseRoll: z.number().int().min(1).max(100), initialMonthlyUnits: z.number().int().nonnegative(), launchFame: z.number().int().min(0).max(100), decayPerMonth: z.number().int().min(1).max(5), unitPay: z.bigint().positive(),
    lastMonth: z.number().int(), monthsReleased: z.number().int().min(0).max(60), totalUnits: z.number().int().nonnegative(), royalties: z.bigint().nonnegative(), milestone: z.literal('One Million Listens').nullable(), periods: z.array(z.object({ month: z.number().int(), units: z.number().int().nonnegative(), royalty: z.bigint().nonnegative() })).max(60),
});
export const recordingCommitment = (world: World, personId = world.activePersonId) => world.musicReleases.find(item => item.personId === personId && (item.status === 'recording' || item.status === 'paused'));
