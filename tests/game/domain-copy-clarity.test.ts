import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { monthFrom } from '../../src/game/calendar';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { createLife, randomCreation } from '../../src/game/createLife';
import { bindEvent, eventTemplates } from '../../src/game/content/events';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { ageOn, copyWorld, decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { offerPending } from '../../src/game/pendingQueue';
import type { Pending } from '../../src/game/runtime';
import { accountFor, post } from '../../src/game/systems/common';
import { addCondition } from '../../src/game/systems/health';
import { currentSchool } from '../../src/game/systems/schoolSchemas';
import { storyMonth } from '../../src/game/systems/stories';
import { decodeSave } from '../../src/persistence/archive';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { pupil } from '../support/pupil';
import medicalArchive from '../fixtures/v8-medical-archive.json';
import projectArchive from '../fixtures/v27-leisure-archive.json';
import graduate from '../fixtures/v3-employed-graduate.json';
import zeroMedicalBefore from '../fixtures/v48-natural-zero-medical.json';
import { withoutMedicalEpisodeMetadata } from '../support/medicalLegacyProof';

type Decision = Extract<Pending, { kind: 'decision' }>;
function decision(world: World): Decision {
  if (world.pending?.kind !== 'decision') throw new Error('Expected an actual decision');
  return world.pending;
}
const cold = (world: World) => {
  const restored = unpackCheckpoint(packCheckpoint(world), true);
  expect(encodeWorld(restored)).toBe(encodeWorld(world)); return restored;
};
const choose = (world: World, choiceId: string) => resolveCommand(world, { type: 'choose', eventId: decision(world).id, choiceId }, true);
const sha = (text: string) => createHash('sha256').update(text).digest('hex');
const zeroQuotePins = {
  2: { payload: '116594c2e0f81f185da2151506e920879fdb2e41f6fcde809a31205cd62a4feb', trace: '5e3753196fb752ff1c67d6bfb6e659db50f422fd08e01d22c4f6474072c289c5' },
  10: { payload: 'a9eb32309805fa657752bc9385781d9ac0ded7c1441b6689743e6ebaa472e6fc', trace: '9ba329b3f675f1580eacad6c903c8f52f9d1e2ddcf6ad31d90ef703098f448d5' },
} as const;
function capturedZeroQuote(seed: 2 | 10) {
  expect(zeroMedicalBefore.sourceCommit).toBe('3c797e2253c98714c79d73191a09889774afccd5');
  expect(zeroMedicalBefore.sourceVersions).toEqual({ world: 48, engine: 50, content: 27 });
  expect(zeroMedicalBefore.gameSourceSha256).toBe('2ceaf4f63a706ae9c88638c288db0316fbf95926e2b12b1f8427376250a89609');
  expect(zeroMedicalBefore.records).toHaveLength(2);
  const record = zeroMedicalBefore.records.find(row => row.seed === seed)!;
  const payload = gunzipSync(Buffer.from(record.data, 'base64')).toString('utf8'), raw = JSON.parse(payload), pins = zeroQuotePins[seed];
  expect(sha(payload)).toBe(pins.payload); expect(record.payloadSha256).toBe(pins.payload); expect(Buffer.byteLength(payload)).toBe(record.bytes);
  expect(sha(JSON.stringify(record.trace))).toBe(pins.trace); expect(record.traceSha256).toBe(pins.trace);
  expect(record.commands).toBe(55); expect(record.trace).toHaveLength(55);
  expect(record.trace.every(row => ['advance', 'resume', 'choose', 'acknowledge'].includes(row.command.type))).toBe(true);
  expect(raw).toMatchObject({ schemaVersion: 48, engineVersion: 50, contentVersion: 27 });
  const world = decodeWorld(payload, true);
  expect(ageOn(world.people[world.activePersonId], world.date)).toBe(18);
  expect(JSON.parse(encodeWorld(world)).pending).toEqual(raw.pending);
  return { world, record };
}
/** Frozen World48 outcome view, never an input to migration/replay. */
function oldMedicalOutcomeHash(world: World) {
  const proof = JSON.parse(withoutMedicalEpisodeMetadata(encodeWorld(world)));
  proof.schemaVersion = 48; proof.engineVersion = 50; proof.contentVersion = 27;
  return sha(JSON.stringify(proof));
}

/** Same natural first-available strategy and birth setup as engine.test.ts.
 * Stop at the observed boundary; do not configure a job, diagnosis, money,
 * contact, age, RNG or survival outcome to create the regression encounter. */
function naturalDecision(seed: number, templateId: string, age: number): World {
  let world = { ...createLife('life_engine', seed, randomCreation(seed), { year: 2024, month: 2, day: 29 }), birthAcknowledged: true };
  for (let turn = 0; turn < 1000; turn++) {
    const player = world.people[world.activePersonId], actualAge = ageOn(player, world.date);
    if (world.pending?.kind === 'decision' && world.pending.templateId === templateId && actualAge === age) return validateWorld(world, true);
    if (player.died || actualAge > age + 1) throw new Error('The observed seed boundary changed before it was reached');
    let command: GameCommand;
    if (world.pending?.kind === 'decision') {
      const choice = world.pending.choices.find(row => !choiceUnavailable(world, row));
      if (!choice) throw new Error('No available choice in the natural prefix');
      command = { type: 'choose', eventId: world.pending.id, choiceId: choice.id };
    } else if (world.pending) command = { type: 'acknowledge', resultId: world.pending.id };
    else command = { type: world.annual ? 'resume' : 'advance' };
    world = resolveCommand(world, command);
  }
  throw new Error('Natural prefix exceeded its command guard');
}

function projectOffer(peerLastName: string, teacherFirstName: string, teacherLastName: string) {
  // Explicit name-collision unit setup on actual scheduled pupil contacts.
  // Natural seed12 is independently covered above, without these overrides.
  let world = pupil('AU', 15);
  const template = eventTemplates.find(row => row.id === 'school-project-promise')!;
  const origin = bindEvent(world, template); offerPending(world, origin);
  world = choose(world, 'promise');
  if (world.pending?.kind !== 'result') throw new Error('Missing project scheduling result');
  world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
  const thread = world.storyThreads[0], peer = world.people[thread.peerId], teacher = world.people[thread.teacherId!];
  peer.firstName = 'Harper'; peer.lastName = peerLastName;
  teacher.firstName = teacherFirstName; teacher.lastName = teacherLastName;
  world.date = monthFrom(world.date, 2); const rng = { ...world.random };
  storyMonth(world);
  expect(world.random).toEqual(rng); expect(decision(world).templateId).toBe('story-project-promise');
  return validateWorld(world);
}

function replaceProjectCopy(world: World, peerName: string, teacherName: string) {
  const legacy = copyWorld(world), event = decision(legacy);
  const oldText = (value: string) => value.split(peerName).join('Harper').split(teacherName).join('Harper');
  event.body = oldText(event.body);
  for (const choice of event.choices) {
    choice.label = oldText(choice.label); choice.resultBody = oldText(choice.resultBody); choice.journal = oldText(choice.journal);
  }
  return validateWorld(legacy);
}

test('natural seed12 age15 binds its actual classmate and teacher throughout the project follow-up', () => {
  const world = naturalDecision(12, 'story-project-promise', 15), event = decision(world), thread = world.storyThreads.find(row => row.offeredEventId === event.id)!;
  const peer = world.people[thread.peerId], teacher = world.people[thread.teacherId!];
  expect(world.people[world.activePersonId].country).toBe('AU');
  // The expanded catalogue avoids this seed's former accidental Harper/Harper
  // collision. Explicit same-first/full-name cases below retain that coverage.
  expect(peer.id).not.toBe(teacher.id); expect(peer.firstName).not.toBe(teacher.firstName);
  expect(event.body).toContain(peer.firstName + ' is putting the class project together. ' + teacher.firstName + ' wants your section today.');
  expect(event.choices.find(row => row.id === 'ask-help')!.label).toBe('Ask ' + teacher.firstName + ' for help');
  expect(event.choices.find(row => row.id === 'complete')!.resultBody).toContain(peer.firstName + '. ' + teacher.firstName + ' records');
  expect(event.choices.find(row => row.id === 'ask-help')!.journal).toContain(teacher.firstName);
  expect(cold(world).pending).toEqual(event); expect(currentSchool(world)!.currentTeacherId).toBe(thread.teacherId);
}, 120000);

test.each([
  ['Brown', 'Kelly', 'Harper Brown (classmate)', 'Harper Kelly (teacher)'],
  ['Brown', 'Brown', 'Harper Brown (classmate)', 'Harper Brown (teacher)'],
])('new project names disambiguate %s/%s while every effect, identity, RNG stream and already-bound legacy payoff stays literal', (peerLast, teacherLast, peerName, teacherName) => {
  const world = projectOffer(peerLast, 'Harper', teacherLast), fresh = decision(world), legacy = replaceProjectCopy(world, peerName, teacherName), old = decision(legacy);
  expect(old.body).toBe('Harper is putting the class project together. Harper wants your section today. The blank page has enjoyed two months of peace.');
  expect(fresh.personIds).toEqual(old.personIds); expect(fresh.choices.map(row => row.effects)).toEqual(old.choices.map(row => row.effects));
  expect(fresh.body).toContain(peerName); expect(fresh.body).toContain(teacherName); expect(fresh.choices[1].label).toBe('Ask ' + teacherName + ' for help');
  expect(cold(legacy).pending).toEqual(old); expect(cold(world).pending).toEqual(fresh);
  for (const choice of fresh.choices) {
    const selected = choose(cold(world), choice.id), oldSelected = choose(cold(legacy), choice.id);
    expect(selected.random).toEqual(world.random); expect(oldSelected.random).toEqual(world.random);
    expect(selected.pending).toMatchObject({ kind: 'result', title: choice.resultTitle, body: choice.resultBody });
    const oldChoice = old.choices.find(row => row.id === choice.id)!;
    expect(oldSelected.pending).toMatchObject({ kind: 'result', title: oldChoice.resultTitle, body: oldChoice.resultBody });
    expect(selected.journal.at(-1)?.text).toBe(choice.journal); expect(oldSelected.journal.at(-1)?.text).toBe(oldChoice.journal);
    // This is an explicitly arranged old-copy boundary on the exact same
    // actors/effects, not a claim that this unit world was captured on-device.
    const normalized = copyWorld(selected);
    normalized.pending!.body = oldSelected.pending!.body;
    normalized.journal.at(-1)!.text = oldSelected.journal.at(-1)!.text;
    expect(encodeWorld(normalized)).toBe(encodeWorld(oldSelected));
    expect(cold(oldSelected).pending).toEqual(oldSelected.pending);
  }
});

test('new noncolliding project names keep the original first-name wording', () => {
  const world = projectOffer('Brown', 'Jordan', 'Kelly'), event = decision(world);
  expect(event.body).toBe('Harper is putting the class project together. Jordan wants your section today. The blank page has enjoyed two months of peace.');
  expect(event.choices[0].resultBody).toBe('You finish your section and explain it to Harper. Jordan records the work you actually did.');
  expect(event.choices[1].label).toBe('Ask Jordan for help'); expect(event.choices[1].journal).toBe('I asked Jordan for help and completed a shorter project section.');
});

test.each([[2, 'BR', 'R$0.00'], [10, 'ES', '€0.00']] as const)('captured World48 natural seed%i %s age18 quotes %s without inventing a patient bill or debt', (seed, country, amount) => {
  const { world, record } = capturedZeroQuote(seed), event = decision(world), care = event.choices.find(row => row.id === 'care')!, effect = care.effects[0];
  expect(world.people[world.activePersonId].country).toBe(country); expect(effect).toMatchObject({ kind: 'emergency-care', accepted: true, quotedCost: 0n });
  expect(event.body).toContain('The quoted care costs ' + amount + '. There is no patient charge for this care.');
  expect(event.body).not.toMatch(/unpaid|obligation|debt/); expect(care.resultBody).not.toMatch(/bill|unpaid|obligation|debt/);
  const initialCash = accountFor(world).cash, initialDebt = world.liabilities.filter(row => row.ownerId === world.activePersonId), selected = choose(cold(world), 'care');
  expect(selected.pending).toMatchObject({ kind: 'result', body: care.resultBody }); expect(selected.pending!.body).toContain('This care has no patient charge.');
  expect(accountFor(selected).cash).toBe(initialCash); expect(selected.liabilities.filter(row => row.ownerId === world.activePersonId)).toEqual(initialDebt);
  expect(selected.people[selected.activePersonId].health.records.at(-1)).toMatchObject({ kind: 'hospital', cost: 0n, paidMinor: 0n });
  expect(cold(selected).pending).toEqual(selected.pending);
  // Explicit historical-copy projection of this zero quote. A saved old
  // decision remains literal; choosing it produces exactly the same medicine,
  // bill, RNG and history apart from the already-stored result-body words.
  const legacy = copyWorld(world), old = decision(legacy);
  old.body = event.body.replace('. There is no patient charge for this care.', '; an unpaid emergency bill remains a real obligation.');
  old.choices.find(row => row.id === 'care')!.resultBody = 'The assessment, treatment outcome and bill are recorded. A hospital stay affects study and paid work as time passes.';
  expect(cold(legacy).pending).toEqual(old);
  for (const choice of event.choices) {
    const freshResult = choose(cold(world), choice.id), oldResult = choose(cold(legacy), choice.id), normalized = copyWorld(freshResult);
    expect(oldMedicalOutcomeHash(freshResult)).toBe(record.outcomes.find(row => row.choiceId === choice.id)!.payloadSha256);
    expect(oldResult.pending!.body).toBe(old.choices.find(row => row.id === choice.id)!.resultBody);
    normalized.pending!.body = oldResult.pending!.body;
    expect(encodeWorld(normalized)).toBe(encodeWorld(oldResult)); expect(cold(oldResult).pending).toEqual(oldResult.pending);
  }
}, 120000);

test('a fresh nonzero critical admission creates its real hospital bill and unpaid obligation when the patient cannot pay', () => {
  let world = decodeWorld(JSON.stringify(graduate));
  const personId = world.activePersonId, condition = addCondition(world, world.people[personId], 'asthma', 95);
  // Declared current unit budget before the real monthly admission and pay.
  post(world, -accountFor(world).cash, 0n, 'fixture-spending', 'Unit empty care budget');
  const ledgerOffset = world.ledger.length;
  world = resolveCommand(validateWorld(world), { type: 'advance' }, true);
  expect(world.pending).toMatchObject({ kind: 'result', title: 'Rushed to Hospital' });
  if (world.pending?.kind !== 'result') throw new Error('Expected actual admission');
  expect(world.pending.effects).toContainEqual({ id: 'bill', label: 'Patient bill', value: '$360.00', tone: 'neutral' });
  expect(world.pending.body).not.toMatch(/no patient charge/);
  const hospital = world.people[personId].health.records.find(row => row.kind === 'hospital' && row.conditionId === condition.id)!;
  expect(hospital).toMatchObject({ cost: 36000n, currency: 'USD', payerId: personId, paidCurrency: 'USD' });
  const charges = world.ledger.slice(ledgerOffset).filter(row => row.personId === personId && row.category === 'healthcare' && row.description.startsWith('Emergency care: '));
  expect(charges).toHaveLength(1);
  // paidMinor retains the historical payer-currency quote contract; the ledger
  // establishes actual cash paid and debt. Other monthly arrears are separate.
  expect(charges[0]).toMatchObject({ cashDelta: 0n, debtDelta: 36000n, currency: 'USD' });
  expect(world.liabilities.some(row => row.id === charges[0].liabilityId && row.ownerId === personId && row.kind === 'living')).toBe(true);
  expect(world.people[personId].health.conditions.find(row => row.id === condition.id)!.treatment?.paid).toBe(36000n);
  expect(cold(world).pending).toEqual(world.pending);
});

test.each(['BR', 'ES'] as const)('current %s critical admission records zero patient cost without a phantom healthcare bill or debt', country => {
  // Configured current public-care case, separate from the genuine old prefixes.
  const world = pupil(country, 18), personId = world.activePersonId;
  const condition = addCondition(world, world.people[personId], 'asthma', 95), offset = world.ledger.length;
  const admitted = resolveCommand(world, { type: 'advance' }, true);
  expect(admitted.pending).toMatchObject({ kind: 'result', title: 'Rushed to Hospital' });
  const hospital = admitted.people[personId].health.records.find(row => row.kind === 'hospital' && row.conditionId === condition.id)!;
  expect(hospital).toMatchObject({ cost: 0n, paidMinor: 0n, payerId: personId });
  expect(admitted.ledger.slice(offset).filter(row => row.personId === personId && row.category === 'healthcare')).toEqual([]);
  expect(admitted.people[personId].health.conditions.find(row => row.id === condition.id)!.treatment?.paid).toBe(0n);
  expect(admitted.pending!.body).not.toMatch(/unpaid|obligation|debt/);
  expect(cold(admitted).pending).toEqual(admitted.pending);
});

test.each([
  ['genuine archived project', projectArchive, 'story-project-promise'],
  ['genuine archived emergency', medicalArchive, 'medical-emergency'],
] as const)('%s keeps its original stored decision, choices, result and journal through cold resolution', (_name, archive, templateId) => {
  const decoded = decodeSave(JSON.stringify(archive)), world = decoded.world, original = encodeWorld(world), event = decision(world);
  expect(event.templateId).toBe(templateId); expect(cold(world).pending).toEqual(event);
  const snapshots = JSON.stringify(decoded.snapshots);
  for (const choice of event.choices) {
    const result = choose(cold(world), choice.id);
    expect(result.pending).toMatchObject({ kind: 'result', title: choice.resultTitle, body: choice.resultBody });
    expect(result.journal.slice(world.journal.length).some(row => row.text === choice.journal)).toBe(true);
    expect(encodeWorld(result)).toBe(encodeWorld(choose(world, choice.id))); expect(cold(result).pending).toEqual(result.pending);
    expect(JSON.stringify(decoded.snapshots)).toBe(snapshots);
  }
  expect(encodeWorld(world)).toBe(original);
});
