import type { Person, World } from '../model';
import { ageOn, fullName } from '../personHelpers';
import { rules } from '../rules';
import { cultMemberRoles, cultRoleTitles } from '../content/cults';
import { IneligibleAction } from '../errors';
import { draw, result } from './common';
import {
  cultActionReason,
  cultAmount,
  cultChangeFollowers,
  cultLimit,
  cultMemory,
  cultMoney,
  cultRecord,
  cultSpend,
  ownedCult,
} from './cultCore';
import {
  cultMonthNumber,
  type Cult,
  type CultCommand,
  type CultMember,
} from './cultSchemas';
import { hospitalized } from './healthSchemas';
import { isConfined } from './legalSchemas';
import { createContact } from './npcs';
import { connectPerson } from './relationships';
import { relationFor } from './relationshipQueries';
import { serviceAway } from './serviceSchemas';
import { activeTrip } from './travelSchemas';

const activeMembers = (cult: Cult) =>
  cult.members.filter((member) => member.status === 'active');

/** Initial named followers materialise from the ordinary aggregate, at most five. */
export function addCultMember(
  world: World,
  cult: Cult,
  role: CultMember['role'],
) {
  if (
    cult.members.length >= 5 ||
    activeMembers(cult).length >= 5 ||
    cult.members.some(
      (member) => member.status === 'active' && member.role === role,
    )
  )
    return;
  const person = createContact(world, {
    age: draw(world, 'npcs', 22, 48),
    country: cult.country,
    city: cult.city,
  });
  connectPerson(world, person.id);
  const member = newMembership(world, cult, person, role);
  cult.members.push(member);
  const relation = relationFor(world, cult.founderId, person.id);
  if (relation) relation.strength = Math.max(45, relation.strength);
  cultMemory(
    world,
    cult,
    member,
    'joined',
    'I joined ' + cult.name + ' as ' + cultRoleTitles[role].toLowerCase() + '.',
  );
  return member;
}

function newMembership(
  world: World,
  cult: Cult,
  person: Person,
  role: CultMember['role'],
): CultMember {
  return {
    personId: person.id,
    role,
    joined: { ...world.date },
    ended: null,
    status: 'active',
    personality: (
      ['earnest', 'practical', 'showy', 'sceptic', 'opportunist'] as const
    )[draw(world, 'npcs', 0, 4)],
    loyalty: draw(world, 'events', 50, 75),
    ambition: draw(world, 'events', 15, 65),
    grievance: 0,
    resident: cult.upgrades.includes('residences'),
    memories: [],
  };
}

export function cultVacancyRoles(cult: Cult): CultMember['role'][] {
  const members = activeMembers(cult);
  if (members.length >= 5) return [];
  return cultMemberRoles.filter(
    (role) =>
      role === 'adviser' || !members.some((member) => member.role === role),
  );
}

/** The same role is never a fresh promotion or a source of repeat loyalty. */
export function cultRoleChangeReason(
  cult: Cult,
  personId: string,
  role: CultMember['role'],
): string | undefined {
  const member = cult.members.find(
    (row) => row.personId === personId && row.status === 'active',
  );
  if (!member) return 'Choose a current inner-circle member';
  if (!cultMemberRoles.includes(role)) return 'Choose a responsibility';
  if (member.role === role)
    return 'This person already holds that responsibility';
}

export const cultReplacementQuote = (cult: Cult) => cultAmount(cult, 25);

function individualReason(
  world: World,
  cult: Cult,
  personId: string,
): string | undefined {
  const person = world.people[personId];
  if (!person || person.id === cult.founderId || person.died)
    return 'Choose a living local contact';
  if (ageOn(person, world.date) < rules[cult.country].adultAge)
    return 'Inner-circle members must be adults';
  if (
    person.country !== cult.country ||
    person.city !== cult.city ||
    activeTrip(world, person.id) ||
    serviceAway(world, person.id)
  )
    return 'This person must be in the headquarters city';
  if (
    isConfined(world, person) ||
    person.legal.wanted ||
    hospitalized(world, person)
  )
    return 'This person is unavailable to join the inner circle';
  const relation = relationFor(world, cult.founderId, person.id);
  if (!relation || relation.strength < 35)
    return 'Get to know this person before offering a responsibility';
  const member = cult.members.find((row) => row.personId === person.id);
  if (member?.status === 'active')
    return 'This person already belongs to your inner circle';
  if (member && relation.strength < 65)
    return 'Repair your relationship before inviting this former member back';
  if (
    world.cults.some(
      (other) => other.status === 'active' && other.leaderId === person.id,
    )
  )
    return 'This person already leads another organisation';
  if (
    world.cults.some(
      (other) =>
        other.status === 'active' &&
        other.members.some(
          (row) => row.personId === person.id && row.status === 'active',
        ),
    )
  )
    return 'This person already serves another inner circle';
  if (
    world.cults.some((other) =>
      other.rivals.some(
        (rival) =>
          rival.leaderId === person.id &&
          ['active', 'allied'].includes(rival.status),
      ),
    )
  )
    return 'Reconcile their rival organisation before inviting them back';
  if (
    world.cults.some(
      (other) =>
        other !== cult &&
        other.status === 'active' &&
        other.threads.some(
          (thread) =>
            thread.kind === 'callback' &&
            thread.templateId === 'rival-return' &&
            ['scheduled', 'offered'].includes(thread.status) &&
            thread.participantIds.includes(person.id),
        ),
    )
  )
    return 'Resolve this person’s outstanding dispute with their former organisation first';
}

/** Read-only candidates; the invitation itself never creates a new NPC. */
export function cultReplacementCandidates(world: World, cult: Cult): Person[] {
  return Object.values(world.people)
    .filter((person) => !individualReason(world, cult, person.id))
    .sort(
      (a, b) =>
        fullName(a).localeCompare(fullName(b)) || a.id.localeCompare(b.id),
    );
}

export function cultReplacementReason(
  world: World,
  cult: Cult,
  personId?: string,
  role?: CultMember['role'],
): string | undefined {
  const unavailable = cultActionReason(world, cult);
  if (unavailable) return unavailable;
  if (activeMembers(cult).length >= 5)
    return 'All five inner-circle seats are filled';
  if (
    (world.actionCounts[cult.id + ':fill-vacancy:' + world.date.year] ?? 0) >= 2
  )
    return 'Two inner-circle invitations are available each year';
  if (cult.cash < cultReplacementQuote(cult))
    return 'The treasury cannot cover the invitation and induction';
  if (role && !cultVacancyRoles(cult).includes(role))
    return 'That responsibility is already filled';
  if (personId) return individualReason(world, cult, personId);
}

export function resolveCultReplacement(
  world: World,
  command: Extract<CultCommand, { type: 'cult-fill-vacancy' }>,
) {
  const cult = ownedCult(world, command.cultId);
  const reason = cultReplacementReason(
    world,
    cult,
    command.personId,
    command.role,
  );
  if (reason) throw new IneligibleAction(reason);
  const quote = cultReplacementQuote(cult);
  if (command.quotedCost !== quote)
    throw new IneligibleAction('The inner-circle invitation quote changed');
  cultLimit(world, cult, 'fill-vacancy', 2, 'year');
  cultSpend(
    world,
    cult,
    quote,
    'inner-circle-recruitment',
    'Inner-circle invitation and induction',
  );
  const person = world.people[command.personId];
  let member = cult.members.find((row) => row.personId === person.id);
  if (member) {
    const priorExit = member.ended!;
    member.role = command.role;
    member.status = 'active';
    member.ended = null;
    member.resident = cult.upgrades.includes('residences');
    member.loyalty = Math.max(
      member.loyalty,
      Math.min(65, relationFor(world, cult.founderId, person.id)!.strength),
    );
    // Keep the old relationship, ambition, grievances and all retained memories.
    // Rejoining is a fresh responsibility, not a personality reset.
    cultMemory(
      world,
      cult,
      member,
      'rejoined',
      'I rejoined ' +
        cult.name +
        ' after leaving on ' +
        priorExit.year +
        '-' +
        String(priorExit.month).padStart(2, '0') +
        '-' +
        String(priorExit.day).padStart(2, '0') +
        '. My earlier history remains.',
    );
    for (const thread of cult.threads)
      if (
        thread.kind === 'callback' &&
        thread.templateId === 'rival-return' &&
        thread.status === 'scheduled' &&
        thread.participantIds.includes(person.id)
      ) {
        thread.status = 'cancelled';
        thread.outcome = 'cancelled';
        thread.settledMonth = cultMonthNumber(world);
        thread.offerId = null;
      }
  } else {
    member = newMembership(world, cult, person, command.role);
    cult.members.push(member);
    cultMemory(
      world,
      cult,
      member,
      'joined',
      'I joined ' +
        cult.name +
        ' as ' +
        cultRoleTitles[command.role].toLowerCase() +
        '.',
    );
  }
  // Identify an existing member of the aggregate community, just as the first
  // named followers are materialised. A full venue does not make a vacant
  // responsibility impossible to fill; only enforce the real-person minimum.
  cultChangeFollowers(cult, 0);
  const text =
    'I welcomed ' +
    fullName(person) +
    ' into the inner circle as ' +
    cultRoleTitles[command.role].toLowerCase() +
    '.';
  cultRecord(world, cult, text);
  result(
    world,
    'A seat is filled',
    fullName(person) +
      ' accepted the responsibility in your existing community. Former members remain in your history.',
    'cult-followers',
    [
      {
        id: 'induction',
        label: 'Treasury cost',
        value: cultMoney(cult, -quote),
        tone: 'negative',
      },
    ],
  );
  return member;
}
