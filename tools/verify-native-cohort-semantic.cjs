#!/usr/bin/env node
'use strict';

const h = require('./native-cohort-semantic-support.cjs');
async function verify(traceFile, dependencies = {}) {
  const verified = h.preflight(traceFile), loader = (dependencies.loadRuntime ?? h.loadRuntime)(verified);
  try {
    const semantic = await h.replay(verified, loader.game);
    h.assert.deepEqual(h.preflight(traceFile).ready, verified.ready, 'Source/capture proofs changed during replay');
    for (const key of ['capturesManifest', 'rawSupport', 'rawVerification']) h.checkedFile(verified.traceData[key], key);
    h.assert.deepEqual(h.proof(traceFile), verified.trace, 'Actual supplied trace changed during replay');
    return { format: 'dreams-native-cohort-semantic-replay-result-v1', cohort: verified.traceData.cohort, complete: true, status: 'supplied-command-replay-passed-not-creation-or-visual-acceptance',
      scope: 'Replay of only the coordinator-supplied already-chosen actual commands, once each, from the actual captured starting world. Complete canonical worlds/RNG/pending/annual states and actual prior-current backups must match every capture. New written current roots must already store exact cohort tags and five required arrays before migration; untouched legacy boot/first backup remains exact. Begin Life uses actual createGameStore.acknowledgeBirth with strict recording Persistence and exact birth receipt. No automatic interruption consumption, alternate outcome/choice/seed search, SQL write, native action or currency normalization. All-eight-table preservation is the separately pinned raw verifier result. Creation seed/input reconstruction and visual/device/process acceptance remain separate.',
      trace: verified.trace, captures: verified.traceData.capturesManifest, rawVerification: verified.traceData.rawVerification, rawSupport: verified.traceData.rawSupport, source: verified.ready.source,
      runtime: loader.provenance(), ...semantic, actualNativeActionsPerformed: 0, creationSeedReconstructed: false, visualAcceptance: false,
      birthPersistenceScope: 'Strict recording Persistence executes the actual store action and records its arguments; native SQLite transaction integrity is established only by the raw verifier and actual captured backup/receipt comparisons.' };
  } finally { loader.close(); }
}
async function main(argv) {
  const usage = 'node tools/verify-native-cohort-semantic.cjs --trace /ABS/COMPLETE-semantic-trace.json --output /ABS/NEW-result.json';
  if (argv.length === 1 && argv[0] === '--help') { console.log(usage); return; }
  const options = {};
  for (let index = 0; index < argv.length; index += 2) { const key = argv[index], value = argv[index + 1]; h.assert(['--trace', '--output'].includes(key) && !Object.hasOwn(options, key) && typeof value === 'string' && h.path.isAbsolute(value), usage); options[key] = value; }
  h.assert(options['--trace'] && options['--output'] && !h.fs.existsSync(options['--output']), 'Explicit complete trace and NEW output required; preserve previous evidence');
  const tools = ['native-cohort-semantic-support.cjs', 'verify-native-cohort-semantic.cjs'].map(name => h.proof(h.path.join(__dirname, name)));
  const result = await verify(options['--trace']); h.assert.deepEqual(tools.map(pin => h.proof(pin.file)), tools, 'Semantic helper bytes changed'); result.tools = tools;
  h.fs.writeFileSync(options['--output'], JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ output: h.proof(options['--output']), status: result.status, phases: result.phases.length, engineCommandsReplayed: result.engineCommandsReplayed, birthAcknowledgementsReplayed: result.birthAcknowledgementsReplayed, creationSeedReconstructed: false, actualNativeActionsPerformed: 0 }));
}
if (require.main === module) main(process.argv.slice(2)).catch(error => { console.error(error.stack ?? error); process.exitCode = 1; });
module.exports = { verify, main };
