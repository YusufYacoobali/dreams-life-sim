// Pure-engine cloud sweep. Native/component/SQLite checks remain in Jest.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), { createHash } = require('node:crypto');
const setupStarted = Date.now(), ts = require('typescript'), root = path.join(__dirname, '..');
const args = process.argv.slice(2), immutable = args.includes('--immutable'), positional = args.filter(arg => arg !== '--immutable');
const count = Number(positional[0] ?? 12), startSeed = Number(positional[1] ?? 0), stateMode = immutable ? 'validated immutable' : 'mutable domain API';
if (positional.length > 2 || !Number.isInteger(count) || count < 1 || count > 1000 || !Number.isInteger(startSeed) || startSeed < 0 || startSeed + count > 1000) {
  process.stderr.write('Usage: node tools/run-life-sweep.cjs [count 1..1000] [start seed 0..999] [--immutable], with start + count <= 1000\n');
  process.exit(1);
}
function sourceHash() {
  const base = path.join(root, 'src/game'), hash = createHash('sha256');
  const visit = dir => { for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) visit(file);
    else if (entry.name.endsWith('.ts')) hash.update(path.relative(base, file)).update('\0').update(fs.readFileSync(file)).update('\0');
  } };
  visit(base); return hash.digest('hex');
}
const originalHash = sourceHash();
const toolHash = () => createHash('sha256').update(fs.readFileSync(__filename)).digest('hex');
const originalToolHash = toolHash();
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
const { createLife, randomCreation } = require('../src/game/createLife.ts'), { resolveCommand } = require('../src/game/engine.ts');
const { validateWorld, immutableWorld, encodeWorld, ageOn } = require('../src/game/model.ts'), { choiceUnavailable } = require('../src/game/choiceAvailability.ts');
const { countryCodes } = require('../src/game/countries.ts');
let trace = [], lastValid = null;
function run(world, command) {
  trace.push(command); lastValid = world;
  const next = resolveCommand(world, command, immutable); lastValid = next; return next;
}
function finishPending(world) {
  let guard = 0;
  while ((world.pending || world.annual) && guard++ < 100) {
    if (world.pending?.kind === 'decision') {
      const choice = world.pending.choices.find(item => !choiceUnavailable(world, item));
      if (!choice) throw new Error('No available choice in ' + world.pending.templateId);
      world = run(world, { type: 'choose', eventId: world.pending.id, choiceId: choice.id });
    } else if (world.pending) world = run(world, { type: 'acknowledge', resultId: world.pending.id });
    else world = run(world, { type: 'resume' });
  }
  if (guard >= 100) throw new Error('Annual progression did not close');
  return world;
}
const started = Date.now(), ages = [], countryCounts = {}, results = []; let seed = startSeed, phase = 'life';
process.stdout.write(JSON.stringify({ event: 'sweep-start', scope: 'pure engine / cloud Node; first eligible choices; newborn acknowledgement flag set before engine progression; not native or SQLite', stateMode, node: process.version, count, startSeed, gameSourceHash: originalHash, toolSourceHash: originalToolHash, setupMs: started - setupStarted }) + '\n');
try {
  for (; seed < startSeed + count; seed++) {
    const lifeStarted = Date.now();
    trace = []; lastValid = null;
    let world = { ...createLife('life_engine', seed, randomCreation(seed), { year: 2024, month: 2, day: 29 }), birthAcknowledged: true }, turns = 0;
    if (immutable) world = immutableWorld(world);
    lastValid = world;
    const country = world.people[world.activePersonId].country;
    while (!world.people[world.activePersonId].died && turns++ < 150) {
      world = finishPending(run(world, { type: 'advance' })); validateWorld(world);
    }
    const player = world.people[world.activePersonId];
    assert.ok(player.died, 'Life did not reach death'); assert.ok(player.causeOfDeath, 'Missing factual cause');
    assert.equal(world.pending, null); assert.equal(world.annual, null);
    assert.ok(world.journal.some(item => item.personId === player.id && item.category === 'death'), 'Missing factual death journal');
    ages.push(ageOn(player, world.date)); countryCounts[country] = (countryCounts[country] ?? 0) + 1;
    const worldSha256 = createHash('sha256').update(encodeWorld(world)).digest('hex');
    const row = { event: 'life-complete', seed, completed: seed - startSeed + 1, requested: count, country, versions: { world: world.schemaVersion, engine: world.engineVersion, content: world.contentVersion }, commands: trace.length, ageAtDeath: ages.at(-1), people: Object.keys(world.people).length, ledgerRows: world.ledger.length, worldSha256, lifeMs: Date.now() - lifeStarted, elapsedMs: Date.now() - started };
    results.push(row); process.stdout.write(JSON.stringify(row) + '\n');
  }
  phase = 'complete-checks';
  if (count >= 12) assert.ok(Math.min(...ages) < Math.max(...ages), 'No lifespan variation');
  if (count === 1000) assert.deepEqual(Object.keys(countryCounts).sort(), [...countryCodes].sort(), 'Full seed range must cover every country');
  assert.equal(sourceHash(), originalHash, 'Game sources changed during the sweep');
  assert.equal(toolHash(), originalToolHash, 'Sweep tool changed during the run');
  process.stdout.write(JSON.stringify({ event: 'sweep-complete', count, startSeed, completed: results.length, stateMode, versions: results[0].versions, gameSourceHash: originalHash, toolSourceHash: originalToolHash, countryCounts, ageRange: [Math.min(...ages), Math.max(...ages)], maxPeople: Math.max(...results.map(row => row.people)), maxLedgerRows: Math.max(...results.map(row => row.ledgerRows)), elapsedMs: Date.now() - started }) + '\n');
} catch (error) {
  let diagnostic = null;
  try {
    const directory = path.join(require('node:os').tmpdir(), 'dreams-life-sweep-failures'); fs.mkdirSync(directory, { recursive: true });
    diagnostic = path.join(directory, 'seed-' + seed + '-' + Date.now() + '.json');
    fs.writeFileSync(diagnostic, JSON.stringify({ format: 'pure-engine-sweep-failure-v1', phase, seed: phase === 'life' ? seed : null, stateMode, gameSourceHash: originalHash, toolSourceHash: originalToolHash, completed: results.length, error: error.message, commands: trace, lastValidWorld: lastValid ? encodeWorld(lastValid) : null }, null, 2) + '\n');
  } catch { /* Preserve the original failure even if the diagnostic cannot be written. */ }
  process.stderr.write(JSON.stringify({ event: 'sweep-failed', phase, seed: phase === 'life' ? seed : null, completed: results.length, error: error.message, diagnostic }) + '\n' + error.stack + '\n'); process.exitCode = 1;
}
