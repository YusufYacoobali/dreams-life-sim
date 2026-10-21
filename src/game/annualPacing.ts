import { compareDates, type World } from './model';
import type { Pending } from './runtime';
import { importantDecisionTemplatesV1, optionalSceneChancesV1, type ImportantDecisionTemplate } from './systems/annualPacingSchemas';

const important = new Set<string>(importantDecisionTemplatesV1);
const isImportant = (templateId: string): templateId is ImportantDecisionTemplate => important.has(templateId);

/** An absent opt-in preserves the entire interrupted legacy frame's old odds. */
export function optionalSceneChance(frame: World['annual']): number {
  return optionalSceneChancesV1[frame?.pacing ? Math.min(3, frame.pacing.decisions.length) : 0];
}

/** Call only after this successful choice's existing journal has been written.
 * The captured frame also retains the same pacing object if effects archive it. */
export function noteImportantDecision(frame: World['annual'], event: Extract<Pending, { kind: 'decision' }>, journal: World['journal'][number], journalIndex: number): void {
  const pacing = frame?.stage === 'months' ? frame.pacing : undefined;
  if (!pacing || !isImportant(event.templateId) || pacing.decisions.length >= 3 || pacing.decisions.some(row => row.eventId === event.id)) return;
  if (journal.id !== event.id + '_choice' || journal.category !== 'event') throw new Error('Pacing requires its actual resolved choice journal');
  pacing.decisions.push({ eventId: event.id, templateId: event.templateId, personId: journal.personId, date: { ...journal.date }, journalIndex });
}

/** At most six direct journal lookups across current/archived frames. */
export function validateAnnualPacing(world: World): void {
  if (!world.annual?.pacing && !world.legacyAnnual?.pacing) return;
  for (const frame of [world.annual, world.legacyAnnual]) {
    if (!frame?.pacing) continue;
    const ids = new Set<string>(); let previous = frame.startDate;
    for (const row of frame.pacing.decisions) {
      const journal = world.journal[row.journalIndex], person = world.people[row.personId];
      if (!person || !isImportant(row.templateId) || ids.has(row.eventId) || !journal || journal.id !== row.eventId + '_choice' || journal.category !== 'event' || journal.personId !== row.personId || compareDates(journal.date, row.date) !== 0) throw new Error('Invalid annual pacing choice observation');
      if (compareDates(row.date, previous) < 0 || compareDates(row.date, frame.startDate) < 0 || compareDates(row.date, frame.targetDate) > 0 || compareDates(row.date, world.date) > 0 || compareDates(person.born, row.date) > 0 || person.died && compareDates(row.date, person.died) > 0) throw new Error('Invalid annual pacing observation date');
      ids.add(row.eventId); previous = row.date;
    }
  }
}
