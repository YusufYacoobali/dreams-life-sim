import { gunzipSync, strFromU8 } from 'fflate';
import { decodeWorld, encodeWorld, validateWorld, World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { tripQuote, tripReason, unusedTripRefund } from '../../src/game/systems/travel';
import { activeTrip, physicalLocation } from '../../src/game/systems/travelSchemas';
import { accountFor } from '../../src/game/systems/common';
import { endEmployment, workMonth } from '../../src/game/systems/work';
import { hireNpc } from '../../src/game/systems/npcs';
import { createLife, randomCreation } from '../../src/game/createLife';
import { countries, countryCodes } from '../../src/game/countries';
import { randomInteger } from '../../src/game/random';
import { recordDeath } from '../../src/game/engine';
import { postReason } from '../../src/game/systems/social';
import { addCondition } from '../../src/game/systems/health';
import { royalReceptionQuote, royalReceptionReason } from '../../src/game/systems/royalty';
import { samePhysicalPlace } from '../../src/game/systems/travelSchemas';
import { monthlyAmount } from '../../src/game/rules';
import { monthFrom } from '../../src/game/calendar';
import { decodeSave } from '../../src/persistence/archive';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import graduate from '../fixtures/v3-employed-graduate.json';
import pensionArchive from '../fixtures/v18-foreign-pension-archive.json';
import actorArchive from '../fixtures/v12-career-archive.json';
import birthFixture from '../fixtures/v6-birth-result.json';
function fixture() { const world = decodeWorld(JSON.stringify(graduate)), account = accountFor(world); account.cash += 100000000n; account.openingCash += 100000000n; world.people[world.activePersonId].stats.health = 100; return world; }
function drain(input: World) { let world = input, guard = 0; while (world.pending && guard++ < 100) { if (world.pending.kind === 'result') world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id }); else { const choice = world.pending.choices.find(item => !choiceUnavailable(world, item)); if (!choice) throw new Error('No available decision'); world = resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: choice.id }); } } return world; }
const act = (world: World, command: Parameters<typeof resolveCommand>[1]) => drain(resolveCommand(world, command));
function book(world: World, duration: 1 | 3 | 12 = 1, companionIds: string[] = []) { return act(world, { type: 'book-trip', destinationId: 'paris', duration, companionIds, focus: 'sightseeing', quotedTotal: tripQuote(world, 'paris', duration, companionIds).total }); }
function finishYear(input: World) { let world = input, guard = 0; while (world.annual && !world.people[world.activePersonId].died && guard++ < 200) world = world.pending ? drain(world) : act(world, { type: 'resume' }); if (guard >= 200) throw new Error('Year did not finish'); return world; }

test('the genuine v18 archive migrates all twelve paid foreign pension quotes and its prior unspent entitlement without alteration', () => {
  const save = decodeSave(JSON.stringify(pensionArchive)), world = save.world, original = JSON.parse(strFromU8(gunzipSync(Buffer.from(JSON.parse(pensionArchive.checkpoint).data, 'base64')))), encoded = JSON.parse(encodeWorld(world));
  expect(world.schemaVersion).toBe(36); expect(world.trips).toEqual([]); expect(encoded.people).toEqual(original.people); expect(encoded.ledger).toEqual(original.ledger); expect(encoded.workHistory).toEqual(original.workHistory); expect(world.random).toEqual(original.random);
  const person = world.people[world.activePersonId]; expect(person.finance.pensionReceipts).toHaveLength(12); expect(person.finance.pensionReceipts.reduce((sum, row) => sum + row.nativeGross, 0n)).toBe(2408163n); expect(person.finance.pensionReceipts.reduce((sum, row) => sum + row.gross, 0n)).toBe(3642345n); expect(person.finance.pensionReceipts.reduce((sum, row) => sum + row.fee, 0n)).toBe(36430n);
  const prior = unpackCheckpoint(save.snapshots[0].payload); expect(prior.trips).toEqual([]); expect(prior.people[prior.activePersonId].finance.pensionReceipts).toEqual([]); expect(prior.people[prior.activePersonId].finance.pensionAnnual).toBe(person.finance.pensionAnnual);
});
test('browsing and quoting consume no randomness; arrival costs exactly the package and changes physical location without residence or nationality', () => {
  const initial = fixture(), saved = encodeWorld(initial), quote = tripQuote(initial, 'paris', 1), person = initial.people[initial.activePersonId], cash = accountFor(initial).cash;
  expect(tripReason(initial, 'paris', 1)).toBeUndefined(); expect(encodeWorld(initial)).toBe(saved);
  const world = book(initial), trip = activeTrip(world)!; expect(trip.status).toBe('active'); expect(trip.periods).toEqual([]); expect(accountFor(world).cash).toBe(cash - quote.total); expect(physicalLocation(world)).toEqual({ country: 'FR', city: 'Paris' }); expect(world.people[person.id].country).toBe('US'); expect(world.people[person.id].nationality).toBe(person.nationality); expect(world.people[person.id].employment).toEqual(person.employment); expect(world.people[person.id].stats).toEqual(person.stats); expect(world.date).toEqual(initial.date); expect(world.journal.some(item => item.personId === person.id && item.category === 'travel')).toBe(false); expect(decodeWorld(encodeWorld(world))).toEqual(world);
});
test('a one-month unpaid holiday settles the real month, pauses employment service and returns before the remaining eleven months', () => {
  const initial = fixture(); endEmployment(initial); hireNpc(initial, initial.people[initial.activePersonId], 'administrator'); const service = initial.people[initial.activePersonId].finance.serviceMonths;
  let world = book(initial); expect(world.trips[0].leave[0].paid).toBe(false); world = act(world, { type: 'advance' });
  expect(world.trips[0].status).toBe('completed'); expect(world.trips[0].periods).toHaveLength(1); expect(world.annual?.monthsProcessed).toBe(1); expect(world.annual?.pausedForPlanning).toBe(true); expect(world.date).toEqual(monthFrom(initial.date, 1, initial.calendarAnchorDay)); expect(world.people[world.activePersonId].finance.serviceMonths).toBe(service); expect(physicalLocation(world).country).toBe('US');
  world = finishYear(world); expect(world.trips[0].periods).toHaveLength(1); expect(world.people[world.activePersonId].finance.serviceMonths).toBe(service + 11); expect(world.date).toEqual(monthFrom(initial.date, 12, initial.calendarAnchorDay)); validateWorld(world);
});
test('a recorded twelve-month employee can take one paid leave month without working performance or creating an upfront annual salary', () => {
  const initial = fixture(); for (let month = 0; month < 12; month++) { initial.date = monthFrom(initial.date, 1); workMonth(initial); }
  const person = initial.people[initial.activePersonId], job = person.employment!, service = person.finance.serviceMonths, performance = job.performance, paidMonths = job.paidMonths, annual = job.annualPay, ledgerStart = initial.ledger.length;
  let world = book(initial); expect(world.trips[0].leave[0].paid).toBe(true); world = act(world, { type: 'advance' });
  expect(world.people[world.activePersonId].finance.serviceMonths).toBe(service + 1); expect(world.people[world.activePersonId].employment!.performance).toBe(performance); expect(world.ledger.slice(ledgerStart).filter(item => item.personId === world.activePersonId && item.category === 'income').reduce((sum, item) => sum + item.cashDelta, 0n)).toBe(monthlyAmount(annual, paidMonths)); validateWorld(world);
});
test('an early return refunds only half unused accommodation, advances no time and grants no completed-travel experience', () => {
  const initial = fixture(); endEmployment(initial); let world = book(initial, 3); const before = accountFor(world).cash, refund = unusedTripRefund(world.trips[0]); world = act(world, { type: 'return-trip', tripId: world.trips[0].id });
  expect(world.trips[0].status).toBe('returned'); expect(world.trips[0].periods).toEqual([]); expect(accountFor(world).cash).toBe(before + refund); expect(world.trips[0].refund).toBe(refund); expect(refund).toBeLessThan(world.trips[0].paid); expect(world.date).toEqual(initial.date); expect(world.people[world.activePersonId].stats).toEqual(initial.people[initial.activePersonId].stats); expect(world.journal.some(item => item.category === 'travel' && item.personId === world.activePersonId)).toBe(false); expect(physicalLocation(world).country).toBe('US'); validateWorld(world);
});
test('unused approved leave is not consumed by an instant return, and only one actual paid leave month is available in a calendar year', () => {
  let world = book(fixture()); expect(world.trips[0].leave[0].paid).toBe(true); expect(world.trips[0].leave[0].used).toBe(false); world = act(world, { type: 'return-trip', tripId: world.trips[0].id });
  world = book(world); expect(world.trips[1].leave[0].paid).toBe(true); world = act(world, { type: 'advance' }); expect(world.trips[0].leave[0].used).toBe(false); expect(world.trips[1].leave[0].used).toBe(true);
  world = book(world); expect(world.trips[2].leave[0].paid).toBe(false); expect(world.trips[2].leave[0].used).toBe(false); validateWorld(world);
});
test('the completed holiday keeps pensions paid into residence currency instead of relabelling rights or payments to the destination', () => {
  const initial = decodeSave(JSON.stringify(pensionArchive)).world, person = initial.people[initial.activePersonId], old = structuredClone(person.finance.pensionReceipts); let world = book(initial); world = act(world, { type: 'advance' });
  const finance = world.people[world.activePersonId].finance; expect(finance.pensionReceipts.slice(0, old.length)).toEqual(old); expect(finance.pensionReceipts).toHaveLength(13); expect(finance.pensionReceipts[12].sourceCurrency).toBe('USD'); expect(finance.pensionReceipts[12].currency).toBe('JPY'); expect(world.people[world.activePersonId].country).toBe('JP'); expect(world.trips[0].status).toBe('completed'); validateWorld(world);
});
test('duplicate travellers, stale quotes, overlap and work during a gap year cannot bypass the direct command gates', () => {
  const initial = fixture(); expect(tripReason(initial, 'paris', 12)).toMatch(/leaving work/); expect(() => resolveCommand(initial, { type: 'book-trip', destinationId: 'paris', duration: 1, companionIds: [], focus: 'rest', quotedTotal: 1n })).toThrow(/quote/); expect(tripReason(initial, 'paris', 1, [initial.activePersonId])).toMatch(/once/);
  const world = book(initial); expect(() => resolveCommand(world, { type: 'book-trip', destinationId: 'london', duration: 1, companionIds: [], focus: 'food', quotedTotal: tripQuote(world, 'london', 1).total })).toThrow(/existing trip/); expect(() => resolveCommand(world, { type: 'apply-job', roleId: 'retail' })).toThrow(/Return/); expect(() => resolveCommand(world, { type: 'consult', service: 'checkup' })).toThrow(/Return/); expect(() => resolveCommand(world, { type: 'crime', offence: 'shoplifting' } as never)).toThrow(/Return/);
});
test('tampered package prices, duplicates, paid months and invented cash refunds are rejected on import', () => {
  const initial = fixture(); endEmployment(initial); hireNpc(initial, initial.people[initial.activePersonId], 'administrator'); const active = book(initial); for (const mutate of [(copy: World) => { copy.trips[0].quote.total++; }, (copy: World) => { copy.trips[0].participantIds.push(copy.activePersonId); }, (copy: World) => { copy.trips[0].refund = 100n; }, (copy: World) => { copy.trips[0].leave[0].paid = true; }]) { const copy = decodeWorld(encodeWorld(active)); mutate(copy); expect(() => validateWorld(copy)).toThrow(); }
});

test('a full gap year advances twelve actual monthly periods and finishes the same paused year without replaying travel', () => {
  const initial = fixture(); endEmployment(initial); const booked = book(initial, 12), world = act(booked, { type: 'advance' }), replay = act(decodeWorld(encodeWorld(booked)), { type: 'advance' });
  expect(world).toEqual(replay); expect(world.trips[0].periods).toHaveLength(12); expect(world.trips[0].status).toBe('completed'); expect(world.annual?.monthsProcessed).toBe(12); expect(world.annual?.pausedForPlanning).toBe(true); expect(world.date).toEqual(monthFrom(initial.date, 12));
  const completed = finishYear(world); expect(completed.annual).toBeNull(); expect(completed.trips[0].periods).toEqual(world.trips[0].periods); expect(completed.people[completed.activePersonId].finance.serviceMonths).toBe(initial.people[initial.activePersonId].finance.serviceMonths);
});
test('a gap year started during a genuine paused midyear crosses the year boundary and refunds only its actual unused portion', () => {
  let world = drain(decodeSave(JSON.stringify(actorArchive)).world); const source = world.people[world.activePersonId].finance.lifetimeGross, start = world.date;
  expect(world.annual?.monthsProcessed).toBe(6); expect(tripReason(world, 'paris', 12)).toBeUndefined(); world = book(world, 12); world = act(world, { type: 'resume' });
  expect(world.annual).toBeNull(); expect(world.trips[0].status).toBe('active'); expect(world.trips[0].periods).toHaveLength(6); expect(world.date).toEqual(monthFrom(start, 6)); expect(world.people[world.activePersonId].finance.lifetimeGross).toBe(source);
  const before = accountFor(world).cash, refund = unusedTripRefund(world.trips[0]); world = act(world, { type: 'return-trip', tripId: world.trips[0].id }); expect(world.trips[0].refund).toBe(refund); expect(refund).toBe(world.trips[0].quote.accommodation / 4n); expect(accountFor(world).cash).toBe(before + refund); validateWorld(world);
});
function family() { const world = drain(decodeWorld(JSON.stringify(birthFixture))); for (const person of Object.values(world.people)) person.stats.health = 100; return world; }
function familyParty(world: World) { return world.households.find(item => item.id === world.people[world.activePersonId].householdId)!.members.filter(id => id !== world.activePersonId); }
function consentSeed(world: World, accept: boolean) { const spouse = familyParty(world).find(id => world.relationships.some(item => item.romance === 'married' && [item.from, item.to].includes(id) && [item.from, item.to].includes(world.activePersonId)))!, relation = world.relationships.find(item => [item.from, item.to].includes(world.activePersonId) && [item.from, item.to].includes(spouse))!, chance = Math.min(95, 45 + Math.floor(relation.strength / 2)); for (let seed = 1; seed < 10000; seed++) if ((randomInteger(seed, 1, 100).value <= chance) === accept) return seed; throw new Error('No consent seed'); }
test('an actual newborn and consenting household parent travel under the same identities and quoted party cost', () => {
  const initial = family(), party = familyParty(initial), oldPeople = Object.keys(initial.people), oldRelations = structuredClone(initial.relationships), cash = accountFor(initial).cash, quote = tripQuote(initial, 'paris', 1, party); initial.random.npcs = consentSeed(initial, true);
  let world = book(initial, 1, party); expect(world.trips[0].status).toBe('active'); expect(world.trips[0].participantIds).toEqual([initial.activePersonId, ...party]); expect(world.trips[0].consents.every(item => item.accepted)).toBe(true); expect(Object.keys(world.people)).toEqual(oldPeople); expect(world.relationships).toEqual(oldRelations); expect(accountFor(world).cash).toBe(cash - quote.total);
  world = act(world, { type: world.annual ? 'resume' : 'advance' }); expect(world.trips[0].status).toBe('completed'); expect(world.trips[0].periods[0].changes.map(item => item.personId)).toEqual([initial.activePersonId, ...party]); validateWorld(world);
});
test('a real companion can decline; the party stays home without a charge and consent cannot be rerolled this year', () => {
  const initial = family(), party = familyParty(initial), cash = accountFor(initial).cash; initial.random.npcs = consentSeed(initial, false); const world = book(initial, 1, party);
  expect(world.trips[0].status).toBe('declined'); expect(world.trips[0].paid).toBe(0n); expect(world.trips[0].periods).toEqual([]); expect(accountFor(world).cash).toBe(cash); expect(activeTrip(world)).toBeUndefined(); expect(tripReason(world, 'paris', 1, party)).toMatch(/already requested/); expect(world.trips[0].consents.some(item => !item.accepted)).toBe(true); validateWorld(world);
});
test('an infant cannot be left without an existing available caregiver; losing the home caregiver returns the travelling parent', () => {
  const initial = family(), household = familyParty(initial), child = household.find(id => initial.relationships.some(item => item.from === initial.activePersonId && item.to === id && item.roles.includes('parent')))!, spouse = household.find(id => id !== child)!;
  expect(tripReason(initial, 'paris', 1, [spouse])).toMatch(/Bring/); let world = book(initial); const count = Object.keys(world.people).length; expect(world.trips[0].status).toBe('active'); recordDeath(world, spouse, 'natural causes');
  expect(world.trips[0].status).toBe('interrupted'); expect(world.trips[0].refund).toBe(0n); expect(physicalLocation(world).country).toBe('US'); expect(Object.keys(world.people)).toHaveLength(count); expect(world.people[child].householdId).toBe(world.people[world.activePersonId].householdId); validateWorld(world);
});
test('travel posts require an actual experienced month rather than a booking or an instant cancelled stay', () => {
  let world = act(fixture(), { type: 'create-social', platform: 'photogram', handle: 'real_journey', bio: '' }); world = book(world); const account = world.socialAccounts.find(item => item.ownerId === world.activePersonId)!;
  expect(postReason(world, account, 'travel')).toMatch(/Take a trip/); world = act(world, { type: 'advance' }); expect(postReason(world, world.socialAccounts.find(item => item.id === account.id)!, 'travel')).toBeUndefined();
});
test('a real urgent-care decision during a longer trip admits the patient and returns the same party without an invented completed journey or refund', () => {
  const initial = fixture(); endEmployment(initial); let world = book(initial, 3); addCondition(world, world.people[world.activePersonId], 'fracture', 90); world = resolveCommand(world, { type: 'advance' });
  expect(world.pending?.kind === 'decision' && world.pending.templateId).toBe('medical-emergency'); if (world.pending?.kind !== 'decision') throw new Error('Expected urgent care'); const option = world.pending.choices.find(item => item.effects.some(effect => effect.kind === 'emergency-care' && effect.accepted))!;
  world = resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: option.id }); expect(world.trips[0].status).toBe('interrupted'); expect(world.trips[0].refund).toBe(0n); expect(world.people[world.activePersonId].health.hospitalizedUntil).not.toBeNull(); expect(world.trips[0].periods).toHaveLength(1); expect(physicalLocation(world).country).toBe('US'); expect(world.people[world.activePersonId].health.records.some(item => item.kind === 'hospital')).toBe(true); validateWorld(world);
});
test('visiting London permits an actual local royal reception and existing-person introduction without changing home identity or requiring a fictional local bank balance', () => {
  let world = fixture(); world.people[world.activePersonId].stats.respect = 80; world = act(world, { type: 'book-trip', destinationId: 'london', duration: 1, companionIds: [], focus: 'sightseeing', quotedTotal: tripQuote(world, 'london', 1).total });
  expect(royalReceptionReason(world)).toBeUndefined(); const quote = royalReceptionQuote(world), cash = accountFor(world).cash; expect(quote.currency).toBe('USD'); expect(quote.localCurrency).toBe('GBP'); expect(quote.fee).toBeGreaterThan(0n);
  for (let seed = 1; seed < 10000; seed++) if (randomInteger(seed, 1, 100).value <= 50) { world.random.outcomes = seed; break; }
  world = act(world, { type: 'royal-reception', quotedCost: quote.minor }); const house = world.royalHouses.find(item => item.country === 'GB')!, contact = house.members.find(item => world.relationships.some(relation => [relation.from, relation.to].includes(item.personId) && [relation.from, relation.to].includes(world.activePersonId)))!;
  expect(accountFor(world).cash).toBe(cash - quote.minor); expect(world.people[world.activePersonId].country).toBe('US'); expect(world.people[contact.personId].country).toBe('GB'); expect(samePhysicalPlace(world, world.activePersonId, contact.personId)).toBe(true); expect(world.accounts.some(item => item.ownerId === world.activePersonId && item.currency === 'GBP')).toBe(false); world = act(world, { type: 'return-trip', tripId: world.trips[0].id }); expect(samePhysicalPlace(world, world.activePersonId, contact.personId)).toBe(false); validateWorld(world);
});
test.each(countryCodes)('%s holiday quotes and cash preserve native minor units while temporary location stays separate from residence', country => {
  let world = createLife('life_travel_currency_' + country, 42, { ...randomCreation(42), country, city: countries[country].cities[0], background: 'ordinary' }, { year: 2000, month: 1, day: 1 }); world.date = { year: 2026, month: 1, day: 1 }; world.birthAcknowledged = true; const cash = accountFor(world); cash.cash = 100000000n; cash.openingCash = 100000000n;
  const destinationId = country === 'FR' ? 'london' : 'paris', quote = tripQuote(world, destinationId, 1), before = cash.cash; world = act(world, { type: 'book-trip', destinationId, duration: 1, companionIds: [], focus: 'rest', quotedTotal: quote.total });
  expect(quote.currency).toBe(countries[country].currency); expect(accountFor(world).cash).toBe(before - quote.total); expect(world.people[world.activePersonId].country).toBe(country); expect(world.people[world.activePersonId].finance.earningsCurrency).toBe(countries[country].currency); expect(decodeWorld(encodeWorld(world))).toEqual(world);
});
