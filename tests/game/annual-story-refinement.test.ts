import { annualStoryRefinements, refinedAnnualTemplate } from '../../src/game/content/annualStoryRefinements';
import { bindEvent, eligibleTemplates, eventTemplates } from '../../src/game/content/events';
import type { EventTemplate } from '../../src/game/content/eventTypes';
import { createLife, randomCreation } from '../../src/game/createLife';
import { resolveCommand } from '../../src/game/engine';
import { decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { offerPending } from '../../src/game/pendingQueue';
import { enableOverhaul } from '../../src/game/systems/overhaul';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { pupil } from '../support/pupil';
import { employee } from '../support/employee';
import { lifeStoryWorld } from '../support/lifeStory';
import { prisonPeerStoryWorld } from '../support/legalStories';
import { startStudy } from '../support/studyStory';

const revisions = Object.keys(annualStoryRefinements);
const scene = (id: string) => eventTemplates.find(template => template.id === id)!;
const copies = new Map<string, string>();
/** Declared context fixtures reuse real school/team/course/prison helpers. They
 * isolate binding and settlement; these are not annual encounter-rate claims. */
function context(template: EventTemplate) {
  const key = template.workplace ? 'work' : template.study ? 'study' : template.legal ? 'prison'
    : template.child ? 'family' : template.school ? 'school-' + template.min : 'age-' + template.min;
  if (!copies.has(key)) {
    let world: World;
    if (key === 'work') world = employee();
    else if (key === 'study') world = startStudy();
    else if (key === 'prison') world = prisonPeerStoryWorld();
    else if (key === 'family') world = lifeStoryWorld();
    else if (key.startsWith('school-')) world = pupil('US', template.min);
    else {
      world = createLife('life_annual_refinement', 312, randomCreation(312), { year: 2000, month: 1, day: 1 });
      world.date.year += template.min; world.birthAcknowledged = true;
    }
    enableOverhaul(world);
    world.pending = null; world.pendingPriority = 0; world.deferred = []; world.annual = null;
    copies.set(key, encodeWorld(validateWorld(world)));
  }
  return decodeWorld(copies.get(key)!);
}
function mechanics(template: EventTemplate) {
  const { title: _title, body: _body, choices, ...rules } = template;
  return { ...rules, choices: choices.map(({ label: _label, title: _title, result: _result, journal: _journal, ...effects }) => effects) };
}
function settle(world: World, choiceId: string) {
  if (world.pending?.kind !== 'decision') throw new Error('Expected bound annual decision');
  return resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId }, true);
}

test('copy revision2 has actual catalogue targets and cannot revise eligibility, identifiers or mechanical effects', () => {
  expect(revisions).toHaveLength(26);
  const untouched = eventTemplates.find(template => !annualStoryRefinements[template.id])!;
  expect(refinedAnnualTemplate(untouched, true)).toBe(untouched);
  for (const id of revisions) {
    const original = scene(id), serialized = JSON.stringify(original), patch = annualStoryRefinements[id];
    expect(original).toBeDefined(); expect(patch.revision).toBe(2);
    for (const choiceId of Object.keys(patch.choices)) expect(original.choices.some(choice => choice.id === choiceId)).toBe(true);
    expect(refinedAnnualTemplate(original, false)).toBe(original);
    const refined = refinedAnnualTemplate(original, true);
    expect(mechanics(refined)).toEqual(mechanics(original));
    expect(JSON.stringify(original)).toBe(serialized);
    const originalTokens = JSON.stringify(original).match(/\{[A-Za-z]+\}/g) ?? [];
    for (const token of JSON.stringify(refined).match(/\{[A-Za-z]+\}/g) ?? []) expect(originalTokens).toContain(token);
  }
});

test.each(revisions)('%s: all revised choices bind real people and settle identically after checkpoint reload', id => {
  const template = scene(id), world = context(template), before = encodeWorld(world);
  // School fixtures are primary-age, all refined school scenes accept that age.
  expect(eligibleTemplates(world)).toContain(template);
  const current = bindEvent(world, template);
  expect(encodeWorld(world)).toBe(before);
  expect(JSON.stringify(current)).not.toMatch(/\{(?:parent|classmate|teacher|coworker|supervisor|child|studyField|studySchool|prisonPeer|city)\}/);
  const legacy = decodeWorld(before); delete legacy.overhaulVersion;
  const old = bindEvent(legacy, template);
  expect(current.choices.map(choice => choice.effects)).toEqual(old.choices.map(choice => choice.effects));
  expect(current.personIds).toEqual(old.personIds);
  expect(current.choices.map(choice => choice.id)).toEqual(old.choices.map(choice => choice.id));
  for (const choice of current.choices) {
    const input = decodeWorld(before); offerPending(input, current);
    const cold = unpackCheckpoint(packCheckpoint(input), true);
    expect(cold.pending).toEqual(current);
    const direct = settle(input, choice.id), reopened = settle(cold, choice.id);
    expect(encodeWorld(reopened)).toBe(encodeWorld(direct));
    expect(direct.pending).toMatchObject({ kind: 'result', body: choice.resultBody, title: choice.resultTitle });
    expect(direct.journal.at(-1)?.text).toBe(choice.journal);
    expect(direct.random).toEqual(world.random);
    for (const key of ['assets', 'cases', 'marriages', 'sentences', 'ledger', 'households'] as const) expect(direct[key]).toEqual(world[key]);
    expect(Object.keys(direct.people)).toEqual(Object.keys(world.people));
    expect(direct.storyThreads).toEqual(world.storyThreads);
  }
});

test('a literal old bound offer keeps its original text after opt-in, save, cold reopen and resolution', () => {
  const template = scene('first-cake'), world = context(template);
  delete world.overhaulVersion;
  const parent = world.people[bindEvent(world, template).personIds[1]];
  parent.firstName = '$& {parent}'; // Binding names are literal, never recursively substituted.
  const original = bindEvent(world, template), originalBytes = JSON.stringify(original);
  offerPending(world, original); enableOverhaul(world);
  const cold = decodeWorld(encodeWorld(world));
  expect(JSON.stringify(cold.pending)).toBe(originalBytes);
  const beforeNew = encodeWorld(cold), newOffer = bindEvent(cold, template);
  expect(encodeWorld(cold)).toBe(beforeNew);
  expect(newOffer.choices.find(choice => choice.id === 'share')!.resultBody).not.toBe(original.choices.find(choice => choice.id === 'share')!.resultBody);
  const chosen = original.choices.find(choice => choice.id === 'share')!, resolved = settle(cold, 'share');
  expect(resolved.pending).toMatchObject({ kind: 'result', body: chosen.resultBody });
  expect(resolved.journal.at(-1)?.text).toBe(chosen.journal);
  expect(original.body).toContain(parent.firstName);
});
