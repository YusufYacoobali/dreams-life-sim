// Shared Node diagnostic loader. Native configuration only; never enables purchases.
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const ts = require('typescript'), {createHash} = require('node:crypto');
const sha = value => createHash('sha256').update(value).digest('hex');
function runtime(source, observe = () => {}, options = {}) {
  source = path.resolve(source);
  global.__scalingMeasure = (name, work) => {
    const start = performance.now();
    try { return work(); } finally { observe(name, performance.now() - start); }
  };
  const nativeLoad = Module._load;
  Module._load = function(name, ...args) {
    return name === 'expo-constants' ? {__esModule:true, default:{expoConfig:{extra:{}}}} : nativeLoad.call(this, name, ...args);
  };
  require.extensions['.ts'] = (module, file) => {
    let code = fs.readFileSync(file, 'utf8');
    const names = new Set(file.endsWith('/game/model.ts') ? ['copyWorld','parseWorldShape','sharedCertifiedBranch','validateWorld']
      : file.endsWith('/persistence/checkpoints.ts') ? ['packText','encodedRecord','encodedValue'] : []);
    // Instrument function bodies by syntax positions, without changing expressions/RNG/order.
    if (names.size && options.instrument !== false) {
      const parsed = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true), edits = [];
      for (const node of parsed.statements) if (ts.isFunctionDeclaration(node) && node.body && names.has(node.name?.text)) {
        edits.push([node.body.getStart(parsed)+1, `return (globalThis as any).__scalingMeasure('${node.name.text}', () => {`]);
        edits.push([node.body.end-1, '});']);
      }
      for (const [position, text] of edits.sort((a,b) => b[0]-a[0])) code = code.slice(0,position)+text+code.slice(position);
    }
    module._compile(ts.transpileModule(code, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText, file);
  };
  const load = file => require(path.join(source,file));
  const model = load('src/game/model.ts'), codec = load('src/persistence/checkpoints.ts');
  const engine = load('src/game/engine.ts');
  if (options.instrument !== false) for (const folder of ['src/game/systems']) for (const file of fs.readdirSync(path.join(source,folder)).filter(file => file.endsWith('.ts'))) {
    const mod = load(folder+'/'+file);
    for (const name of Object.keys(mod)) if (typeof mod[name] === 'function' && (/^validate/.test(name) || /Month$/.test(name))) {
      const original = mod[name]; mod[name] = (...args) => global.__scalingMeasure(name, () => original(...args));
    }
  }
  if (options.instrument !== false) for (const [mod, names] of [[load('src/game/ledgerIndex.ts'), ['indexLedger']], [codec,['packCheckpoint']], [engine,['resolveCommand']]]) {
    for (const name of names) { const original = mod[name]; mod[name] = (...args) => global.__scalingMeasure(name, () => original(...args)); }
  }
  const files = [];
  function scan(folder) { for (const entry of fs.readdirSync(path.join(source,folder),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))) {
    const file = path.join(folder,entry.name); if (entry.isDirectory()) scan(file); else if (/\.[jt]sx?$/.test(file)) files.push(file);
  }}
  scan('src');
  const digest = () => sha(files.map(file => file+'\0'+fs.readFileSync(path.join(source,file),'utf8')).join('\0'));
  return {load, model, codec, engine, digest};
}
module.exports = {runtime, sha};
