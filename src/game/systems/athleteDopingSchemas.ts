import { z } from 'zod';
import { dateSchema } from '../calendar';
import type { World } from '../model';

export const dopingCheckSchema = z.object({
  id: z.string(), ruleVersion: z.literal(1), projectId: z.string(), employmentId: z.string(), supplierId: z.string(),
  used: dateSchema, testMonth: z.number().int(), detectionChance: z.literal(65), detectionRoll: z.number().int().min(1).max(100),
  status: z.enum(['pending', 'negative', 'positive', 'cancelled']), resolved: dateSchema.nullable(),
});
export type DopingCheck = z.infer<typeof dopingCheckSchema>;
const monthOf = (date: World['date']) => date.year * 12 + date.month - 1;

export function athleteSuspensionReason(world: World, personId = world.activePersonId): string | undefined {
  const until = world.careers.filter(career => career.personId === personId && career.kind === 'athlete')
    .flatMap(career => career.dopingChecks ?? []).reduce((latest, check) => check.status === 'positive' && check.resolved ? Math.max(latest, monthOf(check.resolved) + 12) : latest, 0);
  const remaining = until - monthOf(world.date);
  if (remaining > 0) return 'Suspended from professional athletics for ' + remaining + ' more month' + (remaining === 1 ? '' : 's');
}
