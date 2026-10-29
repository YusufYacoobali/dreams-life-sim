'use strict';

// Synthetic protocol worlds only. No production source runtime, genuine game
// world, fixture, device, input, prediction or outcome search is executed here.
const { test } = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { DatabaseSync } = require('node:sqlite');
const h = require('../native-cohort-semantic-support.cjs'), { verify, main } = require('../verify-native-cohort-semantic.cjs');
const rawRoot = path.resolve(__dirname, '..');
const rawProtocol = require(path.join(rawRoot, 'native-cohort-raw-support.cjs'));
const rawVerifier = require(path.join(rawRoot, 'verify-native-cohort-raw.cjs'));
const json = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
const clone = value => JSON.parse(JSON.stringify(value));
const decision = { kind: 'decision', id: 'observed-birthday', choices: [{ id: 'observed-choice', label: 'Already chosen by the synthetic coordinator' }] };
const result = { kind: 'result', id: 'observed-result', body: '£1.00', effects: [] };
function fakeGame(cohort = 'c38') {
  const versions = rawProtocol.profiles[cohort];
  const calls = [], game = { calls, encodeWorld: JSON.stringify, fullName: person => person.first + ' ' + person.last, ageOn: (person, date) => date.year - person.born.year,
    immutableWorld: clone, unpackCheckpoint: text => { const world = JSON.parse(text); assert.equal(world.marker, 'synthetic-protocol-only'); return { ...world, schemaVersion: versions.world, engineVersion: versions.engine, contentVersion: versions.content, ...Object.fromEntries(h.requiredArrays.map(key => [key, world[key] ?? []])) }; },
    resolveCommand: (before, command) => {
      calls.push(command); const next = clone(before); next.revision++;
      if (command.type === 'advance') { assert.equal(before.pending, null); assert.equal(before.annual, null); next.date.year++; next.random.outcomes = 112; next.pending = clone(decision); next.annual = { monthsProcessed: 1 }; }
      else if (command.type === 'choose') { assert.equal(command.eventId, before.pending.id); assert.equal(command.choiceId, 'observed-choice'); next.random.outcomes = 333; next.pending = clone(result); next.accounts[0].cash = '100'; }
      else if (command.type === 'acknowledge') { assert.equal(command.resultId, before.pending.id); next.pending = null; }
      else if (command.type === 'meditate') { next.extra.counter++; next.pending = clone(result); }
      else throw new Error('No implicit command or alternate outcome: ' + command.type);
      return next;
    },
    createGameStore: deps => {
      const state = { world: null, busy: false, error: null,
        bootstrap: async () => { const persistence = await deps.repository(); await persistence.list(); state.world = await persistence.active(); return true; },
        acknowledgeBirth: async () => { const before = state.world; state.busy = true; try { state.world = await (await deps.repository()).commit({ ...before, birthAcknowledged: true, revision: before.revision + 1 }, before.revision, 'birth:' + before.id); return true; } finally { state.busy = false; } },
      }; return { getState: () => state };
    },
  }; return game;
}
function fixture(t, existing = false, cohort = 'c38', legacy = false) {
  const rawSupport = rawProtocol.forCohort(cohort), { verifyRaw } = rawVerifier.forCohort(cohort), versions = rawSupport.versions;
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dreams-semantic-protocol-')); t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const root = path.join(directory, 'source'); fs.mkdirSync(root);
  const files = ['src/game/model.ts', 'src/game/engine.ts', 'src/state/gameStore.ts', 'src/persistence/checkpoints.ts', 'src/persistence/repository.ts', 'app/new-life.tsx', 'app/birth.tsx', 'package.json', 'package-lock.json', 'app.json'];
  for (const name of files) { const file = path.join(root, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, name.endsWith('.json') ? '{}\n' : "throw new Error('Synthetic source must never execute');\n"); }
  // Fixed independent real-Git fixture from the approved raw protocol suite;
  // its TS blobs throw if executed. The semantic tests inject a labelled fake.
  const commit = '87039d41756e567b0d7ea04f28f689db8fe2c526', proofs = {};
  const tree = files.slice().sort().map(name => '100644 blob ' + (name.endsWith('.json') ? '0967ef424bce6791893e9a57bb952f80fd536e93' : '827bab20e1870de024fecc5b10764866fb81a527') + '\t' + name + '\0').join('');
  for (const [key, bytes] of Object.entries({ head: commit + '\n', status: '', tree, commit: 'tree 2df60beb3ebea67e70d318991d759ae648cb673b\nauthor Protocol Test <protocol@example.invalid> 946684800 +0000\ncommitter Protocol Test <protocol@example.invalid> 946684800 +0000\n\nSynthetic source protocol fixture\n' })) { const file = path.join(directory, key + '.proof'); fs.writeFileSync(file, bytes); proofs[key] = h.proof(file); }
  const source = { format: 'dreams-native-cohort-source-v1', cohort, complete: true, root, commit, versions: rawSupport.versions, git: proofs, source: Object.fromEntries(files.map(name => [name, h.proof(path.join(root, name)).sha256])) };
  const sourcePath = path.join(directory, 'source.json'); json(sourcePath, source);
  const lifeId = existing ? 'retained-beta' : 'synthetic-new-id';
  const first = { marker: 'synthetic-protocol-only', schemaVersion: versions.world, engineVersion: versions.engine, contentVersion: versions.content, ...Object.fromEntries(h.requiredArrays.map(key => [key, []])), id: lifeId, activePersonId: 'person', revision: existing ? 7 : 0, birthAcknowledged: existing, date: { year: 2026, month: 1, day: 1 }, people: { person: { first: 'Synthetic', last: 'Person', born: { year: 2026, month: 1, day: 1 } } }, random: { outcomes: 123, npcs: 456 }, pending: null, annual: null, accounts: [{ id: 'cash', cash: '0' }], extra: { counter: 0, nested: [1, 2, 3] } };
  // Captured protocol states are authored separately from the fake replay engine.
  const begun = { ...clone(first), revision: 1, birthAcknowledged: true };
  const birthday = { ...clone(begun), revision: 2, date: { year: 2027, month: 1, day: 1 }, random: { outcomes: 112, npcs: 456 }, pending: clone(decision), annual: { monthsProcessed: 1 } };
  const chosen = { ...clone(birthday), revision: 3, random: { outcomes: 333, npcs: 456 }, pending: clone(result), accounts: [{ id: 'cash', cash: '100' }] };
  const acknowledged = { ...clone(chosen), revision: 4, pending: null };
  const meditated = { ...clone(first), revision: 8, pending: clone(result), extra: { counter: 1, nested: [1, 2, 3] } }, existingAck = { ...clone(meditated), revision: 9, pending: null };
  if (legacy) { first.schemaVersion = 36; first.engineVersion = 37; first.contentVersion = 12; delete first.npcMoves; for (const written of [meditated, existingAck]) { delete written.npcMoves; written.npcMoves = []; } }
  const worlds = existing ? [first, meditated, meditated, existingAck, existingAck] : [first, first, begun, begun, birthday, birthday, chosen, chosen, acknowledged, acknowledged];
  const names = existing ? rawSupport.existingMilestones : rawSupport.milestones, phases = [];
  const baseline = path.join(directory, 'baseline.db'), sql = new DatabaseSync(baseline);
  sql.exec("CREATE TABLE lives(id TEXT PRIMARY KEY,name TEXT,revision INTEGER,updated_at TEXT,payload TEXT); CREATE TABLE backups(life_id TEXT PRIMARY KEY,revision INTEGER,payload TEXT); CREATE TABLE preferences(key TEXT PRIMARY KEY,value TEXT); CREATE TABLE receipts(life_id TEXT,command_id TEXT,revision INTEGER,PRIMARY KEY(life_id,command_id)); CREATE TABLE snapshots(life_id TEXT,snapshot_id TEXT,payload TEXT,PRIMARY KEY(life_id,snapshot_id)); CREATE TABLE snapshot_metadata(life_id TEXT,snapshot_id TEXT,revision INTEGER,metadata TEXT,PRIMARY KEY(life_id,snapshot_id)); CREATE TABLE branches(life_id TEXT PRIMARY KEY,metadata TEXT); CREATE TABLE restore_receipts(source_life_id TEXT,command_id TEXT,target_life_id TEXT,PRIMARY KEY(source_life_id,command_id)); PRAGMA user_version=15;");
  for (const id of ['retained-alpha', 'retained-beta']) { sql.prepare('INSERT INTO lives VALUES(?,?,?,?,?)').run(id, id === lifeId ? 'Synthetic Person' : id, 7, 'synthetic', id === lifeId ? JSON.stringify(first) : 'unrelated original bytes'); sql.prepare('INSERT INTO backups VALUES(?,?,?)').run(id, 6, id === lifeId ? JSON.stringify({ ...first, revision: 6 }) : 'unrelated backup bytes'); sql.prepare('INSERT INTO receipts VALUES(?,?,?)').run(id, 'original-command', 7); }
  sql.exec("INSERT INTO preferences VALUES('active_life','retained-alpha'); INSERT INTO preferences VALUES('settings','original settings'); INSERT INTO snapshots VALUES('retained-alpha','point','original point bytes'); INSERT INTO snapshot_metadata VALUES('retained-alpha','point',3,'original metadata bytes');"); sql.close();
  const database = file => ({ main: h.proof(file), wal: null }), birthCheckpoint = path.join(directory, 'birth.checkpoint'); fs.writeFileSync(birthCheckpoint, JSON.stringify(first));
  let previous = baseline;
  for (const [index, id] of names.entries()) {
    const file = path.join(directory, id + '.db'); fs.copyFileSync(previous, file); const db = new DatabaseSync(file); db.exec('PRAGMA user_version=' + versions.reader + '');
    const kind = index === 0 ? existing ? 'read-only' : 'created' : id.startsWith('cold-') ? 'cold' : id === 'begun' ? 'begin-life' : 'command';
    const command = id === 'birthday-decision' ? { type: 'advance' } : id === 'birthday-result' ? { type: 'choose', eventId: 'observed-birthday', choiceId: 'observed-choice' } : id === 'action-saved' ? { type: 'meditate' } : id === 'acknowledged' ? { type: 'acknowledge', resultId: 'observed-result' } : null;
    if (index === 0) { if (!existing) { db.prepare('INSERT INTO lives VALUES(?,?,?,?,?)').run(lifeId, 'Synthetic Person', 0, 'synthetic', JSON.stringify(first)); db.prepare('INSERT INTO backups VALUES(?,?,?)').run(lifeId, 0, JSON.stringify(first)); } db.prepare("UPDATE preferences SET value=? WHERE key='active_life'").run(lifeId); }
    else if (kind !== 'cold') { const before = db.prepare('SELECT * FROM lives WHERE id=?').get(lifeId); db.prepare('UPDATE backups SET revision=?,payload=? WHERE life_id=?').run(before.revision, before.payload, lifeId); db.prepare('UPDATE lives SET revision=?,payload=? WHERE id=?').run(worlds[index].revision, JSON.stringify(worlds[index]), lifeId); db.prepare('INSERT INTO receipts VALUES(?,?,?)').run(lifeId, kind === 'begin-life' ? 'birth:' + lifeId : 'revision:' + before.revision + ':' + command.type, worlds[index].revision); }
    db.close();
    const png = path.join(directory, id + '.png'), xml = path.join(directory, id + '.xml'); fs.writeFileSync(png, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7xkAAAAASUVORK5CYII=', 'base64')); fs.writeFileSync(xml, '<hierarchy><node text="Synthetic protocol only" /></hierarchy>');
    const phase = { id, kind, database: database(file), png: h.proof(png), xml: h.proof(xml), coordinatorPersonallyViewed: true, ...(command ? { command } : {}) };
    if (kind === 'cold') { phase.sameAs = phases.at(-1).id; const log = path.join(directory, id + '.txt'), attestation = path.join(directory, id + '.json'); fs.writeFileSync(log, 'Synthetic stop log; no actual device.'); json(attestation, { complete: true, stopped: true, restarted: true, from: phase.sameAs, to: id, evidence: h.proof(log) }); phase.coldAttestation = h.proof(attestation); }
    phases.push(phase); previous = file;
  }
  const captures = path.join(directory, 'captures.json'), rawFile = path.join(directory, 'raw.json'), traceFile = path.join(directory, 'trace.json');
  const manifest = { format: 'dreams-native-cohort-captures-v1', cohort, complete: true, mode: existing ? 'existing' : 'custom', device: 'Synthetic; no device', scope: 'Protocol only; no actual game, input or native evidence', sourceManifest: h.proof(sourcePath), baseline: database(baseline), ...(!existing ? { birthCheckpoint: h.proof(birthCheckpoint) } : {}), phases };
  const save = () => { json(sourcePath, source); manifest.sourceManifest = h.proof(sourcePath); json(captures, manifest); if (fs.existsSync(traceFile)) { const trace = JSON.parse(fs.readFileSync(traceFile, 'utf8')); trace.capturesManifest = h.proof(captures); json(traceFile, trace); } };
  const refresh = () => { save(); const raw = verifyRaw(captures); raw.tools = ['native-cohort-raw-support.cjs', 'verify-native-cohort-raw.cjs'].map(name => h.proof(path.join(rawRoot, name))); json(rawFile, raw); json(traceFile, { format: 'dreams-native-cohort-semantic-replay-v1', cohort, complete: true, capturesManifest: h.proof(captures), rawSupport: h.proof(path.join(rawRoot, 'native-cohort-raw-support.cjs')), rawVerification: h.proof(rawFile) }); }; refresh();
  const tamper = (id, action, allAfter = false) => { const start = phases.findIndex(phase => phase.id === id); for (let index = start; index < phases.length && (allAfter || index === start || phases[index].kind === 'cold'); index++) { const phase = phases[index], db = new DatabaseSync(phase.database.main.file); action(db, phase); db.close(); phase.database = database(phase.database.main.file); } refresh(); };
  return { directory, root, source, sourcePath, captures, traceFile, rawFile, manifest, save, refresh, tamper, first };
}
function loader(cohort = 'c38') {
  const game = fakeGame(cohort); let loads = 0, closes = 0;
  return { game, get loads() { return loads; }, get closes() { return closes; }, loadRuntime: () => { loads++; return { game, close: () => { closes++; }, provenance: () => ({ scope: 'SYNTHETIC test double; production TS blobs never executed' }) }; } };
}

test('pending trace refuses before raw support, SQL or source runtime and preserves output paths', async t => {
  const pending = path.join(__dirname, '../native-cohort-c38-semantic.pending.json'), fake = loader(); await assert.rejects(verify(pending, fake), /pending\/incomplete/); assert.equal(fake.loads, 0);
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dreams-semantic-output-')); t.after(() => fs.rmSync(directory, { recursive: true, force: true })); const output = path.join(directory, 'result.json');
  await assert.rejects(main(['--trace', pending, '--output', output]), /pending\/incomplete/); assert(!fs.existsSync(output)); fs.writeFileSync(output, 'retained evidence'); await assert.rejects(main(['--trace', pending, '--output', output]), /NEW output/); assert.equal(fs.readFileSync(output, 'utf8'), 'retained evidence');
});
test('complete source preflight refuses a missing pin or changed TS source before runtime load', async t => {
  for (const kind of ['pin', 'bytes']) await t.test(kind, async t => { const f = fixture(t), fake = loader(); if (kind === 'pin') { delete f.source.source['src/game/engine.ts']; f.save(); } else fs.appendFileSync(path.join(f.root, 'src/game/engine.ts'), '// changed'); await assert.rejects(verify(f.traceFile, fake), /Incomplete source manifest|Git blob differs/); assert.equal(fake.loads, 0); });
});
test('a command attached to a created, read-only, cold or Begin Life phase is never silently skipped', async t => {
  for (const id of ['newborn', 'cold-newborn', 'begun']) await t.test(id, async t => { const f = fixture(t), fake = loader(); f.manifest.phases.find(phase => phase.id === id).command = { type: 'unreplayed-command' }; f.refresh(); await assert.rejects(verify(f.traceFile, fake), /must not silently carry/); assert.equal(fake.loads, 0); });
  await t.test('existing-start', async t => { const f = fixture(t, true), fake = loader(); f.manifest.phases[0].command = { type: 'unreplayed-command' }; f.refresh(); await assert.rejects(verify(f.traceFile, fake), /must not silently carry/); assert.equal(fake.loads, 0); });
});
test('synthetic newborn replay executes only three supplied engine commands and one actual store-method protocol; annual interruption is retained', async t => {
  const f = fixture(t), fake = loader(), report = await verify(f.traceFile, fake); assert.equal(fake.loads, 1); assert.equal(fake.closes, 1); assert.deepEqual(fake.game.calls.map(command => command.type), ['advance', 'choose', 'acknowledge']); assert.equal(report.engineCommandsReplayed, 3); assert.equal(report.birthAcknowledgementsReplayed, 1); assert.equal(report.phases.length, 10); assert.equal(report.creationSeedReconstructed, false); assert.equal(report.actualNativeActionsPerformed, 0); assert.equal(report.visualAcceptance, false); assert.equal(report.phases.at(-1).annualSha256, h.hash(JSON.stringify({ monthsProcessed: 1 })));
});
test('synthetic existing-life replay uses the observed start without any birth acknowledgement', async t => {
  const f = fixture(t, true), fake = loader(), report = await verify(f.traceFile, fake); assert.equal(report.engineCommandsReplayed, 2); assert.equal(report.birthAcknowledgementsReplayed, 0); assert.deepEqual(fake.game.calls.map(command => command.type), ['meditate', 'acknowledge']); assert.equal(fake.closes, 1);
});
test('supplied illegal choice fails once instead of selecting, retrying or consuming an interruption', async t => {
  const f = fixture(t), fake = loader(); f.manifest.phases.find(phase => phase.id === 'birthday-result').command.choiceId = 'not-observed'; f.refresh(); await assert.rejects(verify(f.traceFile, fake), /observed-choice/); assert.deepEqual(fake.game.calls.map(command => command.type), ['advance', 'choose']); assert.equal(fake.closes, 1);
});
test('raw-integrity-passing differences in currency, unknown fields, RNG or backup are semantic failures', async t => {
  for (const kind of ['currency', 'unknown-field', 'rng', 'backup']) await t.test(kind, async t => {
    const f = fixture(t), fake = loader();
    f.tamper(kind === 'backup' ? 'begun' : 'birthday-result', db => {
      const table = kind === 'backup' ? 'backups' : 'lives', key = table === 'lives' ? 'id' : 'life_id', row = db.prepare('SELECT payload FROM ' + table + ' WHERE ' + key + '=?').get(f.first.id), world = JSON.parse(row.payload);
      if (kind === 'currency') world.pending.body = '$1.00'; else if (kind === 'unknown-field' || kind === 'backup') world.extra.nested[2] = 999; else world.random.npcs++;
      db.prepare('UPDATE ' + table + ' SET payload=? WHERE ' + key + '=?').run(JSON.stringify(world), f.first.id);
    });
    await assert.rejects(verify(f.traceFile, fake), kind === 'backup' ? /exact prior raw current/ : /complete canonical world differs/); assert.equal(fake.closes, 1);
  });
});
test('raw-integrity-passing invented birth receipt key and extra command receipt are refused', async t => {
  for (const kind of ['birth-key', 'extra']) await t.test(kind, async t => { const f = fixture(t), fake = loader(); f.tamper('begun', db => { if (kind === 'birth-key') db.prepare("UPDATE receipts SET command_id='revision:0:invented-birth' WHERE life_id=? AND command_id=?").run(f.first.id, 'birth:' + f.first.id); else db.prepare('INSERT INTO receipts VALUES(?,?,?)').run(f.first.id, 'unobserved-command', 1); }, true); await assert.rejects(verify(f.traceFile, fake), /only exact supplied-command receipts/); assert.equal(fake.closes, 1); });
});
test('a fake store that skips commit or sends the wrong birth key cannot pass the recording Persistence boundary', async t => {
  for (const kind of ['skip', 'wrong-key']) await t.test(kind, async () => { const game = fakeGame(); game.createGameStore = deps => { const state = { busy: false, error: null, world: null, bootstrap: async () => { const repo = await deps.repository(); await repo.list(); state.world = await repo.active(); return true; }, acknowledgeBirth: async () => { const next = { ...state.world, birthAcknowledged: true, revision: 1 }; state.world = kind === 'skip' ? next : await (await deps.repository()).commit(next, 0, 'invented-key'); return true; } }; return { getState: () => state }; }; const before = { id: 'synthetic', revision: 0, activePersonId: 'p', people: { p: { first: 'Synthetic', last: 'Person' } }, birthAcknowledged: false }; await assert.rejects(h.acknowledgeBirth(game, before), kind === 'skip' ? /1/ : /birth:synthetic/); });
});

for (const cohort of ['c38', 'c39']) {
  test(cohort + ' fixed profile replays only supplied synthetic new-life commands', async t => {
    const f = fixture(t, false, cohort), fake = loader(cohort), result = await verify(f.traceFile, fake);
    assert.equal(result.cohort, cohort); assert.equal(result.engineCommandsReplayed, 3); assert.equal(result.birthAcknowledgementsReplayed, 1);
    assert(result.phases.every(phase => phase.currentWritten && Object.values(phase.storedCurrent.requiredArrays).every(Boolean)));
    assert.equal(fake.closes, 1);
  });
  test(cohort + ' permits exact untouched legacy boot/first backup while requiring actual new written roots', async t => {
    const f = fixture(t, true, cohort, true), fake = loader(cohort), result = await verify(f.traceFile, fake);
    assert.equal(result.phases[0].currentWritten, false); assert.equal(result.phases[0].storedCurrent.versions.world, 36);
    assert.equal(result.phases[0].storedCurrent.requiredArrays.npcMoves, false);
    assert.equal(result.phases[1].storedBackup.versions.world, 36); assert.equal(result.phases[1].storedBackup.requiredArrays.npcMoves, false);
    assert(result.phases.slice(1).every(phase => phase.currentWritten && phase.storedCurrent.versions.world === rawProtocol.profiles[cohort].world && Object.values(phase.storedCurrent.requiredArrays).every(Boolean)));
    assert.equal(result.engineCommandsReplayed, 2); assert.equal(result.birthAcknowledgementsReplayed, 0);
  });
  test(cohort + ' refuses stale written raw tags even when the fake decoder would migrate them', async t => {
    const f = fixture(t, true, cohort), fake = loader(cohort);
    f.tamper('action-saved', db => { const row = db.prepare('SELECT id,payload FROM lives WHERE id=?').get(f.first.id), world = JSON.parse(row.payload); world.schemaVersion = 36; world.engineVersion = 37; world.contentVersion = 12; db.prepare('UPDATE lives SET payload=? WHERE id=?').run(JSON.stringify(world), row.id); });
    await assert.rejects(verify(f.traceFile, fake), /newly written current must store exact coordinated tags/);
    assert.equal(fake.game.calls.length, 0); assert.equal(fake.closes, 1);
  });
  test(cohort + ' refuses a required raw array omitted by a new write before fake migration can hide it', async t => {
    const f = fixture(t, true, cohort), fake = loader(cohort);
    f.tamper('action-saved', db => { const row = db.prepare('SELECT id,payload FROM lives WHERE id=?').get(f.first.id), world = JSON.parse(row.payload); delete world.npcMoves; db.prepare('UPDATE lives SET payload=? WHERE id=?').run(JSON.stringify(world), row.id); });
    await assert.rejects(verify(f.traceFile, fake), /required array before migration: npcMoves/);
    assert.equal(fake.game.calls.length, 0); assert.equal(fake.closes, 1);
  });
}

test('cross-profile source/trace mismatch refuses before the injected runtime loader', async t => {
  const f = fixture(t, true, 'c39'), trace = JSON.parse(fs.readFileSync(f.traceFile, 'utf8')), fake = loader('c39'); trace.cohort = 'c38'; json(f.traceFile, trace);
  await assert.rejects(verify(f.traceFile, fake), /another explicit cohort|exact coordinated cohort/); assert.equal(fake.loads, 0);
});
test('each pending profile refuses before any runtime/SQL capture or output', async t => {
  for (const cohort of ['c38', 'c39']) {
    const fake = loader(cohort); await assert.rejects(verify(path.join(__dirname, '../native-cohort-' + cohort + '-semantic.pending.json'), fake), /pending\/incomplete/); assert.equal(fake.loads, 0);
    const hRaw = rawProtocol.forCohort(cohort);
    assert.throws(() => hRaw.preflight(path.join(__dirname, '../native-cohort-' + cohort + '-captures.pending.json')), /pending\/incomplete/);
    assert.throws(() => hRaw.preflight(path.join(__dirname, '../native-cohort-' + cohort + '-existing.pending.json')), /pending\/incomplete/);
    assert.throws(() => hRaw.verifySource(path.join(__dirname, '../native-cohort-' + cohort + '-source.pending.json')), /pending\/incomplete/);
  }
});

for (const name of ['src/hidden.json', 'app/hidden.css', 'assets/hidden.bin']) test('unlisted actual ' + name + ' refuses before runtime or SQLite capture load', async t => {
  const f = fixture(t, true), fake = loader(), absolute = path.join(f.root, name); fs.mkdirSync(path.dirname(absolute), { recursive: true }); fs.writeFileSync(absolute, 'unlisted synthetic runtime bytes');
  const Module = require('node:module'), load = Module._load; let sqliteLoads = 0;
  Module._load = function (request, ...args) { if (request === 'node:sqlite') { sqliteLoads++; throw new Error('SQL capture before source preflight'); } return load.call(this, request, ...args); };
  try { await assert.rejects(verify(f.traceFile, fake), /missing\/unlisted runtime files/); assert.equal(fake.loads, 0); assert.equal(sqliteLoads, 0); }
  finally { Module._load = load; }
});
