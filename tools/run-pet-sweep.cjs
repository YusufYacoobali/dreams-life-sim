// Deterministic cloud engine journeys, with real adoption/vet commands and no fixture cash.
// This is not native, all-choice, 120-year or multi-generation acceptance.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), { createHash } = require('node:crypto'), ts = require('typescript');
const root = path.join(__dirname, '..');
const sourceHash = () => {
  const hash = createHash('sha256');
  const visit = directory => { for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.join(directory, entry.name); if (entry.isDirectory()) visit(file); else if (file.endsWith('.ts')) hash.update(path.relative(root, file)).update('\0').update(fs.readFileSync(file)).update('\0');
  } }; visit(path.join(root, 'src/game')); return hash.digest('hex');
};
const hash = sourceHash();
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
const { createLife, randomCreation } = require('../src/game/createLife.ts'), { countries, countryCodes } = require('../src/game/countries.ts'), { resolveCommand } = require('../src/game/engine.ts'), { ageOn, encodeWorld, decodeWorld } = require('../src/game/model.ts'), { choiceUnavailable } = require('../src/game/choiceAvailability.ts'), { petAdoptionOwner, petAdoptionFee, petAdoptionReason, petCareReason, petVetCost } = require('../src/game/systems/pets.ts');
const started = Date.now(), records = [];
for (const [index, country] of countryCodes.entries()) {
  const seed = 700 + index, began = Date.now(); let world = { ...createLife('life_pet_sweep_' + seed, seed, { ...randomCreation(seed), country, city: countries[country].cities[0], background: 'ordinary' }, { year: 2000, month: 1, day: 1 }), birthAcknowledged: true }, commands = 0;
  const run = command => { world = resolveCommand(world, command); commands++; };
  const vet = () => {
    const pet = world.pets.find(item => item.status === 'active' && item.illness === 'infection' && !petCareReason(world, item, 'vet'));
    if (!pet) return false;
    run({ type: 'pet-vet', petId: pet.id, reviewedOwnerId: pet.ownerId, quotedFee: petVetCost(pet.country) }); return true;
  };
  for (let year = 0; year < 150 && !world.people[world.activePersonId].died; year++) {
    if (!world.pets.length && !petAdoptionReason(world, 'buddy')) run({ type: 'adopt-pet', offerId: 'buddy', name: 'Buddy', reviewedOwnerId: petAdoptionOwner(world).id, quotedFee: petAdoptionFee(world, 'buddy') });
    let guard = 0;
    const drain = () => {
      while ((world.pending || world.annual) && !world.people[world.activePersonId].died && guard++ < 200) {
        if (world.pending?.kind === 'decision') { const choice = world.pending.choices.find(item => !choiceUnavailable(world, item)); assert.ok(choice); run({ type: 'choose', eventId: world.pending.id, choiceId: choice.id }); }
        else if (world.pending) run({ type: 'acknowledge', resultId: world.pending.id });
        else if (!vet()) run({ type: 'resume' });
      }
      assert.ok(guard < 200, 'Year must close');
    };
    drain(); if (world.people[world.activePersonId].died) break;
    if (vet()) drain(); run({ type: 'advance' }); drain();
  }
  assert.ok(world.people[world.activePersonId].died, 'Journey must reach an actual death');
  const encoded = encodeWorld(world); assert.equal(encodeWorld(decodeWorld(encoded)), encoded, 'Cold codec round trip must preserve the entire world');
  assert.ok(world.pets.length, 'This journey must adopt an actual pet');
  records.push({ seed, country, ageAtDeath: ageOn(world.people[world.activePersonId], world.date), commands, attempts: world.petAdoptions.length, pets: world.pets.map(pet => ({ id: pet.id, status: pet.status, ending: pet.endKind, ownerChanges: pet.owners.length - 1, periods: pet.periods.length, unfundedPeriods: pet.periods.filter(item => item.care === 'unfunded').length, boardingPeriods: pet.periods.filter(item => item.care === 'boarding').length, visits: pet.visits.length })), ledgerRows: world.ledger.length, coldRoundTripExact: true, elapsedMs: Date.now() - began });
  process.stderr.write(JSON.stringify(records.at(-1)) + '\n');
}
assert.equal(sourceHash(), hash, 'Game source changed during the sweep');
process.stdout.write(JSON.stringify({ scope: 'twelve country-specific birth-to-death pure-engine journeys; first available choices, adopt one dog when eligible, treat recorded infection when eligible; no fixture cash/RNG/outcome changes; not native, all-choice, 120-year or multi-generation acceptance', sourceHash: hash, worldVersion: 26, engineVersion: 25, contentVersion: 4, node: process.version, elapsedMs: Date.now() - started, records }, null, 2) + '\n');
