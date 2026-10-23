import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync, strFromU8 } from 'fflate';
import { decodeWorld, encodeWorld } from '../../src/game/model';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import native from '../fixtures/v32-native-hourly-checkpoints.json';
import project from '../fixtures/v27-leisure-archive.json';
import c15 from '../fixtures/v39-content15-native-choice.json';

const sha = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const histories = ['teenRelationships', 'universityApplications', 'studyCourses', 'npcSeparations', 'npcMoves', 'campusCommunities'] as const;
const observations = [
  { name: 'original native interview', file: 'v32-native-hourly-checkpoints.json', fixtureSha: '9b12ebf08e9f316398db3ea2bfd7ccf9424bc6233b102be3223c7cb49a85258c', payload: native.checkpoints.interview.payload, payloadSha: 'e80f88ec0b75f2dd4531a73c05c9c1fef54188bcc02d40cedc5a27f01dc7d175', versions: [32, 33, 9], template: 'job-interview' },
  { name: 'original interrupted project year', file: 'v27-leisure-archive.json', fixtureSha: '5027d51240dfcae2b5b17b0040282cf627943f4c4323d130e8667c2fc870335a', payload: project.checkpoint, payloadSha: '244b902d252884adc43a6d5183efd16e4afed6c1b3db64ee3e931733710d8650', versions: [27, 26, 4], template: 'story-project-promise' },
] as const;

test('the actual Android C15 pending choice migrates only its root versions and empty future campus records, preserving the complete saved world and original checkpoint bytes', () => {
  // Extracted read-only from the coordinator's archived, cold-restored Android
  // database: Ren18/revision83, 2044-10-21. No engine choice/continuation is
  // produced here, and the original three answers remain unchosen.
  const payload = c15.checkpoint, originalBytes = readFileSync(join(__dirname, '../fixtures/v39-content15-native-choice.json'));
  expect(sha(payload)).toBe('5ee3676a221e7c09010e5e478b269a8b4d1a395db000102050a4c10f3e41e8f5');
  expect(Buffer.byteLength(payload)).toBe(82379);
  const frame = JSON.parse(payload), inflate = (part: { data: string }) => JSON.parse(strFromU8(gunzipSync(Buffer.from(part.data, 'base64'))));
  expect(frame.format).toBe('dreams-checkpoint-v4');
  const raw = inflate(frame.main);
  raw.people = Object.assign({}, ...frame.people.map(inflate));
  raw.ledger = frame.ledger.flatMap((part: { data: string }) => inflate(part).map((row: unknown[]) => Object.fromEntries(frame.columns.map((key: string, index: number) => [key, ['cashDelta', 'debtDelta'].includes(key) ? { $dreamsBigInt: row[index] } : row[index]]))));
  expect(raw).toMatchObject({ schemaVersion: 39, engineVersion: 40, contentVersion: 15, revision: 83, date: { year: 2044, month: 10, day: 21 }, pending: { kind: 'decision', id: 'event_2044_adult-unwanted-speech', templateId: 'adult-unwanted-speech' } });
  expect(raw.pending.choices.map((choice: { id: string }) => choice.id)).toEqual(['brief', 'pass', 'ramble']);
  const migrated = unpackCheckpoint(payload, true), encoded = encodeWorld(migrated);
  expect(JSON.parse(encoded)).toEqual({ ...raw, schemaVersion: 48, engineVersion: 50, contentVersion: 27, cults: [], miniGames: [], personSupportRequests: [], personActionHistory: [], rentalLeases: [], campusCommunities: [] });
  expect(migrated.pending).toEqual(raw.pending); expect(migrated.random).toEqual(raw.random);
  expect(encodeWorld(unpackCheckpoint(packCheckpoint(migrated), true))).toBe(encoded);
  expect(readFileSync(join(__dirname, '../fixtures/v39-content15-native-choice.json'))).toEqual(originalBytes);
  expect(sha(payload)).toBe('5ee3676a221e7c09010e5e478b269a8b4d1a395db000102050a4c10f3e41e8f5');
});

test.each(observations)('$name: an explicitly arranged C38 envelope changes only its root tags and empty future campus records while preserving absent prospective metadata', observation => {
  expect(sha(readFileSync(join(__dirname, '../fixtures', observation.file)))).toBe(observation.fixtureSha);
  expect(sha(observation.payload)).toBe(observation.payloadSha);
  const frame = JSON.parse(observation.payload), raw = JSON.parse(strFromU8(gunzipSync(Buffer.from((frame.main ?? frame).data, 'base64'))));
  expect([raw.schemaVersion, raw.engineVersion, raw.contentVersion]).toEqual(observation.versions);
  expect(raw.pending).toMatchObject({ kind: 'decision', templateId: observation.template });

  // Every person, payment, saved answer and interrupted cursor comes from the
  // unchanged producer. The 37/38/content12 envelope below is declared setup,
  // not a newly claimed genuine C38 save or an earned gameplay continuation.
  const original = unpackCheckpoint(observation.payload, true), encoded = encodeWorld(original), current = JSON.parse(encoded);
  expect(current).toMatchObject({ schemaVersion: 48, engineVersion: 50, contentVersion: 27, cults: [] });
  expect(current.pending).toEqual(raw.pending); expect(current.annual).toEqual(raw.annual);
  for (const key of histories) expect(current[key]).toEqual([]);
  const legacy = { ...current, schemaVersion: 37, engineVersion: 38, contentVersion: 12 }, before = JSON.stringify(legacy);
  const migrated = decodeWorld(before, true);
  expect(JSON.parse(encodeWorld(migrated))).toEqual({ ...legacy, schemaVersion: 48, engineVersion: 50, contentVersion: 27, cults: [], miniGames: [], personSupportRequests: [], personActionHistory: [], rentalLeases: [] });
  expect(JSON.stringify(legacy)).toBe(before);
  expect(encodeWorld(original)).toBe(encoded);

  if (observation.template === 'job-interview') {
    if (migrated.pending?.kind !== 'decision') throw new Error('Expected original interview');
    const answers = migrated.pending.choices.flatMap(choice => choice.effects).filter(effect => effect.kind === 'job-interview');
    expect(answers).toHaveLength(4);
    for (const answer of answers) expect(answer).not.toHaveProperty('experience');
    expect(migrated.annual).toBeNull();
  } else {
    expect(migrated.annual).toMatchObject({ monthsProcessed: 2, stage: 'months', pausedForPlanning: false });
    expect(migrated.annual).not.toHaveProperty('pacing');
  }
  expect(migrated.legacyAnnual).toBeNull();
  const cold = unpackCheckpoint(packCheckpoint(migrated), true);
  expect(encodeWorld(cold)).toBe(encodeWorld(migrated)); expect(cold).toEqual(migrated);
  expect(sha(observation.payload)).toBe(observation.payloadSha);
});

test('an explicitly arranged World45 boundary changes only root markers and keeps every already-bound scene and historical field', () => {
  // The content below is an unmodified genuine stored decision projected through
  // supported older migrations. Only its45/47/24 envelope is arranged to isolate
  // the marker-only writing update; this is not claimed as a new native fixture.
  const projected = unpackCheckpoint(c15.checkpoint, true);
  const previous = { ...JSON.parse(encodeWorld(projected)), schemaVersion: 45, engineVersion: 47, contentVersion: 24 };
  const original = JSON.stringify(previous), migrated = decodeWorld(original, true);
  expect(JSON.parse(encodeWorld(migrated))).toEqual({ ...previous, schemaVersion: 48, engineVersion: 50, contentVersion: 27 });
  expect(migrated.pending).toEqual(previous.pending); expect(migrated.deferred).toEqual(previous.deferred);
  expect(migrated.journal).toEqual(previous.journal); expect(migrated.random).toEqual(previous.random);
  expect(JSON.stringify(previous)).toBe(original);
  expect(encodeWorld(unpackCheckpoint(packCheckpoint(migrated), true))).toBe(encodeWorld(migrated));
});
