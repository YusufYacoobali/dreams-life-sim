import type { World } from '../model';
import { nextPending, offerPending } from '../pendingQueue';
import { fullName } from '../personHelpers';
import { cultMonthNumber, type Cult } from './cultSchemas';
import {
  cultBook,
  cultChangeFollowers,
  cultMemory,
  cultRecord,
} from './cultCore';
export function removeCultOffers(
  world: World,
  cult: Cult,
  threadIds?: Set<string>,
) {
  const matches = (event: NonNullable<World['pending']>) =>
    event.kind === 'decision' &&
    event.choices.some((choice) =>
      choice.effects.some(
        (effect) =>
          effect.kind === 'cult-choice' &&
          effect.cultId === cult.id &&
          (!threadIds || threadIds.has(effect.threadId)),
      ),
    );
  if (world.pending && matches(world.pending)) {
    world.pending = null;
    world.pendingPriority = 0;
  }
  world.deferred = world.deferred.filter((row) => !matches(row.event));
  if (!world.pending) nextPending(world);
}
/** Communal property is never part of the founder's estate or a personal sale. */
export function closeCult(
  world: World,
  cult: Cult,
  status: Exclude<Cult['status'], 'active'>,
) {
  if (cult.status !== 'active') return;
  const notifyCollapse =
    status === 'collapsed' &&
    cult.leaderId === world.activePersonId &&
    !world.people[world.activePersonId].died;
  const collapseReason =
    cult.distressMonths >= 4
      ? 'could not cover its bills for four consecutive months'
      : 'lost the loyalty of its followers over six consecutive months';
  const debtPayment = cult.arrears < cult.cash ? cult.arrears : cult.cash;
  if (debtPayment) {
    cultBook(
      world,
      cult,
      -debtPayment,
      'expense',
      'final-bills',
      'Final outstanding headquarters and administration bills',
    );
    cult.arrears -= debtPayment;
  }
  cult.writtenOff += cult.arrears;
  cult.arrears = 0n;
  if (cult.cash)
    cultBook(
      world,
      cult,
      -cult.cash,
      'distribution',
      'community-distribution',
      'Remaining communal funds distributed to the community',
    );
  for (const thread of cult.threads)
    if (thread.status === 'scheduled' || thread.status === 'offered') {
      thread.status = 'cancelled';
      thread.outcome = 'cancelled';
      thread.settledMonth = cultMonthNumber(world);
      thread.offerId = null;
    }
  removeCultOffers(world, cult);
  for (const member of cult.members)
    if (member.status === 'active') {
      member.status = world.people[member.personId].died ? 'deceased' : 'left';
      member.ended = { ...world.date };
      member.resident = false;
      cultMemory(world, cult, member, 'closure', cult.name + ' closed.');
    }
  for (const rival of cult.rivals)
    if (rival.status === 'active' || rival.status === 'allied')
      rival.status = 'closed';
  cult.status = status;
  cult.leaderId = null;
  cult.ended = { ...world.date };
  cult.recovery = null;
  cultRecord(
    world,
    cult,
    (status === 'deceased'
      ? 'My death ended my leadership of '
      : status === 'collapsed'
        ? 'My organisation collapsed: '
        : 'I disbanded ') +
      cult.name +
      '. Communal funds were settled outside my personal estate.',
  );
  if (notifyCollapse) {
    offerPending(
      world,
      {
        kind: 'result',
        id: 'cult_collapse_' + cult.id,
        title: 'Your organisation has collapsed',
        body:
          cult.name +
          ' ' +
          collapseReason +
          '. Your leadership has ended and the inner circle has left. Communal funds were used to settle outstanding bills where possible, unpaid bills were written off and any remaining funds were distributed to the community. Your personal funds were kept separate.',
        illustration: 'cult',
        effects: [],
      },
      80,
    );
    if (world.annual?.stage === 'months') world.annual.pausedForPlanning = true;
  }
}
export function cultPersonDied(world: World, personId: string) {
  for (const cult of world.cults) {
    if (cult.status !== 'active') continue;
    if (cult.leaderId === personId) {
      closeCult(world, cult, 'deceased');
      continue;
    }
    const member = cult.members.find(
      (row) => row.personId === personId && row.status === 'active',
    );
    if (member) {
      member.status = 'deceased';
      member.ended = { ...world.date };
      member.resident = false;
      cultChangeFollowers(cult, -1);
      cultMemory(
        world,
        cult,
        member,
        'death',
        fullName(world.people[personId]) + ' died.',
      );
    }
    const removed = new Set<string>();
    for (const thread of cult.threads)
      if (
        thread.participantIds.includes(personId) &&
        ['scheduled', 'offered'].includes(thread.status)
      ) {
        thread.status = 'cancelled';
        thread.outcome = 'cancelled';
        thread.settledMonth = cultMonthNumber(world);
        thread.offerId = null;
        removed.add(thread.id);
      }
    if (removed.size) removeCultOffers(world, cult, removed);
    for (const rival of cult.rivals)
      if (rival.leaderId === personId) rival.status = 'closed';
  }
}
