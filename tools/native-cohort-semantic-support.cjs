'use strict';

// No source runtime, capture or native API is loaded by importing this module.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const crypto = require('node:crypto'), { createRequire } = require('node:module');
// Explicit new cohort raw tools. Later revisions require independent review
// and intentional pin changes; similarly named replacement modules are not proof.
const rawTools = {
  'native-cohort-raw-support.cjs': '878716f2dbf2e0d820038e8a729a071f2c230e476e3a9c23dafc40034b2e3de0',
  'verify-native-cohort-raw.cjs': '3c4d37cc03ad4a2bbc537066279e23a3bc47cd8198ac670f0c7ca7774583533a',
};
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const proof = file => ({ file, bytes: fs.statSync(file).size, sha256: hash(fs.readFileSync(file)) });
function checkedFile(pin, label) {
  assert(pin && path.isAbsolute(pin.file ?? '') && Number.isSafeInteger(pin.bytes) && pin.bytes >= 0 && /^[a-f0-9]{64}$/.test(pin.sha256 ?? ''), label + ': complete absolute byte/hash pin required');
  const stat = fs.lstatSync(pin.file); assert(stat.isFile() && !stat.isSymbolicLink(), label + ': regular non-symlink file required');
  assert.deepEqual(proof(pin.file), pin, label + ': pinned bytes changed'); return pin;
}
function preflight(traceFile) {
  const trace = JSON.parse(fs.readFileSync(traceFile, 'utf8'));
  assert.equal(trace.format, 'dreams-native-cohort-semantic-replay-v1'); assert.equal(trace.complete, true, 'Semantic trace is pending/incomplete');
  for (const key of ['capturesManifest', 'rawSupport', 'rawVerification']) checkedFile(trace[key], key);
  assert.equal(path.basename(trace.rawSupport.file), 'native-cohort-raw-support.cjs', 'Use the independently reviewed raw support API');
  assert.equal(trace.rawSupport.sha256, rawTools['native-cohort-raw-support.cjs'], 'Raw support is not the independently approved bytes');
  const h = require(trace.rawSupport.file).forCohort(trace.cohort);
  // This proves the entire frozen Git tree and actual runtime/config bytes BEFORE
  // any source module, SQLite capture, checkpoint decoder or command is loaded.
  const ready = h.preflight(trace.capturesManifest.file);
  for (const phase of ready.manifest.phases) if (phase.kind !== 'command') assert(!Object.hasOwn(phase, 'command'), phase.id + ': a non-command phase must not silently carry an unreplayed command');
  assert.deepEqual(h.proof(trace.capturesManifest.file), trace.capturesManifest);
  const raw = h.readJSON(trace.rawVerification.file);
  assert.equal(raw.format, 'dreams-native-cohort-raw-verification-v1'); assert.equal(raw.complete, true);
  assert.equal(raw.status, 'raw-integrity-passed-not-gameplay-or-visual-acceptance');
  assert.equal(raw.gameRuntimeLoaded, false); assert.equal(raw.gameplaySemanticAcceptance, false);
  assert.deepEqual(raw.captures, ready.captures, 'Raw report belongs to another capture trace'); assert.deepEqual(raw.source, ready.source, 'Raw report belongs to another source');
  assert.equal(raw.cohort, trace.cohort, 'Raw report belongs to another cohort');
  assert.equal(raw.mode, ready.manifest.mode); assert.deepEqual(raw.baseline.database, ready.manifest.baseline);
  assert.deepEqual(raw.phases.map(row => row.id), ready.manifest.phases.map(row => row.id), 'Raw report must cover every actual phase');
  assert(Array.isArray(raw.tools) && raw.tools.length === 2, 'Pinned raw verifier and support required');
  for (const pin of raw.tools) { checkedFile(pin, 'Raw verifier tool'); assert.equal(pin.sha256, rawTools[path.basename(pin.file)], 'Unreviewed raw verifier bytes'); }
  assert.deepEqual(raw.tools.find(pin => pin.file === trace.rawSupport.file), trace.rawSupport);
  assert(raw.tools.some(pin => path.basename(pin.file) === 'verify-native-cohort-raw.cjs'), 'Actual raw verifier pin missing');
  assert(ready.manifest.phases.length <= 128, 'Use a bounded actual trace, not a cohort');
  return { trace: proof(traceFile), traceData: trace, ready, raw, h };
}
function loadRuntime(verified) {
  const { h, ready } = verified, source = h.readJSON(ready.manifest.sourceManifest.file), root = ready.source.root;
  assert.deepEqual(h.verifySource(ready.manifest.sourceManifest.file), ready.source, 'Complete source proof must still match before load');
  const request = createRequire(path.join(root, 'package.json')), lock = request('./package-lock.json');
  const ts = request('typescript'), zustand = request('zustand/package.json');
  assert.equal(ts.version, lock.packages?.['node_modules/typescript']?.version, 'Installed TypeScript differs from the pinned lock');
  assert.equal(zustand.version, lock.packages?.['node_modules/zustand']?.version, 'Installed Zustand differs from the pinned lock');
  const prefix = path.join(root, 'src') + path.sep;
  assert(!Object.keys(require.cache).some(file => file.startsWith(prefix)), 'Refuse a stale/preloaded source runtime');
  const previous = require.extensions['.ts'], loaded = new Map();
  require.extensions['.ts'] = (module, file) => {
    const relative = path.relative(root, file).split(path.sep).join('/');
    assert(file.startsWith(prefix) && Object.hasOwn(source.source, relative), 'Unpinned TS runtime import: ' + file);
    const bytes = fs.readFileSync(file); assert.equal(hash(bytes), source.source[relative], 'Runtime changed before compile: ' + relative);
    loaded.set(relative, hash(bytes));
    module._compile(ts.transpileModule(bytes.toString(), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, file);
  };
  const close = () => { if (previous) require.extensions['.ts'] = previous; else delete require.extensions['.ts']; for (const file of Object.keys(require.cache)) if (file.startsWith(prefix)) delete require.cache[file]; };
  try {
    const game = { ...request('./src/game/model.ts'), ...request('./src/persistence/checkpoints.ts'), ...request('./src/game/engine.ts'), ...request('./src/state/gameStore.ts') };
    return { game, close, provenance: () => ({ node: process.version, typescript: ts.version, zustand: zustand.version, loadedSource: Object.fromEntries([...loaded].sort(([a], [b]) => a.localeCompare(b))), dependencyScope: 'Installed versions match the pinned lock; installed node_modules bytes are not a separate reproducible-build proof.' }) };
  } catch (error) { close(); throw error; }
}

const requiredArrays = Object.freeze(['teenRelationships', 'universityApplications', 'studyCourses', 'npcSeparations', 'npcMoves']);
function inspectPacked(payload) {
  assert(typeof payload === 'string' && payload.length <= 44_000_000, 'Bounded actual checkpoint text required');
  const frame = JSON.parse(payload);
  assert(frame && typeof frame === 'object' && !Array.isArray(frame), 'Actual checkpoint object required');
  let root = frame, main = Buffer.from(payload), format = 'plain';
  if (Object.hasOwn(frame, 'format')) {
    assert(['dreams-checkpoint-v1', 'dreams-checkpoint-v2', 'dreams-checkpoint-v3', 'dreams-checkpoint-v4'].includes(frame.format), 'Unknown actual checkpoint framing');
    format = frame.format;
    const part = format === 'dreams-checkpoint-v1' ? frame : frame.main, maximum = format === 'dreams-checkpoint-v4' ? 32_000_000 : 20_000_000;
    assert(part && Number.isSafeInteger(part.bytes) && part.bytes > 0 && part.bytes <= maximum && /^[a-f0-9]{8}$/.test(part.hash ?? '') && typeof part.data === 'string' && part.data.length <= (maximum === 32_000_000 ? 44_000_000 : 28_000_000), 'Bounded actual main frame required');
    const compressed = Buffer.from(part.data, 'base64');
    assert(compressed.length >= 18 && compressed.readUInt32LE(compressed.length - 4) === part.bytes, 'Actual main frame size mismatch');
    main = require('node:zlib').gunzipSync(compressed, { maxOutputLength: part.bytes });
    assert.equal(main.length, part.bytes, 'Actual main frame inflation length differs');
    let fingerprint = 2166136261; for (const byte of main) fingerprint = Math.imul(fingerprint ^ byte, 16777619) >>> 0;
    assert.equal(fingerprint.toString(16).padStart(8, '0'), part.hash, 'Actual main frame fingerprint differs');
    root = JSON.parse(main.toString('utf8'));
  }
  assert(root && typeof root === 'object' && !Array.isArray(root), 'Actual stored root object required');
  for (const key of ['schemaVersion', 'engineVersion', 'contentVersion']) assert(Number.isSafeInteger(root[key]) && root[key] > 0, 'Actual stored root version required: ' + key);
  return { format, versions: { world: root.schemaVersion, engine: root.engineVersion, content: root.contentVersion }, requiredArrays: Object.fromEntries(requiredArrays.map(key => [key, Array.isArray(root[key])])), mainBytes: main.length, mainSha256: hash(main) };
}
function assertWritten(header, versions, label) {
  assert.deepEqual(header.versions, { world: versions.world, engine: versions.engine, content: versions.content }, label + ': newly written current must store exact coordinated tags before migration');
  for (const key of requiredArrays) assert.equal(header.requiredArrays[key], true, label + ': newly written current must store required array before migration: ' + key);
}

const receiptKey = row => JSON.stringify([row.life_id, row.command_id]);
const receiptRows = rows => rows.map(row => JSON.stringify(Object.fromEntries(Object.entries(row).sort(([a], [b]) => a.localeCompare(b))))).sort();
function selected(capture) {
  const active = capture.rows.preferences.filter(row => row.key === 'active_life'); assert.equal(active.length, 1, 'Exactly one selected-life preference');
  const rows = capture.rows.lives.filter(row => row.id === active[0].value); assert.equal(rows.length, 1, 'Exactly one selected-life row');
  const backups = capture.rows.backups.filter(row => row.life_id === rows[0].id); assert.equal(backups.length, 1, 'Exactly one selected backup');
  return { current: rows[0], backup: backups[0] };
}
function decoded(game, row, label, backup = false) {
  assert(typeof row.payload === 'string', label + ': actual raw payload required');
  const world = game.unpackCheckpoint(row.payload, true);
  for (const key of requiredArrays) assert(Array.isArray(world[key]), label + ': decoded required array missing: ' + key);
  assert.equal(world.id, backup ? row.life_id : row.id, label + ': decoded identity differs'); assert.equal(world.revision, row.revision, label + ': decoded revision differs');
  if (!backup) assert.equal(game.fullName(world.people[world.activePersonId]), row.name, label + ': actual saved name differs');
  return world;
}
function equalWorld(game, actual, expected, label) {
  const actualText = game.encodeWorld(actual), expectedText = game.encodeWorld(expected);
  // Exact canonical strings include every field and formatted consequence.
  // Currency text differences must fail; no whitespace/locale/hash normalization.
  assert.equal(hash(actualText), hash(expectedText), label + ': complete canonical world differs (including currency/presentation text)');
  assert.equal(actualText, expectedText, label + ': canonical world differs');
  assert.deepEqual(actual.random, expected.random, label + ': RNG differs');
  assert.deepEqual(actual.pending, expected.pending, label + ': pending differs'); assert.deepEqual(actual.annual, expected.annual, label + ': annual state differs');
}
async function acknowledgeBirth(game, before) {
  assert.equal(before.birthAcknowledged, false, 'Begin Life must actually be unacknowledged');
  const commits = [], calls = [];
  const forbidden = name => { throw new Error('Unexpected birth Persistence method: ' + name); };
  const persistence = Object.freeze({
    list: async () => { calls.push('list'); return [{ id: before.id, revision: before.revision, name: game.fullName(before.people[before.activePersonId]) }]; },
    active: async () => { calls.push('active'); return before; },
    commit: async (...args) => {
      commits.push(args); assert.equal(commits.length, 1, 'Exactly one actual birth commit'); assert.equal(args.length, 3, 'Actual birth store uses the ordinary three-argument commit');
      const [next, expectedRevision, commandId] = args; assert.equal(expectedRevision, before.revision); assert.equal(commandId, 'birth:' + before.id);
      equalWorld(game, next, { ...before, birthAcknowledged: true, revision: before.revision + 1 }, 'Actual birth store commit');
      return game.immutableWorld(next);
    },
  }); // Every other Persistence method is absent and therefore fails closed.
  const store = game.createGameStore({ repository: async () => persistence, date: () => forbidden('date'), id: () => forbidden('id') });
  assert.equal(await store.getState().bootstrap(), true, 'Actual birth store bootstrap must succeed');
  assert.deepEqual(calls, ['list', 'active']); assert.equal(commits.length, 0);
  assert.equal(await store.getState().acknowledgeBirth(), true, 'Actual Begin Life action must save');
  assert.equal(commits.length, 1); assert.equal(store.getState().busy, false); assert.equal(store.getState().error, null);
  return { world: store.getState().world, receipt: { life_id: before.id, command_id: commits[0][2], revision: before.revision + 1 }, persistence: 'Strict recording Persistence: actual store birth action, no SQLite or pack/commit implementation claim.' };
}
async function replay(verified, game) {
  const { h, ready, raw } = verified, manifest = ready.manifest;
  let expected, previous, previousBackup, lifeId, receipts;
  let currentWritten = manifest.mode !== 'existing';
  const result = { phases: [], engineCommandsReplayed: 0, birthAcknowledgementsReplayed: 0 };
  for (let index = 0; index < manifest.phases.length; index++) {
    const phase = manifest.phases[index], capture = h.capture(phase.database), observed = selected(capture), recorded = raw.phases[index], label = phase.id;
    assert.deepEqual(recorded.database, phase.database); assert.deepEqual(recorded.tables, capture.hashes, label + ': raw report no longer describes this capture');
    assert.equal(capture.reader, ready.source.versions.reader); assert.equal(recorded.kind, phase.kind);
    const storedCurrent = inspectPacked(observed.current.payload), storedBackup = inspectPacked(observed.backup.payload);
    if (['command', 'begin-life'].includes(phase.kind)) currentWritten = true;
    if (currentWritten) assertWritten(storedCurrent, ready.source.versions, label);
    const actual = decoded(game, observed.current, label), backup = decoded(game, observed.backup, label + ' backup', true);
    assert.deepEqual([actual.schemaVersion, actual.engineVersion, actual.contentVersion], [ready.source.versions.world, ready.source.versions.engine, ready.source.versions.content], label + ': use the exact coordinated cohort decode');
    assert.deepEqual([backup.schemaVersion, backup.engineVersion, backup.contentVersion], [ready.source.versions.world, ready.source.versions.engine, ready.source.versions.content], label + ': use the exact coordinated backup decode');
    if (index === 0) {
      lifeId = actual.id; assert.equal(lifeId, raw.target.lifeId); assert.equal(observed.current.revision, raw.target.initialRevision); assert.equal(hash(observed.current.payload), raw.target.initialPayloadSha256);
      assert.equal(phase.kind, manifest.mode === 'existing' ? 'read-only' : 'created');
      if (manifest.mode !== 'existing') {
        assert.equal(actual.birthAcknowledged, false); assert.equal(actual.revision, 0); assert.equal(game.ageOn(actual.people[actual.activePersonId], actual.date), 0);
        assert.equal(observed.backup.payload, observed.current.payload, 'Actual newborn initial backup is the created checkpoint');
      }
      expected = actual; receipts = capture.rows.receipts.filter(row => row.life_id === lifeId);
      if (manifest.mode !== 'existing') assert.equal(receipts.length, 0, 'A newly created unbegun life has no command receipt');
      assert.equal(new Set(receipts.map(receiptKey)).size, receipts.length, 'Duplicate initial receipt identity');
    } else {
      assert.equal(actual.id, lifeId, 'A trace cannot silently switch selected lives');
      const beforeText = game.encodeWorld(expected); let receipt = null;
      if (phase.kind === 'command') {
        assert(phase.command && typeof phase.command.type === 'string', label + ': supplied actual command required');
        const before = expected; expected = game.resolveCommand(before, phase.command, true); result.engineCommandsReplayed++;
        assert.equal(game.encodeWorld(before), beforeText, label + ': replay changed its input');
        assert.equal(expected.id, lifeId); assert.equal(expected.revision, before.revision + 1);
        receipt = { life_id: lifeId, command_id: 'revision:' + before.revision + ':' + phase.command.type, revision: expected.revision };
      } else if (phase.kind === 'begin-life') {
        assert(!phase.command, label + ': Begin Life is a store action, not an invented engine command');
        const before = expected, begun = await acknowledgeBirth(game, before); expected = begun.world; receipt = begun.receipt; result.birthAcknowledgementsReplayed++;
        assert.equal(game.encodeWorld(before), beforeText, label + ': Begin Life changed its input');
      } else assert(['read-only', 'cold'].includes(phase.kind), label + ': unknown replay operation');
      if (receipt) {
        assert(!receipts.some(row => receiptKey(row) === receiptKey(receipt)), label + ': command was already receipted'); receipts = [...receipts, receipt];
        assert.equal(observed.backup.revision, previous.current.revision, label + ': action backup revision');
        assert.equal(observed.backup.payload, previous.current.payload, label + ': exact prior raw current must become backup');
        equalWorld(game, backup, previousBackup.currentWorld, label + ': complete action backup');
      } else {
        assert.equal(observed.current.payload, previous.current.payload, label + ': read-only/cold current raw bytes');
        assert.deepEqual(observed.backup, previous.backup, label + ': read-only/cold exact backup row');
        equalWorld(game, backup, previousBackup.backupWorld, label + ': complete retained backup');
      }
    }
    equalWorld(game, actual, expected, label);
    assert.deepEqual(receiptRows(capture.rows.receipts.filter(row => row.life_id === lifeId)), receiptRows(receipts), label + ': only exact supplied-command receipts');
    result.phases.push({ id: label, kind: phase.kind, revision: actual.revision, lifeId, personId: actual.activePersonId, worldSha256: hash(game.encodeWorld(actual)), randomSha256: hash(JSON.stringify(actual.random)), pendingSha256: hash(JSON.stringify(actual.pending, game.moneyJSON)), annualSha256: hash(JSON.stringify(actual.annual, game.moneyJSON)), backupWorldSha256: hash(game.encodeWorld(backup)), currentPayloadSha256: hash(observed.current.payload), backupPayloadSha256: hash(observed.backup.payload), storedCurrent, storedBackup, currentWritten, ...(phase.kind === 'command' ? { command: phase.command } : {}), targetReceipts: receipts.length });
    previous = observed; previousBackup = { currentWorld: actual, backupWorld: backup };
  }
  assert.equal(result.engineCommandsReplayed, manifest.phases.filter(phase => phase.kind === 'command').length);
  assert.equal(result.birthAcknowledgementsReplayed, manifest.mode === 'existing' ? 0 : 1);
  return result;
}
module.exports = { fs, path, assert, hash, proof, checkedFile, preflight, loadRuntime, requiredArrays, inspectPacked, assertWritten, receiptRows, selected, decoded, equalWorld, acknowledgeBirth, replay };
