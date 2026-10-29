#!/usr/bin/env node
'use strict';

// Raw preservation only. No require of game source, command projection or device API.
const h = require('./onboarding-native-support.cjs');
const { fs, path, assert, tables, versions, proof, hash, preflight, rowsHash, rowText, capture } = h;
const same = (actual, expected, label) => assert.equal(rowsHash(actual), rowsHash(expected), label + ': complete raw rows differ');
function retained(previous, actual, label) {
  const counts = new Map(); for (const row of actual) { const key = rowText(row); counts.set(key, (counts.get(key) ?? 0) + 1); }
  for (const row of previous) { const key = rowText(row), count = counts.get(key) ?? 0; assert(count > 0, label + ': original raw row missing/changed'); counts.set(key, count - 1); }
}
const owned = (rows, lifeId, column = 'life_id') => rows.filter(row => row[column] === lifeId);
function verifyRaw(capturesFile) {
  const ready = preflight(capturesFile);
  const { manifest, source } = ready, baseline = capture(manifest.baseline);
  assert(Number.isSafeInteger(baseline.reader) && baseline.reader <= versions.reader, 'Unsupported future baseline reader');
  const first = capture(manifest.phases[0].database), baselineIds = new Set(baseline.rows.lives.map(row => row.id));
  const existing = manifest.mode === 'existing', created = first.rows.lives.filter(row => !baselineIds.has(row.id));
  assert.equal(created.length, existing ? 0 : 1, 'Derive actual existing target or exactly one added life from the separate measured baseline');
  const selectedId = first.rows.preferences.find(row => row.key === 'active_life')?.value;
  const initial = existing ? first.rows.lives.find(row => row.id === selectedId) : created[0]; assert(initial, 'Actual selected target life required');
  const lifeId = initial.id; assert(typeof lifeId === 'string' && lifeId.length && Number.isSafeInteger(initial.revision), 'Actual target identity/revision required');
  if (existing) { assert(baselineIds.has(lifeId), 'Existing target must exist in this actual baseline'); for (const table of tables.filter(table => table !== 'preferences')) same(first.rows[table], baseline.rows[table], 'Existing selected start preserves all baseline ' + table); }
  else assert.equal(fs.readFileSync(manifest.birthCheckpoint.file, 'utf8'), initial.payload, 'Actual supplied birth checkpoint must be exact raw created payload');
  const expectedPreferences = baseline.rows.preferences.map(row => row.key === 'active_life' ? { ...row, value: lifeId } : row);
  if (!expectedPreferences.some(row => row.key === 'active_life')) expectedPreferences.push({ key: 'active_life', value: lifeId });
  const report = { format: 'dreams-onboarding-native-raw-verification-v1', status: 'raw-integrity-passed-not-gameplay-or-visual-acceptance', complete: true,
    scope: 'Read-only source/capture provenance, exact protected baseline preservation, actual target-life row ownership, append-only receipts/history and all-eight-table equality at explicitly attested cold reopens. No runtime is loaded and no commands, predictions, seed searches, SQL writes or native actions are performed. Begin Life/command receipts, revision transitions and backup relationships are observations only; command/world semantic acceptance stays pending. This does not establish creation/input correctness, gameplay outcomes, visual quality or independent observation of device process stops.',
    source, captures: ready.captures, mode: manifest.mode, device: manifest.device,
    baseline: { database: manifest.baseline, reader: baseline.reader, tables: baseline.hashes }, target: { lifeId, previouslyExisted: existing, initialRevision: initial.revision, initialPayloadSha256: hash(initial.payload), ...(!existing ? { birthCheckpoint: manifest.birthCheckpoint } : {}) }, phases: [],
    gameRuntimeLoaded: false, engineCommandsProjected: 0, nativeActionsPerformed: 0, gameplaySemanticAcceptance: false, visualAcceptance: false,
  };
  let previous = baseline, previousLife = null;
  for (let index = 0; index < manifest.phases.length; index++) {
    const phase = manifest.phases[index], current = index === 0 ? first : capture(phase.database), label = phase.id;
    assert.equal(current.reader, versions.reader, label + ': actual coordinated reader');
    same(current.rows.preferences, expectedPreferences, label + ': only normal active-life preference may change');
    for (const table of tables.filter(table => table !== 'preferences')) {
      const key = table === 'lives' ? 'id' : table === 'backups' ? 'life_id' : null;
      const protectedRows = existing && key ? baseline.rows[table].filter(row => row[key] !== lifeId) : baseline.rows[table];
      retained(protectedRows, current.rows[table], label + ': preserve every protected baseline ' + table);
    }
    for (const table of ['branches', 'restore_receipts']) same(current.rows[table], baseline.rows[table], label + ': onboarding adds no restore/branch records');
    for (const [table, column] of [['lives', 'id'], ['backups', 'life_id'], ['receipts', 'life_id'], ['snapshots', 'life_id'], ['snapshot_metadata', 'life_id']]) {
      same(current.rows[table].filter(row => row[column] !== lifeId), baseline.rows[table].filter(row => row[column] !== lifeId), label + ': only actual target-life ' + table + ' allowed');
    }
    const lives = owned(current.rows.lives, lifeId, 'id'), backups = owned(current.rows.backups, lifeId);
    assert.equal(lives.length, 1); assert.equal(backups.length, 1); const life = lives[0], backup = backups[0];
    if (index > 0 && ['cold', 'read-only'].includes(phase.kind)) {
      assert.deepEqual(current.hashes, previous.hashes, label + ': all eight tables exact to preceding actual capture');
    }
    for (const table of ['receipts', 'snapshots', 'snapshot_metadata']) retained(previous.rows[table], current.rows[table], label + ': retain newly created rows too');
    report.phases.push({ id: label, kind: phase.kind, database: phase.database, reader: current.reader, lifeId, revision: life.revision, payloadSha256: hash(life.payload), tables: current.hashes,
      observed: { revisionDelta: previousLife ? life.revision - previousLife.revision : null, receiptRowsAdded: current.rows.receipts.length - previous.rows.receipts.length, snapshotRowsAdded: current.rows.snapshots.length - previous.rows.snapshots.length,
        backupEqualsInitialCurrent: index === 0 ? backup.revision === life.revision && backup.payload === life.payload : null, backupEqualsPreviousActualCurrent: previousLife ? backup.revision === previousLife.revision && backup.payload === previousLife.payload : null },
      allProtectedBaselineRowsExact: true, onlyActualTargetLifeRowsChanged: true, activeLifePreferenceOnly: true, ...(phase.kind === 'cold' ? { allEightTablesExactTo: phase.sameAs, coldAttestation: phase.coldAttestation } : {}) });
    previous = current; previousLife = life;
  }
  assert.deepEqual(preflight(ready.captures.file), ready, 'Pinned source/capture/evidence bytes changed during raw verification');
  report.final = { lifeId, revision: previousLife.revision, tables: previous.hashes };
  return report;
}
function main(argv) {
  const usage = 'node tools/verify-onboarding-native.cjs --captures /ABS/complete-captures.json --output /ABS/NEW-raw-result.json';
  if (argv.length === 1 && argv[0] === '--help') { console.log(usage); return; }
  const options = {};
  for (let index = 0; index < argv.length; index += 2) { assert(['--captures', '--output'].includes(argv[index]) && !Object.hasOwn(options, argv[index]), usage); const value = argv[index + 1]; assert(typeof value === 'string' && path.isAbsolute(value), usage); options[argv[index]] = value; }
  assert(options['--captures'] && options['--output'] && !fs.existsSync(options['--output']), 'Explicit complete captures and new output path required; preserve earlier evidence');
  const toolsBefore = ['onboarding-native-support.cjs', 'verify-onboarding-native.cjs'].map(file => proof(path.join(__dirname, file)));
  const result = verifyRaw(options['--captures']); assert.deepEqual(toolsBefore, toolsBefore.map(pin => proof(pin.file)), 'Verifier helper bytes changed'); result.tools = toolsBefore;
  fs.writeFileSync(options['--output'], JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ output: proof(options['--output']), status: result.status, lifeId: result.final.lifeId, revision: result.final.revision, gameRuntimeLoaded: false, phases: result.phases.length }));
}
if (require.main === module) main(process.argv.slice(2));
module.exports = { retained, verifyRaw, main };
