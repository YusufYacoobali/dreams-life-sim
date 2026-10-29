import { z } from 'zod';
import { dateSchema } from '../calendar';
import { countryCodes } from '../countries';
import type { CountryCode } from '../countries';
import type { World } from '../model';
import { fields } from './schemas';

export const admissionStatuses = ['waitlisted', 'accepted', 'rejected', 'withdrawn', 'enrolled', 'expired', 'moved', 'died', 'other-course'] as const;
const percentage = z.number().int().min(0).max(100);
// Freeze existing authored country tuition for this policy version. Future price
// changes need a new policy, so already offered places keep their actual terms.
export const universityTuitionV1 = { US: 1400000n, CA: 750000n, GB: 950000n, AU: 900000n, FR: 60000n, DE: 60000n, ES: 150000n, IT: 200000n, BR: 600000n, IN: 7000000n, JP: 600000n, ZA: 4500000n } as const satisfies Record<CountryCode, bigint>;
/** Authored admissions rules v1; these are not national admissions policies. */
export const universityAdmissionSchema = z.object({
  id: z.string().max(200), personId: z.string(), policyVersion: z.literal(1),
  field: z.enum(fields), country: z.enum(countryCodes), city: z.string().min(1).max(80), school: z.string().min(1).max(120),
  currency: z.enum(['USD', 'CAD', 'GBP', 'AUD', 'EUR', 'BRL', 'INR', 'JPY', 'ZAR']),
  annualTuition: z.bigint().positive(), requiredMonths: z.literal(48),
  applied: dateSchema, grades: percentage, smarts: percentage,
  roll: z.number().int().min(1).max(100), chance: z.number().int().min(1).max(95),
  status: z.enum(admissionStatuses),
  transitions: z.array(z.object({ date: dateSchema, status: z.enum(admissionStatuses) })).min(1).max(3),
  reviewDue: dateSchema.nullable(),
  review: z.object({ date: dateSchema, grades: percentage, secondaryQualified: z.boolean() }).nullable(),
  offered: dateSchema.nullable(), expires: dateSchema.nullable(), ended: dateSchema.nullable(),
  enrolment: z.object({
    date: dateSchema, funding: z.enum(['cash', 'loan']), scholarshipId: z.string().nullable(),
    billed: z.bigint().nonnegative(), waived: z.bigint().nonnegative(),
    transactionId: z.string().nullable(), loanTransactionId: z.string().nullable(),
    loanInterestBps: z.number().int().min(0).max(5000).nullable(),
  }).nullable(),
});
export type UniversityApplication = z.infer<typeof universityAdmissionSchema>;
export const admissionChance = (grades: number, smarts: number) => Math.min(95, 20 + Math.round((grades + smarts) / 2));
export const initialAdmissionStatus = (roll: number, chance: number) => roll <= chance - 5 ? 'accepted' as const : roll <= Math.min(100, chance + 5) ? 'waitlisted' as const : 'rejected' as const;
export const activeUniversityApplication = (world: World, personId = world.activePersonId) => world.universityApplications.find(item => item.personId === personId && (item.status === 'accepted' || item.status === 'waitlisted'));
export const admissionAttemptKey = (personId: string, year: number, field: string) => personId + ':education:' + year + ':university:' + field;
