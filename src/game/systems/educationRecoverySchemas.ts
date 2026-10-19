import { z } from 'zod';
import { countryCodes } from '../countries';
import { dateSchema } from '../calendar';
import type { World } from '../model';

/** Authored game courses; these are not claims about national exam law or fees. */
export const recoveryPaths = {
  secondary: { label: 'Complete Secondary Education', months: 24, target: 50 },
  grades: { label: 'Improve School Grades', months: 12, target: 55 },
} as const;
export const secondaryCompletionSchema = z.object({
  id: z.string(), personId: z.string(), country: z.enum(countryCodes), city: z.string(), school: z.string(),
  date: dateSchema, grade: z.number().int().min(0).max(100), passed: z.boolean(), recordedStudyMonths: z.number().int().nonnegative(), requiredStudyMonths: z.literal(12),
});
export const recoveryCourseSchema = z.object({
  id: z.string(), personId: z.string(), country: z.enum(countryCodes), city: z.string(), school: z.string(),
  purpose: z.enum(['secondary', 'grades']), started: dateSchema, ended: dateSchema.nullable(),
  status: z.enum(['active', 'passed', 'failed', 'withdrawn', 'died', 'superseded']),
  reason: z.enum(['withdrawn', 'moved', 'died', 'qualified-elsewhere']).nullable(),
  requiredMonths: z.union([z.literal(12), z.literal(24)]), targetGrade: z.union([z.literal(50), z.literal(55)]),
  effort: z.enum(['relaxed', 'balanced', 'focused']), finalGrade: z.number().int().min(0).max(100).nullable(), qualificationAwarded: z.boolean(),
  periods: z.array(z.object({ month: z.number().int(), effort: z.enum(['relaxed', 'balanced', 'focused']), gradeBefore: z.number().int().min(0).max(100), gradeGain: z.number().int().min(0).max(2) })).max(24),
});
export type RecoveryCourse = z.infer<typeof recoveryCourseSchema>;
export const currentRecovery = (world: World, personId = world.activePersonId) => world.recoveryCourses.find(course => course.personId === personId && course.status === 'active');
