import { decodeWorld, encodeWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { organisedMissions } from '../../src/game/content/organisedCrime';
import { activeOrganisation } from '../../src/game/systems/organisedCrime';
import { accountFor, post } from '../../src/game/systems/common';
import { relationFor } from '../../src/game/systems/relationshipQueries';
import type { OrganisedCrimeState } from '../../src/game/systems/organisedCrimeSchemas';
import graduate from '../fixtures/v3-employed-graduate.json';
type Style = OrganisedCrimeState['style'];
type Job = OrganisedCrimeState['jobs'][number];
function joined(style: Style, rank = 0) {
  const input = decodeWorld(JSON.stringify(graduate));
  input.people[input.activePersonId].stats.energy = input.people[input.activePersonId].stats.health = 100;
  let world = resolveCommand(input, { type: 'organised-join', style });
  world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending!.id });
  const gang = activeOrganisation(world)!; gang.organised!.rank = rank; gang.rank = Math.min(rank, 3);
  return world;
}
function run(world: World, mission: string, approach: 'cautious' | 'bold' | 'crew-led', seed: number) {
  world.random.outcomes = seed;
  return resolveCommand(world, { type: 'organised-mission', gangId: activeOrganisation(world)!.id, mission, approach });
}
function find(world: World, desired: NonNullable<Job['mission']>['outcome'], approach: 'cautious' | 'bold' | 'crew-led' = 'crew-led', mission = 'missing-envelope') {
  for (let seed = 0; seed < 500; seed++) {
    const next = run(world, mission, approach, seed), job = activeOrganisation(next)!.organised!.jobs.at(-1)!;
    if (job.mission!.outcome === desired) return next;
  }
  throw new Error('No controlled seed for ' + desired);
}
const combinations = organisedMissions.flatMap(mission => mission.styles.map(style => [mission.id, style as Style, mission.rank] as const));
test.each(combinations)('%s / %s has at least three actual distinct result paths and frozen legal/financial facts', (mission, style, rank) => {
  const world = joined(style, rank), seen = new Set<string>();
  for (let seed = 0; seed < 300 && seen.size < 3; seed++) {
    const next = run(world, mission, 'crew-led', seed), job = activeOrganisation(next)!.organised!.jobs.at(-1)!, incident = next.incidents.find(item => item.id === job.incidentId)!;
    if (seen.has(job.mission!.outcome)) continue;
    seen.add(job.mission!.outcome);
    expect(incident.organisedMission).toMatchObject({ rulesVersion: 2, category: mission, style, jobId: job.id, participantIds: job.participantIds, result: job.mission });
    expect(incident.offence).toBe(style === 'fraud-network' ? 'financial-scam' : style === 'smuggling-ring' ? 'contraband' : mission === 'protection-dispute' ? 'extortion' : 'organized-job');
    expect(incident.gain.minor).toBe(job.proceeds);
    expect(accountFor(next).cash - accountFor(world).cash).toBe(job.proceeds - job.mission!.loss);
    expect(job.mission!.crew.map(member => member.personId)).toEqual(job.participantIds.slice(1));
    expect(job.mission!.crew.every(member => member.loyalty >= 45)).toBe(true);
    expect(decodeWorld(encodeWorld(next))).toStrictEqual(next);
    const result = [next.pending, ...next.deferred.map(item => item.event)].find(item => item?.kind === 'result' && item.body === job.mission!.body);
    expect(result).toBeDefined(); // even when the arrest takes priority
  }
  expect(seen.size).toBeGreaterThanOrEqual(3);
});
test('the same premise creates street rivalry, conserved fraud victim transfers or saved cargo and different genuine charges', () => {
  const street = joined('street-syndicate'), oldRival = activeOrganisation(street)!.organised!.rivals[0];
  const win = find(street, 'quiet-profit');
  expect(activeOrganisation(win)!.organised!.rivals[0].influence).toBeLessThan(oldRival.influence);
  const setback = find(street, 'rival-advance');
  expect(activeOrganisation(setback)!.organised!.rivals[0].influence).toBeGreaterThan(oldRival.influence);
  const costly = find(street, 'costly-respect');
  expect(activeOrganisation(costly)!.organised!.jobs.at(-1)!.mission!.reputationDelta).toBeGreaterThan(0);
  expect(activeOrganisation(costly)!.organised!.jobs.at(-1)!.mission!.loss).toBeGreaterThan(0n);
  const fraud = joined('fraud-network'), paid = find(fraud, 'victim-complaint');
  const job = activeOrganisation(paid)!.organised!.jobs.at(-1)!, victimId = job.mission!.victimId!;
  expect(paid.accounts.reduce((sum, account) => sum + account.cash, 0n)).toBe(fraud.accounts.reduce((sum, account) => sum + account.cash, 0n));
  expect(accountFor(fraud, fraud.people[victimId]).cash - accountFor(paid, paid.people[victimId]).cash).toBe(job.proceeds);
  expect(relationFor(paid, paid.activePersonId, victimId)!.memories).toContain('crime-victim:' + job.incidentId);
  expect(paid.cases.some(item => item.incidentId === job.incidentId && item.offence === 'financial-scam')).toBe(true);
  const smuggling = find(joined('smuggling-ring'), 'cargo-confiscation');
  const cargoJob = activeOrganisation(smuggling)!.organised!.jobs.at(-1)!;
  expect(cargoJob.mission!.cargo).toMatchObject({ id: 'cargo_' + cargoJob.incidentId, status: 'confiscated' });
  expect(smuggling.cases.some(item => item.incidentId === cargoJob.incidentId && item.offence === 'contraband')).toBe(true);
});
test('a public financial scandal creates a usable public response, damages the actual job and survives resolution', () => {
  const before = joined('fraud-network'), next = find(before, 'public-scandal');
  const job = activeOrganisation(next)!.organised!.jobs.at(-1)!;
  expect(next.people[next.activePersonId].employment!.id).toBe(before.people[before.activePersonId].employment!.id);
  expect(next.people[next.activePersonId].employment!.performance).toBe(before.people[before.activePersonId].employment!.performance - 12);
  expect(next.people[next.activePersonId].publicLife.image).toBe(before.people[before.activePersonId].publicLife.image - 12);
  expect(next.controversies.find(item => item.id === job.mission!.scandalId)).toMatchObject({ personId: next.activePersonId, response: null });
  let current = next;
  for (let guard = 0; guard < 8 && !(current.pending?.kind === 'decision' && current.pending.templateId === 'public-controversy'); guard++) {
    if (current.pending?.kind === 'decision') current = resolveCommand(current, { type: 'choose', eventId: current.pending.id, choiceId: 'remand' });
    else if (current.pending?.kind === 'result') current = resolveCommand(current, { type: 'acknowledge', resultId: current.pending.id });
  }
  expect(current.pending?.kind === 'decision' && current.pending.templateId).toBe('public-controversy');
  current = resolveCommand(current, { type: 'choose', eventId: current.pending!.id, choiceId: 'apologise' });
  expect(current.controversies.find(item => item.id === job.mission!.scandalId)!.response).toBe('apologise');
  expect(current.cases).toHaveLength(next.cases.length);
  expect(decodeWorld(encodeWorld(current))).toStrictEqual(current);
});
test('crew resentment and betrayal belong only to genuine selected participants and persist as saved relationships', () => {
  const before = joined('smuggling-ring'), resentful = find(before, 'exposed-profit');
  const job = activeOrganisation(resentful)!.organised!.jobs.at(-1)!, personId = job.mission!.memberId!;
  expect(job.participantIds).toContain(personId);
  const original = activeOrganisation(before)!.organised!.members.find(member => member.personId === personId)!;
  expect(activeOrganisation(resentful)!.organised!.members.find(member => member.personId === personId)!.loyalty).toBe(original.loyalty - 4);
  const betrayed = find(before, 'associate-betrayal'), betrayal = activeOrganisation(betrayed)!.organised!.jobs.at(-1)!;
  const state = activeOrganisation(betrayed)!.organised!;
  expect(betrayal.participantIds).toContain(betrayal.mission!.memberId);
  expect(state.members.find(member => member.personId === betrayal.mission!.memberId)!.role).toBe('former');
  expect(state.rivals.some(rival => rival.personId === betrayal.mission!.memberId && rival.influence > 0)).toBe(true);
  expect(relationFor(betrayed, betrayed.activePersonId, betrayal.mission!.memberId!)!.memories).toContain('mission-betrayal:' + betrayal.incidentId);
  expect(decodeWorld(encodeWorld(betrayed))).toStrictEqual(betrayed);
});
test('cautious, bold and crew-led have distinct success, payout, expense and exposure tradeoffs', () => {
  const world = joined('street-syndicate');
  const variants = (['cautious', 'bold', 'crew-led'] as const).map(approach => find(world, 'quiet-profit', approach));
  const jobs = variants.map(variant => activeOrganisation(variant)!.organised!.jobs.at(-1)!);
  expect(jobs[1].proceeds).toBeGreaterThan(jobs[2].proceeds); expect(jobs[2].proceeds).toBeGreaterThan(jobs[0].proceeds);
  expect(jobs[0].mission!.successChance).toBeGreaterThan(jobs[1].mission!.successChance);
  expect(jobs[0].participantIds).toEqual([world.activePersonId]); expect(jobs[1].participantIds).toEqual([world.activePersonId]); expect(jobs[2].participantIds.length).toBeGreaterThan(1);
  const risks = variants.map((variant, index) => variant.incidents.find(item => item.id === jobs[index].incidentId)!.riskBps);
  expect(risks[0]).toBeLessThan(risks[2]); expect(risks[2]).toBeLessThan(risks[1]);
  const carefulLoss = activeOrganisation(find(world, 'costly-respect', 'cautious'))!.organised!.jobs.at(-1)!.mission!.loss;
  const boldLoss = activeOrganisation(find(world, 'costly-respect', 'bold'))!.organised!.jobs.at(-1)!.mission!.loss;
  expect(boldLoss).toBeGreaterThan(carefulLoss);
});
test('legacy assignment rows and incidents retain their absent metadata after a new versioned job', () => {
  let world = find(joined('street-syndicate'), 'quiet-profit', 'cautious');
  const job = activeOrganisation(world)!.organised!.jobs[0], incident = world.incidents.find(item => item.id === job.incidentId)!;
  delete job.mission; delete incident.organisedMission;
  world = decodeWorld(encodeWorld(world));
  while (world.pending?.kind === 'result') world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
  if (world.pending) throw new Error('Expected unarrested historical input');
  const beforeJob = { ...activeOrganisation(world)!.organised!.jobs[0] }, beforeIncident = { ...world.incidents.find(item => item.id === incident.id)! };
  const after = run(world, 'missing-envelope', 'cautious', 27);
  expect(activeOrganisation(after)!.organised!.jobs[0]).toStrictEqual(beforeJob);
  expect(after.incidents.find(item => item.id === incident.id)).toStrictEqual(beforeIncident);
  expect(Object.hasOwn(activeOrganisation(after)!.organised!.jobs[0], 'mission')).toBe(false);
});
test('cold decoding rejects forged money, participant and legal snapshots instead of accepting a new story about an old incident', () => {
  const world = find(joined('fraud-network'), 'victim-complaint');
  for (const tamper of ['loss', 'participants', 'offence', 'victim-payment', 'snapshot'] as const) {
    const saved = JSON.parse(encodeWorld(world)), gang = saved.gangs.find((item: { personId: string }) => item.personId === world.activePersonId), job = gang.organised.jobs.at(-1), incident = saved.incidents.find((item: { id: string }) => item.id === job.incidentId);
    if (tamper === 'loss') job.mission.loss = '999';
    if (tamper === 'participants') incident.organisedMission.participantIds = [world.activePersonId];
    if (tamper === 'offence') incident.offence = 'organized-job';
    if (tamper === 'victim-payment') incident.organisedMission.result.victimTransactionId = incident.organisedMission.result.proceedsTransactionId;
    if (tamper === 'snapshot') job.mission.body = 'Nobody complained.';
    expect(() => decodeWorld(JSON.stringify(saved))).toThrow();
  }
});

test('a failure cannot invent a rival after all saved rivals have died, or claim nonexistent payments at zero available cash', () => {
  const { recordDeath } = require('../../src/game/engine') as typeof import('../../src/game/engine');
  const world = joined('street-syndicate'), state = activeOrganisation(world)!.organised!;
  for (const rival of state.rivals) recordDeath(world, rival.personId, 'test');
  const blocked = encodeWorld(world);
  expect(() => run(world, 'territory-dispute', 'cautious', world.random.outcomes)).toThrow(/living rival/);
  expect(encodeWorld(world)).toBe(blocked);
  const next = find(world, 'costly-respect', 'bold');
  const job = activeOrganisation(next)!.organised!.jobs.at(-1)!;
  expect(job.mission!.rivalId).toBeNull();
  expect(job.mission!.body).not.toMatch(/rival|competing crew/i);
  const poor = joined('fraud-network'), account = accountFor(poor);
  post(poor, -account.cash, 0n, 'living', 'Savings already spent before the assignment');
  const failed = find(poor, 'collapsed-scheme'), failure = activeOrganisation(failed)!.organised!.jobs.at(-1)!;
  expect(failure.mission!.loss).toBe(0n);
  expect(failure.mission!.body).not.toMatch(/You (cover|pay) /);
  expect(failed.ledger.filter(item => item.category === 'crime-assignment-loss')).toEqual([]);
});
