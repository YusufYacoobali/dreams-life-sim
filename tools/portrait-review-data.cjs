// Load the actual pure portrait plan and static PNG registry for offline review.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
function load(file) {
  if (file.endsWith('.png')) return file;
  if (!path.extname(file)) file += '.ts';
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'module', 'exports', source)(specifier => specifier.startsWith('.') ? load(path.resolve(path.dirname(file), specifier)) : require(specifier), module, module.exports);
  return module.exports;
}
const plan = load(path.join(root, 'src/assets/portraitPlan.ts'));
const { portraitImages } = load(path.join(root, 'src/assets/portraitImages.ts'));
const palette = load(path.join(root, 'src/assets/portraitLayout.ts'));
const file = ts.createSourceFile('CreationElements.tsx', fs.readFileSync(path.join(root, 'src/ui/CreationElements.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const declaration = file.statements.filter(ts.isVariableStatement).flatMap(statement => [...statement.declarationList.declarations]).find(item => item.name.getText(file) === 'avatarPresets');
const presets = new Function('return (' + declaration.initializer.getText(file) + ')')();
module.exports = { ...plan, ...palette, portraitImages, presets, root };
if (require.main === module) {
  console.log(JSON.stringify({ portraitImages, presets, samples: presets.map(appearance => ({ appearance, layers: plan.portraitLayers(plan.portraitTraits(appearance, 25)) })) }));
}
