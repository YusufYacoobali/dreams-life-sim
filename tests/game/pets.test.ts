import { gunzipSync, strFromU8 } from 'fflate';
import { countries, countryCodes } from '../../src/game/countries';
import { monthFrom } from '../../src/game/calendar';
import { GameCommand, recordDeath, resolveCommand } from '../../src/game/engine';
import { decodeWorld, encodeWorld, validateWorld, World } from '../../src/game/model';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { randomInteger } from '../../src/game/random';
import { petOffers, petOfferIds } from '../../src/game/content/pets';
import { accountFor, post } from '../../src/game/systems/common';
import { petAdoptionFee, petAdoptionOwner, petAdoptionReason, petAgeMonths, petCareReason, petFoodCost, petBoardingCost, petVetCost, petMonth, PetCommand } from '../../src/game/systems/pets';
import { householdPets } from '../../src/game/systems/petSchemas';
import { financialActors, ownHousehold } from '../../src/game/systems/households';
import { resolveTravel, travelMonth, tripQuote } from '../../src/game/systems/travel';
import { resolveLegal, isConfined } from '../../src/game/systems/legal';
import { addCondition, emergencyCare } from '../../src/game/systems/health';
import { addChild } from '../../src/game/systems/family';
import { endEmployment } from '../../src/game/systems/work';
import { moveQuote, relocationFee } from '../../src/game/systems/relocation';
import { decodeSave } from '../../src/persistence/archive';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import archive from '../fixtures/v25-content4-bubble-archive.json';
import serviceArchive from '../fixtures/v16-service-archive.json';
import { pupil } from '../support/pupil';
import { offerPending } from '../../src/game/pendingQueue';
import { bindEvent, eventTemplates } from '../../src/game/content/events';

function drain(world: World, annual = false): World {
  let guard = 0;
  while ((world.pending || annual && world.annual) && guard++ < 150) {
    if (world.pending?.kind === 'decision') { const choice = world.pending.choices.find(item => !choiceUnavailable(world, item))!; world = resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: choice.id }); }
    else if (world.pending) world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
    else world = resolveCommand(world, { type: 'resume' });
  }
  if (guard >= 150) throw new Error('Unfinished test cursor'); return world;
}
const act = (world: World, command: GameCommand) => drain(resolveCommand(world, command));
function consent(world: World, accepted: boolean) {
  const owner = petAdoptionOwner(world)!, player = world.people[world.activePersonId], edge = world.relationships.find(item => [item.from, item.to].includes(owner.id) && [item.from, item.to].includes(player.id))!, chance = Math.min(95, 45 + Math.floor(edge.strength / 2));
  world.random.npcs = Array.from({ length: 1000 }, (_, i) => i + 1).find(seed => (randomInteger(seed, 1, 100).value <= chance) === accepted)!;
}
function adoptCommand(world: World, offerId: typeof petOfferIds[number] = 'buddy'): PetCommand { return { type: 'adopt-pet', offerId, name: petOffers[offerId].name, reviewedOwnerId: petAdoptionOwner(world)!.id, quotedFee: petAdoptionFee(world, offerId) }; }
function adopted(world = pupil('US', 8), offerId: typeof petOfferIds[number] = 'buddy') { consent(world, true); return act(world, adoptCommand(world, offerId)); }
function month(world: World) { world.date = monthFrom(world.date, 1, world.calendarAnchorDay); travelMonth(world); petMonth(world); return drain(validateWorld(world)); }
function fund(world: World, personId = petAdoptionOwner(world)!.id) { post(world, 10000000000n, 0n, 'fixture-funding', 'Pet fixture funding', null, world.people[personId]); }
function asPerson(world: World, personId: string, action: () => void) { const player = world.activePersonId; world.activePersonId = personId; try { action(); } finally { world.activePersonId = player; } }

test.each(countryCodes)('%s childhood adoption names the real payer, saves consent, bills real monthly care once and preserves all identities cold', country => {
  let world = pupil(country, 8); consent(world, true); const owner = petAdoptionOwner(world)!, fee = petAdoptionFee(world, 'buddy'), before = accountFor(world, owner).cash, childCash = accountFor(world).cash, people = Object.keys(world.people), rng = { ...world.random };
  world = adopted(world); const pet = world.pets[0];
  expect(pet).toMatchObject({ ownerId: owner.id, adoptedById: world.activePersonId, adoptionFee: fee, adoptionCurrency: countries[country].currency, status: 'active', periods: [], moves: [] });
  expect(accountFor(world, world.people[owner.id]).cash).toBe(before - fee); expect(accountFor(world).cash).toBe(childCash); expect(Object.keys(world.people)).toEqual(people); expect(world.random.economy).toBe(rng.economy); expect(world.random.events).toBe(rng.events); expect(world.people[world.activePersonId].education.qualifications).toEqual([]);
  world = month(world); expect(world.pets[0].periods[0]).toMatchObject({ ownerId: owner.id, currency: countries[country].currency, foodDue: petFoodCost(country, 'dog'), boardingDue: 0n, paid: petFoodCost(country, 'dog'), care: 'owner', carerId: owner.id });
  const exact = encodeWorld(world); petMonth(world); expect(encodeWorld(world)).toBe(exact); expect(decodeWorld(exact)).toEqual(world); expect(householdPets(world).map(item => item.id)).toEqual([pet.id]);
});
test('refused consent charges no fee, creates no pet and cannot be requested again that calendar year or rerolled by loading', () => {
  const world = pupil('US', 8); consent(world, false); const money = structuredClone(world.accounts), command = adoptCommand(world), before = encodeWorld(world), next = act(world, command);
  expect(next.petAdoptions[0].accepted).toBe(false); expect(next.pets).toEqual([]); expect(next.accounts).toEqual(money); expect(next.ledger).toEqual(world.ledger); expect(act(world, command)).toEqual(next); expect(encodeWorld(world)).toBe(before); expect(() => resolveCommand(next, command)).toThrow(/already requested/); expect(decodeWorld(encodeWorld(next))).toEqual(next);
});
test('young children, absent parents, missing households, unaffordable fees and changed reviewed payer cannot invent an adoption or debit another adult', () => {
  const young = pupil('US', 5); expect(petAdoptionReason(young, 'buddy')).toMatch(/age six/);
  let world = pupil('US', 8), owner = petAdoptionOwner(world)!, command = adoptCommand(world), before = encodeWorld(world);
  expect(() => resolveCommand(world, { ...command, quotedFee: 1n } as PetCommand)).toThrow(/fee/); expect(encodeWorld(world)).toBe(before);
  ownHousehold(world, owner); expect(petAdoptionOwner(world)!.id).not.toBe(owner.id); expect(() => resolveCommand(world, command)).toThrow(/adult changed/);
  world = pupil('US', 8); for (const member of Object.values(world.people)) member.householdId = null; world.households = []; expect(petAdoptionOwner(world)).toBeUndefined(); expect(petAdoptionReason(world, 'buddy')).toMatch(/adult parent or guardian/);
  world = pupil('US', 8); owner = petAdoptionOwner(world)!; const bank = accountFor(world, owner); post(world, -bank.cash, 0n, 'fixture-spending', 'Spent fixture cash', null, owner); expect(petAdoptionReason(world, 'buddy')).toMatch(/cannot cover/); before = encodeWorld(world); expect(() => resolveCommand(world, adoptCommand(world))).toThrow(); expect(encodeWorld(world)).toBe(before);
});
test.each(['buddy', 'milo', 'luna', 'cleo', 'pip', 'olive'] as const)('%s preserves its distinct age/species/breed, and an adult pays without a parental random draw', offerId => {
  const world = pupil('US', 20), rng = world.random.npcs; fund(world); const next = act(world, adoptCommand(world, offerId)), pet = next.pets[0];
  expect(pet.ownerId).toBe(next.activePersonId); expect(pet.consent).toEqual({ chance: 100, roll: 100 }); expect(next.random.npcs).toBe(rng); expect(petAgeMonths(next, pet)).toBe(petOffers[offerId].ageMonths); expect(pet.species).toBe(petOffers[offerId].species); expect(pet.breed).toBe(petOffers[offerId].breed);
});
test('the four-pet limit and free optional care retain actual bounded bonds without supplying qualifications or cash', () => {
  let world = pupil('US', 20); fund(world); for (const offerId of petOfferIds.slice(0, 4)) world = act(world, adoptCommand(world, offerId)); expect(world.pets).toHaveLength(4); expect(petAdoptionReason(world, 'pip')).toMatch(/four/);
  const pet = world.pets[0], money = structuredClone(world.accounts), rng = { ...world.random }; world = act(world, { type: 'pet-care', petId: pet.id, activity: 'walk' }); expect(world.pets[0].bonds[world.activePersonId]).toBe(33); expect(world.accounts).toEqual(money); expect(world.random).toEqual(rng); expect(() => resolveCommand(world, { type: 'pet-care', petId: pet.id, activity: 'walk' })).toThrow(/already/); expect(petCareReason(world, world.pets[2], 'walk')).toMatch(/play/);
});
test('an actual parental holiday uses the available co-resident adult, then funds boarding after the co-resident carer moves out', () => {
  let world = adopted(); const ownerId = world.pets[0].ownerId; fund(world, ownerId); endEmployment(world, ownerId); world.random.npcs = 1;
  asPerson(world, ownerId, () => resolveTravel(world, { type: 'book-trip', destinationId: 'paris', duration: 3, companionIds: [], focus: 'sightseeing', quotedTotal: tripQuote(world, 'paris', 3, []).total })); world = drain(world); world = month(world); expect(world.pets[0].periods[0].care).toBe('family');
  const carerId = world.pets[0].periods[0].carerId!; ownHousehold(world, world.people[carerId], [world.activePersonId]); world = month(world); expect(world.pets[0].periods[1]).toMatchObject({ care: 'boarding', boardingDue: petBoardingCost('US'), carerId: null }); expect(world.pets[0].ownerId).toBe(ownerId);
});
test('two genuinely unfunded care periods record zero payments and shelter rehoming without inventing debt, sale proceeds or refunds', () => {
  let world = adopted(), owner = world.people[world.pets[0].ownerId]; post(world, -accountFor(world, owner).cash, 0n, 'fixture-spending', 'Spent fixture funds', null, owner); const ledger = world.ledger.length, debt = structuredClone(world.liabilities);
  world = month(world); expect(world.pets[0].status).toBe('active'); expect(world.pets[0].unfundedMonths).toBe(1); world = month(world); expect(world.pets[0].status).toBe('rehomed'); expect(world.pets[0].periods.every(item => item.paid === 0n && item.paymentId === null)).toBe(true); expect(world.ledger).toHaveLength(ledger); expect(world.liabilities).toEqual(debt); const exact = encodeWorld(world); petMonth(world); expect(encodeWorld(world)).toBe(exact); expect(petCareReason(world, world.pets[0], 'play')).toMatch(/current pet/);
});
test('saved illness, paid veterinary treatment and two actual funded months produce recovery without instant healing or duplicate visits', () => {
  let world = adopted(); fund(world, world.pets[0].ownerId); const illnessSeed = Array.from({ length: 10000 }, (_, i) => i + 1).find(seed => randomInteger(seed, 1, 100).value <= 2)!; world.random.outcomes = illnessSeed; world = month(world); expect(world.pets[0].illness).toBe('infection');
  const ownerId = world.pets[0].ownerId, petId = world.pets[0].id, command: PetCommand = { type: 'pet-vet', petId, reviewedOwnerId: ownerId, quotedFee: petVetCost('US') }; world.random.outcomes = 1;
  expect(() => resolveCommand(world, { ...command, reviewedOwnerId: world.activePersonId })).toThrow(/owner.*changed/); const before = world.pets[0].health; world = act(world, command); expect(world.pets[0]).toMatchObject({ illness: 'recovering', recoveryMonths: 2, health: before }); expect(world.pets[0].visits[0]).toMatchObject({ ownerId, paid: petVetCost('US'), successful: true }); expect(() => resolveCommand(world, command)).toThrow(/already/);
  world = month(world); expect(world.pets[0].illness).toBe('recovering'); world = month(world); expect(world.pets[0].illness).toBe('none'); expect(world.pets[0].health).toBe(before + 16); expect(decodeWorld(encodeWorld(world))).toEqual(world);
});
test('failed treatment remains paid and ill; an unfunded visit cannot create treatment or consume a draw', () => {
  let world = adopted(); world.pets[0].illness = 'infection'; world.random.outcomes = Array.from({ length: 1000 }, (_, i) => i + 1).find(seed => randomInteger(seed, 1, 100).value > 90)!;
  const ownerId = world.pets[0].ownerId, command: PetCommand = { type: 'pet-vet', petId: world.pets[0].id, reviewedOwnerId: ownerId, quotedFee: petVetCost('US') }; world = act(world, command); expect(world.pets[0].visits[0].successful).toBe(false); expect(world.pets[0].illness).toBe('infection'); world = month(world); const owner = world.people[ownerId]; post(world, -accountFor(world, owner).cash, 0n, 'fixture-spending', 'Spent fixture funds', null, owner); const before = encodeWorld(world); expect(() => resolveCommand(world, command)).toThrow(/fee/); expect(encodeWorld(world)).toBe(before);
});
test('actual owner death transfers responsibility to the existing local adult before guardian creation; later death rehomes without assigning a minor or a new invented carer', () => {
  let world = adopted(); const petId = world.pets[0].id, ownerId = world.pets[0].ownerId, existing = Object.keys(world.people); recordDeath(world, ownerId, 'test loss'); world = drain(validateWorld(world)); expect(world.pets[0].status).toBe('active'); expect(world.pets[0].ownerId).not.toBe(ownerId); expect(existing).toContain(world.pets[0].ownerId); expect(world.pets[0].owners).toHaveLength(2);
  recordDeath(world, world.pets[0].ownerId, 'test second loss'); world = drain(validateWorld(world)); expect(world.pets[0].status).toBe('rehomed'); expect(world.pets[0].ownerId).not.toBe(world.activePersonId); expect(world.pets[0].id).toBe(petId); expect(world.pets[0].owners).toHaveLength(2); expect(Object.keys(world.people).length).toBeGreaterThan(existing.length);
});
test('separation keeps the original owner and their actual monthly financial participation; another household cannot interact or adopt their pet', () => {
  let world = adopted(); const ownerId = world.pets[0].ownerId; ownHousehold(world, world.people[ownerId]); endEmployment(world, ownerId); expect(financialActors(world).some(person => person.id === ownerId)).toBe(true); expect(householdPets(world)).toEqual([]); expect(petCareReason(world, world.pets[0], 'play')).toMatch(/household/); world = month(world); expect(world.pets[0].ownerId).toBe(ownerId); expect(world.pets[0].periods[0].care).toBe('owner');
});
test('an adult-owned pet is rehomed explicitly without a refund and deceased companions never age, revive or receive further care', () => {
  let world = pupil('US', 20); fund(world); world = act(world, adoptCommand(world)); const before = structuredClone(world.accounts), petId = world.pets[0].id; world = act(world, { type: 'rehome-pet', petId }); expect(world.pets[0].status).toBe('rehomed'); expect(world.accounts).toEqual(before); expect(() => resolveCommand(world, { type: 'rehome-pet', petId })).toThrow(/responsible owner/);
  world = adopted(); world.pets[0].health = 1; world.pets[0].illness = 'infection'; world = month(world); expect(world.pets[0].status).toBe('deceased'); const months = world.pets[0].periods.length, age = petAgeMonths(world, world.pets[0]); world.date = monthFrom(world.date, 12); petMonth(world); expect(world.pets[0].periods).toHaveLength(months); expect(petAgeMonths(world, world.pets[0])).toBe(age); expect(world.pets[0].health).toBe(0); validateWorld(world);
});

test('a pet memorial survives an urgent queued result and reload, then stays acknowledged without another care payment', () => {
  let world = pupil('US', 20); fund(world); world = adopted(world);
  const pet = world.pets[0]; pet.health = 1; pet.illness = 'infection';
  offerPending(world, { id:'urgent-existing-result',kind:'result',title:'An urgent appointment',body:'Resolve the appointment first.',illustration:'health',effects:[] },120);
  world.date = monthFrom(world.date,1); petMonth(world);
  expect(world.pending?.id).toBe('urgent-existing-result');
  const memorial = world.deferred.find(item=>item.event.title==='Goodbye, '+pet.name)!;
  expect(memorial).toMatchObject({ priority:60,event:{kind:'result',illustration:'pet-memorial'} });
  expect(memorial.event.body).toContain(pet.name+' the '+pet.species+' died');
  const saved = encodeWorld(validateWorld(world));
  world = decodeWorld(saved); expect(world.deferred.filter(item=>item.event.id===memorial.event.id)).toHaveLength(1);
  world = resolveCommand(world,{type:'acknowledge',resultId:'urgent-existing-result'});
  expect(world.pending?.id).toBe(memorial.event.id);
  world = decodeWorld(encodeWorld(world));
  world = resolveCommand(world,{type:'acknowledge',resultId:memorial.event.id});
  expect(world.pending).toBeNull(); expect(world.deferred).toEqual([]);
  const payments = world.ledger.filter(row=>row.category==='pet-care').length;
  world.date = monthFrom(world.date,1); petMonth(world);
  expect(world.pending).toBeNull(); expect(world.ledger.filter(row=>row.category==='pet-care')).toHaveLength(payments);
  expect(decodeWorld(encodeWorld(validateWorld(world))).pets[0].status).toBe('deceased');
});

test('a known former household pet still has a death notice when its saved bond is zero', () => {
  let world = pupil('US',20); fund(world); world = adopted(world);
  const pet = world.pets[0], owner = world.people[pet.ownerId];
  const observer = Object.values(world.people).find(person=>person.id!==owner.id&&!person.died)!;
  ownHousehold(world,owner); pet.bonds[observer.id]=0; world.activePersonId=observer.id;
  expect(observer.householdId).not.toBe(owner.householdId);
  expect(pet.adoptedById).not.toBe(observer.id);
  pet.health=1; pet.illness='infection'; world.date=monthFrom(world.date,1); petMonth(world);
  expect(world.pending).toMatchObject({kind:'result',title:'Goodbye, '+pet.name,illustration:'pet-memorial'});
  expect(decodeWorld(encodeWorld(validateWorld(world))).pending).toEqual(world.pending);
});

test('a memorial preserves an already bound family decision and its choices while it waits in the saved queue', () => {
  let world = adopted(); fund(world);
  const decision = bindEvent(world,eventTemplates.find(item=>item.id==='broken-mug')!);
  expect(decision.personIds.length).toBeGreaterThan(0);
  offerPending(world,decision);
  world.pets[0].health=1; world.pets[0].illness='infection';
  world.date=monthFrom(world.date,1); petMonth(world);
  expect(world.pending).toMatchObject({kind:'result',illustration:'pet-memorial'});
  expect(world.deferred).toContainEqual({priority:20,event:decision});
  world=decodeWorld(encodeWorld(validateWorld(world)));
  world=resolveCommand(world,{type:'acknowledge',resultId:world.pending!.id});
  expect(world.pending).toEqual(decision);
  world=resolveCommand(world,{type:'choose',eventId:decision.id,choiceId:decision.choices[0].id});
  expect(world.pending).toMatchObject({kind:'result',id:decision.id+'_result'});
  world=resolveCommand(world,{type:'acknowledge',resultId:world.pending!.id});
  expect(world.pending).toBeNull(); expect(world.deferred).toEqual([]);
});
test('genuine content-four current/decision/newborn archives gain empty pet histories without altering any original financial, participant, RNG or pending field', () => {
  const raw = (payload: string) => JSON.parse(strFromU8(gunzipSync(Buffer.from(JSON.parse(payload).data, 'base64')))), originals = [raw(archive.checkpoint), ...archive.snapshots.map(item => raw(item.payload))], save = decodeSave(JSON.stringify(archive)), worlds = [save.world, ...save.snapshots.map(item => unpackCheckpoint(item.payload))];
  worlds.forEach((world, index) => { const encoded = JSON.parse(encodeWorld(world)); expect(originals[index].schemaVersion).toBe(25); expect(originals[index].contentVersion).toBe(4); expect(world.schemaVersion).toBe(42); expect(world.contentVersion).toBe(21); expect(world.pets).toEqual([]); expect(world.petAdoptions).toEqual([]); for (const key of Object.keys(originals[index]).filter(key => !['schemaVersion', 'engineVersion', 'contentVersion'].includes(key))) expect(encoded[key]).toEqual(originals[index][key]); });
  const finished = drain(save.world, true); expect(finished.ledger).toEqual(save.world.ledger); expect(finished.random).toEqual(save.world.random); expect(finished.people).toEqual(save.world.people);
});
test.each(['adoption payment', 'consent', 'owner', 'monthly payment', 'period gap', 'care cost', 'carer', 'pet duplicate', 'bond', 'vet cost'] as const)('imports reject tampered %s', field => {
  let world = adopted(); world = month(world); const pet = world.pets[0];
  if (field === 'adoption payment') pet.adoptionTransactionId = 'missing';
  if (field === 'consent') world.petAdoptions[0].roll = 100;
  if (field === 'owner') pet.ownerId = world.activePersonId;
  if (field === 'monthly payment') pet.periods[0].paymentId = 'missing';
  if (field === 'period gap') pet.periods[0].month++;
  if (field === 'care cost') pet.periods[0].foodDue++;
  if (field === 'carer') pet.periods[0].carerId = world.activePersonId;
  if (field === 'pet duplicate') world.pets.push(structuredClone(pet));
  if (field === 'bond') pet.bonds.person_missing = 10;
  if (field === 'vet cost') { world = act(world, { type: 'pet-vet', petId: pet.id, reviewedOwnerId: pet.ownerId, quotedFee: petVetCost('US') }); world.pets[0].visits[0].paid++; }
  expect(() => decodeWorld(encodeWorld(world))).toThrow();
});

test('a real custody/remand state prevents personal care while the existing local adult keeps automatic food funded', () => {
  const original = adopted(pupil('US', 14)), playerId = original.activePersonId;
  let arrested: World | undefined;
  for (let seed = 1; seed < 100; seed++) {
    const candidate = decodeWorld(encodeWorld(original)); candidate.random.outcomes = seed;
    resolveLegal(candidate, { type: 'crime', offence: 'vandalism' }, recordDeath);
    if (isConfined(candidate)) { arrested = drain(validateWorld(candidate)); break; }
  }
  expect(arrested).toBeDefined(); expect(petCareReason(arrested!, arrested!.pets[0], 'play')).toMatch(/available at home/);
  const next = month(arrested!); expect(next.pets[0].periods[0].care).toBe('owner'); expect(next.pets[0].adoptedById).toBe(playerId);
});
test('a reviewed permanent move includes and pays pet transport once, preserves the old adoption and records local care after moving', () => {
  let world = pupil('US', 20); fund(world); world = act(world, adoptCommand(world, 'luna')); const adoptionId = world.pets[0].adoptionTransactionId, petId = world.pets[0].id;
  world.random.outcomes = 1; world = act(world, { type: 'apply-relocation', destinationId: 'paris', route: 'settlement', roleId: null, program: null, field: null, quotedFee: relocationFee(world) }); expect(world.relocations[0].status).toBe('approved');
  const application = world.relocations[0], quote = moveQuote(world, application), noPets = structuredClone(world); noPets.pets = []; const humanQuote = moveQuote(noPets, application); expect(quote.transport).toBeGreaterThan(humanQuote.transport);
  const command: GameCommand = { type: 'relocate', applicationId: application.id, companionIds: [], reserveMonths: 3, reviewedQuote: quote };
  expect(() => resolveCommand(world, { ...command, reviewedQuote: humanQuote })).toThrow(/quote/); world = act(world, command);
  expect(world.pets[0]).toMatchObject({ id: petId, ownerId: world.activePersonId, country: 'FR', city: 'Paris', adoptionTransactionId: adoptionId, moves: [{ relocationId: application.id, fromCountry: 'US', country: 'FR', payerId: world.activePersonId, currency: 'USD', fee: quote.transport - humanQuote.transport }] });
  expect(world.ledger.filter(row => row.category === 'relocation-transport')).toHaveLength(1); expect(() => resolveCommand(world, command)).toThrow(/approved/);
  world = month(world); expect(world.pets[0].periods[0]).toMatchObject({ country: 'FR', currency: 'EUR', foodDue: petFoodCost('FR', 'cat') }); expect(decodeWorld(encodeWorld(world))).toEqual(world);
  const changed = structuredClone(world); changed.pets[0].moves[0].fee++; expect(() => validateWorld(changed)).toThrow(/transport/);
});
test('an actual Age Up produces twelve separately funded care periods and resumes saved illness interruptions without paying twice', () => {
  let world = adopted(); fund(world, world.pets[0].ownerId); const old = world.pets[0].periods.length; world = drain(resolveCommand(world, { type: 'advance' }), true);
  expect(world.pets[0].status).toBe('active'); expect(world.pets[0].periods).toHaveLength(old + 12); const payments = world.ledger.filter(row => row.category === 'pet-care'); expect(payments).toHaveLength(12); expect(new Set(world.pets[0].periods.map(item => item.paymentId)).size).toBe(12); expect(world.annual).toBeNull(); expect(decodeWorld(encodeWorld(world))).toEqual(world);
});

test('continuing as an actual existing minor keeps the pet with its adult carer and cannot spend inheritance trust on adoption', () => {
  let world = pupil('US', 20); fund(world); world = act(world, adoptCommand(world)); const playerId = world.activePersonId, petId = world.pets[0].id, child = addChild(world, [world.people[playerId]], 'adoptive', 8), childId = child.id;
  recordDeath(world, playerId, 'test legacy loss'); validateWorld(world); const adultId = world.pets[0].ownerId; expect(adultId).not.toBe(childId); expect(world.pets[0].owners).toHaveLength(2);
  world = act(world, { type: 'continue-child', personId: childId }); expect(world.activePersonId).toBe(childId); expect(accountFor(world).lockedCash).toBeGreaterThan(0n); const trust = accountFor(world).lockedCash;
  world = month(world); expect(world.pets[0]).toMatchObject({ id: petId, status: 'active', ownerId: adultId }); expect(world.pets[0].periods[0].ownerId).toBe(adultId); expect(accountFor(world).lockedCash).toBe(trust); expect(world.ledger.filter(row => row.category === 'pet-care').every(row => row.personId === adultId)).toBe(true); expect(decodeWorld(encodeWorld(world))).toEqual(world);
});
test('a stale vet review cannot silently charge the adult who took over after a real owner death', () => {
  let world = adopted(); const reviewed: PetCommand = { type: 'pet-vet', petId: world.pets[0].id, reviewedOwnerId: world.pets[0].ownerId, quotedFee: petVetCost('US') }; recordDeath(world, world.pets[0].ownerId, 'test loss'); world = drain(validateWorld(world)); const exact = encodeWorld(world); expect(() => resolveCommand(world, reviewed)).toThrow(/owner.*changed/); expect(encodeWorld(world)).toBe(exact); expect(world.pets[0].visits).toEqual([]);
});

test('actual hospital treatment prevents personal care and requires real boarding when the adult owner lives alone', () => {
  let world = pupil('US', 20); ownHousehold(world, world.people[world.activePersonId]); fund(world); world = act(world, adoptCommand(world)); const player = world.people[world.activePersonId], condition = addCondition(world, player, 'asthma', 80); emergencyCare(world, player.id, condition.id, true); world = drain(validateWorld(world)); expect(petCareReason(world, world.pets[0], 'play')).toMatch(/available at home/); world = month(world); expect(world.pets[0].periods[0]).toMatchObject({ care: 'boarding', boardingDue: petBoardingCost('US'), carerId: null });
});

test('new illness and actual last-owner death in one month retain distinct queued notices and the shelter outcome through cold resume', () => {
  let world = adopted(); const ownerId = world.pets[0].ownerId, otherId = Object.values(world.people).find(person => person.id !== ownerId && person.id !== world.activePersonId && !person.died && person.householdId === world.people[ownerId].householdId)!.id;
  recordDeath(world, otherId, 'test earlier parental loss'); world = drain(validateWorld(world)); world.date = monthFrom(world.date, 1); world.random.outcomes = Array.from({ length: 10000 }, (_, i) => i + 1).find(seed => randomInteger(seed, 1, 100).value <= 2)!;
  petMonth(world); expect(world.pending?.kind === 'result' && world.pending.title).toMatch(/became unwell/); const firstId = world.pending!.id; recordDeath(world, ownerId, 'test loss in illness month');
  expect(world.pets[0]).toMatchObject({ status: 'rehomed', endKind: 'owner-unavailable' }); const notices = [world.pending!, ...world.deferred.map(item => item.event)]; expect(notices).toHaveLength(2); expect(new Set(notices.map(item => item.id)).size).toBe(2); expect(notices.map(item => item.id)).toContain(firstId);
  world = decodeWorld(encodeWorld(validateWorld(world))); world = drain(world); expect(world.pending).toBeNull(); expect(world.deferred).toEqual([]); expect(world.pets[0].periods).toHaveLength(1); expect(world.ledger.filter(row => row.category === 'pet-care')).toHaveLength(1);
});
test('an existing untreated infection does not generate another new-illness notice on a later low health draw', () => {
  let world = adopted(); world.pets[0].illness = 'infection'; world.random.outcomes = Array.from({ length: 10000 }, (_, i) => i + 1).find(seed => randomInteger(seed, 1, 100).value <= 2)!; world.date = monthFrom(world.date, 1); petMonth(world); expect(world.pending).toBeNull(); expect(world.pets[0].illness).toBe('infection'); validateWorld(world);
});

test('care paid before a same-day permanent move keeps the original country and later care uses the destination, with forged locations rejected', () => {
  let world = pupil('US', 20); fund(world); world = act(world, adoptCommand(world, 'luna')); world = month(world); world = act(world, { type: 'pet-vet', petId: world.pets[0].id, reviewedOwnerId: world.activePersonId, quotedFee: petVetCost('US') });
  world.random.outcomes = 1; world = act(world, { type: 'apply-relocation', destinationId: 'paris', route: 'settlement', roleId: null, program: null, field: null, quotedFee: relocationFee(world) }); const application = world.relocations[0]; world = act(world, { type: 'relocate', applicationId: application.id, companionIds: [], reserveMonths: 3, reviewedQuote: moveQuote(world, application) });
  expect(world.pets[0].periods[0].country).toBe('US'); expect(world.pets[0].visits[0].country).toBe('US'); world = month(world); expect(world.pets[0].periods[1].country).toBe('FR'); expect(decodeWorld(encodeWorld(world))).toEqual(world);
  const corrupt = structuredClone(world); corrupt.pets[0].periods[0].city = 'Paris'; expect(() => validateWorld(corrupt)).toThrow(/care/);
  const visit = structuredClone(world); visit.pets[0].visits[0].city = 'Paris'; expect(() => validateWorld(visit)).toThrow(/fee/);
});

test('a genuinely qualified service member keeps the same pet at home while an actual away assignment blocks adoption and in-person care until return', () => {
  let world = drain(decodeSave(JSON.stringify(serviceArchive)).world, true); world = act(world, adoptCommand(world, 'luna')); const petId = world.pets[0].id, home = world.people[world.activePersonId].householdId;
  world = act(world, { type: 'start-assignment', serviceId: world.serviceCareers[0].id, kind: 'disaster-relief' }); expect(world.people[world.activePersonId].householdId).toBe(home); expect(world.pets[0].id).toBe(petId); expect(petAdoptionReason(world, 'buddy')).toMatch(/home/); expect(petCareReason(world, world.pets[0], 'play')).toMatch(/available at home/); expect(() => resolveCommand(world, { type: 'pet-care', petId, activity: 'play' })).toThrow(/available|in-person/);
  world = act(world, { type: 'return-assignment', serviceId: world.serviceCareers[0].id }); expect(petCareReason(world, world.pets[0], 'play')).toBeUndefined(); expect(world.pets[0].id).toBe(petId); expect(world.pets[0].periods).toEqual([]); expect(decodeWorld(encodeWorld(world))).toEqual(world);
});
