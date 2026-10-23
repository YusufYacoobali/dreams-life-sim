import { bindEvent } from '../../src/game/content/events';
import { dramaticTemplates } from '../../src/game/content/dramaticEvents';
import { recordDeath, resolveCommand } from '../../src/game/engine';
import { copyWorld, decodeWorld, encodeWorld, fullName, validateWorld, type World } from '../../src/game/model';
import { randomInteger } from '../../src/game/random';
import { monthFrom } from '../../src/game/calendar';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { athleteDopingMonth } from '../../src/game/systems/athleteDoping';
import { athleteSuspensionReason } from '../../src/game/systems/athleteDopingSchemas';
import { careerPayQuote, selectionReason, startCareerContract } from '../../src/game/systems/careers';
import { dramaticContext } from '../../src/game/systems/dramaticContext';
import { relationFor } from '../../src/game/systems/relationships';
import { storyMonthNumber } from '../../src/game/systems/storyContext';
import { dramaticWorld } from '../support/dramaticEvents';

function offer(id: 'dramatic-double-fiance' | 'dramatic-athlete-doping', seed = 7, legacy = false) {
  const world = dramaticWorld(id); world.random.outcomes = seed;
  world.pending = bindEvent(world, dramaticTemplates.find(row => row.id === id)!);
  if (legacy) for (const choice of world.pending.choices) for (const effect of choice.effects) if (effect.kind === 'dramatic-choice') effect.ruleVersion = 1;
  return validateWorld(world);
}
function choose(world: World, choiceId: string) { return resolveCommand(world, { type: 'choose', eventId: world.pending!.id, choiceId }); }
function acknowledge(world: World) {
  if (world.pending?.kind !== 'result') throw new Error('Expected the immediate scene result');
  return resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
}
function risk(seed = 7) { return choose(offer('dramatic-athlete-doping', seed), 'risk'); }
const checkOf = (world: World) => world.careers.find(row => row.kind === 'athlete')!.dopingChecks![0];
const careerOf = (world: World) => world.careers.find(row => row.kind === 'athlete')!;
const testResult = (world: World) => [world.pending, ...world.deferred.map(row => row.event)].find(row => row?.id === checkOf(world).id + '_result');

test('dinner introduces one persistent friend, records the secret engagement and actually ends both engagements', () => {
  const before = offer('dramatic-double-fiance'), original = encodeWorld(before), partnerId = dramaticContext(before, 'dramatic-double-fiance')!.contextId!;
  const command = { type: 'choose' as const, eventId: before.pending!.id, choiceId: 'dinner' };
  const after = resolveCommand(before, command), cold = resolveCommand(decodeWorld(original), command), checkpoint = resolveCommand(unpackCheckpoint(packCheckpoint(before)), command);
  expect(after).toEqual(cold); expect(after).toEqual(checkpoint); expect(encodeWorld(before)).toBe(original);
  const introduced = Object.values(after.people).filter(row => !before.people[row.id]);
  expect(introduced).toHaveLength(1);
  const guest = introduced[0], friendship = relationFor(after, after.activePersonId, guest.id)!;
  expect(friendship).toMatchObject({ kind: 'friend', strength: 60, trust: 65, romance: 'none' });
  expect(friendship.memories).toContain('double-engagement-dinner:' + partnerId);
  expect(relationFor(after, partnerId, guest.id)).toMatchObject({ romance: 'ex', trust: 0 });
  expect(relationFor(after, after.activePersonId, partnerId)).toMatchObject({ romance: 'ex' });
  expect(after.pending?.body).toContain(fullName(guest));
  expect(after.accounts.some(row => row.ownerId === guest.id)).toBe(true);
  expect(after.households.some(row => row.members.includes(guest.id))).toBe(true);
  expect(decodeWorld(encodeWorld(after))).toEqual(after);
  expect(() => resolveCommand(after, command)).toThrow();
  const ready = acknowledge(unpackCheckpoint(packCheckpoint(after)));
  const talked = resolveCommand(ready, { type: 'interact', personId: guest.id, action: 'talk' });
  expect(relationFor(talked, talked.activePersonId, guest.id)!.strength).toBeGreaterThanOrEqual(friendship.strength);
  expect(Object.keys(talked.people)).toHaveLength(Object.keys(after.people).length);
});

test('doping has private immediate costs and exactly one persisted future check, with no immediate reputation penalty', () => {
  const before = offer('dramatic-athlete-doping'), expectedDraw = randomInteger(before.random.outcomes, 1, 100), original = encodeWorld(before);
  const after = choose(before, 'risk'), player = after.people[after.activePersonId], oldPlayer = before.people[before.activePersonId];
  expect(player.publicLife.image).toBe(oldPlayer.publicLife.image);
  expect(careerOf(after).reputation).toBe(careerOf(before).reputation);
  expect(player.stats.health).toBe(Math.max(0, oldPlayer.stats.health - 12));
  expect(player.skills.sport).toBe(Math.min(100, oldPlayer.skills.sport + 8));
  expect(careerOf(after).dopingChecks).toHaveLength(1);
  expect(checkOf(after)).toMatchObject({ ruleVersion: 1, status: 'pending', resolved: null, detectionChance: 65, detectionRoll: expectedDraw.value, testMonth: storyMonthNumber(before.date) + 1, employmentId: careerOf(before).employmentId });
  expect(after.random.outcomes).toBe(expectedDraw.state);
  expect(encodeWorld(before)).toBe(original);
  expect(choose(decodeWorld(original), 'risk')).toEqual(after);
  expect(unpackCheckpoint(packCheckpoint(after))).toEqual(after);
  expect(after.pending?.body).toMatch(/due next month/);
});

test.each([7, 2])('seed %s reaches the saved drug check through ordinary month progression and survives reload', seed => {
  expect(randomInteger(seed, 1, 100).value <= 65).toBe(seed === 7);
  const chosen = risk(seed), ready = acknowledge(chosen), check = checkOf(ready), original = encodeWorld(ready);
  const command = { type: 'advance' as const }, next = resolveCommand(ready, command);
  expect(next).toEqual(resolveCommand(decodeWorld(original), command));
  expect(next).toEqual(resolveCommand(unpackCheckpoint(packCheckpoint(ready)), command));
  expect(next.date).toEqual(monthFrom(ready.date, 1, ready.calendarAnchorDay));
  expect(next.annual?.pausedForPlanning).toBe(true);
  const resolved = checkOf(next), positive = check.detectionRoll <= check.detectionChance;
  expect(resolved.status).toBe(positive ? 'positive' : 'negative'); expect(resolved.resolved).toEqual(next.date);
  expect(testResult(next)).toMatchObject({ kind: 'result', title: positive ? 'Your drug check is positive' : 'The drug check finds nothing' });
  expect(next.journal.some(row => row.text.includes(positive ? 'result is made public' : 'does not detect'))).toBe(true);
  expect(decodeWorld(encodeWorld(next))).toEqual(next);
  const noRepeat = copyWorld(next), encoded = encodeWorld(noRepeat);
  athleteDopingMonth(noRepeat); expect(encodeWorld(noRepeat)).toBe(encoded);
  if (positive) {
    expect(next.people[next.activePersonId].publicLife.image).toBe(Math.max(0, ready.people[ready.activePersonId].publicLife.image - 10));
    expect(careerOf(next).reputation).toBe(Math.max(0, careerOf(ready).reputation - 15));
    expect(next.people[next.activePersonId].employment).toBeNull();
    expect(next.workHistory.find(row => row.id === check.employmentId)!.ended).toEqual(next.date);
    expect(careerOf(next).projects.find(row => row.id === check.projectId)!.status).toBe('cancelled');
    expect(athleteSuspensionReason(next)).toMatch(/12 more months/);
  } else {
    expect(next.people[next.activePersonId].publicLife.image).toBe(ready.people[ready.activePersonId].publicLife.image);
    expect(careerOf(next).reputation).toBe(careerOf(ready).reputation);
    expect(careerOf(next).status).toBe('active');
    expect(athleteSuspensionReason(next)).toBeUndefined();
  }
});

test('a positive check blocks professional selection and the contract helper, then expires after twelve months', () => {
  const detected = resolveCommand(acknowledge(risk()), { type: 'advance' }), before = encodeWorld(detected);
  expect(checkOf(detected).status).toBe('positive');
  expect(selectionReason(detected, 'athlete')).toMatch(/Suspended/);
  const commandReady = acknowledge(detected);
  expect(commandReady.pending).toBeNull();
  expect(() => resolveCommand(commandReady, { type: 'select-career', kind: 'athlete', quotedAnnualPay: careerPayQuote(commandReady, 'athlete') })).toThrow(/Suspended/);
  expect(() => startCareerContract(copyWorld(detected), 'athlete', careerPayQuote(detected, 'athlete'))).toThrow(/Suspended/);
  const boundary = copyWorld(detected);
  boundary.date = monthFrom(checkOf(detected).resolved!, 11); expect(athleteSuspensionReason(boundary)).toMatch(/1 more month$/);
  boundary.date = monthFrom(checkOf(detected).resolved!, 12); expect(athleteSuspensionReason(boundary)).toBeUndefined();
  expect(selectionReason(boundary, 'athlete')).toBeUndefined();
  expect(encodeWorld(detected)).toBe(before);
});

test('leaving athletics cannot erase a scheduled check or end a later unrelated job', () => {
  let world = acknowledge(risk());
  world = acknowledge(resolveCommand(world, { type: 'leave-career', careerId: careerOf(world).id }));
  // A real new contract establishes the unrelated-job boundary without retrying selection.
  const newCareer = startCareerContract(world, 'model', careerPayQuote(world, 'model'), world.people[world.activePersonId], false);
  const newEmploymentId = newCareer.employmentId;
  validateWorld(world);
  world = resolveCommand(world, { type: 'advance' });
  expect(checkOf(world).status).toBe('positive');
  expect(careerOf(world).status).toBe('left');
  expect(athleteSuspensionReason(world)).toMatch(/12 more months/);
  expect(testResult(world)?.body).toContain('already left that contract');
  expect(world.people[world.activePersonId].employment?.id).toBe(newEmploymentId);
  expect(world.careers.find(row => row.kind === 'model')?.status).toBe('active');
  validateWorld(world);
});

test('death cancels pending checks without posthumous publicity or a suspension', () => {
  const world = acknowledge(risk()), image = world.people[world.activePersonId].publicLife.image;
  recordDeath(world, world.activePersonId, 'Controlled death before the scheduled check');
  expect(checkOf(world)).toMatchObject({ status: 'cancelled', resolved: world.date });
  expect(world.people[world.activePersonId].publicLife.image).toBe(image);
  expect(athleteSuspensionReason(world)).toBeUndefined();
  athleteDopingMonth(world); expect(world.pending).toBeNull();
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
});

test('changing athletic contracts before the result cannot evade the suspension', () => {
  let world = acknowledge(risk()), oldEmploymentId = checkOf(world).employmentId;
  world = acknowledge(resolveCommand(world, { type: 'leave-career', careerId: careerOf(world).id }));
  startCareerContract(world, 'athlete', careerPayQuote(world, 'athlete'), world.people[world.activePersonId], false);
  const newEmploymentId = world.people[world.activePersonId].employment!.id;
  expect(newEmploymentId).not.toBe(oldEmploymentId);
  world = resolveCommand(validateWorld(world), { type: 'advance' });
  expect(checkOf(world)).toMatchObject({ employmentId: oldEmploymentId, status: 'positive' });
  expect(world.people[world.activePersonId].employment).toBeNull();
  expect(world.workHistory.find(row => row.id === newEmploymentId)!.ended).toEqual(world.date);
  expect(athleteSuspensionReason(world)).toMatch(/12 more months/);
  validateWorld(world);
});

test.each(['project', 'supplier', 'due', 'result', 'roll', 'duplicate'] as const)('saved checks reject inconsistent %s history', tamper => {
  const world = resolveCommand(acknowledge(risk()), { type: 'advance' }), bad = copyWorld(world), check = checkOf(bad);
  if (tamper === 'project') check.projectId = 'missing-project';
  if (tamper === 'supplier') check.supplierId = bad.activePersonId;
  if (tamper === 'due') check.testMonth++;
  if (tamper === 'result') check.resolved = null;
  if (tamper === 'roll') check.detectionRoll = 100;
  if (tamper === 'duplicate') careerOf(bad).dopingChecks!.push({ ...check });
  expect(() => validateWorld(bad)).toThrow(/drug check/);
});

test.each(['dramatic-double-fiance', 'dramatic-athlete-doping'] as const)('%s migrates old pending V1 choices without inventing a guest or a scheduled check', id => {
  const before = offer(id, 7, true), raw = JSON.parse(encodeWorld(before));
  raw.schemaVersion = 41; raw.engineVersion = 42; raw.contentVersion = 19;
  const migrated = decodeWorld(JSON.stringify(raw));
  expect(JSON.parse(encodeWorld(migrated))).toEqual({ ...raw, schemaVersion: 46, engineVersion: 48, contentVersion: 25, miniGames: [], personSupportRequests: [], personActionHistory: [], rentalLeases: [] });
  expect(migrated.pending).toEqual(before.pending); expect(migrated.random).toEqual(before.random);
  expect(migrated.careers.every(row => row.dopingChecks === undefined)).toBe(true);
  const after = choose(migrated, id === 'dramatic-double-fiance' ? 'dinner' : 'risk');
  expect(Object.keys(after.people)).toEqual(Object.keys(before.people));
  if (id === 'dramatic-athlete-doping') {
    expect(careerOf(after).dopingChecks).toBeUndefined();
    expect(after.people[after.activePersonId].publicLife.image).toBe(Math.max(0, before.people[before.activePersonId].publicLife.image - 10));
  } else expect(relationFor(after, after.activePersonId, dramaticContext(before, id)!.contextId!)!.romance).toBe('engaged');
});
