import { createHash } from 'node:crypto';
import { gunzipSync, strFromU8 } from 'fflate';
import { decodeSave } from '../../src/persistence/archive';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { decodeWorld, encodeWorld, moneyJSON, validateWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { monthFrom } from '../../src/game/calendar';
import { careerMonth, startCareerContract } from '../../src/game/systems/careers';
import { financialActors } from '../../src/game/systems/households';
import { endEmployment, workMonth } from '../../src/game/systems/work';
import actorArchive from '../fixtures/v12-career-archive.json';
import graduate from '../fixtures/v3-employed-graduate.json';

function raw(payload: string): Record<string, any> {
  const frame = JSON.parse(payload);
  return JSON.parse(strFromU8(gunzipSync(Buffer.from(frame.data, 'base64'))));
}
function rawComparable(value: unknown) { return JSON.parse(JSON.stringify(value, moneyJSON)); }
function legacyActor() { return unpackCheckpoint(actorArchive.snapshots[0].payload); }
function legacyModel() {
  const world = decodeWorld(JSON.stringify(graduate)); endEmployment(world);
  const person = world.people[world.activePersonId]; person.skills.modeling = 90;
  person.stats.looks = person.stats.fitness = person.stats.health = person.stats.energy = 100;
  startCareerContract(world, 'model', 6000000n, person, false);
  return validateWorld(world);
}
function legacyPeriod(input: World) {
  const world = decodeWorld(encodeWorld(input)); world.date = monthFrom(world.date, 1);
  for (const person of financialActors(world)) workMonth(world, person);
  careerMonth(world);
  for (const person of financialActors(world)) person.lastEconomicMonth = world.date.year * 12 + world.date.month - 1;
  return validateWorld(world);
}
function legacyProof(world: World) {
  const person = world.people[world.activePersonId];
  return { careers: world.careers, workHistory: world.workHistory, ledger: world.ledger, random: world.random, pending: world.pending,
    player: { stats: person.stats, employment: person.employment, finance: person.finance } };
}
const sha = (value: unknown) => createHash('sha256').update(JSON.stringify(value, moneyJSON)).digest('hex');

test('the published actor archive preserves actual pay, project, pending release, RNG and every checkpoint payload', () => {
  const saved = decodeSave(JSON.stringify(actorArchive)), original = raw(actorArchive.checkpoint), world = saved.world;
  const expectedCareers = (before: Record<string, any>) => before.careers.map((career: any) => ({ ...career, projects: career.projects.map((project: any) => ({ ...project, currency: career.currency })) }));
  expect(rawComparable(world.careers)).toEqual(expectedCareers(original));
  expect(rawComparable(world.pending)).toEqual(original.pending);
  expect(rawComparable(world.random)).toEqual(original.random);
  expect(rawComparable(world.ledger)).toEqual(original.ledger);
  expect(world.careers[0].projects[0].grossEarned).toBe(2000000n);
  expect(world.careers[0].projects[0].months).toBe(6);
  expect(world.annual?.monthsProcessed).toBe(6);
  expect(saved.snapshots).toEqual(actorArchive.snapshots);
  for (const point of saved.snapshots) {
    const current = unpackCheckpoint(point.payload), before = raw(point.payload);
    expect(rawComparable(current.careers)).toEqual(expectedCareers(before));
    expect(rawComparable(current.random)).toEqual(before.random);
    expect(current.careers[0]).not.toHaveProperty('actor');
    expect(current.careers[0]).not.toHaveProperty('modelCareer');
    expect(current.careers[0].projects[0]).not.toHaveProperty('creative');
  }
});

test.each(['actor', 'model'] as const)('legacy %s contracts finish the original monthly loop with unchanged outcomes and no prospective state', kind => {
  let world = kind === 'actor' ? legacyActor() : legacyModel();
  const career = world.careers.find(item => item.kind === kind)!;
  const periods = career.contractMonthsRemaining;
  for (let index = 0; index < periods; index++) world = legacyPeriod(world);
  const completed = world.careers.find(item => item.kind === kind)!;
  expect(completed.status).toBe('between'); expect(completed.projects[0].status).toBe('completed');
  expect(completed.projects[0].grossEarned).toBe(world.workHistory.find(item => item.id === completed.projects[0].employmentId)!.grossEarned);
  expect(completed).not.toHaveProperty('actor'); expect(completed).not.toHaveProperty('modelCareer');
  expect(completed.projects[0]).not.toHaveProperty('creative');
  // Filled from the original generic career loop before this overhaul's integration.
  const expected = kind === 'actor' ? '7153af8557fe7dca758a16b149baee2f4ee28259ce8768a968b94e9e978f8f1f' : '6ed1a92af48d43539f7b25fd19525910e6911305362f7576462c75c604c144a0';
  expect(sha(legacyProof(world))).toBe(expected);
});

test('active archived actor work cannot be replaced by opting into new mechanics', () => {
  const world = legacyActor(), before = encodeWorld(world);
  expect(() => resolveCommand(world, { type: 'actor-enter' } as Parameters<typeof resolveCommand>[1])).toThrow();
  expect(encodeWorld(world)).toBe(before);
  expect(world.careers[0].contractMonthsRemaining).toBe(6);
});

test.each(['actor', 'model'] as const)('opting an eligible legacy %s into the new career preserves old credits and pays no historical rewards', kind => {
  let before = kind === 'actor' ? decodeSave(JSON.stringify(actorArchive)).world : legacyModel();
  if (kind === 'model') for (let index = 0; index < 3; index++) before = legacyPeriod(before);
  if (before.pending?.kind === 'result') before = resolveCommand(before, { type: 'acknowledge', resultId: before.pending.id });
  const oldCareer = before.careers.find(item => item.kind === kind)!, projects = rawComparable(oldCareer.projects), oldRows = rawComparable(before.workHistory), ledger = rawComparable(before.ledger);
  const next = resolveCommand(before, { type: kind === 'actor' ? 'actor-enter' : 'model-enter' } as Parameters<typeof resolveCommand>[1]);
  const recorded = next.careers.find(item => item.kind === kind)!, state = kind === 'actor' ? recorded.actor!.industry : recorded.modelCareer!.industry;
  expect(next).toMatchObject({ schemaVersion: 50, engineVersion: 52, contentVersion: 29 });
  expect(rawComparable(recorded.projects)).toEqual(projects); expect(rawComparable(next.workHistory.slice(0, before.workHistory.length))).toEqual(oldRows);
  expect(rawComparable(next.ledger)).toEqual(ledger); expect(state.totalGross).toBe(0n); expect(state.totalCommission).toBe(0n);
  expect(recorded.projects[0].responseRoll).toBe(oldCareer.projects[0].responseRoll);
  expect(recorded.projects[0].award).toBe(oldCareer.projects[0].award);
  expect(recorded.projects.every(project => !project.creative)).toBe(true);
});
