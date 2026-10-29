// Read the pre-expansion constructor from Git; never rewrite its historical proof.
const fs = require('node:fs'), path = require('node:path');
const { createHash } = require('node:crypto'), { gzipSync } = require('node:zlib');
const ts = require('typescript'), root = path.resolve(__dirname, '..');
const sourceCommit = '2bb7ce9b3c301de9a286d2cb90d88fe6a1670c4b';
// First extract `git archive <sourceCommit> src` into an empty directory, then
// pass that directory. Resolve dependencies from this checkout's node_modules.
const baselineRoot = process.argv[2];
if (!baselineRoot) throw new Error('Pass the directory containing the archived baseline src/');
require.extensions['.ts'] = (module, file) => {
  const relative = path.relative(root, file).split(path.sep).join('/');
  const source = relative.startsWith('src/')
    ? fs.readFileSync(path.join(baselineRoot, relative), 'utf8')
    : fs.readFileSync(file, 'utf8');
  module._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
};
const { createLife, randomCreation } = require('../src/game/createLife.ts');
const samples = {};
for (let seed = 0; seed < 512; seed++) {
  const input = randomCreation(seed);
  input.background = seed % 4 === 0 && ['GB', 'ES', 'JP'].includes(input.country) ? 'royal' : 'ordinary';
  const world = createLife('life_birth_sample_' + seed, seed, input, { year: 2026, month: 10, day: 22 });
  samples[seed] = {
    people: Object.fromEntries(Object.values(world.people).map(p => [p.id, { firstName: p.firstName, lastName: p.lastName }])),
    households: Object.fromEntries(world.households.map(home => [home.id, home.name])),
    royalHouses: Object.fromEntries(world.royalHouses.map(house => [house.id, house.name])),
  };
}
const raw = JSON.stringify(samples);
const fixture = { sourceCommit, samples: 512, sha256: createHash('sha256').update(raw).digest('hex'), encoding: 'gzip-base64', data: gzipSync(raw).toString('base64') };
fs.writeFileSync(path.join(root, 'tests/fixtures/birth-names-before-expansion.json'), JSON.stringify(fixture, null, 2) + '\n');
console.log({ sourceCommit, samples: 512, sha256: fixture.sha256 });
