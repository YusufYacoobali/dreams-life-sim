import { z } from 'zod';
import { ageOn, compareDates, dateSchema, decodeWorld, fullName, World } from '../game/model';
import { packCheckpoint, unpackCheckpoint } from './checkpoints';
export const snapshotSummarySchema = z.object({
  id: z.string(), revision: z.number().int().nonnegative(), personId: z.string(), name: z.string().max(100), date: dateSchema,
  age: z.number().int().nonnegative(), label: z.string().max(120), createdAt: z.string().max(80), size: z.number().int().nonnegative(),
});
export type SnapshotSummary = z.infer<typeof snapshotSummarySchema>;
export const branchInfoSchema = z.object({ sourceLifeId: z.string(), snapshotId: z.string(), personId: z.string(), name: z.string().max(100), date: dateSchema, age: z.number().int().nonnegative() });
export type BranchInfo = z.infer<typeof branchInfoSchema>;
const recordSchema = z.object({ summary: snapshotSummarySchema, payload: z.string().max(28_000_000) });
export type SnapshotRecord = z.infer<typeof recordSchema>;
const archiveSchema = z.object({ format: z.literal('dreams-save-archive'), version: z.literal(1), checkpoint: z.string().max(28_000_000), snapshots: z.array(recordSchema).max(5000), branch: branchInfoSchema.nullable() });
export type SaveContents = { world: World; snapshots: SnapshotRecord[]; branch: BranchInfo | null };
export function snapshotRecord(world: World, createdAt: string, label: string): SnapshotRecord {
  const payload = packCheckpoint(world), person = world.people[world.activePersonId];
  return { payload, summary: { id: 'snapshot_r_' + world.revision, revision: world.revision, personId: person.id, name: fullName(person), date: { ...world.date }, age: ageOn(person, world.date), label, createdAt, size: payload.length } };
}
export function validateSnapshot(record: SnapshotRecord): World {
  const world = unpackCheckpoint(record.payload), person = world.people[world.activePersonId], summary = record.summary;
  if (summary.id !== 'snapshot_r_' + world.revision || summary.revision !== world.revision || summary.personId !== world.activePersonId || summary.name !== fullName(person) || compareDates(summary.date, world.date) !== 0 || summary.age !== ageOn(person, world.date) || summary.size !== record.payload.length) throw new Error('Checkpoint metadata is inconsistent');
  return world;
}
/** Decode both original plain saves and complete archives containing compressed local history. */
export function decodeSave(text: string): SaveContents {
  if (text.length > 64_000_000) throw new Error('This save archive is too large');
  const parsed = JSON.parse(text);
  if (parsed?.format !== 'dreams-save-archive') return { world: decodeWorld(text), snapshots: [], branch: null };
  const archive = archiveSchema.parse(parsed), world = unpackCheckpoint(archive.checkpoint), ids = new Set<string>();
  for (const record of archive.snapshots) {
    if (ids.has(record.summary.id) || record.summary.revision > world.revision || compareDates(record.summary.date, world.date) > 0) throw new Error('Archive contains duplicate or future checkpoints');
    ids.add(record.summary.id); validateSnapshot(record);
  }
  return { world, snapshots: archive.snapshots, branch: archive.branch };
}
export function encodeSave(contents: SaveContents): string {
  const text = JSON.stringify({ format: 'dreams-save-archive', version: 1, checkpoint: packCheckpoint(contents.world), snapshots: contents.snapshots, branch: contents.branch });
  if (text.length > 64_000_000) throw new Error('This archive exceeds the supported export size');
  return text;
}
