// Separate natural hourly-work policy. All gameplay changes use normal production commands.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), assert = require('node:assert/strict'), { createHash } = require('node:crypto'), ts = require('typescript');
const root = path.join(__dirname, '..'), started = Date.now(), records = [];
const sha = value => createHash('sha256').update(value).digest('hex');
function hashSources(directories, relativeBase) {
  const hash = createHash('sha256');
  const visit = directory => { for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(file);
    else if (entry.name.endsWith('.ts')) hash.update(path.relative(relativeBase, file)).update('\0').update(fs.readFileSync(file)).update('\0');
  } };
  directories.forEach(visit); return hash.digest('hex');
}
const gameHash = () => hashSources([path.join(root, 'src/game')], path.join(root, 'src/game'));
const combinedHash = () => hashSources([path.join(root, 'src/game'), path.join(root, 'src/persistence')], root);
const toolHash = () => sha(fs.readFileSync(__filename));
const sourceBefore = { game: gameHash(), gameAndPersistence: combinedHash(), tool: toolHash() };
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
const { createLife, randomCreation } = require('../src/game/createLife.ts'), { resolveCommand } = require('../src/game/engine.ts');
const { ageOn, encodeWorld, decodeWorld, immutableWorld } = require('../src/game/model.ts'), { countries, countryCodes } = require('../src/game/countries.ts');
const { rules } = require('../src/game/rules.ts'), { jobs } = require('../src/game/content/jobs.ts'), { choiceUnavailable } = require('../src/game/choiceAvailability.ts');
const { jobReason } = require('../src/game/systems/work.ts'), { hourlyAnnual, hourlyQuote, hourlyStudentReason, hourlyContract, hourlyPeriodGross } = require('../src/game/systems/hourlyWork.ts');
const { currentWorkplace } = require('../src/game/systems/workplaceSchemas.ts'), { workplaceReason, workFeedbackReason, workRaiseReason } = require('../src/game/systems/workplaces.ts');
const { tripReason, tripQuote } = require('../src/game/systems/travel.ts');
const scope = 'Separate optional hourly-work policy: twelve natural birth-to-death pure-engine cloud journeys, seeds900..911, existing birth-acknowledgement flag exception, healthy routine from age6, actual reviewed part-time interviews at rotating8/12/20 weekly hours (20 waits until school ends), one withdrawal per country, responsible hiring responses, retained hourly work/reapplication after loss, eligible annual supervisor feedback/raise requests, at most one affordable eligible paid-leave holiday, earned retirement, first available annual choices and exact cold codec checks. No funds/stat/age/date/RNG/outcome overrides after creation. Not native, SQLite, all-choice, physical/performance, additional distinct annual-policy seeds,120-year or multi-generation acceptance.';
let versions, world = null, activeSeed = null, phase = 'setup', trace = [];
const json = value => JSON.stringify(value, (_, item) => typeof item === 'bigint' ? item.toString() : item);
function summarizeContracts(current) {
  const histories = new Map(current.workHistory.map(row => [row.id, row])), ledger = new Map(current.ledger.map(row => [row.id, row]));
  return current.hourlyContracts.filter(contract => contract.personId === current.activePersonId).map(contract => {
    const history = histories.get(contract.employmentId), attendance = {}, used = new Set(); let paidPeriods = 0, paidMinutes = 0, workedMinutes = 0, gross = 0n;
    for (const period of contract.periods) {
      const expected = hourlyPeriodGross({ ...contract.terms, hourlyRate: period.hourlyRate }, period.firstPeriod, period.periods, period.factorBps);
      assert.equal(period.firstPeriod, paidPeriods, 'Actual hourly periods must be contiguous'); assert.equal(period.gross, expected, 'Every actual hourly payment must retain cumulative rounding');
      const receipt = period.transactionId && ledger.get(period.transactionId);
      assert.ok(receipt && !used.has(receipt.id), 'Actual hourly payment needs a unique real receipt'); used.add(receipt.id);
      assert.equal(receipt.personId, contract.personId); assert.equal(receipt.currency, contract.currency); assert.equal(receipt.cashDelta, period.gross); assert.equal(receipt.debtDelta, 0n);
      const minutes = contract.terms.weeklyHours * 52 * 5 * period.periods * period.factorBps / 10000;
      assert.equal(period.paidMinutes, minutes); assert.equal(period.workedMinutes, period.attendance === 'worked' || period.attendance === 'background' ? minutes : 0);
      const group = attendance[period.attendance] ??= { periods: 0, paidMinutes: 0, workedMinutes: 0, gross: 0n };
      group.periods += period.periods; group.paidMinutes += period.paidMinutes; group.workedMinutes += period.workedMinutes; group.gross += period.gross;
      paidPeriods += period.periods; paidMinutes += period.paidMinutes; workedMinutes += period.workedMinutes; gross += period.gross;
    }
    assert.equal(history.monthsWorked, paidPeriods); assert.equal(history.grossEarned, gross);
    return { employmentId: contract.employmentId, roleId: contract.roleId, country: contract.country, currency: contract.currency, started: contract.started, ended: history.ended, initialTerms: contract.terms, initialAnnualGross: hourlyAnnual(contract.terms), rateChanges: contract.rates, paidPeriods, paidMinutes, workedMinutes, gross, paymentReceipts: used.size, attendance, originalHistoryReconciles: true };
  });
}
try {
  for (const [index, country] of countryCodes.entries()) {
    activeSeed = 900 + index; phase = 'life'; trace = [];
    const began = Date.now(), targetHours = [8, 12, 20][index % 3];
    world = createLife('life_hourly_policy_' + activeSeed, activeSeed, { ...randomCreation(activeSeed), country, city: countries[country].cities[0], background: 'ordinary' }, { year: 2000, month: 1, day: 1 });
    // Birth acknowledgement is a store command; this inherited exception starts engine play after it.
    world.birthAcknowledged = true; world = immutableWorld(world);
    const currentVersions = { world: world.schemaVersion, engine: world.engineVersion, content: world.contentVersion };
    if (!versions) versions = currentVersions; else assert.deepEqual(currentVersions, versions);
    const player = () => world.people[world.activePersonId], ownContracts = () => world.hourlyContracts.filter(row => row.personId === world.activePersonId);
    const paidPeriods = () => ownContracts().reduce((total, contract) => total + contract.periods.reduce((sum, row) => sum + row.periods, 0), 0);
    let commands = 0, healthy = false, withdrew = false, holidayBooked = false, retirement = null;
    const interviews = [], discussions = [], coldChecks = {};
    const run = command => { trace.push(command); world = resolveCommand(world, command, true); commands++; };
    const cold = label => {
      const before = encodeWorld(world), beforeHash = sha(before), after = decodeWorld(before, true);
      assert.equal(encodeWorld(after), before, 'Cold ' + label + ' must preserve every world field'); assert.equal(sha(encodeWorld(after)), beforeHash);
      world = after; coldChecks[label] = (coldChecks[label] ?? 0) + 1;
    };
    const drain = () => {
      let guard = 0;
      while ((world.pending || world.annual) && !player().died && guard++ < 200) {
        if (world.pending?.kind === 'decision') {
          const choice = world.pending.choices.find(item => !choiceUnavailable(world, item)); assert.ok(choice, 'A required annual decision needs an eligible choice');
          run({ type: 'choose', eventId: world.pending.id, choiceId: choice.id });
        } else if (world.pending) run({ type: 'acknowledge', resultId: world.pending.id });
        else run({ type: 'resume' });
      }
      assert.ok(guard < 200, 'Annual progression must close');
    };
    const interview = (role, answer) => {
      const original = world, terms = hourlyQuote(country, role, targetHours), age = ageOn(player(), world.date), date = { ...world.date };
      assert.equal(hourlyStudentReason(world, targetHours), undefined, 'Twenty-hour applications must wait for school to finish');
      run({ type: 'apply-job', roleId: role.id, reviewedHourlyTerms: terms });
      assert.equal(world.pending?.templateId, 'job-interview'); assert.deepEqual(world.random, original.random); assert.deepEqual(world.people, original.people); assert.deepEqual(world.accounts, original.accounts); assert.deepEqual(world.ledger, original.ledger); assert.deepEqual(world.hourlyContracts, original.hourlyContracts);
      for (const choice of world.pending.choices) { assert.deepEqual(choice.effects[0].hourly, terms); assert.equal(choice.effects[0].annualPay, hourlyAnnual(terms)); }
      cold('unansweredInterview');
      run({ type: 'choose', eventId: world.pending.id, choiceId: answer });
      const accepted = world.pending?.title === 'You got the job', outcome = answer === 'withdraw' ? 'withdrawn' : accepted ? 'accepted' : 'declined';
      assert.deepEqual(world.accounts, original.accounts); assert.deepEqual(world.ledger, original.ledger);
      if (accepted) {
        const contract = hourlyContract(world); assert.ok(contract); assert.deepEqual(contract.terms, terms); assert.equal(contract.periods.length, 0); assert.equal(player().employment.paidMonths, 0); assert.equal(world.workHistory.at(-1).grossEarned, 0n);
      } else { assert.deepEqual(world.people, original.people); assert.deepEqual(world.workHistory, original.workHistory); assert.deepEqual(world.hourlyContracts, original.hourlyContracts); }
      if (answer === 'withdraw') assert.deepEqual(world.random, original.random, 'Withdrawal cannot draw an outcome');
      interviews.push({ age, date, roleId: role.id, terms, annualGross: hourlyAnnual(terms), outcome }); cold('interviewResult'); drain();
      assert.match(jobReason(world, role, false, targetHours), accepted ? /already have/ : /already applied/, 'This role cannot be retried to reroll the saved result this year');
      return accepted;
    };
    for (let year = 0; year < 150 && !player().died; year++) {
      const age = ageOn(player(), world.date);
      if (age >= 6 && !healthy) {
        run({ type: 'health-routine', routine: { exercise: 'walking', diet: 'balanced', sleep: 'restful', mindfulness: true, smoking: false, drinking: 'none' } }); drain(); healthy = true;
      }
      const withdrawalRole = jobs.find(row => row.id === 'shop-assistant-part');
      if (!withdrew && !jobReason(world, withdrawalRole, false, targetHours)) { interview(withdrawalRole, 'withdraw'); withdrew = true; }
      if (!player().finance.pensionAnnual && age < rules[country].retirementAge && !player().employment) {
        for (const roleId of ['cafe-part', 'shop-assistant-part']) {
          const role = jobs.find(row => row.id === roleId);
          if (!jobReason(world, role, false, targetHours) && interview(role, 'careful')) break;
        }
      }
      if (player().employment) {
        assert.ok(player().employment.hourlyContractId && hourlyContract(world), 'The policy must retain hourly work rather than upgrade to full-time salary');
        if (!currentWorkplace(world) && !workplaceReason(world)) { run({ type: 'meet-coworkers' }); drain(); }
        const place = currentWorkplace(world), supervisor = place?.members.find(row => row.role === 'supervisor' && !row.left);
        if (supervisor && !workFeedbackReason(world, place, supervisor.personId)) {
          run({ type: 'work-feedback', workplaceId: place.id, supervisorId: supervisor.personId });
          discussions.push({ type: 'feedback', date: world.date, accepted: world.workplaces.find(row => row.id === place.id).feedback.at(-1).accepted }); drain();
        }
        if (supervisor && !workRaiseReason(world, place, supervisor.personId)) {
          run({ type: 'request-raise', workplaceId: place.id, supervisorId: supervisor.personId });
          discussions.push({ type: 'raise', date: world.date, accepted: world.workRaises.at(-1).accepted }); cold('raiseResult'); drain();
        }
        const destinationId = country === 'FR' ? 'london' : 'paris';
        if (!holidayBooked && age < rules[country].retirementAge && player().employment.paidMonths >= 12 && !tripReason(world, destinationId, 1, [])) {
          run({ type: 'book-trip', destinationId, duration: 1, companionIds: [], focus: 'rest', quotedTotal: tripQuote(world, destinationId, 1, []).total }); holidayBooked = true; cold('holidayBooking'); drain();
        }
      }
      if (age >= rules[country].retirementAge && player().finance.serviceMonths >= 120 && !player().finance.pensionAnnual) {
        const serviceMonths = player().finance.serviceMonths; run({ type: 'retire' }); retirement = { age, date: { ...world.date }, serviceMonths, annualPension: player().finance.pensionAnnual }; cold('retirementResult'); drain();
      }
      const paidBefore = paidPeriods(); run({ type: 'advance' }); drain();
      if (paidPeriods() > paidBefore) cold('annualPayroll');
    }
    assert.ok(player().died, 'The life must end naturally'); assert.ok(withdrew, 'Every country must withdraw a real reviewed interview');
    const contracts = summarizeContracts(world); assert.ok(contracts.some(row => row.paidPeriods > 0 && row.gross > 0n), 'Every country must have actual paid hourly work');
    assert.ok(contracts.every(row => row.initialTerms.weeklyHours === targetHours)); assert.ok(world.workHistory.filter(row => row.personId === world.activePersonId).every(row => row.hourlyContractId), 'No full-time replacement is allowed in this hourly policy');
    const service = contracts.reduce((sum, row) => sum + row.paidPeriods, 0); assert.equal(player().finance.serviceMonths, service); cold('final');
    const row = { country, seed: activeSeed, targetWeeklyHours: targetHours, versions: currentVersions, ageAtDeath: ageOn(player(), world.date), causeOfDeath: player().causeOfDeath, commands, coldChecks, coldChecksTotal: Object.values(coldChecks).reduce((sum, count) => sum + count, 0), interviews, discussions, contracts, paidPeriods: service, paidMinutes: contracts.reduce((sum, contract) => sum + contract.paidMinutes, 0), workedMinutes: contracts.reduce((sum, contract) => sum + contract.workedMinutes, 0), grossHourlyEarnings: contracts.reduce((sum, contract) => sum + contract.gross, 0n), retirement, pensionPeriods: player().finance.pensionMonths, trips: world.trips.filter(trip => trip.organizerId === world.activePersonId).map(trip => ({ destinationId: trip.destinationId, started: trip.started, ended: trip.ended, status: trip.status, paid: trip.paid, refund: trip.refund, leave: trip.leave, actualMonths: trip.periods.length })), people: Object.keys(world.people).length, ledgerRows: world.ledger.length, exactFinalCold: true, worldSha256: sha(encodeWorld(world)), elapsedMs: Date.now() - began };
    records.push(row); process.stderr.write(json({ event: 'hourly-life-complete', country, seed: activeSeed, targetWeeklyHours: targetHours, ageAtDeath: row.ageAtDeath, commands, coldChecks: row.coldChecksTotal, paidPeriods: service, contracts: contracts.length, rateChanges: contracts.reduce((sum, contract) => sum + contract.rateChanges.length, 0), elapsedMs: row.elapsedMs }) + '\n');
  }
  phase = 'complete-checks';
  assert.equal(records.length, 12); assert.deepEqual([...new Set(records.map(row => row.targetWeeklyHours))].sort((a, b) => a - b), [8, 12, 20]);
  const sourceAfter = { game: gameHash(), gameAndPersistence: combinedHash(), tool: toolHash() }; assert.deepEqual(sourceAfter, sourceBefore, 'Frozen game/persistence/tool source must stay exact');
  const total = { countries: records.length, interviews: records.reduce((sum, row) => sum + row.interviews.filter(item => item.outcome !== 'withdrawn').length, 0), accepted: records.reduce((sum, row) => sum + row.interviews.filter(item => item.outcome === 'accepted').length, 0), declined: records.reduce((sum, row) => sum + row.interviews.filter(item => item.outcome === 'declined').length, 0), withdrawals: records.reduce((sum, row) => sum + row.interviews.filter(item => item.outcome === 'withdrawn').length, 0), coldChecks: records.reduce((sum, row) => sum + row.coldChecksTotal, 0), paidPeriods: records.reduce((sum, row) => sum + row.paidPeriods, 0), paidMinutes: records.reduce((sum, row) => sum + row.paidMinutes, 0), workedMinutes: records.reduce((sum, row) => sum + row.workedMinutes, 0), rateChanges: records.reduce((sum, row) => sum + row.contracts.reduce((count, contract) => count + contract.rateChanges.length, 0), 0), paidLeavePeriods: records.reduce((sum, row) => sum + row.contracts.reduce((count, contract) => count + (contract.attendance['paid-leave']?.periods ?? 0), 0), 0), hospitalPeriods: records.reduce((sum, row) => sum + row.contracts.reduce((count, contract) => count + (contract.attendance.hospital?.periods ?? 0), 0), 0), retired: records.filter(row => row.retirement).length };
  process.stdout.write(json({ format: 'dreams-natural-hourly-policy-v1', status: 'passed', scope, stateMode: 'validated immutable', node: process.version, versions, sourceBefore, sourceAfter, gameSourceHash: sourceBefore.game, gamePersistenceSourceHash: sourceBefore.gameAndPersistence, toolSourceHash: sourceBefore.tool, elapsedMs: Date.now() - started, totals: total, records }) + '\n');
} catch (error) {
  let diagnostic = null;
  try { const directory = path.join(os.tmpdir(), 'dreams-hourly-work-sweep-failures'); fs.mkdirSync(directory, { recursive: true }); diagnostic = path.join(directory, 'seed-' + activeSeed + '-' + Date.now() + '.json'); fs.writeFileSync(diagnostic, json({ format: 'dreams-natural-hourly-policy-failure-v1', scope, phase, seed: activeSeed, versions, sourceBefore, completed: records.length, error: error.message, commands: trace, lastValidWorld: world ? encodeWorld(world) : null }) + '\n'); } catch { /* Keep the original failure if diagnostics cannot be written. */ }
  process.stderr.write(json({ event: 'hourly-policy-failed', phase, seed: activeSeed, completed: records.length, error: error.message, diagnostic }) + '\n' + error.stack + '\n');
  process.stdout.write(json({ format: 'dreams-natural-hourly-policy-v1', status: 'failed', scope, versions, sourceBefore, sourceAfter: { game: gameHash(), gameAndPersistence: combinedHash(), tool: toolHash() }, elapsedMs: Date.now() - started, completed: records.length, records, error: error.message, diagnostic }) + '\n'); process.exitCode = 1;
}
