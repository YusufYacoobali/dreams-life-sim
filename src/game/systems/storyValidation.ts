import { indexLedger } from '../ledgerIndex';
import type { World } from '../model';
const compareDates = (a: World['date'], b: World['date']) => (a.year - b.year) || (a.month - b.month) || (a.day - b.day);
import { countries } from '../countries';
import { storyContextReason, storyMonthNumber } from './storyContext';
import { projectRecallResolutionIds } from './storySchemas';
import { storyPairKey, validateProjectRecall } from './projectRecallValidation';
import type { Pending } from '../runtime';

/** Save/load validates records without creating plans, rolling consent or advancing dates. */
export function validateStoryThreads(world: World, ledger = indexLedger(world.ledger)) {
  const ids = new Set<string>(), origins = new Set<string>(), payments = new Set<string>();
  const queued = [...(world.pending ? [world.pending] : []), ...world.deferred.map(item => item.event)];
  const threads = new Map(world.storyThreads.map(thread => [thread.id, thread]));
  const recallQueued = new Map<string, Pending[]>(), recallRelations = new Set<string>();
  const recallJournal = new Map<string, World['journal'][number]>();
  if (world.storyThreads.some(thread => thread.projectRecall)) {
    const pairs = new Set<string>(), choiceIds = new Set<string>();
    for (const thread of world.storyThreads) if (thread.projectRecall) { pairs.add(storyPairKey(thread.personId, thread.peerId)); choiceIds.add(thread.id + '_project_recall_choice'); }
    for (const event of queued) { const matches = recallQueued.get(event.id) ?? []; matches.push(event); recallQueued.set(event.id, matches); }
    for (const edge of world.relationships) { const pair = storyPairKey(edge.from, edge.to); if (pairs.has(pair)) recallRelations.add(pair); if (recallRelations.size === pairs.size) break; }
    for (const entry of world.journal) { if (choiceIds.has(entry.id)) recallJournal.set(entry.id, entry); if (recallJournal.size === choiceIds.size) break; }
  }
  for (const thread of world.storyThreads) {
    const arcade = thread.kind === 'arcade-invitation', school = world.schoolCommunities.find(item => item.id === thread.communityId), origin = arcade ? 'school-arcade-invitation' : 'school-project-promise';
    const participants = [thread.personId, thread.peerId, ...(thread.parentId ? [thread.parentId] : []), ...(thread.teacherId ? [thread.teacherId] : [])];
    if (ids.has(thread.id) || origins.has(thread.originEventId) || participants.some(id => !world.people[id]) || new Set(participants).size !== participants.length ||
      !school || school.personId !== thread.personId || !school.classmateIds.includes(thread.peerId) || school.country !== thread.country || school.city !== thread.city ||
      compareDates(school.started, thread.created) > 0 || school.ended && compareDates(school.ended, thread.created) < 0 || compareDates(thread.created, world.date) > 0 ||
      thread.originTemplateId !== origin || thread.originChoiceId !== (arcade ? 'ask' : 'promise') || thread.originEventId !== 'event_' + thread.created.year + '_' + origin ||
      thread.dueMonth !== storyMonthNumber(thread.created) + (arcade ? 1 : 2) || thread.expiresMonth !== thread.dueMonth || thread.quote.currency !== countries[thread.country].currency) throw new Error('Invalid story origin or participants');
    ids.add(thread.id); origins.add(thread.originEventId);
    validateProjectRecall(world, thread, recallQueued, recallRelations, recallJournal);
    if (arcade) {
      const permission = thread.permission;
      if (!thread.parentId || thread.teacherId || !world.relationships.some(edge => edge.from === thread.parentId && edge.to === thread.personId && edge.kind === 'parent') ||
        !permission || permission.personId !== thread.parentId || permission.chance !== Math.min(95, 50 + Math.floor(permission.trustAtRequest / 2)) || permission.accepted !== (permission.roll <= permission.chance) ||
        thread.quote.payerId !== thread.parentId || thread.quote.amount <= 0n || !world.accounts.some(item => item.ownerId === thread.parentId && item.currency === thread.quote.currency) ||
        !permission.accepted && (thread.status !== 'cancelled' || thread.cancellationReason !== 'Permission was declined' || !thread.ended || compareDates(thread.ended, thread.created) !== 0)) throw new Error('Invalid saved story permission or quote');
    } else if (thread.parentId || thread.permission || !thread.teacherId || !school.teacherIds.includes(thread.teacherId) || thread.quote.payerId || thread.quote.amount !== 0n) throw new Error('Invalid school project participants or quote');
    if (thread.ended && (compareDates(thread.ended, thread.created) < 0 || compareDates(thread.ended, world.date) > 0)) throw new Error('Invalid story end date');
    const matches = queued.filter(item => item.id === thread.offeredEventId);
    if (thread.status === 'scheduled' && (thread.ended || thread.offeredEventId || thread.resolution || thread.cancellationReason || thread.paidTransactionId || storyMonthNumber(world.date) > thread.dueMonth || storyContextReason(world, thread, true, thread))) throw new Error('Invalid scheduled story');
    if (thread.status === 'offered') {
      const event = matches[0], resolutions = arcade ? ['attend', 'decline'] : ['complete', 'ask-help', 'leave-to-peer'];
      if (thread.ended || thread.resolution || thread.cancellationReason || thread.paidTransactionId || storyMonthNumber(world.date) !== thread.dueMonth || storyContextReason(world, thread, false, thread) ||
        thread.offeredEventId !== thread.id + '_due' || matches.length !== 1 || event?.kind !== 'decision' || event.templateId !== 'story-' + thread.kind || event.personIds.length !== participants.length || participants.some(id => !event.personIds.includes(id)) ||
        event.choices.length !== resolutions.length || resolutions.some(id => !event.choices.some(choice => choice.id === id)) || event.choices.some(choice => choice.effects.length !== 1 || choice.effects[0].kind !== 'resolve-story' || choice.effects[0].threadId !== thread.id || choice.effects[0].resolution !== choice.id)) throw new Error('Invalid offered story decision');
    }
    if (thread.status === 'resolved') {
      if (!thread.ended || storyMonthNumber(thread.ended) !== thread.dueMonth || thread.cancellationReason || !thread.resolution || matches.length || thread.offeredEventId !== thread.id + '_due' ||
        !(arcade ? ['attend', 'decline'] : ['complete', 'ask-help', 'leave-to-peer']).includes(thread.resolution) || (thread.resolution === 'attend') !== !!thread.paidTransactionId) throw new Error('Invalid resolved story');
    }
    if (thread.status === 'cancelled' && (!thread.ended || !thread.cancellationReason || thread.resolution || thread.paidTransactionId || matches.length)) throw new Error('Invalid cancelled story');
    if (thread.paidTransactionId) {
      const payment = ledger.transactions.get(thread.paidTransactionId);
      if (payments.has(thread.paidTransactionId) || !payment || payment.personId !== thread.parentId || payment.currency !== thread.quote.currency || payment.cashDelta !== -thread.quote.amount || payment.debtDelta !== 0n || payment.category !== 'story-outing' || !thread.ended || payment.year !== thread.ended.year || payment.month !== thread.ended.month) throw new Error('Invalid story outing payment');
      payments.add(thread.paidTransactionId);
    }
  }
  if (ledger.categories('story-outing').some(item => !payments.has(item.id))) throw new Error('Unrecorded story outing payment');
  for (const event of queued) if (event.kind === 'decision') for (const choice of event.choices) for (const effect of choice.effects) {
    if (effect.kind === 'resolve-story') {
      const thread = threads.get(effect.threadId), recall = projectRecallResolutionIds.some(id => id === effect.resolution);
      if (!thread || (recall ? thread.projectRecall?.status !== 'offered' || thread.projectRecall.offeredEventId !== event.id : thread.status !== 'offered' || thread.offeredEventId !== event.id)) throw new Error('Invalid bound story resolution');
    }
    if (effect.kind === 'schedule-story' && (effect.personId !== world.activePersonId || effect.originEventId !== event.id || effect.originTemplateId !== event.templateId || effect.originChoiceId !== choice.id ||
      effect.originTemplateId !== (effect.storyKind === 'arcade-invitation' ? 'school-arcade-invitation' : 'school-project-promise') || effect.originChoiceId !== (effect.storyKind === 'arcade-invitation' ? 'ask' : 'promise') ||
      !world.schoolCommunities.some(item => item.id === effect.communityId && item.personId === effect.personId && item.classmateIds.includes(effect.peerId)) ||
      [effect.personId, effect.peerId, effect.parentId, effect.teacherId].some(id => id && !event.personIds.includes(id)) ||
      effect.storyKind === 'arcade-invitation' && (!effect.parentId || effect.teacherId || effect.rememberProject) || effect.storyKind === 'project-promise' && (!effect.teacherId || effect.parentId))) throw new Error('Invalid bound story origin');
  }
}
