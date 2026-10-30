import { decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { monthFrom } from '../../src/game/calendar';
import { activeSentence, legalMonth } from '../../src/game/systems/legal';
import { enableOverhaul } from '../../src/game/systems/overhaul';
import { accountFor } from '../../src/game/systems/common';
import { createContact } from '../../src/game/systems/npcs';
import { connectPerson } from '../../src/game/systems/relationshipContacts';
import { relationFor } from '../../src/game/systems/relationshipQueries';
import graduate from '../fixtures/v3-employed-graduate.json';

function fixture() {
  const world = decodeWorld(JSON.stringify(graduate)); enableOverhaul(world);
  const person = world.people[world.activePersonId];
  person.legal.crimeSkill = 100; person.stats.smarts = 100;
  person.stats.energy = 100; person.stats.health = 100;
  world.random.outcomes = 0;
  return world;
}
function acknowledge(world: World) {
  if (world.pending?.kind !== 'result') throw new Error('Expected result');
  return resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
}
function choose(world: World, choiceId: string) {
  if (world.pending?.kind !== 'decision') throw new Error('Expected legal decision');
  return resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId });
}
const totalCash = (world: World) => world.accounts.reduce((sum, account) => sum + account.cash, 0n);

test.each(['extortion', 'high-value-robbery'] as const)('%s debits its real victim, credits matching proceeds and damages the actual known relationship', offence => {
  const before = fixture(), actor = before.people[before.activePersonId];
  const victim = createContact(before, { age: 30, country: actor.country, city: actor.city });
  victim.stats.health = 100; connectPerson(before, victim.id);
  const relation = relationFor(before, actor.id, victim.id)!; relation.strength = relation.trust = 90;
  const actorCash = accountFor(before).cash, victimCash = accountFor(before, victim).cash, total = totalCash(before), ledgerStart = before.ledger.length;
  const input = encodeWorld(before);
  const after = resolveCommand(before, { type: 'crime', offence, victimId: victim.id });
  const source = after.incidents.find(incident => incident.personId === actor.id)!;
  expect(source).toMatchObject({ offence, victimId: victim.id, victimKilled: false });
  expect(source.gain.minor).toBeGreaterThan(0n);
  expect(accountFor(after).cash - actorCash).toBe(source.gain.minor);
  expect(victimCash - accountFor(after, after.people[victim.id]).cash).toBe(source.gain.minor);
  expect(totalCash(after)).toBe(total);
  expect(after.ledger.slice(ledgerStart).map(row => [row.personId, row.cashDelta, row.category])).toEqual([
    [victim.id, -source.gain.minor, 'crime-loss'], [actor.id, source.gain.minor, 'crime-proceeds'],
  ]);
  expect(relationFor(after, actor.id, victim.id)).toMatchObject({ strength: offence === 'high-value-robbery' ? 60 : 72, trust: 55 });
  expect(relationFor(after, actor.id, victim.id)!.memories).toContain('crime-victim:' + source.id);
  if (offence === 'high-value-robbery') {
    expect(after.people[victim.id].stats.health).toBeLessThan(100);
    expect(after.people[victim.id].health.conditions.some(condition => condition.type === 'fracture')).toBe(true);
    expect(source.restitution.minor).toBeGreaterThan(source.gain.minor);
  } else {
    expect(after.people[victim.id].stats.health).toBe(100);
    expect(source.restitution.minor).toBe(source.gain.minor);
  }
  expect(after.cases.find(item => item.incidentId === source.id)).toMatchObject({ offence, personId: actor.id, status: 'awaiting-trial' });
  expect(encodeWorld(before)).toBe(input);
  expect(decodeWorld(encodeWorld(after))).toEqual(after);
});

test.each(['vehicle-theft', 'financial-scam'] as const)('%s saves an actual payoff and evidence, then uses the existing arrest, hearing, remand credit and conviction pipeline', offence => {
  const before = fixture(), bank = accountFor(before).cash, assetIds = before.assets.map(asset => asset.id);
  let world = resolveCommand(before, { type: 'crime', offence });
  const source = world.incidents.find(incident => incident.personId === world.activePersonId)!;
  expect(source.offence).toBe(offence); expect(source.stage).toBe('charged'); expect(source.evidence).toBeGreaterThan(0);
  if (offence === 'vehicle-theft') {
    expect(source.gain.minor).toBe(0n);
    expect(accountFor(world).cash).toBe(bank);
    expect(world.assets).toHaveLength(assetIds.length + 1);
    expect(world.assets.at(-1)).toMatchObject({ ownerId: null, ownershipSource: 'theft', pricePaid: 0n, stolen: { incidentId: source.id, status: 'seized' } });
  } else {
    expect(source.gain.minor).toBeGreaterThan(0n);
    expect(accountFor(world).cash - bank).toBe(source.gain.minor);
    expect(world.ledger.at(-1)).toMatchObject({ category: 'crime-proceeds', cashDelta: source.gain.minor });
    expect(world.assets.map(asset => asset.id)).toEqual(assetIds);
  }
  const caseId = source.caseId!;
  expect(world.cases.find(item => item.id === caseId)).toMatchObject({ offence, status: 'awaiting-trial', incidentId: source.id, detained: true });
  world = acknowledge(choose(decodeWorld(encodeWorld(world)), 'remand'));
  world.date = monthFrom(world.date, 1); legalMonth(world);
  expect(world.pending?.kind === 'decision' && world.pending.templateId).toBe('court-hearing');
  world = acknowledge(choose(decodeWorld(encodeWorld(world)), 'guilty'));
  const convicted = world.cases.find(item => item.id === caseId)!;
  expect(convicted).toMatchObject({ status: 'convicted', offence, plea: 'guilty' });
  expect(convicted.fine.minor).toBeGreaterThan(0n);
  expect(activeSentence(world)).toMatchObject({ personId: world.activePersonId, caseIds: [caseId], creditedMonths: 1 });
  expect(world.people[world.activePersonId].employment).toBeNull();
  expect(world.remand.filter(item => item.usedBySentenceId === convicted.sentenceId)).toHaveLength(1);
  expect(world.ledger.filter(item => item.personId === world.activePersonId && item.category === 'crime-proceeds')).toHaveLength(offence === 'vehicle-theft' ? 0 : 1);
  expect(() => choose(world, 'guilty')).toThrow();
  expect(validateWorld(decodeWorld(encodeWorld(world)))).toEqual(world);
});

test('new named-victim crimes reject children and unavailable victims before committing any payment or incident', () => {
  const world = fixture(), actor = world.people[world.activePersonId];
  const minor = createContact(world, { age: 16, country: actor.country, city: actor.city });
  const remote = createContact(world, { age: 30, country: actor.country, city: 'Chicago' });
  const before = encodeWorld(world);
  for (const victimId of [minor.id, remote.id, actor.id, 'person_missing'])
    expect(() => resolveCommand(world, { type: 'crime', offence: 'extortion', victimId })).toThrow(/living adult/);
  expect(encodeWorld(world)).toBe(before);
});
