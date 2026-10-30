import type { World } from '../model';
import { offences } from '../content/crime';
import { activeSentence } from './legalSchemas';

export type PrisonSecurity = 'low' | 'medium' | 'high';
/** Classification follows the actual sentence, offences and current conduct. */
export function prisonSecurity(world: World, sentence = activeSentence(world)): PrisonSecurity {
  if (!sentence) return 'medium';
  const cases = sentence.caseIds.map(id => world.cases.find(item => item.id === id));
  if (sentence.totalMonths >= 120 || sentence.behavior < 25 || cases.some(item => item && (offences[item.offence].violent || item.offence === 'escape'))) return 'high';
  return sentence.totalMonths <= 24 && sentence.behavior >= 50 ? 'low' : 'medium';
}
