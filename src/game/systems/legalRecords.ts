import type { World } from '../model';
import { legalRules } from '../legalRules';
import { active } from './common';

export function visibleConvictions(world: World, person = active(world)) {
  return world.cases.filter(item => item.personId === person.id && item.status === 'convicted' && item.resolved && world.date.year - item.resolved.year < (item.juvenile ? legalRules[item.country].juvenileRecordYears : legalRules[item.country].recordYears));
}
