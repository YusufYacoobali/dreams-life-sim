// Twelve natural ordinary-work journeys. No world, money, age, stat or RNG overrides.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), { createHash } = require('node:crypto'), ts = require('typescript');
const root = path.join(__dirname, '..'), started = Date.now();
function sourceHash() { const hash = createHash('sha256'), base = path.join(root, 'src/game'); const visit = dir => { for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) { const file = path.join(dir, entry.name); if (entry.isDirectory()) visit(file); else if (file.endsWith('.ts')) hash.update(path.relative(base, file)).update('\0').update(fs.readFileSync(file)).update('\0'); } }; visit(base); return hash.digest('hex'); }
const gameSourceHash = sourceHash(), toolSourceHash = createHash('sha256').update(fs.readFileSync(__filename)).digest('hex');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
const { createLife, randomCreation } = require('../src/game/createLife.ts'), { resolveCommand } = require('../src/game/engine.ts'), { ageOn, encodeWorld, decodeWorld, immutableWorld } = require('../src/game/model.ts'), { countries, countryCodes } = require('../src/game/countries.ts'), { rules } = require('../src/game/rules.ts'), { jobs } = require('../src/game/content/jobs.ts'), { jobReason } = require('../src/game/systems/work.ts'), { choiceUnavailable } = require('../src/game/choiceAvailability.ts');
const records = [];
for (const [index, country] of countryCodes.entries()) {
  const seed = 900 + index; let world = createLife('life_work_sweep_' + seed, seed, { ...randomCreation(seed), country, city: countries[country].cities[0], background: 'ordinary' }, { year: 2000, month: 1, day: 1 });
  // Birth acknowledgement is a store command; the engine journey begins after it.
  world.birthAcknowledged = true; world = immutableWorld(world);
  const player = () => world.people[world.activePersonId]; let commands = 0, coldChecks = 0, healthy = false, withdrew = false;
  const interviews = [], run = command => { world = resolveCommand(world, command, true); commands++; };
  const cold = () => { const text = encodeWorld(world); world = decodeWorld(text, true); assert.equal(encodeWorld(world), text); coldChecks++; };
  const drain = () => { let guard = 0; while ((world.pending || world.annual) && !player().died && guard++ < 200) { if (world.pending?.kind === 'decision') { const choice = world.pending.choices.find(item => !choiceUnavailable(world, item)); assert.ok(choice); run({ type: 'choose', eventId: world.pending.id, choiceId: choice.id }); } else if (world.pending) run({ type: 'acknowledge', resultId: world.pending.id }); else run({ type: 'resume' }); } assert.ok(guard < 200); };
  for (let year = 0; year < 120 && !player().died; year++) {
    const age = ageOn(player(), world.date);
    if (age >= 6 && !healthy) { run({ type: 'health-routine', routine: { exercise: 'walking', diet: 'balanced', sleep: 'restful', mindfulness: true, smoking: false, drinking: 'none' } }); drain(); healthy = true; }
    const partTime = jobs.find(item => item.id === 'shop-assistant-part');
    if (!withdrew && !jobReason(world, partTime)) {
      const random = world.random, people = world.people, accounts = world.accounts, history = world.workHistory;
      run({ type: 'apply-job', roleId: partTime.id }); assert.equal(world.pending.templateId, 'job-interview'); assert.deepEqual(world.random, random); cold();
      run({ type: 'choose', eventId: world.pending.id, choiceId: 'withdraw' }); assert.equal(world.pending.title, 'Application withdrawn'); assert.deepEqual(world.people, people); assert.deepEqual(world.accounts, accounts); assert.deepEqual(world.workHistory, history); assert.deepEqual(world.random, random); cold(); drain();
      assert.match(jobReason(world, partTime), /already applied/); withdrew = true;
    }
    if (age < rules[country].retirementAge && (!player().employment || (age >= rules[country].adultAge && jobs.find(item => item.id === player().employment.roleId).partTime))) {
      const ids = age < rules[country].adultAge ? ['cafe-part', 'shop-assistant-part'] : ['administrator', 'retail', 'cleaner'];
      for (const roleId of ids) { const role = jobs.find(item => item.id === roleId); if (jobReason(world, role)) continue;
        const random = world.random, people = world.people, accounts = world.accounts, ledger = world.ledger, history = world.workHistory;
        run({ type: 'apply-job', roleId }); assert.equal(world.pending.templateId, 'job-interview'); assert.deepEqual(world.people, people); assert.deepEqual(world.random, random); cold();
        run({ type: 'choose', eventId: world.pending.id, choiceId: 'careful' }); const accepted = world.pending.title === 'You got the job'; assert.deepEqual(world.accounts, accounts); assert.deepEqual(world.ledger, ledger);
        if (accepted) { assert.equal(player().employment.roleId, roleId); assert.equal(player().employment.paidMonths, 0); assert.equal(world.workHistory.at(-1).grossEarned, 0n); }
        else { assert.deepEqual(world.people, people); assert.deepEqual(world.workHistory, history); }
        interviews.push({ age, roleId, accepted }); cold(); drain(); if (accepted) break;
      }
    }
    if (age >= rules[country].retirementAge && player().employment && player().finance.serviceMonths >= 120 && !player().finance.pensionAnnual) { run({ type: 'retire' }); drain(); cold(); }
    run({ type: 'advance' }); drain();
  }
  assert.ok(player().died, 'Life must end naturally'); assert.ok(withdrew, 'Journey must withdraw a real interview'); assert.ok(interviews.some(item => item.accepted), 'Journey must earn an actual job');
  const history = world.workHistory.filter(item => item.personId === world.activePersonId); assert.ok(history.some(item => item.monthsWorked > 0 && item.grossEarned > 0n), 'Actual paid employment required'); cold();
  records.push({ country, seed, ageAtDeath: ageOn(player(), world.date), commands, coldChecks, interviews, paidMonths: history.reduce((n,item) => n + item.monthsWorked, 0), pensionEarned: player().finance.pensionAnnual.toString(), worldSha256: createHash('sha256').update(encodeWorld(world)).digest('hex') });
  process.stderr.write(JSON.stringify(records.at(-1)) + '\n');
}
assert.equal(sourceHash(), gameSourceHash, 'Game source changed during work sweep');
process.stdout.write(JSON.stringify({ scope: 'Twelve country-specific pure-engine cloud lives; natural ages, healthy routine, part-time/full-time interviews, first available annual choices, real work/pay and eligible retirement; unanswered/result codec checks and withdrawal; no fixture money/stats/RNG/outcome edits. Not native, SQLite, all-choice, physical performance or multi-generation acceptance.', gameSourceHash, toolSourceHash, versions: { world: 34, engine: 35, content: 10 }, elapsedMs: Date.now() - started, records }, null, 2) + '\n');
