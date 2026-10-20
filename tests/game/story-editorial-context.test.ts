import { bindEvent, eligibleTemplates, eventTemplates } from '../../src/game/content/events';
import { decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { decodeSave } from '../../src/persistence/archive';
import { addCondition, emergencyCare, hospitalized } from '../../src/game/systems/health';
import { activeTrip } from '../../src/game/systems/travelSchemas';
import { tripQuote } from '../../src/game/systems/travel';
import { serviceAway, serviceQualified } from '../../src/game/systems/serviceSchemas';
import { pupil } from '../support/pupil';
import { adultSocial } from '../support/adultSocial';
import graduate from '../fixtures/v3-employed-graduate.json';
import serviceArchive from '../fixtures/v16-service-archive.json';

const publicScenes = ['library-card', 'community-garden', 'local-meeting', 'familiar-street', 'toddler-caterpillar-crossing', 'rest-guilt'];
const template = (id: string) => eventTemplates.find(item => item.id === id)!;
function admit(world: World) {
  const person = world.people[world.activePersonId], condition = addCondition(world, person, 'asthma', 80);
  // Production urgent care creates the bill, provider, treatment and real stay.
  // No hospital/date/funds/RNG flag is substituted for that action.
  emergencyCare(world, person.id, condition.id, true);
  expect(hospitalized(world, person)).toBe(true);
  expect(person.health.records.at(-1)?.kind).toBe('hospital');
  expect(person.health.records.at(-1)?.cost).toBeGreaterThan(0n);
  return validateWorld(world);
}
function checkUnavailable(world: World, id: string) {
  const before = encodeWorld(world);
  expect(eligibleTemplates(world)).not.toContainEqual(template(id));
  expect(() => bindEvent(world, template(id))).toThrow(/existing available life context/);
  expect(encodeWorld(world)).toBe(before);
}
function acknowledge(world: World) {
  if (world.pending?.kind !== 'result') throw new Error('Expected saved result');
  return resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
}
function finish(world: World) {
  let guard = 0;
  while (world.pending || world.annual) {
    if (++guard > 30) throw new Error('Year did not finish');
    world = resolveCommand(world, world.pending?.kind === 'decision' ? { type: 'choose', eventId: world.pending.id, choiceId: world.pending.choices[0].id } : world.pending ? { type: 'acknowledge', resultId: world.pending.id } : { type: 'resume' });
  }
  return world;
}

test('actual paid adult hospital care excludes public outings while online and reflective scenes remain available', () => {
  const initial = decodeWorld(JSON.stringify(graduate));
  expect(eligibleTemplates(initial)).toContainEqual(template('community-garden'));
  const world = admit(initial);
  for (const id of publicScenes) checkUnavailable(world, id);
  const before = encodeWorld(world);
  for (const id of ['bad-review', 'old-photo']) {
    expect(eligibleTemplates(world)).toContainEqual(template(id));
    expect(bindEvent(world, template(id)).templateId).toBe(id);
  }
  expect(encodeWorld(world)).toBe(before);
});

test.each([
  [3, 'toddler-caterpillar-crossing', 'toddler-shadow-race'],
  [6, 'library-card', 'child-first-loose-tooth'],
] as const)('age%i caregiver-funded hospital care excludes the public scene but keeps a suitable indoor one', (age, outsideId, indoorId) => {
  const initial = pupil('US', age);
  expect(eligibleTemplates(initial)).toContainEqual(template(outsideId));
  const world = admit(initial), person = world.people[world.activePersonId], receipt = person.health.records.at(-1)!;
  expect(receipt.payerId).not.toBe(person.id);
  checkUnavailable(world, outsideId);
  const before = encodeWorld(world);
  expect(eligibleTemplates(world)).toContainEqual(template(indoorId));
  expect(bindEvent(world, template(indoorId)).personIds).toEqual([person.id]);
  expect(encodeWorld(world)).toBe(before);
});

test('a real booked foreign trip cannot bind an old home-city public scene', () => {
  const initial = decodeWorld(JSON.stringify(graduate));
  const world = resolveCommand(initial, { type: 'book-trip', destinationId: 'paris', duration: 1, companionIds: [], focus: 'sightseeing', quotedTotal: tripQuote(initial, 'paris', 1).total });
  expect(activeTrip(world)?.destinationId).toBe('paris');
  checkUnavailable(world, 'community-garden');
  expect(eligibleTemplates(world)).toContainEqual(template('bad-review'));
});

test('a real assignment after the immutable service year excludes home-city public scenes without erasing reflective choices', () => {
  const ready = finish(decodeSave(JSON.stringify(serviceArchive)).world), career = ready.serviceCareers[0];
  expect(serviceQualified(career)).toBe(true);
  const world = resolveCommand(ready, { type: 'start-assignment', serviceId: career.id, kind: 'disaster-relief' });
  expect(serviceAway(world)?.kind).toBe('disaster-relief');
  checkUnavailable(world, 'community-garden');
  checkUnavailable(world, 'local-meeting');
  expect(eligibleTemplates(world)).toContainEqual(template('bad-review'));
});

test('hospital care at the genuine saved month-twelve boundary resumes the same year with a compatible saved scene', () => {
  const original = decodeSave(JSON.stringify(serviceArchive)).world;
  const boundary = acknowledge(original);
  expect(boundary.annual).toMatchObject({ monthsProcessed: 12, stage: 'months', pausedForPlanning: true });
  const admitted = admit(boundary), target = admitted.annual!.targetDate;
  const resumed = resolveCommand(admitted, { type: 'resume' });
  expect(resumed.date).toEqual(target);
  expect(resumed.annual).toMatchObject({ monthsProcessed: 12, stage: 'complete' });
  expect(hospitalized(resumed, resumed.people[resumed.activePersonId])).toBe(true);
  if (resumed.pending?.kind === 'decision') expect(publicScenes).not.toContain(resumed.pending.templateId);
  const restored = decodeWorld(encodeWorld(resumed));
  expect(restored.pending).toEqual(resumed.pending);
  expect(restored.random).toEqual(resumed.random);
  const done = finish(restored);
  expect(done.date).toEqual(target);
  expect(done.annual).toBeNull();
  expect(done.people[done.activePersonId].health.records).toEqual(resumed.people[resumed.activePersonId].health.records);
});

test('a previously bound copy survives decoding and resolution without being replaced by the corrected template', () => {
  const { world } = adultSocial(), event = bindEvent(world, template('friend-different-budget'));
  // Representative already-bound content8 text; this is not a regenerated fixture.
  const oldResult = 'You take a short walk without buying anything. The conversation is not noticeably less expensive.';
  event.choices[0].resultBody = oldResult;
  world.pending = event;
  const before = encodeWorld(world), restored = decodeWorld(before);
  expect(encodeWorld(restored)).toBe(before);
  expect(restored.pending).toEqual(event);
  const result = resolveCommand(restored, { type: 'choose', eventId: event.id, choiceId: 'walk' });
  expect(result.pending).toMatchObject({ kind: 'result', body: oldResult });
  expect(result.accounts).toEqual(world.accounts);
  expect(result.ledger).toEqual(world.ledger);
  expect(result.random).toEqual(world.random);
});

test('an already-bound mixed scene keeps its stored choices after actual hospital admission', () => {
  const initial = decodeWorld(JSON.stringify(graduate)), event = bindEvent(initial, template('rest-guilt'));
  initial.pending = event;
  const admitted = admit(initial);
  // The availability correction changes future selection only. A bound decision
  // remains data, rather than being looked up or restricted by its current template.
  checkUnavailable(admitted, 'rest-guilt');
  const before = encodeWorld(admitted), restored = decodeWorld(before);
  expect(encodeWorld(restored)).toBe(before);
  expect(restored.pending).toEqual(event);
  const choice = event.choices.find(item => item.id === 'walk')!;
  const result = resolveCommand(restored, { type: 'choose', eventId: event.id, choiceId: choice.id });
  expect(result.pending).toMatchObject({ kind: 'result', body: choice.resultBody });
  expect(result.people[result.activePersonId].health).toEqual(admitted.people[admitted.activePersonId].health);
  expect(result.ledger).toEqual(admitted.ledger);
  expect(result.random).toEqual(admitted.random);
});
