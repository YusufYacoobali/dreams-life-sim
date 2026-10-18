import { z } from 'zod';
import { countryCodes } from './countries';
import { pendingSchema } from './runtime';
import { daysInMonth, monthFrom } from './calendar';

export const dateSchema = z.object({
  year: z.number().int().positive().max(999999),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
}).refine(date => {
  const leap = date.year % 4 === 0 && (date.year % 100 !== 0 || date.year % 400 === 0);
  return date.day <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][date.month - 1];
}, 'Invalid calendar date');
export type GameDate = z.infer<typeof dateSchema>;
const percentage = z.number().int().min(0).max(100);
const personId = z.string().regex(/^person_[a-zA-Z0-9_-]+$/);
const safeName = z.string().trim().min(1).max(40).refine(name => !/[\u0000-\u001F]/.test(name), 'Invalid name');
export const statsSchema = z.object({
  happiness: percentage, health: percentage, smarts: percentage, looks: percentage, respect: percentage,
  energy: percentage, fitness: percentage, stress: percentage, discipline: percentage, fame: percentage,
});
export type Stats = z.infer<typeof statsSchema>;
export const personSchema = z.object({
  id: personId, firstName: safeName, lastName: safeName,
  gender: z.enum(['male', 'female', 'nonbinary']),
  nationality: z.enum(countryCodes), country: z.enum(countryCodes), city: z.string().min(1).max(80),
  born: dateSchema, died: dateSchema.nullable(), causeOfDeath: z.string().max(300).nullable(),
  stats: statsSchema,
  appearance: z.object({ face: z.number().int().min(0).max(3), skin: z.number().int().min(0).max(5), hair: z.number().int().min(0).max(7), hairColor: z.number().int().min(0).max(4) }),
  traits: z.array(z.enum(['kind', 'ambitious', 'impulsive', 'reserved', 'creative', 'practical'])).max(3),
});
export type Person = z.infer<typeof personSchema>;
export const journalSchema = z.object({ id: z.string(), date: dateSchema, personId, text: z.string().max(1200), category: z.string() });
export const worldSchema = z.object({
  schemaVersion: z.literal(2), engineVersion: z.literal(1), contentVersion: z.literal(1),
  id: z.string().regex(/^life_[a-zA-Z0-9_-]+$/), revision: z.number().int().nonnegative(),
  date: dateSchema, activePersonId: personId,
  random: z.object({ events: z.number().int().min(0).max(0xFFFFFFFF), npcs: z.number().int().min(0).max(0xFFFFFFFF), economy: z.number().int().min(0).max(0xFFFFFFFF), outcomes: z.number().int().min(0).max(0xFFFFFFFF) }),
  people: z.record(personId, personSchema),
  relationships: z.array(z.object({ id: z.string(), from: personId, to: personId, kind: z.enum(['parent', 'sibling', 'friend', 'partner', 'spouse', 'coworker', 'classmate']), strength: percentage, trust: percentage, memories: z.array(z.string()) })),
  accounts: z.array(z.object({ id: z.string(), ownerId: personId, currency: z.enum(['USD', 'CAD', 'GBP', 'AUD', 'EUR', 'BRL', 'INR', 'JPY', 'ZAR']), cash: z.bigint() })),
  journal: z.array(journalSchema),
  birthAcknowledged: z.boolean(),
  calendarAnchorDay: z.number().int().min(1).max(31),
  annual: z.object({ id: z.string(), startDate: dateSchema, targetDate: dateSchema, monthsProcessed: z.number().int().min(0).max(12) }).nullable(),
  pending: pendingSchema.nullable(),
  eventHistory: z.array(z.object({ templateId: z.string(), year: z.number().int() })),
});
export type World = z.infer<typeof worldSchema>;

export function compareDates(a: GameDate, b: GameDate): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}
export function ageOn(person: Pick<Person, 'born' | 'died'>, date: GameDate): number {
  const at = person.died ?? date;
  const birthdayDay = Math.min(person.born.day, daysInMonth(at.year, person.born.month));
  return at.year - person.born.year - (at.month < person.born.month || (at.month === person.born.month && at.day < birthdayDay) ? 1 : 0);
}
export const fullName = (person: Pick<Person, 'firstName' | 'lastName'>) => person.firstName + ' ' + person.lastName;

/** Reject contradictory imports/checkpoints rather than repairing them silently. */
export function validateWorld(value: unknown): World {
  const world = worldSchema.parse(value);
  if (!world.people[world.activePersonId]) throw new Error('Missing active person');
  const accountIds = new Set<string>();
  const relationshipIds = new Set<string>();
  const journalIds = new Set<string>();
  for (const [id, person] of Object.entries(world.people)) {
    if (person.id !== id || ageOn(person, world.date) < 0) throw new Error('Invalid person identity or age');
    if (person.died && (compareDates(person.died, person.born) < 0 || compareDates(person.died, world.date) > 0)) throw new Error('Invalid death date');
    if (!!person.died !== !!person.causeOfDeath) throw new Error('Inconsistent death record');
  }
  for (const relation of world.relationships) {
    if (relation.from === relation.to || !world.people[relation.from] || !world.people[relation.to] || relationshipIds.has(relation.id)) throw new Error('Invalid relationship reference');
    relationshipIds.add(relation.id);
  }
  for (const account of world.accounts) {
    if (!world.people[account.ownerId] || account.cash < 0n || accountIds.has(account.id)) throw new Error('Invalid cash account');
    accountIds.add(account.id);
  }
  if (!world.accounts.some(account => account.ownerId === world.activePersonId)) throw new Error('Missing player account');
  for (const entry of world.journal) {
    if (!world.people[entry.personId] || compareDates(entry.date, world.date) > 0 || compareDates(entry.date, world.people[entry.personId].born) < 0 || journalIds.has(entry.id)) throw new Error('Invalid journal fact');
    journalIds.add(entry.id);
  }
  if (world.annual && (compareDates(world.date, world.annual.startDate) < 0 || compareDates(world.date, world.annual.targetDate) > 0 || world.annual.targetDate.year !== world.annual.startDate.year + 1)) throw new Error('Invalid annual frame');
  if (world.annual && (compareDates(world.date, monthFrom(world.annual.startDate, world.annual.monthsProcessed, world.calendarAnchorDay)) !== 0 || compareDates(world.annual.targetDate, monthFrom(world.annual.startDate, 12, world.calendarAnchorDay)) !== 0)) throw new Error('Annual cursor does not match calendar');
  if (world.pending?.kind === 'decision') {
    if (world.people[world.activePersonId].died || world.pending.personIds.some(id => !world.people[id] || world.people[id].died)) throw new Error('Invalid bound event person');
    if (new Set(world.pending.choices.map(choice => choice.id)).size !== world.pending.choices.length) throw new Error('Duplicate decision choices');
    for (const choice of world.pending.choices) for (const effect of choice.effects) {
      if (effect.kind === 'stat' && !world.people[effect.personId]) throw new Error('Invalid effect person');
      if (effect.kind === 'relationship' && !world.relationships.some(relation => relation.id === effect.relationshipId)) throw new Error('Invalid effect relationship');
      if (effect.kind === 'transfer') {
        const from = world.accounts.find(account => account.id === effect.fromAccountId);
        const to = world.accounts.find(account => account.id === effect.toAccountId);
        if (!from || !to || from.id === to.id || from.currency !== to.currency || from.cash < effect.minor) throw new Error('Invalid effect transfer');
      }
    }
  }
  return world;
}

export function encodeWorld(world: World): string {
  return JSON.stringify(validateWorld(world), (_key, value: unknown) => typeof value === 'bigint' ? { $dreamsBigInt: value.toString() } : value);
}
export function decodeWorld(text: string): World {
  if (text.length > 20_000_000) throw new Error('Save is too large');
  const parsed = JSON.parse(text, (_key, value: unknown) => {
    if (value && typeof value === 'object' && Object.keys(value).length === 1 && '$dreamsBigInt' in value) {
      const amount = (value as { $dreamsBigInt: unknown }).$dreamsBigInt;
      if (typeof amount !== 'string' || !/^-?\d{1,128}$/.test(amount)) throw new Error('Invalid money encoding');
      return BigInt(amount);
    }
    return value;
  });
  // Version 1 shipped creation only. Preserve every identity, journal fact and RNG stream.
  if (parsed && parsed.schemaVersion === 1) {
    parsed.schemaVersion = 2;
    parsed.calendarAnchorDay = parsed.date?.day;
    parsed.annual = null; parsed.pending = null; parsed.eventHistory = [];
  }
  return validateWorld(parsed);
}
