// Extend the existing benchmark's read-only instrumentation; gameplay sources stay unchanged.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const file = path.join(__dirname, 'benchmark-final-performance.cjs');
const original = fs.readFileSync(file, 'utf8');
const injection = `
const standardLoader = require.extensions['.ts'];
require.extensions['.ts'] = (module, file) => {
  if (file !== path.join(source, 'src/game/model.ts')) return standardLoader(module, file);
  let text = fs.readFileSync(file, 'utf8');
  text = text.replace('const world = parseWorldShape(value, immutable);', "const world = (globalThis as any).__dreamsMeasure('shapeParse', () => parseWorldShape(value, immutable));")
    .replace('freezeTree(world);', "(globalThis as any).__dreamsMeasure('freezing', () => freezeTree(world));")
    .replace('for (const row of world.ledger) if (!immutableTransactions.has(row)) immutableTransactions.add(Object.freeze(row));', "(globalThis as any).__dreamsMeasure('transactionCertification:' + world.ledger.filter(row => !immutableTransactions.has(row)).length, () => { for (const row of world.ledger) if (!immutableTransactions.has(row)) { const frozen = (globalThis as any).__dreamsMeasure('freezeTransaction', () => Object.freeze(row)); (globalThis as any).__dreamsMeasure('certifyTransaction', () => immutableTransactions.add(frozen)); } });")
    .replace('const ledger = indexLedger(world.ledger, world.ledger.every(row => immutableTransactions.has(row)));', "const ledger = (globalThis as any).__dreamsMeasure('ledgerIndex', () => indexLedger(world.ledger, world.ledger.every(row => immutableTransactions.has(row))));")
    .replace('rememberLedgerIndex(world.ledger, ledger);', "(globalThis as any).__dreamsMeasure('rememberLedgerIndex', () => rememberLedgerIndex(world.ledger, ledger));");
  module._compile(ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
};
`;
const marker = 'const load=file=>require(path.join(source,file))';
if (!original.includes(marker)) throw Error('Benchmark loader changed; review instrumentation');
const instrumented = original.replace(marker, injection + marker);
const driver = new Module(file, module);
driver.filename = file;
driver.paths = Module._nodeModulePaths(__dirname);
driver._compile(instrumented, file);
