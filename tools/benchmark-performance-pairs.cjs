// Alternate baseline/candidate order for each pair on the same Node process.
// This isolates synchronous simulation + checkpoint work, not SQLite or native UI.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { createHash } = require('node:crypto'), ts = require('typescript');
const flags = {}; for (let i = 2; i < process.argv.length; i += 2) flags[process.argv[i]] = process.argv[i + 1];
const baseline = path.resolve(flags['--baseline'] ?? '/tmp/dreams-final-perf-baseline');
const candidate = path.resolve(flags['--candidate'] ?? path.join(__dirname, '..'));
const inputFile = flags['--inputs'] ?? '/tmp/dreams-final-perf-inputs.json';
const output = flags['--output'] ?? '/tmp/dreams-final-perf-interleaved.json';
const samples = Number(flags['--samples'] ?? 11), sha = value => createHash('sha256').update(value).digest('hex');
assert(samples >= 5 && samples <= 50);
const sourceFiles = root => {
  const files = [];
  function visit(dir) { for (const item of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.join(dir, item.name); if (item.isDirectory()) visit(file); else if (file.endsWith('.ts')) files.push(file);
  } }
  visit(path.join(root, 'src/game')); visit(path.join(root, 'src/persistence'));
  return () => sha(files.map(file => path.relative(root, file) + '\0' + fs.readFileSync(file, 'utf8')).join('\0'));
};
const hashes = [baseline, candidate].map(sourceFiles), sourceHashes = hashes.map(hash => hash());
const driverHash = sha(fs.readFileSync(__filename));
let phases;
global.__dreamsPairMeasure = (name, action) => {
  if (!phases) return action(); const start = performance.now();
  try { return action(); } finally { phases[name] = (phases[name] ?? 0) + performance.now() - start; }
};
require.extensions['.ts'] = (module, file) => {
  let source = fs.readFileSync(file, 'utf8');
  if (file.endsWith('/src/game/model.ts')) source = source
    .replace(/const world = parseWorldShape\((value(?:, immutable)?)\);/, (_, args) => "const world = (globalThis as any).__dreamsPairMeasure('shapeParse', () => parseWorldShape(" + args + '));')
    .replace('freezeTree(world);', "(globalThis as any).__dreamsPairMeasure('freezing', () => freezeTree(world));");
  if (file.endsWith('/src/game/engine.ts')) source = source
    .replace('    processMonth(world);', "    (globalThis as any).__dreamsPairMeasure('monthlySimulation', () => processMonth(world));")
    .replace(') finishYear(world);', ") (globalThis as any).__dreamsPairMeasure('annualSimulation', () => finishYear(world));");
  module._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
};
function runtime(root) {
  const load = file => require(path.join(root, file));
  const model = load('src/game/model.ts'), checkpoint = load('src/persistence/checkpoints.ts');
  for (const name of ['copyWorld', 'validateWorld']) {
    const original = model[name]; model[name] = (...args) => global.__dreamsPairMeasure(name, () => original(...args));
  }
  return { model, checkpoint, engine: load('src/game/engine.ts'), choices: load('src/game/choiceAvailability.ts') };
}
const runtimes = [baseline, candidate].map(runtime), fixture = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
const ages = flags['--ages']?.split(',').map(Number), kinds = flags['--kinds']?.split(',') ?? ['routine', 'firstAgeUp', 'fullYear'];
const percentile = (values, p) => [...values].sort((a, b) => a - b)[Math.ceil(values.length * p) - 1];
const summary = values => ({ median: percentile(values, .5), p95: percentile(values, .95) });
function execute(api, initial, kind) {
  let world = initial, resolveMs = 0, packMs = 0, commands = 0; phases = {};
  const cpu = process.cpuUsage(), heap = process.memoryUsage().heapUsed, start = performance.now();
  function command(value) {
    const opening = performance.now(); world = api.engine.resolveCommand(world, value, true); resolveMs += performance.now() - opening;
    const pack = performance.now(); api.checkpoint.packCheckpoint(world); packMs += performance.now() - pack; commands++;
  }
  command(kind === 'routine' ? { type: 'health-routine', routine: { ...world.people[world.activePersonId].health.routine, mindfulness: !world.people[world.activePersonId].health.routine.mindfulness } } : { type: 'advance' });
  if (kind === 'fullYear') {
    let guard = 0;
    while ((world.pending || world.annual) && guard++ < 120 && !world.people[world.activePersonId].died) {
      const event = world.pending;
      command(event?.kind === 'decision' ? { type: 'choose', eventId: event.id, choiceId: event.choices.find(choice => !api.choices.choiceUnavailable(world, choice)).id }
        : event ? { type: 'acknowledge', resultId: event.id } : { type: 'resume' });
    }
    assert(guard < 120);
  }
  const totalMs = performance.now() - start, used = process.cpuUsage(cpu), heapDeltaBytes = process.memoryUsage().heapUsed - heap, measured = phases;
  phases = null;
  return { totalMs, resolveMs, packMs, cpuMs: (used.user + used.system) / 1000, heapDeltaBytes, phases: measured, commands, worldSha256: sha(api.model.encodeWorld(world)), random: world.random };
}
(async () => {
  const results = [];
  for (const input of fixture.snapshots.filter(row => !ages || ages.includes(row.summary.age))) {
    const worlds = runtimes.map(api => api.checkpoint.unpackCheckpoint(input.payload, true));
    for (const kind of kinds) {
      const warm = runtimes.map((api, index) => execute(api, worlds[index], kind));
      assert.equal(warm[0].worldSha256, warm[1].worldSha256); assert.deepEqual(warm[0].random, warm[1].random);
      const pairs = [];
      for (let sample = 0; sample < samples; sample++) {
        if (global.gc) global.gc(); await new Promise(resolve => setImmediate(resolve));
        const rows = [], order = sample % 2 ? [1, 0] : [0, 1];
        for (const index of order) rows[index] = execute(runtimes[index], worlds[index], kind);
        assert.equal(rows[0].worldSha256, rows[1].worldSha256); assert.deepEqual(rows[0].random, rows[1].random);
        for (const row of rows) assert.equal(row.worldSha256, warm[0].worldSha256);
        pairs.push({ order: order.map(index => index ? 'candidate' : 'baseline'), baseline: rows[0], candidate: rows[1] });
      }
      const timing = name => Object.fromEntries(['baseline', 'candidate'].map(side => [side, summary(pairs.map(pair => pair[side][name]))]));
      const phaseNames = [...new Set(pairs.flatMap(pair => Object.keys(pair.baseline.phases).concat(Object.keys(pair.candidate.phases))))];
      const result = { age: input.summary.age, kind, input: input.summary, inputSha256: sha(runtimes[0].model.encodeWorld(worlds[0])), outcomeSha256: warm[0].worldSha256, commands: warm[0].commands,
        timings: Object.fromEntries(['totalMs', 'resolveMs', 'packMs', 'cpuMs', 'heapDeltaBytes'].map(name => [name, timing(name)])),
        medianPairedRatio: percentile(pairs.map(pair => pair.candidate.totalMs / pair.baseline.totalMs), .5),
        phases: Object.fromEntries(phaseNames.map(name => [name, Object.fromEntries(['baseline', 'candidate'].map(side => [side, summary(pairs.map(pair => pair[side].phases[name] ?? 0))]))])), pairs };
      results.push(result); process.stderr.write('age ' + result.age + ' ' + kind + ' paired ratio ' + result.medianPairedRatio.toFixed(3) + '\n');
      fs.writeFileSync(output, JSON.stringify({ scope: 'Interleaved same-process fixed-save Node simulation/checkpoint pairs; no SQLite, React or native-device/frame claim. Order alternates each sample; one warm-up each side; optional forced GC is outside timed spans.', samples, sourceHashes: { baseline: sourceHashes[0], candidate: sourceHashes[1] }, driverHash, inputFileSha256: sha(fs.readFileSync(inputFile)), results }, null, 2));
    }
  }
  assert.deepEqual(hashes.map(hash => hash()), sourceHashes); assert.equal(sha(fs.readFileSync(__filename)), driverHash);
  console.log({ output, cases: results.length, samples, sourceHashes });
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
