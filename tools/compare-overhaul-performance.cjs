// Compare the same saved large-life workloads and retain exact outcome checks.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const flags = {};
for (let index = 2; index < process.argv.length; index += 2) flags[process.argv[index]] = process.argv[index + 1];
for (const flag of ['--before', '--after', '--opt-in', '--output']) if (!flags[flag]) throw new Error('Required flag: ' + flag);
const read = flag => JSON.parse(fs.readFileSync(flags[flag], 'utf8'));
const before = read('--before'), after = read('--after'), optIn = read('--opt-in');
assert.equal(before.node, after.node);
assert.equal(before.node, optIn.node);
assert.equal(before.samples, after.samples);
assert.equal(before.samples, optIn.samples);
assert.equal(before.inputFileSha256, after.inputFileSha256);
const key = row => row.age + ':' + row.kind;
const baseline = new Map(before.results.map(row => [key(row), row]));
assert.equal(baseline.size, before.results.length);
assert.equal(after.results.length, baseline.size);
assert.equal(optIn.results.length, baseline.size);
const optInByKey = new Map(optIn.results.map(row => [key(row), row]));
const rows = after.results.map(row => {
  const original = baseline.get(key(row)), enabled = optInByKey.get(key(row));
  assert(original && enabled, 'Unmatched workload: ' + key(row));
  assert.equal(original.inputSha256, row.inputSha256);
  assert.deepEqual(original.commands, row.commands, 'A legacy workload changed its command policy');
  assert.deepEqual(original.outcome, row.outcome, 'A legacy workload changed its saved outcome');
  const baselineMs = original.timingsMs.totalMs.median;
  return {
    age: row.age, kind: row.kind,
    people: original.inputSummary.people, ledgerRows: original.inputSummary.ledgerRows, journalRows: original.inputSummary.journalRows,
    beforeMedianMs: baselineMs, legacyMedianMs: row.timingsMs.totalMs.median, enabledMedianMs: enabled.timingsMs.totalMs.median,
    legacyRatio: row.timingsMs.totalMs.median / baselineMs,
    enabledRatio: enabled.timingsMs.totalMs.median / baselineMs,
    beforeP95Ms: original.timingsMs.totalMs.p95, legacyP95Ms: row.timingsMs.totalMs.p95, enabledP95Ms: enabled.timingsMs.totalMs.p95,
    exactLegacyOutcome: true,
    enabledCommands: enabled.commands.length,
  };
});
const report = {
  scope: 'Cloud Node/on-disk SQLite synchronous command spans; one warm-up and fixed saved-world samples. Exact legacy inputs, commands and complete outcome hashes match. Opt-in workloads add only empty prospective capability before command execution. No device, React or native frame claim.',
  node: before.node, samples: before.samples,
  baselineSourceHash: before.sourceHash, integratedSourceHash: after.sourceHash,
  inputFileSha256: before.inputFileSha256, enabledInputFileSha256: optIn.inputFileSha256,
  concurrency: 'Run all three measurements sequentially after regression, export, typecheck and soak workers have stopped.',
  rows,
};
fs.writeFileSync(flags['--output'], JSON.stringify(report, null, 2) + '\n');
process.stdout.write(JSON.stringify({ output: flags['--output'], workloads: rows.length, exactLegacyOutcomes: rows.every(row => row.exactLegacyOutcome), largestLegacyRatio: Math.max(...rows.map(row => row.legacyRatio)), largestEnabledRatio: Math.max(...rows.map(row => row.enabledRatio)) }) + '\n');
