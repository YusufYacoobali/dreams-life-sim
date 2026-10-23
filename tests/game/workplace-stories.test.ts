import { bindEvent, eligibleTemplates, eventTemplates } from '../../src/game/content/events';
import { workplaceTemplates } from '../../src/game/content/workplaceStories';
import { countryCodes } from '../../src/game/countries';
import { resolveCommand } from '../../src/game/engine';
import { decodeWorld, encodeWorld, fullName } from '../../src/game/model';
import { offerPending } from '../../src/game/pendingQueue';
import { currentWorkplace } from '../../src/game/systems/workplaceSchemas';
import { endEmployment } from '../../src/game/systems/work';
import { employee } from '../support/employee';

test.each(countryCodes)('%s resolves workplace choices on actual people/contracts without wages, tenure, qualifications or draws', country => {
  const initial = employee(country), before = encodeWorld(initial), place = currentWorkplace(initial)!;
  const coworker = initial.people[place.members.find(item => item.role === 'coworker')!.personId], supervisor = initial.people[place.members.find(item => item.role === 'supervisor')!.personId];
  expect(workplaceTemplates).toHaveLength(11); expect(eventTemplates).toHaveLength(319);
  for (const template of workplaceTemplates) {
    expect(eligibleTemplates(initial)).toContainEqual(template); const event = bindEvent(initial, template); expect(encodeWorld(initial)).toBe(before);
    expect(JSON.stringify(event)).not.toMatch(/\{(?:coworker|supervisor|workplace)\}/);
    expect(event.personIds).toEqual([initial.activePersonId, ...(template.coworker ? [coworker.id] : []), ...(template.supervisor ? [supervisor.id] : [])]);
    if (template.coworker) expect(event.body).toContain(fullName(coworker)); if (template.supervisor) expect(event.body).toContain(fullName(supervisor));
    for (const choice of event.choices) {
      const offered = decodeWorld(before); offerPending(offered, event);
      const selected = resolveCommand(offered, { type: 'choose', eventId: event.id, choiceId: choice.id }, true);
      expect(selected.random).toEqual(initial.random); expect(selected.accounts).toEqual(initial.accounts); expect(selected.ledger).toEqual(initial.ledger);
      expect(selected.workHistory).toEqual(initial.workHistory); expect(selected.workplaces).toEqual(initial.workplaces); expect(selected.workRaises).toEqual(initial.workRaises);
      expect(Object.keys(selected.people)).toEqual(Object.keys(initial.people));
      for (const person of Object.values(initial.people)) {
        const immediate = choice.effects.find(effect => effect.kind === 'story-immediate');
        const performance = immediate?.personId === person.id ? immediate.work?.performance : undefined;
        const expectedJob = performance !== undefined && person.employment ? { ...person.employment, performance: Math.max(0, Math.min(100, person.employment.performance + performance)) } : person.employment;
        expect(selected.people[person.id].employment).toEqual(expectedJob); expect(selected.people[person.id].education).toEqual(person.education); expect(selected.people[person.id].finance).toEqual(person.finance);
      }
      for (const effect of choice.effects) {
        if (effect.kind === 'stat') expect(selected.people[effect.personId].stats[effect.stat]).toBe(Math.max(0, Math.min(100, initial.people[effect.personId].stats[effect.stat] + effect.delta)));
        else if (effect.kind === 'relationship') expect(selected.relationships.find(edge => edge.id === effect.relationshipId)!.strength).toBe(Math.max(0, Math.min(100, initial.relationships.find(edge => edge.id === effect.relationshipId)!.strength + effect.delta)));
        else if (effect.kind === 'story-immediate') {
          expect(effect.cash).toBeUndefined(); expect(effect.endFriendship).toBeUndefined(); expect(effect.publicImage).toBeUndefined(); expect(effect.work?.loseJob).toBeUndefined();
          for (const target of effect.trust ?? []) expect(selected.relationships.find(edge => edge.id === target.relationshipId)!.trust).toBe(Math.max(0, Math.min(100, initial.relationships.find(edge => edge.id === target.relationshipId)!.trust + target.delta)));
          if (effect.work) expect(effect.work.employmentId).toBe(initial.people[initial.activePersonId].employment!.id);
        } else throw new Error('Unexpected work-story reward');
      }
      expect(selected.journal.at(-1)?.text).toBe(choice.journal); expect(decodeWorld(encodeWorld(selected))).toEqual(selected);
      expect(() => resolveCommand(selected, { type: 'choose', eventId: event.id, choiceId: choice.id })).toThrow();
      const done = resolveCommand(selected, { type: 'acknowledge', resultId: selected.pending!.id }, true);
      expect(done.people).toEqual(selected.people); expect(done.relationships).toEqual(selected.relationships); expect(done.random).toEqual(selected.random); expect(done.ledger).toEqual(selected.ledger);
    }
  }
}, 30000);

test('unintroduced work and a genuinely ended player contract offer no workplace stories and create no replacement people', () => {
  for (const world of [employee('US', false), resolveCommand(employee(), { type: 'quit-job' })]) {
    const before = encodeWorld(world); expect(eligibleTemplates(world).some(item => !item.dramatic && item.workplace)).toBe(false);
    for (const template of workplaceTemplates) expect(() => bindEvent(world, template)).toThrow(/workplace contacts/);
    expect(encodeWorld(world)).toBe(before);
  }
});

test('temporary absence selects an actual available colleague, excludes the absent supervisor and never generates a substitute', () => {
  const world = employee(), place = currentWorkplace(world)!, coworkers = place.members.filter(item => item.role === 'coworker'), supervisor = place.members.find(item => item.role === 'supervisor')!;
  world.people[coworkers[0].personId].health.hospitalizedUntil = world.date.year * 12 + world.date.month + 2;
  world.people[supervisor.personId].health.hospitalizedUntil = world.date.year * 12 + world.date.month + 2;
  const before = encodeWorld(world), scene = workplaceTemplates.find(item => item.coworker && !item.supervisor)!;
  expect(bindEvent(world, scene).personIds).toEqual([world.activePersonId, coworkers[1].personId]);
  for (const template of workplaceTemplates.filter(item => item.supervisor)) { expect(eligibleTemplates(world)).not.toContainEqual(template); expect(() => bindEvent(world, template)).toThrow(/workplace contacts/); }
  expect(encodeWorld(world)).toBe(before);
  world.people[coworkers[1].personId].health.hospitalizedUntil = world.date.year * 12 + world.date.month + 2;
  expect(eligibleTemplates(world).some(item => !item.dramatic && item.workplace)).toBe(false);
});

test('an ended colleague contract is excluded while saved names stay fixed and new role-specific consequences reject substitution', () => {
  const world = employee(), template = workplaceTemplates.find(item => item.id === 'work-shared-credit')!, event = bindEvent(world, template), oldCoworkerId = event.personIds[1];
  offerPending(world, event); endEmployment(world, oldCoworkerId);
  const nextEvent = bindEvent(world, template); expect(nextEvent.personIds[1]).not.toBe(oldCoworkerId);
  const restored = decodeWorld(encodeWorld(world)); expect(restored.pending).toEqual(event);
  const choice = event.choices.find(item => item.id === 'name')!, before = encodeWorld(restored);
  expect(choice.resultBody).toContain(fullName(world.people[oldCoworkerId]));
  expect(() => resolveCommand(restored, { type: 'choose', eventId: event.id, choiceId: choice.id })).toThrow(/relationship|role|changed/i);
  expect(encodeWorld(restored)).toBe(before);
});

test.each([0, 100])('all workplace choices clamp actual stats and named bonds at %i', boundary => {
  for (const template of workplaceTemplates) for (const option of template.choices) {
    const world = employee(); for (const key of Object.keys(world.people[world.activePersonId].stats) as (keyof typeof world.people[string]['stats'])[]) world.people[world.activePersonId].stats[key] = boundary;
    for (const relation of world.relationships) relation.strength = boundary;
    const event = bindEvent(world, template); offerPending(world, event);
    const result = resolveCommand(world, { type: 'choose', eventId: event.id, choiceId: option.id });
    for (const effect of event.choices.find(item => item.id === option.id)!.effects) {
      if (effect.kind === 'stat') expect(result.people[effect.personId].stats[effect.stat]).toBe(Math.max(0, Math.min(100, boundary + effect.delta)));
      if (effect.kind === 'relationship') expect(result.relationships.find(item => item.id === effect.relationshipId)!.strength).toBe(Math.max(0, Math.min(100, boundary + effect.delta)));
    }
  }
});

test('work stories honour age endpoints, player availability and five-year cooldown', () => {
  const young = employee('US', true, 16, 'shop-assistant-part'); expect(eligibleTemplates(young).filter(item => !item.dramatic && item.workplace)).toHaveLength(22);
  young.date.year--; expect(eligibleTemplates(young).some(item => !item.dramatic && item.workplace)).toBe(false);
  const older = employee(); older.date.year += 63; expect(eligibleTemplates(older).filter(item => !item.dramatic && item.workplace)).toHaveLength(22); older.date.year++; expect(eligibleTemplates(older).some(item => !item.dramatic && item.workplace)).toBe(false);
  const world = employee(); world.people[world.activePersonId].health.hospitalizedUntil = world.date.year * 12 + world.date.month + 2; expect(eligibleTemplates(world).some(item => !item.dramatic && item.workplace)).toBe(false);
  world.people[world.activePersonId].health.hospitalizedUntil = 0;
  for (const template of workplaceTemplates) { world.eventHistory = [{ templateId: template.id, year: world.date.year - 4 }]; expect(eligibleTemplates(world)).not.toContainEqual(template); world.eventHistory[0].year--; expect(eligibleTemplates(world)).toContainEqual(template); }
});
