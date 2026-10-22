import { createLife, randomCreation } from '../../src/game/createLife';
import { resolveCommand } from '../../src/game/engine';
import { copyWorld, decodeWorld, encodeWorld, moneyJSON, validateWorld, type World } from '../../src/game/model';
import { randomInteger } from '../../src/game/random';
import { conversationContext, conversationTopics, type ConversationTopic } from '../../src/game/systems/conversations';
import { relationFor, socialCommandSchema } from '../../src/game/systems/relationships';
import { decodeSave } from '../../src/persistence/archive';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import graduate from '../fixtures/v3-employed-graduate.json';
import leisure from '../fixtures/v27-leisure-archive.json';

const fixture = () => decodeWorld(JSON.stringify(graduate));
const targetId = 'person_parent2';
const talk = (topic?: ConversationTopic) => ({ type: 'interact' as const, personId: targetId, action: 'talk' as const, ...(topic === undefined ? {} : { topic }) });
function acknowledge(world: World) {
  if (world.pending?.kind !== 'result') throw new Error('Expected a result');
  return resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
}
function withoutTalkFields(world: World) {
  const result = copyWorld(world), actor = result.people[result.activePersonId], relation = relationFor(result, actor.id, targetId)!;
  result.revision = 0; result.pending = null; result.pendingPriority = 0; result.journal = []; result.actionCounts = {};
  actor.stats.happiness = 0; actor.stats.smarts = 0; actor.stats.stress = 0;
  relation.strength = 0; relation.trust = 0; relation.lastInteractionYear = 0; relation.memories = [];
  result.random.outcomes = 0;
  return result;
}

test('omitting topic retains the original exact food conversation, bounded rewards and single original draw', () => {
  const before = fixture(), relation = relationFor(before, before.activePersonId, targetId)!, draw = randomInteger(before.random.outcomes, 3, 6);
  const after = resolveCommand(before, talk());
  expect(after.pending).toEqual({ kind: 'result', id: 'action_67', title: 'Time together', body: 'Avery put their phone away. What started as a quick chat turned into a discussion about food.', illustration: 'conversation', participants: [{ personId:targetId, name:'Avery Ricci', role:'father' }], effects: [
    { id: 'bond', label: 'Relationship', value: '+' + draw.value + '%', tone: 'positive' },
    { id: 'happiness', label: 'Happiness', value: '+0%', tone: 'neutral' },
  ] });
  expect(after.journal.at(-1)).toEqual({ id: 'fact_67_' + before.journal.length, date: before.date, personId: before.activePersonId, text: 'I had a proper conversation with Avery.', category: 'relationships' });
  expect(relationFor(after, after.activePersonId, targetId)).toMatchObject({ strength: relation.strength + draw.value, trust: relation.trust + 2, memories: [...relation.memories, 'talk:2023'], lastInteractionYear: 2023 });
  expect(after.random).toEqual({ ...before.random, outcomes: draw.state });
  expect(resolveCommand(before, { ...talk(), topic: undefined })).toEqual(after);
  expect(after.journal.slice(0, -1)).toEqual(before.journal);
  expect(after.actionCounts).toEqual({ ...before.actionCounts, [before.activePersonId + ':social:2023:' + targetId + ':talk']: 1 });
  expect(withoutTalkFields(after)).toEqual(withoutTalkFields(before));
  expect(before).toEqual(fixture());
});

test.each(['everyday', 'family', 'school', 'work', 'feelings'] as const)('%s uses the shared real context, one outcomes draw and saved topic-specific copy without money or progress grants', topic => {
  const before = fixture(), frozen = encodeWorld(before), context = conversationContext(before, targetId)!;
  expect(conversationTopics(before, targetId).find(row => row.id === topic)?.disabledReason).toBeUndefined();
  const after = resolveCommand(before, talk(topic)), draw = randomInteger(before.random.outcomes, 1, 100);
  expect(after.pending?.kind).toBe('result'); expect(after.pending!.body).not.toContain('discussion about food');
  expect(after.journal.at(-1)!.text).toContain('Avery');
  expect(after.random).toEqual({ ...before.random, outcomes: draw.state });
  expect(after.actionCounts[before.activePersonId + ':social:2023:' + targetId + ':talk']).toBe(1);
  expect(after.actionCounts).toEqual({ ...before.actionCounts, [before.activePersonId + ':social:2023:' + targetId + ':talk']: 1 });
  expect(after.journal.slice(0, -1)).toEqual(before.journal);
  expect(after.accounts).toEqual(before.accounts); expect(after.ledger).toEqual(before.ledger); expect(after.workHistory).toEqual(before.workHistory);
  expect(after.people[before.activePersonId].education).toEqual(before.people[before.activePersonId].education);
  expect(after.people[before.activePersonId].employment).toEqual(before.people[before.activePersonId].employment);
  expect(after.people[before.activePersonId].skills).toEqual(before.people[before.activePersonId].skills);
  expect(withoutTalkFields(after)).toEqual(withoutTalkFields(before));
  expect(decodeWorld(encodeWorld(after))).toEqual(after); expect(encodeWorld(before)).toBe(frozen);
  if (topic === 'school') expect(context.school).toMatchObject({ name: 'New York University', status: 'completed', person: 'you' });
  if (topic === 'work') expect(context.work).toMatchObject({ title: 'Software Developer', employer: 'New York Technology', status: 'current', person: 'you' });
});

test('a genuine already-paid guitar practice enables Interests; arranging a routine alone does not invent an interest', () => {
  const save = decodeSave(JSON.stringify(leisure));
  const arranged = unpackCheckpoint(save.snapshots[3].payload);
  const parent = arranged.relationships.find(row => row.roles.includes('parent') && row.to === arranged.activePersonId)!.from;
  expect(conversationTopics(arranged, parent).find(row => row.id === 'interests')!.disabledReason).toMatch(/practice/);
  expect(conversationTopics(arranged, parent).find(row => row.id === 'feelings')!.disabledReason).toMatch(/at least eight/);
  let world = save.world;
  const originalPeople = Object.keys(world.people);
  // Drain only the actual already-saved school decision/year. No calendar, funds,
  // stats, identities or random streams are replaced to create hobby evidence.
  while (world.pending || world.annual) {
    if (world.pending?.kind === 'decision') world = resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: world.pending.choices.find(row => !row.disabledReason)!.id });
    else if (world.pending) world = acknowledge(world);
    else world = resolveCommand(world, { type: 'resume' });
  }
  const option = conversationTopics(world, parent).find(row => row.id === 'interests')!;
  expect(option.disabledReason).toBeUndefined(); expect(option.body).toContain('Guitar');
  const after = resolveCommand(world, { type: 'interact', personId: parent, action: 'talk', topic: 'interests' });
  expect(after.pending!.body.toLowerCase()).toContain('guitar'); expect(after.hobbies).toEqual(world.hobbies);
  expect(Object.keys(after.people)).toEqual(Object.keys(world.people)); expect(originalPeople.every(id => !!after.people[id])).toBe(true);
});

test('a declared fixed reserved outcome respects privacy and has no trust/stat reward or second draw', () => {
  const before = fixture(); before.random.outcomes = 4; // Explicit unit boundary, never a policy/seed search.
  const draw = randomInteger(4, 1, 100); expect(draw.value).toBeGreaterThan(90);
  const relation = relationFor(before, before.activePersonId, targetId)!;
  const after = resolveCommand(before, talk('feelings')), updated = relationFor(after, after.activePersonId, targetId)!;
  expect(updated.strength).toBe(relation.strength + 1); expect(updated.trust).toBe(relation.trust);
  expect(after.people[after.activePersonId].stats).toEqual(before.people[before.activePersonId].stats);
  expect(after.pending?.kind === 'result' && after.pending.effects.map(row => row.id)).toEqual(['bond', 'trust']);
  expect(after.random).toEqual({ ...before.random, outcomes: draw.state });
  expect(decodeWorld(encodeWorld(after))).toEqual(after);
});

test.each(['everyday', 'family', 'school', 'work', 'feelings'] as const)('all topics and omitted talk share the same yearly limit after %s', topic => {
  const before = fixture(), after = acknowledge(resolveCommand(before, talk(topic))), encoded = encodeWorld(after);
  for (const next of [talk(), ...(['everyday', 'family', 'school', 'work', 'feelings'] as const).map(talk)]) {
    expect(conversationTopics(after, targetId).every(row => row.disabledReason === 'You already tried this with this person this year')).toBe(true);
    expect(() => resolveCommand(after, next)).toThrow(/already tried/);
  }
  expect(encodeWorld(after)).toBe(encoded);
  const oldTalk = acknowledge(resolveCommand(before, talk())); expect(() => resolveCommand(oldTalk, talk(topic))).toThrow(/already tried/);
});

test('invalid topics, non-talk topics, unavailable facts and insufficient trust reject before any change', () => {
  const world = fixture(), original = encodeWorld(world);
  for (const action of ['compliment', 'spend-time', 'argue', 'apologise'] as const) {
    expect(socialCommandSchema.safeParse({ ...talk('family'), action }).success).toBe(false);
    expect(() => resolveCommand(world, { ...talk('family'), action })).toThrow(/not available/);
  }
  expect(() => resolveCommand(world, { ...talk(), topic: 'imaginary-topic' } as never)).toThrow(/not available/);
  expect(() => resolveCommand(world, talk('interests'))).toThrow(/practice/);
  const lowTrust = copyWorld(world); relationFor(lowTrust, lowTrust.activePersonId, targetId)!.trust = 39;
  expect(conversationTopics(lowTrust, targetId).find(row => row.id === 'feelings')!.disabledReason).toMatch(/40%/);
  expect(() => resolveCommand(lowTrust, talk('feelings'))).toThrow(/40%/);
  expect(encodeWorld(world)).toBe(original);
});

test('previewing topics is pure and actual unknown/dead/young/pending contexts remain unavailable', () => {
  const world = fixture(), original = encodeWorld(world);
  for (let i = 0; i < 10; i++) expect(conversationTopics(world, targetId)).toEqual(conversationTopics(world, targetId));
  expect(encodeWorld(world)).toBe(original);
  expect(conversationTopics(world, 'person_missing').every(row => !!row.disabledReason)).toBe(true);
  expect(() => resolveCommand(world, { ...talk('everyday'), personId: 'person_missing' })).toThrow(/living person/);
  const dead = copyWorld(world); dead.people[targetId].died = { ...world.date }; dead.people[targetId].causeOfDeath = 'Declared eligibility boundary';
  expect(conversationTopics(dead, targetId).every(row => row.disabledReason === 'Choose a living person you know')).toBe(true);
  const child = createLife('life_conversation_child', 42, randomCreation(42), { year: 2026, month: 1, day: 1 }); child.birthAcknowledged = true;
  const parent = child.relationships.find(row => row.roles.includes('parent'))!.from;
  expect(conversationTopics(child, parent).every(row => /at least three/.test(row.disabledReason ?? ''))).toBe(true);
  expect(() => resolveCommand(child, { type: 'interact', action: 'talk', personId: parent, topic: 'everyday' })).toThrow(/age three/);
  const result = resolveCommand(world, talk('family'));
  expect(conversationTopics(result, targetId).every(row => row.disabledReason === 'Finish the current event first')).toBe(true);
});

test('actual hospital and remote contexts retain communication without inventing a visit', () => {
  const world = fixture(), target = world.people[targetId];
  target.city = 'A declared other city'; validateWorld(world);
  expect(conversationContext(world, targetId)!.setting).toBe('apart');
  expect(conversationTopics(world, targetId).find(row => row.id === 'everyday')!.disabledReason).toBeUndefined();
  const apart = resolveCommand(world, talk('everyday')); expect(apart.pending!.body).not.toMatch(/sat beside|visited|went together/);
  world.people[world.activePersonId].health.hospitalizedUntil = world.date.year * 12 + world.date.month;
  validateWorld(world); expect(conversationContext(world, targetId)!.setting).toBe('hospital');
  const hospital = resolveCommand(world, talk('everyday')); expect(hospital.pending!.body).not.toMatch(/out for|left hospital|visited you/);
});

test('an actual introduced acquaintance cannot be silently treated as family', () => {
  let world = resolveCommand(fixture(), { type: 'meet-people', purpose: 'friend', gender: 'any' });
  if (world.pending?.kind !== 'decision') throw new Error('Expected the actual introductions');
  const personId = world.pending.choices[0].id;
  world = acknowledge(resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: personId }));
  expect(conversationTopics(world, personId).find(row => row.id === 'family')!.disabledReason).toMatch(/relative, guardian or spouse/);
  expect(() => resolveCommand(world, { type: 'interact', action: 'talk', personId, topic: 'family' })).toThrow(/relative, guardian or spouse/);
  expect(conversationTopics(world, personId).find(row => row.id === 'everyday')!.disabledReason).toBeUndefined();
});

test('the prospective migration changes only three root tags and preserves old bound results and optional-absent metadata', () => {
  const bound = resolveCommand(fixture(), talk()), legacy = copyWorld(bound) as unknown as Record<string, unknown>;
  legacy.schemaVersion = 38; legacy.engineVersion = 39; legacy.contentVersion = 13;
  const migrated = decodeWorld(JSON.stringify(legacy, moneyJSON));
  expect(migrated).toEqual(bound); expect(migrated.pending!.body).toContain('discussion about food');
  expect(migrated.people).toEqual(bound.people); expect(migrated.random).toEqual(bound.random);
  expect(Object.keys(migrated)).toEqual(Object.keys(bound));
});
