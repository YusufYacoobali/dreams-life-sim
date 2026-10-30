// Derive an explicit opt-in workload from existing published natural lives.
// No dates, people, balances, outcomes, historical payloads or RNG are patched.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { gunzipSync } = require('node:zlib');
const { createHash } = require('node:crypto');
const ts = require('typescript');
const flags = {};
for (let index = 2; index < process.argv.length; index += 2) flags[process.argv[index]] = process.argv[index + 1];
const source = path.resolve(flags['--source'] ?? path.join(__dirname, '..'));
const input = path.resolve(flags['--input'] ?? path.join(__dirname, '../docs/verification/final-polish/performance-core/workloads.json.gz'));
const output = flags['--output'];
if (!output) throw new Error('Pass --output with a derived workload path');
const organised = flags['--organised'] === 'yes';
const sha = value => createHash('sha256').update(value).digest('hex');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
const { encodeWorld, moneyJSON } = require(path.join(source, 'src/game/model.ts'));
const { enableOverhaul } = require(path.join(source, 'src/game/systems/overhaul.ts'));
const { packCheckpoint, unpackCheckpoint } = require(path.join(source, 'src/persistence/checkpoints.ts'));
const { resolveCommand } = organised ? require(path.join(source, 'src/game/engine.ts')) : {};
const { choiceUnavailable } = organised ? require(path.join(source, 'src/game/choiceAvailability.ts')) : {};
const bytes = fs.readFileSync(input);
const fixture = JSON.parse((input.endsWith('.gz') ? gunzipSync(bytes) : bytes).toString('utf8'));
if (organised) fixture.snapshots = fixture.snapshots.filter(snapshot => [50, 70, 90].includes(snapshot.summary.age));
for (const snapshot of fixture.snapshots) {
  let world = unpackCheckpoint(snapshot.payload);
  const original = JSON.parse(encodeWorld(world));
  enableOverhaul(world);
  let encoded = encodeWorld(world);
  assert.deepEqual(JSON.parse(encoded), { ...original, overhaulVersion: 1, prisonLives: [], affairs: [], romanceOffers: [] });
  if (organised) {
    const preparationCommands = [];
    const act = command => {
      world = resolveCommand(world, command, true);
      preparationCommands.push(command);
    };
    const finish = () => {
      let guard = 0;
      while (world.pending && guard++ < 12) {
        if (world.pending.kind === 'result') act({ type: 'acknowledge', resultId: world.pending.id });
        else {
          assert.equal(world.pending.templateId, 'arrest', 'Unexpected preparatory decision');
          const bail = world.pending.choices.find(choice => choice.id === 'bail');
          assert(bail && !choiceUnavailable(world, bail), 'The actual saved life cannot afford bail; no funds will be patched');
          act({ type: 'choose', eventId: world.pending.id, choiceId: bail.id });
        }
      }
      assert(guard < 12 && !world.pending && !world.annual);
    };
    act({ type: 'organised-join', style: 'street-syndicate' }); finish();
    const gangId = world.gangs.find(gang => gang.personId === world.activePersonId && gang.organised && !gang.left).id;
    for (let attempt = 0; attempt < 2; attempt++) {
      act({ type: 'organised-mission', gangId, mission: 'missing-envelope', approach: 'cautious' }); finish();
    }
    assert.deepEqual(world.date, original.date, 'Preparation must not rewrite or advance dates');
    const jobs = world.gangs.find(gang => gang.id === gangId).organised.jobs;
    assert.equal(jobs.length, 2);
    for (const job of jobs) {
      const incident = world.incidents.find(row => row.id === job.incidentId);
      assert.equal(incident.gain.minor, job.proceeds);
      if (job.transactionId) assert.equal(world.ledger.find(row => row.id === job.transactionId).cashDelta, job.proceeds);
    }
    snapshot.preparationCommands = preparationCommands;
    snapshot.activeOrganisation = { gangId, jobs: jobs.length, members: world.gangs.find(gang => gang.id === gangId).organised.members.length, playerCases: world.cases.filter(row => row.personId === world.activePersonId).length };
    snapshot.preparationOutcome = {
      actorId: world.activePersonId, date: world.date, random: world.random,
      accounts: world.accounts.filter(row => row.ownerId === world.activePersonId).map(({ id, currency, cash, openingCash }) => ({ id, currency, cash, openingCash })),
      organisation: world.gangs.find(gang => gang.id === gangId),
      incidents: world.incidents.filter(row => row.personId === world.activePersonId),
      cases: world.cases.filter(row => row.personId === world.activePersonId),
      newLedgerRows: world.ledger.slice(original.ledger.length),
    };
    snapshot.summary.people = Object.keys(world.people).length;
    snapshot.summary.ledgerRows = world.ledger.length;
    snapshot.summary.journalRows = world.journal.length;
    snapshot.summary.revision = world.revision;
    encoded = encodeWorld(world);
  }
  snapshot.summary.originSha256 = snapshot.summary.sha256;
  snapshot.summary.sha256 = sha(encoded);
  snapshot.payload = packCheckpoint(world);
}
fixture.scope = organised
  ? 'Existing published age50/70/90 natural-life workloads, explicit capability and actual recorded join/two cautious assignment commands, including real affordable bail if arrested. Preparation command traces retained. No funds, dates, people, outcomes or random streams are patched.'
  : 'Existing published natural-life workloads with only explicit overhaul capability and empty prospective histories added. No command, money, date, person, old outcome or random stream is changed.';
fixture.originInputSha256 = sha(bytes);
fs.writeFileSync(output, JSON.stringify(fixture, moneyJSON));
if (flags['--proof']) fs.writeFileSync(flags['--proof'], JSON.stringify({ scope: fixture.scope, originInputSha256: fixture.originInputSha256, snapshots: fixture.snapshots.map(({ payload, ...snapshot }) => snapshot) }, moneyJSON, 2) + '\n');
process.stdout.write(JSON.stringify({ output, snapshots: fixture.snapshots.length, originInputSha256: fixture.originInputSha256, outputSha256: sha(fs.readFileSync(output)) }) + '\n');
