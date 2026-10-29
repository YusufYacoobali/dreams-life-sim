import { z } from 'zod';
import { dateSchema, monthFrom, type GameDate } from '../calendar';
import { countryCodes } from '../countries';
import type { World } from '../model';
import { genders, relationKinds } from './familySchemas';

/** Authored V1 first-relationship rules; historical consent never uses later tuning. */
export const teenRelationshipRulesV1 = Object.freeze({ minimumAge: 13, maximumAge: 17, gapMonths: 24, minimumBond: 50, minimumTrust: 40, energy: 4 });
export const teenConsentChanceV1 = (bond: number, trust: number) => Math.max(15, Math.min(90, 25 + Math.floor((bond + trust) / 2)));
export const teenAttemptKey = (a: string, b: string, year: number) => 'teen-relationship:' + [a, b].sort().join(':') + ':' + year;
const compare = (a: GameDate, b: GameDate) => a.year - b.year || a.month - b.month || a.day - b.day;
/** Calendar years include the day boundary and clamp a leap-day anniversary. */
export function withinTeenAgeGap(a: GameDate, b: GameDate): boolean {
  const [older, younger] = compare(a, b) <= 0 ? [a, b] : [b, a];
  return compare(younger, monthFrom(older, teenRelationshipRulesV1.gapMonths)) <= 0;
}
export const teenRelationshipSchema = z.object({
  id: z.string(), ruleVersion: z.literal(1), relationshipId: z.string(), proposerId: z.string(), peerId: z.string(),
  proposed: dateSchema, country: z.enum(countryCodes), city: z.string().min(1),
  knownRoles: z.array(z.enum(relationKinds)).min(1),
  actorGender: z.enum(genders), peerGender: z.enum(genders), actorPreferences: z.array(z.enum(genders)).min(1).max(3), peerPreferences: z.array(z.enum(genders)).min(1).max(3),
  bond: z.number().int().min(50).max(100), trust: z.number().int().min(40).max(100),
  chance: z.number().int().min(15).max(90), roll: z.number().int().min(1).max(100),
  status: z.enum(['declined', 'active', 'ended', 'continued-as-adults']),
  ended: dateSchema.nullable(), endReason: z.enum(['choice', 'death', 'adulthood']).nullable(), endedById: z.string().nullable(),
});
export type TeenRelationship = z.infer<typeof teenRelationshipSchema>;
type Index = { readonly byId: ReadonlyMap<string, TeenRelationship>; readonly byPerson: ReadonlyMap<string, TeenRelationship>; readonly byRelationship: ReadonlyMap<string, readonly TeenRelationship[]> };
const indexes = new WeakMap<World['teenRelationships'], Index>();
export function teenRelationshipIndex(world: World): Index {
  const records = world.teenRelationships, saved = Object.isFrozen(records) ? indexes.get(records) : undefined;
  if (saved) return saved;
  const index = { byId: new Map<string, TeenRelationship>(), byPerson: new Map<string, TeenRelationship>(), byRelationship: new Map<string, TeenRelationship[]>() };
  for (const row of records) {
    index.byId.set(row.id, row);
    const history = index.byRelationship.get(row.relationshipId) ?? []; history.push(row); index.byRelationship.set(row.relationshipId, history);
    if (row.status === 'active') { index.byPerson.set(row.proposerId, row); index.byPerson.set(row.peerId, row); }
  }
  if (Object.isFrozen(records)) { for (const history of index.byRelationship.values()) Object.freeze(history); Object.freeze(index); indexes.set(records, index); }
  return index;
}
export const currentTeenRelationship = (world: World, personId = world.activePersonId) => teenRelationshipIndex(world).byPerson.get(personId);
export const teenRelationshipHistory = (world: World, relationshipId: string): readonly TeenRelationship[] => teenRelationshipIndex(world).byRelationship.get(relationshipId) ?? [];
