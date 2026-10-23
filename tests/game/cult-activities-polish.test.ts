import { resolveCommand } from '../../src/game/engine';
import {
  copyWorld,
  decodeWorld,
  encodeWorld,
  validateWorld,
  type World,
} from '../../src/game/model';
import {
  cultCeremonies,
  cultPhilosophies,
  cultRecruitment,
} from '../../src/game/content/cults';
import { cultActivityStories } from '../../src/game/content/cultActivities';
import {
  cultCeremonyChance,
  cultSermonChance,
  offerCultActivity,
} from '../../src/game/systems/cultActivities';
import {
  cultAmount,
  cultCeremonyQuote,
  cultRecruitQuote,
} from '../../src/game/systems/cultCore';
import { cultMonthNumber } from '../../src/game/systems/cultSchemas';
import { accountFor } from '../../src/game/systems/common';
import { tripQuote } from '../../src/game/systems/travel';
import { cultLocalMembers } from '../../src/game/systems/cultActivities';
import { foundCult } from '../support/cults';

function quietActivity() {
  const world = foundCult();
  world.cults[0].lastSceneMonth = cultMonthNumber(world);
  return world;
}
function seeded<T>(
  input: World,
  run: (world: World) => T,
  accept: (result: T) => boolean,
) {
  for (let seed = 1; seed <= 250; seed++) {
    const world = copyWorld(input);
    world.random.events = seed;
    const outcome = run(world);
    if (accept(outcome)) return outcome;
  }
  throw new Error('No matching activity outcome in bounded test seeds');
}

test.each(cultCeremonies)(
  '$title has distinct actual success/failure writing and reconciled contributions',
  (ceremony) => {
    const initial = quietActivity(),
      cult = initial.cults[0],
      quote = cultCeremonyQuote(cult, ceremony.id);
    const perform = (world: World) =>
      resolveCommand(world, {
        type: 'cult-ceremony',
        cultId: cult.id,
        ceremony: ceremony.id,
        quotedCost: quote,
      });
    const success = seeded(
      initial,
      perform,
      (world) => world.cults[0].lastCeremony!.success,
    );
    const failure = seeded(
      initial,
      perform,
      (world) => !world.cults[0].lastCeremony!.success,
    );
    for (const world of [success, failure]) {
      expect(world.pending?.kind).toBe('result');
      expect(world.pending!.title).toContain(ceremony.title);
      expect(world.cults[0].expenses - cult.expenses).toBe(quote);
      expect(world.cults[0].cash).toBe(
        world.cults[0].capital +
          world.cults[0].income -
          world.cults[0].expenses,
      );
      expect(decodeWorld(encodeWorld(world))).toEqual(world);
    }
    expect(success.pending!.body).not.toBe(failure.pending!.body);
    expect(
      failure.cults[0].book.findLast(
        (row) => row.category === 'ceremony' && row.kind === 'income',
      )?.delta ?? 0n,
    ).toBe(0n);
    expect(
      success.cults[0].book.findLast(
        (row) => row.category === 'ceremony' && row.kind === 'income',
      )!.delta,
    ).toBeGreaterThan(0n);
  },
);

test('ceremony preparation changes the success chance and private disappointments do not become public scandals', () => {
  const initial = quietActivity(),
    cult = initial.cults[0];
  expect(cultCeremonyChance(initial, cult, 'grand-promise')).toBeGreaterThan(
    50,
  );
  expect(cultCeremonyChance(initial, cult, 'grand-promise')).toBeLessThan(80);
  const kitchen = copyWorld(initial);
  kitchen.cults[0].upgrades.push('kitchen');
  expect(
    cultCeremonyChance(kitchen, kitchen.cults[0], 'community-supper'),
  ).toBeGreaterThan(cultCeremonyChance(initial, cult, 'community-supper'));
  const closed = copyWorld(initial);
  closed.cults[0].rules = ['private-rituals', 'family-day'];
  expect(
    cultCeremonyChance(closed, closed.cults[0], 'open-house'),
  ).toBeLessThan(cultCeremonyChance(initial, cult, 'open-house'));
  const failure = seeded(
    initial,
    (world) =>
      resolveCommand(world, {
        type: 'cult-ceremony',
        cultId: cult.id,
        ceremony: 'quiet-table',
        quotedCost: cultCeremonyQuote(cult, 'quiet-table'),
      }),
    (world) => !world.cults[0].lastCeremony!.success,
  );
  expect(failure.cults[0].scandals).toEqual(cult.scandals);
  expect(failure.cults[0].heat).toBe(cult.heat);
  expect(failure.cults[0].loyalty).toBeLessThan(cult.loyalty);
  expect(failure.cults[0].satisfaction).toBeLessThan(cult.satisfaction);
});

test('preaching can engage, settle or lose the room instead of granting a constant bonus', () => {
  const initial = quietActivity(),
    cult = initial.cults[0],
    bodies = new Set<string>();
  for (const delta of [4, 1, -2]) {
    const world = seeded(
      initial,
      (candidate) =>
        resolveCommand(candidate, { type: 'cult-preach', cultId: cult.id }),
      (candidate) => candidate.cults[0].loyalty - cult.loyalty === delta,
    );
    expect(world.cults[0].sermons).toBe(cult.sermons + 1);
    expect(world.people[world.activePersonId].stats.energy).toBe(
      initial.people[initial.activePersonId].stats.energy - 5,
    );
    bodies.add(world.pending!.body);
    expect(decodeWorld(encodeWorld(world))).toEqual(world);
  }
  expect(bodies.size).toBe(3);
  const tense = copyWorld(initial);
  tense.cults[0].heat = 90;
  tense.cults[0].satisfaction = 25;
  expect(cultSermonChance(tense, tense.cults[0])).toBeLessThan(
    cultSermonChance(initial, cult),
  );
});

test('all eight philosophies preach their own subject and all five recruitment methods have their own outcomes', () => {
  const sermonBodies = new Set<string>();
  for (const philosophy of cultPhilosophies) {
    const world = quietActivity();
    world.cults[0].philosophy = philosophy.id;
    world.random.events = 16;
    const next = resolveCommand(world, {
      type: 'cult-preach',
      cultId: world.cults[0].id,
    });
    sermonBodies.add(next.pending!.body);
  }
  expect(sermonBodies.size).toBe(8);
  const recruitmentBodies = new Set<string>();
  for (const method of cultRecruitment) {
    const world = quietActivity(),
      cult = world.cults[0],
      quote = cultRecruitQuote(cult, method.id);
    const next = resolveCommand(world, {
      type: 'cult-recruit',
      cultId: cult.id,
      method: method.id,
      quotedCost: quote,
    });
    const joined = next.cults[0].followers - cult.followers;
    expect(next.cults[0].expenses - cult.expenses).toBe(quote);
    expect(next.cults[0].income - cult.income).toBe(
      cult.joiningFee * BigInt(joined),
    );
    recruitmentBodies.add(next.pending!.body);
  }
  expect(recruitmentBodies.size).toBe(5);
});

test('routine actions can offer saved, contextual choices immediately instead of waiting for quarterly stories', () => {
  const initial = foundCult(),
    cult = initial.cults[0];
  const world = seeded(
    initial,
    (candidate) =>
      resolveCommand(candidate, {
        type: 'cult-recruit',
        cultId: cult.id,
        method: 'street',
        quotedCost: cultRecruitQuote(cult, 'street'),
      }),
    (candidate) => candidate.pending?.kind === 'decision',
  );
  if (world.pending?.kind !== 'decision')
    throw new Error('Expected the activity decision');
  expect(world.pending.templateId).toBe('cult-activity-street-question');
  const participant = world.pending.participants![0].personId;
  expect(cult.members.map((row) => row.personId)).toContain(participant);
  const saved = decodeWorld(encodeWorld(world)),
    eventId = saved.pending!.id;
  const before = saved.cults[0].cash;
  const chosen = resolveCommand(saved, {
    type: 'choose',
    eventId,
    choiceId: 'flyer',
  });
  expect(chosen.cults[0].cash).toBe(
    before - cultAmount(cult, 10) + cult.joiningFee * 3n,
  );
  expect(chosen.cults[0].book.at(-2)?.category).toBe('story-cost');
  expect(
    chosen.cults[0].threads.find((thread) => thread.offerId === eventId),
  ).toBeUndefined();
  expect(
    chosen.cults[0].threads.find(
      (thread) => thread.templateId === 'activity-street-question',
    )!.status,
  ).toBe('resolved');
  expect(() =>
    resolveCommand(chosen, { type: 'choose', eventId, choiceId: 'flyer' }),
  ).toThrow(/no longer open/);
  expect(decodeWorld(encodeWorld(chosen))).toEqual(chosen);
});

test('a used monthly scene slot neither creates a stale routine incident nor consumes its selection roll', () => {
  const world = quietActivity(),
    cult = world.cults[0],
    before = encodeWorld(world);
  expect(
    offerCultActivity(
      world,
      cult,
      'activity-street-question',
      'A real invitation happened.',
      100,
    ),
  ).toBe(false);
  expect(encodeWorld(world)).toBe(before);
  expect(cult.threads).toHaveLength(0);
});

test('an injured inner-circle member can bring a real grievance into a saved conversation', () => {
  const initial = foundCult(),
    cult = initial.cults[0],
    member = cult.members[0];
  member.loyalty = 20;
  member.grievance = 70;
  const world = seeded(
    initial,
    (candidate) =>
      resolveCommand(candidate, {
        type: 'cult-member',
        cultId: cult.id,
        personId: member.personId,
        action: 'talk',
      }),
    (candidate) => candidate.pending?.kind === 'decision',
  );
  if (world.pending?.kind !== 'decision')
    throw new Error('Expected the member conversation');
  expect(world.pending.templateId).toBe('cult-activity-member-warning');
  expect(world.cults[0].threads.at(-1)!.participantIds).toEqual([
    member.personId,
  ]);
  const before = world.cults[0].cash;
  const paid = resolveCommand(world, {
    type: 'choose',
    eventId: world.pending.id,
    choiceId: 'support',
  });
  expect(paid.cults[0].cash).toBe(before - cultAmount(cult, 30));
  expect(
    paid.ledger.some(
      (row) =>
        row.personId === member.personId &&
        row.category === 'cult-member-reward' &&
        row.cashDelta === cultAmount(cult, 30),
    ),
  ).toBe(true);
  expect(paid.cults[0].members[0].grievance).toBe(70);
  validateWorld(paid);
});

test('every routine incident stays in the existing story registry and has genuinely different options', () => {
  expect(cultActivityStories).toHaveLength(16);
  expect(new Set(cultActivityStories.map((row) => row.id)).size).toBe(16);
  for (const story of cultActivityStories) {
    expect(story.source).toBe('activity');
    expect(story.choices).toHaveLength(3);
    expect(new Set(story.choices.map((choice) => choice.id)).size).toBe(3);
    expect(new Set(story.choices.map((choice) => choice.result)).size).toBe(3);
  }
});

test('hospitalised and actually travelling members neither organise gatherings nor appear in activity scenes', () => {
  let world = foundCult();
  const leaderId = world.activePersonId,
    cultId = world.cults[0].id;
  const organiser = world.cults[0].members.find(
    (member) => member.role === 'organiser',
  )!;
  organiser.loyalty = 90;
  const availableChance = cultCeremonyChance(
    world,
    world.cults[0],
    'community-supper',
  );
  const hospital = copyWorld(world);
  hospital.people[organiser.personId].health.hospitalizedUntil =
    cultMonthNumber(hospital) + 1;
  validateWorld(hospital);
  expect(
    cultLocalMembers(hospital, hospital.cults[0]).some(
      (member) => member.personId === organiser.personId,
    ),
  ).toBe(false);
  expect(
    cultCeremonyChance(hospital, hospital.cults[0], 'community-supper'),
  ).toBeLessThan(availableChance);
  expect(
    offerCultActivity(
      hospital,
      hospital.cults[0],
      'activity-supper-seats',
      'The supper happened.',
      100,
      organiser.personId,
    ),
  ).toBe(false);

  // Book an actual paid trip under this NPC's identity, then return control to
  // the founder. Their home address stays unchanged, as it should on holiday.
  const person = world.people[organiser.personId],
    account = accountFor(world, person);
  account.cash += 10000000n;
  account.openingCash += 10000000n;
  world.activePersonId = person.id;
  const quote = tripQuote(world, 'paris', 1);
  world = resolveCommand(world, {
    type: 'book-trip',
    destinationId: 'paris',
    duration: 1,
    companionIds: [],
    focus: 'sightseeing',
    quotedTotal: quote.total,
  });
  if (world.pending?.kind !== 'result')
    throw new Error('Expected the paid trip result');
  world = resolveCommand(world, {
    type: 'acknowledge',
    resultId: world.pending.id,
  });
  world.activePersonId = leaderId;
  validateWorld(world);
  const cult = world.cults.find((item) => item.id === cultId)!;
  expect(world.people[organiser.personId].city).toBe(cult.city);
  expect(
    cultLocalMembers(world, cult).some(
      (member) => member.personId === organiser.personId,
    ),
  ).toBe(false);
  expect(cultCeremonyChance(world, cult, 'community-supper')).toBeLessThan(
    availableChance,
  );
  expect(
    offerCultActivity(
      world,
      cult,
      'activity-supper-seats',
      'The supper happened.',
      100,
      organiser.personId,
    ),
  ).toBe(false);
});
