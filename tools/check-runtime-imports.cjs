const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Type-only imports cannot participate in Metro require cycles. Inspect emitted
// runtime imports, including re-exports, rather than silencing Metro warnings.
function runtimeImportCycles(root) {
  const files = [], graph = new Map();
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (/\.tsx?$/.test(file) && !file.endsWith('.d.ts')) files.push(file);
    }
  }
  for (const directory of ['src', 'app']) walk(path.join(root, directory));
  for (const file of files) {
    const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
    const source = ts.createSourceFile(file + '.js', outputText, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JSX), imports = [];
    function collect(node) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'require' && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0]) && node.arguments[0].text.startsWith('.')) {
        const base = path.resolve(path.dirname(file), node.arguments[0].text);
        const target = [base + '.ts', base + '.tsx', path.join(base, 'index.ts'), path.join(base, 'index.tsx')].find(candidate => fs.existsSync(candidate));
        if (target) imports.push(target);
      }
      ts.forEachChild(node, collect);
    }
    collect(source); graph.set(file, imports);
  }
  let nextIndex = 0;
  const stack = [], active = new Set(), indices = new Map(), low = new Map(), cycles = [];
  function visit(file) {
    indices.set(file, nextIndex); low.set(file, nextIndex++); stack.push(file); active.add(file);
    for (const dependency of graph.get(file) || []) {
      if (!indices.has(dependency)) { visit(dependency); low.set(file, Math.min(low.get(file), low.get(dependency))); }
      else if (active.has(dependency)) low.set(file, Math.min(low.get(file), indices.get(dependency)));
    }
    if (low.get(file) === indices.get(file)) {
      const group = []; let member;
      do { member = stack.pop(); active.delete(member); group.push(path.relative(root, member).split(path.sep).join('/')); } while (member !== file);
      if (group.length > 1 || graph.get(file)?.includes(file)) cycles.push(group.sort());
    }
  }
  for (const file of files) if (!indices.has(file)) visit(file);
  return { modules: files.length, cycles };
}
module.exports = { runtimeImportCycles };
if (require.main === module) {
  const result = runtimeImportCycles(path.resolve(__dirname, '..'));
  console.log(JSON.stringify(result, null, 2)); process.exitCode = result.cycles.length ? 1 : 0;
}
