import { createHash } from 'node:crypto';
import { bindEvent, eventTemplates } from '../../src/game/content/events';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { copyWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { choiceSchema } from '../../src/game/runtime';
import { storyContactNames } from '../../src/game/storyNames';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import cohort from '../fixtures/story-name-collision-cohort.json';

const sha = (value: string) => createHash('sha256').update(value).digest('hex');
// Recover only the original C35 root framing; every captured gameplay field
// and bound choice/result remains part of its immutable canonical proof.
function originalC35Canonical(world: World) {
  const original = JSON.parse(encodeWorld(world));
  expect(original).toMatchObject({ schemaVersion: 35, engineVersion: 36, contentVersion: 11 });
  expect(original.bestFriendships).toEqual([]); delete original.bestFriendships;
  original.schemaVersion = 34; original.engineVersion = 35; original.contentVersion = 10;
  return JSON.stringify(original);
}
const record = (country: string, index: number) => cohort.records.find(row => row.decisionPointer === country + '/result.json#/decisions/' + index)!;
function bound(row: typeof cohort.records[number]) {
  const world = unpackCheckpoint(row.checkpoint), pending = world.pending;
  if (pending?.kind !== 'decision') throw Error('Expected actual recorded decision');
  return { world, pending, next: bindEvent(world, eventTemplates.find(item => item.id === pending.templateId)!) };
}

test('six captured worlds retain complete original source pins, exact old bound choices and actual old chosen results', () => {
  expect(cohort.records).toHaveLength(6); expect(cohort.sourceBefore).toEqual(cohort.sourceAfter); expect(cohort.sourceBefore.checkoutHead).toBe('73cedc7643fa3cbcd0ad32dfa27abfb59dac8aaa');
  expect(cohort.sourceBefore.gameAndPersistence).toBe('12b49689991da671d72b3ac8bc0bfe6bb2aff788174cf1ccda73665c0195c2b8');
  for (const row of cohort.records) {
    expect(sha(row.checkpoint)).toBe(row.checkpointSha256); expect(sha(row.resultCheckpoint)).toBe(row.resultCheckpointSha256);
    const world = unpackCheckpoint(row.checkpoint), original = encodeWorld(world);
    expect(sha(originalC35Canonical(world))).toBe(row.canonicalSha256); expect(world.pending?.kind === 'decision' && world.pending.choices.every(choice => !Object.hasOwn(choice, 'relationshipLabels'))).toBe(true);
    const selected = resolveCommand(world, row.selected as GameCommand, true);
    expect(selected).toEqual(unpackCheckpoint(row.resultCheckpoint)); expect(sha(originalC35Canonical(selected))).toBe(row.resultCanonicalSha256);
    expect(encodeWorld(world)).toBe(original); expect(unpackCheckpoint(packCheckpoint(world))).toEqual(world);
  }
});

test.each([
  ['IN', 8, 'Rohan Khan (classmate)', 'Rohan Mehta (teacher)'],
  ['GB', 12, 'Amelia Morgan (teacher)', 'Amelia Takahashi (parent)'],
  ['IT', 10, 'Leonardo Ferrari (classmate)', 'Leonardo Ferrari (teacher)'],
] as const)('%s decision%i qualifies only the actual colliding bound people, without changing any effect or source world', (country, index, first, second) => {
  const row = record(country, index), { world, pending, next } = bound(row), original = encodeWorld(world);
  expect(next.body).toContain(first); expect(next.body).toContain(second); expect(next.personIds).toEqual(pending.personIds);
  expect(next.choices.map(choice => choice.effects)).toEqual(pending.choices.map(choice => choice.effects));
  expect(next.choices.map(choice => choice.id)).toEqual(pending.choices.map(choice => choice.id));
  expect(encodeWorld(world)).toBe(original); expect(unpackCheckpoint(packCheckpoint(world)).pending).toEqual(pending);
});

test.each([['IN', 7], ['GB', 10]] as const)('%s decision%i remains byte-equivalent when names are unambiguous or the matching teacher is not bound', (country, index) => {
  const { pending, next } = bound(record(country, index)); expect(next).toEqual(pending);
  expect(next.choices.every(choice => !Object.hasOwn(choice, 'relationshipLabels'))).toBe(true);
});

test('identical full names retain both explicit roles in every actual project branch, with exactly unchanged gameplay and RNG', () => {
  const { world, pending, next } = bound(record('IT', 9));
  expect(next.body).toContain('Leonardo Ferrari (classmate) presents'); expect(next.choices[0].resultBody).toContain('Leonardo Ferrari (teacher) asks');
  for (const choice of next.choices) {
    const offered = copyWorld(world); offered.pending = next; const cold = unpackCheckpoint(packCheckpoint(validateWorld(offered, true)));
    expect(cold.pending).toEqual(next); const command: GameCommand = { type: 'choose', eventId: next.id, choiceId: choice.id };
    const previous = resolveCommand(world, command, true), current = resolveCommand(cold, command, true);
    expect({ ...current, pending: previous.pending, journal: previous.journal }).toEqual(previous);
    expect(current.journal.slice(0, -1)).toEqual(previous.journal.slice(0, -1)); expect(current.journal.at(-1)).toEqual({ ...previous.journal.at(-1), text: choice.journal });
    if (current.pending?.kind !== 'result' || previous.pending?.kind !== 'result') throw Error('Expected actual results');
    expect(current.pending.effects.map(({ label, ...mechanics }) => mechanics)).toEqual(previous.pending.effects.map(({ label, ...mechanics }) => mechanics));
    expect(current.pending.effects.filter(row => row.label.endsWith(' · relationship')).map(row => row.label)).toEqual((choice.relationshipLabels ?? []).map(row => row.label + ' · relationship'));
    expect(current.random).toEqual(world.random); expect(choice.effects).toEqual(pending.choices.find(row => row.id === choice.id)!.effects);
  }
});

test('one real identity with multiple valid roles is not a name collision, and literal names are never interpreted as tokens', () => {
  // Lexical helper boundary only; no game world or people are altered or created.
  const person = { id: 'same', firstName: 'A$& "{teacher}"', lastName: 'Example' };
  const same = storyContactNames([{ token: 'parent', role: 'parent', person, display: person.firstName }, { token: 'teacher', role: 'teacher', person, display: person.firstName }]);
  expect(same.names).toEqual({ parent: person.firstName, teacher: person.firstName }); expect(same.consequenceNames.size).toBe(0);
  const other = { ...person, id: 'other' }, collision = storyContactNames([{ token: 'classmate', role: 'classmate', person, display: person.firstName }, { token: 'teacher', role: 'teacher', person: other, display: other.firstName }]);
  expect(collision.names).toEqual({ classmate: 'A$& "{teacher}" Example (classmate)', teacher: 'A$& "{teacher}" Example (teacher)' });
});

test('optional consequence labels are bounded and associate once with an actual effect of the same choice', () => {
  const { next } = bound(record('IT', 9)), choice = next.choices[2], row = choice.relationshipLabels![0]; expect(choiceSchema.safeParse(choice).success).toBe(true);
  for (const labels of [[], [row, row], [{ ...row, relationshipId: 'unrelated' }], [{ ...row, label: '' }], [{ ...row, label: 'x'.repeat(241) }], Array.from({ length: 9 }, (_, index) => ({ ...row, relationshipId: 'relationship_' + index }))]) expect(choiceSchema.safeParse({ ...choice, relationshipLabels: labels }).success).toBe(false);
  expect(choiceSchema.safeParse({ ...choice, effects: [], relationshipLabels: [row] }).success).toBe(false);
});
