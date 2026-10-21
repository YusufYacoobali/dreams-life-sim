import type { World } from '../model';
import { active } from './common';
import { activeUniversityApplication } from './universityAdmissionSchemas';

export function matchingAdmission(world: World, field: string) {
  const item = activeUniversityApplication(world), person = active(world);
  return item?.field === field && item.country === person.country && item.city === person.city ? item : undefined;
}
