import { createHash } from 'node:crypto';
import { copyWorld, decodeWorld, encodeWorld, fullName, validateWorld } from '../../src/game/model';
import { monthFrom } from '../../src/game/calendar';
import { randomInteger } from '../../src/game/random';
import { recordDeath, resolveCommand } from '../../src/game/engine';
import { countries, countryCodes } from '../../src/game/countries';
import { npcSeparationsYear } from '../../src/game/systems/npcSeparations';
import { npcSeparationAttemptKey, npcSeparationChanceV1 } from '../../src/game/systems/npcSeparationSchemas';
import { npcCourtshipsYear } from '../../src/game/systems/npcCourtships';
import { npcRelationshipsYear } from '../../src/game/systems/npcRelationships';
import { connectPerson, relationFor } from '../../src/game/systems/relationships';
import { addChild } from '../../src/game/systems/family';
import { post } from '../../src/game/systems/common';
import { tripQuote } from '../../src/game/systems/travel';
import { activeTrip } from '../../src/game/systems/travelSchemas';
import { npcContinuedCourtshipJourney, npcSeparationFixture, npcSeparationJourney } from '../support/npcSeparations';
import { finishNpcYear } from '../support/npcRelationships';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import terminal from '../fixtures/v34-natural-editorial-us-checkpoint.json';

test.each([{ state: 7, outcome: 'separated' }, { state: 1, outcome: 'continued' }] as const)('V1 $outcome uses one actual draw, saves the original context and retains actual ordinary roles', ({ state, outcome }) => {
  const { world, ids } = npcSeparationFixture(1, state), relation = world.relationships.find(row => row.id === ids[0])!, clock = world.npcCourtships[0], original = structuredClone(world);
  const roll = randomInteger(original.random.npcs, 1, 100); npcSeparationsYear(world);
  const row = world.npcSeparations[0]; expect(row).toMatchObject({ ruleVersion: 1, relationshipId: relation.id, courtshipId: clock.id, a: relation.from, b: relation.to, observerId: world.activePersonId, observerPartnerId: null, date: world.date, countryA: 'US', countryB: 'US', city: 'New York', strength: 35, trust: 35, chance: 16, roll: roll.value, outcome });
  expect(world.random).toEqual({ ...original.random, npcs: roll.state }); expect(world.actionCounts[npcSeparationAttemptKey(world.date.year)]).toBe(1);
  expect(Object.keys(world.people)).toEqual(Object.keys(original.people)); expect(world.people).toEqual(original.people); expect(world.accounts).toEqual(original.accounts); expect(world.ledger).toEqual(original.ledger); expect(world.liabilities).toEqual(original.liabilities); expect(world.assets).toEqual(original.assets); expect(world.households).toEqual(original.households); expect(world.marriages).toEqual(original.marriages); expect(world.pregnancies).toEqual(original.pregnancies); expect(world.custody).toEqual(original.custody); expect(world.pending).toEqual(original.pending);
  expect(relation.strength).toBe(35); expect(relation.trust).toBe(35); expect(relation.memories).toEqual(original.relationships.find(item => item.id === relation.id)!.memories);
  if (outcome === 'separated') {
    expect(relation).toMatchObject({ romance: 'ex', kind: 'friend', roles: ['classmate', 'coworker', 'friend'] }); expect(clock).toMatchObject({ ended: world.date, lastChecked: world.date, endReason: 'separated', observedSince: original.npcCourtships[0].observedSince, proposals: original.npcCourtships[0].proposals });
    expect(world.journal.at(-1)?.text).toBe(fullName(world.people[row.a]) + ' and ' + fullName(world.people[row.b]) + ' stopped dating.');
  } else {
    expect(world.relationships).toEqual(original.relationships); expect(world.npcCourtships).toEqual(original.npcCourtships.map(item => ({ ...item, lastChecked: world.date }))); expect(world.journal).toEqual(original.journal);
    validateWorld(world);
    // The ordinary wedding observer can still visit the actual dated pair.
    npcCourtshipsYear(world);
  }
  const saved = encodeWorld(world); npcSeparationsYear(world); expect(encodeWorld(world)).toBe(saved); expect(unpackCheckpoint(packCheckpoint(world), true)).toEqual(world);
});

test.each(countryCodes)('existing %s adult-country rules retain currencies and charge no separation money', country => {
  const { world } = npcSeparationFixture(), clock = world.npcCourtships[0];
  for (const id of [clock.a, clock.b]) { const person = world.people[id]; person.country = country; person.city = countries[country].cities[0]; }
  const before = structuredClone({ accounts: world.accounts, ledger: world.ledger, work: world.workHistory }); npcSeparationsYear(world); expect(world.npcSeparations[0]).toMatchObject({ countryA: country, countryB: country, outcome: 'separated' }); expect({ accounts: world.accounts, ledger: world.ledger, work: world.workHistory }).toEqual(before); validateWorld(world);
});

test.each(['early', 'high-scores', 'active', 'partner', 'minor', 'teen', 'mixed', 'engaged', 'married', 'unknown', 'closed', 'no-clock', 'city', 'hospital', 'wanted', 'health', 'household', 'dependent', 'pregnant', 'financial'] as const)('%s guard is read-only and cannot consume an NPC choice or manufacture news', trap => {
  const { world } = npcSeparationFixture(), clock = world.npcCourtships[0], a = world.people[clock.a], b = world.people[clock.b], relation = relationFor(world, a.id, b.id)!;
  if (trap === 'early') world.date = monthFrom(clock.observedSince, 11, clock.observedSince.day);
  if (trap === 'high-scores') { relation.strength = 50; relation.trust = 50; }
  if (trap === 'active') world.activePersonId = a.id;
  if (trap === 'partner') { const bond = relationFor(world, world.activePersonId, a.id)!; bond.romance = 'dating'; bond.roles.push('partner'); }
  if (trap === 'minor') b.born = monthFrom(world.date, -17 * 12);
  // The root-approved teen state is integrated in the shared future union;
  // this arranged helper input already proves exact dating-only selection.
  if (trap === 'teen' || trap === 'mixed') { Object.assign(relation, { romance: 'teen-dating' }); a.born = monthFrom(world.date, -(trap === 'mixed' ? 18 : 17) * 12); b.born = monthFrom(world.date, -17 * 12); }
  if (trap === 'engaged') relation.romance = 'engaged';
  if (trap === 'married') relation.romance = 'married';
  if (trap === 'unknown') world.relationships = world.relationships.filter(row => row !== relationFor(world, world.activePersonId, b.id));
  if (trap === 'closed') { clock.ended = { ...world.date }; clock.endReason = 'separated'; }
  if (trap === 'no-clock') world.npcCourtships = [];
  if (trap === 'city') b.city = 'Chicago';
  if (trap === 'hospital') b.health.hospitalizedUntil = world.date.year * 12 + world.date.month + 1;
  if (trap === 'wanted') b.legal.wanted = true;
  if (trap === 'health') b.stats.health = 24;
  if (trap === 'household') { a.householdId = 'same-unit-house'; b.householdId = a.householdId; }
  if (trap === 'dependent') addChild(world, [a], 'adoptive', 3);
  if (trap === 'pregnant') world.pregnancies.push({ id: 'pregnancy_unit', carrierId: a.id, otherParentId: b.id, conceived: { ...world.date }, due: monthFrom(world.date, 9), status: 'pregnant', childId: null, ended: null });
  if (trap === 'financial') {
    world.liabilities.push({ id: 'unit_person_debt', ownerId: a.id, creditorId: b.id, principal: 1n, currency: 'USD', kind: 'personal', interestBps: 0, assetId: null, monthlyPayment: 0n, remainingMonths: 0, missedPayments: 0 });
    post(world, 1n, 1n, 'unit-person-loan', 'Explicit reconciled person-loan setup', 'unit_person_debt', a); post(world, -1n, 0n, 'unit-person-loan', 'Explicit creditor advance', null, b); validateWorld(world);
  }
  // Some deliberately contradictory helper inputs isolate the runtime guard;
  // they are not import-valid worlds or claims of an actually reached life.
  const before = structuredClone(world); npcSeparationsYear(world); expect(world).toEqual(before);
});

test('an actual reviewed and paid solo trip postpones the check without rewriting the current courtship or pending result', () => {
  const setup = npcSeparationFixture(), observer = setup.world.activePersonId, traveler = setup.world.npcCourtships[0].b;
  // Explicit temporary unit actor context; the real command pays the saved
  // quote and creates the trip. Production autonomy never changes activePersonId.
  setup.world.activePersonId = traveler;
  let world = copyWorld(resolveCommand(setup.world, { type: 'book-trip', destinationId: 'paris', duration: 1, companionIds: [], focus: 'rest', quotedTotal: tripQuote(setup.world, 'paris', 1).total }, true));
  world.activePersonId = observer; expect(activeTrip(world, traveler)?.status).toBe('active'); validateWorld(world);
  const before = structuredClone(world); npcSeparationsYear(world); expect(world).toEqual(before);
});

test('a new actual separation retains every previously declined real wedding term and consent roll', () => {
  const { world } = npcSeparationFixture(1, 1); world.date = monthFrom(world.date, 12); npcCourtshipsYear(world);
  const clock = world.npcCourtships[0]; expect(clock.proposals).toHaveLength(1); expect(clock.proposals[0].accepted).toBe(false);
  const proposals = structuredClone(clock.proposals), observed = { ...clock.observedSince };
  // New explicitly declared separation unit boundary after an actual declined
  // proposal. No seed search and no claim this arranged case is a natural life.
  world.date = monthFrom(world.date, 12); world.random.npcs = 7; const ledger = structuredClone(world.ledger);
  npcSeparationsYear(world); expect(world.npcSeparations[0].outcome).toBe('separated'); expect(clock.proposals).toEqual(proposals); expect(clock.observedSince).toEqual(observed); expect(world.ledger).toEqual(ledger); validateWorld(world);
});

test('the exact12 calendar-month and leap-day boundary cannot be rounded up early', () => {
  const { world } = npcSeparationFixture(), clock = world.npcCourtships[0]; clock.observedSince = { year: 2024, month: 2, day: 29 }; clock.lastChecked = { ...clock.observedSince };
  world.date = { year: 2025, month: 2, day: 27 }; const random = { ...world.random }; npcSeparationsYear(world); expect(world.npcSeparations).toEqual([]); expect(world.random).toEqual(random);
  world.date.day = 28; npcSeparationsYear(world); expect(world.npcSeparations).toHaveLength(1); expect(world.npcSeparations[0].date).toEqual(world.date);
});

test('one continued pair consumes the entire world-year allowance and a13-pair window rotates past unavailable earlier pairs', () => {
  const { world } = npcSeparationFixture(13, 1), original = world.random.npcs;
  expect(world.npcCourtships).toHaveLength(13); const ordered = [...world.npcCourtships].sort((a, b) => a.id.localeCompare(b.id)), offset = world.date.year % ordered.length, excluded = ordered[(offset + 12) % ordered.length];
  for (const row of world.npcCourtships) if (row !== excluded) world.people[row.a].legal.wanted = true;
  npcSeparationsYear(world); expect(world.npcSeparations).toEqual([]); expect(world.random.npcs).toBe(original);
  world.date = monthFrom(world.date, 12, world.date.day); npcSeparationsYear(world); expect(world.npcSeparations).toHaveLength(1); expect(world.npcSeparations[0]).toMatchObject({ courtshipId: excluded.id, outcome: 'continued' });
  expect(excluded.lastChecked).toEqual(world.date); validateWorld(world);
  const after = structuredClone(world); npcSeparationsYear(world); expect(world).toEqual(after);
  const second = npcSeparationFixture(3, 1); npcSeparationsYear(second.world); expect(second.world.npcSeparations).toHaveLength(1); expect(second.world.npcSeparations[0].outcome).toBe('continued');
  npcSeparationsYear(second.world); expect(second.world.npcSeparations).toHaveLength(1);
});

test.each(['identity', 'observer', 'unknown-observer', 'counter', 'orphan-counter', 'missing-row', 'repeat-year', 'early', 'future', 'chance', 'roll', 'outcome', 'clock', 'clock-reason', 'forged-continued'] as const)('validation rejects %s history tampering and never reconstructs a decision', trap => {
  const { world } = npcSeparationFixture(); npcSeparationsYear(world); const row = world.npcSeparations[0], clock = world.npcCourtships[0]; validateWorld(world);
  if (trap === 'identity') row.b = world.activePersonId;
  if (trap === 'observer') row.observerId = row.a;
  if (trap === 'unknown-observer') world.relationships = world.relationships.filter(item => item !== relationFor(world, row.observerId, row.b));
  if (trap === 'counter') world.actionCounts[npcSeparationAttemptKey(row.date.year)] = 0;
  if (trap === 'orphan-counter') world.actionCounts[npcSeparationAttemptKey(row.date.year - 1)] = 1;
  if (trap === 'missing-row') world.npcSeparations = [];
  if (trap === 'repeat-year') world.npcSeparations.push({ ...row, id: 'npc_separation_999_999' });
  if (trap === 'early') { row.date = monthFrom(clock.observedSince, 11, clock.observedSince.day); }
  if (trap === 'future') row.date = monthFrom(world.date, 12);
  if (trap === 'chance') row.chance++;
  if (trap === 'roll') row.roll = 100;
  if (trap === 'outcome') row.outcome = 'continued';
  if (trap === 'clock') { clock.ended = null; clock.endReason = null; }
  if (trap === 'clock-reason') clock.endReason = 'death';
  if (trap === 'forged-continued') { row.outcome = 'continued'; row.roll = 100; }
  expect(() => validateWorld(world)).toThrow();
});

test('a genuine old separated clock remains valid without new retrospective attempts or counters', () => {
  const { world } = npcSeparationFixture(), clock = world.npcCourtships[0], relation = relationFor(world, clock.a, clock.b)!;
  relation.romance = 'ex'; relation.roles = relation.roles.filter(role => role !== 'partner'); relation.kind = 'friend'; clock.ended = { ...world.date }; clock.endReason = 'separated';
  const original = encodeWorld(world); npcSeparationsYear(world); expect(encodeWorld(world)).toBe(original); expect(decodeWorld(original).npcSeparations).toEqual([]);
});

test('later residence/preferences/death preserve the exact original observation and ending history', () => {
  const { world } = npcSeparationFixture(); npcSeparationsYear(world); const saved = structuredClone(world.npcSeparations), clock = world.npcCourtships[0], a = world.people[clock.a], b = world.people[clock.b];
  world.date = monthFrom(world.date, 12); a.country = 'IT'; a.city = 'Rome'; b.attractedTo = [b.gender]; recordDeath(world, b.id, 'Explicit later historical boundary');
  expect(world.npcSeparations).toEqual(saved); expect(decodeWorld(encodeWorld(world)).npcSeparations).toEqual(saved);
});

test('an actual subsequent death and child legacy retain the original observer identity instead of rebinding history to today’s player', () => {
  const { world } = npcSeparationFixture(); npcSeparationsYear(world); const saved = structuredClone(world.npcSeparations), observer = world.activePersonId;
  const child = addChild(world, [world.people[observer]], 'adoptive', 10); recordDeath(world, observer, 'Explicit legacy boundary');
  const continued = resolveCommand(world, { type: 'continue-child', personId: child.id }, true);
  expect(continued.activePersonId).toBe(child.id); expect(continued.npcSeparations).toEqual(saved); expect(continued.npcSeparations[0].observerId).toBe(observer); expect(unpackCheckpoint(packCheckpoint(continued), true)).toEqual(continued);
});

test('ordinary annual commands execute the real hook before wedding, retain roles and news, and cannot rematch an ex in that same year', () => {
  const { before, command, after } = npcSeparationJourney(), row = after.npcSeparations.find(item => item.outcome === 'separated')!, clock = after.npcCourtships.find(item => item.id === row.courtshipId)!, relation = after.relationships.find(item => item.id === row.relationshipId)!;
  expect(resolveCommand(before, command, true)).toEqual(after); expect(before.npcSeparations.some(item => item.id === row.id)).toBe(false);
  expect(clock).toMatchObject({ ended: row.date, endReason: 'separated', marriageId: null }); expect(relation).toMatchObject({ romance: 'ex', kind: 'friend', roles: ['classmate', 'coworker', 'friend'] }); expect(after.marriages.some(item => [item.a, item.b].includes(row.a) && [item.a, item.b].includes(row.b))).toBe(false);
  expect(after.journal.filter(item => item.text === fullName(after.people[row.a]) + ' and ' + fullName(after.people[row.b]) + ' stopped dating.')).toHaveLength(1);
  expect(finishNpcYear(after).npcSeparations).toEqual(after.npcSeparations); const mutable = copyWorld(after), original = structuredClone(mutable.relationships); npcRelationshipsYear(mutable); expect(mutable.relationships).toEqual(original);
});

test('the original fixed three-pair annual context honestly continues all six attempts and keeps real declined and later paid weddings', () => {
  const world = npcContinuedCourtshipJourney(); expect(world.npcSeparations).toHaveLength(6); expect(world.npcSeparations.every(row => row.outcome === 'continued')).toBe(true);
  expect(world.npcCourtships.filter(row => row.marriageId)).toHaveLength(3); expect(world.npcCourtships.every(row => row.proposals.some(proposal => !proposal.accepted))).toBe(true);
  expect(world.ledger.filter(row => row.category === 'npc-wedding')).toHaveLength(6); expect(unpackCheckpoint(packCheckpoint(world), true)).toEqual(world);
});

test('genuine old complete checkpoint and original pending/result bytes gain only empty new history', () => {
  const sha = (value: string) => createHash('sha256').update(value).digest('hex'); expect(sha(terminal.checkpoint)).toBe('afbd3a1a85bc05cbc046917fd61195545fa9e0704bd2aced19c0be1981809901');
  const world = unpackCheckpoint(terminal.checkpoint, true); expect(world.npcSeparations).toEqual([]); expect(world.bestFriendships).toEqual([]);
  const historical = JSON.parse(encodeWorld(world));
  for (const key of ['cults', 'miniGames', 'personSupportRequests', 'personActionHistory', 'rentalLeases', 'bestFriendships', 'teenRelationships', 'universityApplications', 'studyCourses', 'npcSeparations', 'npcMoves', 'campusCommunities']) { expect(historical[key]).toEqual([]); delete historical[key]; }
  historical.schemaVersion = 34; historical.engineVersion = 35; historical.contentVersion = 10;
  expect(sha(JSON.stringify(historical))).toBe('03cced796c1fb4a0b1f24e63ef0b3cd1673b5fec0412b4dcd4ca8b6b667a92fd'); expect(unpackCheckpoint(packCheckpoint(world), true)).toEqual(world);
});
