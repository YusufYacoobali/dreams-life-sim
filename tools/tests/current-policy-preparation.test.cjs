// Authored for later coordinator-authorized synthetic checks; no real runtime.
const { test } = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const h = require('../current-policy/source.cjs');
const runners = [require('../current-policy/run-professional-v3.cjs'), require('../current-policy/run-criminal-v2.cjs'), require('../current-policy/run-entrepreneur-v3.cjs'), require('../current-policy/run-editorial-v2.cjs')];
const temporary = action => { const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dreams-current-policy-synthetic-')); try { return action(root); } finally { fs.rmSync(root, { recursive: true, force: true }); } };
test('selection is explicit, bounded, and cannot add another seed range', () => {
  assert.throws(() => h.optionsFor([]), /registration/);
  for (const suffix of [['--seed-base', '100'], ['--country', 'US', '--all'], ['--country', 'XX'], ['--max-years', '151'], ['--max-years', '0'], ['--registration', '/tmp/repeated']]) assert.throws(() => h.optionsFor(['--registration', '/tmp/pending', ...suffix]));
  assert.equal(h.optionsFor(['--registration', '/tmp/pending', '--country', 'US', '--output', '/tmp/new-evidence']).maxYears, 150);
  assert.deepEqual(h.countries.map((country, index) => ({ country, seed: 900 + index })), [{ country: 'US', seed: 900 }, { country: 'CA', seed: 901 }, { country: 'GB', seed: 902 }, { country: 'AU', seed: 903 }, { country: 'FR', seed: 904 }, { country: 'DE', seed: 905 }, { country: 'ES', seed: 906 }, { country: 'IT', seed: 907 }, { country: 'BR', seed: 908 }, { country: 'IN', seed: 909 }, { country: 'JP', seed: 910 }, { country: 'ZA', seed: 911 }]);
});
for (const [index, runner] of runners.entries()) test('pending source rejects adapter' + index + ' before TS/SQLite/output', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dreams-current-policy-pending-')), registration = path.join(directory, 'pending.json'), output = path.join(directory, 'never-created');
  fs.copyFileSync(path.join(__dirname, '../current-policy/registration.pending.json'), registration);
  const previous = require.extensions['.ts']; let tsLoads = 0;
  require.extensions['.ts'] = () => { tsLoads++; throw new Error('A pending manifest loaded TypeScript'); };
  try { await assert.rejects(runner.main(['--registration', registration, '--country', 'US', '--output', output]), /Pending registration/); assert.equal(tsLoads, 0); assert.equal(fs.existsSync(output), false); }
  finally { if (previous) require.extensions['.ts'] = previous; else delete require.extensions['.ts']; fs.rmSync(directory, { recursive: true, force: true }); }
});
test('wrong registration versions fail before a source snapshot is read', () => temporary(directory => {
  const file = path.join(directory, 'wrong-version.json'); fs.writeFileSync(file, JSON.stringify({ format: 'dreams-current-policy-registration-v1', complete: true, versions: { ...h.versions, world: 37 }, sourceSnapshot: { file: '/must-not-be-read', bytes: 0, sha256: '0'.repeat(64) } }));
  assert.throws(() => h.verifySource(file), assert.AssertionError);
}));
test('changed snapshot hash fails before Git/runtime and cannot be treated as a successful preflight', () => temporary(directory => {
  const snapshot = path.join(directory, 'snapshot.json'), file = path.join(directory, 'registration.json'); fs.writeFileSync(snapshot, '{}');
  const proof = h.pin(snapshot); fs.writeFileSync(snapshot, '{"changed":true}');
  fs.writeFileSync(file, JSON.stringify({ format: 'dreams-current-policy-registration-v1', complete: true, versions: h.versions, sourceSnapshot: proof }));
  assert.throws(() => h.verifySource(file), /bytes\/hash changed/);
}));
test('historical incomplete Git proof fails closed even with a target-version snapshot', () => temporary(directory => {
  const snapshot = path.join(directory, 'snapshot.json'), file = path.join(directory, 'registration.json');
  fs.writeFileSync(snapshot, JSON.stringify({ root: directory, commit: '1'.repeat(40), versions: h.versions, source: {} }));
  fs.writeFileSync(file, JSON.stringify({ format: 'dreams-current-policy-registration-v1', complete: true, commit: '1'.repeat(40), versions: h.versions, sourceSnapshot: h.pin(snapshot), git: {} }));
  assert.throws(() => h.verifySource(file), /Git head: complete absolute file proof required/);
}));
const emptySource = root => { for (const directory of ['app', 'src', 'assets', 'tools/current-policy', 'tests/support']) fs.mkdirSync(path.join(root, directory), { recursive: true }); };
test('an untracked sqlite.js cannot shadow the pinned extensionless support import', () => temporary(directory => {
  emptySource(directory); fs.writeFileSync(path.join(directory, 'tests/support/sqlite.js'), 'throw new Error("shadow module must never load");\n');
  assert.throws(() => h.assertInventory(directory, []), /Untracked\/missing runtime\/adapter\/support files/);
}));
test('unlisted support file and directory symlinks are refused without following them', () => temporary(directory => {
  emptySource(directory); const target = path.join(directory, 'outside.js'); fs.writeFileSync(target, 'throw new Error("must never load");\n');
  const link = path.join(directory, 'tests/support/shadow.js'); fs.symlinkSync(target, link);
  assert.throws(() => h.assertInventory(directory, []), /Unlisted source symlink/); fs.unlinkSync(link);
  fs.symlinkSync(directory, path.join(directory, 'tests/support/linked-directory'), 'dir');
  assert.throws(() => h.assertInventory(directory, []), /Unlisted source symlink/);
}));
test('a changed tracked support file fails its actual byte proof before compilation', () => temporary(directory => {
  emptySource(directory); const name = 'tests/support/sqlite.ts', file = path.join(directory, name), bytes = Buffer.from('export const sentinel = true;\n'); fs.writeFileSync(file, bytes);
  const entry = { mode: '100644', oid: require('node:crypto').createHash('sha1').update(Buffer.from('blob ' + bytes.length + '\0')).update(bytes).digest('hex') };
  fs.writeFileSync(file, 'export const sentinel = false;\n');
  assert.throws(() => h.checkedSourceFile(directory, name, h.hash(bytes), entry), /Source SHA differs/);
}));
test('preloaded JS, CJS, JSON and TS support/source caches are all refused', () => temporary(directory => {
  for (const name of ['tests/support/sqlite.js', 'tests/support/helper.cjs', 'tests/support/data.json', 'src/game/model.ts']) assert.throws(() => h.assertNoSourceCache(directory, { [path.join(directory, name)]: {} }), /Refuse stale\/preloaded source\/support/);
}));
