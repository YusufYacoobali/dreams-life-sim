// Cloud Node/real SQLite audit. Cold means a fresh repository/codec, not a cold OS cache.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const assert = require('node:assert/strict'), { createHash } = require('node:crypto');
const { DatabaseSync } = require('node:sqlite'), ts = require('typescript');
const flags = {};
for (let i = 2; i < process.argv.length; i += 2) flags[process.argv[i]] = process.argv[i + 1];
const source = path.resolve(flags['--source'] ?? path.join(__dirname, '..'));
const samples = Number(flags['--samples'] ?? 5), output = flags['--output'];
assert(output && samples >= 5 && samples <= 50);
const sha = value => createHash('sha256').update(value).digest('hex');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, file);
const load = file => require(path.join(source, file));
const model = load('src/game/model.ts'), codec = load('src/persistence/checkpoints.ts');
const { resolveCommand } = load('src/game/engine.ts');
const { lifetimeStatistics } = load('src/ui/lifetimeStatistics.ts');
const { relationshipContacts } = load('src/ui/relationshipFilters.ts');
const { createJournalProjection } = load('src/ui/journalProjection.ts');
const { createGameStore } = load('src/state/gameStore.ts');
const files = [];
function visit(folder) {
  for (const entry of fs.readdirSync(path.join(source, folder), { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) visit(file); else if (/\.[jt]sx?$/.test(file)) files.push(file);
  }
}
for (const folder of ['src/game', 'src/persistence', 'src/state', 'src/ui']) visit(folder);
const digest = () => sha(files.map(file => file + '\0' + fs.readFileSync(path.join(source, file))).join('\0'));
const sourceHash = digest(), inputs = JSON.parse(fs.readFileSync(flags['--inputs'], 'utf8'));
const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'dreams-mobile-operations-'));
function open(file, fresh = false) {
  const sqlite = new DatabaseSync(file);
  sqlite.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON');
  const session = {
    run: async (sql, values = []) => { sqlite.prepare(sql).run(...values); },
    get: async (sql, values = []) => sqlite.prepare(sql).get(...values) ?? null,
    all: async (sql, values = []) => sqlite.prepare(sql).all(...values),
  };
  if (fresh) {
    delete require.cache[path.join(source, 'src/persistence/checkpoints.ts')];
    delete require.cache[path.join(source, 'src/persistence/repository.ts')];
  }
  const { SaveRepository } = load('src/persistence/repository.ts');
  const repository = new SaveRepository({ ...session, exec: async sql => sqlite.exec(sql), transaction: async action => {
    sqlite.exec('BEGIN IMMEDIATE');
    try { const result = await action(session); sqlite.exec('COMMIT'); return result; }
    catch (error) { sqlite.exec('ROLLBACK'); throw error; }
  } });
  return { sqlite, repository };
}
function freshCodec() {
  delete require.cache[path.join(source, 'src/persistence/checkpoints.ts')];
  return load('src/persistence/checkpoints.ts');
}
const percentile = (values, p) => [...values].sort((a,b) => a-b)[Math.ceil(values.length * p) - 1];
const results = [];
async function measure(label, setup, operation, verify) {
  const trials = [];
  for (let i = 0; i <= samples; i++) {
    const state = await setup();
    if (global.gc) global.gc();
    const heapBefore = process.memoryUsage().heapUsed, start = performance.now();
    const result = await operation(state);
    const elapsedMs = performance.now() - start, heapAfter = process.memoryUsage().heapUsed;
    const rssHighWaterBytes = process.resourceUsage().maxRSS * 1024;
    await verify(result, state);
    if (i) trials.push({ elapsedMs, heapBefore, heapAfter, heapDeltaBytes: heapAfter - heapBefore, processRssHighWaterBytes: rssHighWaterBytes });
  }
  return { operation: label, medianMs: percentile(trials.map(t => t.elapsedMs), .5), p95Ms: percentile(trials.map(t => t.elapsedMs), .95), trials };
}
(async () => {
  for (const snapshot of inputs.snapshots) {
    const world = codec.unpackCheckpoint(snapshot.payload, true), canonical = model.encodeWorld(world), hash = sha(canonical);
    const person = world.people[world.activePersonId], scope = { lifeId: world.id, personId: person.id, born: person.born };
    const file = path.join(folder, String(snapshot.summary.age) + '-' + results.length + '.db');
    const db = open(file); await db.repository.initialise(); await db.repository.create(world);
    const rows = [];
    rows.push(await measure('validate-certified-copy', () => model.copyWorld(world), copy => model.validateWorld(copy, true), result => assert.equal(sha(model.encodeWorld(result)), hash)));
    rows.push(await measure('checkpoint-warm-pack', () => { codec.packCheckpoint(world); }, () => codec.packCheckpoint(world), packed => assert.equal(sha(model.encodeWorld(codec.unpackCheckpoint(packed, true))), hash)));
    rows.push(await measure('checkpoint-cold-pack', () => ({ module: freshCodec(), world: model.decodeWorld(canonical, true) }), state => state.module.packCheckpoint(state.world), packed => assert.equal(sha(model.encodeWorld(codec.unpackCheckpoint(packed, true))), hash)));
    rows.push(await measure('checkpoint-cold-unpack', () => freshCodec(), module => module.unpackCheckpoint(snapshot.payload, true), result => assert.equal(sha(model.encodeWorld(result)), hash)));
    rows.push(await measure('repository-warm-load', async () => { await db.repository.load(world.id); }, () => db.repository.load(world.id), result => assert.equal(sha(model.encodeWorld(result)), hash)));
    rows.push(await measure('repository-cold-reopen', () => open(file, true), async state => { await state.repository.initialise(); return state.repository.load(world.id); }, (result, state) => { assert.equal(sha(model.encodeWorld(result)), hash); state.sqlite.close(); }));
    rows.push(await measure('statistics-projection', () => {}, () => lifetimeStatistics(world), result => assert(result?.personId === person.id)));
    rows.push(await measure('relationship-projection', () => {}, () => relationshipContacts(world, 'all'), result => assert(result.every(edge => edge.from === person.id || edge.to === person.id))));
    rows.push(await measure('journal-warm-projection', () => { const project = createJournalProjection(); project(world.journal, scope, world); return project; }, project => project(world.journal, scope, world), result => assert.equal(result.rows.length, world.journal.filter(row => row.personId === person.id).length)));
    let publicationCommand = { type: 'health-routine', routine: { ...person.health.routine, mindfulness: !person.health.routine.mindfulness } };
    let next;
    try { next = resolveCommand(world, publicationCommand, true); }
    catch { publicationCommand = { type: 'advance' }; next = resolveCommand(world, publicationCommand, true); }
    let callbacks = 0;
    const store = createGameStore({ repository: async () => db.repository, date: () => world.date, id: () => 'unused', onFeedback: () => {} });
    const unsubscribe = store.subscribe(() => callbacks++);
    rows.push(await measure('zustand-world-publication', () => { store.setState({ world }); callbacks = 0; }, () => store.setState({ world: next }), () => assert.equal(callbacks, 1)));
    unsubscribe();
    db.sqlite.close();
    results.push({ summary: snapshot.summary, inputWorldSha256: hash, checkpointBytes: Buffer.byteLength(snapshot.payload), publicationCommand, operations: rows });
    fs.writeFileSync(output, JSON.stringify({ scope: 'Cloud Node/real on-disk SQLite. One excluded warm-up; cold repository/codec, warm OS filesystem. Heap deltas are operation-boundary observations, not true native peaks. RSS is the process lifetime high-water including setup/transpilation. No React/native frame claim.', node: process.version, samples, sourceHash, driverHash: sha(fs.readFileSync(__filename)), inputFileSha256: sha(fs.readFileSync(flags['--inputs'])), results }, null, 2) + '\n');
    console.log(snapshot.summary.age, 'operations complete');
  }
  assert.equal(digest(), sourceHash, 'Sources changed during audit');
  fs.rmSync(folder, { recursive: true, force: true });
})().catch(error => { console.error(error); process.exitCode = 1; });
