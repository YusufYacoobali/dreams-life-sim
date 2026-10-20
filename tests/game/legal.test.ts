import { decodeWorld, encodeWorld, validateWorld, World } from '../../src/game/model';
import { recordDeath, resolveCommand } from '../../src/game/engine';
import { accountFor, post } from '../../src/game/systems/common';
import { activeSentence, crimeReason, hearCase, isConfined, legalMonth, prisonContacts, visibleConvictions } from '../../src/game/systems/legal';
import { addChild, childrenOf } from '../../src/game/systems/family';
import { monthFrom } from '../../src/game/calendar';
import { legalRules } from '../../src/game/legalRules';
import { countries, countryCodes } from '../../src/game/countries';
import { netWorth } from '../../src/game/valuation';
import { workMonth } from '../../src/game/systems/work';
import { householdLivingCost } from '../../src/game/systems/households';
import { addCondition, consultationCost } from '../../src/game/systems/health';
import { educationMonth } from '../../src/game/systems/education';
import { offerPending } from '../../src/game/pendingQueue';
import graduateFixture from '../fixtures/v3-employed-graduate.json';
import marriageFixture from '../fixtures/v5-marriage-result.json';
import medicalArchive from '../fixtures/v8-medical-archive.json';
import { decodeSave } from '../../src/persistence/archive';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import { actionableCrimes } from '../../src/game/content/crime';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
function fixture() { const world = decodeWorld(JSON.stringify(graduateFixture)); const account = accountFor(world); account.cash += 100000000n; account.openingCash += 100000000n; world.people[world.activePersonId].stats.energy = 100; return world; }
function ack(world: World) { if (world.pending?.kind !== 'result') throw new Error('Expected result: ' + world.pending?.kind); return resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id }); }
function choose(world: World, choiceId: string) { if (world.pending?.kind !== 'decision') throw new Error('Expected decision'); return resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId }); }
function arrested(initial = fixture(), offence: typeof actionableCrimes[number] = 'vandalism') {
  for (let seed = 1; seed < 100; seed++) { const input = validateWorld(initial); input.random.outcomes = seed; const world = resolveCommand(input, { type: 'crime', offence }); if (world.pending?.kind === 'decision') return world; }
  throw new Error('No arrest test seed');
}
function nextMonth(world: World) { world.date = monthFrom(world.date, 1, world.date.day); legalMonth(world); return world; }
function sentenced() { let world = ack(choose(arrested(), 'remand')); nextMonth(world); world = ack(choose(world, 'guilty')); return world; }
test('v8 migration adds empty legal state and never invents an offence or consumes a random draw', () => {
  const world = fixture(), old = JSON.parse(encodeWorld(world)); old.schemaVersion = 8; old.engineVersion = 7;
  for (const person of Object.values(old.people) as Record<string, unknown>[]) delete person.legal;
  for (const key of ['pendingPriority', 'deferred', 'incidents', 'cases', 'sentences', 'remand', 'contraband', 'gangs']) delete old[key];
  const restored = decodeWorld(JSON.stringify(old)); expect(restored.random).toEqual(world.random); expect(restored.incidents).toEqual([]); expect(restored.people[world.activePersonId].legal).toEqual({ wanted: false, aliases: [], crimeSkill: 0, gangId: null });
});
test('a genuine v8 SQLite archive preserves its saved medical quote and historical emergency without rerolling', () => {
  const archive = decodeSave(JSON.stringify(medicalArchive)), world = archive.world, history = unpackCheckpoint(archive.snapshots[0].payload);
  expect(world.schemaVersion).toBe(29); expect(world.annual?.monthsProcessed).toBe(1); expect(world.pending?.kind === 'decision' && world.pending.templateId).toBe('medical-emergency');
  expect(history).toEqual(world); expect(world.pending?.kind === 'decision' && world.pending.choices[0].effects).toContainEqual(expect.objectContaining({ kind: 'emergency-care', quotedCost: 36000n }));
  const before = accountFor(world).cash, cared = choose(world, 'care'); expect(accountFor(cared).cash).toBe(before - 36000n); expect(cared.incidents).toEqual([]);
});
test('arrest, evidence, trial rolls and the bound choices survive a cold save exactly', () => {
  const world = arrested(); expect(resolveCommand(fixture(), { type: 'crime', offence: 'vandalism' })).toEqual(resolveCommand(fixture(), { type: 'crime', offence: 'vandalism' }));
  expect(world.cases).toHaveLength(1); expect(isConfined(world)).toBe(true); expect(decodeWorld(encodeWorld(world))).toEqual(world);
});
test('bail moves real money into escrow, keeps net worth and returns once on acquittal', () => {
  let world = arrested(); const before = accountFor(world).cash, worth = netWorth(world).minor, bail = world.cases[0].bail.minor;
  world = ack(choose(world, 'bail')); expect(accountFor(world).cash).toBe(before - bail); expect(netWorth(world).minor).toBe(worth); expect(isConfined(world)).toBe(false);
  world.cases[0].trialRoll = 100; nextMonth(world); const reloaded = decodeWorld(encodeWorld(world)); world = ack(choose(reloaded, 'not-guilty'));
  expect(world.cases[0].status).toBe('acquitted'); expect(accountFor(world).cash).toBe(before); expect(world.cases[0].bailState).toBe('returned'); expect(world.sentences).toHaveLength(0);
  expect(() => resolveCommand(world, { type: 'pay-bail', caseId: world.cases[0].id })).toThrow(/no unpaid bail/);
});
test('unaffordable bail leaves the saved arrest usable and remaining in custody available', () => {
  const world = arrested(); post(world, -accountFor(world).cash, 0n, 'fixture', 'Remove test funds'); const saved = encodeWorld(world);
  expect(() => choose(world, 'bail')).toThrow(/funds/); expect(encodeWorld(world)).toBe(saved);
  const held = ack(choose(world, 'remand')); expect(isConfined(held)).toBe(true);
});
test('an actual annual arrest pauses for counsel, and a hearing pauses for prison routines', () => {
  let world = arrested(); world = ack(choose(world, 'bail'));
  const start = { ...world.date }; world = resolveCommand(world, { type: 'advance' }); expect(world.pending?.kind === 'decision' && world.pending.templateId).toBe('court-hearing'); expect(world.annual?.monthsProcessed).toBe(1);
  world = ack(choose(world, 'guilty')); expect(world.date).toEqual(monthFrom(start, 1, start.day)); expect(world.annual?.pausedForPlanning).toBe(true);
  world = ack(resolveCommand(world, { type: 'prison-routine', routine: { work: true, study: true, exercise: true, conduct: 'quiet' } })); expect(activeSentence(world)?.servedMonths).toBe(0);
  world = resolveCommand(world, { type: 'resume' }); expect(world.pending?.kind === 'result' && world.pending.title).toBe('Released from custody'); expect(world.annual?.monthsProcessed).toBe(5);
  expect(activeSentence(world)).toBeUndefined(); expect(world.ledger.filter(item => item.category === 'prison-pay')).toHaveLength(4); validateWorld(world);
});
test('remand credit is counted once and prison months never pay ordinary wages or household living costs', () => {
  let world = arrested(); const pay = world.people[world.activePersonId].finance.lifetimeGross;
  world = ack(choose(world, 'remand')); world.date = monthFrom(world.date, 1, world.date.day); workMonth(world); expect(world.people[world.activePersonId].finance.lifetimeGross).toBe(pay); legalMonth(world);
  world = ack(choose(world, 'guilty')); const sentence = activeSentence(world)!; expect(sentence.totalMonths).toBe(4); expect(sentence.creditedMonths).toBe(1); expect(world.people[world.activePersonId].employment).toBeNull(); expect(householdLivingCost(world, world.people[world.activePersonId])).toBe(0n);
  const before = accountFor(world).cash; workMonth(world); expect(accountFor(world).cash).toBe(before);
  for (let month = 0; month < 3; month++) { nextMonth(world); const served = world.sentences[0].servedMonths; legalMonth(world); expect(world.sentences[0].servedMonths).toBe(served); }
  expect(world.sentences[0].state).toBe('released'); expect(world.sentences[0].servedMonths).toBe(3); expect(isConfined(world)).toBe(false); validateWorld(world);
});
test.each(['apply-job', 'enroll', 'adopt', 'exercise', 'meet-people', 'buy-asset', 'move-out', 'fertility-care'] as const)('custody centrally rejects a direct %s command', type => {
  const world = sentenced(); expect(() => resolveCommand(world, { type } as never)).toThrow(/custody/);
});
test('custody moves actual children to an available caregiver and funds necessary clinical care', () => {
  const initial = fixture(), parent = initial.people[initial.activePersonId], child = addChild(initial, [parent], 'adoptive', 2), known = childrenOf(initial)[0].id;
  let world = arrested(initial); expect(world.people[child.id].householdId).not.toBe(parent.householdId); expect(childrenOf(world)[0].id).toBe(known);
  world = ack(choose(world, 'remand')); expect(consultationCost(world, 'tests')).toBe(0n); const before = accountFor(world).cash; world = ack(resolveCommand(world, { type: 'consult', service: 'tests' })); expect(accountFor(world).cash).toBe(before); validateWorld(world);
});
test('an imprisoned pregnant parent carries the actual pregnancy to birth and the child has an available caregiver', () => {
  let world = ack(decodeWorld(JSON.stringify(marriageFixture))); const parent = world.people[world.activePersonId], spouse = Object.values(world.people).find(person => person.id !== parent.id && person.householdId === parent.householdId)!;
  parent.biology = { role: 'carry', fertility: 100 }; spouse.biology = { role: 'contribute', fertility: 100 }; parent.stats.health = 100; spouse.stats.health = 100; parent.legal.crimeSkill = 100; world.random.outcomes = 1;
  world = ack(resolveCommand(world, { type: 'try-child' })); expect(world.pregnancies[0].status).toBe('pregnant');
  world = ack(choose(arrested(world, 'burglary'), 'remand')); world = resolveCommand(world, { type: 'advance' }); world = ack(choose(world, 'guilty')); expect(world.pregnancies[0].status).toBe('pregnant');
  world = resolveCommand(world, { type: 'resume' }); expect(world.pending?.kind === 'result' && world.pending.title).toBe('Welcome, little one');
  const born = world.people[world.pregnancies[0].childId!]; expect(world.pregnancies[0].status).toBe('born'); expect(childrenOf(world).map(child => child.id)).toContain(born.id); expect(born.householdId).toBe(world.people[spouse.id].householdId); expect(isConfined(world)).toBe(true); validateWorld(world);
});
test('an overturned conviction refunds only the actually paid fine and cancels its exact remaining debt', () => {
  let world = ack(choose(arrested(), 'remand')); post(world, -accountFor(world).cash, 0n, 'fixture', 'Remove fine funding'); nextMonth(world); world = ack(choose(world, 'guilty'));
  const item = world.cases[0], debtId = item.fineDebtId!; expect(world.liabilities.find(debt => debt.id === debtId)!.principal).toBe(item.fine.minor);
  post(world, 1000000n, 0n, 'fixture', 'Fund legal review'); world = ack(resolveCommand(world, { type: 'repay', liabilityId: debtId, amount: item.fine.minor / 2n }));
  const unpaid = world.liabilities.find(debt => debt.id === debtId)!.principal, before = accountFor(world).cash; activeSentence(world)!.appealRoll = 1;
  world = ack(resolveCommand(world, { type: 'appeal' })); expect(world.cases[0].status).toBe('dismissed'); expect(world.cases[0].fineRefunded).toBe(true); expect(world.liabilities.find(debt => debt.id === debtId)!.principal).toBe(0n);
  expect(accountFor(world).cash).toBe(before - 80000n + item.fine.minor - unpaid); validateWorld(world);
});
test('a person who caused a victim’s death cannot inherit, while an innocent descendant retains their branch', () => {
  const initial = fixture(), person = initial.people[initial.activePersonId], child = addChild(initial, [person], 'adoptive', 2), parent = initial.people.person_parent1; parent.stats.health = 1;
  const world = resolveCommand(initial, { type: 'crime', offence: 'assault', victimId: parent.id }), estate = world.estates.find(item => item.personId === parent.id)!;
  expect(world.people[parent.id].died).not.toBeNull(); expect(world.incidents[0].victimKilled).toBe(true); expect(world.incidents[0].offence).toBe('homicide'); expect(estate.distributions.map(item => item.personId)).not.toContain(person.id); expect(estate.distributions.map(item => item.personId)).toContain(child.id); validateWorld(world);
});
test('a deferred medical emergency, arrest and property-independent result retain priority and do not overwrite each other', () => {
  let world = arrested(); const arrestId = world.pending!.id, person = world.people[world.activePersonId], condition = addCondition(world, person, 'asthma', 80);
  offerPending(world, { kind: 'result', id: 'birthday_factual', title: 'A family birthday', body: 'The actual birth remains recorded.', illustration: 'carriage', effects: [] }, 90);
  offerPending(world, { kind: 'decision', id: 'urgent_fixture', templateId: 'medical-emergency', title: 'Urgent care', body: 'Care in custody', illustration: 'care', personIds: [person.id], choices: [true, false].map(accepted => ({ id: accepted ? 'care' : 'decline', label: accepted ? 'Accept care' : 'Decline care', effects: [{ kind: 'emergency-care' as const, personId: person.id, conditionId: condition.id, accepted, quotedCost: 0n }], resultTitle: 'Care decision', resultBody: 'Recorded', journal: 'I considered care.' })) });
  world = decodeWorld(encodeWorld(world)); expect(world.pending!.id).toBe('urgent_fixture'); world = ack(choose(world, 'care')); expect(world.pending!.id).toBe(arrestId); world = ack(choose(world, 'remand')); expect(world.pending!.id).toBe('birthday_factual'); world = ack(world); expect(world.pending).toBeNull(); validateWorld(world);
});
test('private counsel charges once, a conviction affects work and recorded background checks expire by profile', () => {
  let world = ack(choose(arrested(), 'bail')); const item = world.cases[0], before = accountFor(world).cash;
  world = ack(resolveCommand(world, { type: 'retain-counsel', caseId: item.id, counsel: 'private' })); const after = accountFor(world).cash; expect(after).toBe(before - item.counselFee.minor);
  world = ack(resolveCommand(world, { type: 'retain-counsel', caseId: item.id, counsel: 'private' })); expect(accountFor(world).cash).toBe(after);
  nextMonth(world); world = ack(choose(world, 'guilty')); expect(visibleConvictions(world)).toHaveLength(1);
  world.date.year += legalRules[world.cases[0].country].recordYears; expect(visibleConvictions(world)).toHaveLength(0);
});
test('higher education keeps completed attendance and paid tuition while a prisoner studies an equivalency', () => {
  const world = sentenced(), person = world.people[world.activePersonId]; person.education.stage = 'university'; person.education.months = 5; person.education.tuitionPaidMonths = 12;
  educationMonth(world, person); expect(person.education.months).toBe(5); expect(person.education.tuitionPaidMonths).toBe(12);
});
test('prison connections involve actual detained people, and a conflict adds a real charge without erasing the first sentence', () => {
  let world = sentenced(); const sentenceId = activeSentence(world)!.id, target = prisonContacts(world)[0]; expect(target).toBeDefined(); expect(isConfined(world, target)).toBe(true);
  world = ack(resolveCommand(world, { type: 'prison-interact', personId: target.id, action: 'befriend' })); expect(world.relationships.some(item => item.to === target.id && item.roles.includes('friend'))).toBe(true);
  const original = encodeWorld(world); expect(() => resolveCommand(world, { type: 'prison-interact', personId: target.id, action: 'befriend' })).toThrow(/already tried/); expect(encodeWorld(world)).toBe(original);
  const health = world.people[target.id].stats.health; world = resolveCommand(world, { type: 'prison-interact', personId: target.id, action: 'conflict' });
  expect(world.people[target.id].stats.health).toBeLessThan(health); expect(world.pending?.kind === 'decision' && world.pending.templateId).toBe('arrest'); expect(activeSentence(world)!.id).toBe(sentenceId); expect(world.cases.filter(item => item.personId === world.activePersonId)).toHaveLength(2); expect(decodeWorld(encodeWorld(world))).toEqual(world);
});
test('escape pauses recorded time served, and surrender restores the same sentence with a new outstanding case', () => {
  const initial = sentenced(); let world: World | null = null;
  for (let seed = 1; seed < 200; seed++) { const candidate = validateWorld(initial); candidate.random.outcomes = seed; const next = resolveCommand(candidate, { type: 'escape' }); if (next.people[next.activePersonId].legal.wanted) { world = ack(next); break; } }
  if (!world) throw new Error('No successful escape fixture'); const id = world.sentences[0].id, served = world.sentences[0].servedMonths;
  expect(world.sentences[0].state).toBe('escaped'); expect(isConfined(world)).toBe(false);
  for (let seed = 1; seed < 200; seed++) { const candidate = validateWorld(world); candidate.random.outcomes = seed; nextMonth(candidate); if (candidate.people[candidate.activePersonId].legal.wanted) { world = candidate; break; } }
  expect(world.sentences[0].servedMonths).toBe(served); expect(world.sentences[0].state).toBe('escaped'); validateWorld(world);
  world = resolveCommand(world, { type: 'surrender' }); expect(world.people[world.activePersonId].legal.wanted).toBe(false); expect(activeSentence(world)!.id).toBe(id); expect(world.sentences[0].servedMonths).toBe(served); expect(world.cases.some(item => item.personId === world!.activePersonId && item.offence === 'escape' && item.status === 'awaiting-trial')).toBe(true); validateWorld(world);
});
test.each(actionableCrimes)('%s connects proceeds, victims, investigations and courts over a deterministic three-year journey', offence => {
  let world = fixture(); world.people[world.activePersonId].legal.crimeSkill = 50;
  if (offence === 'organized-job') world = ack(resolveCommand(world, { type: 'join-gang', kind: 'street' }));
  const before = world, command = { type: 'crime' as const, offence }; world = resolveCommand(world, command); expect(resolveCommand(before, command)).toEqual(world);
  const drain = (input: World) => { let next = input, guard = 0; while ((next.pending || next.annual) && !next.people[next.activePersonId].died && guard++ < 200) { if (next.pending?.kind === 'decision') { const choice = next.pending.choices.find(item => !choiceUnavailable(next, item)); if (!choice) throw new Error('No available saved choice'); next = resolveCommand(next, { type: 'choose', eventId: next.pending.id, choiceId: choice.id }); } else if (next.pending) next = ack(next); else next = resolveCommand(next, { type: 'resume' }); } if (guard >= 200) throw new Error('Progression stalled'); return next; };
  world = drain(world);
  for (let year = 0; year < 3 && !world.people[world.activePersonId].died; year++) world = drain(resolveCommand(world, { type: 'advance' }));
  expect(world.incidents.some(item => item.personId === world.activePersonId && item.offence === offence)).toBe(true); expect(decodeWorld(encodeWorld(world))).toEqual(world);
});
test('a deceased defendant refunds bail before estate settlement and the child never inherits their criminal record', () => {
  const initial = fixture(), child = addChild(initial, [initial.people[initial.activePersonId]], 'adoptive', 2); let world = ack(choose(arrested(initial), 'bail'));
  const parentId = world.activePersonId; recordDeath(world, parentId, 'test natural death'); expect(world.cases[0].status).toBe('abated'); expect(world.cases[0].bailState).toBe('returned'); expect(world.ledger.some(item => item.category === 'bail-return')).toBe(true); validateWorld(world);
  world = ack(resolveCommand(world, { type: 'continue-child', personId: child.id })); expect(world.activePersonId).toBe(child.id); expect(visibleConvictions(world)).toEqual([]); expect(world.people[parentId].died).not.toBeNull();
});
test('counterfeit inventory conserves resale value and aliases never replace the underlying identity', () => {
  let world = fixture(); const id = world.activePersonId, name = world.people[id].firstName;
  for (let seed = 1; seed < 100; seed++) { const input = fixture(); input.random.outcomes = seed; const candidate = resolveCommand(input, { type: 'black-market', kind: 'false-id', alias: 'Alex Vale' }); if (candidate.pending?.kind === 'result') { world = ack(candidate); break; } }
  expect(world.people[id].legal.aliases).toContain('Alex Vale'); expect(world.activePersonId).toBe(id); expect(world.people[id].firstName).toBe(name);
  expect(() => resolveCommand(world, { type: 'black-market', kind: 'false-id', alias: 'Alex Other' })).toThrow(/already tried/);
});
test.each(countryCodes)('the %s authored legal profile charges the local currency and preserves exact bail escrow', country => {
  const initial = fixture(), person = initial.people[initial.activePersonId]; person.country = country; person.city = countries[country].cities[0];
  const currency = countries[country].currency;
  if (!initial.accounts.some(item => item.ownerId === person.id && item.currency === currency)) initial.accounts.push({ id: 'local_' + country, ownerId: person.id, currency, cash: 100000000n, openingCash: 100000000n, lockedCash: 0n });
  const arrestedWorld = arrested(initial), worth = netWorth(arrestedWorld).minor, bailed = ack(choose(arrestedWorld, 'bail')); expect(bailed.cases[0].bail.currency).toBe(currency); expect(netWorth(bailed).minor).toBe(worth); validateWorld(bailed);
});
