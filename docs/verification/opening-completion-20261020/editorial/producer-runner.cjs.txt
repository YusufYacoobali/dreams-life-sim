// Source-pinned editorial acceptance only. No production code or outcomes are edited.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), { createHash } = require('node:crypto');
const toolRoot = path.resolve(__dirname, '..');
const expectedC35 = {
  referenceCommit: '5a2565458fa5de90c1acaf0e110fc980f6476b64',
  game: '84625d5208d1a6815dccc2802ff75c83393eeb143c382e83d60ed0dafaf94f33',
  gameAndPersistence: '12b49689991da671d72b3ac8bc0bfe6bb2aff788174cf1ccda73665c0195c2b8',
  state: '4e54672a28860f4e4ec593943171268a9202b22d960cc0cec13db94b2cd8c7ea',
  lockfile: '0079491a8e148250f4d4fda7c9fab44d0e1bcb126dea893d06f269489e6a4e1b',
  store: '85b542e0c04192cf192c2eb018ef90dd3c77870261a0a124e75f444710689d09',
  birthDriver: 'b05662854da8a6439ddc559f3b1038895df94ba73cecb9c501b6a6ef5234a2f8',
};
const sha = value => createHash('sha256').update(value).digest('hex');
function digest(directories, base) {
  const hash = createHash('sha256');
  const visit = directory => { for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) { const file = path.join(directory, entry.name); if (entry.isDirectory()) visit(file); else if (file.endsWith('.ts') || file.endsWith('.tsx')) hash.update(path.relative(base, file)).update('\0').update(fs.readFileSync(file)).update('\0'); } };
  directories.forEach(visit); return hash.digest('hex');
}
function sourceHead(root) {
  const entry = path.join(root, '.git');
  const directory = fs.statSync(entry).isDirectory() ? entry : path.resolve(root, fs.readFileSync(entry, 'utf8').trim().replace(/^gitdir: /, ''));
  const head = fs.readFileSync(path.join(directory, 'HEAD'), 'utf8').trim(); if (!head.startsWith('ref: ')) return head;
  const ref = head.slice(5), commonFile = path.join(directory, 'commondir'), common = fs.existsSync(commonFile) ? path.resolve(directory, fs.readFileSync(commonFile, 'utf8').trim()) : directory;
  for (const location of [directory, common]) if (fs.existsSync(path.join(location, ref))) return fs.readFileSync(path.join(location, ref), 'utf8').trim();
  const packed = fs.readFileSync(path.join(common, 'packed-refs'), 'utf8').split('\n').find(line => line.endsWith(' ' + ref)); assert.ok(packed, 'Resolve source Git reference'); return packed.split(' ')[0];
}
function sourcePins(root) {
  return { sourceRoot: root, checkoutHead: sourceHead(root), referenceCommit: expectedC35.referenceCommit, game: digest([path.join(root, 'src/game')], path.join(root, 'src/game')), gameAndPersistence: digest([path.join(root, 'src/game'), path.join(root, 'src/persistence')], root), state: digest([path.join(root, 'src/state')], root), lockfile: sha(fs.readFileSync(path.join(root, 'package-lock.json'))), store: sha(fs.readFileSync(path.join(root, 'src/state/gameStore.ts'))), birthDriver: sha(fs.readFileSync(path.join(root, 'tests/support/sqlite.ts'))), tool: sha(fs.readFileSync(__filename)), policy: sha(fs.readFileSync(path.join(toolRoot, 'tests/support/editorialPolicy.ts'))) };
}
function optionsFor(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index]; assert.ok(['--source', '--country', '--all', '--output', '--max-years', '--manifest-only'].includes(flag) && options[flag] === undefined, 'Use --help for supported arguments');
    options[flag] = ['--all', '--manifest-only'].includes(flag) ? true : argv[++index]; assert.ok(options[flag] && !String(options[flag]).startsWith('--'), 'Missing value for ' + flag);
  }
  assert.ok(options['--source'], 'Explicit --source C35_WORKTREE is required');
  assert.ok(!(options['--all'] && options['--country']), 'Select one country or all twelve');
  if (!options['--manifest-only']) assert.ok((options['--all'] || options['--country']) && options['--output'], 'A run requires explicit --country CODE OR --all and an empty --output directory');
  const maxYears = Number(options['--max-years'] ?? 150); assert.ok(Number.isInteger(maxYears) && maxYears >= 1 && maxYears <= 150);
  return { root: fs.realpathSync(path.resolve(options['--source'])), country: options['--country'], output: options['--output'], manifestOnly: !!options['--manifest-only'], maxYears };
}
const scope = 'Editorial varied-choice policyv1 on exact frozen C35 game source (World34/engine35/content10). Same reused country seeds900..911, not additional seeds in the separate120 annual-policy total. Actual in-memory SQLite repository/store StartLife and birth acknowledgement ONLY; all later changes use validated immutable pure-engine advance/resume/choose/acknowledge commands. Each life resets an ordinary zero-based committed-decision ordinal; choose currently eligible choices[ordinal % eligible.length] in saved bound order, then increment only after commit, including system/callback decisions. No hidden-roll selection, optional setup, funds/stats/age/date/RNG/outcome override or survival guarantee. Production checkpoint cold resume with full canonical-world equality at every distinct pending-decision/result revision, annual closure and final state. Full actual bound choices/eligibility/selected authored branch/results/IDs, callback records and chronology remain evidence; catalogue scenes are separate from system/callback prompts. No all250-natural, all750-branch, all-context, full Scenario A/B/C, SQLite journey, native, physical-device, 120year or multigeneration acceptance claim.';
async function main(argv = process.argv.slice(2)) {
  if (argv.includes('--help')) { process.stdout.write('Usage: node tools/run-editorial-policy.cjs --source C35_WORKTREE [--manifest-only | (--country CODE | --all) --output EMPTY_DIRECTORY] [--max-years 150]\nSame twelve reused country seeds900..911; manifest-only creates no life.\n'); return; }
  const options = optionsFor(argv), original = sourcePins(options.root), started = Date.now();
  for (const key of ['game', 'gameAndPersistence', 'state', 'lockfile', 'store', 'birthDriver']) assert.equal(original[key], expectedC35[key], 'Source must match frozen C35 ' + key);
  const ts = require('typescript');
  require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, file);
  const load = file => require(path.join(options.root, file));
  const birth = { ...load('src/state/gameStore.ts'), ...load('src/persistence/repository.ts'), ...load('src/game/createLife.ts'), ...load('src/game/countries.ts'), ...load('tests/support/sqlite.ts') };
  const runtime = { ...load('src/game/engine.ts'), ...load('src/game/model.ts'), ...load('src/persistence/checkpoints.ts'), ...load('src/game/choiceAvailability.ts'), ...load('src/game/content/events.ts') };
  const { editorialJson, createEditorialLife, runEditorialPolicy, editorialPolicyVersion } = require(path.join(toolRoot, 'tests/support/editorialPolicy.ts'));
  assert.ok(!options.country || birth.countryCodes.includes(options.country), 'Unknown country');
  const assignments = birth.countryCodes.map((country, index) => ({ country, seed: 900 + index })).filter(row => !options.country || row.country === options.country);
  const manifest = { node: process.version, typescript: ts.version, format: 'dreams-editorial-policy-manifest-v1', policyVersion: editorialPolicyVersion, scope, source: original, versions: { world: 34, engine: 35, content: 10 }, maxYears: options.maxYears, seedAssignments: assignments, cohortRun: false };
  assert.deepEqual(sourcePins(options.root), original, 'Source changed while loading');
  if (options.manifestOnly) { process.stdout.write(editorialJson(manifest) + '\n'); return; }
  const output = path.resolve(options.output); assert.ok(!fs.existsSync(output) || fs.readdirSync(output).length === 0, 'Output directory must be empty');
  assert.ok(output !== options.root && !output.startsWith(options.root + path.sep) && output !== toolRoot && !output.startsWith(toolRoot + path.sep), 'Keep evidence outside source and tool worktrees');
  fs.mkdirSync(output, { recursive: true });
  const write = (file, value) => fs.writeFileSync(file, editorialJson(value) + '\n', { flag: 'wx' });
  write(path.join(output, 'manifest.json'), manifest);
  write(path.join(output, 'catalogue.json'), { source: original, templates: runtime.eventTemplates });
  const completed = []; let active = null, lastWorld = null;
  try {
    for (const assignment of assignments) {
      active = assignment; const directory = path.join(output, assignment.country); fs.mkdirSync(directory);
      const initial = await createEditorialLife(birth, assignment.country, assignment.seed); lastWorld = initial.world;
      assert.deepEqual({ world: initial.world.schemaVersion, engine: initial.world.engineVersion, content: initial.world.contentVersion }, manifest.versions);
      write(path.join(directory, 'birth.json'), { mode: 'SQLite store birth only', worldId: initial.world.id, activePersonId: initial.world.activePersonId, storeCommands: ['startLife', 'acknowledgeBirth'], ...initial, world: undefined, worldSha256: sha(runtime.encodeWorld(initial.world)) });
      fs.writeFileSync(path.join(directory, 'birth.checkpoint.json'), runtime.packCheckpoint(initial.world), { flag: 'wx' });
      const result = runEditorialPolicy(initial.world, runtime, { maxYears: options.maxYears, onCommand: (record, world) => { lastWorld = world; fs.appendFileSync(path.join(directory, 'commands.ndjson'), editorialJson(record) + '\n'); }, onDecision: record => fs.appendFileSync(path.join(directory, 'decisions.ndjson'), editorialJson(record) + '\n'), onCold: proof => fs.appendFileSync(path.join(directory, 'cold.ndjson'), editorialJson(proof) + '\n') });
      lastWorld = result.world; assert.equal(result.report.commandsCommitted, result.world.revision - initial.world.revision);
      assert.equal(sha(fs.readFileSync(path.join(directory, 'commands.ndjson'))), result.report.traceSha256, 'Raw command-file bytes match reported trace SHA');
      if (options.maxYears === 150) assert.ok(result.report.naturallyDied, 'Default cohort must actually reach natural death');
      assert.deepEqual(sourcePins(options.root), original, 'Pinned source changed during life');
      write(path.join(directory, 'result.json'), { ...assignment, source: original, scope, ...result.report });
      fs.writeFileSync(path.join(directory, 'final.checkpoint.json'), runtime.packCheckpoint(result.world), { flag: 'wx' });
      const summary = { ...assignment, ageAtEnd: result.report.ageAtEnd, naturallyDied: result.report.naturallyDied, catalogueDecisions: result.report.catalogueDecisions, systemOrCallbackDecisions: result.report.systemOrCallbackDecisions, observedCatalogueIds: result.report.observedCatalogueIds, unseenCatalogueIds: result.report.unseenCatalogueIds, unchosenCatalogueBranches: result.report.unchosenCatalogueBranches, traceSha256: result.report.traceSha256, finalWorldSha256: result.report.finalWorldSha256 };
      completed.push(summary); process.stderr.write(editorialJson({ event: 'editorial-life-complete', ...summary, unseenCatalogueIds: summary.unseenCatalogueIds.length, unchosenCatalogueBranches: summary.unchosenCatalogueBranches.length }) + '\n');
    }
    assert.deepEqual(sourcePins(options.root), original, 'Pinned source changed during cohort');
    const aggregate = { format: 'dreams-editorial-policy-v1', policyVersion: editorialPolicyVersion, scope, source: original, versions: manifest.versions, seedAssignments: assignments, completedLives: completed.length, all250NaturalCoverageClaimed: false, fullScenarioAcceptance: false, elapsedMs: Date.now() - started, records: completed };
    write(path.join(output, 'result.json'), aggregate); process.stdout.write(editorialJson({ output, ...aggregate }) + '\n');
  } catch (error) {
    let checkpoint = null, checkpointError = null, sourceAtFailure = null;
    try { if (lastWorld) { checkpoint = path.join(output, 'failure-last-valid.checkpoint.json'); fs.writeFileSync(checkpoint, runtime.packCheckpoint(lastWorld), { flag: 'wx' }); } } catch (snapshotError) { checkpoint = null; checkpointError = String(snapshotError.stack ?? snapshotError); }
    try { sourceAtFailure = sourcePins(options.root); } catch (sourceError) { sourceAtFailure = { error: String(sourceError.stack ?? sourceError) }; }
    write(path.join(output, 'failure.json'), { format: 'dreams-editorial-policy-failure-v1', source: original, sourceAtFailure, active, completed, error: error.stack ?? String(error), lastValidCheckpoint: checkpoint, checkpointError });
    throw error;
  }
}
if (require.main === module) main().catch(error => { process.stderr.write(String(error.stack ?? error) + '\n'); process.exitCode = 1; });
module.exports = { main, sourcePins, optionsFor, expectedC35 };
