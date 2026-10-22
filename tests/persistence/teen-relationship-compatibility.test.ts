import { createHash } from 'node:crypto';
import { encodeWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import terminal from '../fixtures/v34-natural-editorial-us-checkpoint.json';
import scenes from '../fixtures/story-name-collision-cohort.json';

const sha = (value: string) => createHash('sha256').update(value).digest('hex');
function originalC35(world: World) {
  const old = JSON.parse(encodeWorld(world));
  expect(old).toMatchObject({ schemaVersion: 44, engineVersion: 46, contentVersion: 23 });
  // Only these newly defaulted empty fields were absent from both C35 inputs.
  for (const key of ['miniGames', 'personSupportRequests', 'personActionHistory', 'rentalLeases', 'bestFriendships', 'teenRelationships', 'universityApplications', 'studyCourses', 'npcSeparations', 'npcMoves', 'campusCommunities']) { expect(old[key]).toEqual([]); delete old[key]; }
  old.schemaVersion = 34; old.engineVersion = 35; old.contentVersion = 10;
  return JSON.stringify(old);
}

test('the immutable actual C35 terminal life gains no inferred teenage history and retains its complete original canonical proof', () => {
  expect(terminal.producerCommit).toBe('73cedc7643fa3cbcd0ad32dfa27abfb59dac8aaa');
  expect(terminal.versions).toEqual({ world: 34, engine: 35, content: 10 });
  expect(Buffer.byteLength(terminal.checkpoint)).toBe(526545); expect(sha(terminal.checkpoint)).toBe('afbd3a1a85bc05cbc046917fd61195545fa9e0704bd2aced19c0be1981809901');
  const world = unpackCheckpoint(terminal.checkpoint, true), before = encodeWorld(world);
  expect(sha(originalC35(world))).toBe('03cced796c1fb4a0b1f24e63ef0b3cd1673b5fec0412b4dcd4ca8b6b667a92fd');
  expect(unpackCheckpoint(packCheckpoint(world), true)).toEqual(world); expect(encodeWorld(world)).toBe(before);
});

test('a genuine older bound school decision and its actual selected full-world result remain exact, including money/RNG/history', () => {
  const scene = scenes.records[0]; expect(sha(scene.checkpoint)).toBe(scene.checkpointSha256); expect(sha(scene.resultCheckpoint)).toBe(scene.resultCheckpointSha256);
  const world = unpackCheckpoint(scene.checkpoint, true), before = encodeWorld(world);
  expect(sha(originalC35(world))).toBe(scene.canonicalSha256); expect(world.pending?.kind).toBe('decision');
  const selected = resolveCommand(world, scene.selected as GameCommand, true);
  expect(selected).toEqual(unpackCheckpoint(scene.resultCheckpoint, true)); expect(sha(originalC35(selected))).toBe(scene.resultCanonicalSha256);
  expect(encodeWorld(world)).toBe(before); expect(unpackCheckpoint(packCheckpoint(selected), true)).toEqual(selected);
});
