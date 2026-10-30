import { copyWorld, decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { recordDeath, resolveCommand } from '../../src/game/engine';
import { createContact } from '../../src/game/systems/npcs';
import { connectPerson, partnerRelation, relationFor } from '../../src/game/systems/relationships';
import { enableOverhaul } from '../../src/game/systems/overhaul';
import { offerRomance, romanceActionOptions, romanceStoryEligible, romanceYear } from '../../src/game/systems/romanceDrama';
import { romanceDramaStories } from '../../src/game/content/romanceDramaStories';
import { dateActivities } from '../../src/game/systems/dateActivities';
import graduate from '../fixtures/v3-employed-graduate.json';
import marriage from '../fixtures/v5-marriage-result.json';

const scene = (id: string) => romanceDramaStories.find(story => story.id === id)!;
function acknowledge(world: World) { return world.pending?.kind === 'result' ? resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id }) : world; }
function couple(married = false) {
  const world = acknowledge(decodeWorld(JSON.stringify(married ? marriage : graduate)));
  enableOverhaul(world); world.pending = null; world.deferred = []; world.pendingPriority = 0;
  const actor = world.people[world.activePersonId]; actor.attractedTo = ['male', 'female', 'nonbinary'];
  let relation = partnerRelation(world);
  if (!relation) {
    const partner = createContact(world, { age: 25, gender: 'female', compatibleWith: actor.gender, country: actor.country, city: actor.city });
    connectPerson(world, partner.id); relation = relationFor(world, actor.id, partner.id)!;
    relation.romance = 'dating'; relation.kind = 'partner'; relation.roles.push('partner');
  }
  const partner = world.people[relation.from === actor.id ? relation.to : relation.from];
  partner.attractedTo = ['male', 'female', 'nonbinary']; relation.strength = 90; relation.trust = 90;
  return { world, actor, partner, relation };
}
function actualAffair(world: World, actorId = world.activePersonId) {
  const actor = world.people[actorId];
  const lover = createContact(world, { age: 26, gender: 'female', compatibleWith: actor.gender, country: actor.country, city: actor.city });
  lover.attractedTo = ['male', 'female', 'nonbinary']; lover.traits = ['impulsive'];
  connectPerson(world, lover.id, actor.id);
  const connection = relationFor(world, actor.id, lover.id)!; connection.strength = 90; connection.trust = 90;
  const previous = world.activePersonId; world.activePersonId = actor.id; world.random.outcomes = 0;
  const next = acknowledge(resolveCommand(world, { type: 'romance-action', personId: lover.id, action: 'affair' }));
  next.activePersonId = previous;
  return next;
}

test('betrayal confrontation never invents an affair or reveals a secret affair', () => {
  const { world, partner } = couple();
  expect(romanceStoryEligible(world, partner.id, scene('romance-public-status'))).toBe(false);
  const secret = actualAffair(world);
  expect(secret.affairs).toHaveLength(1);
  expect(secret.affairs![0].knownBy).not.toContain(partner.id);
  const before = encodeWorld(secret);
  expect(offerRomance(secret, partner.id, 'story', scene('romance-public-status'))).toBeUndefined();
  expect(encodeWorld(secret)).toBe(before);
});

test('player confession unlocks the actual betrayal scene without creating a scandal, payment or second relationship', () => {
  const { world, partner } = couple(true);
  const secret = actualAffair(world);
  const confessed = acknowledge(resolveCommand(secret, { type: 'romance-action', personId: partner.id, action: 'confess' }));
  const originalAffair = structuredClone(confessed.affairs), accounts = structuredClone(confessed.accounts), marriages = structuredClone(confessed.marriages);
  expect(romanceStoryEligible(confessed, partner.id, scene('romance-public-status'))).toBe(true);
  offerRomance(confessed, partner.id, 'story', scene('romance-public-status'));
  validateWorld(confessed);
  expect(confessed.pending?.body).toContain('your affair');
  expect(confessed.affairs).toEqual(originalAffair); expect(confessed.accounts).toEqual(accounts); expect(confessed.marriages).toEqual(marriages);
  expect(decodeWorld(encodeWorld(confessed))).toEqual(confessed);
});

test('a partner cannot accuse the player using the partner’s own affair', () => {
  const { world, actor, partner } = couple(true);
  const secret = actualAffair(world, partner.id); secret.activePersonId = partner.id;
  const confessed = acknowledge(resolveCommand(secret, { type: 'romance-action', personId: actor.id, action: 'confess' }));
  confessed.activePersonId = actor.id;
  expect(confessed.affairs![0].actorId).toBe(partner.id);
  expect(confessed.affairs![0].knownBy).toContain(actor.id);
  expect(romanceStoryEligible(confessed, partner.id, scene('romance-public-status'))).toBe(false);
});

test('a spouse cannot receive the divorce spreadsheet without an actual earlier argument', () => {
  const { world, partner, relation } = couple(true);
  expect(romanceStoryEligible(world, partner.id, scene('romance-argument-footnotes'))).toBe(false);
  expect(romanceStoryEligible(world, partner.id, scene('romance-wedding-album'))).toBe(false);
  relation.memories.push('argument:' + world.date.year);
  expect(romanceStoryEligible(world, partner.id, scene('romance-argument-footnotes'))).toBe(true);
  expect(romanceStoryEligible(world, partner.id, scene('romance-wedding-album'))).toBe(true);
  relation.romance = 'dating';
  expect(romanceStoryEligible(world, partner.id, scene('romance-argument-footnotes'))).toBe(false);
});

test('a fresh start scene cannot invite somebody to abandon a present partner', () => {
  const { world, actor, partner, relation } = couple();
  relation.romance = 'ex'; relation.kind = 'acquaintance'; relation.roles = ['acquaintance']; relation.memories.push('breakup:' + (world.date.year - 2));
  expect(romanceStoryEligible(world, partner.id, scene('romance-ex-friendship'))).toBe(true);
  const current = createContact(world, { age: 25, gender: 'female', compatibleWith: actor.gender, country: actor.country, city: actor.city });
  connectPerson(world, current.id); const present = relationFor(world, actor.id, current.id)!;
  present.romance = 'dating'; present.kind = 'partner'; present.roles.push('partner');
  expect(romanceStoryEligible(world, partner.id, scene('romance-ex-friendship'))).toBe(false);
  expect(romanceStoryEligible(world, partner.id, scene('romance-ex-small-news'))).toBe(true);
});

test.each(['relocated', 'hospitalised', 'deceased'] as const)('the new dramatic premise cannot bind an unavailable %s partner', state => {
  const { world, partner, relation } = couple(true); relation.memories.push('argument:' + world.date.year);
  if (state === 'relocated') partner.city += ' distant';
  if (state === 'hospitalised') partner.health.hospitalizedUntil = world.date.year * 12 + world.date.month;
  if (state === 'deceased') recordDeath(world, partner.id, 'test eligibility boundary');
  const original = copyWorld(world);
  expect(romanceStoryEligible(world, partner.id, scene('romance-argument-footnotes'))).toBe(false);
  expect(offerRomance(world, partner.id, 'story', scene('romance-argument-footnotes'))).toBeUndefined();
  expect(world).toEqual(original);
});

// The absurd scenes supplement these quieter scenes. They must remain available
// to a healthy couple, with no prior argument or betrayal fabricated for flavour.
test('healthy couples retain ordinary affection, privacy and separate interests', () => {
  const { world, partner } = couple();
  for (const id of ['romance-blank-weekend', 'romance-emergency-contact', 'romance-personal-space', 'romance-cooking-verdict', 'romance-unwanted-advice']) {
    expect(romanceStoryEligible(world, partner.id, scene(id))).toBe(true);
  }
  expect(world.affairs).toEqual([]); expect(world.romanceOffers).toEqual([]);
});

function chooseScene(world: World, partnerId: string, templateId: string, choiceId: string) {
  offerRomance(world, partnerId, scene(templateId).group === 'ex' ? 'ex' : 'story', scene(templateId));
  if (world.pending?.kind !== 'decision') throw new Error('Expected an eligible story');
  return resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId });
}
function exCouple() {
  const setup = couple(); setup.relation.romance = 'ex'; setup.relation.kind = 'acquaintance'; setup.relation.roles = ['acquaintance'];
  setup.relation.memories.push('breakup:' + (setup.world.date.year - 2));
  return setup;
}

test('the revised exit-interview boundary blocks real approaches after cold reload and may be lifted deliberately', () => {
  const { world, partner } = exCouple();
  const after = acknowledge(chooseScene(world, partner.id, 'romance-ex-closure', 'boundary'));
  const cold = decodeWorld(encodeWorld(after));
  expect(romanceActionOptions(cold, partner.id).find(option => option.action === 'reach-out')?.disabledReason).toMatch(/no contact/);
  expect(() => resolveCommand(cold, { type: 'romance-action', personId: partner.id, action: 'reconcile' })).toThrow(/no contact/);
  const lifted = acknowledge(resolveCommand(cold, { type: 'romance-action', personId: partner.id, action: 'allow-contact' }));
  expect(romanceActionOptions(lifted, partner.id).find(option => option.action === 'reconcile')?.disabledReason).toBeUndefined();
});

test.each([['consent', 0, 'dating'], ['refusal', 4, 'ex']] as const)('fresh-start discussion requires a separate actual reconciliation request and allows %s', (_, outcomes, expected) => {
  const { world, partner } = exCouple();
  const after = acknowledge(chooseScene(world, partner.id, 'romance-ex-friendship', 'slow'));
  expect(relationFor(after, after.activePersonId, partner.id)?.romance).toBe('ex');
  expect(romanceActionOptions(after, partner.id).find(option => option.action === 'reconcile')?.label).toBe('Continue Reconciliation');
  after.random.outcomes = outcomes;
  const asked = resolveCommand(decodeWorld(encodeWorld(after)), { type: 'romance-action', personId: partner.id, action: 'reconcile' });
  expect(relationFor(asked, asked.activePersonId, partner.id)?.romance).toBe(expected);
  expect(relationFor(asked, asked.activePersonId, partner.id)?.memories.some(memory => memory.startsWith('romance-reconciliation-open:'))).toBe(false);
});

test('mistrust persists, while an actual apology addresses it without deleting the argument history', () => {
  const { world, partner } = couple();
  const jealous = acknowledge(chooseScene(world, partner.id, 'romance-phone-face-down', 'inspect'));
  const relation = relationFor(jealous, jealous.activePersonId, partner.id)!;
  expect(relation.memories).toContain('romance-mistrust:' + world.date.year);
  expect(relation.memories).toContain('argument:' + world.date.year);
  const repaired = chooseScene(decodeWorld(encodeWorld(jealous)), partner.id, 'romance-unfinished-apology', 'own');
  const history = relationFor(repaired, repaired.activePersonId, partner.id)!.memories;
  expect(history.some(memory => memory.startsWith('romance-mistrust:'))).toBe(false);
  expect(history).toContain('argument:' + world.date.year);
  expect(history).toContain('romance-repair:' + world.date.year);
});

test('cruel response creates a real three-month pause in romantic outings with exact calendar expiry', () => {
  const { world, partner, relation } = couple(); relation.memories.push('argument:' + world.date.year);
  const paused = acknowledge(chooseScene(world, partner.id, 'romance-museum-silence', 'reopen'));
  const saved = decodeWorld(encodeWorld(paused));
  expect(dateActivities(saved, partner.id).find(option => option.id === 'walk')?.disabledReason).toMatch(/three months/);
  expect(() => resolveCommand(saved, { type: 'ask-date', personId: partner.id, activity: 'walk' })).toThrow(/three months/);
  const future = copyWorld(saved), month = future.date.year * 12 + future.date.month - 1 + 3;
  future.date.year = Math.floor(month / 12); future.date.month = month % 12 + 1;
  expect(dateActivities(future, partner.id).find(option => option.id === 'walk')?.disabledReason).toBeUndefined();
  const date = resolveCommand(future, { type: 'ask-date', personId: partner.id, activity: 'walk' });
  expect(date.pending?.kind).toBe('result');
});

test('a serious rejection in a damaged marriage reaches the NPC divorce discussion while a healthy marriage stays intact', () => {
  for (const damaged of [true, false]) {
    const { world, partner, relation } = couple(true); relation.memories.push('argument:' + world.date.year);
    if (damaged) { relation.trust = 20; relation.strength = 30; }
    partner.traits = ['practical'];
    const answer = acknowledge(chooseScene(world, partner.id, 'romance-argument-footnotes', 'bin'));
    const records = structuredClone(answer.marriages), accounts = structuredClone(answer.accounts);
    answer.date.year += 1; answer.random.outcomes = 0; romanceYear(answer);
    expect(answer.romanceOffers!.some(offer => offer.kind === 'divorce')).toBe(damaged);
    expect(partnerRelation(answer)?.romance).toBe('married');
    expect(answer.marriages).toEqual(records); expect(answer.accounts).toEqual(accounts);
    validateWorld(answer);
  }
});

test('a v2 dramatic offer cancels safely after relocation with no remote consequence or participant replacement', () => {
  const { world, partner, relation } = couple(true); relation.memories.push('argument:' + world.date.year);
  offerRomance(world, partner.id, 'story', scene('romance-wedding-album'));
  partner.city += ' distant';
  if (world.pending?.kind !== 'decision') throw new Error('Expected a bound decision');
  const before = structuredClone(relation), after = resolveCommand(decodeWorld(encodeWorld(world)), { type: 'choose', eventId: world.pending.id, choiceId: 'blame' });
  expect(after.pending?.body).toMatch(/no longer available/);
  expect(relationFor(after, after.activePersonId, partner.id)).toEqual(before);
  expect(after.romanceOffers![0].personId).toBe(partner.id);
});

test('a saved v1 cake-and-phone choice preserves its old prose and stats without acquiring the new mistrust rule', () => {
  const { world, partner } = couple();
  offerRomance(world, partner.id, 'story', scene('romance-phone-face-down'));
  const offer = world.romanceOffers![0]; offer.ruleVersion = 1;
  const oldBody = 'The cake was innocent. Your demand was not. ' + partner.firstName + ' asks when privacy became a disciplinary matter.';
  const oldJournal = 'I demanded to inspect ' + partner.firstName + '’s phone without evidence.';
  for (const choice of offer.storyChoices!) {
    delete choice.consequence;
    if (choice.id === 'inspect') { choice.body = oldBody; choice.journal = oldJournal; }
  }
  if (world.pending?.kind !== 'decision') throw new Error('Expected a bound decision');
  for (const choice of world.pending.choices) {
    for (const effect of choice.effects) if (effect.kind === 'romance-choice') effect.ruleVersion = 1;
    const savedChoice = offer.storyChoices!.find(item => item.id === choice.id)!;
    choice.resultBody = savedChoice.body; choice.journal = savedChoice.journal;
  }
  const pendingId = world.pending.id, before = relationFor(world, world.activePersonId, partner.id)!;
  const trust = before.trust, strength = before.strength;
  const cold = decodeWorld(encodeWorld(world));
  const after = resolveCommand(cold, { type: 'choose', eventId: pendingId, choiceId: 'inspect' });
  expect(after.pending?.body).toBe(oldBody);
  const relation = relationFor(after, after.activePersonId, partner.id)!;
  expect(relation.trust).toBe(trust - 6); expect(relation.strength).toBe(strength - 7);
  expect(relation.memories.some(memory => memory.startsWith('romance-mistrust:') || memory.startsWith('argument:'))).toBe(false);
  expect(after.romanceOffers![0].storyChoices?.find(choice => choice.id === 'inspect')?.journal).toBe(oldJournal);
});
