import { z } from 'zod';
import { dateSchema } from '../calendar';

export const campusClubs = ['none', 'sport', 'music', 'drama', 'science'] as const;
export type CampusClub = typeof campusClubs[number];
const percent = z.number().int().min(0).max(100);
export const campusCommunitySchema = z.object({
  id: z.string().max(200), personId: z.string(), courseId: z.string(), started: dateSchema,
  introducedStudyMonths: z.number().int().min(1), lastStudyMonths: z.number().int().min(1),
  club: z.enum(campusClubs),
  students: z.array(z.object({ personId: z.string(), courseId: z.string() })).length(2),
  periods: z.array(z.object({
    month: z.number().int(), studyMonth: z.number().int().min(1), club: z.enum(campusClubs),
    skillBefore: percent.nullable(), skillAfter: percent.nullable(), skillGain: z.number().int().min(0).max(1),
    energyBefore: percent, energyAfter: percent,
  })).max(48),
});
export type CampusCommunity = z.infer<typeof campusCommunitySchema>;

export const campusCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('meet-campus'), courseId: z.string() }),
  z.object({ type: z.literal('campus-club'), communityId: z.string(), club: z.enum(campusClubs) }),
]);
export type CampusCommand = z.infer<typeof campusCommandSchema>;
