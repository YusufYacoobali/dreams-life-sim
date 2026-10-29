import { z } from 'zod';
import { dateSchema } from '../calendar';
import { countryCodes } from '../countries';
import type { World } from '../model';
export const schoolClubs = ['none', 'sport', 'music', 'drama', 'science'] as const;
export const schoolConducts = ['quiet', 'helpful', 'disruptive'] as const;
export const schoolCommunitySchema = z.object({
  id: z.string(), personId: z.string(), stage: z.enum(['primary', 'secondary']), school: z.string(), country: z.enum(countryCodes), city: z.string(),
  started: dateSchema, ended: dateSchema.nullable(), endReason: z.enum(['graduated', 'unqualified', 'changed-school', 'died', 'withdrawn']).nullable(),
  classmateIds: z.array(z.string()).min(1).max(6), teacherIds: z.array(z.string()).min(1), currentTeacherId: z.string(),
  club: z.enum(schoolClubs), conduct: z.enum(schoolConducts),
  periods: z.array(z.object({ month: z.number().int(), teacherId: z.string(), club: z.enum(schoolClubs), conduct: z.enum(schoolConducts), grades: z.number().int().min(0).max(100), skillGain: z.number().int().min(0).max(1) })),
  exams: z.array(z.object({ month: z.number().int(), term: z.number().int().positive(), grade: z.number().int().min(0).max(100) })),
  help: z.array(z.object({ month: z.number().int(), term: z.number().int().nonnegative(), teacherId: z.string(), chance: z.number().int().min(55).max(95), roll: z.number().int().min(1).max(100), accepted: z.boolean(), gradeBefore: z.number().int().min(0).max(100), gradeGain: z.number().int().min(0).max(3) })),
});
export type SchoolCommunity = z.infer<typeof schoolCommunitySchema>;
export const schoolWithdrawalSchema = z.object({
  id: z.string(), personId: z.string(), communityId: z.string(), country: z.enum(countryCodes), city: z.string(), school: z.string(), date: dateSchema,
  ruleVersion: z.literal(1), age: z.number().int().min(14), minimumLeavingAge: z.number().int().min(14).max(17),
  recordedStudyMonths: z.number().int().nonnegative(), recordedAttendanceMonths: z.number().int().nonnegative(), grade: z.number().int().min(0).max(100),
  effort: z.enum(['relaxed', 'balanced', 'focused']), lastStudyYear: z.number().int().nullable(),
});
export type SchoolWithdrawal = z.infer<typeof schoolWithdrawalSchema>;
export const hasWithdrawnFromSchool = (world: World, personId = world.activePersonId) => world.schoolWithdrawals.some(item => item.personId === personId);
export const currentSchool = (world: World, personId = world.activePersonId) => world.schoolCommunities.find(item => item.personId === personId && !item.ended);
