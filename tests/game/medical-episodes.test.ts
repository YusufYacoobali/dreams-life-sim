import { monthFrom } from '../../src/game/calendar';
import { resolveCommand } from '../../src/game/engine';
import { encodeWorld, decodeWorld, validateWorld, type World } from '../../src/game/model';
import { offerPending } from '../../src/game/pendingQueue';
import { randomInteger } from '../../src/game/random';
import { addCondition, healthMonth, treatmentCost, consultationCost } from '../../src/game/systems/health';
import { accountFor } from '../../src/game/systems/common';
import { hospitalized } from '../../src/game/systems/healthSchemas';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { medicalPatient, medicalEpisodeScenarios, chooseMedical } from '../support/medicalEpisodes';
import { createLife, randomCreation } from '../../src/game/createLife';

const condition = (world: World, id: string) => world.people[world.activePersonId].health.conditions.find(item => item.id === id)!;
const cold = (world: World) => { const restored = unpackCheckpoint(packCheckpoint(world)); expect(encodeWorld(restored)).toBe(encodeWorld(world)); return restored; };

test('persistent symptoms offer an actual assessment without revealing a diagnosis; ignoring is durable and never repeats the same notice', () => {
  const { symptoms, conditionId } = medicalEpisodeScenarios();
  expect(symptoms.pending).toMatchObject({ kind: 'decision', templateId: 'medical-symptoms', title: 'Feeling Unwell' });
  expect(symptoms.pending!.body).not.toMatch(/asthma|diagnosed/i);
  expect(condition(symptoms, conditionId).diagnosed).toBeNull();
  const ignored = cold(chooseMedical(cold(symptoms), 'ignore'));
  ignored.annual = null; // Isolate the monthly subsystem from its annual driver.
  expect(condition(ignored, conditionId).episode).toMatchObject({ notified: true, assessed: false, admissionAt: null });
  const start = { ...ignored.date };
  for (let month = 1; month <= 18; month++) { ignored.date = monthFrom(start, month, start.day); healthMonth(ignored); }
  const patient = ignored.people[ignored.activePersonId];
  expect(patient.health.records.filter(record => record.conditionId === conditionId && record.kind === 'symptom-notice')).toHaveLength(1);
  expect(patient.health.records.filter(record => record.conditionId === conditionId && record.kind === 'hospital')).toHaveLength(0);
  expect(ignored.deferred.filter(row => row.event.id === symptoms.pending!.id)).toHaveLength(0);
  validateWorld(ignored);
});

test('the symptom assessment uses the real clinician, consultation price, probability, records and funding, then binds the treatment choice', () => {
  const { symptoms, diagnosis, conditionId } = medicalEpisodeScenarios();
  expect(randomInteger(symptoms.random.outcomes, 1, 100).value).toBeLessThanOrEqual(80);
  const patient = diagnosis.people[diagnosis.activePersonId], provider = diagnosis.people[patient.health.providerId!];
  expect(condition(diagnosis, conditionId).diagnosed).toEqual(diagnosis.date);
  expect(provider.employment?.roleId).toBe('doctor');
  expect(accountFor(diagnosis).cash).toBe(accountFor(symptoms).cash - consultationCost(symptoms, 'symptoms'));
  expect(patient.health.records.some(row => row.kind === 'diagnosis' && row.providerId === provider.id && row.conditionId === conditionId)).toBe(true);
  expect(patient.health.records.at(-1)).toMatchObject({ kind: 'symptoms', providerId: provider.id, conditionId, cost: consultationCost(symptoms, 'symptoms') });
  expect(diagnosis.pending).toMatchObject({ kind: 'decision', templateId: 'medical-diagnosis', title: 'Bad News' });
  expect(diagnosis.pending!.body).toContain('asthma');
  expect(cold(diagnosis).pending).toEqual(diagnosis.pending);
  expect(condition(diagnosis, conditionId).treatment).toBeNull();
});

test('an actual missed assessment never invents a diagnosis or free treatment and survives cold reload', () => {
  const { symptoms, conditionId } = medicalEpisodeScenarios();
  for (let seed = 0; seed < 1000; seed++) if (randomInteger(seed, 1, 100).value > 80) { symptoms.random.outcomes = seed; break; }
  const missed = cold(chooseMedical(symptoms, 'doctor'));
  expect(missed.pending).toMatchObject({ kind: 'result', title: 'No clear answer' });
  expect(condition(missed, conditionId)).toMatchObject({ diagnosed: null, treatment: null, episode: { notified: true, assessed: true } });
  expect(accountFor(missed).cash).toBe(accountFor(symptoms).cash - consultationCost(symptoms, 'symptoms'));
  expect(missed.pending!.body).not.toMatch(/asthma|you have/i);
  expect(resolveCommand(symptoms, { type: 'choose', eventId: symptoms.pending!.id, choiceId: 'doctor' })).toEqual(missed);
});

test('starting treatment pays once and uses the unchanged monthly programme instead of an instant scripted recovery', () => {
  const { diagnosis, treated, conditionId } = medicalEpisodeScenarios();
  const original = condition(diagnosis, conditionId), after = condition(treated, conditionId);
  expect(after.severity).toBe(original.severity);
  expect(after.treatment).toMatchObject({ method: 'medication', started: treated.date, months: 0, paid: treatmentCost(diagnosis, original) });
  expect(accountFor(treated).cash).toBe(accountFor(diagnosis).cash - treatmentCost(diagnosis, original));
  expect(condition(cold(treated), conditionId).treatment).toEqual(after.treatment);
  expect(resolveCommand(diagnosis, { type: 'choose', eventId: diagnosis.pending!.id, choiceId: 'treat' })).toEqual(treated);
  expect(() => chooseMedical(treated, 'treat')).toThrow();
  const mutable = decodeWorld(encodeWorld(treated)); mutable.date = monthFrom(mutable.date, 1, mutable.date.day); healthMonth(mutable);
  expect(condition(mutable, conditionId).treatment?.months).toBe(1);
  expect(condition(mutable, conditionId).severity).toBeLessThan(after.severity);
});

test('leaving a diagnosed illness untreated records the actual preference without billing or creating treatment', () => {
  const { diagnosis, conditionId } = medicalEpisodeScenarios(), left = cold(chooseMedical(diagnosis, 'leave'));
  expect(condition(left, conditionId).treatment).toBeNull();
  expect(accountFor(left).cash).toBe(accountFor(diagnosis).cash);
  expect(left.people[left.activePersonId].health.records.at(-1)).toMatchObject({ kind: 'treatment-declined', conditionId, cost: 0n });
});

test('a genuine critical episode is admitted, billed and treated before its durable result; unchanged high severity cannot repeat annually', () => {
  const { admitted, urgentConditionId: id } = medicalEpisodeScenarios(), patient = admitted.people[admitted.activePersonId];
  expect(admitted.pendingPriority).toBe(140);
  expect(hospitalized(admitted, patient)).toBe(true);
  expect(condition(admitted, id).episode).toMatchObject({ notified: true, assessed: true, admissionAt: admitted.date, stabilized: false });
  expect(patient.health.records.at(-1)).toMatchObject({ kind: 'hospital', conditionId: id, cost: treatmentCost(admitted, condition(admitted, id)) });
  expect(condition(admitted, id).treatment).not.toBeNull();
  const next = decodeWorld(encodeWorld(admitted)), active = condition(next, id), start = { ...next.date };
  next.annual = null;
  // Declared unchanged-severe state test, not a naturally recovered patient.
  active.treatment = null; active.severity = 96;
  for (let month = 1; month <= 25; month++) { next.date = monthFrom(start, month, start.day); healthMonth(next); }
  expect(next.people[next.activePersonId].health.records.filter(row => row.kind === 'hospital' && row.conditionId === id)).toHaveLength(1);
  expect(next.deferred.filter(row => row.event.kind === 'result' && row.event.title === 'Rushed to Hospital')).toHaveLength(0);
  expect(next.pending).toEqual(admitted.pending);
  cold(next);
});

test('urgent care preempts an ordinary story without losing or rewriting the already bound decision', () => {
  const setup = medicalPatient(96), world = setup.world;
  const old = { kind: 'decision' as const, id: 'ordinary_waiting', templateId: 'ordinary-test', title: 'A normal day', body: 'Already saved story.', illustration: 'conversation', personIds: [world.activePersonId], choices: ['yes', 'no'].map(id => ({ id, label: id, effects: [], resultTitle: id, resultBody: id, journal: id })) };
  offerPending(world, old); world.date = monthFrom(world.date, 1, world.date.day); healthMonth(world);
  expect(world.pending).toMatchObject({ kind: 'result', title: 'Rushed to Hospital' });
  expect(world.deferred).toContainEqual({ priority: 20, event: old });
  expect(cold(world).deferred).toEqual(world.deferred);
});

test.each(['cold', 'flu', 'chickenpox', 'sprain', 'anxiety', 'depression'] as const)('%s never auto-admits solely because its severity is high', type => {
  const { world } = medicalPatient(100, type); world.date = monthFrom(world.date, 1, world.date.day); healthMonth(world);
  expect(world.people[world.activePersonId].health.records.some(row => row.kind === 'hospital')).toBe(false);
  expect(hospitalized(world, world.people[world.activePersonId])).toBe(false);
});

test.each(['measles', 'fracture'] as const)('a genuinely critical %s can require urgent care instead of being excluded as non-chronic', type => {
  const { world } = medicalPatient(100, type); world.date = monthFrom(world.date, 1, world.date.day); healthMonth(world);
  expect(world.pending).toMatchObject({ kind: 'result', title: 'Rushed to Hospital' });
  expect(world.people[world.activePersonId].health.records.at(-1)?.kind).toBe('hospital');
});

test('a truly stabilized episode can have a new crisis; the original admissions remain in history', () => {
  const { admitted, urgentConditionId: id } = medicalEpisodeScenarios(), world = decodeWorld(encodeWorld(admitted)), active = condition(world, id);
  world.annual = null;
  active.severity = 20; active.treatment!.outcome = 'effective'; world.date = monthFrom(world.date, 3, world.date.day); healthMonth(world);
  expect(active.status).toBe('controlled'); expect(active.episode.stabilized).toBe(true);
  active.treatment = null; active.severity = 95; world.date = monthFrom(world.date, 1, world.date.day); healthMonth(world);
  expect(world.people[world.activePersonId].health.records.filter(row => row.kind === 'hospital' && row.conditionId === id)).toHaveLength(2);
  expect(active.episode.stabilized).toBe(false); cold(world);
});

test('malformed medical bindings and invented future episode dates are rejected rather than silently repaired', () => {
  const { diagnosis, conditionId } = medicalEpisodeScenarios(), bad = decodeWorld(encodeWorld(diagnosis));
  if (bad.pending?.kind !== 'decision') throw new Error('Expected diagnosis');
  bad.pending.choices[0].effects.push({ kind: 'stat', personId: bad.activePersonId, stat: 'health', delta: 100 });
  expect(() => validateWorld(bad)).toThrow(/medical episode binding/);
  const future = decodeWorld(encodeWorld(diagnosis)); condition(future, conditionId).episode.admissionAt = monthFrom(future.date, 1, future.date.day);
  expect(() => validateWorld(future)).toThrow(/medical episode/);
  const forged = decodeWorld(encodeWorld(diagnosis)); condition(forged, conditionId).episode.admissionAt = { ...forged.date };
  expect(() => validateWorld(forged)).toThrow(/matching admission record/);
});

test('one real assessment replaces all covered symptom offers with treatment choices for each actual diagnosis', () => {
  const setup = medicalPatient(), patient = setup.world.people[setup.world.activePersonId];
  const second = addCondition(setup.world, patient, 'diabetes', 42);
  let world = resolveCommand(setup.world, { type: 'advance' });
  expect(world.deferred.some(row => row.event.kind === 'decision' && row.event.templateId === 'medical-symptoms')).toBe(true);
  // Seed zero makes both independent 80% diagnosis rolls succeed.
  world.random.outcomes = 0; world = cold(chooseMedical(world, 'doctor'));
  expect(condition(world, setup.conditionId).diagnosed).not.toBeNull();
  expect(condition(world, second.id).diagnosed).not.toBeNull();
  expect(world.deferred.some(row => row.event.kind === 'decision' && row.event.templateId === 'medical-symptoms')).toBe(false);
  const secondDecision = world.deferred.find(row => row.event.kind === 'decision' && row.event.templateId === 'medical-diagnosis');
  expect(secondDecision).toBeDefined();
  const cash = accountFor(world).cash;
  world = chooseMedical(world, 'leave');
  world = cold(resolveCommand(world, { type: 'acknowledge', resultId: world.pending!.id }));
  expect(world.pending).toMatchObject({ kind: 'decision', templateId: 'medical-diagnosis' });
  if (world.pending?.kind !== 'decision') throw new Error('Expected the second real diagnosis');
  expect(world.pending.choices[0].effects[0]).toMatchObject({ kind: 'medical-episode', conditionId: second.id, action: 'treat' });
  world = cold(chooseMedical(world, 'treat'));
  expect(condition(world, second.id).treatment).not.toBeNull();
  expect(accountFor(world).cash).toBe(cash - treatmentCost(world, condition(world, second.id)));
});

test('a shared assessment that misses a second concern retains its truthful assessment record without a stale disabled notice', () => {
  const setup = medicalPatient(), second = addCondition(setup.world, setup.world.people[setup.world.activePersonId], 'diabetes', 42);
  let world = resolveCommand(setup.world, { type: 'advance' });
  for (let seed = 0; seed < 1000; seed++) {
    const first = randomInteger(seed, 1, 100), next = randomInteger(first.state, 1, 100);
    if (first.value <= 80 && next.value > 80) { world.random.outcomes = seed; break; }
  }
  world = cold(chooseMedical(world, 'doctor'));
  expect(condition(world, setup.conditionId).diagnosed).not.toBeNull();
  expect(condition(world, second.id)).toMatchObject({ diagnosed: null, episode: { assessed: true, notified: true } });
  expect(world.deferred.some(row => row.event.kind === 'decision' && row.event.templateId === 'medical-symptoms')).toBe(false);
  expect(world.people[world.activePersonId].health.records.some(row => row.kind === 'assessment' && row.conditionId === second.id && !!row.providerId)).toBe(true);
});

test('actual urgent admission supersedes only its own new treatment offer, retaining notice and diagnosis history', () => {
  const { diagnosis, conditionId } = medicalEpisodeScenarios(), world = decodeWorld(encodeWorld(diagnosis));
  world.annual = null; const before = structuredClone(world.people[world.activePersonId].health.records);
  condition(world, conditionId).severity = 95;
  world.date = monthFrom(world.date, 1, world.date.day); healthMonth(world);
  expect(world.pending).toMatchObject({ kind: 'result', title: 'Rushed to Hospital' });
  expect(world.deferred.some(row => row.event.kind === 'decision' && row.event.templateId === 'medical-diagnosis')).toBe(false);
  expect(world.people[world.activePersonId].health.records.slice(0, before.length)).toEqual(before);
  cold(world);
});

test('unavoidable critical care for a minor without a recorded adult payer creates a real unpaid bill instead of blocking progression', () => {
  // Declared valid unaccompanied-child state: no parent/guardian relationship
  // is recorded. Production urgent-care and arrears engines perform the rest.
  const world = createLife('life_unaccompanied_care', 42, { ...randomCreation(42), country: 'US', city: 'New York', background: 'ordinary' }, { year: 2020, month: 1, day: 1 });
  world.birthAcknowledged = true; world.date.year = 2030;
  world.relationships = world.relationships.filter(edge => edge.to !== world.activePersonId);
  addCondition(world, world.people[world.activePersonId], 'asthma', 95);
  world.date = monthFrom(world.date, 1, world.date.day); healthMonth(world);
  expect(world.pending).toMatchObject({ kind: 'result', title: 'Rushed to Hospital' });
  const bill = world.people[world.activePersonId].health.records.find(row => row.kind === 'hospital')!;
  expect(bill.payerId).toBe(world.activePersonId); expect(bill.cost).toBeGreaterThan(0n);
  expect(world.ledger.some(row => row.personId === world.activePersonId && row.category === 'healthcare' && row.debtDelta === bill.cost)).toBe(true);
  expect(world.liabilities.some(row => row.ownerId === world.activePersonId && row.kind === 'living' && row.principal === bill.cost)).toBe(true);
  cold(world);
});
