import { teenHomeTemplates } from '../../src/game/content/teenHomeStories';
import { bindEvent, eligibleTemplates } from '../../src/game/content/events';
import { countryCodes } from '../../src/game/countries';
import { decodeWorld, encodeWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { offerPending } from '../../src/game/pendingQueue';
import { ownHousehold } from '../../src/game/systems/households';
import { relationFor } from '../../src/game/systems/relationships';
import { pupil } from '../support/pupil';

test.each(countryCodes)('%s resolves every early-teen branch with actual bounded effects and no money, qualifications, new people or random draws', country => {
  expect(teenHomeTemplates).toHaveLength(10);
  for (const template of teenHomeTemplates) {
    const initial = pupil(country, template.min), before = encodeWorld(initial), event = bindEvent(initial, template);
    expect(eligibleTemplates(initial)).toContainEqual(template); expect(encodeWorld(initial)).toBe(before);
    expect(JSON.stringify(event)).not.toMatch(/\{(?:parent|classmate|teacher|school|city)\}/);
    for (const choice of event.choices) {
      const offered = decodeWorld(before); offerPending(offered, event);
      const selected = resolveCommand(offered, { type: 'choose', eventId: event.id, choiceId: choice.id }, true);
      expect(selected.random).toEqual(initial.random); expect(selected.accounts).toEqual(initial.accounts); expect(selected.ledger).toEqual(initial.ledger);
      expect(selected.liabilities).toEqual(initial.liabilities); expect(selected.assets).toEqual(initial.assets); expect(selected.hobbies).toEqual(initial.hobbies);
      expect(Object.keys(selected.people)).toEqual(Object.keys(initial.people)); expect(selected.schoolCommunities).toEqual(initial.schoolCommunities);
      for (const person of Object.values(initial.people)) expect(selected.people[person.id].education).toEqual(person.education);
      for (const effect of choice.effects) {
        if (effect.kind === 'stat') expect(selected.people[effect.personId].stats[effect.stat]).toBe(Math.max(0, Math.min(100, initial.people[effect.personId].stats[effect.stat] + effect.delta)));
        if (effect.kind === 'relationship') expect(selected.relationships.find(edge => edge.id === effect.relationshipId)!.strength).toBe(Math.max(0, Math.min(100, initial.relationships.find(edge => edge.id === effect.relationshipId)!.strength + effect.delta)));
      }
      expect(selected.journal.at(-1)?.text).toBe(choice.journal); expect(decodeWorld(encodeWorld(selected))).toEqual(selected);
      expect(() => resolveCommand(selected, { type: 'choose', eventId: event.id, choiceId: choice.id })).toThrow();
      if (selected.pending?.kind !== 'result') throw new Error('Missing saved result');
      const done = resolveCommand(selected, { type: 'acknowledge', resultId: selected.pending.id }, true);
      expect(done.people).toEqual(selected.people); expect(done.relationships).toEqual(selected.relationships); expect(done.random).toEqual(selected.random); expect(done.ledger).toEqual(selected.ledger);
    }
  }
}, 30000);

test.each([0, 100])('all new effects respect the actual %i stat and parent-bond boundary', bound => {
  for (const template of teenHomeTemplates) for (const option of template.choices) {
    const world = pupil('US', template.min), player = world.people[world.activePersonId];
    for (const stat of ['happiness', 'stress', 'discipline', 'respect', 'energy', 'smarts'] as const) player.stats[stat] = bound;
    for (const edge of world.relationships.filter(edge => edge.kind === 'parent' && edge.to === player.id)) edge.strength = bound;
    const event = bindEvent(world, template), choice = event.choices.find(item => item.id === option.id)!; offerPending(world, event);
    const selected = resolveCommand(world, { type: 'choose', eventId: event.id, choiceId: choice.id });
    for (const [stat, delta] of Object.entries(option.changes)) expect(selected.people[player.id].stats[stat as keyof typeof player.stats]).toBe(Math.max(0, Math.min(100, bound + delta)));
    if (option.bond) { const parent = event.personIds.find(id => id !== player.id)!; expect(relationFor(selected, player.id, parent)!.strength).toBe(Math.max(0, Math.min(100, bound + option.bond))); }
    expect(selected.accounts).toEqual(world.accounts); expect(selected.random).toEqual(world.random); expect(selected.people[player.id].education).toEqual(player.education);
  }
});

test('new situations honour both age boundaries and five-year cooldown without changing state while browsing', () => {
  for (const template of teenHomeTemplates) {
    for (const age of [template.min - 1, template.max + 1]) expect(eligibleTemplates(pupil('US', age))).not.toContainEqual(template);
    const world = pupil('US', template.min), before = encodeWorld(world); expect(eligibleTemplates(world)).toContainEqual(template); bindEvent(world, template); expect(encodeWorld(world)).toBe(before);
    world.eventHistory.push({ templateId: template.id, year: world.date.year - 4 }); expect(eligibleTemplates(world)).not.toContainEqual(template);
    world.eventHistory[0].year--; expect(eligibleTemplates(world)).toContainEqual(template);
  }
});

test('physical family scenes require the real home parent; the explicitly remote voice message can retain a nonresident parent', () => {
  const world = pupil('US', 14), parentIds = world.relationships.filter(edge => edge.kind === 'parent' && edge.to === world.activePersonId).map(edge => edge.from);
  for (const id of parentIds) ownHousehold(world, world.people[id]);
  const before = encodeWorld(world), available = eligibleTemplates(world);
  for (const template of teenHomeTemplates.filter(item => item.parent && !item.parentContact)) { expect(available).not.toContainEqual(template); expect(() => bindEvent(world, template)).toThrow(/parent at home/); }
  for (const template of teenHomeTemplates.filter(item => !item.parent)) expect(available).toContainEqual(template);
  const remote = teenHomeTemplates.find(item => item.parentContact)!; expect(available).toContainEqual(remote); expect(bindEvent(world, remote).personIds).toContain(parentIds[0]); expect(encodeWorld(world)).toBe(before);
});
