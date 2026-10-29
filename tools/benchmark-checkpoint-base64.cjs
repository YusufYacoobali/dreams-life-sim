// Isolated cloud diagnostic; this is not a native or full-checkpoint restore timing.
const fs = require('node:fs'), assert = require('node:assert/strict');
const { createHash } = require('node:crypto'), { performance } = require('node:perf_hooks'), ts = require('typescript');
const baselineCommit = 'd70c58e';
const compilerOptions = { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 };
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions }).outputText, file);
const candidate = require('../src/persistence/base64.ts');
if (!process.argv[2]) throw new Error('First capture git show d70c58e:src/persistence/checkpoints.ts to a file, then pass that source file path.');
const original = fs.readFileSync(process.argv[2], 'utf8'), baselineHash = createHash('sha256').update(original).digest('hex');
assert.equal(baselineHash, 'fe9447c913d65a11363e68c897cdc3ac413ce49c7f1473ee54d2e0e2df05cf07', 'Expected the exact baseline source from ' + baselineCommit);
const start = original.indexOf('function unbase64('), end = original.indexOf('function fingerprint(');
if (start < 0 || end <= start) throw new Error('Expected the original checkpoint decoder in ' + baselineCommit);
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const baseline = new Function('alphabet', ts.transpileModule(original.slice(start, end), { compilerOptions }).outputText + ';return unbase64;')(alphabet);
let state = 42;
const nextByte = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state >>> 24; };
const bytes = size => { const output = Buffer.alloc(size); for (let i = 0; i < size; i++) output[i] = nextByte(); return output; };
for (const size of [1, 2, 3, 7, 128, 1024, 1025, 1000003, 1000004, 1000005]) {
  const data = bytes(size), encoded = data.toString('base64');
  assert.equal(candidate.encodeBase64(data), encoded);
  assert.deepEqual(Buffer.from(candidate.decodeBase64(encoded)), data);
  assert.deepEqual(Buffer.from(baseline(encoded)), data);
}
for (const text of ['', 'A', '====', 'A===', '=AAA', 'AA=A', 'AAAAéAAA', 'AAAA🙂AA', 'A\nAA', 'A'.repeat(28000004)]) {
  assert.throws(() => baseline(text)); assert.throws(() => candidate.decodeBase64(text));
}
for (let trial = 0; trial < 10000; trial++) {
  let text = '', expected, actual; const chars = alphabet + '=?!é';
  for (let i = 0, size = 4 * (trial % 9 + 1); i < size; i++) text += chars[nextByte() % chars.length];
  try { expected = baseline(text); } catch { expected = null; }
  try { actual = candidate.decodeBase64(text); } catch { actual = null; }
  assert.deepEqual(actual, expected);
}
const dataBytes = 1000003, encoded = bytes(dataBytes).toString('base64'), before = [], after = [];
for (let round = 0; round < 12; round++) {
  const order = round % 2 ? [[baseline, before], [candidate.decodeBase64, after]] : [[candidate.decodeBase64, after], [baseline, before]];
  for (const [decode, samples] of order) { const time = performance.now(); decode(encoded); if (round >= 2) samples.push(performance.now() - time); }
}
const percentile = (values, p) => [...values].sort((a, b) => a - b)[Math.floor((values.length - 1) * p)];
process.stdout.write(JSON.stringify({ scope: 'isolated cloud Node base64 decode; not native/full restore', baselineCommit, baselineHash, dataBytes, encodedCharacters: encoded.length, differentialCases: 10000, samplesPerDecoder: before.length, baselineMedianMs: percentile(before, .5), candidateMedianMs: percentile(after, .5), baselineP95Ms: percentile(before, .95), candidateP95Ms: percentile(after, .95) }, null, 2) + '\n');
