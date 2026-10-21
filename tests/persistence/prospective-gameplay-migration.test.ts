import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync, strFromU8 } from 'fflate';
import { decodeWorld, encodeWorld } from '../../src/game/model';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import native from '../fixtures/v32-native-hourly-checkpoints.json';
import project from '../fixtures/v27-leisure-archive.json';

const sha = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const histories = ['teenRelationships', 'universityApplications', 'studyCourses', 'npcSeparations', 'npcMoves'] as const;
const observations = [
  { name: 'original native interview', file: 'v32-native-hourly-checkpoints.json', fixtureSha: '9b12ebf08e9f316398db3ea2bfd7ccf9424bc6233b102be3223c7cb49a85258c', payload: native.checkpoints.interview.payload, payloadSha: 'e80f88ec0b75f2dd4531a73c05c9c1fef54188bcc02d40cedc5a27f01dc7d175', versions: [32, 33, 9], template: 'job-interview' },
  { name: 'original interrupted project year', file: 'v27-leisure-archive.json', fixtureSha: '5027d51240dfcae2b5b17b0040282cf627943f4c4323d130e8667c2fc870335a', payload: project.checkpoint, payloadSha: '244b902d252884adc43a6d5183efd16e4afed6c1b3db64ee3e931733710d8650', versions: [27, 26, 4], template: 'story-project-promise' },
] as const;

test.each(observations)('$name: an explicitly arranged C38 envelope changes only its three root tags and preserves absent prospective metadata', observation => {
  expect(sha(readFileSync(join(__dirname, '../fixtures', observation.file)))).toBe(observation.fixtureSha);
  expect(sha(observation.payload)).toBe(observation.payloadSha);
  const frame = JSON.parse(observation.payload), raw = JSON.parse(strFromU8(gunzipSync(Buffer.from((frame.main ?? frame).data, 'base64'))));
  expect([raw.schemaVersion, raw.engineVersion, raw.contentVersion]).toEqual(observation.versions);
  expect(raw.pending).toMatchObject({ kind: 'decision', templateId: observation.template });

  // Every person, payment, saved answer and interrupted cursor comes from the
  // unchanged producer. The 37/38/content12 envelope below is declared setup,
  // not a newly claimed genuine C38 save or an earned gameplay continuation.
  const original = unpackCheckpoint(observation.payload, true), encoded = encodeWorld(original), current = JSON.parse(encoded);
  expect(current).toMatchObject({ schemaVersion: 39, engineVersion: 40, contentVersion: 14 });
  expect(current.pending).toEqual(raw.pending); expect(current.annual).toEqual(raw.annual);
  for (const key of histories) expect(current[key]).toEqual([]);
  const legacy = { ...current, schemaVersion: 37, engineVersion: 38, contentVersion: 12 }, before = JSON.stringify(legacy);
  const migrated = decodeWorld(before, true);
  expect(JSON.parse(encodeWorld(migrated))).toEqual({ ...legacy, schemaVersion: 39, engineVersion: 40, contentVersion: 14 });
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
