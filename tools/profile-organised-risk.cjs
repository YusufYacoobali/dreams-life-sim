// Run the same seeded gameplay checks against current or archived sources without Jest overhead.
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module'), ts = require('typescript');
const source = path.resolve(process.argv[2] ?? '.'), output = process.argv[3];
if (!output) throw Error('Usage: node tools/profile-organised-risk.cjs SOURCE OUTPUT.json');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, file);
process.env.DREAMS_CRIME_PROFILE_OUTPUT = path.resolve(output);
global.expect = require('expect').expect;
global.test = (_name, run) => run();
const entry = path.join(source, 'tests/game/organised-risk-profile.test.ts'), driver = new Module(entry, module), started = performance.now();
driver.filename = entry; driver.paths = Module._nodeModulePaths(path.dirname(entry));
driver._compile(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../tests/game/organised-risk-profile.test.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, entry);
const result = JSON.parse(fs.readFileSync(output, 'utf8'));
process.stdout.write(JSON.stringify({ source, trials: result.rows.reduce((sum, row) => sum + row.samples, 0), progressions: result.careers.reduce((sum, row) => sum + row.samples, 0), elapsedMs: Math.round(performance.now() - started), passed: true }) + '\n');
