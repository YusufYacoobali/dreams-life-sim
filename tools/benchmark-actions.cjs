// Controlled action/save diagnostics on real on-disk SQLite, not native timings.
// Optional --history points to an existing benchmark DB opened read-only.
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const assert = require('node:assert/strict'), { createHash } = require('node:crypto');
const { DatabaseSync } = require('node:sqlite'), ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
const hash = value => createHash('sha256').update(value).digest('hex');
const sourceArg = process.argv.indexOf('--source'), source = sourceArg < 0 ? path.join(__dirname, '..') : path.resolve(process.argv[sourceArg + 1]);
function sourceHash() {
  const digest = createHash('sha256');
  function visit(dir) { for (const item of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.join(dir, item.name); if (item.isDirectory()) visit(file);
    else if (item.name.endsWith('.ts')) digest.update(path.relative(source, file)).update('\0').update(fs.readFileSync(file)).update('\0');
  } }
  visit(path.join(source, 'src/game')); visit(path.join(source, 'src/persistence')); return digest.digest('hex');
}
const originalHash = sourceHash(), load = file => require(path.join(source, file));
const model = load('src/game/model.ts'), checkpoints = load('src/persistence/checkpoints.ts');
const { createLife, randomCreation } = load('src/game/createLife.ts');
const { resolveCommand } = load('src/game/engine.ts'), { choiceUnavailable } = load('src/game/choiceAvailability.ts');
const { decodeSave } = load('src/persistence/archive.ts'), { SaveRepository } = load('src/persistence/repository.ts');
const legacyRows = process.argv.includes('--legacy-rows');
function legacyPayload(text) {
  const { gzipSync, strToU8 } = require('fflate'), { encodeBase64 } = load('src/persistence/base64.ts'), bytes = strToU8(text);
  let fingerprint = 2166136261; for (const byte of bytes) fingerprint = Math.imul(fingerprint ^ byte, 16777619) >>> 0;
  return JSON.stringify({ format: 'dreams-checkpoint-v1', bytes: bytes.length, hash: fingerprint.toString(16).padStart(8, '0'), data: encodeBase64(gzipSync(bytes, { level: 4, mtime: 0 })) });
}
let phases = null;
for (const [module, name] of [[model, 'validateWorld'], [model, 'encodeWorld'], [checkpoints, 'packCheckpoint'], [checkpoints, 'unpackCheckpoint']]) {
  const original = module[name]; module[name] = (...args) => {
    const start = performance.now(); try { return original(...args); } finally {
      if (phases) { const row = phases[name] ??= { calls: 0, inclusiveMs: 0 }; row.calls++; row.inclusiveMs += performance.now() - start; }
    }
  };
}
if (process.argv.includes('--profile')) {
  for (const file of fs.readdirSync(path.join(source, 'src/game/systems')).filter(file => /Validation\.ts$/.test(file))) {
    const module = load('src/game/systems/' + file);
    for (const name of Object.keys(module).filter(name => name.startsWith('validate'))) {
      const original = module[name]; module[name] = (...args) => {
        const start = performance.now(); try { return original(...args); } finally {
          if (phases) { const row = phases[name] ??= { calls: 0, inclusiveMs: 0 }; row.calls++; row.inclusiveMs += performance.now() - start; }
        }
      };
    }
  }
}
const cases = [];
const newborn = createLife('life_action_newborn', 42, randomCreation(42), { year: 2026, month: 10, day: 19 });
cases.push({ label: 'Begin Life', world: newborn, command: null });
for (const [label, fixture] of [['First-year choice', 'v25-content4-bubble-archive.json'], ['Age-seven callback', 'v27-leisure-archive.json']]) {
  const contents = decodeSave(fs.readFileSync(path.join(__dirname, '../tests/fixtures', fixture), 'utf8')), world = contents.world;
  if (world.pending?.kind === 'result') {
    const prior = contents.snapshots.map(row => checkpoints.unpackCheckpoint(row.payload)).find(world => world.pending?.kind === 'decision');
    if (prior) { const choice = prior.pending.choices.find(item => !choiceUnavailable(prior, item));
      cases.push({ label, world: prior, command: { type: 'choose', eventId: prior.pending.id, choiceId: choice.id } }); }
  }
  if (world.pending?.kind === 'decision') {
    const choice = world.pending.choices.find(item => !choiceUnavailable(world, item));
    cases.push({ label, world, command: { type: 'choose', eventId: world.pending.id, choiceId: choice.id } });
  }
  const result = world.pending?.kind === 'result' ? world : resolveCommand(world, cases.at(-1).command);
  assert.equal(result.pending?.kind, 'result');
  cases.push({ label: label + ' Continue', world: result, command: { type: 'acknowledge', resultId: result.pending.id } });
}
const historyIndex = process.argv.indexOf('--history'), inputsIndex = process.argv.indexOf('--inputs');
let historicalRows;
if (inputsIndex >= 0) historicalRows = JSON.parse(fs.readFileSync(process.argv[inputsIndex + 1], 'utf8')).snapshots;
else if (historyIndex >= 0) {
  const history = new DatabaseSync(process.argv[historyIndex + 1], { readOnly: true });
  historicalRows = history.prepare('SELECT s.payload,m.metadata FROM snapshots s JOIN snapshot_metadata m ON m.life_id=s.life_id AND m.snapshot_id=s.snapshot_id ORDER BY m.revision').all().map(row => ({ payload: row.payload, summary: JSON.parse(row.metadata) }));
  history.close();
} else historicalRows = require('../docs/verification/action-latency-inputs-v25-20261019.json').snapshots;
  for (const age of [30, 60]) {
    const row = historicalRows.find(row => row.summary.age === age); assert.ok(row, 'Missing age ' + age);
    const world = checkpoints.unpackCheckpoint(row.payload);
    cases.push({ label: 'Age-' + age + ' routine', world, command: { type: 'health-routine', routine: world.people[world.activePersonId].health.routine } });
  }
const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'dreams-actions-'));
function open(file) {
  const sqlite = new DatabaseSync(file); sqlite.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;');
  const session = {
    run: async (sql, values = []) => { sqlite.prepare(sql).run(...values); },
    get: async (sql, values = []) => sqlite.prepare(sql).get(...values) ?? null,
    all: async (sql, values = []) => sqlite.prepare(sql).all(...values),
  };
  return { sqlite, repo: new SaveRepository({ ...session, exec: async sql => sqlite.exec(sql), transaction: async action => {
    sqlite.exec('BEGIN IMMEDIATE'); try { const value = await action(session); sqlite.exec('COMMIT'); return value; }
    catch (error) { sqlite.exec('ROLLBACK'); throw error; }
  } }) };
}
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
(async () => {
  const results = [];
  for (const item of cases) {
    const trials = [], input = model.encodeWorld(item.world), oldPayload = legacyRows ? legacyPayload(input) : null;
    // One warm-up followed by five samples, each starting at the same actual world.
    for (let trial = 0; trial < 6; trial++) {
      const file = path.join(folder, results.length + '-' + trial + '.db'), { sqlite, repo } = open(file);
      await repo.initialise(); await repo.create(item.world);
      if (oldPayload) for (const table of ['lives', 'backups']) sqlite.prepare('UPDATE ' + table + ' SET payload=?').run(oldPayload);
      const opening = performance.now(), world = await repo.load(item.world.id), coldOpenMs = performance.now() - opening;
      phases = {}; const start = performance.now();
      const next = item.command ? resolveCommand(world, item.command, true) : { ...world, revision: world.revision + 1, birthAcknowledged: true };
      const resolved = performance.now();
      const committed = await repo.commit(next, world.revision, 'benchmark:' + world.revision);
      const finished = performance.now(), measured = phases; phases = null;
      sqlite.close(); const cold = open(file);
      assert.deepEqual(await cold.repo.load(world.id), committed);
      assert.deepEqual(await cold.repo.recoveryPreview(world.id), world);
      cold.sqlite.close();
      if (trial) trials.push({ totalMs: finished - start, resolveMs: resolved - start, commitMs: finished - resolved, coldOpenMs, phases: measured });
    }
    results.push({ label: item.label, inputSha256: hash(input), inputBytes: Buffer.byteLength(input), ledgerRows: item.world.ledger.length,
      medianMs: Object.fromEntries(['totalMs', 'resolveMs', 'commitMs', 'coldOpenMs'].map(name => [name, median(trials.map(row => row[name]))])), trials });
    process.stderr.write(item.label + ': ' + results.at(-1).medianMs.totalMs.toFixed(2) + ' ms\n');
  }
  assert.equal(sourceHash(), originalHash, 'Sources changed during measurement');
  process.stdout.write(JSON.stringify({ scope: 'five warm cloud Node/on-disk SQLite samples per fixed actual world; every cold world and backup exact; not native', startingRows: legacyRows ? 'v1 current/backup, first write after cold open' : 'current format, compression blocks primed by cold open', node: process.version, sourceHash: originalHash, driverHash: hash(fs.readFileSync(__filename)), results }, null, 2) + '\n');
})().catch(error => { process.stderr.write(error.stack + '\n'); process.exitCode = 1; }).finally(() => fs.rmSync(folder, { recursive: true, force: true }));
