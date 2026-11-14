import { gunzipSync, strFromU8 } from 'fflate';
import { resolveCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { decodeWorld, encodeWorld } from '../../src/game/model';
import { decodeSave } from '../../src/persistence/archive';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import archive from '../fixtures/v27-responsive-archive.json';
import earlier from '../fixtures/v27-leisure-archive.json';

test('the genuine responsive archive keeps both checkpoint formats, the committed project result and every original field while its unfinished year resumes once', () => {
  const inflate = (part: { data: string }) => JSON.parse(strFromU8(gunzipSync(Buffer.from(part.data, 'base64'))));
  const raw = (payload: string) => {
    const part = JSON.parse(payload);
    return part.format === 'dreams-checkpoint-v1' ? inflate(part) : { ...inflate(part.main), ledger: part.ledger.flatMap(inflate) };
  };
  const save = decodeSave(JSON.stringify(archive)), originals = [raw(archive.checkpoint), ...archive.snapshots.map(item => raw(item.payload))], worlds = [save.world, ...save.snapshots.map(item => unpackCheckpoint(item.payload))];
  worlds.forEach((world, index) => {
    const encoded = JSON.parse(encodeWorld(world)); expect(originals[index]).toMatchObject({ schemaVersion: 27, engineVersion: 26, contentVersion: 4 });
    for (const key of Object.keys(originals[index]).filter(key => !['schemaVersion', 'engineVersion', 'contentVersion'].includes(key))) expect(encoded[key]).toEqual(originals[index][key]);
  });
  expect(JSON.parse(archive.checkpoint).format).toBe('dreams-checkpoint-v2');
  expect(archive.snapshots.map(item => JSON.parse(item.payload).format)).toEqual([...Array(4).fill('dreams-checkpoint-v1'), 'dreams-checkpoint-v2']);
  for (const moment of earlier.snapshots) expect(archive.snapshots.find(item => item.summary.id === moment.summary.id)).toEqual(moment);
  let world = save.world;
  expect(world.revision).toBe(33); expect(world.annual?.monthsProcessed).toBe(2);
  expect(world.pending).toMatchObject({ kind: 'result', id: 'story_25_0_due_result', title: 'Your name belongs on it' });
  const before = decodeSave(JSON.stringify(earlier)).world;
  expect(world.hobbies).toEqual(before.hobbies); expect(world.pets).toEqual(before.pets); expect(world.ledger).toEqual(before.ledger); expect(world.random).toEqual(before.random);
  expect(world.storyThreads.find(item => item.id === 'story_25_0')).toMatchObject({ status: 'resolved' });
  expect(() => resolveCommand(world, { type: 'choose', eventId: 'story_25_0_due', choiceId: 'complete' })).toThrow();
  let guard = 0;
  while ((world.pending || world.annual) && guard++ < 150) {
    world = decodeWorld(encodeWorld(world));
    if (world.pending?.kind === 'decision') {
      const choice = world.pending.choices.find(item => !choiceUnavailable(world, item))!;
      world = resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: choice.id });
    } else if (world.pending) world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
    else world = resolveCommand(world, { type: 'resume' });
  }
  expect(guard).toBeLessThan(150); expect(world.annual).toBeNull();
  expect(world.hobbies[0].practices.slice(0, 2)).toEqual(before.hobbies[0].practices);
  expect(world.hobbies[0].practices.filter(row => row.source === 'monthly')).toHaveLength(12);
  expect(world.pets[0].periods.slice(0, 14)).toEqual(before.pets[0].periods); expect(world.pets[0].periods).toHaveLength(24);
  expect(world.leisureOutings).toEqual(before.leisureOutings);
  expect(world.ledger.filter(row => row.category === 'entertainment')).toHaveLength(1);
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
});
