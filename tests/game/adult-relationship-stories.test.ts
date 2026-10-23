import { adultRelationshipTemplates } from '../../src/game/content/adultRelationshipStories';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { bindEvent, eligibleTemplates, eventTemplates } from '../../src/game/content/events';
import { countryCodes } from '../../src/game/countries';
import { resolveCommand } from '../../src/game/engine';
import { decodeWorld, encodeWorld, fullName, moneyJSON } from '../../src/game/model';
import { post } from '../../src/game/systems/common';
import { offerPending } from '../../src/game/pendingQueue';
import { refreshFriendship, relationFor } from '../../src/game/systems/relationships';
import { currentWorkplace } from '../../src/game/systems/workplaceSchemas';
import { adultSocial } from '../support/adultSocial';
import { employee } from '../support/employee';

test.each(countryCodes)('%s resolves all51 adult social choices with exact quoted costs, bound people and no service, qualification or random awards', country => {
  const { world, friendId, partnerId } = adultSocial(country);post(world,1_000_000_000n,0n,'fixture-funding','Explicit paid-story budget');const before = encodeWorld(world);
  expect(adultRelationshipTemplates).toHaveLength(17); expect(eventTemplates).toHaveLength(319);
  for (const template of adultRelationshipTemplates) {
    expect(eligibleTemplates(world)).toContainEqual(template); const event = bindEvent(world, template), otherId = template.friend ? friendId : partnerId;
    expect(encodeWorld(world)).toBe(before); expect(event.personIds).toEqual([world.activePersonId, otherId]); expect(event.body).toContain(fullName(world.people[otherId])); expect(JSON.stringify(event,moneyJSON)).not.toMatch(/\{(?:friend|partner)\}/);
    for (const choice of event.choices) {
      const offered = decodeWorld(before); offerPending(offered, event); const result = resolveCommand(offered, { type: 'choose', eventId: event.id, choiceId: choice.id }, true);
      const immediate=choice.effects.find(effect=>effect.kind==='story-immediate'),cash=immediate?.kind==='story-immediate'?immediate.cash:undefined;
      expect(result.random).toEqual(world.random);expect(result.accounts).toEqual(world.accounts.map(account=>cash?.accountId===account.id?{...account,cash:account.cash+cash.minor}:account));
      expect(result.ledger.slice(0,world.ledger.length)).toEqual(world.ledger);expect(result.ledger).toHaveLength(world.ledger.length+(cash?1:0));
      if(cash)expect(result.ledger.at(-1)).toMatchObject({personId:world.activePersonId,currency:cash.currency,cashDelta:cash.minor,category:'story-expense'});
      expect(result.workHistory).toEqual(world.workHistory); expect(result.workplaces).toEqual(world.workplaces); expect(result.workRaises).toEqual(world.workRaises); expect(result.marriages).toEqual(world.marriages); expect(result.households).toEqual(world.households);expect(result.assets).toEqual(world.assets);expect(result.liabilities).toEqual(world.liabilities);expect(result.storyThreads).toEqual(world.storyThreads);
      expect(Object.keys(result.people)).toEqual(Object.keys(world.people));
      for (const person of Object.values(world.people)) { if (person.id !== world.activePersonId) expect(result.people[person.id]).toEqual(person); else { const { stats, ...rest } = person, { stats: nextStats, ...nextRest } = result.people[person.id]; expect(nextRest).toEqual(rest); } }
      for (const edge of world.relationships) {
        const effect = choice.effects.find(item => item.kind === 'relationship' && item.relationshipId === edge.id), actual = result.relationships.find(item => item.id === edge.id)!;
        const expected={...edge,roles:[...edge.roles],memories:[...edge.memories]};
        if (effect?.kind === 'relationship') { expect(edge.id).toBe(relationFor(world, world.activePersonId, otherId)!.id);expected.strength=Math.max(0,Math.min(100,edge.strength+effect.delta)); }
        if(immediate?.kind==='story-immediate'){
          const trust=immediate.trust?.find(target=>target.relationshipId===edge.id);if(trust)expected.trust=Math.max(0,Math.min(100,edge.trust+trust.delta));
          if(immediate.endFriendship?.relationshipId===edge.id){expected.roles=expected.roles.filter(role=>role!=='friend');expected.kind='coworker';expected.memories.push('friendship-ended:'+world.date.year);}
        }
        expect(actual).toEqual(expected);
      }
      for (const effect of choice.effects) {
        if (effect.kind === 'stat') expect(result.people[effect.personId].stats[effect.stat]).toBe(Math.max(0, Math.min(100, world.people[effect.personId].stats[effect.stat] + effect.delta)));
        else if(effect.kind==='story-immediate'){expect(effect.work).toBeUndefined();expect(effect.publicImage).toBeUndefined();}
        else if (effect.kind !== 'relationship') throw new Error('Unexpected social-story award');
      }
      expect(result.journal.at(-1)?.text).toBe(choice.journal); expect(decodeWorld(encodeWorld(result))).toEqual(result); expect(() => resolveCommand(result, { type: 'choose', eventId: event.id, choiceId: choice.id })).toThrow();
      const done = resolveCommand(result, { type: 'acknowledge', resultId: result.pending!.id }, true); expect(done.people).toEqual(result.people); expect(done.relationships).toEqual(result.relationships); expect(done.random).toEqual(result.random); expect(done.ledger).toEqual(result.ledger);
    }
  }
}, 30000);

test('ordinary acquaintances, coworkers and former partners without an explicit friendship do not become story substitutes', () => {
  const world = employee(), before = encodeWorld(world); expect(eligibleTemplates(world).some(item => item.friend || item.partner)).toBe(false);
  for (const template of adultRelationshipTemplates) expect(() => bindEvent(world, template)).toThrow(/existing available adult/);
  expect(encodeWorld(world)).toBe(before);
  const { world: ended, friendId, partnerId } = adultSocial(); relationFor(ended, ended.activePersonId, friendId)!.roles = ['coworker'];
  const edge = relationFor(ended, ended.activePersonId, partnerId)!; edge.romance = 'ex'; edge.kind = 'coworker'; edge.roles = ['coworker']; expect(eligibleTemplates(ended).some(item => item.friend || item.partner)).toBe(false);
});

test.each(['hospital', 'wanted', 'different-city', 'different-country', 'minor', 'dead'] as const)('an unavailable %s friend and partner are excluded without creating contacts or drawing randomness', absence => {
  const { world, friendId, partnerId } = adultSocial();
  for (const id of [friendId, partnerId]) {
    const person = world.people[id];
    if (absence === 'hospital') person.health.hospitalizedUntil = world.date.year * 12 + world.date.month + 2;
    if (absence === 'wanted') person.legal.wanted = true;
    if (absence === 'different-city') person.city = 'Elsewhere';
    if (absence === 'different-country') person.country = 'CA';
    if (absence === 'minor') person.born = { ...world.date, year: world.date.year - 17 };
    if (absence === 'dead') person.died = { ...world.date };
  }
  const before = JSON.stringify(world, (_key, value) => typeof value === 'bigint' ? value.toString() : value); expect(eligibleTemplates(world).some(item => item.friend || item.partner)).toBe(false);
  for (const template of adultRelationshipTemplates) expect(() => bindEvent(world, template)).toThrow(/existing available adult/);
  expect(JSON.stringify(world, (_key, value) => typeof value === 'bigint' ? value.toString() : value)).toBe(before);
});

test('a saved scene retains its originally bound friend when another friend becomes the available candidate', () => {
  const { world, friendId } = adultSocial(), template = adultRelationshipTemplates.find(item => item.id === 'friend-long-voice-note')!, original = bindEvent(world, template);
  offerPending(world, original); world.people[friendId].health.hospitalizedUntil = world.date.year * 12 + world.date.month + 2;
  const otherId = currentWorkplace(world)!.members.find(item => item.role === 'supervisor')!.personId, other = relationFor(world, world.activePersonId, otherId)!; other.strength = 65; refreshFriendship(other);
  expect(bindEvent(world, template).personIds).toEqual([world.activePersonId, otherId]); const restored = decodeWorld(encodeWorld(world)); expect(restored.pending).toEqual(original);
  const result = resolveCommand(restored, { type: 'choose', eventId: original.id, choiceId: 'listen' }); expect(relationFor(result, world.activePersonId, friendId)!.strength).toBe(68);expect(relationFor(result,world.activePersonId,friendId)!.trust).toBe(relationFor(world,world.activePersonId,friendId)!.trust); expect(relationFor(result, world.activePersonId, otherId)).toEqual(other); expect(result.journal.at(-1)?.text).toBe(original.choices.find(item => item.id === 'listen')!.journal);
});

test('a new consequential wedding scene keeps its frozen friend and refuses a stale availability context without substituting another person',()=>{
  const {world,friendId}=adultSocial(),event=bindEvent(world,adultRelationshipTemplates.find(item=>item.id==='friend-quiet-company')!);offerPending(world,event);
  world.people[friendId].health.hospitalizedUntil=world.date.year*12+world.date.month+2;
  const restored=decodeWorld(encodeWorld(world)),before=encodeWorld(restored);expect(restored.pending).toEqual(event);
  for(const choice of event.choices){expect(choiceUnavailable(restored,choice)).toBeDefined();expect(()=>resolveCommand(restored,{type:'choose',eventId:event.id,choiceId:choice.id})).toThrow(/relationship|friendship/);}
  expect(encodeWorld(restored)).toBe(before);
});

test.each([0, 100])('all adult social choices clamp actual stats and the named bond at%i', boundary => {
  for (const template of adultRelationshipTemplates) for (const option of template.choices) {
    const { world, friendId, partnerId } = adultSocial();post(world,1_000_000_000n,0n,'fixture-funding','Explicit paid-story boundary budget'); for (const key of Object.keys(world.people[world.activePersonId].stats) as (keyof typeof world.people[string]['stats'])[]) world.people[world.activePersonId].stats[key] = boundary;
    const otherId = template.friend ? friendId : partnerId, edge = relationFor(world, world.activePersonId, otherId)!; edge.strength = boundary;
    const event = bindEvent(world, template); offerPending(world, event); const result = resolveCommand(world, { type: 'choose', eventId: event.id, choiceId: option.id });
    for (const effect of event.choices.find(item => item.id === option.id)!.effects) { if (effect.kind === 'stat') expect(result.people[effect.personId].stats[effect.stat]).toBe(Math.max(0, Math.min(100, boundary + effect.delta))); else if (effect.kind === 'relationship') expect(result.relationships.find(item => item.id === effect.relationshipId)!.strength).toBe(Math.max(0, Math.min(100, boundary + effect.delta))); }
  }
});

test('adult availability, age endpoints, active-romance separation and five-year cooldown apply before binding', () => {
  const { world, friendId } = adultSocial(); const friend = relationFor(world, world.activePersonId, friendId)!; friend.roles = ['coworker']; friend.kind = 'coworker';
  // The current partner has a friendship role too, but cannot fill the friend slot.
  expect(eligibleTemplates(world).some(item => item.friend)).toBe(false); friend.roles.push('friend'); friend.kind = 'friend';
  world.people[world.activePersonId].health.hospitalizedUntil = world.date.year * 12 + world.date.month + 2; expect(eligibleTemplates(world).some(item => item.friend || item.partner)).toBe(false); world.people[world.activePersonId].health.hospitalizedUntil = 0;
  world.people[world.activePersonId].born.year = world.date.year - 17; expect(eligibleTemplates(world).some(item => item.friend || item.partner)).toBe(false);
  world.people[world.activePersonId].born.year = world.date.year - 18; expect(eligibleTemplates(world).filter(item => adultRelationshipTemplates.includes(item))).toHaveLength(17);
  world.people[world.activePersonId].born.year = world.date.year - 120; expect(eligibleTemplates(world).filter(item => adultRelationshipTemplates.includes(item))).toHaveLength(17);
  world.people[world.activePersonId].born.year--; expect(eligibleTemplates(world).some(item => item.friend || item.partner)).toBe(false); world.people[world.activePersonId].born.year = world.date.year - 22;
  for (const template of adultRelationshipTemplates) { world.eventHistory = [{ templateId: template.id, year: world.date.year - 4 }]; expect(eligibleTemplates(world)).not.toContainEqual(template); world.eventHistory[0].year--; expect(eligibleTemplates(world)).toContainEqual(template); }
});
