import { z } from 'zod';
import { dateSchema } from '../calendar';
import { countryCodes } from '../countries';
import type { World } from '../model';

export const workplaceMemberSchema = z.object({
  personId: z.string(), employmentId: z.string(), role: z.enum(['supervisor', 'coworker']), joined: dateSchema,
  left: dateSchema.nullable(), endReason: z.enum(['died', 'left-job', 'moved']).nullable(),
});
export const workFeedbackSchema = z.object({
  date: dateSchema, supervisorId: z.string(), supervisorEmploymentId: z.string(), paidMonths: z.number().int().min(3),
  trustAtRequest: z.number().int().min(0).max(100), chance: z.number().int().min(50).max(95), roll: z.number().int().min(1).max(100), accepted: z.boolean(),
  performanceBefore: z.number().int().min(0).max(100), performanceGain: z.number().int().min(0).max(3),
});
export const workplaceSchema = z.object({
  id: z.string(), personId: z.string(), employmentId: z.string(), employer: z.string(), country: z.enum(countryCodes), city: z.string(),
  started: dateSchema, ended: dateSchema.nullable(), endReason: z.enum(['died', 'left-job', 'moved']).nullable(),
  members: z.array(workplaceMemberSchema).min(1), feedback: z.array(workFeedbackSchema),
});
export type Workplace = z.infer<typeof workplaceSchema>;
export type WorkplaceMember = z.infer<typeof workplaceMemberSchema>;
export const currentWorkplace = (world: World, personId = world.activePersonId): Workplace | undefined => {
  const person = world.people[personId];
  if (!person?.employment) return;
  return world.workplaces.find(item => item.personId === personId && item.employmentId === person.employment!.id && !item.ended && item.country === person.country && item.city === person.city);
};

/** Contract termination updates the observed roster without generating replacements. */
export function endWorkplaceEmployment(world: World, personId: string, employmentId: string) {
  const reason = world.people[personId].died ? 'died' : 'left-job';
  for (const place of world.workplaces.filter(item => !item.ended)) {
    if (place.personId === personId && place.employmentId === employmentId) { place.ended = { ...world.date }; place.endReason = reason; continue; }
    for (const member of place.members.filter(item => item.personId === personId && item.employmentId === employmentId && !item.left)) { member.left = { ...world.date }; member.endReason = reason; }
  }
}
