import { ageOn, copyWorld, decodeWorld, encodeWorld, fullName, validateWorld, type World } from '../../src/game/model';
import { decodeSave } from '../../src/persistence/archive';
import { resolveCommand, recordDeath } from '../../src/game/engine';
import { npcRelationshipsYear, npcRelationshipLimits } from '../../src/game/systems/npcRelationships';
import { activeRomance, closeFamily, connectPerson, relationFor } from '../../src/game/systems/relationships';
import { createContact } from '../../src/game/systems/npcs';
import * as common from '../../src/game/systems/common';
import { tripQuote } from '../../src/game/systems/travel';
import { isConfined } from '../../src/game/systems/legalSchemas';
import { serviceAway } from '../../src/game/systems/serviceSchemas';
import { finishNpcYear, npcConsentSeed, npcSocialCircle } from '../support/npcRelationships';
import serviceArchive from '../fixtures/v16-service-archive.json';

const formed = (world: World) => world.relationships.filter(row => row.memories.some(memory => memory.startsWith('npc-dating:')));

test('actual annual progression lets two existing adult contacts form a persistent relationship and truthful news without generating a partner', () => {
  const base = npcSocialCircle(); let world = base.world, years = 0;
  const original = encodeWorld(world), existing = new Set(Object.keys(world.people));
  while (!formed(world).length && !world.people[world.activePersonId].died && years++ < 12) world = finishNpcYear(resolveCommand(world, { type: 'advance' }, true));
  expect(years).toBeLessThan(12); expect(formed(world)).toHaveLength(1);
  const bond = formed(world)[0], a = world.people[bond.from], b = world.people[bond.to];
  expect([bond.from, bond.to].sort()).toEqual([base.a, base.b].sort()); expect(existing.has(a.id) && existing.has(b.id)).toBe(true);
  expect(bond).toMatchObject({ kind: 'partner', romance: 'dating', roles: expect.arrayContaining(['partner']) });
  expect(world.journal.filter(row => row.text === fullName(a) + ' and ' + fullName(b) + ' started dating.')).toHaveLength(1);
  expect(world.marriages).toEqual(base.world.marriages); expect(world.pregnancies).toEqual(base.world.pregnancies);
  expect(encodeWorld(base.world)).toBe(original); expect(decodeWorld(encodeWorld(world))).toEqual(world);
});

test('mutual consent changes only the NPC stream, bond, annual guard and news, and cannot reroll after a cold read or active-person change', () => {
  const { world, a, b } = npcSocialCircle(); world.random.npcs = npcConsentSeed();
  world.people[a].firstName = 'A$& {player}'; validateWorld(world);
  const people = structuredClone(world.people), accounts = structuredClone(world.accounts), history = structuredClone(world.workHistory), streams = { ...world.random }, count = Object.keys(world.people).length;
  npcRelationshipsYear(world); expect(formed(world)).toHaveLength(1); expect(Object.keys(world.people)).toHaveLength(count);
  expect(world.people).toEqual(people); expect(world.accounts).toEqual(accounts); expect(world.workHistory).toEqual(history);
  expect(world.random).toMatchObject({ events: streams.events, outcomes: streams.outcomes, economy: streams.economy }); expect(world.random.npcs).not.toBe(streams.npcs);
  expect(world.journal.at(-1)?.text).toContain('A$& {player}'); expect(relationFor(world, a, b)?.memories).toContain('npc-dating:' + world.date.year);
  const cold = decodeWorld(encodeWorld(world)), saved = encodeWorld(cold); npcRelationshipsYear(cold); expect(encodeWorld(cold)).toBe(saved);
  cold.activePersonId = a; const switched = encodeWorld(cold); npcRelationshipsYear(cold); expect(encodeWorld(cold)).toBe(switched);
});

test('either NPC declining leaves all bonds and money unchanged, with no same-year retry', () => {
  const { world } = npcSocialCircle(); world.random.npcs = npcConsentSeed(false);
  const bonds = structuredClone(world.relationships), accounts = structuredClone(world.accounts), journal = structuredClone(world.journal);
  npcRelationshipsYear(world); expect(formed(world)).toHaveLength(0); expect(world.relationships).toEqual(bonds); expect(world.accounts).toEqual(accounts); expect(world.journal).toEqual(journal);
  const saved = encodeWorld(world); npcRelationshipsYear(world); expect(encodeWorld(world)).toBe(saved);
});

test.each(['health', 'hospital', 'wanted', 'preferences', 'city', 'ex'] as const)('NPC availability respects %s before drawing or creating a relationship', restriction => {
  const { world, a, b } = npcSocialCircle(), target = world.people[b]; world.random.npcs = npcConsentSeed();
  if (restriction === 'health') target.stats.health = 24;
  if (restriction === 'hospital') target.health.hospitalizedUntil = world.date.year * 12 + world.date.month + 1;
  if (restriction === 'wanted') target.legal.wanted = true;
  if (restriction === 'preferences') target.attractedTo = [(['male', 'female', 'nonbinary'] as const).find(gender => gender !== world.people[a].gender)!];
  if (restriction === 'city') target.city = 'Chicago';
  if (restriction === 'ex') { connectPerson(world, b, a); const bond = relationFor(world, a, b)!; bond.romance = 'ex'; }
  validateWorld(world); const streams = { ...world.random }, people = Object.keys(world.people);
  npcRelationshipsYear(world); expect(formed(world)).toHaveLength(0); expect(world.random).toEqual(streams); expect(Object.keys(world.people)).toEqual(people);
});

test('an actual NPC death and a real booked trip each prevent local formation', () => {
  const dead = npcSocialCircle(); recordDeath(dead.world, dead.b, 'explicit availability scenario'); validateWorld(dead.world); dead.world.random.npcs = npcConsentSeed(); npcRelationshipsYear(dead.world); expect(formed(dead.world)).toHaveLength(0);
  const base = npcSocialCircle(), playerId = base.world.activePersonId; base.world.activePersonId = base.b;
  let world = finishNpcYear(resolveCommand(base.world, { type: 'book-trip', destinationId: 'paris', duration: 1, companionIds: [], focus: 'rest', quotedTotal: tripQuote(base.world, 'paris', 1).total }));
  world.activePersonId = playerId; world.random.npcs = npcConsentSeed(); validateWorld(world); npcRelationshipsYear(world); expect(formed(world)).toHaveLength(0);
});

test.each([17, 75])('a stored age-%s contact cannot form an adult peer relationship outside the eligible age band', age => {
  const { world, a, b } = npcSocialCircle(), viewer = Object.values(world.people).find(person => person.id.startsWith('person_npc_') && person.id !== a && person.id !== b)!;
  // Explicit actor/age setup; the helper sees only these existing known people.
  const target = createContact(world, { age, gender: world.people[a].attractedTo[0], compatibleWith: world.people[a].gender });
  world.activePersonId = viewer.id; connectPerson(world, a); connectPerson(world, target.id); validateWorld(world);
  world.random.npcs = npcConsentSeed(); const random = { ...world.random }; npcRelationshipsYear(world); expect(formed(world)).toHaveLength(0); expect(world.random).toEqual(random);
});

test('an actual arrest and remand keep the named NPC out of autonomous dates', () => {
  const base = npcSocialCircle(), playerId = base.world.activePersonId; let world: World | null = null;
  // Controlled arrest seed, followed by the real remand decision and cold validation.
  for (let seed = 1; seed < 100 && !world; seed++) {
    const input = copyWorld(base.world); input.activePersonId = base.b; input.random.outcomes = seed;
    const next = resolveCommand(input, { type: 'crime', offence: 'vandalism' });
    if (next.pending?.kind === 'decision') world = finishNpcYear(resolveCommand(next, { type: 'choose', eventId: next.pending.id, choiceId: 'remand' }));
  }
  expect(world).not.toBeNull(); world!.activePersonId = playerId; expect(isConfined(world!, base.b)).toBe(true); validateWorld(world!);
  world!.random.npcs = npcConsentSeed(); npcRelationshipsYear(world!); expect(formed(world!)).toHaveLength(0);
});

test('an actual service assignment keeps its existing adult member unavailable to local contacts', () => {
  let world = finishNpcYear(decodeSave(JSON.stringify(serviceArchive)).world); const actorId = world.activePersonId, actor = world.people[actorId], career = world.serviceCareers.find(item => item.personId === actorId)!;
  world = finishNpcYear(resolveCommand(world, { type: 'start-assignment', serviceId: career.id, kind: 'disaster-relief' })); expect(serviceAway(world, actorId)).toBeDefined();
  // Existing qualified service history; additional local contacts are explicit unit setup.
  world = decodeWorld(encodeWorld(world));
  const viewer = createContact(world, { age: ageOn(actor, world.date), country: actor.country, city: actor.city });
  const candidate = createContact(world, { age: ageOn(actor, world.date), country: actor.country, city: actor.city, gender: actor.attractedTo[0], compatibleWith: actor.gender });
  world.activePersonId = viewer.id; connectPerson(world, actorId); connectPerson(world, candidate.id); validateWorld(world);
  // Preparation may already settle the archive's other contacts. Isolate this
  // new viewer's availability pass; calendar replay protection is tested above.
  delete world.actionCounts['npc-relationships:' + world.date.year];
  world.random.npcs = npcConsentSeed(); const random = { ...world.random }, prior = structuredClone(formed(world)); npcRelationshipsYear(world); expect(formed(world)).toEqual(prior); expect(world.random).toEqual(random);
});

test.each(['sibling', 'guardian'] as const)('an existing direct %s role blocks autonomous romance even when preferences match', role => {
  const { world, a, b } = npcSocialCircle();
  world.relationships.push({ id: 'explicit_family', from: a, to: b, kind: role, roles: [role], romance: 'none', parentType: role === 'guardian' ? 'guardian' : null, since: { ...world.date }, strength: 70, trust: 70, memories: ['family'], lastInteractionYear: world.date.year });
  validateWorld(world); world.random.npcs = npcConsentSeed(); const before = { ...world.random }; npcRelationshipsYear(world); expect(formed(world)).toHaveLength(0); expect(world.random).toEqual(before);
});

test('indexed ancestry excludes actual cousin identities rather than matching family names', () => {
  const { world, a, b } = npcSocialCircle();
  // Explicit validated family-identity setup around the real introduced contacts.
  const grandparent = createContact(world, { age: 80 }), firstParent = createContact(world, { age: 50 }), secondParent = createContact(world, { age: 50 });
  for (const [from, to] of [[grandparent.id, firstParent.id], [grandparent.id, secondParent.id], [firstParent.id, a], [secondParent.id, b]]) world.relationships.push({ id: 'ancestor_' + from + '_' + to, from, to, kind: 'parent', roles: ['parent'], romance: 'none', parentType: 'biological', since: { ...world.people[to].born }, strength: 70, trust: 70, memories: ['birth'], lastInteractionYear: world.date.year });
  expect(closeFamily(world, a, b)).toBe(true); validateWorld(world); world.random.npcs = npcConsentSeed(); npcRelationshipsYear(world); expect(formed(world)).toHaveLength(0);
});

test('the active person and any current partner stay excluded and existing NPC couples cannot be poached', () => {
  const first = npcSocialCircle(), activeBond = relationFor(first.world, first.world.activePersonId, first.b)!;
  activeBond.romance = 'dating'; activeBond.kind = 'partner'; activeBond.roles.push('partner'); validateWorld(first.world); first.world.random.npcs = npcConsentSeed();
  const protectedBond = structuredClone(activeBond); npcRelationshipsYear(first.world); expect(formed(first.world)).toHaveLength(0); expect(relationFor(first.world, first.world.activePersonId, first.b)).toEqual(protectedBond);
  const second = npcSocialCircle(); connectPerson(second.world, second.b, second.a); const couple = relationFor(second.world, second.a, second.b)!;
  couple.romance = 'dating'; couple.kind = 'partner'; couple.roles.push('partner'); validateWorld(second.world); second.world.random.npcs = npcConsentSeed();
  const original = structuredClone(couple); npcRelationshipsYear(second.world); expect(formed(second.world)).toHaveLength(0); expect(relationFor(second.world, second.a, second.b)).toEqual(original);
});

test('a thousand relevant existing contacts keep annual work bounded and add at most two bonds with no world-person growth', () => {
  const { world } = npcSocialCircle();
  // Generated stress contacts are explicit test setup, not a natural/native population claim.
  for (let index = 0; index < 1000; index++) { const person = createContact(world, { age: 30 }); connectPerson(world, person.id); }
  validateWorld(world); world.random.npcs = npcConsentSeed(); const people = Object.keys(world.people), ledger = world.ledger.length, relationships = world.relationships.length;
  const draw = jest.spyOn(common, 'draw');
  try {
    npcRelationshipsYear(world);
    expect(formed(world).length).toBeGreaterThan(0); expect(formed(world).length).toBeLessThanOrEqual(npcRelationshipLimits.formations);
    expect(world.relationships.length - relationships).toBeLessThanOrEqual(npcRelationshipLimits.formations); expect(Object.keys(world.people)).toEqual(people); expect(world.ledger).toHaveLength(ledger);
    expect(draw.mock.calls.length).toBeLessThanOrEqual(npcRelationshipLimits.contacts / 2 * 3); expect(draw.mock.calls.every(call => call[1] === 'npcs')).toBe(true);
    const involved = formed(world).flatMap(row => [row.from, row.to]); expect(new Set(involved).size).toBe(involved.length);
    expect(world.relationships.filter(activeRomance).every(row => row.from !== world.activePersonId && row.to !== world.activePersonId || !row.memories.some(memory => memory.startsWith('npc-dating:')))).toBe(true);
  } finally { draw.mockRestore(); }
  validateWorld(world);
});
