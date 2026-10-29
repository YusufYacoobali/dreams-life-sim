import { monthFrom } from '../../src/game/calendar';
import { resolveCommand, recordDeath } from '../../src/game/engine';
import {
  decodeWorld,
  encodeWorld,
  validateWorld,
  type World,
} from '../../src/game/model';
import { accountFor } from '../../src/game/systems/common';
import {
  cultCapacity,
  cultChangeFollowers,
  cultFoundingReason,
} from '../../src/game/systems/cultCore';
import { createContact } from '../../src/game/systems/npcs';
import { connectPerson } from '../../src/game/systems/relationships';
import { relationFor } from '../../src/game/systems/relationshipQueries';
import { endEmployment } from '../../src/game/systems/work';
import { cultMemberLeaves } from '../../src/game/systems/cultThreads';
import {
  cultMonthNumber,
  type CultMember,
} from '../../src/game/systems/cultSchemas';
import {
  addCultMember,
  cultReplacementCandidates,
  cultReplacementQuote,
  cultReplacementReason,
  cultRoleChangeReason,
  cultVacancyRoles,
} from '../../src/game/systems/cultRoster';
import { cultCommand, cultPeriod, foundCult } from '../support/cults';

function contact(world: World, age = 28) {
  const person = createContact(world, { age });
  connectPerson(world, person.id);
  relationFor(world, world.activePersonId, person.id)!.strength = 75;
  return person;
}
function invite(world: World, personId: string, role: CultMember['role']) {
  const cult = world.cults[0];
  return cultCommand(world, {
    type: 'cult-fill-vacancy',
    cultId: cult.id,
    personId,
    role,
    quotedCost: cultReplacementQuote(cult),
  });
}
function fullCircle() {
  let world = foundCult();
  const recruiter = contact(world),
    adviser = contact(world);
  world = invite(world, recruiter.id, 'recruiter');
  world = invite(world, adviser.id, 'adviser');
  return world;
}

test('the active seat limit is separate from historical identities and a death vacancy accepts a real replacement', () => {
  let world = fullCircle();
  const first = world.cults[0].members.find(
    (member) => member.role === 'deputy',
  )!.personId;
  recordDeath(world, first, 'natural causes');
  const historical = structuredClone(
    world.cults[0].members.find((member) => member.personId === first)!,
  );
  world.date = monthFrom(world.date, 12); // Explicitly advance the fixture's invitation quota year.
  const replacement = contact(world),
    people = Object.keys(world.people).sort(),
    cash = accountFor(world).cash,
    quote = cultReplacementQuote(world.cults[0]),
    treasury = world.cults[0].cash;
  expect(cultVacancyRoles(world.cults[0])).toContain('deputy');
  world = invite(world, replacement.id, 'deputy');
  expect(world.cults[0].members).toHaveLength(6);
  expect(
    world.cults[0].members.filter((member) => member.status === 'active'),
  ).toHaveLength(5);
  expect(
    world.cults[0].members.find((member) => member.personId === first),
  ).toEqual(historical);
  expect(world.people[first].died).not.toBeNull();
  expect(Object.keys(world.people).sort()).toEqual(people);
  expect(accountFor(world).cash).toBe(cash);
  expect(world.cults[0].cash).toBe(treasury - quote);
  expect(world.cults[0].book.at(-1)).toMatchObject({
    category: 'inner-circle-recruitment',
    delta: -quote,
  });
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
});

test('an expelled deputy keeps the same rival callback after their seat is filled', () => {
  let world = foundCult(),
    member = world.cults[0].members.find((row) => row.role === 'deputy')!;
  member.loyalty = 5;
  member.ambition = 90;
  member.grievance = 65;
  const formerId = member.personId,
    replacement = contact(world);
  world = cultCommand(world, {
    type: 'cult-member',
    cultId: world.cults[0].id,
    personId: formerId,
    action: 'expel',
  });
  world = invite(world, replacement.id, 'deputy');
  const callback = world.cults[0].threads.find(
    (thread) => thread.templateId === 'rival-return',
  )!;
  expect(callback.participantIds).toEqual([formerId]);
  for (let i = 0; i < 24; i++) world = cultPeriod(world);
  expect(
    world.cults[0].rivals.find((rival) => rival.leaderId === formerId),
  ).toBeDefined();
  expect(
    world.cults[0].members.find((row) => row.personId === formerId)!.status,
  ).toBe('expelled');
  expect(
    world.cults[0].members.find((row) => row.personId === replacement.id)!.role,
  ).toBe('deputy');
  validateWorld(world);
});

test('repeated annual replacements preserve all former people rather than exhausting five lifetime slots', () => {
  let world = foundCult();
  const original = world.cults[0].members[0].personId,
    former: string[] = [];
  let current = original;
  for (let year = 0; year < 12; year++) {
    if (year) world.date = monthFrom(world.date, 12);
    const cult = world.cults[0],
      member = cult.members.find((row) => row.personId === current)!;
    member.ambition = 0;
    member.grievance = 0;
    member.loyalty = 95;
    cultMemberLeaves(world, cult, member, 'left', false);
    former.push(current);
    const replacement = contact(world);
    world = invite(validateWorld(world), replacement.id, 'deputy');
    current = replacement.id;
  }
  expect(world.cults[0].members).toHaveLength(15);
  expect(
    world.cults[0].members.filter((member) => member.status === 'active'),
  ).toHaveLength(3);
  for (const id of former) {
    expect(world.people[id]).toBeDefined();
    expect(
      world.cults[0].members.find((member) => member.personId === id)!.status,
    ).toBe('left');
  }
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
});

test('a repaired former follower rejoins their existing record and retires the old rival-return thread', () => {
  let world = foundCult(),
    cult = world.cults[0],
    member = cult.members[0];
  member.loyalty = 5;
  member.ambition = 90;
  member.grievance = 65;
  const id = member.personId,
    joined = { ...member.joined },
    ambition = member.ambition;
  world = cultCommand(world, {
    type: 'cult-member',
    cultId: cult.id,
    personId: id,
    action: 'expel',
  });
  relationFor(world, world.activePersonId, id)!.strength = 80;
  const memories = world.cults[0].members
    .find((row) => row.personId === id)!
    .memories.map((row) => row.id);
  world = invite(world, id, 'deputy');
  cult = world.cults[0];
  member = cult.members.find((row) => row.personId === id)!;
  expect(cult.members).toHaveLength(3);
  expect(member.joined).toEqual(joined);
  expect(member.ambition).toBe(ambition);
  expect(member.memories.map((row) => row.id)).toEqual(
    expect.arrayContaining(memories),
  );
  expect(member.memories.at(-1)!.kind).toBe('rejoined');
  expect(
    cult.threads.find((row) => row.templateId === 'rival-return')!.status,
  ).toBe('cancelled');
  for (let i = 0; i < 24; i++) world = cultPeriod(world);
  expect(world.cults[0].rivals).toHaveLength(0);
});

test('ineligible and stale replacement commands leave money, people, counters and roster untouched', () => {
  const world = foundCult(),
    cult = world.cults[0],
    known = contact(world),
    underage = contact(world, 14),
    stranger = createContact(world, { age: 28 });
  expect(
    cultReplacementCandidates(world, cult).map((person) => person.id),
  ).toContain(known.id);
  expect(
    cultReplacementCandidates(world, cult).map((person) => person.id),
  ).not.toContain(underage.id);
  expect(
    cultReplacementCandidates(world, cult).map((person) => person.id),
  ).not.toContain(stranger.id);
  const saved = encodeWorld(world),
    command = {
      type: 'cult-fill-vacancy' as const,
      cultId: cult.id,
      personId: known.id,
      role: 'recruiter' as const,
      quotedCost: cultReplacementQuote(cult),
    };
  for (const change of [
    { quotedCost: command.quotedCost + 1n },
    { personId: underage.id },
    { personId: stranger.id },
    { role: 'deputy' as const },
  ]) {
    expect(() => resolveCommand(world, { ...command, ...change })).toThrow();
    expect(encodeWorld(world)).toBe(saved);
  }
  const next = invite(world, known.id, 'recruiter'),
    settled = encodeWorld(next);
  expect(() => resolveCommand(next, command)).toThrow(
    /already belongs|already filled/,
  );
  expect(encodeWorld(next)).toBe(settled);
});

test('unchanged promotions and assignments reject before any annual counter or loyalty reward', () => {
  const world = foundCult(),
    cult = world.cults[0];
  for (const member of cult.members) {
    const action =
      member.role === 'deputy' ? ('promote' as const) : ('assign' as const);
    const saved = encodeWorld(world);
    expect(cultRoleChangeReason(cult, member.personId, member.role)).toMatch(
      /already holds/,
    );
    expect(() =>
      resolveCommand(world, {
        type: 'cult-member',
        cultId: cult.id,
        personId: member.personId,
        action,
        role: member.role,
      }),
    ).toThrow(/already holds/);
    expect(encodeWorld(world)).toBe(saved);
  }
});

test('assigning another adviser leaves existing advisers and their memories untouched', () => {
  let world = foundCult();
  const cult = world.cults[0],
    adviser = addCultMember(world, cult, 'adviser')!;
  const originalAdviser = structuredClone(adviser),
    target = cult.members.find((member) => member.role === 'treasurer')!;
  world = cultCommand(validateWorld(world), {
    type: 'cult-member',
    cultId: cult.id,
    personId: target.personId,
    action: 'assign',
    role: 'adviser',
  });
  expect(
    world.cults[0].members.find(
      (member) => member.personId === adviser.personId,
    ),
  ).toEqual(originalAdviser);
  expect(
    world.cults[0].members.find(
      (member) => member.personId === target.personId,
    )!.role,
  ).toBe('adviser');
  const settled = encodeWorld(world);
  expect(() =>
    resolveCommand(world, {
      type: 'cult-member',
      cultId: cult.id,
      personId: target.personId,
      action: 'assign',
      role: 'adviser',
    }),
  ).toThrow(/already holds/);
  expect(encodeWorld(world)).toBe(settled);
});

test('two paid invitations per year and the five active seats apply to actual current circumstances', () => {
  let world = fullCircle();
  const candidate = contact(world);
  expect(
    cultReplacementReason(world, world.cults[0], candidate.id, 'adviser'),
  ).toMatch(/five/);
  const member = world.cults[0].members.find(
    (row) => row.role === 'recruiter',
  )!;
  cultMemberLeaves(world, world.cults[0], member, 'left', false);
  expect(
    cultReplacementReason(world, world.cults[0], candidate.id, 'recruiter'),
  ).toMatch(/Two/);
  world.date = monthFrom(world.date, 12);
  expect(
    cultReplacementReason(world, world.cults[0], candidate.id, 'recruiter'),
  ).toBeUndefined();
  world = invite(world, candidate.id, 'recruiter');
  expect(
    world.cults[0].members.filter((row) => row.status === 'active'),
  ).toHaveLength(5);
});

test('a full headquarters can fill a named responsibility from its existing aggregate community', () => {
  let world = foundCult();
  const cult = world.cults[0],
    candidate = contact(world);
  cultChangeFollowers(cult, cultCapacity(cult) - cult.followers);
  const followers = cult.followers,
    income = cult.income,
    people = Object.keys(world.people).length;
  world = invite(validateWorld(world), candidate.id, 'recruiter');
  expect(world.cults[0].followers).toBe(followers);
  expect(world.cults[0].income).toBe(income);
  expect(Object.keys(world.people)).toHaveLength(people);
  expect(
    world.cults[0].members.find((row) => row.personId === candidate.id)!.status,
  ).toBe('active');
  validateWorld(world);
});

test('a retained invitation cannot recruit a person who has since died', () => {
  const world = foundCult(),
    cult = world.cults[0],
    candidate = contact(world);
  const command = {
    type: 'cult-fill-vacancy' as const,
    cultId: cult.id,
    personId: candidate.id,
    role: 'recruiter' as const,
    quotedCost: cultReplacementQuote(cult),
  };
  recordDeath(world, candidate.id, 'natural causes');
  validateWorld(world);
  const saved = encodeWorld(world);
  expect(() => resolveCommand(world, command)).toThrow(/living local contact/);
  expect(encodeWorld(world)).toBe(saved);
});

test('an outstanding dispute in another active cult blocks a premature simultaneous rival membership', () => {
  let world = foundCult();
  const cult = world.cults[0],
    former = cult.members[0];
  former.loyalty = 5;
  former.ambition = 90;
  former.grievance = 60;
  cultMemberLeaves(world, cult, former, 'expelled');
  const original = encodeWorld(world),
    nextFounder = world.people.person_parent1;
  endEmployment(world, nextFounder.id);
  const account = accountFor(world, nextFounder);
  account.cash += 10000000n;
  account.openingCash += 10000000n;
  world.activePersonId = nextFounder.id;
  world = foundCult(validateWorld(world), { name: 'A Different Circle' });
  const nextCult = world.cults[1];
  expect(
    cultReplacementReason(
      world,
      nextCult,
      world.cults[0].founderId,
      'recruiter',
    ),
  ).toMatch(/leads another/);
  connectPerson(world, former.personId);
  relationFor(world, nextFounder.id, former.personId)!.strength = 75;
  expect(
    cultReplacementReason(world, nextCult, former.personId, 'recruiter'),
  ).toMatch(/outstanding dispute/);
  const thread = world.cults[0].threads.find(
    (row) => row.templateId === 'rival-return',
  )!;
  thread.status = 'cancelled';
  thread.outcome = 'cancelled';
  thread.settledMonth = cultMonthNumber(world);
  world = cultCommand(validateWorld(world), {
    type: 'cult-fill-vacancy',
    cultId: nextCult.id,
    personId: former.personId,
    role: 'recruiter',
    quotedCost: cultReplacementQuote(nextCult),
  });
  expect(
    world.cults[0].members.find((row) => row.personId === former.personId)!
      .status,
  ).toBe('expelled');
  expect(
    world.cults[1].members.find((row) => row.personId === former.personId)!
      .status,
  ).toBe('active');
  expect(
    decodeWorld(original).cults[0].members.find(
      (row) => row.personId === former.personId,
    )!.status,
  ).toBe('expelled');
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
  const controlledMember = decodeWorld(encodeWorld(world));
  controlledMember.activePersonId = former.personId;
  expect(cultFoundingReason(controlledMember)).toMatch(
    /Leave your current inner-circle responsibility/,
  );
});
