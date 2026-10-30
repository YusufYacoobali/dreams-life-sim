import type { World } from '../model';
import type { RuntimeEffectRow } from '../runtime';
import { ageOn, fullName } from '../personHelpers';
import { IneligibleAction } from '../errors';
import { countries } from '../countries';
import { rules } from '../rules';
import { formatMoney } from '../money';
import { offerPending } from '../pendingQueue';
import { prisonStories } from '../content/prisonStories';
import { active, accountFor, availableCash, bounded, draw, fact, post, result } from './common';
import { activeSentence, isConfined } from './legalSchemas';
import { prisonContacts, recordPrisonOffence } from './legal';
import { connectPerson } from './relationshipContacts';
import { relationFor } from './relationshipQueries';
import { hospitalized } from './healthSchemas';
import { samePhysicalPlace } from './travelSchemas';
import { serviceAway } from './serviceSchemas';
import { prisonSecurity } from './prisonSecurity';
import type { PrisonCommand, PrisonLife, PrisonStoryEffect } from './prisonSchemas';
export { prisonSecurity } from './prisonSecurity';

const row = (id: string, label: string, value: string, tone: RuntimeEffectRow['tone'] = 'neutral'): RuntimeEffectRow => ({ id, label, value, tone });
export const prisonLife = (world: World, sentence = activeSentence(world)) => sentence && (world.prisonLives ?? []).find(item => item.sentenceId === sentence.id);
export const prisonGroup = (world: World, sentence = activeSentence(world)) => sentence && world.gangs.find(item => item.personId === sentence.personId && item.kind === 'prison' && item.sentenceId === sentence.id && !item.left);
function ensureLife(world: World): PrisonLife {
  const sentence = activeSentence(world);
  if (!sentence) throw new IneligibleAction('An active prison sentence is required');
  world.prisonLives ??= [];
  let life = prisonLife(world, sentence);
  if (!life) {
    if (world.prisonLives.length >= 128) throw new IneligibleAction('This life has reached its prison-history limit');
    life = { id: 'prisonlife_' + sentence.id, personId: sentence.personId, sentenceId: sentence.id, standing: 35, influence: 20, loyalty: 40, contacts: [], interactions: [], familyContacts: [], scenes: [], seenStoryIds: [], lastStoryYear: -1 };
    world.prisonLives.push(life);
  }
  return life;
}
function savedContact(life: PrisonLife, personId: string) {
  let contact = life.contacts.find(item => item.personId === personId);
  if (!contact) {
    if (life.contacts.length >= 12) throw new IneligibleAction('You already have twelve recorded unit contacts');
    contact = { personId, favours: 0, protection: 'none', rivalry: false, reported: false, memories: [] };
    life.contacts.push(contact);
  }
  return contact;
}
function remember(contact: PrisonLife['contacts'][number], text: string) { contact.memories.push(text); if (contact.memories.length > 16) contact.memories.shift(); }
function once(world: World, family: string, maximum = 1) {
  const key = world.activePersonId + ':prison-v2:' + world.date.year + ':' + family;
  if ((world.actionCounts[key] ?? 0) >= maximum) throw new IneligibleAction('You have already tried this this year');
  world.actionCounts[key] = (world.actionCounts[key] ?? 0) + 1;
}
export function prisonActionReason(world: World, personId: string, action: Extract<PrisonCommand, { type: 'prison-action' }>['action'], unitContacts = prisonContacts(world)): string | undefined {
  const actor = active(world), sentence = activeSentence(world), target = world.people[personId], life = prisonLife(world), contact = life?.contacts.find(item => item.personId === personId), relation = relationFor(world, actor.id, personId);
  if (!sentence || !target || target.died || !unitContacts.some(item => item.id === personId)) return 'Choose a living person in your current unit';
  if (hospitalized(world, actor) || hospitalized(world, target)) return 'Wait until both people have recovered';
  if (world.actionCounts[actor.id + ':prison-v2:' + world.date.year + ':inmate:' + personId]) return 'Already interacted with this inmate this year';
  if ((life?.interactions.filter(item => item.date.year === world.date.year).length ?? 0) >= 4) return 'Four meaningful unit interactions per year';
  if (action === 'befriend' && (relation?.trust ?? 0) < 35) return 'Build at least 35% trust before asking for friendship';
  if (['apologise', 'repair'].includes(action) && !contact?.rivalry && (relation?.trust ?? 100) >= 55 && (relation?.strength ?? 100) >= 55) return 'There is no recorded conflict to repair';
  if (action === 'offer-protection' && (life?.standing ?? 35) < 50) return 'Build at least 50% prison standing';
  if (action === 'ask-protection' && (target.stats.fitness < 45 || (relation?.trust ?? 0) < 35)) return 'Ask a stronger inmate who already trusts you';
  if (action === 'exchange-favours' && (relation?.trust ?? 0) < 45) return 'Build at least 45% trust before exchanging favours';
  if (action === 'report' && !contact?.rivalry && !contact?.memories.some(item => item.startsWith('threat:'))) return 'You have no recorded intimidation or rivalry to report';
  if (action === 'challenge' && !contact?.rivalry) return 'Choose an established rival';
  if (action === 'intimidate' && actor.stats.fitness < 35) return 'Build at least 35% fitness';
}

function inmateAction(world: World, command: Extract<PrisonCommand, { type: 'prison-action' }>) {
  const reason = prisonActionReason(world, command.personId, command.action); if (reason) throw new IneligibleAction(reason);
  const life = ensureLife(world), actor = active(world), sentence = activeSentence(world)!, target = world.people[command.personId];
  once(world, 'inmate:' + target.id); connectPerson(world, target.id);
  const relation = relationFor(world, actor.id, target.id)!, contact = savedContact(life, target.id), action = command.action;
  const forgiving = target.traits.includes('kind') ? 15 : target.traits.includes('impulsive') ? -10 : 0;
  const roll = draw(world, 'outcomes', 1, 100), chance = Math.max(10, Math.min(90, Math.round((relation.trust + relation.strength) / 2 + forgiving + (sentence.behavior - 50) / 5 - (contact.rivalry ? 12 : 0))));
  let accepted = roll <= chance, body = '', discipline = 0;
  const change = (bond: number, trust: number) => { relation.strength = bounded(relation.strength + bond); relation.trust = bounded(relation.trust + trust); };
  if (action === 'talk') { accepted = true; change(4, 4); actor.stats.stress = bounded(actor.stats.stress - 3); body = target.traits.includes('reserved') ? target.firstName + ' says little, but stays for the conversation. You leave the silence alone.' : target.firstName + ' talks about an ordinary day outside. For a few minutes, the conversation is bigger than the unit.'; }
  else if (action === 'befriend') { change(accepted ? 9 : -2, accepted ? 7 : -2); if (accepted) { if (!relation.roles.includes('friend')) relation.roles.push('friend'); if (relation.kind === 'acquaintance') relation.kind = 'friend'; } body = accepted ? target.firstName + ' chooses your company. The friendship can survive the gate.' : target.firstName + ' keeps the conversation polite and the distance intact. Friendship requires two volunteers.'; }
  else if (action === 'insult') { accepted = false; change(-10, -9); contact.rivalry = true; life.standing = bounded(life.standing + 2); body = 'Your insult finds its target. ' + target.firstName + ' remembers it long after the audience loses interest.'; }
  else if (action === 'intimidate') { accepted = roll <= Math.max(10, Math.min(85, actor.stats.fitness - target.stats.fitness + life.standing)); change(-8, -12); contact.rivalry = true; remember(contact, 'threat:' + world.date.year); life.standing = bounded(life.standing + (accepted ? 5 : -7)); discipline = accepted ? 5 : 10; body = accepted ? target.firstName + ' steps back. You have won space and lost trust; staff also record the threat.' : target.firstName + ' refuses to move. Your threat earns you a rival and a conduct penalty.'; }
  else if (action === 'apologise' || action === 'repair') { change(accepted ? action === 'repair' ? 10 : 5 : -1, accepted ? 9 : -2); if (accepted) contact.rivalry = false; actor.stats.stress = bounded(actor.stats.stress + (accepted ? -4 : 2)); body = accepted ? target.firstName + ' accepts a smaller, more honest conversation. Neither of you pretends the previous conflict never happened.' : target.firstName + ' hears the apology and declines to start again. You cannot make forgiveness compulsory.'; }
  else if (action === 'offer-protection') { accepted = roll <= Math.min(90, relation.trust + 20); change(accepted ? 6 : -2, accepted ? 5 : -3); if (accepted) { contact.protection = 'offered'; life.standing = bounded(life.standing + 4); } body = accepted ? target.firstName + ' accepts your offer of support in the unit. They stand a little closer when the yard gets tense.' : target.firstName + ' does not want your protection or the obligation that might follow it.'; }
  else if (action === 'ask-protection') { if (accepted) contact.protection = 'received'; change(accepted ? 5 : -1, accepted ? 3 : 0); actor.stats.stress = bounded(actor.stats.stress + (accepted ? -5 : 3)); body = accepted ? target.firstName + ' agrees to stand beside you. You feel less isolated, without becoming untouchable.' : target.firstName + ' declines to make a promise they may not keep.'; }
  else if (action === 'exchange-favours') { change(accepted ? 5 : -2, accepted ? 6 : -3); if (accepted) { contact.favours = Math.min(5, contact.favours + 1); life.influence = bounded(life.influence + 4); } body = accepted ? 'You agree to help each other with small tasks. ' + target.firstName + ' makes it clear that favours run in both directions.' : target.firstName + ' declines to turn this connection into an obligation.'; }
  else if (action === 'report') { accepted = roll <= Math.min(90, sentence.behavior + 20); contact.reported = true; change(-12, -15); contact.rivalry = true; sentence.behavior = bounded(sentence.behavior + (accepted ? 5 : 1)); actor.stats.stress = bounded(actor.stats.stress + 4); remember(contact, 'reported:' + world.date.year); body = accepted ? 'Staff open a conduct review of your complaint about ' + target.firstName + '. Your rival knows you sought help.' : 'Staff hear your complaint but take no further action. ' + target.firstName + ' resents the report.'; }
  else if (action === 'challenge') {
    accepted = roll <= Math.max(10, Math.min(85, actor.stats.fitness - target.stats.fitness + life.standing));
    const protectedBy = life.contacts.find(item => item.protection === 'received' && item.personId !== target.id && prisonContacts(world, sentence).some(person => person.id === item.personId));
    actor.stats.health = Math.max(1, actor.stats.health - (protectedBy ? 3 : accepted ? 5 : 10)); target.stats.health = Math.max(1, target.stats.health - (accepted ? 9 : 3));
    if (protectedBy) { protectedBy.protection = 'none'; remember(protectedBy, 'helped-in-conflict:' + world.date.year); }
    change(-15, -18); discipline = prisonSecurity(world, sentence) === 'high' ? 25 : 20; life.standing = bounded(life.standing + (accepted ? 7 : -8));
    body = 'The challenge becomes a physical fight. Both of you are hurt, staff record your conduct, and an assault charge follows.';
    remember(contact, 'fight:' + world.date.year); recordPrisonOffence(world, actor.id, 'assault', target.id, true);
  }
  if (['insult', 'intimidate', 'report', 'challenge'].includes(action)) {
    if (contact.protection !== 'none') remember(contact, 'protection-ended:' + world.date.year);
    contact.protection = 'none'; contact.favours = 0;
  }
  sentence.behavior = bounded(sentence.behavior - discipline);
  relation.lastInteractionYear = world.date.year; remember(contact, action + ':' + world.date.year + ':' + (accepted ? 'accepted' : 'refused'));
  life.interactions.push({ id: 'prisoninteraction_' + world.revision + '_' + life.interactions.length, personId: target.id, action, date: { ...world.date }, accepted, discipline }); if (life.interactions.length > 96) life.interactions.shift();
  fact(world, 'I ' + ({ talk: 'talked with', befriend: 'asked for friendship with', insult: 'insulted', intimidate: 'intimidated', apologise: 'apologised to', 'offer-protection': 'offered protection to', 'ask-protection': 'asked for protection from', 'exchange-favours': 'discussed exchanging favours with', report: 'reported a conduct concern about', challenge: 'fought', repair: 'tried to repair my relationship with' }[action]) + ' ' + fullName(target) + ' in prison.' + (['befriend', 'apologise', 'repair', 'offer-protection', 'ask-protection', 'exchange-favours'].includes(action) ? accepted ? ' They accepted.' : ' They declined.' : ''), 'prison');
  if (action !== 'challenge') result(world, accepted ? 'A choice inside' : 'Not forgotten', body, 'prison-visit', [row('bond', 'Bond', relation.strength + '%'), row('trust', 'Trust', relation.trust + '%'), row('conduct', 'Conduct', sentence.behavior + '%'), row('standing', 'Prison standing', life.standing + '%')]);
}

export function prisonFamilyReason(world: World, personId: string, action: 'visit' | 'letter' | 'support'): string | undefined {
  const actor = active(world), target = world.people[personId], relation = relationFor(world, actor.id, personId), sentence = activeSentence(world);
  if (!sentence || !target || target.died || personId === actor.id || !relation) return 'Choose a living person you know';
  if (world.actionCounts[actor.id + ':prison-v2:' + world.date.year + ':family:' + personId + ':' + action]) return 'Already requested this contact this year';
  if (action === 'letter') return;
  if (ageOn(target, world.date) < rules[target.country].adultAge) return action === 'visit' ? 'Visits here require an adult contact; children can exchange letters' : 'Only an adult can provide financial support';
  if (isConfined(world, target) || hospitalized(world, target) || serviceAway(world, target.id)) return 'This person is currently unavailable';
  if (action === 'visit' && !samePhysicalPlace(world, actor.id, target.id)) return 'An in-person visit requires a contact currently in your city';
  if (action === 'support' && countries[target.country].currency !== countries[sentence.country].currency) return 'Ask a contact using the same local currency';
  if (action === 'support' && relation.trust < 40) return 'Build at least 40% trust before asking for support';
}
function familyContact(world: World, command: Extract<PrisonCommand, { type: 'prison-family-contact' }>) {
  const reason = prisonFamilyReason(world, command.personId, command.action); if (reason) throw new IneligibleAction(reason);
  const actor = active(world), target = world.people[command.personId], relation = relationFor(world, actor.id, target.id)!, life = ensureLife(world), sentence = activeSentence(world)!;
  once(world, 'family:' + target.id + ':' + command.action);
  const accepted = command.action === 'letter' || draw(world, 'outcomes', 1, 100) <= Math.max(5, Math.min(95, (relation.strength + relation.trust) / 2 + (target.traits.includes('kind') ? 15 : 0)));
  let amount = 0n, body: string, transactionIds: string[] = [];
  if (command.action === 'letter') { relation.strength = bounded(relation.strength + 4); relation.trust = bounded(relation.trust + 3); actor.stats.stress = bounded(actor.stats.stress - 3); body = 'You send ' + target.firstName + ' an honest letter. You describe the days you usually avoid talking about.'; }
  else if (command.action === 'visit') { relation.strength = bounded(relation.strength + (accepted ? 8 : -2)); relation.trust = bounded(relation.trust + (accepted ? 4 : 0)); actor.stats.stress = bounded(actor.stats.stress + (accepted ? -6 : 4)); body = accepted ? target.firstName + ' comes to the visiting room. The conversation has awkward pauses and moments you will remember after the door closes.' : target.firstName + ' declines the visit. You can feel rejected without forcing them through the door.'; }
  else {
    const currency = countries[sentence.country].currency, donor = accountFor(world, target, currency), requested = rules[sentence.country].baseWage / 3000n;
    amount = accepted && availableCash(donor) >= requested ? requested : 0n;
    if (amount > 0n) { post(world, -amount, 0n, 'prison-support-given', 'Prison support for ' + actor.id, null, target, currency); transactionIds.push(world.ledger[world.ledger.length - 1].id); post(world, amount, 0n, 'prison-support-received', 'Prison support from ' + target.id, null, actor, currency); transactionIds.push(world.ledger[world.ledger.length - 1].id); relation.trust = bounded(relation.trust + 4); actor.stats.stress = bounded(actor.stats.stress - 4); }
    body = amount ? target.firstName + ' sends ' + formatMoney({ minor: amount, currency }) + '. They want you to have a little breathing room.' : accepted ? target.firstName + ' wants to help but cannot afford the requested support. No money changes hands.' : target.firstName + ' declines financial support. You will need to manage without their help.';
  }
  relation.lastInteractionYear = world.date.year;
  life.familyContacts.push({ id: 'prisonfamily_' + world.revision + '_' + life.familyContacts.length, personId: target.id, action: command.action, date: { ...world.date }, accepted: command.action === 'support' ? amount > 0n : accepted, amount, transactionIds }); if (life.familyContacts.length > 48) life.familyContacts.shift();
  fact(world, command.action === 'letter' ? 'I sent a letter to ' + fullName(target) + ' from prison.' : command.action === 'visit' ? accepted ? 'I received a prison visit from ' + fullName(target) + '.' : 'I asked ' + fullName(target) + ' to visit; they declined.' : amount ? 'I received financial support from ' + fullName(target) + ' while in prison.' : 'I asked ' + fullName(target) + ' for support; no money changed hands.', 'prison');
  result(world, command.action === 'letter' ? 'Words through the gate' : command.action === 'visit' ? accepted ? 'Across the table' : 'An empty chair' : 'Support requested', body, 'prison-visit', [row('contact', 'Contact', fullName(target)), row('trust', 'Trust', relation.trust + '%')]);
}

function groupAction(world: World, action: Extract<PrisonCommand, { type: 'prison-group' }>['action']) {
  const actor = active(world), sentence = activeSentence(world)!, life = ensureLife(world), group = prisonGroup(world), members = prisonContacts(world, sentence).slice(0, 2);
  if (ageOn(actor, world.date) < rules[actor.country].adultAge) throw new IneligibleAction('Prison groups are available to adults');
  if (action === 'join') {
    if (group) throw new IneligibleAction('You already belong to a prison group');
    if (world.gangs.length >= 128) throw new IneligibleAction('This life has reached its group-history limit');
    if (life.standing < 35 || members.length < 1 || sentence.behavior < 25) throw new IneligibleAction('You need standing, a known unit member and conduct of at least 25%');
    once(world, 'group:join');
    for (const member of members) { connectPerson(world, member.id); savedContact(life, member.id); }
    const gang: World['gangs'][number] = { id: 'prisongang_' + sentence.id + '_' + world.revision, personId: actor.id, name: 'The Yard Circle', kind: 'prison', sentenceId: sentence.id, joined: { ...world.date }, left: null, rank: 0, standing: life.standing, contactIds: members.map(item => item.id), lastIncomeMonth: world.date.year * 12 + world.date.month - 1 };
    world.gangs.push(gang); if (!actor.legal.gangId) actor.legal.gangId = gang.id;
    fact(world, 'I joined the Yard Circle in prison. My outside criminal affiliation remained a separate record.', 'prison');
    result(world, 'The Yard Circle', 'The group accepts you as a new member. You gain familiar faces in the yard and new obligations to go with them.', 'prison', [row('loyalty', 'Loyalty', life.loyalty + '%')]); return;
  }
  if (!group) throw new IneligibleAction('Join a prison group first');
  once(world, 'group:decision');
  let body = '';
  if (action === 'contribute') { life.loyalty = bounded(life.loyalty + 12); life.influence = bounded(life.influence + 7); sentence.behavior = bounded(sentence.behavior - 3); body = 'You back the group in an argument about shared space. Loyalty rises; staff dislike the organised pressure.'; }
  else if (action === 'promote') { if (group.rank >= 2 || life.loyalty < 55 + group.rank * 15 || life.influence < 35 + group.rank * 20) throw new IneligibleAction('Earn more loyalty and influence before seeking promotion'); group.rank++; life.influence = bounded(life.influence + 5); body = group.rank === 1 ? 'The group recognises you as a trusted member. Your responsibilities grow beyond claiming the same chair.' : 'You become a unit organiser. Influence inside these walls remains separate from leadership outside.'; }
  else if (action === 'dispute') { const loyal = life.loyalty >= 55; life.influence = bounded(life.influence + (loyal ? 7 : -8)); life.loyalty = bounded(life.loyalty + (loyal ? 4 : -12)); body = loyal ? 'You mediate a group dispute. Existing trust makes your compromise worth hearing.' : 'You try to settle a dispute without enough trust. Members resent your intervention.'; }
  else if (action === 'leave' || action === 'betray') {
    group.left = { ...world.date }; if (actor.legal.gangId === group.id) actor.legal.gangId = world.gangs.find(item => item.personId === actor.id && item.kind === 'street' && !item.left)?.id ?? null;
    if (sentence.routine.conduct === 'gang') sentence.routine.conduct = 'quiet';
    life.loyalty = bounded(life.loyalty - (action === 'betray' ? 35 : 10));
    for (const id of group.contactIds) { const contact = savedContact(life, id), relation = relationFor(world, actor.id, id); if (action === 'betray' || life.loyalty < 30) { contact.rivalry = true; remember(contact, 'group-departure:' + world.date.year); if (relation) { relation.trust = bounded(relation.trust - 15); relation.strength = bounded(relation.strength - 8); } } }
    actor.stats.stress = bounded(actor.stats.stress + (action === 'betray' ? 12 : 5));
    body = action === 'betray' ? 'You denounce your group to staff. Your membership ends, and the members remember the betrayal.' : 'You leave the group. The history remains, along with any resentment your former members hold.';
  }
  group.standing = life.standing;
  if (!group.left && life.loyalty < 20) { group.left = { ...world.date }; if (actor.legal.gangId === group.id) actor.legal.gangId = world.gangs.find(item => item.personId === actor.id && item.kind === 'street' && !item.left)?.id ?? null; if (sentence.routine.conduct === 'gang') sentence.routine.conduct = 'quiet'; body += ' The group expels you for lost loyalty.'; }
  fact(world, 'I ' + ({ contribute: 'supported the prison group in a dispute', promote: 'earned a prison-group promotion', dispute: 'mediated a prison-group dispute', leave: 'left the prison group', betray: 'denounced the prison group to staff' }[action]) + '.', 'prison');
  result(world, 'Inside loyalties', body, 'prison', [row('loyalty', 'Loyalty', life.loyalty + '%'), row('influence', 'Influence', life.influence + '%'), row('conduct', 'Conduct', sentence.behavior + '%')]);
}
export function resolvePrison(world: World, command: PrisonCommand): void {
  if (!activeSentence(world)) throw new IneligibleAction('An active prison sentence is required');
  if (command.type === 'prison-action') inmateAction(world, command);
  else if (command.type === 'prison-family-contact') familyContact(world, command);
  else groupAction(world, command.action);
}

/** Called after commands as well as calendar simulation; no outside membership is displaced. */
export function refreshPrison(world: World): void {
  if (!world.overhaulVersion) return;
  for (const group of world.gangs) if (group.kind === 'prison' && !group.left && !world.sentences.some(item => item.id === group.sentenceId && item.state === 'active')) {
    group.left = { ...world.date };
    const person = world.people[group.personId];
    if (person?.legal.gangId === group.id) person.legal.gangId = world.gangs.find(item => item.personId === person.id && item.kind === 'street' && !item.left)?.id ?? null;
  }
  for (const life of world.prisonLives ?? []) for (const scene of life.scenes) if (scene.status === 'offered' && ![world.pending, ...world.deferred.map(item => item.event)].some(event => event?.id === scene.id)) {
    scene.status = 'cancelled'; scene.resolved = { ...world.date };
  }
  for (const event of [world.pending, ...world.deferred.map(item => item.event)]) if (event?.kind === 'decision' && event.choices.some(choice => choice.effects.some(effect => effect.kind === 'prison-story'))) {
    // Names already bound in the saved prose remain literal. A deceased person
    // leaves the live participant list; choosing returns factual cancellation.
    event.personIds = event.personIds.filter(id => !!world.people[id] && !world.people[id].died);
  }
}

function storyParticipant(world: World, context: typeof prisonStories[number]['context'], life: PrisonLife) {
  if (context === 'inmate') return prisonContacts(world).find(person => life.contacts.length < 12 || life.contacts.some(item => item.personId === person.id))?.id;
  if (context === 'family') return world.relationships.filter(item => item.from === life.personId || item.to === life.personId).map(item => ({ relation: item, person: world.people[item.from === life.personId ? item.to : item.from] })).find(({ relation, person }) => person && !person.died && !isConfined(world, person) && !hospitalized(world, person) && !serviceAway(world, person.id) && ageOn(person, world.date) >= 18 && (relation.roles.some(role => ['parent', 'sibling', 'guardian', 'friend'].includes(role)) || ['dating', 'engaged', 'married'].includes(relation.romance)))?.person.id;
}
/** At most one annual offer, no extra RNG or state on an ordinary unconfined life. */
export function prisonMonth(world: World): void {
  if (!world.overhaulVersion) return;
  // Prison membership ends on every real release, even when the outside pointer remains active.
  refreshPrison(world);
  const sentence = activeSentence(world), actor = active(world);
  if (!sentence || actor.died || hospitalized(world, actor) || world.pending || world.deferred.length) return;
  const key = actor.id + ':prison-v2:' + world.date.year + ':story-roll';
  if (world.actionCounts[key]) return;
  world.actionCounts[key] = 1;
  if (draw(world, 'events', 1, 100) > 35) return;
  const life = ensureLife(world);
  if (life.lastStoryYear === world.date.year || life.scenes.length >= 40) return;
  const eligible = prisonStories.filter(story => !life.seenStoryIds.includes(story.id)
    && (!['inmate', 'family'].includes(story.context) || !!storyParticipant(world, story.context, life))
    && (story.context !== 'work' || sentence.routine.work) && (story.context !== 'study' || sentence.routine.study)
    && (story.context !== 'high' || prisonSecurity(world, sentence) === 'high')
    && (story.context !== 'late' || sentence.totalMonths - sentence.servedMonths - sentence.creditedMonths <= 12));
  if (!eligible.length) return;
  const definition = eligible[draw(world, 'events', 0, eligible.length - 1)], participantId = storyParticipant(world, definition.context, life) ?? null;
  if (definition.context === 'inmate' && participantId) { connectPerson(world, participantId); savedContact(life, participantId); }
  const name = participantId ? fullName(world.people[participantId]) : '', bind = (text: string) => text.replaceAll('{name}', name);
  const scene: PrisonLife['scenes'][number] = { id: 'prisonscene_' + sentence.id + '_' + world.date.year, templateId: definition.id, ruleVersion: 1, sentenceId: sentence.id, personId: actor.id, participantId, offered: { ...world.date }, resolved: null, title: definition.title, body: bind(definition.body), choices: definition.choices.map(choice => ({ ...choice, body: bind(choice.body), journal: bind(choice.journal), changes: { ...choice.changes } })), status: 'offered', choiceId: null };
  life.scenes.push(scene); life.seenStoryIds.push(definition.id); life.lastStoryYear = world.date.year;
  offerPending(world, { kind: 'decision', id: scene.id, templateId: definition.id, title: scene.title, body: scene.body, illustration: 'prison', personIds: participantId ? [actor.id, participantId] : [actor.id], choices: scene.choices.map(choice => ({ id: choice.id, label: choice.label, effects: [{ kind: 'prison-story', prisonLifeId: life.id, sceneId: scene.id, choiceId: choice.id }], resultTitle: scene.title, resultBody: choice.body, journal: choice.journal })) }, 55);
}
export function resolvePrisonStory(world: World, effect: PrisonStoryEffect): { title: string; body: string; journal: string; effects: RuntimeEffectRow[] } {
  const life = (world.prisonLives ?? []).find(item => item.id === effect.prisonLifeId && item.personId === world.activePersonId), scene = life?.scenes.find(item => item.id === effect.sceneId), choice = scene?.choices.find(item => item.id === effect.choiceId);
  if (!life || !scene || !choice || scene.status !== 'offered') throw new IneligibleAction('This prison decision has already resolved');
  const sentence = activeSentence(world), participant = scene.participantId ? world.people[scene.participantId] : null;
  const definition = prisonStories.find(item => item.id === scene.templateId);
  const stale = !sentence || sentence.id !== scene.sentenceId || participant?.died || scene.participantId && !participant || definition?.context === 'inmate' && !prisonContacts(world, sentence).some(item => item.id === scene.participantId);
  scene.resolved = { ...world.date }; scene.choiceId = choice.id;
  if (stale) { scene.status = 'cancelled'; return { title: 'Circumstances changed', body: 'Too much has changed to continue this conversation. You leave the situation behind.', journal: 'I could not continue a prison situation because its original circumstances had changed.', effects: [row('scene', 'Situation', 'Cancelled')] }; }
  scene.status = 'resolved'; const changes = choice.changes, actor = active(world), relation = participant && relationFor(world, actor.id, participant.id);
  sentence.behavior = bounded(sentence.behavior + changes.conduct); life.standing = bounded(life.standing + changes.standing); actor.stats.stress = bounded(actor.stats.stress + changes.stress); actor.stats.health = Math.max(1, actor.stats.health + changes.health);
  if (relation) { relation.strength = bounded(relation.strength + changes.bond); relation.trust = bounded(relation.trust + changes.trust); relation.lastInteractionYear = world.date.year; }
  return { title: scene.title, body: choice.body, journal: choice.journal, effects: [row('conduct', 'Conduct', sentence.behavior + '%'), row('stress', 'Stress', actor.stats.stress + '%'), ...(relation ? [row('bond', 'Bond', relation.strength + '%'), row('trust', 'Trust', relation.trust + '%')] : []), ...(changes.health ? [row('health', 'Health', actor.stats.health + '%', 'negative')] : [])] };
}
