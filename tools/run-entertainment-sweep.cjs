// Current-source editorial continuation evidence. Original archives are read
// unchanged; every subsequent state change is an ordinary engine command.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { createHash } = require('node:crypto'), ts = require('typescript');
const root = path.join(__dirname, '..'), args = process.argv.slice(2), options = {};
const scenarios = [
  ['family', 'v19-family-trip-archive.json'],
  ['criminal', 'v9-court-archive.json'],
  ['actor', 'v12-career-archive.json'],
  ['creator', 'v15-studio-archive.json'],
  ['business', 'v11-business-archive.json'],
];
if (args.includes('--help')) {
  process.stdout.write('Usage: node tools/run-entertainment-sweep.cjs --output EMPTY_DIRECTORY [--scenario family|criminal|actor|creator|business] [--max-years 150]\nContinues genuine archived adult contexts to natural death with rotating authored choices; this is not birth-to-death or native playtesting.\n');
  process.exit(0);
}
for (let index = 0; index < args.length; index += 2) {
  assert.ok(['--output', '--scenario', '--max-years'].includes(args[index]) && args[index + 1] && !options[args[index]], 'Use --help for supported options');
  options[args[index]] = args[index + 1];
}
assert.ok(options['--output'], 'Choose an empty evidence output directory');
assert.ok(!options['--scenario'] || scenarios.some(([name]) => name === options['--scenario']), 'Unknown scenario');
const maxYears = Number(options['--max-years'] ?? 150);
assert.ok(Number.isInteger(maxYears) && maxYears >= 1 && maxYears <= 150, 'Year bound must be 1..150');
const output = path.resolve(options['--output']);
fs.mkdirSync(output, { recursive: true }); assert.equal(fs.readdirSync(output).length, 0, 'Output directory must be empty');
const sha = value => createHash('sha256').update(value).digest('hex');
const json = value => JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? item.toString() : item);
const write = (file, value) => fs.writeFileSync(file, json(value) + '\n', { flag: 'wx' });
const append = (file, value) => fs.appendFileSync(file, json(value) + '\n');
function sourceHash() {
  const hash = createHash('sha256');
  const visit = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.name.endsWith('.ts')) hash.update(path.relative(root, file)).update('\0').update(fs.readFileSync(file)).update('\0');
    }
  };
  visit(path.join(root, 'src/game')); visit(path.join(root, 'src/persistence'));
  return hash.digest('hex');
}
const originalSourceHash = sourceHash(), toolHash = sha(fs.readFileSync(__filename)), started = Date.now();
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, file);
const { decodeSave } = require('../src/persistence/archive.ts');
const { packCheckpoint, unpackCheckpoint } = require('../src/persistence/checkpoints.ts');
const { encodeWorld, ageOn, validateWorld } = require('../src/game/model.ts');
const { resolveCommand } = require('../src/game/engine.ts');
const { choiceUnavailable } = require('../src/game/choiceAvailability.ts');
const { eventTemplates } = require('../src/game/content/events.ts');
const catalogue = new Map(eventTemplates.map(scene => [scene.id, scene]));
const contextKeys = ['school', 'parent', 'workplace', 'friend', 'partner', 'child', 'home', 'pet', 'hobby', 'visited', 'specialCareer', 'legal', 'study', 'retired', 'widowed'];
const scope = 'Pure-engine continuations of five genuine archived adult contexts, preserving the original pending decisions/results and historical snapshots. Ordinary advance/resume/choose/acknowledge commands only; available authored choices rotate by encountered ordinal, while urgent care and guilty pleas use explicit visible selections. Every pending boundary cold-round-trips through the production checkpoint codec; each chosen command is independently resolved from the original and restored boundary and compared as a whole canonical world. Captures actual encountered setup, offered choices, selected result and journal. Initial adult contexts are historical fixtures, not naturally attained in this run. No new people, ages, funds, random streams, context flags or outcomes are substituted. Full remaining lives at the default 150-year bound; not birth-to-death, SQLite full-life, native, visual or human playtesting, and not all-catalogue natural coverage.';
write(path.join(output, 'manifest.json'), { scope, sourceHash: originalSourceHash, toolHash, maxYears, catalogueSituations: eventTemplates.length, catalogueChoices: eventTemplates.reduce((sum, scene) => sum + scene.choices.length, 0), scenarios: scenarios.filter(([name]) => !options['--scenario'] || name === options['--scenario']) });
const summaries = [];
let active = null, lastWorld = null;
try {
  for (const [name, fixture] of scenarios) {
    if (options['--scenario'] && name !== options['--scenario']) continue;
    active = name;
    const folder = path.join(output, name); fs.mkdirSync(folder);
    const raw = fs.readFileSync(path.join(root, 'tests/fixtures', fixture), 'utf8');
    const archive = decodeSave(raw), initial = archive.world;
    let world = unpackCheckpoint(packCheckpoint(initial), true), yearsStarted = 0, commands = 0, choices = 0, coldChecks = 0, authoredOrdinal = 0;
    let lastProgress = Date.now();
    const encountered = new Set(), contextsSeen = new Set();
    write(path.join(folder, 'start.json'), { fixture, fixtureSha256: sha(raw), revision: world.revision, date: world.date, age: ageOn(world.people[world.activePersonId], world.date), versions: { world: world.schemaVersion, engine: world.engineVersion, content: world.contentVersion }, initialPending: world.pending, historicalSnapshots: archive.snapshots.length, initialWorldSha256: sha(encodeWorld(world)) });
    const cold = () => {
      const canonical = encodeWorld(world), checkpoint = packCheckpoint(world), restored = unpackCheckpoint(checkpoint, true);
      assert.equal(encodeWorld(restored), canonical, 'Whole world changed during cold resume');
      append(path.join(folder, 'cold.ndjson'), { revision: world.revision, pending: world.pending?.kind ?? null, canonicalSha256: sha(canonical), checkpointSha256: sha(checkpoint), format: JSON.parse(checkpoint).format });
      coldChecks++; world = restored;
    };
    while (!world.people[world.activePersonId].died && commands < 5000) {
      const event = world.pending;
      let command;
      if (event?.kind === 'decision') {
        cold();
        const available = event.choices.filter(choice => !choiceUnavailable(world, choice));
        assert.ok(available.length, 'No eligible choice for ' + event.templateId);
        const scene = catalogue.get(event.templateId);
        const desired = event.templateId === 'medical-emergency' ? 'care' : event.templateId === 'court-hearing' ? 'guilty' : null;
        const selected = available.find(choice => choice.id === desired) ?? available[scene ? authoredOrdinal++ % available.length : 0];
        command = { type: 'choose', eventId: event.id, choiceId: selected.id };
        const before = world, direct = resolveCommand(before, command, true);
        const replay = resolveCommand(unpackCheckpoint(packCheckpoint(before), true), command, true);
        assert.equal(encodeWorld(replay), encodeWorld(direct), 'Chosen command changed after saved resume');
        world = direct; choices++;
        const actualResult = [world.pending, ...world.deferred.map(row => row.event)].find(row => row?.id === event.id + '_result') ?? null;
        const contexts = scene ? contextKeys.filter(key => scene[key]) : [];
        contexts.forEach(context => contextsSeen.add(context));
        if (scene) {
          encountered.add(scene.id);
          const age = ageOn(before.people[before.activePersonId], before.date);
          assert.ok(age >= scene.min && age <= scene.max, 'Authored scene outside its age range');
          assert.ok(event.personIds.every(id => before.people[id]), 'Bound story introduced a missing person');
          if (selected.effects.every(effect => ['stat', 'relationship', 'pet-bond', 'skill', 'school-grade'].includes(effect.kind))) {
            assert.deepEqual(world.accounts, before.accounts); assert.deepEqual(world.ledger, before.ledger);
            assert.deepEqual(world.random, before.random); assert.deepEqual(Object.keys(world.people), Object.keys(before.people));
          }
        }
        append(path.join(folder, 'decisions.ndjson'), { revision: before.revision, date: before.date, age: ageOn(before.people[before.activePersonId], before.date), initialSavedDecision: event.id === initial.pending?.id, contexts, event, selectedChoiceId: selected.id, selectedAuthoredBranch: event.choices.indexOf(selected) + 1, actualResult, actualJournal: world.journal.slice(before.journal.length), died: world.people[world.activePersonId].died });
      } else if (event) {
        cold(); command = { type: 'acknowledge', resultId: event.id };
        append(path.join(folder, 'results.ndjson'), { revision: world.revision, date: world.date, result: event });
        world = resolveCommand(world, command, true);
      } else if (world.annual) {
        command = { type: 'resume' }; world = resolveCommand(world, command, true);
      } else {
        if (yearsStarted >= maxYears) break;
        cold(); yearsStarted++; command = { type: 'advance' }; world = resolveCommand(world, command, true);
      }
      commands++; lastWorld = world;
      append(path.join(folder, 'commands.ndjson'), { ordinal: commands - 1, command, revision: world.revision, date: world.date });
      if (Date.now() - lastProgress >= 15000) {
        process.stdout.write(json({ event: 'entertainment-continuation-progress', scenario: name, age: ageOn(world.people[world.activePersonId], world.date), yearsStarted, decisions: choices, commands, elapsedMs: Date.now() - started }) + '\n');
        lastProgress = Date.now();
      }
    }
    assert.ok(commands < 5000, 'Continuation exceeded command guard');
    validateWorld(world);
    const player = world.people[world.activePersonId];
    if (maxYears === 150) assert.ok(player.died, 'Full remaining life did not reach natural death');
    assert.deepEqual(world.journal.slice(0, initial.journal.length), initial.journal, 'Historical journal changed');
    fs.writeFileSync(path.join(folder, 'final.checkpoint.json'), packCheckpoint(world), { flag: 'wx' });
    const summary = { scenario: name, fixture, yearsStarted, decisions: choices, commands, coldChecks, ageAtEnd: ageOn(player, world.date), naturallyDied: Boolean(player.died), causeOfDeath: player.causeOfDeath, encounteredCatalogueIds: [...encountered].sort(), observedContexts: [...contextsSeen].sort(), unobservedCatalogueIds: eventTemplates.filter(scene => !encountered.has(scene.id)).map(scene => scene.id), finalWorldSha256: sha(encodeWorld(world)) };
    summaries.push(summary); write(path.join(folder, 'summary.json'), summary);
    process.stdout.write(json({ event: 'entertainment-continuation-complete', ...summary, unobservedCatalogueIds: summary.unobservedCatalogueIds.length }) + '\n');
  }
  assert.equal(sourceHash(), originalSourceHash, 'Game or persistence sources changed during the evidence run');
  assert.equal(sha(fs.readFileSync(__filename)), toolHash, 'Sweep tool changed during the evidence run');
  write(path.join(output, 'result.json'), { scope, sourceHash: originalSourceHash, toolHash, elapsedMs: Date.now() - started, completed: summaries.length, summaries });
} catch (error) {
  write(path.join(output, 'failure.json'), { scenario: active, completed: summaries.length, error: String(error.stack ?? error) });
  if (lastWorld) fs.writeFileSync(path.join(output, 'failure.checkpoint.json'), packCheckpoint(lastWorld), { flag: 'wx' });
  process.stderr.write(String(error.stack ?? error) + '\n'); process.exitCode = 1;
}
