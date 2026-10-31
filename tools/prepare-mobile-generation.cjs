// Replay the published real-command succession journey; never patch a World.
const fs = require('node:fs'), path = require('node:path'), zlib = require('node:zlib');
const assert = require('node:assert/strict'), crypto = require('node:crypto'), ts = require('typescript');
const source = path.resolve(process.argv[2]), output = process.argv[3], root = path.resolve(__dirname, '..');
if (!output) throw Error('Usage: node tools/prepare-mobile-generation.cjs SOURCE OUTPUT');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
const { decodeWorld, encodeWorld } = require(path.join(source, 'src/game/model.ts'));
const { resolveCommand } = require(path.join(source, 'src/game/engine.ts'));
const { packCheckpoint } = require(path.join(source, 'src/persistence/checkpoints.ts'));
const { ageOn } = require(path.join(source, 'src/game/personHelpers.ts'));
const input = fs.readFileSync(path.join(root, 'docs/verification/lifestyle-final-polish/journeys/multiple-generations.json.gz'));
const record = JSON.parse(zlib.gunzipSync(input).toString(), (_key, value) => value && typeof value === 'object' && '$dreamsBigInt' in value ? BigInt(value.$dreamsBigInt) : value);
let world = decodeWorld(fs.readFileSync(path.join(source, 'tests/fixtures/v6-birth-result.json'), 'utf8'), true);
for (const row of record.commands) world = resolveCommand(world, row.command, true);
const acknowledgements = [];
while (world.pending?.kind === 'result' && acknowledgements.length < 8) { const command = { type: 'acknowledge', resultId: world.pending.id }; world = resolveCommand(world, command, true); acknowledgements.push(command); }
assert(!world.pending && !world.annual, 'Prepare an actual settled successor home screen');
assert.equal(world.generation, 2); assert.equal(world.activePersonId, record.final.activePersonId);
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
fs.writeFileSync(output, JSON.stringify({ scope: 'Actual published succession commands from the existing family birth save, including earned purchases, paid care, death, will and existing-child continuation. No dates, funds, people, histories or RNG patched.', commandArchiveSha256: sha(input), successorAcknowledgements: acknowledgements, snapshots: [{ summary: { age: ageOn(world.people[world.activePersonId], world.date), generation: world.generation, people: Object.keys(world.people).length, ledgerRows: world.ledger.length, journalRows: world.journal.length, sha256: sha(encodeWorld(world)) }, payload: packCheckpoint(world) }] }));
console.log({ output, generation: world.generation, commands: record.commands.length });
