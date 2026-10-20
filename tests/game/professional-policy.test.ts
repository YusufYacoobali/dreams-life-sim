import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createLife, randomCreation } from '../../src/game/createLife';
import { decodeWorld, encodeWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { accountFor } from '../../src/game/systems/common';
import { adoptionFee, childrenOf, conceptionReason } from '../../src/game/systems/family';
import { otherPerson, partnerRelation } from '../../src/game/systems/relationships';
import { countries } from '../../src/game/countries';
import { createProfessionalLife, professionalAdoptionFallback, professionalColdResume, professionalMilestones, runProfessionalPolicy } from '../support/professionalPolicy';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import marriageFixture from '../fixtures/v5-marriage-result.json';
import auCheckpoint from '../fixtures/v33-natural-professional-au-checkpoint.json';

test('the policy begins with actual saved birth acknowledgement, retaining creation RNG, people and money without an acknowledgement override', async () => {
  const seed = 900, input = { ...randomCreation(seed), country: 'US' as const, city: countries.US.cities[0], background: 'ordinary' as const };
  const created = createLife('life_professional_US_900', seed, input, { year: 2000, month: 1, day: 1 }), initial = await createProfessionalLife('US', seed);
  expect(created.birthAcknowledged).toBe(false); expect(initial.birthAcknowledged).toBe(true); expect(initial.revision).toBe(1); expect(Object.isFrozen(initial)).toBe(true);
  expect(initial.random).toEqual(created.random); expect(initial.people).toEqual(created.people); expect(initial.accounts).toEqual(created.accounts); expect(initial.ledger).toEqual(created.ledger);
});

test('bounded ordinary childhood records actual attended school while keeping later qualifications, money and life outcomes explicitly unreached', async () => {
  const initial = await createProfessionalLife('US', 900), original = encodeWorld(initial), { world, trace, report } = runProfessionalPolicy(initial, { maxYears: 8 });
  expect(encodeWorld(initial)).toBe(original); expect(world.activePersonId).toBe(initial.activePersonId); expect(report.naturallyDied).toBe(false); expect(report.ageAtEnd).toBe(8);
  expect(report.milestones.primarySchool.status).toBe('reached'); expect(world.schoolCommunities.some(row => row.personId === initial.activePersonId && row.periods.length > 0)).toBe(true);
  expect(world.people[world.activePersonId].education.qualifications).toHaveLength(0); expect(world.workHistory.filter(row => row.personId === initial.activePersonId)).toHaveLength(0);
  for (const stage of ['degree', 'paidQualifiedJob', 'marriage', 'mortgageHome', 'investment', 'retirement', 'death', 'estate'] as const) expect(report.milestones[stage].status).toBe('unreached-at-policy-bound');
  expect(report.everyRequestedMilestoneReached).toBe(false); expect(Object.keys(report.milestones)).toEqual([...professionalMilestones]); expect(report.commandsCommitted).toBe(trace.length); expect(report.coldChecks.some(row => row.reason === 'primarySchool')).toBe(true);
  expect(() => runProfessionalPolicy(world, { maxYears: 1 })).toThrow(); expect(() => runProfessionalPolicy(initial, { maxYears: 151 })).toThrow();
}, 30000);

test('the documented fallback reviews an actual visible permanent conception block and pays for real adoption through the ordinary command', () => {
  // Genuine stored marriage boundary, not a natural birth-to-death policy claim.
  let world = decodeWorld(JSON.stringify(marriageFixture), true); world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending!.id }, true);
  const player = world.people[world.activePersonId], partner = otherPerson(world, partnerRelation(world)!);
  expect(conceptionReason(world, player, partner)).toMatch(/reproductive capacities|current fertility/);
  const before = encodeWorld(world), command = professionalAdoptionFallback(world), cash = accountFor(world).cash, fee = adoptionFee(world), people = Object.keys(world.people).length;
  expect(command).toEqual({ type: 'adopt', age: 0 }); expect(encodeWorld(world)).toBe(before);
  const result = resolveCommand(world, command!, true), child = childrenOf(result)[0];
  expect(Object.keys(result.people)).toHaveLength(people + 1); expect(accountFor(result).cash).toBe(cash - fee); expect(result.ledger.at(-1)).toMatchObject({ category: 'adoption', cashDelta: -fee, personId: player.id });
  expect(childrenOf(result, partner.id).map(row => row.id)).toContain(child.id); expect(professionalAdoptionFallback(result)).toBeNull(); expect(decodeWorld(encodeWorld(result), true)).toEqual(result);
});

test('the genuine natural AU world beyond the plain20M limit cold-resumes through production v4 without changing any field or bound', () => {
  // New genuine pure-engine observation from the failed policy, not a rewritten
  // fixture or a claim that its post-birth progression used SQLite or a device.
  const bytes = readFileSync(join(__dirname, '../fixtures/v33-natural-professional-au-checkpoint.json'));
  const sha = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
  expect(bytes.length).toBe(1224772); expect(sha(bytes)).toBe('e78192b5d1169e8e12d6ead6d07d17c8ccb172852c02f58d6b2cc14bb713e5ad');
  expect(auCheckpoint.producerCommit).toBe('41c59d975c83c44e83ce06ece4ca3f2ccf200907');
  expect(auCheckpoint.versions).toEqual({ world: 33, engine: 34, content: 9 });
  expect(sha(auCheckpoint.checkpoint)).toBe('4eb6bf75887b3bf3fab2538022e0d0fda7a67e0db0b356474f8c3d170a1c1144');
  const frame = JSON.parse(auCheckpoint.checkpoint); expect(frame.format).toBe('dreams-checkpoint-v4'); expect(frame.bytes).toBe(11494720); expect(frame.bytes).toBeLessThan(32_000_000);
  const world = unpackCheckpoint(auCheckpoint.checkpoint, true), encoded = encodeWorld(world);
  expect(world.revision).toBe(593); expect(Object.keys(world.people)).toHaveLength(34); expect(world.ledger).toHaveLength(69477); expect(encoded.length).toBe(22124524); expect(encoded.length).toBeGreaterThan(20_000_000); expect(Buffer.byteLength(encoded)).toBeLessThan(80_000_000);
  expect(sha(encoded)).toBe('dfe1fc0f8ac438463c391d4af39945151c623d4f11c2945d0a4c53c280206184'); expect(() => decodeWorld(encoded, true)).toThrow('Save is too large');
  const cold = professionalColdResume(world, 'natural AU903 before the failing next command');
  expect(encodeWorld(cold)).toBe(encoded); expect(Object.isFrozen(cold)).toBe(true); expect(Object.isFrozen(cold.ledger)).toBe(true);
}, 30000);
