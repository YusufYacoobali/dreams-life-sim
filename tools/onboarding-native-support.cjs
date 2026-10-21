'use strict';

// Provenance and raw SQLite only. There is deliberately no game/module loader here.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const crypto = require('node:crypto');
const tables = ['backups', 'branches', 'lives', 'preferences', 'receipts', 'restore_receipts', 'snapshot_metadata', 'snapshots'];
const versions = { world: 36, engine: 37, content: 12, reader: 16 };
const milestones = ['newborn', 'cold-newborn', 'begun', 'cold-begun', 'birthday-decision', 'cold-birthday-decision', 'birthday-result', 'cold-birthday-result', 'acknowledged', 'cold-acknowledged'];
const existingMilestones = ['existing-start', 'action-saved', 'cold-action-saved', 'acknowledged', 'cold-acknowledged'];
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const objectOid = (kind, bytes) => crypto.createHash('sha1').update(Buffer.from(kind + ' ' + bytes.length + '\0')).update(bytes).digest('hex');
const readJSON = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const proof = file => ({ file, bytes: fs.statSync(file).size, sha256: hash(fs.readFileSync(file)) });
function checkedFile(pin, label) {
  assert(pin && typeof pin.file === 'string' && path.isAbsolute(pin.file), label + ': explicit absolute file is required');
  assert(Number.isSafeInteger(pin.bytes) && pin.bytes >= 0 && /^[a-f0-9]{64}$/.test(pin.sha256 ?? ''), label + ': complete byte/hash pin is required');
  const stat = fs.lstatSync(pin.file); assert(stat.isFile() && !stat.isSymbolicLink(), label + ': regular non-symlink file required');
  assert.deepEqual(proof(pin.file), pin, label + ': pinned file changed'); return pin;
}
const managed = file => /^(?:app\/|src\/|assets\/)/.test(file) || ['package.json', 'package-lock.json', 'app.json', 'babel.config.cjs', 'babel.config.js', 'metro.config.cjs', 'metro.config.js', 'tsconfig.json'].includes(file);
function verifySource(file) {
  const source = readJSON(file);
  assert.equal(source.format, 'dreams-onboarding-native-source-v1'); assert.equal(source.complete, true, 'Source manifest is pending/incomplete');
  assert(path.isAbsolute(source.root ?? '') && /^[a-f0-9]{40}$/.test(source.commit ?? ''), 'Explicit frozen source root and full commit required');
  assert.deepEqual(source.versions, versions, 'Use the coordinated C37 source, not an earlier runtime');
  for (const key of ['head', 'status', 'tree', 'commit']) checkedFile(source.git?.[key], 'Source Git ' + key);
  assert.equal(fs.readFileSync(source.git.head.file, 'utf8').trim(), source.commit, 'Frozen Git head differs');
  assert.equal(fs.readFileSync(source.git.status.file, 'utf8'), '', 'Frozen source status must be clean');
  const commitBytes = fs.readFileSync(source.git.commit.file); assert.equal(objectOid('commit', commitBytes), source.commit, 'Pinned commit object differs from frozen HEAD');
  const rootTree = /^tree ([a-f0-9]{40})\n/.exec(commitBytes.toString()); assert(rootTree, 'Complete raw Git commit object required');
  const tree = new Map();
  for (const record of fs.readFileSync(source.git.tree.file, 'utf8').split('\0').filter(Boolean)) {
    const match = /^(100644|100755|120000) blob ([a-f0-9]{40})\t(.+)$/.exec(record); assert(match, 'Complete NUL-separated ls-tree proof required');
    const name = match[3]; assert(!path.isAbsolute(name) && !name.split('/').some(part => part === '..' || part === '.') && !tree.has(name), 'Unsafe or repeated source tree path');
    tree.set(name, { oid: match[2], mode: match[1] });
  }
  const directories = new Map();
  for (const [name, entry] of tree) {
    const parts = name.split('/'); let directory = directories;
    for (const part of parts.slice(0, -1)) { if (!directory.has(part)) directory.set(part, new Map()); const next = directory.get(part); assert(next instanceof Map, 'Conflicting source tree file/directory'); directory = next; }
    assert(!directory.has(parts.at(-1)), 'Conflicting source tree path'); directory.set(parts.at(-1), entry);
  }
  const treeOid = directory => {
    const entries = [...directory].sort(([a, first], [b, second]) => Buffer.compare(Buffer.from(a + (first instanceof Map ? '/' : '')), Buffer.from(b + (second instanceof Map ? '/' : ''))));
    const bytes = Buffer.concat(entries.flatMap(([name, entry]) => [Buffer.from((entry instanceof Map ? '40000' : entry.mode) + ' ' + name + '\0'), Buffer.from(entry instanceof Map ? treeOid(entry) : entry.oid, 'hex')]));
    return objectOid('tree', bytes);
  };
  assert.equal(treeOid(directories), rootTree[1], 'Incomplete or unrelated ls-tree proof for the actual frozen commit');
  assert(source.source && typeof source.source === 'object' && !Array.isArray(source.source), 'Complete source hash map required');
  const required = [...tree.keys()].filter(managed).sort(); assert(required.length, 'Empty runtime source proof');
  for (const name of ['src/game/model.ts', 'src/game/engine.ts', 'src/state/gameStore.ts', 'src/persistence/checkpoints.ts', 'src/persistence/repository.ts', 'app/new-life.tsx', 'app/birth.tsx', 'package.json', 'package-lock.json', 'app.json']) assert(required.includes(name), 'Incomplete runtime tree: ' + name);
  for (const name of required) assert(Object.hasOwn(source.source, name), 'Incomplete source manifest: ' + name);
  for (const [name, sha256] of Object.entries(source.source)) {
    const entry = tree.get(name); assert(entry && /^[a-f0-9]{64}$/.test(sha256), 'Untracked/invalid source pin: ' + name);
    const absolute = path.join(source.root, name), stat = fs.lstatSync(absolute); assert(entry.mode !== '120000' && stat.isFile() && !stat.isSymbolicLink(), 'Pinned source must be a regular file: ' + name);
    const bytes = fs.readFileSync(absolute), oid = objectOid('blob', bytes);
    assert.equal(oid, entry.oid, 'Source Git blob differs: ' + name); assert.equal(hash(bytes), sha256, 'Source SHA differs: ' + name);
  }
  const actual = [];
  const visit = directory => { for (const entry of fs.readdirSync(directory, { withFileTypes: true })) { const absolute = path.join(directory, entry.name); assert(!entry.isSymbolicLink(), 'Untracked runtime symlink'); if (entry.isDirectory()) visit(absolute); else { assert(entry.isFile(), 'Unexpected runtime file kind'); actual.push(path.relative(source.root, absolute).split(path.sep).join('/')); } } };
  for (const directory of ['app', 'src', 'assets']) if (fs.existsSync(path.join(source.root, directory))) { const absolute = path.join(source.root, directory), stat = fs.lstatSync(absolute); assert(stat.isDirectory() && !stat.isSymbolicLink(), 'Runtime root must be a real directory'); visit(absolute); }
  for (const name of fs.readdirSync(source.root)) if (!name.includes('/') && managed(name)) { const stat = fs.lstatSync(path.join(source.root, name)); assert(stat.isFile() && !stat.isSymbolicLink(), 'Runtime root config must be a regular non-symlink file: ' + name); actual.push(name); }
  assert.deepEqual(actual.sort(), required, 'Source tree contains missing/unlisted runtime files');
  return { manifest: proof(file), root: source.root, commit: source.commit, versions: source.versions, managedFilesVerified: required.length, git: source.git };
}
function checkedDatabase(database, label) {
  assert(database && database.main && Object.hasOwn(database, 'wal'), label + ': explicit main and WAL presence/absence required');
  checkedFile(database.main, label + ' main');
  const wal = database.main.file + '-wal';
  if (database.wal === null) assert(!fs.existsSync(wal), label + ': unexpected unpinned WAL');
  else { assert.equal(database.wal?.file, wal, label + ': WAL must belong to this exact database'); checkedFile(database.wal, label + ' WAL'); }
  return database;
}
function preflight(capturesFile) {
  const manifest = readJSON(capturesFile);
  assert.equal(manifest.format, 'dreams-onboarding-native-captures-v1'); assert.equal(manifest.complete, true, 'Capture manifest is pending/incomplete');
  assert(['custom', 'random', 'existing'].includes(manifest.mode), 'Keep custom, Random Life and existing-life actions in separate explicit journeys');
  const existing = manifest.mode === 'existing', requiredMilestones = existing ? existingMilestones : milestones;
  assert(typeof manifest.device === 'string' && manifest.device.trim() && typeof manifest.scope === 'string' && manifest.scope.trim(), 'Actual device and bounded scope declarations required');
  checkedFile(manifest.sourceManifest, 'Source manifest');
  // Source completeness is established before SQLite is required or any capture is opened.
  const source = verifySource(manifest.sourceManifest.file);
  checkedDatabase(manifest.baseline, 'Actual pre-creation baseline');
  if (existing) assert(!manifest.birthCheckpoint, 'An existing-life journey must not invent a new birth');
  else checkedFile(manifest.birthCheckpoint, 'Actual created birth checkpoint');
  assert(Array.isArray(manifest.phases) && manifest.phases.length >= requiredMilestones.length, 'Every actual onboarding/action/cold milestone is required');
  const names = manifest.phases.map(phase => phase.id); assert.equal(new Set(names).size, names.length, 'Repeated capture phase');
  let previousMilestone = -1;
  for (const id of requiredMilestones) { const index = names.indexOf(id); assert(index > previousMilestone, 'Missing or unordered actual milestone: ' + id); previousMilestone = index; }
  assert.equal(names[0], requiredMilestones[0], 'First actual capture must be the actual newborn or existing selected state');
  assert.equal(names.at(-1), 'cold-acknowledged', 'Final actual capture must be the cold acknowledged state');
  const databaseKey = file => { const stat = fs.statSync(file, { bigint: true }); return stat.dev + ':' + stat.ino; };
  const databases = new Set([fs.realpathSync(manifest.baseline.main.file)]), inodes = new Set([databaseKey(manifest.baseline.main.file)]), pictures = new Set(), hierarchies = new Set();
  for (let index = 0; index < manifest.phases.length; index++) {
    const phase = manifest.phases[index], label = phase.id;
    assert(typeof label === 'string' && label.length > 0, 'Named actual phase required'); checkedDatabase(phase.database, label);
    const real = fs.realpathSync(phase.database.main.file); assert(!databases.has(real), 'Use independently copied actual DB captures: ' + label); databases.add(real);
    const inode = databaseKey(phase.database.main.file); assert(!inodes.has(inode), 'Use independent DB files, not hard-link aliases: ' + label); inodes.add(inode);
    assert.equal(phase.coordinatorPersonallyViewed, true, label + ': actual PNG/XML must be reviewed');
    checkedFile(phase.png, label + ' PNG'); checkedFile(phase.xml, label + ' XML');
    for (const [pin, seen] of [[phase.png, pictures], [phase.xml, hierarchies]]) { const real = fs.realpathSync(pin.file); assert(!seen.has(real), label + ': use independently captured PNG/XML paths'); seen.add(real); }
    assert(/\.png$/i.test(phase.png.file) && /\.xml$/i.test(phase.xml.file), label + ': explicit screenshot and hierarchy required');
    const png = fs.readFileSync(phase.png.file), xml = fs.readFileSync(phase.xml.file, 'utf8');
    assert(png.length >= 36 && png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && png.subarray(12, 16).toString() === 'IHDR' && png.readUInt32BE(16) > 0 && png.readUInt32BE(20) > 0 && png.readUInt32BE(png.length - 12) === 0 && png.subarray(-8, -4).toString() === 'IEND', label + ': complete PNG header/end required');
    assert(/<hierarchy\b/.test(xml) && /<\/hierarchy>/.test(xml) && /<node\b/.test(xml), label + ': actual nonempty UI hierarchy required');
    assert(['created', 'begin-life', 'command', 'read-only', 'cold'].includes(phase.kind), label + ': explicit operation kind required');
    if (index === 0) assert.equal(phase.kind, existing ? 'read-only' : 'created'); else assert.notEqual(phase.kind, 'created', 'One new life only per journey');
    if (phase.kind === 'cold') {
      assert.equal(phase.sameAs, manifest.phases[index - 1]?.id, label + ': cold must bind its immediately preceding actual saved capture');
      checkedFile(phase.coldAttestation, label + ' stop/restart attestation');
      const stop = readJSON(phase.coldAttestation.file); assert.equal(stop.complete, true); assert.equal(stop.stopped, true); assert.equal(stop.restarted, true); assert.equal(stop.from, phase.sameAs); assert.equal(stop.to, label);
      checkedFile(stop.evidence, label + ' actual coordinator process log');
      assert(stop.evidence.bytes > 0, label + ': actual process/capture log must not be empty');
    } else assert(!phase.sameAs && !phase.coldAttestation, label + ': do not infer a cold reopen');
    if (label.startsWith('cold-')) assert.equal(phase.kind, 'cold', label + ': explicit cold observation required');
    if (existing) assert.notEqual(phase.kind, 'begin-life', 'Do not introduce a birth acknowledgement into an existing-life action');
    if (label === 'begun') assert.equal(phase.kind, 'begin-life');
    if (['birthday-decision', 'birthday-result', 'action-saved', 'acknowledged'].includes(label)) assert.equal(phase.kind, 'command');
    if (phase.kind === 'command') assert(phase.command && typeof phase.command.type === 'string' && phase.command.type.length, label + ': actual visible command required');
  }
  return { manifest, source, captures: proof(capturesFile) };
}
const rowText = row => JSON.stringify(Object.fromEntries(Object.keys(row).sort().map(key => [key, row[key]])));
const rowsHash = rows => hash(JSON.stringify(rows.map(rowText).sort()));
function capture(database) {
  checkedDatabase(database, 'Read-only database');
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(database.main.file, { readOnly: true });
  try {
    assert.deepEqual(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name), tables, 'Exact eight production tables required');
    const rows = Object.fromEntries(tables.map(table => [table, db.prepare('SELECT * FROM ' + table).all()]));
    return { reader: db.prepare('PRAGMA user_version').get().user_version, rows, hashes: Object.fromEntries(tables.map(table => [table, { rows: rows[table].length, sha256: rowsHash(rows[table]) }])) };
  } finally { db.close(); checkedDatabase(database, 'Stable read-only database'); }
}
module.exports = { fs, path, assert, tables, versions, milestones, existingMilestones, hash, proof, readJSON, checkedFile, checkedDatabase, verifySource, preflight, rowsHash, rowText, capture };
