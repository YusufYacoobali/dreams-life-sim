// Reproduce the two natural zero-patient-fee regressions under the frozen
// pre-episode source. Example: node tools/capture-natural-zero-medical.cjs
// --source /path/to/clean-3c797e2-checkout
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { createHash } = require('node:crypto'), { gzipSync } = require('node:zlib');
const ts = require('typescript'), root = path.resolve(__dirname, '..');
const sourceIndex = process.argv.indexOf('--source');
if (sourceIndex < 0 || !process.argv[sourceIndex + 1]) throw new Error('Pass --source pointing to the frozen 3c797e2 source');
const source = path.resolve(process.argv[sourceIndex + 1]);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceCommit = '3c797e2253c98714c79d73191a09889774afccd5';
const sourcePins = {
  'src/game/createLife.ts': '52aa5bc0e62e23374d9e56e2eaef0a6bc77bb96a44084f936377ec7b2441756b',
  'src/game/model.ts': '2773245544485666c5ac6a1b3ddf7f14ec7f20aa232213f71535dff64439973a',
  'src/game/engine.ts': 'eb3dc4c1ef8dcf17e402a4adf14cdea8c6839810ada0b0c2d28d86a411f38e83',
  'src/game/systems/health.ts': '08c1abe86b07755e8c3dd06e9e11c2d772eebbd1f14dcb6157f35a9f16780a67',
  'src/game/content/events.ts': 'aeee6ba9b822efe278f2ba8bf3db1d556b7b50d5b85e773fd527ff4d94ea4252',
};
for (const [file, expected] of Object.entries(sourcePins)) assert.equal(sha(fs.readFileSync(path.join(source, file))), expected, file);
const files = [];
function collect(relative) { for (const entry of fs.readdirSync(path.join(source, relative), { withFileTypes: true })) { const file = relative + '/' + entry.name; if (entry.isDirectory()) collect(file); else if (file.endsWith('.ts')) files.push(file); } }
collect('src/game'); const gameDigest = createHash('sha256');
for (const file of files.sort()) gameDigest.update(file).update('\0').update(fs.readFileSync(path.join(source, file))).update('\0');
const gameSourceSha256 = gameDigest.digest('hex');
assert.equal(files.length, 249); assert.equal(gameSourceSha256, '2ceaf4f63a706ae9c88638c288db0316fbf95926e2b12b1f8427376250a89609');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
const load = file => require(path.join(source, file));
const { createLife, randomCreation } = load('src/game/createLife.ts'), { resolveCommand } = load('src/game/engine.ts');
const { ageOn, encodeWorld } = load('src/game/model.ts'), { choiceUnavailable } = load('src/game/choiceAvailability.ts');
const birth = { id: 'life_engine', date: { year: 2024, month: 2, day: 29 }, birthAcknowledged: true };
const records = [];
for (const [seed, country] of [[2, 'BR'], [10, 'ES']]) {
  // Exact naturalDecision setup: no money, date, condition, actor or RNG edits.
  let world = { ...createLife(birth.id, seed, randomCreation(seed), birth.date), birthAcknowledged: true };
  const trace = []; let reached = false;
  for (let turn = 0; turn < 1000; turn++) {
    const person = world.people[world.activePersonId], age = ageOn(person, world.date);
    if (world.pending?.kind === 'decision' && world.pending.templateId === 'medical-emergency' && age === 18) { reached = true; break; }
    assert(!person.died && age <= 19, 'Original natural boundary changed');
    let command;
    if (world.pending?.kind === 'decision') {
      const choice = world.pending.choices.find(row => !choiceUnavailable(world, row)); assert(choice);
      command = { type: 'choose', eventId: world.pending.id, choiceId: choice.id };
    } else if (world.pending) command = { type: 'acknowledge', resultId: world.pending.id };
    else command = { type: world.annual ? 'resume' : 'advance' };
    trace.push({ revision: world.revision, date: { ...world.date }, command });
    world = resolveCommand(world, command);
  }
  assert(reached); assert.equal(world.schemaVersion, 48); assert.equal(world.engineVersion, 50); assert.equal(world.contentVersion, 27);
  assert.equal(world.people[world.activePersonId].country, country);
  const care = world.pending.choices.find(choice => choice.id === 'care'); assert.equal(care.effects[0].quotedCost, 0n);
  const payload = encodeWorld(world);
  records.push({ seed, country, age: 18, revision: world.revision, date: world.date, commands: trace.length, traceSha256: sha(JSON.stringify(trace)), trace, payloadSha256: sha(payload), bytes: Buffer.byteLength(payload), encoding: 'gzip-base64', data: gzipSync(payload).toString('base64'), outcomes: world.pending.choices.map(choice => ({ choiceId: choice.id, payloadSha256: sha(encodeWorld(resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: choice.id }))) })) });
}
const fixture = { sourceCommit, sourcePins, gameSourceSha256, gameSourceFiles: files.length, sourceVersions: { world: 48, engine: 50, content: 27 }, provenance: 'Genuine natural prefixes from frozen pre-episode source, not newly generated World49 encounters. First eligible decisions; no funds/date/actor/RNG/survival overrides.', birth, records };
fs.writeFileSync(path.join(root, 'tests/fixtures/v48-natural-zero-medical.json'), JSON.stringify(fixture, null, 2) + '\n');
console.log(records.map(({ seed, country, commands, payloadSha256, traceSha256, bytes }) => ({ seed, country, commands, payloadSha256, traceSha256, bytes })));
