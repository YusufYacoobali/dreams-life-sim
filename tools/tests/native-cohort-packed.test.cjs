'use strict';

// Main-frame metadata only, deliberately synthetic. These are not complete
// production checkpoint/world validation or genuine saved-game observations.
const { test } = require('node:test'), assert = require('node:assert/strict');
const { gzipSync } = require('node:zlib');
const h = require('../native-cohort-semantic-support.cjs');
const protocol = require('../native-cohort-raw-support.cjs');
const root = cohort => ({ marker: 'synthetic-header-only', schemaVersion: protocol.profiles[cohort].world, engineVersion: protocol.profiles[cohort].engine, contentVersion: protocol.profiles[cohort].content, ...Object.fromEntries(h.requiredArrays.map(key => [key, []])) });
function envelope(value, format) {
  const bytes = Buffer.from(JSON.stringify(value)); let fingerprint = 2166136261;
  for (const byte of bytes) fingerprint = Math.imul(fingerprint ^ byte, 16777619) >>> 0;
  const part = { bytes: bytes.length, hash: fingerprint.toString(16).padStart(8, '0'), data: gzipSync(bytes).toString('base64') };
  return format === 'dreams-checkpoint-v1' ? { format, ...part } : { format, bytes: bytes.length, main: part, people: [], ledger: [] };
}

test('only the two deeply frozen profiles are supported', () => {
  assert.deepEqual(protocol.profiles.c38, { world: 37, engine: 38, content: 12, reader: 17 });
  assert.deepEqual(protocol.profiles.c39, { world: 38, engine: 39, content: 13, reader: 18 });
  for (const key of [undefined, '', 'c37', 'c40', '__proto__', 'constructor']) assert.throws(() => protocol.forCohort(key), /supported cohort/);
  assert.throws(() => { protocol.profiles.c38.reader = 99; }, TypeError);
});
for (const cohort of ['c38', 'c39']) for (const format of ['plain', 'dreams-checkpoint-v1', 'dreams-checkpoint-v2', 'dreams-checkpoint-v3', 'dreams-checkpoint-v4']) {
  test(cohort + ' inspects synthetic ' + format + ' main metadata without migration or people/ledger validation', () => {
    const value = root(cohort), text = JSON.stringify(value), header = h.inspectPacked(format === 'plain' ? text : JSON.stringify(envelope(value, format)));
    assert.equal(header.format, format); assert.equal(header.mainBytes, Buffer.byteLength(text)); assert.equal(header.mainSha256, h.hash(Buffer.from(text)));
    h.assertWritten(header, protocol.profiles[cohort], 'synthetic new write');
    assert.throws(() => h.assertWritten(header, protocol.profiles[cohort === 'c38' ? 'c39' : 'c38'], 'wrong profile'), /exact coordinated tags/);
  });
}
for (const key of h.requiredArrays) test('new-write raw requirement rejects absent/non-array ' + key + ' without pretending to migrate it', () => {
  for (const value of [undefined, null, {}, false, '[]']) {
    const world = root('c38'); if (value === undefined) delete world[key]; else world[key] = value;
    const header = h.inspectPacked(JSON.stringify(world)); assert.equal(header.requiredArrays[key], false);
    assert.throws(() => h.assertWritten(header, protocol.profiles.c38, 'synthetic'), /required array before migration/);
  }
});
test('malformed/unknown frame, bad size/fingerprint and inflated output all fail closed', () => {
  for (const frame of [null, [], { format: 'unknown' }, { format: 'dreams-checkpoint-v4' }, { format: 'dreams-checkpoint-v1', bytes: -1, hash: '00000000', data: '' }]) assert.throws(() => h.inspectPacked(JSON.stringify(frame)));
  const fingerprint = envelope(root('c38'), 'dreams-checkpoint-v4'); fingerprint.main.hash = '00000000'; assert.throws(() => h.inspectPacked(JSON.stringify(fingerprint)), /fingerprint/);
  const size = envelope(root('c38'), 'dreams-checkpoint-v1'); size.bytes++; assert.throws(() => h.inspectPacked(JSON.stringify(size)), /size mismatch/);
  const tooBig = envelope(root('c38'), 'dreams-checkpoint-v4'); tooBig.main.bytes = 32_000_001; assert.throws(() => h.inspectPacked(JSON.stringify(tooBig)), /Bounded actual main/);
  const inflated = envelope({ ...root('c38'), padding: 'x'.repeat(4000) }, 'dreams-checkpoint-v1'), compressed = Buffer.from(inflated.data, 'base64');
  inflated.bytes = 16; compressed.writeUInt32LE(16, compressed.length - 4); inflated.data = compressed.toString('base64');
  assert.throws(() => h.inspectPacked(JSON.stringify(inflated)));
  for (const key of ['schemaVersion', 'engineVersion', 'contentVersion']) { const value = root('c38'); delete value[key]; assert.throws(() => h.inspectPacked(JSON.stringify(value)), /stored root version/); }
});
