// Derive workloads through actual commands from the published natural lives.
// No money, dates, people, health, old outcomes or random streams are patched.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { gunzipSync } = require('node:zlib'), { createHash } = require('node:crypto'), ts = require('typescript');
const flags = {}; for (let i = 2; i < process.argv.length; i += 2) flags[process.argv[i]] = process.argv[i + 1];
const source = path.resolve(flags['--source'] ?? path.join(__dirname, '..'));
const input = path.resolve(flags['--input'] ?? path.join(__dirname, '../docs/verification/final-polish/performance-core/workloads.json.gz'));
const output = flags['--output'], active = flags['--active'] === 'yes';
assert(output, 'Pass --output with a derived workload path');
const sha = value => createHash('sha256').update(value).digest('hex');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
const load = file => require(path.join(source, 'src/game/' + file + '.ts'));
const { encodeWorld, moneyJSON } = load('model'), { resolveCommand } = load('engine');
const { packCheckpoint, unpackCheckpoint } = require(path.join(source, 'src/persistence/checkpoints.ts'));
const { assetCatalog } = load('content/assets'), { purchaseQuote } = load('systems/assets');
const { amenityQuote } = load('systems/propertyAmenities'), { askingRent } = load('systems/landlordTenancies');
const { licenceFee } = load('systems/vehicleLicences'), { vehicleActivityCost } = load('systems/vehicleActivities');
const { petAdoptionFee } = load('systems/pets'), { hobbyFee } = load('systems/leisure');
const bytes = fs.readFileSync(input), fixture = JSON.parse((input.endsWith('.gz') ? gunzipSync(bytes) : bytes).toString('utf8'));
fixture.snapshots = fixture.snapshots.filter(snapshot => [50, 70, 90].includes(snapshot.summary.age));
for (const snapshot of fixture.snapshots) {
  let world = unpackCheckpoint(snapshot.payload); const original = world, preparationCommands = [];
  const command = cmd => { world = resolveCommand(world, cmd, true); preparationCommands.push(cmd); };
  const act = cmd => { command(cmd); let guard = 0; while (world.pending && guard++ < 10) { assert.equal(world.pending.kind, 'result', 'Preparation must not silently choose an incidental decision'); command({ type: 'acknowledge', resultId: world.pending.id }); } assert(guard < 10 && !world.pending && !world.annual); };
  act({ type: 'enable-lifestyle' });
  if (active) {
    const home = assetCatalog.find(row => row.id === 'mobile-home');
    act({ type: 'buy-asset', catalogId: home.id, financing: 'cash', depositBps: 10000, termMonths: 120, quotedPrice: purchaseQuote(world, home, 'cash').price });
    const homeId = world.assets.at(-1).id;
    act({ type: 'enable-property-management', assetId: homeId });
    act({ type: 'install-amenity', assetId: homeId, amenity: 'kitchen', quotedCost: amenityQuote(world.assets.at(-1), 'kitchen').cost });
    act({ type: 'find-tenants', assetId: homeId, quotedRent: askingRent(world.assets.at(-1)) });
    const applicant = world.lifestyle.applications.find(row => row.funds >= world.assets.at(-1).rentPerMonth * 2n);
    assert(applicant, 'Actual saved applications need a funded applicant');
    act({ type: 'review-tenant', applicationId: applicant.id, action: 'accept', quotedDeposit: world.assets.at(-1).rentPerMonth });
    act({ type: 'take-licence-test', kind: 'road', answers: [1, 2, 0], quotedFee: licenceFee(world, 'road') });
    const car = assetCatalog.find(row => row.id === 'used-compact');
    act({ type: 'buy-asset', catalogId: car.id, financing: 'cash', depositBps: 10000, termMonths: 120, quotedPrice: purchaseQuote(world, car, 'cash').price });
    const carId = world.assets.at(-1).id;
    act({ type: 'enable-vehicle-activities', assetId: carId });
    act({ type: 'vehicle-activity', assetId: carId, activity: 'drive', contactId: null, quotedCost: vehicleActivityCost(world, world.assets.at(-1), 'drive') });
    act({ type: 'adopt-pet', offerId: 'buddy', name: 'Buddy', reviewedOwnerId: world.activePersonId, quotedFee: petAdoptionFee(world, 'buddy') });
    act({ type: 'hobby-plan', kind: 'writing', mode: 'community', reviewedPayerId: world.activePersonId, quotedMonthlyFee: hobbyFee(world.people[world.activePersonId].country, 'writing', 'community') });
    assert.equal(world.lifestyle.tenancies.length, 1); assert.equal(world.pets.length - original.pets.length, 1);
    assert.equal(world.hobbies.length - original.hobbies.length, 1);
  }
  assert.deepEqual(world.date, original.date, 'Preparation must not advance or rewrite the saved date');
  snapshot.preparationCommands = preparationCommands;
  snapshot.preparationOutcome = { actorId: world.activePersonId, date: world.date, random: world.random, cash: world.accounts.filter(row => row.ownerId === world.activePersonId).map(row => ({ currency: row.currency, cash: row.cash })), addedPeople: Object.keys(world.people).length - Object.keys(original.people).length, newLedgerRows: world.ledger.slice(original.ledger.length), lifestyle: world.lifestyle, newAssets: world.assets.slice(original.assets.length), newPets: world.pets.slice(original.pets.length), newHobbies: world.hobbies.slice(original.hobbies.length) };
  snapshot.summary.originSha256 = snapshot.summary.sha256;
  snapshot.summary.sha256 = sha(encodeWorld(world)); snapshot.summary.people = Object.keys(world.people).length;
  snapshot.summary.ledgerRows = world.ledger.length; snapshot.summary.journalRows = world.journal.length; snapshot.summary.revision = world.revision;
  snapshot.payload = packCheckpoint(world);
}
fixture.scope = active ? 'Actual enable, modest cash home/kitchen, funded named tenancy/deposit, licence, used car/40-mile trip, dog adoption and paid writing routine commands from published ages50/70/90. No funds, dates, people, health or random streams patched. Routine has not yet attended a month at preparation.' : 'Actual explicit lifestyle enable and result acknowledgement commands from published ages50/70/90, no active new lifestyle histories or patched values.';
fixture.originInputSha256 = sha(bytes);
fs.writeFileSync(output, JSON.stringify(fixture, moneyJSON));
if (flags['--proof']) fs.writeFileSync(flags['--proof'], JSON.stringify({ scope: fixture.scope, originInputSha256: fixture.originInputSha256, outputSha256: sha(fs.readFileSync(output)), snapshots: fixture.snapshots.map(({ payload, ...row }) => row) }, moneyJSON, 2) + '\n');
console.log({ output, snapshots: fixture.snapshots.length, active });
