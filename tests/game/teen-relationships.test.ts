import { ageOn, copyWorld, decodeWorld, encodeWorld, validateWorld } from '../../src/game/model';
import { monthFrom } from '../../src/game/calendar';
import { recordDeath, resolveCommand, type GameCommand } from '../../src/game/engine';
import { countryCodes } from '../../src/game/countries';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { isConfined } from '../../src/game/systems/legalSchemas';
import { randomInteger } from '../../src/game/random';
import { relationFor, partnerRelation, romanceReason } from '../../src/game/systems/relationships';
import { conceptionReason } from '../../src/game/systems/family';
import { teenDateReason, refreshTeenRelationships } from '../../src/game/systems/teenRelationships';
import { currentTeenRelationship, teenAttemptKey, teenRelationshipIndex, teenRelationshipHistory, withinTeenAgeGap } from '../../src/game/systems/teenRelationshipSchemas';
import { currentBestFriendship } from '../../src/game/systems/friendshipSchemas';
import { createContact } from '../../src/game/systems/npcs';
import { connectPerson } from '../../src/game/systems/relationships';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { acknowledgeTeen, teenEnd, teenProposal, teenRelationshipFixture } from '../support/teenRelationshipFixture';

test.each([[1, true], [4, false]] as const)('fixed consent state%i gives its real saved outcome, one draw and exact cold result', (state, accepted) => {
  const { world, peerId } = teenRelationshipFixture(14, 14, state), before = encodeWorld(world), command = teenProposal(world, peerId);
  expect(teenDateReason(world, peerId)).toBeUndefined(); expect(encodeWorld(world)).toBe(before);
  const next = resolveCommand(world, command, true), row = next.teenRelationships[0], draw = randomInteger(world.random.npcs, 1, 100);
  expect(row.roll).toBe(draw.value); expect(row.status).toBe(accepted ? 'active' : 'declined'); expect(next.random).toEqual({ ...world.random, npcs: draw.state });
  expect(next.people[next.activePersonId].stats).toEqual({ ...world.people[world.activePersonId].stats, energy: 80 - (accepted ? 4 : 0) });
  expect(next.accounts).toEqual(world.accounts); expect(next.ledger).toEqual(world.ledger); expect(next.workHistory).toEqual(world.workHistory);
  const oldRelation = relationFor(world, world.activePersonId, peerId)!, newRelation = relationFor(next, next.activePersonId, peerId)!;
  expect(newRelation.strength).toBe(oldRelation.strength); expect(newRelation.trust).toBe(oldRelation.trust); expect(newRelation.roles).toEqual(accepted ? [...oldRelation.roles, 'partner'] : oldRelation.roles);
  expect(partnerRelation(next)?.id).toBe(accepted ? oldRelation.id : undefined); expect(next.pending).toMatchObject({ kind: 'result', title: accepted ? 'Your first date' : 'They declined the date' });
  expect(unpackCheckpoint(packCheckpoint(next), true)).toEqual(next); expect(decodeWorld(encodeWorld(next), true)).toEqual(next); expect(encodeWorld(world)).toBe(before);
  const done = acknowledgeTeen(next), stable = encodeWorld(done); expect(() => resolveCommand(done, command, true)).toThrow(accepted ? /already seeing/ : /already asked/); expect(encodeWorld(done)).toBe(stable);
});

test('exact calendar DOB gap includes its day and leap anniversary rather than rounded age labels', () => {
  expect(withinTeenAgeGap({ year: 2010, month: 3, day: 5 }, { year: 2012, month: 3, day: 5 })).toBe(true);
  expect(withinTeenAgeGap({ year: 2010, month: 3, day: 5 }, { year: 2012, month: 3, day: 6 })).toBe(false);
  expect(withinTeenAgeGap({ year: 2012, month: 2, day: 29 }, { year: 2014, month: 2, day: 28 })).toBe(true);
  expect(withinTeenAgeGap({ year: 2014, month: 3, day: 1 }, { year: 2012, month: 2, day: 29 })).toBe(false);
});

test.each([[12, 13, false], [13, 13, true], [17, 17, true], [18, 17, false], [17, 18, false]] as const)('actual ages%i/%i preserve the minor-only first-date boundary', (age, peerAge, eligible) => {
  const { world, peerId } = teenRelationshipFixture(age, peerAge), before = encodeWorld(world);
  expect(teenDateReason(world, peerId) === undefined).toBe(eligible);
  if (!eligible) expect(() => resolveCommand(world, teenProposal(world, peerId), true)).toThrow(/thirteen to seventeen/);
  expect(encodeWorld(world)).toBe(before);
});

test('stale identity/location and unavailable/authority/preference/bond/energy contexts reject before any change or draw', () => {
  const setup = teenRelationshipFixture(), command = teenProposal(setup.world, setup.peerId);
  for (const altered of [{ ...command, lifeId: 'life_other' }, { ...command, actorId: setup.peerId }, { ...command, relationshipId: 'relation_other' }, { ...command, country: 'JP' as const }, { ...command, city: 'Elsewhere' }]) expect(() => resolveCommand(setup.world, altered, true)).toThrow(/Review/);
  for (const mutate of [
    (world: ReturnType<typeof copyWorld>) => { relationFor(world, world.activePersonId, setup.peerId)!.strength = 49; },
    (world: ReturnType<typeof copyWorld>) => { relationFor(world, world.activePersonId, setup.peerId)!.trust = 39; },
    (world: ReturnType<typeof copyWorld>) => { world.people[world.activePersonId].stats.energy = 3; },
    (world: ReturnType<typeof copyWorld>) => { const peer = world.people[setup.peerId]; peer.attractedTo = peer.attractedTo[0] === 'male' ? ['female'] : ['male']; },
    (world: ReturnType<typeof copyWorld>) => { relationFor(world, world.activePersonId, setup.peerId)!.roles.push('teacher'); },
    (world: ReturnType<typeof copyWorld>) => { world.people[setup.peerId].city = 'Elsewhere'; },
    (world: ReturnType<typeof copyWorld>) => { world.people[setup.peerId].health.hospitalizedUntil = world.date.year * 12 + world.date.month + 1; },
    (world: ReturnType<typeof copyWorld>) => { world.people[setup.peerId].legal.wanted = true; },
  ]) {
    const changed = copyWorld(setup.world); mutate(changed); const world = validateWorld(changed, true), before = encodeWorld(world);
    expect(teenDateReason(world, setup.peerId)).toBeDefined(); expect(() => resolveCommand(world, command, true)).toThrow(); expect(encodeWorld(world)).toBe(before);
  }
  expect(teenDateReason(setup.world, setup.world.activePersonId)).toMatch(/actual peer/); expect(teenDateReason(setup.world, 'person_unknown')).toMatch(/actual peer/);
});

test('a real current best friendship closes through the shared romance ending and retains its exact original consent', () => {
  const { world, peerId } = teenRelationshipFixture(), actor = world.people[world.activePersonId];
  const agreed = acknowledgeTeen(resolveCommand(world, { type: 'propose-best-friendship', lifeId: world.id, actorId: actor.id, personId: peerId, relationshipId: relationFor(world, actor.id, peerId)!.id, country: actor.country, city: actor.city }, true));
  const before = currentBestFriendship(agreed)!; expect(before).toBeDefined();
  const dated = resolveCommand(agreed, teenProposal(agreed, peerId), true);
  expect(dated.bestFriendships[0]).toEqual({ ...before, status: 'ended', ended: dated.date, endReason: 'romance', endedById: null }); expect(currentBestFriendship(dated)).toBeUndefined();
});

test('mixed-age ongoing consent stays exclusive and can be ended remotely; both-adult refresh uses the actual date', () => {
  const setup = teenRelationshipFixture(17, 16), active = acknowledgeTeen(resolveCommand(setup.world, teenProposal(setup.world, setup.peerId), true)), original = active.teenRelationships[0];
  const mixed = copyWorld(active); mixed.date = monthFrom(mixed.date, 12); refreshTeenRelationships(mixed); const stable = validateWorld(mixed, true);
  expect(ageOn(stable.people[stable.activePersonId], stable.date)).toBe(18); expect(ageOn(stable.people[setup.peerId], stable.date)).toBe(17);
  expect(currentTeenRelationship(stable)?.id).toBe(original.id); expect(partnerRelation(stable)?.romance).toBe('teen-dating'); expect(teenDateReason(stable, setup.peerId)).toMatch(/thirteen to seventeen/);
  const remote = copyWorld(stable); remote.people[setup.peerId].city = 'Elsewhere'; const apart = validateWorld(remote, true), ending = resolveCommand(apart, teenEnd(apart, setup.peerId), true);
  expect(ending.teenRelationships[0]).toEqual({ ...original, status: 'ended', ended: apart.date, endReason: 'choice', endedById: apart.activePersonId }); expect(ending.random).toEqual(apart.random);
  expect(relationFor(ending, ending.activePersonId, setup.peerId)?.romance).toBe('ex');
  const adult = copyWorld(stable); adult.date = monthFrom(adult.date, 12); const random = { ...adult.random }; refreshTeenRelationships(adult); const continued = validateWorld(adult, true);
  expect(continued.teenRelationships[0]).toEqual({ ...original, status: 'continued-as-adults', ended: adult.date, endReason: 'adulthood', endedById: null });
  expect(partnerRelation(continued)?.romance).toBe('dating'); expect(continued.random).toEqual(random); expect(continued.npcCourtships).toEqual(active.npcCourtships); expect(currentTeenRelationship(continued)).toBeUndefined();
  expect(unpackCheckpoint(packCheckpoint(continued), true)).toEqual(continued);
});

test('actual death closes original consent with the deceased person/date and ordinary adult/family commands still reject minors', () => {
  const setup = teenRelationshipFixture(), active = acknowledgeTeen(resolveCommand(setup.world, teenProposal(setup.world, setup.peerId), true)), row = active.teenRelationships[0];
  const actor = active.people[active.activePersonId], peer = active.people[setup.peerId];
  expect(romanceReason(active, peer)).toMatch(/adults/); expect(conceptionReason(active, actor, peer)).toMatch(/adults/);
  for (const command of [{ type: 'ask-date', personId: peer.id }, { type: 'propose', personId: peer.id }, { type: 'marry', personId: peer.id, budget: 0n }, { type: 'try-child' }] as const) expect(() => resolveCommand(active, command, true)).toThrow(/adults/);
  const next = copyWorld(active); recordDeath(next, setup.peerId, 'Explicit unit mortality branch'); const dead = validateWorld(next, true);
  expect(dead.teenRelationships[0]).toEqual({ ...row, status: 'ended', ended: active.date, endReason: 'death', endedById: setup.peerId }); expect(partnerRelation(dead)).toBeUndefined();
  expect(unpackCheckpoint(packCheckpoint(dead), true)).toEqual(dead);
});

test.each(['roll', 'chance', 'missing-guard', 'duplicate', 'missing-active-row', 'gender', 'false-death', 'false-adult', 'unbacked-state'] as const)('contradictory %s consent cannot be imported', mutation => {
  const setup = teenRelationshipFixture(), accepted = resolveCommand(setup.world, teenProposal(setup.world, setup.peerId), true), next = copyWorld(accepted), row = next.teenRelationships[0];
  if (mutation === 'roll') row.roll = 100;
  if (mutation === 'chance') row.chance--;
  if (mutation === 'missing-guard') delete next.actionCounts[teenAttemptKey(row.proposerId, row.peerId, row.proposed.year)];
  if (mutation === 'duplicate') next.teenRelationships.push({ ...row, id: 'teen_relationship_999' });
  if (mutation === 'missing-active-row' || mutation === 'unbacked-state') next.teenRelationships = [];
  if (mutation === 'gender') row.peerGender = row.peerGender === 'male' ? 'female' : 'male';
  if (mutation === 'false-death') { row.status = 'ended'; row.endReason = 'death'; row.endedById = row.peerId; row.ended = next.date; }
  if (mutation === 'false-adult') { row.status = 'continued-as-adults'; row.endReason = 'adulthood'; row.ended = next.date; relationFor(next, next.activePersonId, setup.peerId)!.romance = 'dating'; }
  expect(() => validateWorld(next)).toThrow();
});

test('a forged declined second-person invitation cannot bypass an earlier ongoing accepted relationship', () => {
  const setup = teenRelationshipFixture(), active = acknowledgeTeen(resolveCommand(setup.world, teenProposal(setup.world, setup.peerId), true)), next = copyWorld(active), row = active.teenRelationships[0];
  const peer = createContact(next, { age: 14, schoolStudent: true }); connectPerson(next, peer.id); const relation = relationFor(next, next.activePersonId, peer.id)!;
  next.teenRelationships.push({ ...row, id: 'teen_relationship_999', relationshipId: relation.id, peerId: peer.id, peerGender: peer.gender, actorPreferences: [peer.gender], peerPreferences: [next.people[next.activePersonId].gender], knownRoles: [...relation.roles], status: 'declined', roll: 100 });
  next.actionCounts[teenAttemptKey(next.activePersonId, peer.id, next.date.year)] = 1;
  expect(() => validateWorld(next)).toThrow(/Overlapping/);
});

test('frozen history/index is reused while mutable command copies cannot retain a stale current map', () => {
  const setup = teenRelationshipFixture(), active = acknowledgeTeen(resolveCommand(setup.world, teenProposal(setup.world, setup.peerId), true));
  expect(teenRelationshipIndex(active)).toBe(teenRelationshipIndex(active)); expect(Object.isFrozen(teenRelationshipHistory(active, setup.relationshipId))).toBe(true);
  const mutable = copyWorld(active); expect(teenRelationshipIndex(mutable)).not.toBe(teenRelationshipIndex(mutable));
  const ended = resolveCommand(active, teenEnd(active, setup.peerId), true); expect(currentTeenRelationship(ended)).toBeUndefined(); expect(currentTeenRelationship(active)?.peerId).toBe(setup.peerId);
});

test.each(countryCodes)('%s applies the same explicit authored teen guards without spending currency or creating adult privileges', country => {
  const setup = teenRelationshipFixture(13, 13, 1, country), before = setup.world, next = resolveCommand(before, teenProposal(before, setup.peerId), true);
  expect(next.teenRelationships[0].country).toBe(country); expect(next.accounts).toEqual(before.accounts); expect(next.ledger).toEqual(before.ledger);
  expect(next.people[next.activePersonId].nationality).toBe(before.people[before.activePersonId].nationality); expect(romanceReason(next, next.people[setup.peerId])).toMatch(/adults/);
});

function finishOrdinaryYear(initial: ReturnType<typeof teenRelationshipFixture>['world']) {
  let world = resolveCommand(initial, { type: 'advance' }, true), steps = 0;
  while ((world.pending || world.annual) && steps++ < 100) {
    const command: GameCommand = world.pending?.kind === 'decision' ? { type: 'choose', eventId: world.pending.id, choiceId: world.pending.choices.find(choice => !choiceUnavailable(world, choice))!.id } : world.pending ? { type: 'acknowledge', resultId: world.pending.id } : { type: 'resume' };
    world = resolveCommand(world, command, true);
  }
  if (steps >= 100) throw Error('Ordinary year did not finish'); return world;
}

test('normal monthly progression retains mixed-age exclusivity, then transitions at the first actually processed adult month without a new draw', () => {
  const setup = teenRelationshipFixture(17, 16), active = acknowledgeTeen(resolveCommand(setup.world, teenProposal(setup.world, setup.peerId), true)), row = active.teenRelationships[0];
  // After the declared fixture, every date and outcome is from ordinary engine
  // commands; no birthday/stat/RNG override prepares either transition.
  const mixed = finishOrdinaryYear(active);
  expect(ageOn(mixed.people[mixed.activePersonId], mixed.date)).toBe(18); expect(ageOn(mixed.people[setup.peerId], mixed.date)).toBe(17); expect(mixed.teenRelationships[0]).toEqual(row);
  const peerGender = mixed.people[setup.peerId].gender;
  const preferences = acknowledgeTeen(resolveCommand(mixed, { type: 'relationship-preferences', attractedTo: [peerGender === 'male' ? 'female' : 'male'], wantsChildren: mixed.people[mixed.activePersonId].wantsChildren }, true));
  expect(preferences.teenRelationships[0]).toEqual(row); expect(preferences.people[preferences.activePersonId].attractedTo).not.toContain(peerGender);
  const expected = Array.from({ length: 12 }, (_, index) => monthFrom(mixed.date, index + 1)).find(date => ageOn(mixed.people[mixed.activePersonId], date) >= 18 && ageOn(mixed.people[setup.peerId], date) >= 18)!;
  const adult = finishOrdinaryYear(preferences);
  expect(adult.teenRelationships[0]).toEqual({ ...row, status: 'continued-as-adults', ended: expected, endReason: 'adulthood', endedById: null });
  expect(partnerRelation(adult)?.romance).toBe('dating'); expect(adult.npcCourtships.some(record => record.relationshipId === row.relationshipId)).toBe(false);
  expect(unpackCheckpoint(packCheckpoint(adult), true)).toEqual(adult);
}, 30000);

test('a genuine detained minor from ordinary crime/remand commands can end the ongoing relationship without a location or custody lock', () => {
  const setup = teenRelationshipFixture(17, 17), active = acknowledgeTeen(resolveCommand(setup.world, teenProposal(setup.world, setup.peerId), true)); let world = active;
  const arrest = () => world.pending?.kind === 'decision' && world.pending.templateId === 'arrest';
  for (const offence of ['vandalism', 'shoplift', 'pickpocket'] as const) {
    if (arrest()) break;
    world = resolveCommand(world, { type: 'crime', offence }, true);
    if (!arrest()) world = acknowledgeTeen(world);
  }
  let advanced = false;
  for (let steps = 0; steps < 60 && !arrest(); steps++) {
    if (world.pending?.kind === 'decision') world = resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: world.pending.choices.find(choice => !choiceUnavailable(world, choice))!.id }, true);
    else if (world.pending) world = acknowledgeTeen(world);
    else if (world.annual) world = resolveCommand(world, { type: 'resume' }, true);
    else if (!advanced) { advanced = true; world = resolveCommand(world, { type: 'advance' }, true); }
    else break;
  }
  expect(world.pending).toMatchObject({ kind: 'decision', templateId: 'arrest' });
  world = acknowledgeTeen(resolveCommand(world, { type: 'choose', eventId: world.pending!.id, choiceId: 'remand' }, true));
  expect(isConfined(world)).toBe(true); expect(teenDateReason(world, setup.peerId)).toBeDefined();
  const ended = resolveCommand(world, teenEnd(world, setup.peerId), true); expect(ended.teenRelationships[0].endReason).toBe('choice'); expect(ended.random).toEqual(world.random); expect(isConfined(ended)).toBe(true);
}, 30000);
