// Current-source acceptance tools only. No game module is imported by preflight.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { createHash } = require('node:crypto'), { createRequire } = require('node:module');
const versions = Object.freeze({ world: 38, engine: 39, content: 13, database: 18, checkpoint: 'v4' });
const countries = Object.freeze(['US', 'CA', 'GB', 'AU', 'FR', 'DE', 'ES', 'IT', 'BR', 'IN', 'JP', 'ZA']);
const originals = Object.freeze({
  'tools/run-professional-policy.cjs': 'de3b3a1328889bd68ec7c4bad1f101ca1f63295890c24dd4480d548436821d71',
  'tests/support/professionalPolicy.ts': 'ec26bbfc39116ecee50510a27c91e9ed621a4ae7f15e01413adcf224c66f84df',
  'tools/run-criminal-policy.cjs': 'eb64a09b4f3c91686f970c85359b3012439e9e581ff9e105e4fe223ff87b04bb',
  'tests/support/criminalPolicy.ts': '5091b729b69b514d6aab5a8105afd68ef652434e4ac40c549e5c51ce5f801a4f',
  'tools/run-entrepreneur-sweep.cjs': '21cb42091ac828b797cccb27d11b712d517dac18d4cbcfdbe74fb620af17c89a',
  'tools/run-editorial-policy.cjs': 'e0eb16fb73962b9632b4949a5ed1d729d8aca97be1607490a964c5a10abe1706',
  'tests/support/editorialPolicy.ts': '0e2bf26c25d28c24d8ac9111fe2f3de704a1cadb0e8e98df82b4dbf93bcf3c72',
  'tools/run-life-sweep.cjs': 'b57b6bb3befdba4e776217b3ebf79c1fe4892f2cd7a260fa9b7e928bca75e20e',
  'tests/support/sqlite.ts': 'b05662854da8a6439ddc559f3b1038895df94ba73cecb9c501b6a6ef5234a2f8',
});
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const oid = (kind, bytes) => createHash('sha1').update(Buffer.from(kind + ' ' + bytes.length + '\0')).update(bytes).digest('hex');
const json = value => JSON.stringify(value, (_, item) => typeof item === 'bigint' ? { $dreamsBigInt: item.toString() } : item);
const pin = file => { const bytes = fs.readFileSync(file); return { file, bytes: bytes.length, sha256: hash(bytes) }; };
function checkedFile(proof, label) {
  assert(proof && path.isAbsolute(proof.file ?? '') && Number.isSafeInteger(proof.bytes) && proof.bytes >= 0 && /^[a-f0-9]{64}$/.test(proof.sha256 ?? ''), label + ': complete absolute file proof required');
  const stat = fs.lstatSync(proof.file); assert(stat.isFile() && !stat.isSymbolicLink(), label + ': regular file required');
  assert.deepEqual(pin(proof.file), proof, label + ': bytes/hash changed'); return fs.readFileSync(proof.file);
}
const managed = name => /^(?:app\/|src\/|assets\/|tools\/current-policy\/)/.test(name) || /^(?:(?:app|babel|metro)\.config\.(?:[cm]?[jt]s|json)|\.babelrc(?:\.(?:[cm]?[jt]s|json))?)$/.test(name) || ['package.json', 'package-lock.json', 'app.json', 'tsconfig.json', 'tests/support/professionalPolicyV3.ts', ...Object.keys(originals)].includes(name);
function verifySource(registrationFile) {
  assert(path.isAbsolute(registrationFile), 'Use an explicit absolute registration path');
  const registrationPin = pin(registrationFile), registration = JSON.parse(checkedFile(registrationPin, 'Registration'));
  assert.equal(registration.format, 'dreams-current-policy-registration-v1'); assert.equal(registration.complete, true, 'Pending registration cannot load a runtime');
  assert.deepEqual(registration.versions, versions);
  const source = JSON.parse(checkedFile(registration.sourceSnapshot, 'Frozen source snapshot'));
  assert(path.isAbsolute(source.root ?? '') && /^[a-f0-9]{40}$/.test(source.commit ?? ''), 'Full frozen source root and commit required');
  assert.deepEqual(source.versions, versions); assert.equal(registration.commit, source.commit);
  assert(fs.lstatSync(source.root).isDirectory() && !fs.lstatSync(source.root).isSymbolicLink(), 'Source root must be a real directory');
  const git = registration.git;
  for (const name of ['head', 'status', 'tree', 'commit']) checkedFile(git?.[name], 'Git ' + name);
  assert.equal(fs.readFileSync(git.head.file, 'utf8').trim(), source.commit);
  assert.equal(fs.readFileSync(git.status.file, 'utf8'), '', 'Captured source must be clean');
  const commitBytes = fs.readFileSync(git.commit.file); assert.equal(oid('commit', commitBytes), source.commit);
  const rootTree = /^tree ([a-f0-9]{40})\n/.exec(commitBytes.toString()); assert(rootTree, 'Raw complete commit object required');
  const tree = new Map(), directories = new Map();
  for (const record of fs.readFileSync(git.tree.file, 'utf8').split('\0').filter(Boolean)) {
    const match = /^(100644|100755|120000) blob ([a-f0-9]{40})\t(.+)$/.exec(record); assert(match, 'Complete NUL-separated recursive Git tree required');
    const name = match[3]; assert(!path.isAbsolute(name) && !name.split('/').some(part => ['.', '..', ''].includes(part)) && !tree.has(name), 'Unsafe/repeated Git tree path');
    const entry = { mode: match[1], oid: match[2] }; tree.set(name, entry);
    const parts = name.split('/'); let directory = directories;
    for (const part of parts.slice(0, -1)) { if (!directory.has(part)) directory.set(part, new Map()); directory = directory.get(part); assert(directory instanceof Map, 'Conflicting tree path'); }
    assert(!directory.has(parts.at(-1)), 'Conflicting tree leaf'); directory.set(parts.at(-1), entry);
  }
  const treeOid = directory => oid('tree', Buffer.concat([...directory].sort(([a, x], [b, y]) => Buffer.compare(Buffer.from(a + (x instanceof Map ? '/' : '')), Buffer.from(b + (y instanceof Map ? '/' : '')))).flatMap(([name, entry]) => [Buffer.from((entry instanceof Map ? '40000' : entry.mode) + ' ' + name + '\0'), Buffer.from(entry instanceof Map ? treeOid(entry) : entry.oid, 'hex')])));
  assert.equal(treeOid(directories), rootTree[1], 'Incomplete/unrelated tree proof');
  assert(source.source && typeof source.source === 'object' && !Array.isArray(source.source));
  const required = [...tree.keys()].filter(managed).sort(); assert(required.length > 0);
  for (const name of ['src/game/model.ts', 'src/game/engine.ts', 'src/persistence/repository.ts', 'src/persistence/checkpoints.ts', 'src/state/gameStore.ts', 'package.json', 'package-lock.json', 'tools/current-policy/source.cjs', 'tools/current-policy/run-ab.cjs', 'tools/current-policy/run-professional-v3.cjs', 'tools/current-policy/run-criminal-v2.cjs', 'tools/current-policy/run-entrepreneur-v3.cjs', 'tools/current-policy/run-editorial-v2.cjs', 'tests/support/professionalPolicyV3.ts', ...Object.keys(originals)]) assert(required.includes(name), 'Incomplete policy source tree: ' + name);
  for (const name of required) assert(Object.hasOwn(source.source, name), 'Missing source SHA: ' + name);
  for (const [name, sha] of Object.entries(source.source)) {
    assert(tree.has(name) && /^[a-f0-9]{64}$/.test(sha), 'Untracked/invalid source pin: ' + name);
    let parent = source.root;
    for (const part of name.split('/').slice(0, -1)) { parent = path.join(parent, part); const stat = fs.lstatSync(parent); assert(stat.isDirectory() && !stat.isSymbolicLink(), 'Source ancestor must be a real directory: ' + name); }
    const file = path.join(source.root, name), stat = fs.lstatSync(file); assert(tree.get(name).mode !== '120000' && stat.isFile() && !stat.isSymbolicLink(), 'Pinned source must be a regular file');
    const bytes = fs.readFileSync(file); assert.equal(hash(bytes), sha, 'Source SHA differs: ' + name); assert.equal(oid('blob', bytes), tree.get(name).oid, 'Source Git blob differs: ' + name);
  }
  const actual = [];
  const visit = directory => { for (const entry of fs.readdirSync(directory, { withFileTypes: true })) { assert(!entry.isSymbolicLink(), 'Unlisted source symlink'); const file = path.join(directory, entry.name); if (entry.isDirectory()) visit(file); else { assert(entry.isFile()); const name = path.relative(source.root, file).split(path.sep).join('/'); if (managed(name)) actual.push(name); } } };
  for (const directory of ['app', 'src', 'assets', 'tools/current-policy']) { const file = path.join(source.root, directory); assert(fs.lstatSync(file).isDirectory() && !fs.lstatSync(file).isSymbolicLink()); visit(file); }
  for (const name of fs.readdirSync(source.root)) if (managed(name)) { const stat = fs.lstatSync(path.join(source.root, name)); assert(stat.isFile() && !stat.isSymbolicLink(), 'Root config must be a regular file'); actual.push(name); }
  for (const name of required.filter(name => name.includes('/') && !/^(?:app\/|src\/|assets\/|tools\/current-policy\/)/.test(name))) { assert(fs.existsSync(path.join(source.root, name))); actual.push(name); }
  assert.deepEqual(actual.sort(), required, 'Untracked/missing runtime/adapter files');
  for (const [name, sha] of Object.entries(originals)) assert.equal(source.source[name], sha, 'Historical producer/support changed: ' + name);
  const model = fs.readFileSync(path.join(source.root, 'src/game/model.ts'), 'utf8');
  for (const [field, expected] of [['schemaVersion', versions.world], ['engineVersion', versions.engine], ['contentVersion', versions.content]]) assert.equal(Number(new RegExp(field + ':\\s*z\\.literal\\((\\d+)\\)').exec(model)?.[1]), expected, 'Target source literal differs: ' + field);
  const repository = fs.readFileSync(path.join(source.root, 'src/persistence/repository.ts'), 'utf8');
  assert.equal(Number(/version\.user_version > (\d+)/.exec(repository)?.[1]), versions.database, 'Target database reader differs');
  assert([...repository.matchAll(/PRAGMA user_version = (\d+)/g)].length > 0);
  for (const match of repository.matchAll(/PRAGMA user_version = (\d+)/g)) assert.equal(Number(match[1]), versions.database, 'Target reader writes differ');
  assert.equal(fs.realpathSync(__filename), path.join(fs.realpathSync(source.root), 'tools/current-policy/source.cjs'), 'Execute adapters from the registered final source tree');
  return { registration, registrationPin, source, git, provenance: { registration: registrationPin, sourceSnapshot: registration.sourceSnapshot, commit: source.commit, versions, sourceFiles: Object.keys(source.source).length, originalProducerHashes: originals } };
}
function recheck(verified) { assert.deepEqual(verifySource(verified.registrationPin.file).provenance, verified.provenance, 'Source/registration changed'); }
function optionsFor(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index++) { const flag = argv[index]; assert(['--registration', '--country', '--all', '--max-years', '--output', '--manifest-only'].includes(flag) && !Object.hasOwn(values, flag), 'Unknown/repeated option'); values[flag] = ['--all', '--manifest-only'].includes(flag) ? true : argv[++index]; assert(values[flag] && !String(values[flag]).startsWith('--'), 'Missing option value'); }
  assert(values['--registration'], 'Explicit coordinator registration required'); assert(!(values['--all'] && values['--country']));
  const maxYears = Number(values['--max-years'] ?? 150); assert(Number.isInteger(maxYears) && maxYears >= 1 && maxYears <= 150);
  assert(!values['--country'] || countries.includes(values['--country']));
  if (!values['--manifest-only']) assert((values['--all'] || values['--country']) && values['--output'], 'Select country/all and explicit new output');
  return { registration: path.resolve(values['--registration']), country: values['--country'], all: !!values['--all'], maxYears, output: values['--output'] && path.resolve(values['--output']), manifestOnly: !!values['--manifest-only'] };
}
function prepare(argv, adapter, runnerFile) {
  const options = optionsFor(argv), verified = verifySource(options.registration), root = verified.source.root;
  assert.equal(fs.realpathSync(runnerFile), path.join(fs.realpathSync(root), 'tools/current-policy', path.basename(runnerFile)), 'Execute registered adapter bytes');
  const assignments = countries.map((country, index) => ({ country, seed: 900 + index })).filter(row => !options.country || row.country === options.country);
  const manifest = { format: 'dreams-current-policy-inputs-v1', adapter, source: verified.provenance, versions, maxYears: options.maxYears, assignments, additionalAnnualSeeds: 0, cohortRun: false };
  if (options.manifestOnly) return { options, verified, manifest };
  assert.equal(verified.registration.cohortRunAuthorized, true, 'Coordinator has not authorized a real policy run');
  const canonicalOutput = path.join(fs.realpathSync(path.dirname(options.output)), path.basename(options.output)), canonicalRoot = fs.realpathSync(root);
  assert(canonicalOutput === options.output, 'Evidence parent must be an explicit canonical real directory');
  assert(canonicalOutput !== canonicalRoot && !canonicalOutput.startsWith(canonicalRoot + path.sep), 'Keep evidence outside source');
  assert(!fs.existsSync(options.output) || fs.lstatSync(options.output).isDirectory() && !fs.lstatSync(options.output).isSymbolicLink() && fs.readdirSync(options.output).length === 0, 'Use an empty real output directory');
  return { options, verified, manifest };
}
function loadRuntime(verified) {
  recheck(verified); const root = verified.source.root, request = createRequire(path.join(root, 'package.json')), lock = request('./package-lock.json');
  const ts = request('typescript'), zustand = request('zustand/package.json');
  assert.equal(ts.version, lock.packages?.['node_modules/typescript']?.version); assert.equal(zustand.version, lock.packages?.['node_modules/zustand']?.version);
  const allowed = file => file.startsWith(path.join(root, 'src') + path.sep) || file.startsWith(path.join(root, 'tests/support') + path.sep);
  assert(!Object.keys(require.cache).some(file => allowed(file) && file.endsWith('.ts')), 'Refuse stale/preloaded TS runtime');
  const previous = require.extensions['.ts'], loaded = new Map();
  require.extensions['.ts'] = (module, file) => {
    const relative = path.relative(root, file).split(path.sep).join('/'); assert(allowed(file) && Object.hasOwn(verified.source.source, relative), 'Unpinned TS import: ' + file);
    const bytes = fs.readFileSync(file); assert.equal(hash(bytes), verified.source.source[relative], 'TS changed before compile: ' + relative); loaded.set(relative, hash(bytes));
    module._compile(ts.transpileModule(bytes.toString(), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, file);
  };
  const close = () => { if (previous) require.extensions['.ts'] = previous; else delete require.extensions['.ts']; for (const file of Object.keys(require.cache)) if (allowed(file) && file.endsWith('.ts')) delete require.cache[file]; };
  return { load: relative => { assert(!path.isAbsolute(relative) && !relative.split('/').includes('..') && Object.hasOwn(verified.source.source, relative)); return request('./' + relative); }, close, provenance: () => ({ node: process.version, typescript: ts.version, zustand: zustand.version, loadedSource: Object.fromEntries([...loaded].sort()), dependencyScope: 'Installed versions checked against pinned lock; installed dependency bytes are not an independent reproducible-build proof.' }) };
}
module.exports = { fs, path, assert, versions, countries, originals, hash, json, pin, checkedFile, verifySource, recheck, optionsFor, prepare, loadRuntime };
