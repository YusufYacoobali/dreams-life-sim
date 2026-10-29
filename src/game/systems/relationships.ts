import { currentBestFriendship } from './friendshipSchemas';
import { activeTrip, physicalLocation, samePhysicalPlace } from './travelSchemas';
import { royalMarriage } from './royalty';
import { serviceAway } from './serviceSchemas';
import { z } from 'zod';
import { ageOn, fullName } from '../personHelpers';
import type { Person, Stats, World } from '../model';
import { genders } from './familySchemas';
import { IneligibleAction } from '../errors';
import { rules } from '../rules';
import { formatMoney, roundRatio } from '../money';
import { assetCatalog } from '../content/assets';
import { RuntimeEffectRow } from '../runtime';
import { netWorth, protectSeparateProperty } from '../valuation';
import { accountFor, active, bounded, charge, draw, fact, post, result } from './common';
import { createContact } from './npcs';
import { moveHousehold, ownHousehold } from './households';
import { assetPrice, resolveAssets } from './assets';
import { exchangeQuote } from './finance';
import { settleBackground } from './npcBudget';
import { hospitalized } from './healthSchemas';
import { isConfined } from './legalSchemas';
import { conversationContext, conversationTopicIds, conversationTopics } from './conversations';
import { writeConversation } from '../content/conversationWriting';
import { personReference, sentenceSubject } from '../content/personInteractionWriting';
import { dateActivities, dateActivityOutcome } from './dateActivities';
import { dateActivityIds } from './dateActivitySchemas';
import { activeRomance, dateBudget, otherPerson, relationFor, romanceReason, type Relationship } from './relationshipQueries';
export { connectPerson } from './relationshipContacts';
export { activeRomance, closeFamily, dateBudget, otherPerson, partnerRelation, relationFor, romanceReason, socialActionUsed, type Relationship, type RomanceLookups } from './relationshipQueries';

export const socialCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('meet-people'), purpose: z.enum(['friend', 'dating']), gender: z.enum(['any', ...genders]) }),
  z.object({ type: z.literal('interact'), personId: z.string(), action: z.enum(['talk', 'compliment', 'spend-time', 'argue', 'apologise']), topic: z.enum(conversationTopicIds).optional() }).refine(command => command.topic === undefined || command.action === 'talk', 'Only a conversation can have a topic'),
  z.object({ type: z.literal('gift-money'), personId: z.string(), amount: z.bigint().positive() }),
  z.object({ type: z.literal('ask-date'), personId: z.string(), activity: z.enum(dateActivityIds).optional() }),
  z.object({ type: z.literal('propose'), personId: z.string(), ringId: z.string().optional() }),
  z.object({ type: z.literal('marry'), personId: z.string(), budget: z.bigint().nonnegative() }),
  z.object({ type: z.literal('breakup'), personId: z.string() }),
  z.object({ type: z.literal('move-out') }),
  z.object({ type: z.literal('ask-to-move-in'), personId: z.string() }),
  z.object({ type: z.literal('relationship-preferences'), attractedTo: z.array(z.enum(genders)).min(1).max(3), wantsChildren: z.boolean() }),
]);
export type SocialCommand = z.infer<typeof socialCommandSchema>;
export function relationLabel(world: World, relation: Relationship, personId = world.activePersonId): string {
  const outward = relation.from === personId;
  const person = world.people[outward ? relation.to : relation.from];
  if (relation.roles.includes('guardian') || relation.parentType === 'guardian') return outward ? 'In your care' : 'Guardian';
  if (relation.roles.includes('parent')) {
    const role = outward ? person.gender === 'female' ? 'Daughter' : person.gender === 'male' ? 'Son' : 'Child'
      : person.gender === 'female' ? 'Mother' : person.gender === 'male' ? 'Father' : 'Parent';
    return relation.parentType === 'adoptive' ? (outward ? 'Adopted ' : 'Adoptive ') + (role === 'Child' || role === 'Parent' ? role.toLowerCase() : role) : role;
  }
  if (relation.roles.includes('sibling')) return person.gender === 'female' ? 'Sister' : person.gender === 'male' ? 'Brother' : 'Sibling';
  if (relation.romance === 'married') return 'Spouse'; if (relation.romance === 'engaged') return 'Engaged'; if (relation.romance === 'dating' || relation.romance === 'teen-dating') return 'Partner'; if (relation.romance === 'ex') return 'Former partner'; if (relation.romance === 'widowed') return 'Late partner';
  if (currentBestFriendship(world, personId)?.relationshipId === relation.id) return 'Best friend';
  return relation.kind[0].toUpperCase() + relation.kind.slice(1);
}
function syncKind(relation: Relationship) {
  if (relation.roles.includes('parent')) relation.kind = 'parent'; else if (relation.roles.includes('guardian')) relation.kind = 'guardian'; else if (relation.roles.includes('sibling')) relation.kind = 'sibling'; else if (relation.romance === 'married') relation.kind = 'spouse'; else if (activeRomance(relation)) relation.kind = 'partner'; else relation.kind = relation.roles.includes('friend') ? 'friend' : relation.roles.includes('coworker') ? 'coworker' : relation.roles.includes('classmate') ? 'classmate' : relation.roles.includes('teacher') ? 'teacher' : 'acquaintance';
}
/** A friendship can grow from an existing classmate or coworker role. */
export function refreshFriendship(relation: Relationship) {
  if (relation.strength >= 60 && !relation.roles.includes('friend') && relation.roles.some(role => role === 'acquaintance' || role === 'classmate' || role === 'coworker')) { relation.roles.push('friend'); syncKind(relation); }
}
export const weddingBudgets = (world: World, person = active(world)) => [100n, 20n, 4n].map((denominator, index) => ({ id: ['simple', 'small', 'lavish'][index], label: ['Simple ceremony', 'Small celebration', 'Lavish wedding'][index], amount: roundRatio(rules[person.country].baseWage, denominator) }));
/** Completion only: callers establish eligibility, consent and actual payment first. */
export function recordMarriage(world: World, player: Person, target: Person, relation: Relationship, id: string, budget: bigint) {
  relation.romance = 'married'; relation.roles = relation.roles.filter(role => role !== 'partner'); if (!relation.roles.includes('spouse')) relation.roles.push('spouse'); syncKind(relation); relation.memories.push('married:' + world.date.year);
  world.marriages.push({ id, a: player.id, b: target.id, started: { ...world.date }, ended: null, endReason: null, baselineA: netWorth(world, player.id), baselineB: netWorth(world, target.id), excludedA: 0n, excludedB: 0n, ledgerStart: world.ledger.length, weddingCost: { minor: budget, currency: accountFor(world, player).currency } });
  const householdId = ownHousehold(world, player, [target.id]); const household = world.households.find(item => item.id === householdId)!;
  if (!household.homeAssetId) household.homeAssetId = world.assets.find(asset => asset.ownerId === target.id && asset.primaryHome)?.id ?? null;
  const home = world.assets.find(asset => asset.id === household.homeAssetId); if (home) { player.city = home.city; target.city = home.city; } else target.city = player.city;
  royalMarriage(world,player.id,target.id);
}
function counter(world: World, targetId: string, action: string) {
  const key = world.activePersonId + ':social:' + world.date.year + ':' + targetId + ':' + action;
  if (world.actionCounts[key]) throw new IneligibleAction('You already tried this with this person this year');
  world.actionCounts[key] = 1;
}
function statChanges(person: Person, changes: Partial<Stats>): RuntimeEffectRow[] {
  return Object.entries(changes).map(([key, change]) => { const stat = key as keyof Stats; const before = person.stats[stat]; person.stats[stat] = bounded(before + change!); const delta = person.stats[stat] - before; return { id: stat, label: stat[0].toUpperCase() + stat.slice(1), value: (delta >= 0 ? '+' : '') + delta + '%', tone: (stat === 'stress' ? -delta : delta) > 0 ? 'positive' : (stat === 'stress' ? -delta : delta) < 0 ? 'negative' : 'neutral' }; });
}
function bond(relation: Relationship, delta: number): RuntimeEffectRow {
  const before = relation.strength; relation.strength = bounded(before + delta); const actual = relation.strength - before;
  refreshFriendship(relation);
  return { id: 'bond', label: 'Relationship', value: (actual >= 0 ? '+' : '') + actual + '%', tone: actual >= 0 ? 'positive' : 'negative' };
}
export function resolveSocial(world: World, command: SocialCommand) {
  if ('topic' in command && command.topic !== undefined && (command.type !== 'interact' || command.action !== 'talk')) throw new IneligibleAction('Only a conversation can have a topic');
  const player = active(world); const age = ageOn(player, world.date);
  if (command.type === 'meet-people') {
    if (age < (command.purpose === 'dating' ? rules[player.country].adultAge : 6)) throw new IneligibleAction(command.purpose === 'dating' ? 'Dating is available to adults' : 'Meet new people from age six');
    counter(world, command.purpose, 'meet');
    if (command.purpose === 'dating' && command.gender !== 'any' && !player.attractedTo.includes(command.gender)) throw new IneligibleAction('Choose a gender within your dating preferences, or update them in My Life');
    player.stats.energy = bounded(player.stats.energy - 5);
    const people = Array.from({ length: 3 }, () => createContact(world, { age: age < 18 ? age : draw(world, 'npcs', Math.min(125, Math.max(18, age - 8)), Math.min(125, age + 8)), gender: command.gender === 'any' ? command.purpose === 'dating' ? player.attractedTo[draw(world, 'npcs', 0, player.attractedTo.length - 1)] : undefined : command.gender, compatibleWith: command.purpose === 'dating' ? player.gender : undefined, ...physicalLocation(world) }));
    world.pending = { kind: 'decision', id: 'meeting_' + world.revision, templateId: 'meet-' + command.purpose, title: command.purpose === 'dating' ? 'Someone new' : 'A few new faces', body: command.purpose === 'dating' ? 'These people are open to meeting someone with your preferences. An introduction is a beginning, not a promise.' : age < 18 ? 'At a local games afternoon, a few people your age introduce themselves.' : 'A local community evening gives you a reason to talk to someone new.', illustration: command.purpose === 'dating' ? 'rose' : 'conversation', personIds: [player.id, ...people.map(person => person.id)], choices: [...people.map(person => ({ id: person.id, label: fullName(person) + ' · Age ' + ageOn(person, world.date), effects: [{ kind: 'connect-person' as const, personId: person.id }], resultTitle: 'Introductions made', resultBody: 'You exchanged introductions with ' + person.firstName + '. You can get to know them from Relationships.', journal: 'I met ' + fullName(person) + '.' })), { id: 'later', label: 'Maybe another time', effects: [], resultTitle: 'No introduction today', resultBody: 'You decided to leave it for another time.', journal: 'I went along to an event without making a new connection.' }] };
    return;
  }
  if (command.type === 'relationship-preferences') {
    if (age < rules[player.country].adultAge) throw new IneligibleAction('Family planning is available to adults');
    player.attractedTo = [...new Set(command.attractedTo)]; player.wantsChildren = command.wantsChildren;
    result(world, 'Preferences updated', 'Your choices are saved for future dating and family decisions.', 'hearts'); return;
  }
  if (command.type === 'move-out') {
    if(serviceAway(world)||activeTrip(world))throw new IneligibleAction('Return from your trip or assignment before moving home');
    if (age < rules[player.country].adultAge) throw new IneligibleAction('Independent housing is available to adults');
    const household = world.households.find(item => item.id === player.householdId);
    if (household?.members.filter(id => !world.people[id].died).length === 1) throw new IneligibleAction('You already live independently');
    ownHousehold(world, player); world.actionCounts[player.id + ':independent-home'] = 1; fact(world, 'I moved into an independent household.', 'family'); result(world, 'A place of your own', 'You moved into your own household. The bills are yours now.', 'property'); return;
  }
  const target = world.people[command.personId];
  const relation = target ? relationFor(world, player.id, target.id) : undefined;
  if (!target || target.died || !relation) throw new IneligibleAction('Choose a living person you know');
  const reference=personReference(target.firstName,relationLabel(world,relation)),who=sentenceSubject(reference);
  const money=(minor:bigint,currency=accountFor(world).currency)=>formatMoney({minor,currency});
  if (command.type === 'ask-to-move-in') {
    if(serviceAway(world)||serviceAway(world,target.id)||activeTrip(world)||activeTrip(world,target.id))throw new IneligibleAction('Return from your trip or assignment before moving home');
    if (isConfined(world, target)) throw new IneligibleAction('They are currently in custody');
    if (age < 18 || target.country !== player.country || !relation.roles.some(role => role === 'parent' || role === 'guardian')) throw new IneligibleAction('Choose a living parent or guardian in your country');
    if (!target.householdId || target.householdId === player.householdId) throw new IneligibleAction('You already share this household');
    counter(world, target.id, 'move-in');
    if (relation.strength < 50 || draw(world, 'outcomes', 1, 100) > relation.strength) { result(world, 'They need their space', who + ' declined your request to move in. Your housing stays as it is.', 'person-action:move-in'); return; }
    moveHousehold(world, [player.id], target.householdId); player.city = target.city;
    world.actionCounts[player.id + ':independent-home'] = 1;
    fact(world, 'I moved in with ' + target.firstName + '.', 'family'); result(world, 'You moved in', 'You moved in with '+reference+'. You now share living costs.', 'person-action:move-in'); return;
  }
  if (command.type === 'interact') {
    if(command.action==='spend-time'&&!samePhysicalPlace(world,player.id,target.id))throw new IneligibleAction('Meet in the same place for in-person time');
    if (command.action === 'spend-time' && (isConfined(world, player) || isConfined(world, target)) && (player.country !== target.country || player.city !== target.city || isConfined(world, player) && isConfined(world, target))) throw new IneligibleAction('A visit requires an available person in the same city');
    if (age < 3) throw new IneligibleAction('Personal interactions unlock from age three');
    if (command.action === 'apologise' && !relation.memories.some(memory => memory.startsWith('argument:'))) throw new IneligibleAction('There is no unresolved argument to apologise for');
    if (command.topic !== undefined) {
      const option = conversationTopics(world, target.id).find(row => row.id === command.topic);
      if (!option || option.disabledReason) throw new IneligibleAction(option?.disabledReason ?? 'Choose an available conversation topic');
      const context = conversationContext(world, target.id)!;
      counter(world, target.id, 'talk'); relation.lastInteractionYear = world.date.year;
      const chance = Math.min(90, command.topic === 'feelings' ? 45 + Math.floor(relation.trust / 2) : 70 + Math.floor(relation.trust / 5));
      const open = draw(world, 'outcomes', 1, 100) <= chance;
      const writing = writeConversation({...context,relationshipRole:relationLabel(world,relation)}, command.topic, open ? 'open' : 'reserved');
      const beforeTrust = relation.trust;
      relation.trust = bounded(relation.trust + (open ? command.topic === 'family' || command.topic === 'feelings' ? 3 : 2 : 0));
      const effects: RuntimeEffectRow[] = [bond(relation, open ? command.topic === 'interests' ? 6 : 4 : 1)];
      effects.push({ id: 'trust', label: 'Trust', value: '+' + (relation.trust - beforeTrust) + '%', tone: relation.trust > beforeTrust ? 'positive' : 'neutral' });
      if (open) effects.push(...statChanges(player, command.topic === 'school' ? { smarts: 1, happiness: 1 } : command.topic === 'work' ? { stress: -2 } : command.topic === 'feelings' ? { stress: -3 } : { happiness: command.topic === 'interests' ? 3 : 2 }));
      relation.memories.push('talk:' + world.date.year);
      fact(world, writing.journal, 'relationships'); result(world, writing.title, writing.body, 'person-action:talk', effects); return;
    }
    counter(world, target.id, command.action); relation.lastInteractionYear = world.date.year;
    let body: string, journal: string, delta: number; const effects: RuntimeEffectRow[] = [];
    if (command.action === 'talk') { delta = draw(world, 'outcomes', 3, 6); relation.trust = bounded(relation.trust + 2); body = 'You had a proper chat with '+reference+'. A simple conversation did the job.'; journal = 'I had a proper conversation with ' + target.firstName + '.'; effects.push(...statChanges(player, { happiness: 2 })); }
    else if (command.action === 'compliment') {
      const accepted = draw(world, 'outcomes', 1, 100) <= 70 + Math.floor(relation.trust / 5); delta = accepted ? 5 : -2;
      if (accepted) relation.trust = bounded(relation.trust + 1);
      body = accepted ? who+' appreciated the compliment. Nicely done.' : who+' was not convinced by the compliment. Subtlety remains a work in progress.'; journal = accepted ? 'I told ' + target.firstName + ' something I appreciate about them.' : 'My compliment to ' + target.firstName + ' did not land as intended.';
    } else if (command.action === 'spend-time') {
      if (age >= 18) charge(world, dateBudget(world) / 2n, 'social', 'An afternoon with ' + target.firstName);
      relation.trust = bounded(relation.trust + 3); delta = draw(world, 'outcomes', 6, 10); body = (isConfined(world,player)?who+' spent visiting time with you in custody.':isConfined(world,target)?'During their time in custody, you spent visiting time with '+reference+'.':hospitalized(world,player)?who+' spent time with you in hospital.':hospitalized(world,target)?'During their hospital stay, you spent time with '+reference+'.':'You spent an afternoon with '+reference+'.')+(age>=18?' You spent '+money(dateBudget(world)/2n)+'.':' A good afternoon does not need a price tag.'); journal = isConfined(world, player) || isConfined(world, target) ? 'I shared a prison visit with ' + target.firstName + '.' : 'I made time for ' + target.firstName + '.'; effects.push(...statChanges(player, { happiness: 4, stress: -3, energy: -5 }));
    } else if (command.action === 'argue') {
      delta = -draw(world, 'outcomes', 8, 14); relation.trust = bounded(relation.trust - 5); relation.memories.push('argument:' + world.date.year);
      body = 'You argued with '+reference+'. Neither of you improved the situation.'; journal = 'I argued with ' + target.firstName + ' and left things unsettled.'; effects.push(...statChanges(player, { happiness: -3, stress: 3 }));
    } else {
      const accepted = draw(world, 'outcomes', 1, 100) <= 35 + Math.floor(relation.trust / 2); delta = accepted ? 7 : 1;
      if (accepted) { relation.memories = relation.memories.filter(memory => !memory.startsWith('argument:')); relation.trust = bounded(relation.trust + 4); }
      body = accepted ? who+' accepted your apology. Less excuse, more peace.' : who+' heard your apology but needs more time.'; journal = 'I apologised to ' + target.firstName + '.';
    }
    relation.memories.push(command.action + ':' + world.date.year); effects.unshift(bond(relation, delta)); fact(world, journal, 'relationships'); result(world, command.action === 'argue' ? 'That could have gone better' : command.action === 'apologise' ? 'You said it properly' : 'Time together', body, 'person-action:'+command.action, effects); return;
  }
  if (command.type === 'gift-money') {
    if (age < 8) throw new IneligibleAction('Money gifts unlock from age eight');
    counter(world, target.id, 'gift'); const source = accountFor(world), destination = accountFor(world, target);
    if (source.cash < command.amount) throw new IneligibleAction('Your balance cannot cover the gift');
    const received = source.currency === destination.currency ? command.amount : exchangeQuote(world, command.amount, source.currency, destination.currency).net;
    if (received <= 0n) throw new IneligibleAction('The gift is too small after currency conversion');
    post(world, -command.amount, 0n, 'gift', 'Gift to ' + target.firstName); post(world, received, 0n, 'gift', 'Gift from ' + player.firstName, null, target);
    protectSeparateProperty(world, target.id, { minor: received, currency: destination.currency }, player.id);
    target.stats.happiness = bounded(target.stats.happiness + 3); relation.lastInteractionYear = world.date.year;
    const effect = bond(relation, 5); fact(world, 'I gave ' + target.firstName + ' ' + formatMoney({ minor: received, currency: destination.currency }) + '.', 'relationships'); result(world, 'Gift received', 'You sent '+money(command.amount,source.currency)+' to '+reference+'. '+(source.currency===destination.currency?'No repayment required.':'They received '+money(received,destination.currency)+' after exchange fees.'), 'person-action:give-money', [effect]); return;
  }
  if (command.type === 'breakup') {
    if (relation.romance !== 'dating' && relation.romance !== 'engaged') throw new IneligibleAction(relation.romance === 'married' ? 'A marriage requires a divorce settlement' : 'You are not in a relationship with this person');
    relation.romance = 'ex'; relation.roles = relation.roles.filter(role => role !== 'partner'); if (!relation.roles.length) relation.roles.push('acquaintance'); syncKind(relation); relation.memories.push('breakup:' + world.date.year);
    relation.trust = bounded(relation.trust - 10); target.stats.happiness = bounded(target.stats.happiness - 8);
    fact(world, 'I ended my relationship with ' + target.firstName + '.', 'relationships'); result(world, 'You went separate ways', 'You ended your relationship with '+target.firstName+'. The gifts stay with them.', 'person-action:breakup', [bond(relation, -25), ...statChanges(player, { happiness: -5, stress: 3 })]); return;
  }
  const reason = romanceReason(world, target); if (reason) throw new IneligibleAction(reason);
  if (command.type === 'ask-date') {
    if (command.activity !== undefined) {
      const activity = dateActivities(world, target.id).find(row => row.id === command.activity);
      if (!activity || activity.disabledReason) throw new IneligibleAction(activity?.disabledReason ?? 'Choose an available date activity');
      settleBackground(world, target, world.date.year * 12 + world.date.month - 1);
      counter(world, target.id, 'date');
      const chance = Math.min(95, 20 + Math.round(relation.strength * 0.6 + player.stats.looks * 0.15));
      const accepted = draw(world, 'outcomes', 1, 100) <= chance, outcome = dateActivityOutcome(activity.id, fullName(target), accepted, {minor:activity.cost,currency:activity.currency});
      if (!accepted) { fact(world, outcome.journal, 'relationships'); result(world, outcome.title, outcome.body, 'person-action:ask-date', statChanges(player, { happiness: -2 })); return; }
      if (activity.cost > 0n) charge(world, activity.cost, 'dating', activity.label + ' with ' + fullName(target));
      if (!activeRomance(relation)) relation.romance = 'dating'; if (!relation.roles.includes('partner') && relation.romance !== 'married') relation.roles.push('partner'); syncKind(relation);
      const beforeTrust = relation.trust;
      relation.trust = bounded(relation.trust + 5); relation.lastInteractionYear = world.date.year; relation.memories.push('date:' + world.date.year);
      const trust: RuntimeEffectRow = { id: 'trust', label: 'Trust', value: '+' + (relation.trust - beforeTrust) + '%', tone: relation.trust > beforeTrust ? 'positive' : 'neutral' };
      fact(world, outcome.journal, 'relationships'); result(world, outcome.title, outcome.body, 'person-action:ask-date', [bond(relation, outcome.bond), trust, ...statChanges(player, { happiness: outcome.happiness, energy: outcome.energy })]); return;
    }
    if (hospitalized(world, player) || hospitalized(world, target)) throw new IneligibleAction('Arrange a date after the hospital stay');
    settleBackground(world, target, world.date.year * 12 + world.date.month - 1);
    counter(world, target.id, 'date'); const cost = dateBudget(world); if (accountFor(world).cash < cost) throw new IneligibleAction('Your balance cannot cover the date');
    const chance = Math.min(95, 20 + Math.round(relation.strength * 0.6 + player.stats.looks * 0.15));
    if (draw(world, 'outcomes', 1, 100) > chance) { fact(world, target.firstName + ' declined my invitation to a date.', 'relationships'); result(world, 'Not this time', who+' declined your invitation. No date costs were charged.', 'person-action:ask-date', statChanges(player, { happiness: -2 })); return; }
    charge(world, cost, 'dating', 'Date with ' + target.firstName);
    if (!activeRomance(relation)) relation.romance = 'dating'; if (!relation.roles.includes('partner') && relation.romance !== 'married') relation.roles.push('partner'); syncKind(relation);
    relation.trust = bounded(relation.trust + 5); relation.lastInteractionYear = world.date.year; relation.memories.push('date:' + world.date.year);
    fact(world, 'I went on a date with ' + target.firstName + '.', 'relationships'); result(world, 'You made an evening of it', 'You went on a date with '+reference+'. You spent '+money(cost)+'.', 'person-action:ask-date', [bond(relation, 7), ...statChanges(player, { happiness: 6, energy: -4 })]); return;
  }
  if (command.type === 'propose') {
    if (relation.romance !== 'dating' || relation.strength < 75 || relation.trust < 60) throw new IneligibleAction('Build a committed relationship with at least 75% strength and 60% trust first');
    counter(world, target.id, 'propose');
    let ring = command.ringId ? world.assets.find(asset => asset.id === command.ringId && asset.ownerId === player.id && asset.catalogId === 'engagement-ring') : world.assets.find(asset => asset.ownerId === player.id && asset.catalogId === 'engagement-ring');
    if (command.ringId && !ring) throw new IneligibleAction('Choose an engagement ring you own');
    const boughtRing=!ring;
    if (!ring) { const offer = assetCatalog.find(asset => asset.id === 'engagement-ring')!; resolveAssets(world, { type: 'buy-asset', catalogId: offer.id, financing: 'cash', depositBps: 10000, termMonths: 360, quotedPrice: assetPrice(world, offer) }, false); ring = world.assets.find(asset => asset.ownerId === player.id && asset.catalogId === 'engagement-ring')!; }
    if (draw(world, 'outcomes', 1, 100) > Math.min(95, relation.strength - 10)) { fact(world, target.firstName + ' was not ready to accept my proposal.', 'relationships'); result(world, 'They aren’t ready', target.firstName+' declined your proposal; you are still together. '+(boughtRing?'You keep the ring you bought for '+money(ring.pricePaid,ring.currency)+'.':'You keep your ring.'), 'person-action:propose', statChanges(player, { happiness: -4 })); return; }
    ring.ownerId = target.id; ring.ownershipSource = 'gift'; ring.titleSince = { ...world.date }; ring.provenance.push('Given to ' + fullName(target) + ' by ' + fullName(player) + ' in ' + world.date.year);
    if (!world.accounts.some(account => account.ownerId === target.id && account.currency === ring!.currency)) world.accounts.push({ id: 'account_' + target.id + '_' + ring.currency, ownerId: target.id, currency: ring.currency, cash: 0n, openingCash: 0n, lockedCash: 0n });
    relation.romance = 'engaged'; relation.memories.push('engagement:' + world.date.year); syncKind(relation);
    fact(world, target.firstName + ' accepted my proposal.', 'relationships'); result(world, 'They said yes', 'You are engaged to '+target.firstName+'. '+(boughtRing?'The ring cost '+money(ring.pricePaid,ring.currency)+' and is now theirs.':'The ring is now theirs.'), 'person-action:propose', statChanges(player, { happiness: 10 })); return;
  }
  if (relation.romance !== 'engaged') throw new IneligibleAction('Get engaged before planning the wedding');
  if (command.budget < weddingBudgets(world)[0].amount) throw new IneligibleAction('The budget does not cover the minimum ceremony cost');
  charge(world, command.budget, 'wedding', 'Wedding with ' + target.firstName);
  recordMarriage(world, player, target, relation, 'marriage_' + world.revision, command.budget);
  fact(world, 'I married ' + fullName(target) + '.', 'relationships'); result(world, 'You’re married', 'You married '+target.firstName+' with a '+money(command.budget)+' ceremony. You share a household and keep your own accounts and property.', 'person-action:plan-wedding', statChanges(player, { happiness: 10, respect: 2 }));
}
export function recordFamilyDeath(world: World, personId: string) {
  for (const relation of world.relationships.filter(item => item.from === personId || item.to === personId)) {
    const survivor = otherPerson(world, relation, personId); if (survivor.died) continue;
    const loss = activeRomance(relation) ? 15 : relation.roles.some(role => role === 'parent' || role === 'guardian') ? 10 : relation.strength >= 70 ? 5 : 0;
    survivor.stats.happiness = bounded(survivor.stats.happiness - loss); survivor.stats.stress = bounded(survivor.stats.stress + Math.ceil(loss / 2));
  }
  for (const marriage of world.marriages.filter(item => !item.ended && (item.a === personId || item.b === personId))) { marriage.ended = { ...world.date }; marriage.endReason = 'death'; const relation = relationFor(world, marriage.a, marriage.b); if (relation) relation.romance = 'widowed'; }
  for (const relation of world.relationships.filter(item => activeRomance(item) && (item.from === personId || item.to === personId))) relation.romance = 'widowed';
}
export function relationshipsYear(world: World) {
  const player = active(world);
  for (const relation of world.relationships.filter(item => item.from === player.id || item.to === player.id)) {
    const person = otherPerson(world, relation); if (person.died) continue;
    if (relation.lastInteractionYear < world.date.year - 1) relation.strength = bounded(relation.strength + (person.householdId && person.householdId === player.householdId ? 1 : -2));
  }
}
