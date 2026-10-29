import { z } from 'zod';
import { dateSchema } from '../calendar';
import { countryCodes } from '../countries';
import type { World } from '../model';

/** Authored friendship rules V1; retained for validating existing consent history. */
export const bestFriendshipChanceV1 = (strength: number, trust: number) => Math.min(95, 20 + Math.floor((strength + trust) / 2));
export const bestFriendshipSchema = z.object({
  id: z.string(), ruleVersion: z.literal(1), relationshipId: z.string(), proposerId: z.string(), friendId: z.string(),
  proposed: dateSchema, country: z.enum(countryCodes), city: z.string().min(1),
  strength: z.number().int().min(75).max(100), trust: z.number().int().min(60).max(100),
  chance: z.number().int().min(1).max(95), roll: z.number().int().min(1).max(100),
  status: z.enum(['declined', 'active', 'ended']), ended: dateSchema.nullable(),
  endReason: z.enum(['choice', 'death', 'romance']).nullable(), endedById: z.string().nullable(),
});
export type BestFriendship = z.infer<typeof bestFriendshipSchema>;
export const bestFriendshipAttemptKey = (a: string, b: string, year: number) => 'best-friends:' + [a, b].sort().join(':') + ':' + year;

type Index = { readonly byPerson: ReadonlyMap<string, BestFriendship>; readonly byId: ReadonlyMap<string, BestFriendship>; readonly byRelationship: ReadonlyMap<string, readonly BestFriendship[]> };
const indexes = new WeakMap<World['bestFriendships'], Index>();
export function bestFriendshipIndex(world: World): Index {
  const records = world.bestFriendships, cached = Object.isFrozen(records) ? indexes.get(records) : undefined;
  if (cached) return cached;
  const index = { byPerson: new Map<string, BestFriendship>(), byId: new Map<string, BestFriendship>(), byRelationship: new Map<string, BestFriendship[]>() };
  for (const row of records) {
    index.byId.set(row.id, row);
    const history = index.byRelationship.get(row.relationshipId) ?? []; history.push(row); index.byRelationship.set(row.relationshipId, history);
    if (row.status === 'active') { index.byPerson.set(row.proposerId, row); index.byPerson.set(row.friendId, row); }
  }
  // Mutable command copies are never cached: their rows can still be closed/appended.
  if (Object.isFrozen(records)) { for (const history of index.byRelationship.values()) Object.freeze(history); Object.freeze(index); indexes.set(records, index); }
  return index;
}
export const currentBestFriendship = (world: World, personId = world.activePersonId) => bestFriendshipIndex(world).byPerson.get(personId);
export const bestFriendshipHistory = (world: World, relationshipId: string): readonly BestFriendship[] => bestFriendshipIndex(world).byRelationship.get(relationshipId) ?? [];
