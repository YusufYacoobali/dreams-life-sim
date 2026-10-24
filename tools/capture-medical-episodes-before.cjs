// Capture actual pre-feature constructor and choice outputs. Extract the pinned
// commit's src/ with git archive first; pass the extraction directory as argv[2].
const fs = require('node:fs'), path = require('node:path'), ts = require('typescript');
const { createHash } = require('node:crypto'), { gzipSync } = require('node:zlib');
const root = path.resolve(__dirname, '..'), baseline = process.argv[2];
if (!baseline) throw new Error('Pass a source archive directory');
const sourceCommit = '3c797e2253c98714c79d73191a09889774afccd5';
require.extensions['.ts'] = (module, file) => {
  const relative = path.relative(root, file).split(path.sep).join('/');
  const source = fs.readFileSync(relative.startsWith('src/') ? path.join(baseline, relative) : file, 'utf8');
  module._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
};
const { decodeWorld, encodeWorld } = require('../src/game/model.ts'), { resolveCommand } = require('../src/game/engine.ts');
const { decodeSave } = require('../src/persistence/archive.ts'), { addCondition } = require('../src/game/systems/health.ts');
const actual = decodeSave(fs.readFileSync(path.join(root, 'tests/fixtures/v8-medical-archive.json'), 'utf8')).world;
const generated = decodeWorld(fs.readFileSync(path.join(root, 'tests/fixtures/v3-employed-graduate.json'), 'utf8'));
addCondition(generated, generated.people[generated.activePersonId], 'asthma', 80);
const newOldEmergency = resolveCommand(generated, { type: 'advance' });
const scenarios = [actual, newOldEmergency].map(world => ({ world: encodeWorld(world), choices: world.pending.choices.map(choice => ({ id: choice.id, after: encodeWorld(resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: choice.id })) })) }));
const raw = JSON.stringify(scenarios), fixture = { sourceCommit, encoding: 'gzip-base64', sha256: createHash('sha256').update(raw).digest('hex'), data: gzipSync(raw).toString('base64') };
fs.writeFileSync(path.join(root, 'tests/fixtures/v48-medical-before-episodes.json'), JSON.stringify(fixture, null, 2) + '\n');
console.log({ sourceCommit, scenarios: scenarios.length, choices: scenarios.flatMap(s => s.choices).length, sha256: fixture.sha256 });
