import { gunzipSync, strFromU8 } from 'fflate';
import { earlyHomeTemplates } from '../../src/game/content/earlyHomeStories';
import { bindEvent, eligibleTemplates, eventTemplates } from '../../src/game/content/events';
import { countries, countryCodes } from '../../src/game/countries';
import { decodeWorld, encodeWorld, validateWorld, World } from '../../src/game/model';
import { recordDeath, resolveCommand } from '../../src/game/engine';
import { offerPending } from '../../src/game/pendingQueue';
import { rules } from '../../src/game/rules';
import { accountFor, post } from '../../src/game/systems/common';
import { ownHousehold } from '../../src/game/systems/households';
import { relationFor } from '../../src/game/systems/relationships';
import { resolveTravel, tripQuote } from '../../src/game/systems/travel';
import { activeTrip } from '../../src/game/systems/travelSchemas';
import { isConfined, resolveLegal } from '../../src/game/systems/legal';
import { storyParent } from '../../src/game/systems/storyContext';
import { decodeSave } from '../../src/persistence/archive';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import { pupil } from '../support/pupil';
import archive from '../fixtures/v25-scholarship-archive.json';

const scene = (id: string) => eventTemplates.find(item => item.id === id)!;
function drain(initial: World) { let world = initial, guard = 0; while (world.pending?.kind === 'result' && guard++ < 20) world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id }); if (guard >= 20) throw new Error('Unfinished results'); return world; }
const parents = (world: World) => world.relationships.filter(edge => edge.to === world.activePersonId && edge.kind === 'parent').map(edge => edge.from);
function parentTrip(initial: World, parentId: string) {
  const world = validateWorld(initial), child = world.activePersonId, parent = world.people[parentId];
  post(world, 100000000n, 0n, 'fixture-funding', 'Initial parent travel test funds', null, parent);
  world.activePersonId = parentId;
  try { resolveTravel(world, { type: 'book-trip', destinationId: 'paris', duration: 1, companionIds: [], focus: 'sightseeing', quotedTotal: tripQuote(world, 'paris', 1).total }); }
  finally { world.activePersonId = child; }
  expect(activeTrip(world, parentId)).toBeDefined(); return drain(world);
}

test.each(countryCodes)('%s binds all twenty new situations and resolves every branch without inventing cash, qualifications, participants or RNG draws', country => {
  expect(earlyHomeTemplates).toHaveLength(20);
  for (const template of earlyHomeTemplates) {
    const age = Math.max(template.min, template.school ? rules[country].schoolStart : 0), initial = pupil(country, age), before = encodeWorld(initial), event = bindEvent(initial, template);
    expect(eligibleTemplates(initial)).toContainEqual(template); expect(encodeWorld(initial)).toBe(before);
    expect(JSON.stringify(event)).not.toMatch(/\{(?:parent|classmate|teacher|school|city)\}/);
    for (const id of event.personIds) { expect(initial.people[id].country).toBe(country); expect(initial.people[id].city).toBe(countries[country].cities[0]); }
    for (const choice of event.choices) {
      const offered = decodeWorld(before); offerPending(offered, event);
      const selected = resolveCommand(offered, { type: 'choose', eventId: event.id, choiceId: choice.id });
      expect(selected.random).toEqual(initial.random); expect(selected.accounts).toEqual(initial.accounts); expect(selected.ledger).toEqual(initial.ledger); expect(selected.liabilities).toEqual(initial.liabilities);
      expect(Object.keys(selected.people)).toEqual(Object.keys(initial.people));
      for (const id of Object.keys(initial.people)) expect(selected.people[id].education.qualifications).toEqual(initial.people[id].education.qualifications);
      expect(selected.pending?.kind).toBe('result'); expect(selected.journal.at(-1)?.text).toBe(choice.journal); expect(decodeWorld(encodeWorld(selected))).toEqual(selected);
      expect(() => resolveCommand(selected, { type: 'choose', eventId: event.id, choiceId: choice.id })).toThrow();
    }
  }
}, 20000);
test('physical scenes bind the real parent still at home while another parent is on an actually paid trip', () => {
  let world = pupil('US', 8); const [away, present] = parents(world); world = parentTrip(world, away);
  const template = scene('child-boardgame-rules'), before = encodeWorld(world), event = bindEvent(world, template), awayBond = relationFor(world, world.activePersonId, away)!.strength, presentBond = relationFor(world, world.activePersonId, present)!.strength;
  expect(eligibleTemplates(world)).toContainEqual(template); expect(event.personIds).toContain(present); expect(event.personIds).not.toContain(away); expect(event.body).toContain(world.people[present].firstName); expect(encodeWorld(world)).toBe(before);
  offerPending(world, event); const selected = resolveCommand(world, { type: 'choose', eventId: event.id, choiceId: 'accept' });
  expect(relationFor(selected, selected.activePersonId, away)!.strength).toBe(awayBond); expect(selected.trips).toEqual(world.trips); expect(selected.accounts).toEqual(world.accounts);
  expect(relationFor(selected, selected.activePersonId, present)!.strength).toBe(Math.min(100, presentBond + 3));
});
test('missing household IDs cannot count as co-residence for a physical parent scene', () => {
  const world = pupil('US', 8), ids = [world.activePersonId, ...parents(world)];
  for (const household of world.households) household.members = household.members.filter(id => !ids.includes(id));
  world.households = world.households.filter(item => item.members.length);
  for (const id of ids) world.people[id].householdId = null;
  validateWorld(world); expect(storyParent(world)).toBeUndefined(); expect(() => bindEvent(world, scene('child-boardgame-rules'))).toThrow(/parent at home/);
});
test('remote parent flags and relationship effects always declare their real participant context', () => {
  for (const template of eventTemplates) {
    if (template.parentContact) { expect(template.parent).toBe(true); expect(template.choices.some(choice => choice.followUp === 'arcade-invitation')).toBe(false); }
    for (const choice of template.choices) if (choice.bond) expect(template.parent).toBe(true);
  }
});
test('nonresident parents can send the explicitly remote message but cannot appear in a household game', () => {
  const world = pupil('US', 15), parentIds = parents(world); for (const id of parentIds) ownHousehold(world, world.people[id]);
  expect(eligibleTemplates(world)).toContainEqual(scene('parent-boundary')); expect(bindEvent(world, scene('parent-boundary')).personIds).toContain(parentIds[0]);
  expect(() => bindEvent(world, scene('parent-old-music'))).toThrow(/parent at home/);
  expect(eligibleTemplates(world).some(item => item.parent && !item.parentContact)).toBe(false); validateWorld(world);
});
test('actual travel permits a remote check-in from the original parent while face-to-face scenes choose the available home parent', () => {
  let world = pupil('US', 15); const [away, present] = parents(world); world = parentTrip(world, away);
  const message = bindEvent(world, scene('parent-boundary')), music = bindEvent(world, scene('parent-old-music'));
  expect(message.personIds).toContain(away); expect(message.personIds).not.toContain(present);
  expect(music.personIds).toContain(present); expect(music.personIds).not.toContain(away);
});
test('hospital/pursuit absence and a player unavailable at home cannot conjure an available physical parent', () => {
  const world = pupil('US', 8), [first, second] = parents(world), template = scene('child-boardgame-rules');
  world.people[first].health.hospitalizedUntil = world.date.year * 12 + world.date.month + 1; world.people[second].legal.wanted = true;
  expect(eligibleTemplates(world)).not.toContainEqual(template); expect(() => bindEvent(world, template)).toThrow(/parent at home/);
  world.people[first].health.hospitalizedUntil = null; world.people[second].legal.wanted = false;
  world.people[world.activePersonId].health.hospitalizedUntil = world.date.year * 12 + world.date.month + 1;
  expect(eligibleTemplates(world).some(item => item.parent && !item.parentContact)).toBe(false);
});
test('an actual parent arrest prevents contact or a physical encounter from that person', () => {
  const initial = pupil('US', 15), [parent, other] = parents(initial); let world: World | undefined;
  for (let seed = 1; seed < 100; seed++) {
    const candidate = validateWorld(initial), child = candidate.activePersonId; candidate.random.outcomes = seed; candidate.activePersonId = parent;
    try { resolveLegal(candidate, { type: 'crime', offence: 'vandalism' }, recordDeath); } finally { candidate.activePersonId = child; }
    candidate.pending = null; candidate.pendingPriority = 0; candidate.deferred = [];
    if (isConfined(candidate, candidate.people[parent])) { world = validateWorld(candidate); break; }
  }
  if (!world) throw new Error('No actual parent arrest seed');
  const message = bindEvent(world, scene('parent-boundary')); expect(message.personIds).toContain(other); expect(message.personIds).not.toContain(parent);
  expect(bindEvent(world, scene('parent-old-music')).personIds).not.toContain(parent);
});
test('all five first-year independent scenes remain available after actual parent deaths with the real guardian history retained', () => {
  const world = pupil('US', 0); for (const id of parents(world)) recordDeath(world, id, 'test fixture mortality');
  world.date.year = 2001; const before = encodeWorld(world), first = eligibleTemplates(world).filter(item => item.min === 1 && !item.parent);
  expect(first).toHaveLength(5); for (const template of first) { const event = bindEvent(world, template); expect(event.personIds).toEqual([world.activePersonId]); expect(event.body).not.toMatch(/\b(?:parent|dad|mum|mom|mother|father)\b/i); }
  expect(encodeWorld(world)).toBe(before);
});
test('new story grade/skill changes are capped and never masquerade as completed study or a qualification', () => {
  const initial = pupil('US', 8); initial.people[initial.activePersonId].education.grades = 100; initial.people[initial.activePersonId].skills.acting = 99;
  for (const [id, choiceId] of [['school-answer-blurt', 'wait'], ['school-show-tell-prop', 'mime']]) {
    const world = decodeWorld(encodeWorld(initial)), event = bindEvent(world, scene(id)); offerPending(world, event);
    const selected = resolveCommand(world, { type: 'choose', eventId: event.id, choiceId });
    expect(selected.people[selected.activePersonId].education.grades).toBe(100); expect(selected.people[selected.activePersonId].skills.acting).toBeLessThanOrEqual(100);
    expect(selected.people[selected.activePersonId].education.months).toBe(initial.people[initial.activePersonId].education.months); expect(selected.people[selected.activePersonId].education.qualifications).toEqual([]);
  }
});
test('genuine content-three scholarship current/prior worlds change only content metadata; acknowledgement cannot redraw or rebill the original result', () => {
  const save = decodeSave(JSON.stringify(archive)), raw = (text: string) => JSON.parse(strFromU8(gunzipSync(Buffer.from(JSON.parse(text).data, 'base64'))));
  const old = [raw(archive.checkpoint), ...archive.snapshots.map(point => raw(point.payload))], migrated = [save.world, ...save.snapshots.map(point => unpackCheckpoint(point.payload))];
  migrated.forEach((world, index) => { const encoded = JSON.parse(encodeWorld(world)); expect(old[index].schemaVersion).toBe(25); expect(old[index].engineVersion).toBe(24); expect(old[index].contentVersion).toBe(3); expect(world.contentVersion).toBe(22); for (const key of Object.keys(old[index]).filter(key => !['schemaVersion', 'engineVersion', 'contentVersion'].includes(key))) expect(encoded[key]).toEqual(old[index][key]); });
  expect(save.world.scholarships[0].periods.map(p => p.billed)).toEqual([350000n, 350000n]); expect(save.snapshots).toEqual(archive.snapshots);
  const world = save.world; if (world.pending?.kind !== 'result') throw new Error('Expected original age-20 result');
  const acknowledged = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
  expect(acknowledged.random).toEqual(world.random); expect(acknowledged.accounts).toEqual(world.accounts); expect(acknowledged.ledger).toEqual(world.ledger); expect(acknowledged.scholarships).toEqual(world.scholarships); expect(acknowledged.people).toEqual(world.people); expect(acknowledged.annual).toBeNull(); expect(accountFor(acknowledged).cash).toBe(accountFor(world).cash);
});
