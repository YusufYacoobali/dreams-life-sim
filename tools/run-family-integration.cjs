// Real command/SQLite integration, not native timing or an immortal fixture.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const assert = require('node:assert/strict'), { createHash } = require('node:crypto');
const { DatabaseSync } = require('node:sqlite'), ts = require('typescript');
const root = path.join(__dirname, '..'), options = {};
for (let i = 2; i < process.argv.length; i += 2) {
  const flag = process.argv[i];
  if (!['--seed', '--country', '--output'].includes(flag) || !process.argv[i + 1]) throw new Error('Use --seed 0..999 --country US --output EMPTY_DIRECTORY');
  options[flag.slice(2)] = process.argv[i + 1];
}
const seed = Number(options.seed ?? 0), country = options.country ?? 'US';
assert.ok(Number.isInteger(seed) && seed >= 0 && seed < 1000, 'Invalid seed');
const folder = options.output ? path.resolve(options.output) : fs.mkdtempSync(path.join(os.tmpdir(), 'dreams-family-'));
fs.mkdirSync(folder, { recursive: true }); assert.equal(fs.readdirSync(folder).length, 0, 'Choose an empty output directory');
const hash = value => createHash('sha256').update(value).digest('hex');
function sources() {
  const files = [], visit = dir => { for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.join(dir, entry.name); if (entry.isDirectory()) visit(file); else if (file.endsWith('.ts')) files.push(file);
  } };
  visit(path.join(root, 'src/game')); const game = [...files]; visit(path.join(root, 'src/persistence'));
  const digest = (list, base) => { const h = createHash('sha256'); for (const file of list) h.update(path.relative(base, file)).update('\0').update(fs.readFileSync(file)).update('\0'); return h.digest('hex'); };
  return { gameSourceHash: digest(game, path.join(root, 'src/game')), combinedGamePersistenceSourceHash: digest(files, root), toolSourceHash: hash(fs.readFileSync(__filename)) };
}
const originalSources = sources(), began = Date.now();
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
const { SaveRepository } = require('../src/persistence/repository.ts'), { unpackCheckpoint } = require('../src/persistence/checkpoints.ts');
const { createGameStore } = require('../src/state/gameStore.ts'), { randomCreation } = require('../src/game/createLife.ts');
const { ageOn, encodeWorld, fullName } = require('../src/game/model.ts'), { countryCodes, countries } = require('../src/game/countries.ts');
const { rules } = require('../src/game/rules.ts'), { jobs } = require('../src/game/content/jobs.ts');
const { jobReason, salaryFor } = require('../src/game/systems/work.ts'), { choiceUnavailable } = require('../src/game/choiceAvailability.ts');
const { childrenOf, adoptionFee } = require('../src/game/systems/family.ts'), { accountFor, availableCash } = require('../src/game/systems/common.ts');
const { currentWorkplace } = require('../src/game/systems/workplaceSchemas.ts'), { workFeedbackReason, workRaiseReason } = require('../src/game/systems/workplaces.ts');
const { hospitalized } = require('../src/game/systems/healthSchemas.ts');
assert.ok(countryCodes.includes(country), 'Invalid country');
const file = path.join(folder, 'dreams.db'), sqlite = new DatabaseSync(file);
sqlite.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
const session = {
  run: async (sql, values = []) => { sqlite.prepare(sql).run(...values); },
  get: async (sql, values = []) => sqlite.prepare(sql).get(...values) ?? null,
  all: async (sql, values = []) => sqlite.prepare(sql).all(...values),
};
const driver = { ...session, exec: async sql => { sqlite.exec(sql); }, transaction: async action => {
  sqlite.exec('BEGIN IMMEDIATE'); try { const value = await action(session); sqlite.exec('COMMIT'); return value; } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
} };
const repository = new SaveRepository(driver), id = 'life_family_' + country + '_' + seed;
const date = { year: 2026, month: 10, day: 20 }, input = { ...randomCreation(seed), firstName: 'Alex', lastName: 'Walker', gender: 'female', country, city: countries[country].cities[0], background: 'ordinary' };
const store = createGameStore({ repository: async () => repository, date: () => date, id: () => id });
const snapshots = new Map(), receipts = new Map(), deaths = [], coldChecks = [], observations = [];
let lastBefore, lastCommitError, commands = 0, advances = 0, maximumLiveBytes = 0, nextProgressYear = 0;
const commit = repository.commit.bind(repository);
repository.commit = async (...args) => { try { return await commit(...args); } catch (error) { lastCommitError = error.stack ?? String(error); throw error; } };
const world = () => store.getState().world, person = () => world().people[world().activePersonId];
const spanMonths = () => (world().date.year - date.year) * 12 + world().date.month - date.month;
const age = () => ageOn(person(), world().date), payload = () => sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(id).payload;
const traceFile = path.join(folder, 'commands.ndjson');
function trace(row) { fs.appendFileSync(traceFile, JSON.stringify(row, (_key, value) => typeof value === 'bigint' ? value.toString() : value) + '\n'); }
function storage() {
  const sizes = Object.fromEntries([['database', file], ['wal', file + '-wal'], ['shm', file + '-shm']].map(([key, name]) => [key, fs.existsSync(name) ? fs.statSync(name).size : 0]));
  sizes.total = sizes.database + sizes.wal + sizes.shm; maximumLiveBytes = Math.max(maximumLiveBytes, sizes.total); return sizes;
}
function rememberReceipt(commandId) {
  const row = sqlite.prepare('SELECT * FROM receipts WHERE life_id=? AND command_id=?').get(id, commandId); assert.ok(row, 'Missing actual receipt'); receipts.set(commandId, hash(JSON.stringify(row)));
}
async function dispatch(command) {
  assert.ok(commands < 20000, 'Command guard exceeded');
  const before = world(), priorPayload = command.type === 'advance' ? payload() : null;
  lastCommitError = null; const start = performance.now(), success = await store.getState().dispatch(command);
  if (!success) { assert.equal(world(), before, 'Failed command published a world'); throw new Error('Command failed: ' + JSON.stringify(command) + ': ' + store.getState().error + (lastCommitError ? '\n' + lastCommitError : '')); }
  commands++; lastBefore = before; rememberReceipt('revision:' + before.revision + ':' + command.type);
  const movedMonths = (world().date.year - before.date.year) * 12 + world().date.month - before.date.month;
  assert.ok(movedMonths >= 0 && movedMonths <= 12, 'A command rewound or skipped the calendar'); assert.equal(world().revision, before.revision + 1);
  if (command.type === 'continue-child') {
    assert.deepEqual(world().date, before.date, 'Legacy advanced time');
    assert.deepEqual(world().people[command.personId], before.people[command.personId], 'Legacy regenerated or changed the existing heir');
  }
  if (command.type === 'advance') {
    advances++;
    const row = sqlite.prepare("SELECT s.snapshot_id,s.payload,m.metadata FROM snapshots s JOIN snapshot_metadata m ON m.life_id=s.life_id AND m.snapshot_id=s.snapshot_id WHERE s.life_id=? AND json_extract(m.metadata,'$.revision')=?").get(id, before.revision);
    assert.ok(row, 'Missing actual Before Age Up'); assert.equal(row.payload, priorPayload, 'Before Age Up repacked the original payload');
    snapshots.set(row.snapshot_id, { payloadSha256: hash(row.payload), metadataSha256: hash(row.metadata), bytes: Buffer.byteLength(row.payload) });
  }
  trace({ command, revision: world().revision, activePersonId: world().activePersonId, generation: world().generation, date: world().date, age: age(), pending: world().pending?.templateId ?? world().pending?.kind ?? null, annualStage: world().annual?.stage ?? null, milliseconds: performance.now() - start, storage: storage() });
}
async function finishPending() {
  let guard = 0;
  while ((world().pending || world().annual) && !person().died && guard++ < 100) {
    const event = world().pending;
    const command = event?.kind === 'decision' ? { type: 'choose', eventId: event.id, choiceId: event.choices.find(choice => !choiceUnavailable(world(), choice))?.id }
      : event ? { type: 'acknowledge', resultId: event.id } : { type: 'resume' };
    assert.ok(command.type !== 'choose' || command.choiceId, 'No available choice'); await dispatch(command);
  }
  assert.ok(guard < 100, 'Pending/year guard exceeded');
}
async function act(command) { await dispatch(command); await finishPending(); }
function verifyHistory() {
  let count = 0;
  for (const row of sqlite.prepare('SELECT s.snapshot_id,s.payload,m.metadata FROM snapshots s JOIN snapshot_metadata m ON m.life_id=s.life_id AND m.snapshot_id=s.snapshot_id WHERE s.life_id=? ORDER BY s.snapshot_id').iterate(id)) {
    const prior = snapshots.get(row.snapshot_id); assert.ok(prior, 'Unexpected historical row'); assert.equal(hash(row.payload), prior.payloadSha256); assert.equal(hash(row.metadata), prior.metadataSha256); count++;
  }
  assert.equal(count, snapshots.size); assert.equal(count, advances);
  count = 0; for (const row of sqlite.prepare('SELECT * FROM receipts WHERE life_id=?').iterate(id)) { assert.equal(hash(JSON.stringify(row)), receipts.get(row.command_id)); count++; }
  assert.equal(count, receipts.size); assert.equal(count, world().revision);
}
async function cold(reason) {
  const expected = world(), fresh = new SaveRepository(driver), start = performance.now(), loaded = await fresh.load(id);
  assert.deepEqual(loaded, expected, 'Cold current differs');
  const backup = sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(id); assert.deepEqual(unpackCheckpoint(backup.payload), lastBefore, 'Cold backup differs');
  verifyHistory(); coldChecks.push({ reason, revision: expected.revision, generation: expected.generation, date: expected.date, worldSha256: hash(encodeWorld(expected)), milliseconds: performance.now() - start });
}
async function annualActions() {
  if (person().died) return;
  const p = person(), years = age(), rule = rules[p.country];
  if (years >= 6) {
    const routine = { ...p.health.routine, exercise: 'walking', sleep: 'restful', mindfulness: true };
    if (Object.keys(routine).some(key => routine[key] !== person().health.routine[key])) await act({ type: 'health-routine', routine });
  }
  if (person().died) return;
  if (years >= rule.retirementAge && person().employment && person().finance.serviceMonths >= 120 && person().finance.pensionAnnual === 0n) await act({ type: 'retire' });
  if (person().died) return;
  const currentRole = jobs.find(job => job.id === person().employment?.roleId);
  if (!person().finance.pensionAnnual && (!person().employment || currentRole?.partTime && person().education.stage === 'none')) {
    const roles = jobs.filter(job => !job.specialCareer && !jobReason(world(), job)).sort((a, b) => salaryFor(world(), a) > salaryFor(world(), b) ? -1 : 1);
    if (roles[0]) await act({ type: 'apply-job', roleId: roles[0].id });
  }
  if (person().died) return;
  if (person().employment && !currentWorkplace(world()) && !hospitalized(world(), person())) await act({ type: 'meet-coworkers' });
  let place = currentWorkplace(world()), supervisor = place?.members.find(member => member.role === 'supervisor' && !member.left)?.personId;
  if (supervisor && !workFeedbackReason(world(), place, supervisor)) await act({ type: 'work-feedback', workplaceId: place.id, supervisorId: supervisor });
  place = currentWorkplace(world()); supervisor = place?.members.find(member => member.role === 'supervisor' && !member.left)?.personId;
  if (supervisor && !workRaiseReason(world(), place, supervisor)) await act({ type: 'request-raise', workplaceId: place.id, supervisorId: supervisor });
  if (person().died) return;
  const livingChildren = childrenOf(world()).filter(child => !child.died), desired = years >= 45 ? 2 : years >= 35 ? 1 : 0;
  if (world().generation < 3 && livingChildren.length < desired && years <= 65 && person().stats.health >= 40 && person().wantsChildren && person().householdId && (person().employment || person().finance.pensionAnnual > 0n) && !hospitalized(world(), person()) && availableCash(accountFor(world())) >= adoptionFee(world())) await act({ type: 'adopt', age: 0 });
}
async function main() {
  await repository.initialise(); assert.equal(await store.getState().startLife(input, seed), true);
  trace({ method: 'startLife', seed, input, date, sources: originalSources }); const birth = world();
  assert.equal(await store.getState().acknowledgeBirth(), true); lastBefore = birth; rememberReceipt('birth:' + id); trace({ method: 'acknowledgeBirth', revision: world().revision });
  while (spanMonths() < 240 * 12) {
    await finishPending();
    if (person().died) {
      if (!deaths.some(row => row.personId === person().id)) { deaths.push({ personId: person().id, name: fullName(person()), generation: world().generation, date: person().died, ageAtDeath: age(), cause: person().causeOfDeath, estateId: world().estates.find(row => row.personId === person().id)?.id }); await cold('natural death'); }
      if (world().generation === 3) break;
      const heirs = childrenOf(world()).filter(child => !child.died).sort((a, b) => ageOn(a, world().date) - ageOn(b, world().date));
      assert.ok(heirs[0], 'Policy reached a natural death without a living child'); const recorded = encodeWorld(world());
      await act({ type: 'continue-child', personId: heirs[0].id }); assert.equal(world().generation, deaths.length + 1); trace({ event: 'generation-continued', fromPersonId: deaths.at(-1).personId, personId: heirs[0].id, previousWorldSha256: hash(recorded) }); await cold('existing heir');
      continue;
    }
    await annualActions(); if (!person().died) await act({ type: 'advance' });
    const elapsed = Math.floor(spanMonths() / 12);
    if (elapsed >= nextProgressYear || person().died) {
      const observation = { elapsedYears: elapsed, calendarMonths: spanMonths(), generation: world().generation, activePersonId: world().activePersonId, age: age(), revision: world().revision, people: Object.keys(world().people).length, ledgerRows: world().ledger.length, snapshots: snapshots.size, cash: accountFor(world()).cash.toString(), storage: storage() };
      observations.push(observation); process.stdout.write(JSON.stringify({ event: 'family-progress', ...observation }) + '\n'); nextProgressYear = elapsed + 5; await cold('five-year observation');
    }
  }
  assert.equal(deaths.length, 3, 'Three natural active-person deaths required'); assert.equal(world().generation, 3); assert.ok(spanMonths() >= 120 * 12, 'Policy did not reach120calendar years');
  assert.equal(world().legacies.length, 2); assert.equal(new Set(deaths.map(row => row.personId)).size, 3); for (const row of deaths) assert.equal(world().estates.filter(estate => estate.personId === row.personId).length, 1);
  await cold('completed journey'); assert.deepEqual(sources(), originalSources);
  const finalWorldSha256 = hash(encodeWorld(world())), liveStorage = storage(), archive = await repository.export(id); fs.writeFileSync(path.join(folder, 'complete.dreams.json'), archive);
  const snapshotPayloadBytes = sqlite.prepare('SELECT SUM(length(CAST(payload AS BLOB))) n FROM snapshots WHERE life_id=?').get(id).n;
  const record = { event: 'family-complete', scope: 'Cloud Node/on-disk SQLite, normal game-store commands and natural deaths/adoptions; not native,1000people or every optional system', sources: originalSources, seed, country, input, startDate: date, finalDate: world().date, calendarMonths: spanMonths(), generation: 3, deaths, commands, revision: world().revision, annualCheckpoints: advances, allOriginalCheckpointAndReceiptRowsExact: true, allColdCurrentAndBackupWorldsExact: true, coldChecks, finalWorldSha256, people: Object.keys(world().people).length, ledgerRows: world().ledger.length, observations, liveStorage, maximumLiveDatabaseWalShmBytes: maximumLiveBytes, snapshotPayloadBytes, archiveBytes: Buffer.byteLength(archive), archiveSha256: hash(archive), budgetBytes: 50000000, liveBudgetPassed: maximumLiveBytes < 50000000, elapsedMs: Date.now() - began };
  sqlite.close(); record.closedDatabaseBytes = fs.statSync(file).size; record.closedBudgetPassed = record.closedDatabaseBytes < 50000000;
  fs.writeFileSync(path.join(folder, 'result.json'), JSON.stringify(record, null, 2) + '\n'); process.stdout.write(JSON.stringify({ event: 'family-complete', calendarMonths: record.calendarMonths, deaths, closedDatabaseBytes: record.closedDatabaseBytes, maximumLiveBytes, archiveBytes: record.archiveBytes, liveBudgetPassed: record.liveBudgetPassed, elapsedMs: record.elapsedMs, output: folder }) + '\n');
  if (!record.liveBudgetPassed || !record.closedBudgetPassed) process.exitCode = 1;
}
main().catch(error => {
  const record = { event: 'family-failed', error: error.stack ?? String(error), lastCommitError, sources: originalSources, seed, country, commands, advances, generation: world()?.generation, date: world()?.date, calendarMonths: world() ? spanMonths() : 0, deaths, coldChecks, observations, output: folder, elapsedMs: Date.now() - began, lastValidStorage: storage() };
  try { if (world()) { const encoded = encodeWorld(world()); fs.writeFileSync(path.join(folder, 'last-valid-world.json'), encoded); record.lastValidCanonicalWorldBytes = Buffer.byteLength(encoded); record.lastValidWorldSha256 = hash(encoded); verifyHistory(); record.lastValidHistoryAndReceiptsExact = true; } assert.deepEqual(sources(), originalSources); record.sourcesUnchanged = true; } catch (diagnostic) { record.diagnosticError = String(diagnostic); }
  fs.writeFileSync(path.join(folder, 'failure.json'), JSON.stringify(record, null, 2) + '\n'); process.stderr.write(JSON.stringify(record) + '\n'); try { sqlite.close(); } catch {} process.exitCode = 1;
});
