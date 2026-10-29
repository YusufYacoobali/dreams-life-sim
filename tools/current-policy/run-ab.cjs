const h = require('./source.cjs');
const canonicalTagged = value => typeof value === 'bigint' ? { $dreamsBigInt: value.toString() } : Array.isArray(value) ? value.map(canonicalTagged) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalTagged(value[key])])) : value;
async function main(kind, argv, runnerFile) {
  const adapter = kind === 'A' ? 'professional-v3' : 'criminal-v2-current-registration-v1';
  const ready = h.prepare(argv, adapter, runnerFile);
  if (ready.options.manifestOnly) { h.recheck(ready.verified); process.stdout.write(h.json(ready.manifest) + '\n'); return; }
  const runtime = h.loadRuntime(ready.verified), started = Date.now(), records = [];
  const scope = kind === 'A'
    ? 'Current professional policyv3: original v2 decision rules/order preserved except actual free saved university application, ordinary waitlist review and separate real offered-place funding. Fixed reused country seeds900..911. Actual in-memory SQLite/store StartLife+birth acknowledgement only, then immutable pure-engine commands and exact full production-codec comparisons. Outcomes/omissions may differ; no hidden roll, date/stat/cash/world preparation or success search. Not full-life SQLite/native/physical/all-choice/multigeneration acceptance.'
    : 'Current-source registration wrapper around unchanged criminal policyv2. Same fixed reused country seeds900..911; original withdrawal/offence/not-guilty/custody/release decisions and all refused/unreached outcomes retained. Actual in-memory SQLite/store birth only, then immutable pure-engine commands/full production checkpoints. Not full-life SQLite/native/physical/seizure/multigeneration or universally completed Scenario B.';
  let active = null, lastWorld = null, trace = [], encodeWorld;
  const write = (name, value) => h.fs.writeFileSync(h.path.join(ready.options.output, name), h.json(value) + '\n', { flag: 'wx' });
  try {
    ({ encodeWorld } = runtime.load('src/game/model.ts'));
    h.assert.deepEqual(runtime.load('src/game/countries.ts').countryCodes, h.countries, 'Frozen country/seed registration changed');
    const { packCheckpoint } = runtime.load('src/persistence/checkpoints.ts');
    const policy = runtime.load(kind === 'A' ? 'tests/support/professionalPolicyV3.ts' : 'tests/support/criminalPolicy.ts');
    const create = kind === 'A' ? policy.createProfessionalLife : policy.createCriminalLife;
    const run = kind === 'A' ? policy.runProfessionalPolicy : policy.runCriminalPolicy;
    h.recheck(ready.verified); h.fs.mkdirSync(ready.options.output, { recursive: true }); write('manifest.json', { ...ready.manifest, scope, runtime: runtime.provenance() });
    for (const assignment of ready.manifest.assignments) {
      active = assignment; trace = []; const began = Date.now(), initial = await create(assignment.country, assignment.seed); lastWorld = initial;
      h.assert.deepEqual({ world: initial.schemaVersion, engine: initial.engineVersion, content: initial.contentVersion }, { world: h.versions.world, engine: h.versions.engine, content: h.versions.content });
      const result = run(initial, { maxYears: ready.options.maxYears, onStep: (current, commands) => { lastWorld = current; trace = commands; } });
      const { world, report } = result; h.assert.equal(report.policyVersion, kind === 'A' ? 3 : 2); h.assert.equal(result.trace.length, report.commandsAttempted);
      h.assert.equal(report.commandsCommitted, world.revision - initial.revision); h.assert(report.commandsCommitted <= report.commandsAttempted);
      if (ready.options.maxYears === 150) h.assert(report.naturallyDied, 'Full policy must end through actual natural death');
      const row = { seed: assignment.seed, ...report, adapter, traceSha256: h.hash(JSON.stringify(canonicalTagged(result.trace))), traceEncoding: 'recursive key-sorted JSON with tagged $dreamsBigInt values', finalWorldSha256: h.hash(encodeWorld(world)), elapsedMs: Date.now() - began };
      write(assignment.country + '-result.json', row); write(assignment.country + '-commands.json', canonicalTagged(result.trace));
      h.fs.writeFileSync(h.path.join(ready.options.output, assignment.country + '-final.checkpoint.json'), packCheckpoint(world), { flag: 'wx' });
      records.push(row); h.recheck(ready.verified);
      process.stderr.write(h.json({ event: 'current-policy-life-complete', country: assignment.country, seed: assignment.seed, naturallyDied: report.naturallyDied, ageAtEnd: report.ageAtEnd, versions: report.versions, traceSha256: row.traceSha256, reached: Object.entries(report.milestones).filter(([, item]) => item.status === 'reached').map(([name]) => name), unreached: Object.entries(report.milestones).filter(([, item]) => item.status !== 'reached').map(([name]) => name) }) + '\n');
    }
    h.recheck(ready.verified);
    const result = { format: 'dreams-current-' + kind.toLowerCase() + '-policy-v1', adapter, policyVersion: kind === 'A' ? 3 : 2, scope, sources: ready.verified.provenance, runtime: runtime.provenance(), versions: h.versions, assignments: ready.manifest.assignments, additionalAnnualSeeds: 0, scenarioA: kind === 'A' ? { everyRequestedMilestoneReachedInEveryObservedLife: records.every(row => row.everyRequestedMilestoneReached) } : 'unrun by this policy', scenarioB: kind === 'B' ? { scenarioBComplete: false } : 'unrun by this policy', scenarioC: 'unrun by this policy', elapsedMs: Date.now() - started, records };
    write('result.json', result); process.stdout.write(h.json(result) + '\n'); return result;
  } catch (error) {
    if (h.fs.existsSync(ready.options.output)) write('failure.json', { adapter, scope, sources: ready.verified.provenance, active, completed: records.length, error: String(error.stack ?? error), trace, lastValidWorld: lastWorld && encodeWorld ? encodeWorld(lastWorld) : null });
    throw error;
  } finally { runtime.close(); }
}
module.exports = { main, canonicalTagged };
