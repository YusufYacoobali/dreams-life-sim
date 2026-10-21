import { fullName, type World } from '../model';
import type { BoundChoice, Pending, RuntimeEffectRow } from '../runtime';
import { countries } from '../countries';
import { rules } from '../rules';
import { formatMoney, roundRatio } from '../money';
import { IneligibleAction } from '../errors';
import { nextPending, offerPending } from '../pendingQueue';
import { accountFor, availableCash, bounded, draw, fact, post } from './common';
import { refreshFriendship, relationFor } from './relationships';
import { storyContextReason, storyMonthNumber } from './storyContext';
import { projectRecallResolutionIds, storyThread, type StoryResolution, type StorySchedule, type StoryThread } from './storySchemas';
import { offerProjectRecalls, projectRecallReason, refreshProjectRecalls, resolveProjectRecall } from './projectRecall';

export function scheduleStory(world: World, effect: StorySchedule): RuntimeEffectRow[] {
  const reason = storyContextReason(world, effect); if (reason) throw new IneligibleAction(reason);
  if (world.storyThreads.some(item => item.originEventId === effect.originEventId)) throw new IneligibleAction('This plan is already recorded');
  const person = world.people[effect.personId], arcade = effect.storyKind === 'arcade-invitation', month = storyMonthNumber(world.date), parent = effect.parentId ? world.people[effect.parentId] : null;
  if (arcade && !parent || !arcade && (!effect.teacherId || parent)) throw new IneligibleAction('This plan needs its original participants');
  const trust = parent ? relationFor(world, person.id, parent.id)!.trust : 0, chance = Math.min(95, 50 + Math.floor(trust / 2));
  const roll = parent ? draw(world, 'npcs', 1, 100) : 0, accepted = !parent || roll <= chance;
  const thread: StoryThread = { id: 'story_' + world.revision + '_' + world.storyThreads.length, kind: effect.storyKind, personId: person.id,
    originEventId: effect.originEventId, originTemplateId: effect.originTemplateId, originChoiceId: effect.originChoiceId,
    created: { ...world.date }, dueMonth: month + (arcade ? 1 : 2), expiresMonth: month + (arcade ? 1 : 2), country: person.country, city: person.city,
    communityId: effect.communityId, peerId: effect.peerId, teacherId: effect.teacherId, parentId: effect.parentId,
    status: accepted ? 'scheduled' : 'cancelled', permission: parent ? { personId: parent.id, trustAtRequest: trust, chance, roll, accepted } : null,
    quote: { amount: arcade ? (roundRatio(rules[person.country].baseWage, 2000n) || 1n) : 0n, currency: countries[person.country].currency, payerId: parent?.id ?? null },
    offeredEventId: null, resolution: null, ended: accepted ? null : { ...world.date }, cancellationReason: accepted ? null : 'Permission was declined', paidTransactionId: null,
    ...(effect.rememberProject ? { rememberProject: true as const } : {}) };
  world.storyThreads.push(thread);
  if (!accepted) { fact(world, parent!.firstName + ' did not agree to the arcade party. No visit or payment was booked.', 'school'); return [{ id: 'permission', label: 'Permission', value: parent!.firstName + ' declined', tone: 'neutral' }]; }
  const when = Math.floor(thread.dueMonth / 12) + '-' + String(thread.dueMonth % 12 + 1).padStart(2, '0');
  fact(world, arcade ? parent!.firstName + ' agreed to ' + world.people[thread.peerId].firstName + '’s arcade party in ' + when + '. Nothing has been paid yet.' : 'I promised to finish my section of a project with ' + world.people[thread.peerId].firstName + ' by ' + when + '.', 'school');
  return [{ id: 'plan', label: arcade ? 'Permission' : 'Project deadline', value: arcade ? parent!.firstName + ' agreed · ' + when : when, tone: 'neutral' }, ...(arcade ? [{ id: 'quote', label: parent!.firstName + '’s outing cost', value: formatMoney({ minor: thread.quote.amount, currency: thread.quote.currency }, countries[person.country].locale) + ' if you attend', tone: 'neutral' as const }] : [])];
}

export function storyChoiceReason(world: World, threadId: string, resolution: string): string | undefined {
  const thread = storyThread(world, threadId);
  if (projectRecallResolutionIds.some(id => id === resolution)) return thread ? projectRecallReason(world, thread, resolution) : 'This memory is no longer open';
  if (!thread || thread.status !== 'offered' || thread.personId !== world.activePersonId) return 'This plan is no longer open';
  const valid = thread.kind === 'arcade-invitation' ? ['attend', 'decline'] : ['complete', 'ask-help', 'leave-to-peer'];
  if (!valid.includes(resolution)) return 'Choose an option for this plan';
  if (resolution === 'decline') return;
  const reason = storyContextReason(world, thread, false, thread); if (reason) return reason;
  if (resolution === 'attend') {
    const account = accountFor(world, world.people[thread.parentId!], thread.quote.currency);
    if (availableCash(account) < thread.quote.amount) return world.people[thread.parentId!].firstName + ' cannot cover the quoted outing cost';
  }
}

function callback(world: World, thread: StoryThread): Extract<Pending, { kind: 'decision' }> {
  const peer = world.people[thread.peerId], parent = thread.parentId ? world.people[thread.parentId] : null, teacher = thread.teacherId ? world.people[thread.teacherId] : null;
  const option = (id: NonNullable<StoryThread['resolution']>, label: string, title: string, body: string, journal: string): BoundChoice => ({ id, label, effects: [{ kind: 'resolve-story', threadId: thread.id, resolution: id }], resultTitle: title, resultBody: body, journal });
  const amount = formatMoney({ minor: thread.quote.amount, currency: thread.quote.currency }, countries[thread.country].locale);
  return { kind: 'decision', id: thread.id + '_due', templateId: 'story-' + thread.kind, title: parent ? 'Party day' : 'The project is due',
    body: parent ? peer.firstName + '’s arcade birthday is here. ' + parent.firstName + ' agreed to take you. The quoted outing costs ' + amount + ', paid by ' + parent.firstName + ' only if you go.' : peer.firstName + ' is putting the class project together. ' + teacher!.firstName + ' wants your section today. The blank page has enjoyed two months of peace.',
    illustration: parent ? 'birthday' : 'education', personIds: [thread.personId, thread.peerId, ...(parent ? [parent.id] : []), ...(teacher ? [teacher.id] : [])],
    choices: parent ? [
      option('attend', 'Go with ' + parent.firstName + ' · ' + amount, 'High score, low dignity', 'You and ' + peer.firstName + ' take turns at the machines. ' + parent.firstName + ' pays the quoted outing cost. Nobody wins enough tickets to retire.', 'I went to ' + peer.firstName + '’s arcade birthday with ' + parent.firstName + '.'),
      option('decline', 'Stay home · no charge', 'No arcade receipts', 'You stay home. The outing is not charged, and the invitation does not become a debt.', 'I stayed home instead of going to ' + peer.firstName + '’s arcade birthday.'),
    ] : [
      option('complete', 'Finish your section', 'Your name belongs on it', 'You finish your section and explain it to ' + peer.firstName + '. ' + teacher!.firstName + ' records the work you actually did.', 'I finished my section of the class project with ' + peer.firstName + '.'),
      option('ask-help', 'Ask ' + teacher!.firstName + ' for help', 'Less staring, more writing', teacher!.firstName + ' helps you break the work into smaller steps. You complete a shorter section yourself.', 'I asked ' + teacher!.firstName + ' for help and completed a shorter project section.'),
      option('leave-to-peer', 'Leave your section blank', 'A very short contribution', peer.firstName + ' sees your empty section. ' + teacher!.firstName + ' records the missing work. Your name is still extremely visible.', 'I left my promised project section blank. ' + peer.firstName + ' noticed.'),
    ] };
}

/** Called by simulation/commands, never by a screen, import or render. */
export function refreshStoryThreads(world: World) {
  refreshProjectRecalls(world);
  for (const thread of world.storyThreads) {
    if (!['scheduled', 'offered'].includes(thread.status)) continue;
    const month = storyMonthNumber(world.date), reason = storyContextReason(world, thread, thread.status === 'scheduled' && month < thread.dueMonth, thread) ?? (month > thread.expiresMonth ? 'The date has passed' : undefined);
    if (!reason) continue;
    thread.status = 'cancelled'; thread.ended = { ...world.date }; thread.cancellationReason = reason;
    fact(world, (thread.kind === 'arcade-invitation' ? 'My arcade outing' : 'My class project plan') + ' was cancelled: ' + reason + '.', 'school');
    if (thread.offeredEventId) {
      world.deferred = world.deferred.filter(item => item.event.id !== thread.offeredEventId);
      if (world.pending?.id === thread.offeredEventId) { world.pending = null; world.pendingPriority = 0; nextPending(world); }
    }
  }
}
export function storyMonth(world: World) {
  refreshStoryThreads(world);
  for (const thread of world.storyThreads) if (thread.status === 'scheduled' && storyMonthNumber(world.date) === thread.dueMonth) {
    const event = callback(world, thread); thread.status = 'offered'; thread.offeredEventId = event.id; offerPending(world, event, 25);
  }
  offerProjectRecalls(world);
}

export function resolveStory(world: World, threadId: string, resolution: StoryResolution): RuntimeEffectRow[] {
  const reason = storyChoiceReason(world, threadId, resolution); if (reason) throw new IneligibleAction(reason);
  if (projectRecallResolutionIds.some(id => id === resolution)) return resolveProjectRecall(world, storyThread(world, threadId)!, resolution);
  const thread = storyThread(world, threadId)!, person = world.people[thread.personId], rows: RuntimeEffectRow[] = [];
  const delta = (label: string, before: number, after: number) => rows.push({ id: 'story_' + rows.length, label, value: (after >= before ? '+' : '') + (after - before) + '%', tone: after > before ? 'positive' : after < before ? 'negative' : 'neutral' });
  const stat = (key: 'energy' | 'happiness', amount: number) => { const before = person.stats[key]; person.stats[key] = bounded(before + amount); delta(key === 'energy' ? 'Energy' : 'Happiness', before, person.stats[key]); };
  const bond = (id: string, amount: number, trust = 0) => { const edge = relationFor(world, person.id, id)!; const before = edge.strength; edge.strength = bounded(before + amount); refreshFriendship(edge); delta(world.people[id].firstName + ' · relationship', before, edge.strength); if (trust) { const old = edge.trust; edge.trust = bounded(old + trust); delta(world.people[id].firstName + ' · trust', old, edge.trust); } };
  if (resolution === 'attend') {
    const parent = world.people[thread.parentId!]; post(world, -thread.quote.amount, 0n, 'story-outing', 'Arcade birthday outing with ' + fullName(world.people[thread.peerId]), null, parent, thread.quote.currency); thread.paidTransactionId = world.ledger[world.ledger.length - 1].id;
    rows.push({ id: 'payment', label: parent.firstName + ' paid', value: formatMoney({ minor: thread.quote.amount, currency: thread.quote.currency }, countries[thread.country].locale), tone: 'neutral' });
    stat('happiness', 5); stat('energy', -4); bond(thread.peerId, 5); bond(parent.id, 2);
  } else if (resolution !== 'decline') {
    const before = person.education.grades; person.education.grades = bounded(before + (resolution === 'complete' ? 3 : resolution === 'ask-help' ? 1 : -2)); delta('Grades', before, person.education.grades);
    stat('energy', resolution === 'complete' ? -5 : resolution === 'ask-help' ? -3 : 1); bond(thread.peerId, resolution === 'leave-to-peer' ? -6 : resolution === 'complete' ? 4 : 2); bond(thread.teacherId!, resolution === 'leave-to-peer' ? -2 : 2, resolution === 'leave-to-peer' ? -4 : 2);
  } else rows.push({ id: 'payment', label: 'Outing cost', value: 'No charge', tone: 'neutral' });
  thread.status = 'resolved'; thread.resolution = resolution as NonNullable<StoryThread['resolution']>; thread.ended = { ...world.date };
  if (thread.rememberProject && thread.kind === 'project-promise') {
    const dueMonth = storyMonthNumber(world.date) + 24;
    thread.projectRecall = { dueMonth, expiresMonth: dueMonth + 2, status: 'scheduled', offeredEventId: null, offered: null, resolution: null, ended: null, cancellationReason: null };
  }
  return rows;
}
