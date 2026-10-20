// Scenario C acceptance policy. Production source and outcomes are never edited.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const assert = require('node:assert/strict'), { createHash } = require('node:crypto');
const policyVersion = 2, expectedVersions = { world: 33, engine: 34, content: 9 };
const phases = ['birth', 'school', 'social', 'fame50', 'business', 'brandEarned', 'investment', 'family', 'death'];
const sha = value => createHash('sha256').update(value).digest('hex');
function canonical(value) {
  if (typeof value === 'bigint') return JSON.stringify(value.toString());
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).filter(key => value[key] !== undefined).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
  return JSON.stringify(value);
}
function coverage(timeline) {
  const first = Object.fromEntries(phases.map(phase => [phase, timeline.find(row => row.phase === phase)]));
  const reached = phases.filter(phase => !!first[phase]), unreached = phases.filter(phase => !first[phase]);
  const ordered = unreached.length === 0 && phases.every((phase, index) => !index || first[phase].commandIndex > first[phases[index - 1]].commandIndex);
  return { reached, unreached, allPhasesReached: unreached.length === 0, orderedScenarioCComplete: ordered };
}
function selectChoice(event, hasCompany, eligible) {
  const choices = event.choices.filter(eligible); assert.ok(choices.length, 'A required decision needs an eligible choice');
  const desired = event.templateId === 'job-interview' ? 'careful' : event.templateId === 'brand-offer' ? hasCompany ? 'accept' : 'decline' : event.templateId === 'public-controversy' ? 'apologise' : null;
  return choices.find(choice => choice.id === desired) ?? choices[0];
}
function quantityWithinBudget(budget, quote) {
  assert.ok(budget >= 0n); if (!budget || quote(1n).buyCost > budget) return 0n;
  let low = 1n, high = 2n;
  while (quote(high).buyCost <= budget) { low = high; high *= 2n; }
  while (low + 1n < high) { const middle = (low + high) / 2n; if (quote(middle).buyCost <= budget) low = middle; else high = middle; }
  return low;
}
function reputationAllowed({ age, fame, available, reserve, fee, used, confined, absent }) {
  return age >= 18 && fame >= 10 && !used && !confined && !absent && available >= fee + reserve;
}
function assertEstateConservation(estate) {
  const unit = estate.netWorthAtDeath.currency;
  for (const money of [estate.debtPaid, estate.debtWrittenOff, estate.fees, estate.tax, estate.charity, ...estate.distributions.flatMap(row => [row.cash, row.assetValue])]) assert.equal(money.currency, unit, 'Do not combine different currency units');
  const distributed = estate.distributions.reduce((sum, row) => sum + row.cash.minor + row.assetValue.minor, 0n);
  const left = estate.netWorthAtDeath.minor + estate.debtWrittenOff.minor, right = distributed + estate.charity.minor + estate.fees.minor + estate.tax.minor;
  assert.equal(left, right, 'Net estate plus written-off debt must conserve distributions, charity, fees and tax');
  return { currency: unit, left, right, distributed, debtPaid: estate.debtPaid.minor, debtWrittenOff: estate.debtWrittenOff.minor, conserved: true };
}
function checkpointRoundTrip(world, { encodeWorld, packCheckpoint, unpackCheckpoint }) {
  const text = encodeWorld(world), payload = packCheckpoint(world), loaded = unpackCheckpoint(payload, true);
  assert.equal(encodeWorld(loaded), text, 'Production checkpoint must preserve the complete canonical world');
  const frame = JSON.parse(payload);
  return { world: loaded, payload, proof: { canonicalBytes: Buffer.byteLength(text), checkpointBytes: Buffer.byteLength(payload), compactBytes: frame.bytes, format: frame.format, worldSha256: sha(text), checkpointSha256: sha(payload) } };
}
function assertEstateReceipts(world, estate) {
  const expected = new Map(estate.distributions.map(row => [row.personId, row.cash.minor])), paid = new Map(), pairs = [];
  let charity = 0n, tax = 0n, debtPaid = 0n;
  for (const [index, debit] of world.ledger.entries()) {
    if (debit.personId !== estate.personId) continue;
    if (debit.category === 'estate-charity') charity -= debit.cashDelta;
    if (debit.category === 'estate-tax') tax -= debit.cashDelta;
    if (debit.category === 'estate-debt') debtPaid -= debit.cashDelta;
    if (debit.category !== 'estate-distribution') continue;
    const credit = world.ledger[index + 1], account = credit && world.accounts.find(item => item.id === credit.accountId);
    assert.ok(credit && credit.category === 'inheritance' && expected.has(credit.personId), 'Every estate debit needs the actual next heir receipt');
    assert.ok(debit.cashDelta < 0n && credit.cashDelta === -debit.cashDelta && debit.debtDelta === 0n && credit.debtDelta === 0n, 'Inheritance must transfer the same cash once');
    assert.ok(debit.currency === estate.netWorthAtDeath.currency && credit.currency === debit.currency && credit.year === debit.year && credit.month === debit.month, 'Inheritance receipt keeps the settlement period and currency');
    assert.ok(account && account.ownerId === credit.personId && account.currency === credit.currency, 'Inheritance must enter the actual heir account');
    paid.set(credit.personId, (paid.get(credit.personId) ?? 0n) + credit.cashDelta); pairs.push({ heirId: credit.personId, debitId: debit.id, creditId: credit.id, amount: credit.cashDelta });
  }
  for (const [personId, amount] of expected) assert.equal(paid.get(personId) ?? 0n, amount, 'Actual heir receipts must equal the settled distribution');
  assert.equal(charity, estate.charity.minor); assert.equal(tax, estate.tax.minor); assert.equal(debtPaid, estate.debtPaid.minor);
  return { actualReceiptPairs: pairs, charity, tax, debtPaid, conserved: true };
}
function parseOptions(argv, codes) {
  const options = {};
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index]; assert.ok(['--country', '--all', '--output'].includes(flag) && options[flag] === undefined, 'Use --country US OR --all, with optional --output EMPTY_DIRECTORY');
    options[flag] = flag === '--all' ? true : argv[++index]; assert.ok(options[flag]);
  }
  assert.ok(!!options['--country'] !== !!options['--all'], 'Explicitly select one country or all twelve');
  if (options['--country']) assert.ok(codes.includes(options['--country']), 'Unknown country');
  return { countries: options['--all'] ? codes : [options['--country']], output: options['--output'] };
}
function sources(root) {
  const files = [], visit = directory => { for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) { const file = path.join(directory, entry.name); if (entry.isDirectory()) visit(file); else if (file.endsWith('.ts')) files.push(file); } };
  visit(path.join(root, 'src/game')); const game = [...files]; visit(path.join(root, 'src/persistence'));
  const digest = (list, base) => { const hash = createHash('sha256'); for (const file of list) hash.update(path.relative(base, file)).update('\0').update(fs.readFileSync(file)).update('\0'); return hash.digest('hex'); };
  return { game: digest(game, path.join(root, 'src/game')), gameAndPersistence: digest(files, root), store: sha(fs.readFileSync(path.join(root, 'src/state/gameStore.ts'))), tool: sha(fs.readFileSync(__filename)) };
}
async function main(argv = process.argv.slice(2)) {
  const root = path.join(__dirname, '..'), ts = require('typescript'), { DatabaseSync } = require('node:sqlite'), started = Date.now();
  require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
  const { createGameStore } = require('../src/state/gameStore.ts'), { SaveRepository } = require('../src/persistence/repository.ts');
  const { packCheckpoint, unpackCheckpoint } = require('../src/persistence/checkpoints.ts');
  const { randomCreation } = require('../src/game/createLife.ts'), { resolveCommand } = require('../src/game/engine.ts');
  const { ageOn, encodeWorld } = require('../src/game/model.ts'), { countryCodes, countries } = require('../src/game/countries.ts'), { rules } = require('../src/game/rules.ts');
  const { choiceUnavailable } = require('../src/game/choiceAvailability.ts'), { accountFor, availableCash } = require('../src/game/systems/common.ts');
  const { jobs } = require('../src/game/content/jobs.ts'), { jobReason } = require('../src/game/systems/work.ts');
  const { postReason, postCost, publicActionQuote, monetisationReason, sponsorReason } = require('../src/game/systems/social.ts');
  const { businessStartReason, businessStartupQuote, businessReserve, agencyFee } = require('../src/game/systems/businesses.ts');
  const { businessValue } = require('../src/game/businessValuation.ts'), { investmentQuote } = require('../src/game/systems/markets.ts');
  const { adoptionFee, childrenOf } = require('../src/game/systems/family.ts'), { partnerRelation, otherPerson } = require('../src/game/systems/relationships.ts');
  const { hospitalized } = require('../src/game/systems/healthSchemas.ts'), { isConfined } = require('../src/game/systems/legalSchemas.ts');
  const { activeTrip } = require('../src/game/systems/travelSchemas.ts'), { serviceAway } = require('../src/game/systems/serviceSchemas.ts');
  const options = parseOptions(argv, countryCodes), folder = options.output ? path.resolve(options.output) : fs.mkdtempSync(path.join(os.tmpdir(), 'dreams-entrepreneur-'));
  fs.mkdirSync(folder, { recursive: true }); assert.equal(fs.readdirSync(folder).length, 0, 'Choose an empty output directory');
  const sourceBefore = sources(root), records = [], scope = 'Scenario C optional natural entrepreneur policy v2; same seeds900..911 as other optional country policies, not additional120-seed coverage. Real on-disk SQLite StartLife/acknowledgement and closed-connection initial recovery ONLY; all subsequent play uses validated immutable pure-engine commands and exact production checkpoint pack/unpack plus complete canonical equality, NOT SQLite/native gameplay persistence. Ordinary newborns, actual school/work/audience/fame/company/brand/investment/family/death outcomes; at most one affordable eligible public-reputation action/year with six-month personal living reserve retained; no funds/stats/date/RNG/outcome overrides or future-outcome inspection. Reached and unmet goals are separate from integrity; no guaranteed famous entrepreneur, viral post, earnings, family or survival.';
  let world = null, activeCountry = null, trace = [], phase = 'setup';
  try {
    for (const country of options.countries) {
      activeCountry = country; trace = []; phase = 'sqlite-birth'; const seed = 900 + countryCodes.indexOf(country), began = Date.now(), id = 'life_entrepreneur_' + country + '_' + seed;
      const directory = path.join(folder, country); fs.mkdirSync(directory); const databaseFile = path.join(directory, 'birth.db'), traceFile = path.join(directory, 'commands.ndjson');
      const traceHash = createHash('sha256'); let commandIndex = 0;
      const writeTrace = row => { const line = canonical(row) + '\n'; fs.appendFileSync(traceFile, line); traceHash.update(line); trace.push(row); if (trace.length > 40) trace.shift(); };
      let sqlite;
      const connect = () => {
        sqlite = new DatabaseSync(databaseFile); sqlite.exec('PRAGMA foreign_keys=ON'); const connection = sqlite;
        const session = { run: async (sql, values = []) => { connection.prepare(sql).run(...values); }, get: async (sql, values = []) => connection.prepare(sql).get(...values) ?? null, all: async (sql, values = []) => connection.prepare(sql).all(...values) };
        return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => { connection.exec('BEGIN IMMEDIATE'); try { const value = await action(session); connection.exec('COMMIT'); return value; } catch (error) { connection.exec('ROLLBACK'); throw error; } } };
      };
      const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
      const repository = new SaveRepository(connect()); await repository.initialise();
      const birthDate = { year: 2000, month: 1, day: 1 }, input = { ...randomCreation(seed), country, city: countries[country].cities[0], background: 'ordinary' };
      const store = createGameStore({ repository: async () => repository, date: () => birthDate, id: () => id });
      assert.equal(await store.getState().bootstrap(), true); assert.equal(await store.getState().startLife(input, seed), true);
      writeTrace({ commandIndex: commandIndex++, mode: 'sqlite', command: { type: 'StartLife', input, seed, birthDate }, revision: store.getState().world.revision });
      assert.equal(await store.getState().acknowledgeBirth(), true); world = store.getState().world;
      writeTrace({ commandIndex: commandIndex++, mode: 'sqlite', command: { type: 'acknowledgeBirth' }, revision: world.revision });
      const birthText = encodeWorld(world), birthRows = canonical(rows()); sqlite.close();
      const reopened = new SaveRepository(connect()), initialCold = createGameStore({ repository: async () => reopened, date: () => birthDate, id: () => id });
      assert.equal(await initialCold.getState().bootstrap(), true); assert.equal(encodeWorld(initialCold.getState().world), birthText); assert.equal(canonical(rows()), birthRows);
      world = initialCold.getState().world; const versions = { world: world.schemaVersion, engine: world.engineVersion, content: world.contentVersion }; assert.deepEqual(versions, expectedVersions);
      const birthProof = { databaseFile, revision: world.revision, worldSha256: sha(birthText), allEightTablesSha256: sha(birthRows), closedConnectionReopenedExact: true };
      assert.equal(Object.keys(rows()).length, 8);
      const timeline = [{ phase: 'birth', commandIndex: 0, revision: 0, date: birthDate, age: 0 }], milestones = new Set(['birth']), coldChecks = {}, coldProof = [], interviews = [], decisions = [], reputation = [], annual = [], companyFundingMonths = new Set();
      let startupId = null, familyPreferencesChosen = false, companyFunding = 0n, manualPosts = 0, maxFame = 0;
      const player = () => world.people[world.activePersonId], ownAccount = () => world.socialAccounts.find(item => item.ownerId === world.activePersonId && item.platform === 'photogram');
      const livingReserve = () => rules[player().country].livingCost * 6n;
      const mark = (name, details = {}) => { if (!milestones.has(name)) { milestones.add(name); timeline.push({ phase: name, commandIndex: commandIndex - 1, revision: world.revision, date: world.date, age: ageOn(player(), world.date), ...details }); } };
      const observe = () => {
        const person = player(), account = ownAccount(); maxFame = Math.max(maxFame, person.stats.fame, person.publicLife.peakFame);
        if (world.schoolCommunities.some(item => item.personId === person.id && item.periods.length)) mark('school');
        if (account) mark('social', { accountId: account.id, baselineFollowers: account.baselineFollowers });
        if (person.stats.fame >= 50) mark('fame50', { fame: person.stats.fame, followers: account?.followers ?? 0 });
        if (world.businesses.some(item => item.founderId === person.id)) mark('business', { businessId: world.businesses.find(item => item.founderId === person.id).id });
        if (world.sponsorships.some(item => item.ownerId === person.id && item.earned > 0n)) mark('brandEarned');
        if (world.holdings.some(item => item.ownerId === person.id && item.quantity > 0n)) mark('investment');
        if (childrenOf(world).length) mark('family', { childIds: childrenOf(world).map(child => child.id) });
        if (person.died) mark('death', { cause: person.causeOfDeath });
      };
      let maximumCanonicalBytes = 0, maximumCheckpointBytes = 0;
      const cold = label => { const checked = checkpointRoundTrip(world, { encodeWorld, packCheckpoint, unpackCheckpoint }); world = checked.world; coldChecks[label] = (coldChecks[label] ?? 0) + 1; maximumCanonicalBytes = Math.max(maximumCanonicalBytes, checked.proof.canonicalBytes); maximumCheckpointBytes = Math.max(maximumCheckpointBytes, checked.proof.checkpointBytes); if (label === 'annual' || label === 'death' || coldChecks[label] === 1) coldProof.push({ label, revision: world.revision, ...checked.proof }); };
      const run = command => {
        assert.ok(commandIndex < 30000, 'Command guard'); const before = world;
        world = resolveCommand(world, command, true); assert.equal(world.revision, before.revision + 1); assert.ok(world.date.year * 12 + world.date.month >= before.date.year * 12 + before.date.month);
        writeTrace({ commandIndex: commandIndex++, mode: 'pure-engine', command, beforeRevision: before.revision, revision: world.revision, date: world.date, age: ageOn(player(), world.date), pending: world.pending?.templateId ?? world.pending?.kind ?? null }); observe();
        if (!['advance', 'resume', 'acknowledge', 'choose'].includes(command.type)) cold(command.type + 'Result');
      };
      const fundCompany = () => {
        const company = world.businesses.find(item => item.id === startupId && item.ownerId === world.activePersonId && item.status === 'active');
        if (!company || isConfined(world) || player().legal.wanted) return false;
        const key = world.date.year * 12 + world.date.month, arrears = world.businessPayables.filter(item => item.businessId === company.id).reduce((sum, item) => sum + item.principal, 0n);
        const needed = businessReserve(world, company) * 3n + arrears - company.cash, spare = availableCash(accountFor(world)) - livingReserve(), amount = needed < spare ? needed : spare;
        if (amount <= 0n || companyFundingMonths.has(key)) return false;
        companyFundingMonths.add(key); const personalCash = accountFor(world).cash, companyCash = company.cash, earnedProfit = company.cumulativeProfit;
        run({ type: 'fund-business', businessId: company.id, amount }); const after = world.businesses.find(item => item.id === company.id);
        assert.equal(accountFor(world).cash, personalCash - amount); assert.equal(after.cash, companyCash + amount); assert.equal(after.cumulativeProfit, earnedProfit); companyFunding += amount; return true;
      };
      const drain = () => {
        let guard = 0;
        while ((world.pending || world.annual) && !player().died && guard++ < 300) {
          if (world.pending?.kind === 'decision') {
            const event = world.pending, choice = selectChoice(event, milestones.has('business'), item => !choiceUnavailable(world, item));
            if (event.templateId === 'brand-offer') decisions.push({ type: 'brand-offer', date: world.date, choiceId: choice.id, reason: milestones.has('business') ? 'company milestone already reached; actual eligible offer' : 'company milestone not reached; preserve preregistered order' });
            run({ type: 'choose', eventId: event.id, choiceId: choice.id }); cold('decisionResult');
          } else if (world.pending) run({ type: 'acknowledge', resultId: world.pending.id });
          else if (!world.annual.pausedForPlanning || !fundCompany()) run({ type: 'resume' });
        }
        assert.ok(guard < 300, 'Annual/pending guard');
      };
      const act = command => { run(command); drain(); };
      phase = 'natural-play';
      for (let year = 0; year < 150 && !player().died; year++) {
        const age = ageOn(player(), world.date), rule = rules[player().country];
        const healthyRoutine = { exercise: 'walking', diet: 'balanced', sleep: 'restful', mindfulness: true, smoking: false, drinking: 'none' };
        if (age >= 6 && Object.keys(healthyRoutine).some(key => healthyRoutine[key] !== player().health.routine[key])) act({ type: 'health-routine', routine: healthyRoutine });
        if (['primary', 'secondary'].includes(player().education.stage) && !hospitalized(world, player()) && !isConfined(world)) {
          if (player().education.effort !== 'focused') act({ type: 'study-effort', effort: 'focused' });
          if (player().education.lastStudyYear !== world.date.year) act({ type: 'study' });
        }
        if (age >= 13 && !ownAccount() && !isConfined(world)) { act({ type: 'create-social', platform: 'photogram', handle: 'life_creator_' + seed, bio: 'Original moments from an ordinary life.' }); assert.equal(ownAccount().baselineFollowers, 0); assert.equal(ownAccount().followers, 0); }
        if (ownAccount()?.status === 'active' && ownAccount().cadence !== 'weekly') act({ type: 'social-routine', accountId: ownAccount().id, cadence: 'weekly', topic: 'photo', intent: 'authentic' });
        if (!player().finance.pensionAnnual && age < rule.retirementAge && (!player().employment || jobs.find(item => item.id === player().employment.roleId)?.partTime && player().education.stage === 'none')) {
          for (const roleId of age < rule.adultAge ? ['cafe-part', 'shop-assistant-part'] : ['administrator', 'retail', 'cleaner']) {
            const role = jobs.find(item => item.id === roleId); if (jobReason(world, role)) continue;
            const cash = accountFor(world).cash; run({ type: 'apply-job', roleId }); cold('unansweredInterview'); assert.equal(world.pending?.templateId, 'job-interview'); drain(); assert.equal(accountFor(world).cash, cash, 'No upfront wage at interview');
            interviews.push({ date: world.date, age, roleId, accepted: player().employment?.roleId === roleId }); if (player().employment?.roleId === roleId) break;
          }
        }
        if (ownAccount()?.status === 'active' && !monetisationReason(world, ownAccount())) act({ type: 'monetise-social', accountId: ownAccount().id });
        const reputationFee = publicActionQuote(world, 'reputation');
        if (reputationAllowed({ age, fame: player().stats.fame, available: availableCash(accountFor(world)), reserve: livingReserve(), fee: reputationFee.minor, confined: isConfined(world), absent: !!activeTrip(world) || !!serviceAway(world), used: !!world.actionCounts[player().id + ':social-media:' + world.date.year + ':public:reputation'] })) {
          const cashBefore = accountFor(world).cash, imageBefore = player().publicLife.image; act({ type: 'public-action', action: 'reputation' }); assert.equal(accountFor(world).cash, cashBefore - reputationFee.minor); reputation.push({ date: world.date, cost: reputationFee, imageBefore, imageAfter: player().publicLife.image });
        }
        for (let attempt = 0; attempt < 6 && ownAccount()?.status === 'active'; attempt++) {
          const account = ownAccount(), used = world.actionCounts[player().id + ':social-media:' + world.date.year + ':post:' + account.id] ?? 0;
          if (used >= 6) break; const polished = availableCash(accountFor(world)) - livingReserve() > postCost(world, 'polished').minor * 10n, intent = polished ? 'polished' : 'authentic';
          if (postReason(world, account, 'photo', intent)) break;
          act({ type: 'publish-post', accountId: account.id, kind: 'photo', intent, caption: 'An original moment in ' + world.date.year + '.', sponsored: false, liveMinutes: 0 }); manualPosts++;
        }
        if (!startupId && milestones.has('fame50') && !businessStartReason(world, 'cafe', 'manager')) {
          const quote = businessStartupQuote(world, 'cafe');
          if (availableCash(accountFor(world)) >= quote.total + livingReserve()) {
            const beforeCash = accountFor(world).cash; act({ type: 'start-business', kind: 'cafe', name: 'Original Days ' + country, operation: 'manager', quotedCapital: quote.capital });
            const company = world.businesses.find(item => item.founderId === player().id); startupId = company.id; assert.equal(beforeCash - accountFor(world).cash, quote.total); assert.equal(company.cash + company.equipment, quote.capital - agencyFee(company) * 2n); cold('fundedCompany');
          }
        }
        if (fundCompany()) drain();
        if (milestones.has('business') && ownAccount()?.status === 'active' && !sponsorReason(world, ownAccount()) && !world.actionCounts[player().id + ':social-media:' + world.date.year + ':sponsor:' + ownAccount().id]) act({ type: 'seek-sponsor', accountId: ownAccount().id });
        if (milestones.has('business') && milestones.has('brandEarned') && !milestones.has('investment') && age >= rule.adultAge && !isConfined(world)) {
          const spare = availableCash(accountFor(world)) - livingReserve(), budget = spare > 0n ? spare / 10n : 0n, quantity = quantityWithinBudget(budget, count => investmentQuote(world, 'GROVE', count));
          if (quantity) { const quote = investmentQuote(world, 'GROVE', quantity), beforeCash = accountFor(world).cash, companyCash = world.businesses.map(item => [item.id, item.cash]); act({ type: 'buy-investment', instrumentId: 'GROVE', quantity, quotedMinor: quote.value }); assert.equal(accountFor(world).cash, beforeCash - quote.buyCost); assert.deepEqual(world.businesses.map(item => [item.id, item.cash]), companyCash); }
        }
        if (milestones.has('investment') && !milestones.has('family') && age >= 21 && age <= 65 && !isConfined(world) && !activeTrip(world) && !serviceAway(world)) {
          if (!familyPreferencesChosen) { if (!player().wantsChildren) act({ type: 'relationship-preferences', attractedTo: player().attractedTo, wantsChildren: true }); familyPreferencesChosen = true; }
          const relation = partnerRelation(world), partner = relation && otherPerson(world, relation);
          if (player().stats.health >= 40 && player().householdId && (player().employment || player().finance.pensionAnnual > 0n) && !hospitalized(world, player()) && (!partner || partner.wantsChildren && partner.stats.health >= 40 && !hospitalized(world, partner) && !serviceAway(world, partner.id)) && availableCash(accountFor(world)) >= adoptionFee(world) + livingReserve() && !world.actionCounts[player().id + ':adopt:' + world.date.year]) act({ type: 'adopt', age: 2 });
        }
        if (age >= rule.retirementAge && player().employment && player().finance.serviceMonths >= 120 && !player().finance.pensionAnnual) act({ type: 'retire' });
        const account = ownAccount(), company = world.businesses.find(item => item.id === startupId);
        annual.push({ date: world.date, age, fame: player().stats.fame, publicImage: player().publicLife.image, brandReason: account ? sponsorReason(world, account) ?? null : 'No actual profile', cash: accountFor(world).cash, posts: account?.totalPosts ?? 0, followers: account?.followers ?? 0, company: company ? { id: company.id, status: company.status, cash: company.cash, equity: businessValue(world, company), cumulativeProfit: company.cumulativeProfit, dividends: company.dividends } : null });
        run({ type: 'advance' }); drain(); cold('annual');
      }
      assert.ok(player().died, 'Natural death must occur before the fixed 150-year guard'); cold('death');
      const estate = world.estates.find(item => item.personId === player().id); assert.ok(estate); const estateProof = assertEstateConservation(estate), estateReceipts = assertEstateReceipts(world, estate);
      for (const account of world.socialAccounts.filter(item => item.ownerId === player().id && item.status !== 'deleted')) assert.equal(account.status, 'memorial');
      const cashChanges = new Map(), debtChanges = new Map();
      for (const row of world.ledger) { cashChanges.set(row.accountId, (cashChanges.get(row.accountId) ?? 0n) + row.cashDelta); if (row.liabilityId) debtChanges.set(row.liabilityId, (debtChanges.get(row.liabilityId) ?? 0n) + row.debtDelta); }
      for (const account of world.accounts) assert.equal(account.cash, account.openingCash + (cashChanges.get(account.id) ?? 0n));
      for (const debt of world.liabilities) assert.equal(debt.principal, debtChanges.get(debt.id) ?? 0n);
      for (const company of world.businesses) { const book = world.businessLedger.filter(row => row.businessId === company.id); assert.equal(company.cash, book.reduce((sum, row) => sum + row.cashDelta, 0n)); assert.equal(company.cumulativeProfit, company.months.reduce((sum, row) => sum + row.profit, 0n) + company.archives.reduce((sum, row) => sum + row.profit, 0n)); }
      for (const deal of world.sponsorships.filter(item => item.ownerId === player().id)) { assert.equal(deal.earned, deal.deliveries.reduce((sum, row) => sum + row.paid, 0n)); for (const delivery of deal.deliveries) assert.ok(delivery.paid === 0n || delivery.posts >= deal.requiredPosts && delivery.paid === deal.monthlyPay.minor, 'Only actual sufficient delivery may be paid; suspension may still prevent payment'); }
      const sponsorshipByCurrency = new Map(), creatorByCurrency = new Map();
      for (const deal of world.sponsorships.filter(item => item.ownerId === player().id)) sponsorshipByCurrency.set(deal.monthlyPay.currency, (sponsorshipByCurrency.get(deal.monthlyPay.currency) ?? 0n) + deal.earned);
      for (const account of world.socialAccounts.filter(item => item.ownerId === player().id)) {
        assert.equal(account.income, account.posts.reduce((sum, post) => sum + post.income.minor, 0n) + account.archived.reduce((sum, entry) => sum + entry.income, 0n));
        creatorByCurrency.set(account.currency, (creatorByCurrency.get(account.currency) ?? 0n) + account.income);
      }
      for (const [category, expected] of [['sponsorship', sponsorshipByCurrency], ['creator-income', creatorByCurrency]]) {
        const received = new Map(); for (const row of world.ledger) if (row.personId === player().id && row.category === category) received.set(row.currency, (received.get(row.currency) ?? 0n) + row.cashDelta);
        for (const currency of new Set([...expected.keys(), ...received.keys()])) assert.equal(received.get(currency) ?? 0n, expected.get(currency) ?? 0n, category + ' receipts must match actual per-currency delivery');
      }
      assert.equal(world.revision, commandIndex - 1, 'Initial save and every actual command must account for revisions');
      const checkpoint = checkpointRoundTrip(world, { encodeWorld, packCheckpoint, unpackCheckpoint }), finalCheckpointFile = path.join(directory, 'final.checkpoint.json'); fs.writeFileSync(finalCheckpointFile, checkpoint.payload);
      assert.equal(canonical(rows()), birthRows, 'Pure-engine progression must not be described as SQLite gameplay saves'); sqlite.close();
      const coverageReport = coverage(timeline), account = ownAccount();
      const traceSha256 = traceHash.digest('hex'); assert.equal(sha(fs.readFileSync(traceFile)), traceSha256, 'Saved canonical trace must match its reported hash');
      const row = { country, seed, versions, ageAtDeath: ageOn(player(), world.date), causeOfDeath: player().causeOfDeath, commands: commandIndex, birthProof, productionCheckpointChecks: coldChecks, coldProof, maximumCanonicalBytes, maximumCheckpointBytes, finalCheckpointFile, finalCheckpointProof: checkpoint.proof, traceFile, traceSha256, timeline, coverage: coverageReport, unmet: coverageReport.unreached.map(goal => ({ goal, reason: 'Not reached by the preregistered policy before natural death', maxFame, ageAtDeath: ageOn(player(), world.date) })), maxFame, interviews, decisions, reputation, manualPosts, social: account ? { id: account.id, baselineFollowers: account.baselineFollowers, totalPosts: account.totalPosts, followers: account.followers, peakFollowers: account.peakFollowers, income: account.income, status: account.status, viralPosts: account.posts.filter(post => post.response === 'viral').length + account.archived.reduce((sum, entry) => sum + entry.virals, 0) } : null, sponsorships: world.sponsorships.filter(item => item.ownerId === player().id), companies: world.businesses.filter(item => item.founderId === player().id), companyFunding, holdings: world.holdings.filter(item => item.ownerId === player().id), childIds: childrenOf(world).map(child => child.id), estate, estateProof, estateReceipts, annual, finalWorldSha256: sha(encodeWorld(world)), elapsedMs: Date.now() - began };
      records.push(row); fs.writeFileSync(path.join(directory, 'result.json'), canonical(row) + '\n'); process.stderr.write(canonical({ event: 'entrepreneur-life-complete', country, seed, ageAtDeath: row.ageAtDeath, coverage: coverageReport, maxFame, commands: commandIndex, elapsedMs: row.elapsedMs }) + '\n');
    }
    const sourceAfter = sources(root); assert.deepEqual(sourceAfter, sourceBefore, 'Frozen source must remain exact');
    const result = { format: 'dreams-natural-entrepreneur-policy-v2', policyVersion, status: 'integrity-passed', scope, versions: expectedVersions, sourceBefore, sourceAfter, cohort: { seeds: options.countries.map(country => 900 + countryCodes.indexOf(country)), count: records.length, additionalAnnualPolicySeeds: 0 }, orderedScenarioCComplete: records.filter(row => row.coverage.orderedScenarioCComplete).length, records, elapsedMs: Date.now() - started };
    fs.writeFileSync(path.join(folder, 'result.json'), canonical(result) + '\n'); process.stdout.write(canonical(result) + '\n'); return result;
  } catch (error) {
    const diagnostic = path.join(folder, 'failure.json'); fs.writeFileSync(diagnostic, canonical({ phase, country: activeCountry, error: error.stack, sourceBefore, completed: records.length, trace, lastValidWorld: world ? encodeWorld(world) : null }) + '\n');
    process.stdout.write(canonical({ format: 'dreams-natural-entrepreneur-policy-v2', policyVersion, status: 'failed', scope, sourceBefore, sourceAfter: sources(root), completed: records.length, records, diagnostic, error: error.message }) + '\n'); throw error;
  }
}
module.exports = { policyVersion, expectedVersions, phases, canonical, coverage, selectChoice, quantityWithinBudget, reputationAllowed, assertEstateConservation, checkpointRoundTrip, assertEstateReceipts, parseOptions };
if (require.main === module) main().catch(error => { process.stderr.write(error.stack + '\n'); process.exitCode = 1; });
