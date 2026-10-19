import { z } from 'zod';
import { dateSchema } from '../calendar';
import { countryCodes } from '../countries';
import { fields } from './schemas';
import type { World } from '../model';

/** Fictional institutional tuition waivers, not national entitlements. */
export const scholarshipPolicies = {
  merit: { label: 'Academic Scholarship', entryGrade: 80, renewalGrade: 70, coverageBps: 7500, chance: 85 },
  access: { label: 'Access Scholarship', entryGrade: 60, renewalGrade: 55, coverageBps: 10000, chance: 65 },
} as const;
export const scholarshipKinds = ['merit', 'access'] as const;
export const studyPrograms = ['university', 'trade', 'graduate'] as const;
const percentage = z.number().int().min(0).max(100);
export const scholarshipSchema = z.object({
  id: z.string(), personId: z.string(), kind: z.enum(scholarshipKinds),
  program: z.enum(studyPrograms), field: z.enum(fields), country: z.enum(countryCodes), city: z.string(),
  currency: z.enum(['USD', 'CAD', 'GBP', 'AUD', 'EUR', 'BRL', 'INR', 'JPY', 'ZAR']),
  applied: dateSchema, expires: dateSchema, gradeAtApplication: percentage,
  resourcesAtApplication: z.bigint().nonnegative(), annualTuition: z.bigint().positive(),
  roll: z.number().int().min(1).max(100), chance: z.number().int().min(1).max(100),
  coverageBps: z.number().int().min(1).max(10000),
  status: z.enum(['offered', 'declined', 'active', 'completed', 'failed', 'withdrawn', 'expired', 'moved', 'died', 'lost']),
  ended: dateSchema.nullable(), lossReason: z.enum(['grades', 'resources']).nullable(),
  lossAssessment: z.object({ date: dateSchema, studyMonth: z.number().int().nonnegative(), grades: percentage, resources: z.bigint().nonnegative() }).nullable(),
  course: z.object({ started: dateSchema, school: z.string(), requiredMonths: z.number().int().positive() }).nullable(),
  periods: z.array(z.object({
    date: dateSchema, studyMonth: z.number().int().nonnegative(), grades: percentage, resources: z.bigint().nonnegative(),
    grossTuition: z.bigint().positive(), waived: z.bigint().positive(), billed: z.bigint().nonnegative(),
    funding: z.enum(['cash', 'loan']), transactionId: z.string().nullable(), loanTransactionId: z.string().nullable(),
  })).max(4),
});
export type Scholarship = z.infer<typeof scholarshipSchema>;
export const activeScholarship = (world: World, personId = world.activePersonId) => world.scholarships.find(item => item.personId === personId && item.status === 'active');
