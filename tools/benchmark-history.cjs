// Cloud diagnostic only: these timings do not establish native-device performance.
const fs = require('node:fs'), path = require('node:path'), ts = require('typescript'), { performance } = require('node:perf_hooks');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
const root = path.join(__dirname, '../src/'), { createLife, randomCreation } = require(root + 'game/createLife.ts'), { resolveCommand } = require(root + 'game/engine.ts'), { ageOn, encodeWorld } = require(root + 'game/model.ts'), { packCheckpoint, unpackCheckpoint } = require(root + 'persistence/checkpoints.ts');
const { choiceUnavailable } = require(root + 'game/choiceAvailability.ts');
let world = { ...createLife('life_benchmark', 42, randomCreation(42), { year: 2026, month: 10, day: 18 }), birthAcknowledged: true };
const advances = [], packs = [], restores = []; let bytes = 0, peak = 0, maxCheckpoint = 0, years = 0;
while (!world.people[world.activePersonId].died && years < 150) {
  let time = performance.now(); const checkpoint = packCheckpoint(world); packs.push(performance.now() - time); bytes += checkpoint.length; maxCheckpoint = Math.max(maxCheckpoint, checkpoint.length); peak = Math.max(peak, encodeWorld(world).length);
  time = performance.now(); unpackCheckpoint(checkpoint); restores.push(performance.now() - time);
  time = performance.now(); world = resolveCommand(world, { type: 'advance' }); advances.push(performance.now() - time);
  let guard = 0;
  while ((world.pending || world.annual) && guard++ < 100) {
    if (world.pending?.kind === 'decision') {
      const choice = world.pending.choices.find(item => !choiceUnavailable(world, item));
      if (!choice) throw new Error('No available choice in ' + world.pending.templateId);
      world = resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: choice.id });
    } else if (world.pending) world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
    else world = resolveCommand(world, { type: 'resume' });
  }
  if (world.pending || world.annual) throw new Error('Annual progression did not close');
  years++;
}
const percentile = (values, p) => [...values].sort((a, b) => a - b)[Math.floor((values.length - 1) * p)];
process.stdout.write(JSON.stringify({ environment: 'cloud Node 24, not native', years, ageAtDeath: ageOn(world.people[world.activePersonId], world.date), people: Object.keys(world.people).length, ledgerRows: world.ledger.length, peakWorldBytes: peak, historyBytes: bytes, conservative120LateCheckpointsBytes: maxCheckpoint * 120, advanceP95Ms: percentile(advances, .95), packP95Ms: percentile(packs, .95), restoreP95Ms: percentile(restores, .95) }, null, 2) + '\n');
