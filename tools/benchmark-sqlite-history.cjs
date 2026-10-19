// One real repository life on cloud Node SQLite; not native or multi-generation acceptance.
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), assert = require('node:assert/strict');
const { createHash } = require('node:crypto'), { DatabaseSync } = require('node:sqlite'), ts = require('typescript');
const root = path.join(__dirname, '..');
function sourceHash() {
  const hash = createHash('sha256');
  const visit = dir => { for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) visit(file);
    else if (entry.name.endsWith('.ts')) hash.update(path.relative(root, file)).update('\0').update(fs.readFileSync(file)).update('\0');
  } };
  visit(path.join(root, 'src/game')); visit(path.join(root, 'src/persistence')); return hash.digest('hex');
}
const originalHash = sourceHash();
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
const { createLife, randomCreation } = require('../src/game/createLife.ts'), { resolveCommand } = require('../src/game/engine.ts');
const { encodeWorld, ageOn } = require('../src/game/model.ts'), { choiceUnavailable } = require('../src/game/choiceAvailability.ts');
const { SaveRepository } = require('../src/persistence/repository.ts');
const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'dreams-sqlite-history-')), file = path.join(folder, 'life.db');
let sqlite;
function repository() {
  sqlite = new DatabaseSync(file); sqlite.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL');
  const session = {
    run: async (sql, values = []) => { sqlite.prepare(sql).run(...values); },
    get: async (sql, values = []) => sqlite.prepare(sql).get(...values) ?? null,
    all: async (sql, values = []) => sqlite.prepare(sql).all(...values),
  };
  return new SaveRepository({ ...session, exec: async sql => { sqlite.exec(sql); }, transaction: async action => {
    sqlite.exec('BEGIN IMMEDIATE');
    try { const result = await action(session); sqlite.exec('COMMIT'); return result; }
    catch (error) { sqlite.exec('ROLLBACK'); throw error; }
  } }, () => '2026-10-19T00:00:00.000Z');
}
function sizes() {
  const bytes = name => fs.existsSync(name) ? fs.statSync(name).size : 0;
  const databaseBytes = bytes(file), walBytes = bytes(file + '-wal'), sharedMemoryBytes = bytes(file + '-shm');
  return { databaseBytes, walBytes, sharedMemoryBytes, totalBytes: databaseBytes + walBytes + sharedMemoryBytes };
}
const percentile = values => [...values].sort((a, b) => a - b)[Math.floor((values.length - 1) * .95)];
(async () => {
  let repo = repository(); await repo.initialise();
  let world = { ...createLife('life_benchmark', 42, randomCreation(42), { year: 2026, month: 10, day: 18 }), birthAcknowledged: true };
  await repo.create(world);
  const started = Date.now(), commands = [], commits = []; let years = 0, peakDiskBytes = sizes().totalBytes;
  async function execute(command) {
    const start = performance.now(), next = resolveCommand(world, command, true), resolved = performance.now();
    world = await repo.commit(next, world.revision, 'diagnostic:' + next.revision, command.type === 'advance');
    commands.push(performance.now() - start); commits.push(performance.now() - resolved);
    peakDiskBytes = Math.max(peakDiskBytes, sizes().totalBytes);
  }
  while (!world.people[world.activePersonId].died && years < 150) {
    await execute({ type: 'advance' });
    let guard = 0;
    while ((world.pending || world.annual) && guard++ < 100) {
      if (world.pending?.kind === 'decision') {
        const choice = world.pending.choices.find(item => !choiceUnavailable(world, item));
        if (!choice) throw new Error('No available choice in ' + world.pending.templateId);
        await execute({ type: 'choose', eventId: world.pending.id, choiceId: choice.id });
      } else if (world.pending) await execute({ type: 'acknowledge', resultId: world.pending.id });
      else await execute({ type: 'resume' });
    }
    assert.equal(world.pending, null); assert.equal(world.annual, null); years++;
    if (years % 10 === 0) process.stderr.write(JSON.stringify({ years, commands: commands.length, elapsedMs: Date.now() - started }) + '\n');
  }
  assert.ok(world.people[world.activePersonId].died, 'Life must finish');
  const payloads = {};
  for (const table of ['lives', 'backups', 'snapshots']) payloads[table] = sqlite.prepare('SELECT COUNT(*) AS rows, COALESCE(SUM(length(CAST(payload AS BLOB))),0) AS bytes FROM ' + table).get();
  const beforeClose = sizes(), snapshotCount = (await repo.snapshots(world.id)).length;
  assert.equal(snapshotCount, years, 'Every Age Up must retain its genuine prior checkpoint');
  sqlite.close();
  const afterClose = sizes(); repo = repository(); await repo.initialise();
  const coldStarted = performance.now(), loaded = await repo.load(world.id), coldLoadMs = performance.now() - coldStarted;
  assert.equal(encodeWorld(loaded), encodeWorld(world), 'Cold SQLite resume must preserve all state');
  assert.equal((await repo.snapshots(world.id)).length, snapshotCount);
  assert.equal(sourceHash(), originalHash, 'Game/persistence sources changed during measurement');
  sqlite.close(); sqlite = null;
  process.stdout.write(JSON.stringify({ scope: 'one complete life / real repository / cloud Node SQLite; not native or multi-generation', node: process.version, sourceHash: originalHash, seed: 42, born: '2026-10-18', years, ageAtDeath: ageOn(world.people[world.activePersonId], world.date), people: Object.keys(world.people).length, ledgerRows: world.ledger.length, commands: commands.length, snapshots: snapshotCount, payloads, beforeClose, afterClose, peakDiskBytes, commandP95Ms: percentile(commands), commitP95Ms: percentile(commits), coldLoadMs, coldLoadExactMatch: true, elapsedMs: Date.now() - started }, null, 2) + '\n');
})().catch(error => { process.stderr.write(error.stack + '\n'); process.exitCode = 1; }).finally(() => { if (sqlite) sqlite.close(); });
