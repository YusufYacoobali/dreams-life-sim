import type { World } from '../model';
import { fullName } from '../personHelpers';
import type { cultCeremonyIds } from '../content/cults';
import { cultClaims } from '../content/cultClaims';
import {
  cultMonthNumber,
  type Cult,
  type CultMember,
  type CultThread,
} from './cultSchemas';
import {
  cultChangeFollowers,
  cultMemory,
  cultNextId,
  cultRecord,
} from './cultCore';
import { relationFor } from './relationshipQueries';
import { draw } from './common';
export function compactCultThreads(cult: Cult) {
  while (cult.threads.length > 72) {
    const index = cult.threads.findIndex(
      (row) => row.status === 'resolved' || row.status === 'cancelled',
    );
    if (index < 0) throw Error('Too many outstanding cult threads');
    const [old] = cult.threads.splice(index, 1);
    cult.threadArchive[old.status === 'resolved' ? 'resolved' : 'cancelled']++;
  }
}
export function newCultThread(
  world: World,
  cult: Cult,
  kind: CultThread['kind'],
  templateId: string,
  dueMonth: number,
  participantIds: string[] = [],
) {
  const thread: CultThread = {
    id: cultNextId(cult, 'cult_thread'),
    kind,
    templateId,
    created: { ...world.date },
    dueMonth,
    settledMonth: null,
    fulfilledMonth: null,
    status: 'scheduled',
    offerId: null,
    participantIds: [...new Set(participantIds)].slice(0, 4),
    philosophy: cult.philosophy,
    doctrineId: null,
    ruleId: null,
    approach: 'none',
    roll: draw(world, 'events', 1, 100),
    postponements: 0,
    outcome: null,
    response: null,
    baseline: {
      followers: cult.followers,
      ceremonies: cult.ceremonies,
      sermons: cult.sermons,
      fees: cult.recurringFee,
    },
    followersTaken: 0,
    title: '',
    body: '',
  };
  cult.threads.push(thread);
  compactCultThreads(cult);
  return thread;
}
export function scheduleCultCallback(
  world: World,
  cult: Cult,
  member: CultMember,
  kind: 'rival-return' | 'recruiter-return' | 'accusation-return',
  months: number,
  followersTaken = 0,
) {
  if (
    cult.threads.some(
      (row) =>
        row.kind === 'callback' &&
        row.templateId === kind &&
        row.participantIds.includes(member.personId) &&
        ['scheduled', 'offered'].includes(row.status),
    ) ||
    cult.threads.filter(
      (row) => row.kind === 'callback' && row.status === 'scheduled',
    ).length >= 8
  )
    return;
  const thread = newCultThread(
    world,
    cult,
    'callback',
    kind,
    cultMonthNumber(world) + months,
    [member.personId],
  );
  thread.followersTaken = followersTaken;
  thread.title =
    kind === 'rival-return'
      ? 'An old follower returns'
      : kind === 'recruiter-return'
        ? 'You gave them ideas'
        : 'An accusation returns';
  thread.body =
    fullName(world.people[member.personId]) + ' remembers how this began.';
}
export function cultMemberLeaves(
  world: World,
  cult: Cult,
  member: CultMember,
  status: 'left' | 'expelled',
  allowRival = true,
) {
  if (member.status !== 'active') return;
  member.status = status;
  member.ended = { ...world.date };
  member.resident = false;
  const take = cultChangeFollowers(
    cult,
    -Math.max(
      1,
      Math.min(
        40,
        Math.round(cult.followers * (status === 'expelled' ? 0.12 : 0.06)),
      ),
    ),
  );
  cultMemory(
    world,
    cult,
    member,
    status,
    (status === 'expelled' ? 'I was expelled from ' : 'I left ') +
      cult.name +
      '.',
  );
  if (allowRival && member.ambition + member.grievance - member.loyalty > 25)
    scheduleCultCallback(world, cult, member, 'rival-return', 24, -take);
  cultRecord(
    world,
    cult,
    fullName(world.people[member.personId]) +
      (status === 'expelled' ? ' was expelled from ' : ' left ') +
      cult.name +
      '. ' +
      -take +
      ' followers left.',
  );
}
export function cultRivalArrives(world: World, cult: Cult, thread: CultThread) {
  const member = cult.members.find(
      (row) => row.personId === thread.participantIds[0],
    ),
    person = member && world.people[member.personId];
  if (!person || person.died || cult.rivals.length >= 6) {
    thread.status = 'cancelled';
    thread.outcome = 'cancelled';
    thread.settledMonth = cultMonthNumber(world);
    return;
  }
  const relation = relationFor(world, cult.founderId, person.id);
  if (relation && relation.strength >= 65) {
    thread.status = 'resolved';
    thread.outcome = 'success';
    thread.settledMonth = cultMonthNumber(world);
    cultRecord(
      world,
      cult,
      'My repaired relationship with ' +
        fullName(person) +
        ' stopped our old dispute becoming a rival organisation.',
    );
    return;
  }
  const name = (
    person.firstName +
    '’s ' +
    ['Second Door', 'Unedited Truth', 'Better Tomorrow', 'Open Circle'][
      thread.roll % 4
    ]
  ).slice(0, 60);
  cult.rivals.push({
    id: cultNextId(cult, 'cult_rival'),
    name,
    leaderId: person.id,
    sourceMemberId: person.id,
    started: { ...world.date },
    followers: Math.max(1, thread.followersTaken),
    reputation: Math.min(85, 35 + Math.floor(member!.ambition / 3)),
    relationship: Math.max(0, Math.round(member!.loyalty / 3)),
    status: 'active',
    history: [
      fullName(person) +
        ' left ' +
        cult.name +
        ' with ' +
        thread.followersTaken +
        ' followers before founding this organisation.',
    ],
    lastMonth: cultMonthNumber(world),
  });
  thread.status = 'resolved';
  thread.outcome = 'failure';
  thread.settledMonth = cultMonthNumber(world);
  cultRecord(
    world,
    cult,
    'Two years after leaving us, ' +
      fullName(person) +
      ' founded ' +
      name +
      '. It is the same person, with a different sign outside.',
  );
}

/** Remember a kept promise even if a later gathering goes badly. */
export function recordCultCeremonyPromises(
  world: World,
  cult: Cult,
  ceremony: (typeof cultCeremonyIds)[number],
  success: boolean,
) {
  if (!success) return;
  for (const thread of cult.threads) {
    if (
      thread.kind !== 'claim' ||
      thread.status !== 'scheduled' ||
      thread.fulfilledMonth !== null ||
      cultMonthNumber(world) > thread.dueMonth
    )
      continue;
    const definition = cultClaims.find((row) => row.id === thread.templateId)!;
    const kept =
      (definition.id === 'last-picnic' &&
        (ceremony === 'community-supper' || ceremony === 'grand-promise')) ||
      (definition.id === 'good-neighbour' &&
        (ceremony === 'open-house' || ceremony === 'community-supper')) ||
      (definition.test === 'support' &&
        ceremony === 'community-supper' &&
        cult.rules.includes('mutual-aid'));
    if (kept) thread.fulfilledMonth = cultMonthNumber(world);
  }
}
