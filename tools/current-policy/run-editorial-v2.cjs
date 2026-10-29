// Adapterv2, unchanged editorial committed-ordinal decision-policyv1.
const h = require('./source.cjs');
const scope = 'Current C39 editorial adapterv2 with unchanged ordinal decision-policyv1. Same twelve reused country seeds900..911. Real in-memory SQLite/store StartLife+birth acknowledgement ONLY; all subsequent play uses immutable pure-engine advance/resume/choose/acknowledge commands and exact whole production-codec comparisons. Select eligible choices[committedDecisionOrdinal % eligible.length] in actual saved order. No future-roll inspection, manual context/state preparation, outcome search or all-catalogue/all-branch/native/full-life SQLite claim. Current source/catalogue/observed/unreached contexts retain their own hashes; old C35 evidence remains unchanged.';
async function main(argv = process.argv.slice(2)) {
  const ready = h.prepare(argv, 'editorial-adapter-v2-decision-policy-v1', __filename);
  if (ready.options.manifestOnly) { h.recheck(ready.verified); process.stdout.write(h.json(ready.manifest) + '\n'); return; }
  const loader = h.loadRuntime(ready.verified), started = Date.now(), completed = [];
  let active = null, lastWorld = null, runtime;
  const write = (name, value) => h.fs.writeFileSync(h.path.join(ready.options.output, name), h.json(value) + '\n', { flag: 'wx' });
  try {
    const load = loader.load;
    const birth = { ...load('src/state/gameStore.ts'), ...load('src/persistence/repository.ts'), ...load('src/game/createLife.ts'), ...load('src/game/countries.ts'), ...load('tests/support/sqlite.ts') };
    h.assert.deepEqual(birth.countryCodes, h.countries, 'Frozen country/seed registration changed');
    runtime = { ...load('src/game/engine.ts'), ...load('src/game/model.ts'), ...load('src/persistence/checkpoints.ts'), ...load('src/game/choiceAvailability.ts'), ...load('src/game/content/events.ts') };
    const { editorialJson, createEditorialLife, runEditorialPolicy, editorialPolicyVersion } = load('tests/support/editorialPolicy.ts');
    h.assert.equal(editorialPolicyVersion, 1, 'Original ordinal decision policy stays unchanged');
    const manifest = { ...ready.manifest, decisionPolicyVersion: editorialPolicyVersion, scope, catalogue: { situations: runtime.eventTemplates.length, branches: runtime.eventTemplates.reduce((sum, item) => sum + item.choices.length, 0) } };
    h.recheck(ready.verified); h.fs.mkdirSync(ready.options.output, { recursive: true }); write('manifest.json', { ...manifest, runtime: loader.provenance() });
    write('catalogue.json', { source: ready.verified.provenance, templates: runtime.eventTemplates });
    for (const assignment of ready.manifest.assignments) {
      active = assignment; const directory = h.path.join(ready.options.output, assignment.country); h.fs.mkdirSync(directory);
      const initial = await createEditorialLife(birth, assignment.country, assignment.seed); lastWorld = initial.world;
      h.assert.deepEqual({ world: initial.world.schemaVersion, engine: initial.world.engineVersion, content: initial.world.contentVersion }, { world: h.versions.world, engine: h.versions.engine, content: h.versions.content });
      const localWrite = (name, value) => h.fs.writeFileSync(h.path.join(directory, name), editorialJson(value) + '\n', { flag: 'wx' });
      localWrite('birth.json', { mode: 'SQLite store birth only', worldId: initial.world.id, activePersonId: initial.world.activePersonId, storeCommands: ['startLife', 'acknowledgeBirth'], ...initial, world: undefined, worldSha256: h.hash(runtime.encodeWorld(initial.world)) });
      h.fs.writeFileSync(h.path.join(directory, 'birth.checkpoint.json'), runtime.packCheckpoint(initial.world), { flag: 'wx' });
      const result = runEditorialPolicy(initial.world, runtime, { maxYears: ready.options.maxYears,
        onCommand: (record, world) => { lastWorld = world; h.fs.appendFileSync(h.path.join(directory, 'commands.ndjson'), editorialJson(record) + '\n'); },
        onDecision: record => h.fs.appendFileSync(h.path.join(directory, 'decisions.ndjson'), editorialJson(record) + '\n'),
        onCold: proof => h.fs.appendFileSync(h.path.join(directory, 'cold.ndjson'), editorialJson(proof) + '\n'),
      });
      lastWorld = result.world; h.assert.equal(result.report.commandsCommitted, result.world.revision - initial.world.revision);
      h.assert.equal(h.hash(h.fs.readFileSync(h.path.join(directory, 'commands.ndjson'))), result.report.traceSha256, 'Raw commands retain exact original ordinal-policy trace encoding');
      if (ready.options.maxYears === 150) h.assert(result.report.naturallyDied, 'Default cohort must actually reach natural death');
      h.recheck(ready.verified);
      localWrite('result.json', { ...assignment, source: ready.verified.provenance, scope, adapterVersion: 2, ...result.report });
      h.fs.writeFileSync(h.path.join(directory, 'final.checkpoint.json'), runtime.packCheckpoint(result.world), { flag: 'wx' });
      const summary = { ...assignment, ageAtEnd: result.report.ageAtEnd, naturallyDied: result.report.naturallyDied, catalogueDecisions: result.report.catalogueDecisions, systemOrCallbackDecisions: result.report.systemOrCallbackDecisions, observedCatalogueIds: result.report.observedCatalogueIds, unseenCatalogueIds: result.report.unseenCatalogueIds, unchosenCatalogueBranches: result.report.unchosenCatalogueBranches, traceSha256: result.report.traceSha256, finalWorldSha256: result.report.finalWorldSha256 };
      completed.push(summary); process.stderr.write(editorialJson({ event: 'current-editorial-life-complete', ...summary, unseenCatalogueIds: summary.unseenCatalogueIds.length, unchosenCatalogueBranches: summary.unchosenCatalogueBranches.length }) + '\n');
    }
    h.recheck(ready.verified);
    const aggregate = { format: 'dreams-current-editorial-adapter-v2', adapterVersion: 2, decisionPolicyVersion: editorialPolicyVersion, scope, source: ready.verified.provenance, runtime: loader.provenance(), versions: h.versions, catalogue: manifest.catalogue, assignments: ready.manifest.assignments, completedLives: completed.length, additionalAnnualSeeds: 0, allCurrentCatalogueNaturalCoverageClaimed: false, fullScenarioAcceptance: false, elapsedMs: Date.now() - started, records: completed };
    write('result.json', aggregate); process.stdout.write(h.json(aggregate) + '\n'); return aggregate;
  } catch (error) {
    let checkpoint = null, checkpointError = null;
    if (h.fs.existsSync(ready.options.output)) {
      try { if (lastWorld) { checkpoint = h.path.join(ready.options.output, 'failure-last-valid.checkpoint.json'); h.fs.writeFileSync(checkpoint, runtime.packCheckpoint(lastWorld), { flag: 'wx' }); } } catch (failure) { checkpointError = String(failure.stack ?? failure); }
      write('failure.json', { scope, source: ready.verified.provenance, active, completed, error: String(error.stack ?? error), lastValidCheckpoint: checkpoint, checkpointError });
    }
    throw error;
  } finally { loader.close(); }
}
if (require.main === module) main().catch(error => { process.stderr.write(String(error.stack ?? error) + '\n'); process.exitCode = 1; });
module.exports = { main, scope };
