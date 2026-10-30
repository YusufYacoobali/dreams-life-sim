import { decodeWorld, encodeWorld, type World } from '../../src/game/model';
import { resolveCommand, recordDeath } from '../../src/game/engine';
import { activeOrganisation, eligibleMissionCrew, missionReason } from '../../src/game/systems/organisedCrime';
import fixture from '../fixtures/v3-employed-graduate.json';
function joined() {
  let world = decodeWorld(JSON.stringify(fixture));
  world.people[world.activePersonId].stats.energy = 100;
  world = resolveCommand(world, { type: 'organised-join', style: 'street-syndicate' });
  return resolveCommand(world, { type: 'acknowledge', resultId: world.pending!.id });
}
function run(world: World, seed = 1) {
  world.random.outcomes = seed;
  return resolveCommand(world, { type: 'organised-mission', gangId: activeOrganisation(world)!.id, mission: 'missing-envelope', approach: 'crew-led' });
}
test('selection, result participants, loyalty and memories use the same trusted crew after a cold reload', () => {
  const world = joined(), gang = activeOrganisation(world)!, state = gang.organised!;
  const [trusted, unsuitable] = state.members.filter(member => member.personId !== state.leaderId);
  trusted.loyalty = 80; unsuitable.loyalty = 44;
  expect(eligibleMissionCrew(world, gang).map(member => member.personId)).toEqual([trusted.personId]);
  expect(missionReason(world, gang, 'missing-envelope', 'crew-led')).toBeUndefined();
  const next = run(decodeWorld(encodeWorld(world)));
  const saved = activeOrganisation(next)!.organised!, job = saved.jobs.at(-1)!;
  expect(job.participantIds).toEqual([world.activePersonId, trusted.personId]);
  expect(saved.members.find(member => member.personId === unsuitable.personId)).toEqual(unsuitable);
  expect(saved.members.find(member => member.personId === trusted.personId)!.memories).toContain(`mission:missing-envelope:${job.success ? 'completed' : 'failed'}:${world.date.year}`);
  expect(decodeWorld(encodeWorld(next))).toEqual(next);
});
test.each(['loyalty', 'dead', 'former', 'city', 'hospital', 'wanted', 'health'] as const)('%s excludes the last suitable participant in UI and engine without consuming an attempt', reason => {
  const world = joined(), gang = activeOrganisation(world)!, state = gang.organised!;
  const [member, other] = state.members.filter(item => item.personId !== state.leaderId);
  other.loyalty = 0;
  const person = world.people[member.personId];
  if (reason === 'loyalty') member.loyalty = 44;
  if (reason === 'dead') recordDeath(world, person.id, 'test');
  if (reason === 'former') member.role = 'former';
  if (reason === 'city') person.city = 'Elsewhere';
  if (reason === 'hospital') person.health.hospitalizedUntil = world.date.year * 12 + world.date.month;
  if (reason === 'wanted') person.legal.wanted = true;
  if (reason === 'health') person.stats.health = 19;
  expect(eligibleMissionCrew(world, gang)).toEqual([]);
  expect(missionReason(world, gang, 'missing-envelope', 'crew-led')).toMatch(/trusted, available/);
  expect(missionReason(world, gang, 'missing-envelope', 'cautious')).toBeUndefined();
  expect(missionReason(world, gang, 'missing-envelope', 'bold')).toBeUndefined();
  const before = encodeWorld(world);
  expect(() => run(world)).toThrow(/trusted, available/);
  // run only sets the deterministic seed, and a failed command itself cannot alter gameplay.
  world.random.outcomes = JSON.parse(before).random.outcomes;
  expect(encodeWorld(world)).toBe(before);
});
test('eligible participant skill changes the success threshold and excludes nonparticipants from its calculation', () => {
  const low = joined(), state = activeOrganisation(low)!.organised!;
  const crew = state.members.filter(member => member.personId !== state.leaderId);
  crew.forEach(member => { member.loyalty = 45; low.people[member.personId].legal.crimeSkill = 0; });
  const high = decodeWorld(encodeWorld(low));
  eligibleMissionCrew(high, activeOrganisation(high)!).forEach(member => { high.people[member.personId].legal.crimeSkill = 100; });
  let difference = false;
  for (let seed = 1; seed < 250 && !difference; seed++) {
    const lowJob = activeOrganisation(run(decodeWorld(encodeWorld(low)), seed))!.organised!.jobs.at(-1)!;
    const highJob = activeOrganisation(run(decodeWorld(encodeWorld(high)), seed))!.organised!.jobs.at(-1)!;
    if (!lowJob.success && highJob.success) difference = true;
  }
  expect(difference).toBe(true);
});

test('actual NPC remand and a paid trip exclude the same saved crew after reload', () => {
  const { recordOrganisedCrime } = require('../../src/game/systems/legal') as typeof import('../../src/game/systems/legal');
  const { tripQuote } = require('../../src/game/systems/travel') as typeof import('../../src/game/systems/travel');
  const original = joined(), originalActor = original.activePersonId;
  const members = activeOrganisation(original)!.organised!.members.filter(member => member.personId !== activeOrganisation(original)!.organised!.leaderId);
  const detained = members[0].personId, travelling = members[1].personId;
  recordOrganisedCrime(original, detained, 0n, { riskDeltaBps: 10000, evidenceDelta: 0, reported: true });
  expect(eligibleMissionCrew(original, activeOrganisation(original)!).map(member => member.personId)).toEqual([travelling]);
  original.activePersonId = travelling;
  let away = resolveCommand(original, { type: 'book-trip', destinationId: 'paris', duration: 1, companionIds: [], focus: 'rest', quotedTotal: tripQuote(original, 'paris', 1).total });
  away = resolveCommand(away, { type: 'acknowledge', resultId: away.pending!.id });
  away.activePersonId = originalActor;
  const cold = decodeWorld(encodeWorld(away)), gang = activeOrganisation(cold)!;
  expect(eligibleMissionCrew(cold, gang)).toEqual([]);
  expect(missionReason(cold, gang, 'missing-envelope', 'crew-led')).toMatch(/trusted, available/);
  expect(() => run(cold)).toThrow(/trusted, available/);
  expect(cold.cases.find(item => item.personId === detained)).toMatchObject({ detained: true });
  expect(cold.trips.find(item => item.participantIds.includes(travelling))).toMatchObject({ status: 'active' });
});
