import { gunzipSync, strFromU8 } from 'fflate';
import { encodeWorld } from '../../src/game/model';
import { currentSchool } from '../../src/game/systems/schoolSchemas';
import { decodeSave } from '../../src/persistence/archive';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import { SaveRepository } from '../../src/persistence/repository';
import { createGameStore } from '../../src/state/gameStore';
import { database } from '../support/sqlite';
import archive from '../fixtures/v28-native-school-archive.json';
import reading from '../fixtures/v28-ordinary-hobby-archive.json';

test('the genuine native school archive keeps every current/prior field, original reading moment and both checkpoint formats', () => {
  const inflate = (part: { data: string }) => JSON.parse(strFromU8(gunzipSync(Buffer.from(part.data, 'base64'))));
  const raw = (payload: string) => { const part = JSON.parse(payload); return part.format === 'dreams-checkpoint-v1' ? inflate(part) : { ...inflate(part.main), ledger: part.ledger.flatMap(inflate) }; };
  const decoded = decodeSave(JSON.stringify(archive)), payloads = [archive.checkpoint, ...archive.snapshots.map(item => item.payload)], worlds = [decoded.world, ...decoded.snapshots.map(item => unpackCheckpoint(item.payload))];
  payloads.forEach((payload, index) => { const original = raw(payload), current = JSON.parse(encodeWorld(worlds[index])); for (const key of Object.keys(original).filter(key => !['schemaVersion', 'engineVersion', 'contentVersion'].includes(key))) expect(current[key]).toEqual(original[key]); });
  expect(raw(archive.checkpoint)).toMatchObject({ schemaVersion: 28, engineVersion: 27, contentVersion: 4, revision: 53 });
  expect(archive.snapshots.map(item => JSON.parse(item.payload).format)).toEqual([...Array(4).fill('dreams-checkpoint-v1'), ...Array(6).fill('dreams-checkpoint-v2')]);
  for (const moment of reading.snapshots) expect(archive.snapshots.find(item => item.summary.id === moment.summary.id)).toEqual(moment);
});

test('cold native-childhood history retains actual care/study/help counters and blocks repeats without changing the world or any stored row', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.import(JSON.stringify(archive));
  const store = createGameStore({ repository: async () => repository, date: () => ({ year: 2026, month: 10, day: 20 }), id: () => 'unused' }); await store.getState().bootstrap();
  const world = store.getState().world!, school = currentSchool(world)!;
  expect(world).toMatchObject({ revision: 53, pending: null, annual: null });
  expect(world.people[world.activePersonId].education.grades).toBe(92); expect(school.help).toEqual([{ month: 24441, term: 5, teacherId: school.currentTeacherId, chance: 81, roll: 22, accepted: true, gradeBefore: 89, gradeGain: 3 }]);
  expect(world.pets[0]).toMatchObject({ name: 'Biscuit', status: 'deceased' }); expect(world.pets[0].periods).toHaveLength(46);
  expect(world.hobbies.find(item => item.kind === 'guitar')?.proficiency).toBe(72); expect(world.hobbies.find(item => item.kind === 'reading')?.proficiency).toBe(49);
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])), before = rows(), encoded = encodeWorld(world);
  expect(await store.getState().dispatch({ type: 'study' })).toBe(false); expect(await store.getState().dispatch({ type: 'school-help', communityId: school.id, teacherId: school.currentTeacherId })).toBe(false);
  expect(encodeWorld(store.getState().world!)).toBe(encoded); expect(await repository.previewLife(world.id)).toEqual(world); expect(rows()).toEqual(before);
  expect((await repository.snapshots(world.id)).map(item => item.id).sort()).toEqual(archive.snapshots.map(item => item.summary.id).sort());
  sqlite.close();
});
