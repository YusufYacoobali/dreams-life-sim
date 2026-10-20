import { monthFrom } from '../../src/game/calendar';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { resolveCommand } from '../../src/game/engine';
import { decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { accountFor } from '../../src/game/systems/common';
import { addCondition, healthFinanceMonth } from '../../src/game/systems/health';
import { decodeSave } from '../../src/persistence/archive';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import graduate from '../fixtures/v3-employed-graduate.json';
import medicalArchive from '../fixtures/v8-medical-archive.json';

function cold(world: World) {
  const restored = unpackCheckpoint(packCheckpoint(world));
  expect(encodeWorld(restored)).toBe(encodeWorld(world));
  return restored;
}
function choose(world: World, choiceId: string) {
  if (world.pending?.kind !== 'decision') throw new Error('Expected decision');
  return resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId });
}
function step(world: World) {
  if (world.people[world.activePersonId].died) throw new Error('Life ended before expected medical boundary');
  if (world.pending?.kind === 'decision') {
    const choice = world.pending.choices.find(item => !choiceUnavailable(world, item));
    if (!choice) throw new Error('No eligible decision choice');
    return choose(world, choice.id);
  }
  if (world.pending?.kind === 'result') return resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
  return resolveCommand(world, { type: world.annual ? 'resume' : 'advance' });
}
function until(world: World, reached: (candidate: World) => boolean, maximum = 100) {
  for (let count = 0; count < maximum; count++) {
    if (reached(world)) return world;
    world = step(world);
  }
  throw new Error('Expected medical boundary was not reached');
}
function condition(world: World, conditionId: string) {
  const found = world.people[world.activePersonId].health.conditions.find(item => item.id === conditionId);
  if (!found) throw new Error('Missing original condition');
  return found;
}
const emergency = (world: World) => world.pending?.kind === 'decision' && world.pending.templateId === 'medical-emergency';

test('the genuine v8 saved emergency retains its exact old copy, choices, quote and history through current cold care', () => {
  const archive = decodeSave(JSON.stringify(medicalArchive)), oldPending = structuredClone(archive.world.pending);
  const oldJournal = structuredClone(archive.world.journal), oldSnapshots = structuredClone(archive.snapshots);
  let world = cold(archive.world);
  expect(world.pending).toEqual(oldPending);
  expect(world.pending).toMatchObject({ kind: 'decision', templateId: 'medical-emergency', body: 'Your symptoms have become serious. A hospital assessment can begin treatment and may require a short stay. The quoted care costs $360.00; an unpaid emergency bill remains a real obligation.' });
  const original = world.people[world.activePersonId].health.conditions[0], balance = accountFor(world).cash, careDate = { ...world.date };
  expect(original.diagnosed).toBeNull();
  world = cold(choose(world, 'care'));
  expect(condition(world, original.id).diagnosed).toEqual(careDate);
  expect(condition(world, original.id).treatment).toMatchObject({ started: careDate, paid: 36000n });
  expect(accountFor(world).cash).toBe(balance - 36000n);
  expect(world.people[world.activePersonId].health.records.at(-1)).toMatchObject({ kind: 'hospital', conditionId: original.id, date: careDate, cost: 36000n });
  expect(world.journal.slice(0, oldJournal.length)).toEqual(oldJournal);
  expect(archive.snapshots).toEqual(oldSnapshots);
  expect(archive.world.pending).toEqual(oldPending);
});

test('later actual emergency care names an already diagnosed condition without replacing its first diagnosis date', () => {
  let world = decodeSave(JSON.stringify(medicalArchive)).world;
  const conditionId = world.people[world.activePersonId].health.conditions[0].id, firstDate = { ...world.date };
  world = choose(world, 'care');
  const firstRecords = structuredClone(world.people[world.activePersonId].health.records), firstJournal = structuredClone(world.journal);
  world = until(world, candidate => !candidate.pending && !candidate.annual);
  expect(condition(world, conditionId).treatment).not.toBeNull();
  world = resolveCommand(world, { type: 'stop-treatment', conditionId });
  world = until(world, emergency);
  expect(world.pending?.body).toContain('Your symptoms have become serious: recurring wheezing and shortness of breath.');
  expect(world.pending?.body).toContain('You have been diagnosed with Asthma.');
  const nextDate = { ...world.date };
  expect(nextDate.year).toBeGreaterThan(firstDate.year);
  expect(condition(world, conditionId).diagnosed).toEqual(firstDate);
  const bound = structuredClone(world.pending);
  world = cold(world);
  expect(world.pending).toEqual(bound);
  world = cold(choose(world, 'care'));
  expect(condition(world, conditionId).diagnosed).toEqual(firstDate);
  expect(condition(world, conditionId).treatment?.started).toEqual(nextDate);
  expect(world.people[world.activePersonId].health.records.at(-1)).toMatchObject({ kind: 'hospital', date: nextDate, conditionId });
  expect(world.people[world.activePersonId].health.records.slice(0, firstRecords.length)).toEqual(firstRecords);
  expect(world.journal.slice(0, firstJournal.length)).toEqual(firstJournal);
});

test('declining the original saved assessment leaves the next new emergency descriptive without disclosing an unknown diagnosis', () => {
  let world = decodeSave(JSON.stringify(medicalArchive)).world;
  const conditionId = world.people[world.activePersonId].health.conditions[0].id;
  world = until(choose(world, 'decline'), emergency);
  expect(condition(world, conditionId).diagnosed).toBeNull();
  expect(world.pending?.body).toContain('recurring wheezing and shortness of breath');
  expect(world.pending?.body).not.toMatch(/asthma|diagnosed/i);
  const bound = structuredClone(world.pending);
  world = cold(world);
  expect(world.pending).toEqual(bound);
  const diagnosisDate = { ...world.date };
  world = cold(choose(world, 'care'));
  expect(condition(world, conditionId).diagnosed).toEqual(diagnosisDate);
});

test('known versus unknown emergency disclosure consumes identical randomness and preserves all bound medical terms and effects', () => {
  // Paired unit knowledge states, not a claim of a naturally earned diagnosis.
  const unknown = decodeWorld(JSON.stringify(graduate)), patient = unknown.people[unknown.activePersonId];
  const added = addCondition(unknown, patient, 'asthma', 80), known = decodeWorld(encodeWorld(unknown));
  condition(known, added.id).diagnosed = { ...known.date };
  const unknownDecision = resolveCommand(unknown, { type: 'advance' }), knownDecision = resolveCommand(known, { type: 'advance' });
  expect(emergency(unknownDecision)).toBe(true); expect(emergency(knownDecision)).toBe(true);
  expect(unknownDecision.random).toEqual(knownDecision.random);
  expect(unknownDecision.pending?.body).not.toContain('Asthma');
  expect(knownDecision.pending?.body).toContain('You have been diagnosed with Asthma.');
  const normalized = decodeWorld(encodeWorld(knownDecision));
  condition(normalized, added.id).diagnosed = null;
  normalized.pending!.body = unknownDecision.pending!.body;
  expect(encodeWorld(validateWorld(normalized))).toBe(encodeWorld(unknownDecision));
  const unknownCare = choose(unknownDecision, 'care'), knownCare = choose(knownDecision, 'care');
  expect(knownCare.random).toEqual(unknownCare.random);
  expect(knownCare.pending).toEqual(unknownCare.pending);
  expect(condition(knownCare, added.id).treatment).toEqual(condition(unknownCare, added.id).treatment);
  expect(accountFor(knownCare).cash).toBe(accountFor(unknownCare).cash);
});

test('background NPC care preserves the known first diagnosis and gives an unknown condition its actual first care date without extra draws', () => {
  // Declared matched adult-parent illness setup; care eligibility, timing,
  // clinician, bill and response use the existing unspecialized monthly path.
  const unknown = decodeWorld(JSON.stringify(graduate)), parent = unknown.people.person_parent1;
  expect(parent.died).toBeNull();
  const added = addCondition(unknown, parent, 'asthma', 65), firstDate = { ...unknown.date }, known = decodeWorld(encodeWorld(unknown));
  known.people[parent.id].health.conditions.find(item => item.id === added.id)!.diagnosed = firstDate;
  let treatmentMonth = 0;
  for (let month = 1; month <= 24; month++) {
    unknown.date = monthFrom(firstDate, month, firstDate.day); known.date = { ...unknown.date };
    healthFinanceMonth(unknown); healthFinanceMonth(known);
    expect(known.random).toEqual(unknown.random);
    const unknownCondition = unknown.people[parent.id].health.conditions.find(item => item.id === added.id)!;
    if (!unknownCondition.treatment) continue;
    treatmentMonth = month;
    expect(unknownCondition.diagnosed).toEqual(unknown.date);
    expect(known.people[parent.id].health.conditions.find(item => item.id === added.id)!.diagnosed).toEqual(firstDate);
    const normalized = decodeWorld(encodeWorld(known));
    normalized.people[parent.id].health.conditions.find(item => item.id === added.id)!.diagnosed = { ...unknown.date };
    expect(encodeWorld(normalized)).toBe(encodeWorld(unknown));
    expect(parent.health.records.at(-1)).toMatchObject({ kind: 'treatment', conditionId: added.id, date: unknown.date });
    expect(cold(known).people[parent.id].health.conditions.find(item => item.id === added.id)!.diagnosed).toEqual(firstDate);
    break;
  }
  expect(treatmentMonth).toBeGreaterThan(0);
});
