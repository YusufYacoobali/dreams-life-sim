'use strict';

// Synthetic Git/SQLite protocol tests only. No game world, device or runtime is used.
const { test } = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { DatabaseSync } = require('node:sqlite');
const h = require('../native-cohort-raw-support.cjs').forCohort('c38');
const { verifyRaw } = require('../verify-native-cohort-raw.cjs').forCohort('c38');
const json = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
function fixture(t, existing = false) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dreams-native-onboarding-protocol-')); t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const root = path.join(directory, 'source'); fs.mkdirSync(root);
  const files = ['src/game/model.ts', 'src/game/engine.ts', 'src/state/gameStore.ts', 'src/persistence/checkpoints.ts', 'src/persistence/repository.ts', 'app/new-life.tsx', 'app/birth.tsx', 'package.json', 'package-lock.json', 'app.json'];
  for (const name of files) { const absolute = path.join(root, name); fs.mkdirSync(path.dirname(absolute), { recursive: true }); fs.writeFileSync(absolute, name.endsWith('.json') ? '{}\n' : "throw new Error('Synthetic source must never execute');\n"); }
  // Independently produced by actual shell Git from these ten synthetic files;
  // no nested subprocess or validator tree encoder manufactures this expected root.
  const commit = '87039d41756e567b0d7ea04f28f689db8fe2c526';
  const tree = files.slice().sort().map(name => '100644 blob ' + (name.endsWith('.json') ? '0967ef424bce6791893e9a57bb952f80fd536e93' : '827bab20e1870de024fecc5b10764866fb81a527') + '\t' + name + '\0').join('');
  const gitProofs = { head: commit + '\n', status: '', tree, commit: 'tree 2df60beb3ebea67e70d318991d759ae648cb673b\nauthor Protocol Test <protocol@example.invalid> 946684800 +0000\ncommitter Protocol Test <protocol@example.invalid> 946684800 +0000\n\nSynthetic source protocol fixture\n' };
  const proofs = {};
  for (const [key, bytes] of Object.entries(gitProofs)) { const file = path.join(directory, key + '.proof'); fs.writeFileSync(file, bytes); proofs[key] = h.proof(file); }
  const source = { format: 'dreams-native-cohort-source-v1', cohort: 'c38', complete: true, root, commit, versions: h.versions, git: proofs, source: Object.fromEntries(files.map(name => [name, h.proof(path.join(root, name)).sha256])) };
  const sourcePath = path.join(directory, 'source.json'); json(sourcePath, source);
  const baseline = path.join(directory, 'baseline.db'), db = new DatabaseSync(baseline);
  db.exec("CREATE TABLE lives(id TEXT PRIMARY KEY,name TEXT,revision INTEGER,updated_at TEXT,payload TEXT); CREATE TABLE backups(life_id TEXT PRIMARY KEY,revision INTEGER,payload TEXT); CREATE TABLE preferences(key TEXT PRIMARY KEY,value TEXT); CREATE TABLE receipts(life_id TEXT,command_id TEXT,revision INTEGER,PRIMARY KEY(life_id,command_id)); CREATE TABLE snapshots(life_id TEXT,snapshot_id TEXT,payload TEXT,PRIMARY KEY(life_id,snapshot_id)); CREATE TABLE snapshot_metadata(life_id TEXT,snapshot_id TEXT,revision INTEGER,metadata TEXT,PRIMARY KEY(life_id,snapshot_id)); CREATE TABLE branches(life_id TEXT PRIMARY KEY,metadata TEXT); CREATE TABLE restore_receipts(source_life_id TEXT,command_id TEXT,target_life_id TEXT,PRIMARY KEY(source_life_id,command_id)); PRAGMA user_version=15;");
  for (const id of ['retained-alpha', 'retained-beta']) { db.prepare('INSERT INTO lives VALUES(?,?,?,?,?)').run(id, id, 7, 'synthetic', 'original-' + id); db.prepare('INSERT INTO backups VALUES(?,?,?)').run(id, 6, 'backup-' + id); db.prepare('INSERT INTO receipts VALUES(?,?,?)').run(id, 'original-command', 7); }
  db.exec("INSERT INTO preferences VALUES('active_life','retained-alpha'); INSERT INTO preferences VALUES('app_settings','exact original settings'); INSERT INTO snapshots VALUES('retained-alpha','original-point','original snapshot bytes'); INSERT INTO snapshot_metadata VALUES('retained-alpha','original-point',3,'original metadata bytes'); INSERT INTO branches VALUES('retained-alpha','original branch bytes'); INSERT INTO restore_receipts VALUES('retained-alpha','original-restore','retained-beta');"); db.close();
  const database = file => ({ main: h.proof(file), wal: null }), birthPayload = 'synthetic raw birth payload; deliberately not a game checkpoint';
  const birthCheckpoint = path.join(directory, 'birth.checkpoint'); fs.writeFileSync(birthCheckpoint, birthPayload);
  const png = path.join(directory, 'synthetic.png'), xml = path.join(directory, 'synthetic.xml'), log = path.join(directory, 'synthetic-process.txt');
  fs.writeFileSync(png, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7xkAAAAASUVORK5CYII=', 'base64'));
  fs.writeFileSync(xml, '<hierarchy><node text="Synthetic protocol test only" /></hierarchy>'); fs.writeFileSync(log, 'Synthetic attestation only. No native process was observed.');
  const phases = [], targetId = existing ? 'retained-beta' : 'actual-derived-new-id'; let previous = baseline;
  for (const [index, id] of (existing ? h.existingMilestones : h.milestones).entries()) {
    const file = path.join(directory, id + '.db'); fs.copyFileSync(previous, file); const sql = new DatabaseSync(file); sql.exec('PRAGMA user_version=17');
    const kind = index === 0 ? existing ? 'read-only' : 'created' : id.startsWith('cold-') ? 'cold' : id === 'begun' ? 'begin-life' : 'command';
    if (index === 0) { if (!existing) { sql.prepare('INSERT INTO lives VALUES(?,?,?,?,?)').run(targetId, 'Synthetic newborn', 0, 'synthetic', birthPayload); sql.prepare('INSERT INTO backups VALUES(?,?,?)').run(targetId, 0, birthPayload); } sql.prepare("UPDATE preferences SET value=? WHERE key='active_life'").run(targetId); }
    else if (kind !== 'cold') {
      const before = sql.prepare('SELECT * FROM lives WHERE id=?').get(targetId);
      // Intentionally not assumed engine semantics: raw verification must report, not bless,
      // this arbitrary revision increment and non-engine receipt key.
      sql.prepare('UPDATE backups SET revision=?,payload=? WHERE life_id=?').run(before.revision, before.payload, targetId);
      sql.prepare('UPDATE lives SET revision=?,payload=? WHERE id=?').run(before.revision + 3, 'synthetic-payload-' + id, targetId);
      sql.prepare('INSERT INTO receipts VALUES(?,?,?)').run(targetId, 'observed-synthetic-' + id, before.revision + 3);
      if (id === 'birthday-decision') { sql.prepare('INSERT INTO snapshots VALUES(?,?,?)').run(targetId, 'synthetic-new-point', 'new snapshot bytes'); sql.prepare('INSERT INTO snapshot_metadata VALUES(?,?,?,?)').run(targetId, 'synthetic-new-point', 3, 'new metadata bytes'); }
    }
    sql.close(); const picture = path.join(directory, id + '.png'), hierarchy = path.join(directory, id + '.xml'); fs.copyFileSync(png, picture); fs.copyFileSync(xml, hierarchy);
    const phase = { id, kind, database: database(file), png: h.proof(picture), xml: h.proof(hierarchy), coordinatorPersonallyViewed: true };
    if (kind === 'command') phase.command = { type: 'synthetic-observation-only' };
    if (kind === 'cold') { phase.sameAs = phases.at(-1).id; const file = path.join(directory, id + '.attestation.json'); json(file, { complete: true, stopped: true, restarted: true, from: phase.sameAs, to: id, evidence: h.proof(log) }); phase.coldAttestation = h.proof(file); }
    phases.push(phase); previous = file;
  }
  const manifest = { format: 'dreams-native-cohort-captures-v1', cohort: 'c38', complete: true, mode: existing ? 'existing' : 'custom', device: 'Synthetic protocol tests; no device', scope: 'Raw invariants only; no genuine birth/game/world/native acceptance', sourceManifest: h.proof(sourcePath), baseline: database(baseline), ...(!existing ? { birthCheckpoint: h.proof(birthCheckpoint) } : {}), phases };
  const capturePath = path.join(directory, 'captures.json'); json(capturePath, manifest);
  const save = () => { json(sourcePath, source); manifest.sourceManifest = h.proof(sourcePath); json(capturePath, manifest); };
  const alterDB = (id, sql) => { const phase = phases.find(item => item.id === id), db = new DatabaseSync(phase.database.main.file); db.exec(sql); db.close(); phase.database = database(phase.database.main.file); save(); };
  return { directory, root, source, sourcePath, manifest, capturePath, save, alterDB };
}

test('both pending templates refuse before any SQL/game loader or successful output', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dreams-native-pending-')); t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const Module = require('node:module'), load = Module._load; let forbidden = 0;
  Module._load = function (name, ...args) { if (name === 'node:sqlite' || /src\/game/.test(name)) { forbidden++; throw new Error('Premature SQLite/game loader'); } return load.call(this, name, ...args); };
  try {
    assert.throws(() => h.preflight(path.join(__dirname, '../native-cohort-c38-captures.pending.json')), /pending\/incomplete/);
    assert.throws(() => h.preflight(path.join(__dirname, '../native-cohort-c38-existing.pending.json')), /pending\/incomplete/);
    assert.throws(() => h.verifySource(path.join(__dirname, '../native-cohort-c38-source.pending.json')), /pending\/incomplete/);
    assert.equal(forbidden, 0);
  } finally { Module._load = load; }
  const output = path.join(directory, 'must-not-exist.json');
  assert.throws(() => require('../verify-native-cohort-raw.cjs').forCohort('c38').main(['--captures', path.join(__dirname, '../native-cohort-c38-captures.pending.json'), '--output', output]), /pending\/incomplete/); assert(!fs.existsSync(output));
});

test('real synthetic Git proofs plus complete captures pass raw checks without promoting arbitrary rows to semantic acceptance', t => {
  const f = fixture(t), ready = h.preflight(f.capturePath), result = verifyRaw(f.capturePath);
  assert.equal(result.target.lifeId, 'actual-derived-new-id'); assert.equal(result.target.previouslyExisted, false); assert.equal(result.baseline.tables.lives.rows, 2); assert.equal(result.final.tables.lives.rows, 3);
  assert.equal(result.gameRuntimeLoaded, false); assert.equal(result.engineCommandsProjected, 0); assert.equal(result.gameplaySemanticAcceptance, false); assert.equal(result.visualAcceptance, false);
  assert.match(result.status, /not-gameplay-or-visual/); assert.equal(result.phases.find(phase => phase.id === 'begun').observed.revisionDelta, 3);
  assert.equal(result.phases.filter(phase => phase.kind === 'cold').length, 5); assert.deepEqual(h.preflight(f.capturePath), ready);
});

test('an existing target is derived from its separate measured baseline without creating a life or relaxing other-life/history preservation', t => {
  const f = fixture(t, true), result = verifyRaw(f.capturePath);
  assert.equal(result.target.lifeId, 'retained-beta'); assert.equal(result.target.previouslyExisted, true); assert.equal(result.target.initialRevision, 7); assert(!Object.hasOwn(result.target, 'birthCheckpoint'));
  assert.equal(result.baseline.tables.lives.rows, 2); assert.equal(result.final.tables.lives.rows, 2); assert.equal(result.gameplaySemanticAcceptance, false); assert.equal(result.gameRuntimeLoaded, false);
  assert.equal(result.phases.filter(phase => phase.kind === 'cold').length, 2);
});

test('existing selected start cannot hide an action, extra life, changed other life or lost original target receipt', async t => {
  for (const [name, id, sql, reason] of [
    ['hidden initial action', 'existing-start', "UPDATE lives SET payload='hidden change' WHERE id='retained-beta'", /Existing selected start preserves/],
    ['extra initial life', 'existing-start', "INSERT INTO lives VALUES('phantom','phantom',0,'synthetic','phantom')", /actual existing target/],
    ['changed other life', 'action-saved', "UPDATE lives SET payload='changed' WHERE id='retained-alpha'", /protected baseline lives/],
    ['lost original target receipt', 'action-saved', "DELETE FROM receipts WHERE life_id='retained-beta' AND command_id='original-command'", /baseline receipts/],
  ]) await t.test(name, t => { const f = fixture(t, true); f.alterDB(id, sql); assert.throws(() => verifyRaw(f.capturePath), reason); });
});

test('missing runtime pins, partial commit trees, changed source and untracked runtime files fail closed', async t => {
  for (const [name, alter, reason] of [
    ['missing pin', f => { delete f.source.source['app/birth.tsx']; f.save(); }, /Incomplete source manifest/],
    ['partial tree', f => { const pin = f.source.git.tree, records = fs.readFileSync(pin.file, 'utf8').split('\0').filter(Boolean); fs.writeFileSync(pin.file, records.slice(1).join('\0') + '\0'); f.source.git.tree = h.proof(pin.file); f.save(); }, /Incomplete or unrelated ls-tree/],
    ['changed source', f => { fs.appendFileSync(path.join(f.root, 'src/game/engine.ts'), '// changed'); }, /Git blob differs/],
    ['untracked runtime', f => { fs.writeFileSync(path.join(f.root, 'src/game/unlisted.ts'), 'throw 1'); }, /unlisted runtime/],
    ['untracked root config', f => { fs.writeFileSync(path.join(f.root, 'metro.config.js'), 'throw 1'); }, /unlisted runtime/],
    ['untracked Expo config', f => { fs.writeFileSync(path.join(f.root, 'app.config.js'), 'throw 1'); }, /unlisted runtime/],
    ['untracked root config symlink', f => { fs.symlinkSync(path.join(f.root, 'src/game/engine.ts'), path.join(f.root, 'metro.config.js')); }, /Runtime root config.*non-symlink/],
    ['untracked root config directory', f => { fs.mkdirSync(path.join(f.root, 'babel.config.js')); }, /Runtime root config.*regular/],
  ]) await t.test(name, t => { const f = fixture(t); alter(f); assert.throws(() => h.preflight(f.capturePath), reason); });
});

test('missing phases, reused DBs, stale WAL evidence and missing cold logs refuse before reading SQLite', async t => {
  for (const [name, alter, reason] of [
    ['missing phase', f => { f.manifest.phases.splice(5, 1); f.save(); }, /Every actual onboarding|Missing or unordered/],
    ['reused DB', f => { f.manifest.phases[1].database = f.manifest.phases[0].database; f.save(); }, /independently copied/],
    ['hard-linked DB', f => { const first = f.manifest.phases[0].database.main.file, cold = f.manifest.phases[1].database.main.file; fs.unlinkSync(cold); fs.linkSync(first, cold); f.manifest.phases[1].database.main = h.proof(cold); f.save(); }, /hard-link aliases/],
    ['symlinked DB', f => { const first = f.manifest.phases[0].database.main.file, cold = f.manifest.phases[1].database.main.file; fs.unlinkSync(cold); fs.symlinkSync(first, cold); f.manifest.phases[1].database.main = h.proof(cold); f.save(); }, /non-symlink file/],
    ['unexpected WAL', f => { fs.writeFileSync(f.manifest.baseline.main.file + '-wal', 'unpinned'); }, /unexpected unpinned WAL/],
    ['missing cold log', f => { const pin = f.manifest.phases[1].coldAttestation, stop = h.readJSON(pin.file); delete stop.evidence; json(pin.file, stop); f.manifest.phases[1].coldAttestation = h.proof(pin.file); f.save(); }, /actual coordinator process log/],
  ]) await t.test(name, t => { const f = fixture(t); alter(f); assert.throws(() => h.preflight(f.capturePath), reason); });
});

test('baseline raw mutations, unrelated additions, removed new receipts and nonidentical cold states are rejected', async t => {
  for (const [name, id, sql, reason] of [
    ['old life', 'begun', "UPDATE lives SET payload='changed' WHERE id='retained-alpha'", /baseline lives/],
    ['old backup', 'begun', "UPDATE backups SET payload='changed' WHERE life_id='retained-beta'", /baseline backups/],
    ['old receipt', 'begun', "DELETE FROM receipts WHERE life_id='retained-alpha'", /baseline receipts/],
    ['old metadata', 'begun', "UPDATE snapshot_metadata SET metadata='changed' WHERE life_id='retained-alpha'", /baseline snapshot_metadata/],
    ['unrelated new life', 'begun', "INSERT INTO lives VALUES('phantom','phantom',0,'synthetic','phantom')", /only actual target-life lives/],
    ['new branch', 'begun', "INSERT INTO branches VALUES('actual-derived-new-id','unexpected')", /no restore\/branch/],
    ['lost new receipt', 'birthday-result', "DELETE FROM receipts WHERE command_id='observed-synthetic-begun'", /retain newly created rows/],
    ['changed cold', 'cold-newborn', "UPDATE lives SET payload='different cold' WHERE id='actual-derived-new-id'", /all eight tables exact/],
  ]) await t.test(name, t => { const f = fixture(t); f.alterDB(id, sql); assert.throws(() => verifyRaw(f.capturePath), reason); });
});
