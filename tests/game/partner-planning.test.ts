import { copyWorld, decodeWorld, encodeWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { randomInteger } from '../../src/game/random';
import { babyDiscussionReason, tryForBabyReason } from '../../src/game/systems/family';
import { otherPerson, partnerRelation } from '../../src/game/systems/relationships';
import marriage from '../fixtures/v5-marriage-result.json';

function couple() {
  const saved = decodeWorld(JSON.stringify(marriage));
  const world = resolveCommand(saved, { type: 'acknowledge', resultId: saved.pending!.id });
  const partner = otherPerson(world, partnerRelation(world)!);
  world.people[world.activePersonId].wantsChildren = true;
  partner.wantsChildren = false;
  world.people[world.activePersonId].biology.role = 'contribute'; partner.biology.role = 'carry';
  return { world, partnerId: partner.id };
}
const outcomeSeeds = Array.from({ length: 80 }, (_, index) => Math.imul(index + 1, 2654435761) >>> 0);
const response = (world: World) => {
  if (world.pending?.kind !== 'result') throw new Error('Expected the actual discussion result');
  return world.pending;
};

test('a target-bound conception retains the legacy command probability, draws, pregnancy and recorded result', () => {
  const { world, partnerId } = couple(); world.people[partnerId].wantsChildren = true;
  expect(tryForBabyReason(world, partnerId)).toBeUndefined();
  for (const seed of [1, 987654321]) {
    const input = copyWorld(world); input.random.outcomes = seed;
    const before = encodeWorld(input), explicit = resolveCommand(input, { type: 'try-child', personId: partnerId });
    const legacy = resolveCommand(input, { type: 'try-child' }), comparable = copyWorld(explicit);
    // A target-bound command also labels the actual spouse in the saved result.
    expect(comparable.pending?.participants).toContainEqual(expect.objectContaining({ personId: partnerId }));
    if (comparable.pending) delete comparable.pending.participants;
    expect(comparable).toEqual(legacy);
    expect(explicit.random).toEqual({ ...input.random, outcomes: randomInteger(seed, 1, 100).state });
    expect(encodeWorld(input)).toBe(before);
    const saved = decodeWorld(encodeWorld(explicit)); expect(saved).toEqual(explicit);
    const done = resolveCommand(saved, { type: 'acknowledge', resultId: saved.pending!.id });
    expect(tryForBabyReason(done, partnerId)).toMatch(/pregnancy|already tried/);
  }
});

test('all four discussion outcomes are durable, consume one existing outcome draw and never create a pregnancy', () => {
  const titles = new Set<string>();
  for (const seed of outcomeSeeds) {
    const { world, partnerId } = couple(); world.random.outcomes = seed;
    const before = encodeWorld(world), next = resolveCommand(world, { type: 'discuss-child', personId: partnerId });
    const result = response(next); titles.add(result.title);
    expect(result.body).toContain(world.people[partnerId].firstName);
    expect(next.people[partnerId].wantsChildren).toBe(result.title === 'On the same page');
    expect(next.pregnancies).toEqual(world.pregnancies); expect(next.accounts).toEqual(world.accounts);
    expect(next.random).toEqual({ ...world.random, outcomes: randomInteger(seed, 1, 100).state });
    expect(next.actionCounts[world.activePersonId + ':discuss-child:' + partnerId + ':' + world.date.year]).toBe(1);
    expect(encodeWorld(world)).toBe(before);
    const cold = decodeWorld(encodeWorld(next)); expect(cold).toEqual(next);
    const done = resolveCommand(cold, { type: 'acknowledge', resultId: cold.pending!.id });
    expect(() => resolveCommand(done, { type: 'discuss-child', personId: partnerId })).toThrow(/already|Give them time/);
    if (result.title === 'A sore subject') {
      const originalBond = partnerRelation(world)!, changedBond = partnerRelation(next)!;
      expect(changedBond.strength).toBeLessThan(originalBond.strength); expect(changedBond.trust).toBeLessThan(originalBond.trust);
    }
  }
  expect([...titles].sort()).toEqual(['A sore subject', 'Not yet', 'On the same page', 'Still a no']);
});

test('trust, relationship strength and the partner’s circumstances matter without guaranteeing agreement', () => {
  let strongAgreements = 0, weakAgreements = 0;
  for (const seed of outcomeSeeds) {
    const { world, partnerId } = couple(), strong = copyWorld(world), weak = copyWorld(world);
    strong.random.outcomes = seed; weak.random.outcomes = seed;
    Object.assign(partnerRelation(strong)!, { strength: 100, trust: 100 }); strong.people[partnerId].traits = ['kind']; strong.people[partnerId].stats.stress = 0;
    Object.assign(partnerRelation(weak)!, { strength: 15, trust: 10 }); weak.people[partnerId].traits = ['reserved']; weak.people[partnerId].stats.stress = 90;
    strongAgreements += Number(resolveCommand(strong, { type: 'discuss-child', personId: partnerId }).people[partnerId].wantsChildren);
    weakAgreements += Number(resolveCommand(weak, { type: 'discuss-child', personId: partnerId }).people[partnerId].wantsChildren);
  }
  expect(strongAgreements).toBeGreaterThan(weakAgreements); expect(weakAgreements).toBeGreaterThan(0); expect(strongAgreements).toBeLessThan(outcomeSeeds.length);
});

test.each(['not-partner', 'ex', 'away', 'player-not-ready', 'relative', 'hospital'] as const)('%s cannot bypass partner eligibility with a direct command', mode => {
  const { world, partnerId } = couple(), partner = world.people[partnerId];
  let id = partnerId;
  if (mode === 'not-partner') id = world.activePersonId;
  if (mode === 'ex') { partnerRelation(world)!.romance = 'ex'; for (const union of world.marriages.filter(row => !row.ended)) { union.ended = { ...world.date }; union.endReason = 'divorce'; } }
  if (mode === 'away') partner.city = 'Different city';
  if (mode === 'player-not-ready') world.people[world.activePersonId].wantsChildren = false;
  if (mode === 'relative') partnerRelation(world)!.roles.push('sibling');
  if (mode === 'hospital') partner.health.hospitalizedUntil = world.date.year * 12 + world.date.month + 1;
  expect(babyDiscussionReason(world, id)).toBeTruthy();
  const before = encodeWorld(world);
  expect(() => resolveCommand(world, { type: 'discuss-child', personId: id })).toThrow();
  expect(encodeWorld(world)).toBe(before);
});

test('a refusal remains a refusal and allows a later annual conversation without clearing history', () => {
  const { world, partnerId } = couple();
  const seed = outcomeSeeds.find(value => {
    const input = copyWorld(world); input.random.outcomes = value;
    return response(resolveCommand(input, { type: 'discuss-child', personId: partnerId })).title === 'Still a no';
  })!;
  world.random.outcomes = seed;
  const next = resolveCommand(world, { type: 'discuss-child', personId: partnerId });
  const done = resolveCommand(next, { type: 'acknowledge', resultId: next.pending!.id });
  expect(done.people[partnerId].wantsChildren).toBe(false); expect(tryForBabyReason(done, partnerId)).toMatch(/Both partners/);
  done.date = { ...done.date, year: done.date.year + 1 };
  expect(babyDiscussionReason(done, partnerId)).toBeUndefined();
  expect(done.actionCounts[world.activePersonId + ':discuss-child:' + partnerId + ':' + world.date.year]).toBe(1);
});
