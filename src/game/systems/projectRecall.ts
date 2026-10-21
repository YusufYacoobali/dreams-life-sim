import type { World } from '../model';
import type { BoundChoice, Pending, RuntimeEffectRow } from '../runtime';
import { IneligibleAction } from '../errors';
import { nextPending, offerPending } from '../pendingQueue';
import { fullName } from '../personHelpers';
import { bounded, fact } from './common';
import { refreshFriendship, relationFor } from './relationships';
import { storyMonthNumber, storyPersonPresent } from './storyContext';
import { projectRecallResolutionIds, type StoryThread } from './storySchemas';

export const projectRecallEventId = (thread: StoryThread) => thread.id + '_project_recall';
const projectPast = (thread: StoryThread, firstPerson = false) => {
  const subject = firstPerson ? 'I' : 'you', possessive = firstPerson ? 'my' : 'your';
  return thread.resolution === 'complete' ? subject + ' finished ' + possessive + ' section' : thread.resolution === 'ask-help' ? subject + ' asked for help and completed a shorter section' : subject + ' left ' + possessive + ' promised section blank';
};
export function projectRecallJournal(thread: StoryThread, peerName: string, resolution: typeof projectRecallResolutionIds[number]) {
  return resolution === 'remember-project' ? 'I talked honestly with ' + peerName + ' about our old project, when ' + projectPast(thread, true) + '.' : resolution === 'dismiss-project' ? 'I dismissed ' + peerName + '’s memory of our old class project.' : 'I left the old project in the past when ' + peerName + ' mentioned it.';
}

/** The former teacher and school need not still be present; the actual two people do. */
export function projectRecallContextReason(world: World, thread: StoryThread, permanentOnly = false): string | undefined {
  const person = world.people[thread.personId], peer = world.people[thread.peerId];
  if (!person || person.died || person.id !== world.activePersonId) return 'This part of the family story has ended';
  if (!peer || peer.died) return 'The classmate from that project is no longer alive';
  if (!permanentOnly && (person.country !== peer.country || person.city !== peer.city || !storyPersonPresent(world, person) || !storyPersonPresent(world, peer))) return 'You and your former project partner cannot meet here now';
}

export function projectRecallReason(world: World, thread: StoryThread, resolution: string): string | undefined {
  const recall = thread.projectRecall, month = storyMonthNumber(world.date);
  if (!recall || recall.status !== 'offered' || !projectRecallResolutionIds.some(id => id === resolution) || month < recall.dueMonth || month > recall.expiresMonth) return 'This memory is no longer open';
  return projectRecallContextReason(world, thread) ?? (!relationFor(world, thread.personId, thread.peerId) ? 'This contact is no longer available' : undefined);
}

function callback(world: World, thread: StoryThread): Extract<Pending, { kind: 'decision' }> {
  const peer = world.people[thread.peerId], completed = thread.resolution === 'complete', helped = thread.resolution === 'ask-help';
  const past = projectPast(thread);
  const option = (id: typeof projectRecallResolutionIds[number], label: string, title: string, body: string): BoundChoice => ({ id, label, effects: [{ kind: 'resolve-story', threadId: thread.id, resolution: id }], resultTitle: title, resultBody: body, journal: projectRecallJournal(thread, peer.firstName, id) });
  return { kind: 'decision', id: projectRecallEventId(thread), templateId: 'story-project-recall', title: 'A promise remembered',
    body: 'Two years after that class project, ' + fullName(peer) + ' brings it up. Back then, ' + past + '.',
    illustration: 'education', personIds: [thread.personId, thread.peerId], choices: [
      option('remember-project', completed ? 'Remember doing your part' : helped ? 'Remember asking for help' : 'Own leaving your section blank', 'An old project, an honest conversation', 'You acknowledge that ' + past + '. ' + peer.firstName + ' hears you out.'),
      option('dismiss-project', 'Tell ' + peer.firstName + ' it does not matter', 'The subject lands badly', 'You brush the memory aside. ' + peer.firstName + ' is less comfortable trusting you with it.'),
      option('pass-project', 'Leave it in the past', 'The past stays put', 'You leave the subject alone. No new promise, payment or school result is created.'),
    ] };
}

/** Only simulation/commands call this. Old threads without a recall remain byte-for-byte unchanged. */
export function refreshProjectRecalls(world: World) {
  const month = storyMonthNumber(world.date);
  for (const thread of world.storyThreads) {
    const recall = thread.projectRecall;
    if (!recall || !['scheduled', 'offered'].includes(recall.status)) continue;
    const reason = projectRecallContextReason(world, thread, recall.status === 'scheduled') ?? (month > recall.expiresMonth ? 'The chance to revisit that project passed without a meeting' : undefined);
    if (!reason) continue;
    recall.status = 'cancelled'; recall.ended = { ...world.date }; recall.cancellationReason = reason;
    fact(world, 'The chance to revisit my old project with ' + world.people[thread.peerId].firstName + ' ended: ' + reason + '.', 'school');
    if (recall.offeredEventId) {
      world.deferred = world.deferred.filter(item => item.event.id !== recall.offeredEventId);
      if (world.pending?.id === recall.offeredEventId) { world.pending = null; world.pendingPriority = 0; nextPending(world); }
    }
  }
}

export function offerProjectRecalls(world: World) {
  const month = storyMonthNumber(world.date);
  for (const thread of world.storyThreads) {
    const recall = thread.projectRecall;
    if (!recall || recall.status !== 'scheduled' || month < recall.dueMonth || month > recall.expiresMonth || projectRecallContextReason(world, thread) || !relationFor(world, thread.personId, thread.peerId)) continue;
    const event = callback(world, thread);
    recall.status = 'offered'; recall.offeredEventId = event.id; recall.offered = { ...world.date }; offerPending(world, event, 25);
  }
}

export function resolveProjectRecall(world: World, thread: StoryThread, resolution: string): RuntimeEffectRow[] {
  const reason = projectRecallReason(world, thread, resolution); if (reason) throw new IneligibleAction(reason);
  const recall = thread.projectRecall!, edge = relationFor(world, thread.personId, thread.peerId)!, rows: RuntimeEffectRow[] = [];
  if (resolution !== 'pass-project') {
    for (const [key, amount, label] of [['strength', resolution === 'remember-project' ? 3 : -3, 'relationship'], ['trust', resolution === 'remember-project' ? 2 : -2, 'trust']] as const) {
      const before = edge[key]; edge[key] = bounded(before + amount);
      rows.push({ id: 'project_recall_' + key, label: world.people[thread.peerId].firstName + ' · ' + label, value: (edge[key] >= before ? '+' : '') + (edge[key] - before) + '%', tone: edge[key] > before ? 'positive' : edge[key] < before ? 'negative' : 'neutral' });
    }
    refreshFriendship(edge);
  } else rows.push({ id: 'project_recall_pass', label: 'Old project', value: 'Left in the past', tone: 'neutral' });
  recall.status = 'resolved'; recall.resolution = resolution as typeof projectRecallResolutionIds[number]; recall.ended = { ...world.date };
  return rows;
}
