// Separate Scenario A acceptance policy. No engine or saved-world overrides.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), assert = require('node:assert/strict'), { createHash } = require('node:crypto');
const root = path.join(__dirname, '..'), started = Date.now(), args = process.argv.slice(2), options = {};
if (args.includes('--help')) { process.stdout.write('Usage: node tools/run-professional-policy.cjs [--country CODE] [--seed-base 900] [--max-years 150]\nDefault: all12 countries; seeds900..911 are explicitly reused, not additional distinct annual-policy seeds.\n'); process.exit(0); }
for (let index = 0; index < args.length; index += 2) { assert.ok(['--country', '--seed-base', '--max-years'].includes(args[index]) && args[index + 1], 'Use --help for supported options'); assert.ok(!options[args[index]], 'Duplicate option'); options[args[index]] = args[index + 1]; }
const seedBase = Number(options['--seed-base'] ?? 900), maxYears = Number(options['--max-years'] ?? 150);
assert.ok(Number.isInteger(seedBase) && seedBase >= 0 && seedBase <= 988, 'Seed base must leave room for12 country seeds below1000');
assert.ok(Number.isInteger(maxYears) && maxYears >= 1 && maxYears <= 150, 'Year bound must be1..150');
const sha = value => createHash('sha256').update(value).digest('hex');
function sourceHash(directories, relativeBase) {
  const hash = createHash('sha256'), visit = directory => { for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) { const file = path.join(directory, entry.name); if (entry.isDirectory()) visit(file); else if (file.endsWith('.ts')) hash.update(path.relative(relativeBase, file)).update('\0').update(fs.readFileSync(file)).update('\0'); } };
  directories.forEach(visit); return hash.digest('hex');
}
const sources = () => ({ game: sourceHash([path.join(root, 'src/game')], path.join(root, 'src/game')), gameAndPersistence: sourceHash([path.join(root, 'src/game'), path.join(root, 'src/persistence')], root), tool: sha(fs.readFileSync(__filename)), policy: sha(fs.readFileSync(path.join(root, 'tests/support/professionalPolicy.ts'))), sqliteBirthDriver: sha(fs.readFileSync(path.join(root, 'tests/support/sqlite.ts'))), birthStore: sha(fs.readFileSync(path.join(root, 'src/state/gameStore.ts'))) });
const original = sources(), ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, file);
const { countryCodes } = require('../src/game/countries.ts'), { encodeWorld } = require('../src/game/model.ts');
const { createProfessionalLife, runProfessionalPolicy } = require('../tests/support/professionalPolicy.ts');
assert.ok(!options['--country'] || countryCodes.includes(options['--country']), 'Unknown country');
const json = value => JSON.stringify(value, (_, item) => typeof item === 'bigint' ? item.toString() : item);
const scope = 'Separate professional-life Scenario A policy v2: reused country seeds900..911 by default, ordinary birth via actual in-memory SQLite game-store startLife and acknowledgeBirth only; every later change uses immutable normal pure-engine commands. Healthy routine, real paid reading/study/school help and recovery if needed, business-degree applications with real scholarship/cash/student-loan funding, eligible part-time student work then qualified-job applications and fallback, real qualified-job supervisor feedback/raises/promotion and hard work, first offered actual romance-compatible local contact/dating/courtship/proposal/marriage/attempted biological parenthood. For a visible Family Planning permanent reproductive/fertility block, use ordinary reviewed age0 adoption only if actual age21..65/health/household/income/fee allow, with partner consent still enforced by the engine. No hidden NPC reproductive/preferences selection. Student-debt repayments from surplus, affordable30-year studio mortgage and one broad-market fund unit, three months of local living-cost cash reserved, eligible earned retirement, natural death and conserved estate. First available annual choices and responsible interviews; genuine refusals/ineligibility/early deaths recorded, no success outcome required. Earlier US probe used v1 with no adoption fallback. Exact cold codec checks only after birth; remainder is not SQLite/store/native/device/all-choice/physical-performance/Scenario B or C/multi-generation acceptance, and this does not add distinct seeds to the existing120 annual-policy total.';
const records = []; let activeSeed = null, activeCountry = null, lastWorld = null, trace = [];
async function main() {
  process.stderr.write(json({ event: 'professional-policy-start', sources: original, country: options['--country'] ?? 'all', seedBase, maxYears }) + '\n');
  for (const [index, country] of countryCodes.entries()) {
    if (options['--country'] && options['--country'] !== country) continue;
    activeSeed = seedBase + index; activeCountry = country; const began = Date.now();
    const initial = await createProfessionalLife(country, activeSeed); lastWorld = initial; trace = [];
    const { world, report } = runProfessionalPolicy(initial, { maxYears, onStep: (current, commands) => { lastWorld = current; trace = commands; } });
    if (maxYears === 150) assert.ok(report.naturallyDied, 'A full policy run must terminate through actual natural death');
    const row = { seed: activeSeed, ...report, finalWorldSha256: sha(encodeWorld(world)), elapsedMs: Date.now() - began }; records.push(row);
    process.stderr.write(json({ event: 'professional-life-complete', country, seed: activeSeed, versions: report.versions, naturallyDied: report.naturallyDied, ageAtEnd: report.ageAtEnd, commands: report.commandsCommitted, reached: Object.entries(report.milestones).filter(([, value]) => value.status === 'reached').map(([key]) => key), unreached: Object.entries(report.milestones).filter(([, value]) => value.status !== 'reached').map(([key]) => key), coldChecks: report.coldChecks.length, elapsedMs: row.elapsedMs }) + '\n');
  }
  assert.deepEqual(sources(), original, 'Source changed during the policy');
  process.stdout.write(json({ format: 'dreams-professional-policy-v1', scope, sources: original, node: process.version, versions: records[0]?.versions, reusedSeedRange: [seedBase, seedBase + 11], distinctCountryLives: records.length, scenarioA: { type: 'actual observed engine milestone evidence; omissions remain explicit', everyRequestedMilestoneReachedInEveryObservedLife: records.every(row => row.everyRequestedMilestoneReached) }, scenarioB: 'unrun by this policy', scenarioC: 'unrun by this policy', elapsedMs: Date.now() - started, records }) + '\n');
}
main().catch(error => {
  let diagnostic = null; try { const directory = path.join(os.tmpdir(), 'dreams-professional-policy-failures'); fs.mkdirSync(directory, { recursive: true }); diagnostic = path.join(directory, activeCountry + '-' + activeSeed + '-' + Date.now() + '.json'); fs.writeFileSync(diagnostic, JSON.stringify({ format: 'dreams-professional-policy-failure-v1', scope, sources: original, seed: activeSeed, country: activeCountry, completed: records.length, error: error.stack ?? String(error), trace, lastValidWorld: lastWorld ? encodeWorld(lastWorld) : null }, (_, item) => typeof item === 'bigint' ? { $dreamsBigInt: item.toString() } : item) + '\n'); } catch { /* Keep the original failure. */ }
  process.stderr.write(json({ event: 'professional-policy-failed', country: activeCountry, seed: activeSeed, completed: records.length, error: error.stack ?? String(error), diagnostic }) + '\n'); process.exitCode = 1;
});
