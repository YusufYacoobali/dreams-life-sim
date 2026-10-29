import type { World } from '../model';
import type { Pending } from '../runtime';
import { projectRecallContextReason, projectRecallEventId, projectRecallJournal } from './projectRecall';
import { projectRecallResolutionIds, type StoryThread } from './storySchemas';
import { storyMonthNumber } from './storyContext';

const compare = (a: World['date'], b: World['date']) => a.year - b.year || a.month - b.month || a.day - b.day;
export const storyPairKey = (a: string, b: string) => JSON.stringify(a < b ? [a, b] : [b, a]);

/** Shared queue/relationship indexes are built once, only when new recall records exist. */
export function validateProjectRecall(world: World, thread: StoryThread, queued: Map<string, Pending[]>, relationships: Set<string>, journal: Map<string, World['journal'][number]>) {
  const recall = thread.projectRecall;
  if (thread.rememberProject && thread.kind !== 'project-promise' || recall && (!thread.rememberProject || thread.kind !== 'project-promise' || thread.status !== 'resolved') || thread.rememberProject && thread.status === 'resolved' && !recall) throw new Error('Invalid project recall origin');
  if (!recall) return;
  const month = storyMonthNumber(world.date), eventId = projectRecallEventId(thread), matches = queued.get(eventId) ?? [];
  const choice = journal.get(eventId + '_choice');
  if (!thread.ended || recall.dueMonth !== storyMonthNumber(thread.ended) + 24 || recall.expiresMonth !== recall.dueMonth + 2 || !relationships.has(storyPairKey(thread.personId, thread.peerId)) ||
    recall.offered && (storyMonthNumber(recall.offered) < recall.dueMonth || storyMonthNumber(recall.offered) > recall.expiresMonth || compare(recall.offered, world.date) > 0) ||
    recall.ended && (compare(recall.ended, thread.ended) < 0 || compare(recall.ended, world.date) > 0 || recall.offered && compare(recall.ended, recall.offered) < 0) ||
    (recall.offeredEventId !== null && recall.offeredEventId !== eventId) || (!!recall.offeredEventId !== !!recall.offered)) throw new Error('Invalid project recall dates or identity');
  if (recall.status === 'resolved' ? !choice || !recall.resolution || !recall.ended || choice.personId !== thread.personId || compare(choice.date, recall.ended) !== 0 || choice.text !== projectRecallJournal(thread, world.people[thread.peerId].firstName, recall.resolution) : !!choice) throw new Error('Invalid project recall choice record');
  if (recall.status === 'scheduled' && (recall.offeredEventId || recall.offered || recall.ended || recall.resolution || recall.cancellationReason || matches.length || month > recall.expiresMonth || projectRecallContextReason(world, thread, true))) throw new Error('Invalid scheduled project recall');
  if (recall.status === 'offered') {
    const event = matches[0];
    if (!recall.offered || recall.offeredEventId !== eventId || recall.ended || recall.resolution || recall.cancellationReason || month < recall.dueMonth || month > recall.expiresMonth || compare(recall.offered, world.date) !== 0 || projectRecallContextReason(world, thread) ||
      matches.length !== 1 || event?.kind !== 'decision' || event.templateId !== 'story-project-recall' || event.personIds.length !== 2 || !event.personIds.includes(thread.personId) || !event.personIds.includes(thread.peerId) ||
      event.choices.length !== projectRecallResolutionIds.length || projectRecallResolutionIds.some(id => !event.choices.some(choice => choice.id === id)) || event.choices.some(choice => choice.effects.length !== 1 || choice.effects[0].kind !== 'resolve-story' || choice.effects[0].threadId !== thread.id || choice.effects[0].resolution !== choice.id)) throw new Error('Invalid offered project recall');
  }
  if (recall.status === 'resolved' && (!recall.offered || !recall.ended || !recall.resolution || recall.cancellationReason || recall.offeredEventId !== eventId || compare(recall.offered, recall.ended) !== 0 || storyMonthNumber(recall.ended) > recall.expiresMonth || matches.length)) throw new Error('Invalid resolved project recall');
  if (recall.status === 'cancelled' && (!recall.ended || !recall.cancellationReason || recall.resolution || matches.length)) throw new Error('Invalid cancelled project recall');
}
