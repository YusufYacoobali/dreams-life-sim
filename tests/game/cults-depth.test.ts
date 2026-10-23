import {
  copyWorld,
  decodeWorld,
  encodeWorld,
  validateWorld,
  type World,
} from '../../src/game/model';
import { recordDeath, resolveCommand } from '../../src/game/engine';
import { cultClaims } from '../../src/game/content/cultClaims';
import {
  cultStories,
  type CultStoryDefinition,
} from '../../src/game/content/cultStories';
import {
  cultAmount,
  cultBook,
  cultSpend,
  cultChangeFollowers,
  cultFeeOptions,
  cultMemberTrust,
  cultPayoutAvailable,
  cultRewardQuote,
  cultUpgradeQuote,
  cultCeremonyQuote,
} from '../../src/game/systems/cultCore';
import { cultMonthNumber, type Cult } from '../../src/game/systems/cultSchemas';
import {
  cultStoryContext,
  cultStoryMonth,
  offerCultThread,
} from '../../src/game/systems/cultEvents';
import {
  cultMemberLeaves,
  cultRivalArrives,
  newCultThread,
} from '../../src/game/systems/cultThreads';
import {
  cultRecoveryQuote,
  cultRivalQuote,
} from '../../src/game/systems/cults';
import { accountFor } from '../../src/game/systems/common';
import { relationFor } from '../../src/game/systems/relationshipQueries';
import {
  cultCommand,
  cultFixture,
  cultPeriod,
  drainCult,
  foundCult,
} from '../support/cults';

function prosperousCult() {
  const initial = cultFixture(),
    fees = cultFeeOptions('US')[3];
  let world = foundCult(initial, {
    headquarters: 'farmhouse',
    joiningFee: fees.joining,
    recurringFee: fees.recurring,
  });
  cultChangeFollowers(world.cults[0], 500 - world.cults[0].followers);
  for (let i = 0; i < 3; i++) world = cultPeriod(world);
  return world;
}
function arrangeStory(input: World, definition: CultStoryDefinition) {
  const world = copyWorld(input),
    cult = world.cults[0];
  cult.rules =
    definition.need === 'contradiction'
      ? ['public-rituals', 'private-rituals']
      : [
          ...new Set<Cult['rules'][number]>([
            definition.rule ?? 'family-day',
            'open-books',
          ]),
        ];
  if (cult.rules.length === 1) cult.rules.push('family-day');
  cult.doctrines = [
    ...new Set<Cult['doctrines'][number]>([
      definition.doctrine ?? 'public-answers',
      'borrowed-dreams',
    ]),
  ];
  if (cult.doctrines.length === 1) cult.doctrines.push('public-answers');
  if (definition.need === 'ambition') {
    const deputy = cult.members.find((row) => row.role === 'deputy')!;
    deputy.ambition = 85;
    deputy.loyalty = 40;
  }
  if (definition.need === 'rival') {
    const member = cult.members.find((row) => row.role === 'organiser')!;
    member.loyalty = 5;
    member.ambition = 90;
    member.grievance = 80;
    cultMemberLeaves(world, cult, member, 'expelled');
    const thread = cult.threads.find(
      (row) => row.templateId === 'rival-return',
    )!;
    cultRivalArrives(world, cult, thread);
  }
  const context = cultStoryContext(world, cult, definition);
  expect(context).toBeDefined();
  cult.lastSceneMonth = null;
  const thread = newCultThread(
    world,
    cult,
    'story',
    definition.id,
    cultMonthNumber(world),
    [
      context!.member.personId,
      ...(definition.need === 'family' ? [context!.relative!.id] : []),
    ],
  );
  thread.title = definition.title;
  thread.body = definition.body;
  thread.ruleId = definition.rule ?? null;
  thread.doctrineId = definition.doctrine ?? null;
  expect(offerCultThread(world, cult, thread)).toBe(true);
  return validateWorld(world);
}

let storyWorld: World;
beforeAll(() => {
  storyWorld = prosperousCult();
  const cult = storyWorld.cults[0],
    amount = cultPayoutAvailable(cult);
  expect(amount).toBeGreaterThan(0n);
  storyWorld = cultCommand(storyWorld, {
    type: 'cult-payout',
    cultId: cult.id,
    amount,
  });
});

test.each(
  cultStories.flatMap((story) =>
    story.choices.map((choice) => [story.id, choice.id, story] as const),
  ),
)(
  '%s / %s resolves its authored effect with valid saved finances',
  (_id, choiceId, definition) => {
    let world = arrangeStory(storyWorld, definition);
    const event = world.pending!;
    world = resolveCommand(world, {
      type: 'choose',
      eventId: event.id,
      choiceId,
    });
    expect(
      world.cults[0].threads.find((row) => row.offerId === event.id),
    ).toBeUndefined();
    expect(decodeWorld(encodeWorld(world))).toEqual(world);
    expect(() =>
      resolveCommand(world, { type: 'choose', eventId: event.id, choiceId }),
    ).toThrow();
  },
);

test.each(cultStories.filter((row) => row.rule || row.doctrine || row.need))(
  '$id requires its actual rule, doctrine or recorded context',
  (definition) => {
    const world = arrangeStory(storyWorld, definition),
      cult = world.cults[0];
    if (definition.rule)
      cult.rules = cult.rules.filter((row) => row !== definition.rule);
    else if (definition.doctrine)
      cult.doctrines = cult.doctrines.filter(
        (row) => row !== definition.doctrine,
      );
    else if (definition.need === 'payout') cult.payouts = 0n;
    else if (definition.need === 'headquarters')
      cult.headquarters = 'meeting-room';
    else if (definition.need === 'ambition')
      cult.members.forEach((row) => (row.ambition = 0));
    else if (definition.need === 'rival')
      cult.rivals.forEach((row) => (row.status = 'closed'));
    else if (definition.need === 'family') {
      for (const person of Object.values(world.people))
        if (
          !cult.members.some((row) => row.personId === person.id) &&
          person.id !== world.activePersonId
        )
          person.city = 'Elsewhere';
    } else if (definition.need === 'contradiction')
      cult.rules = ['public-rituals', 'family-day'];
    expect(cultStoryContext(world, cult, definition)).toBeUndefined();
  },
);

test('payouts and real member rewards conserve both sides, remain taxable, and cannot be replayed', () => {
  let world = prosperousCult(),
    cult = world.cults[0],
    member = cult.members[0];
  const personal = accountFor(world).cash,
    treasury = cult.cash,
    earned = world.people[world.activePersonId].finance.cycleGross,
    amount = cultPayoutAvailable(cult);
  world = cultCommand(world, { type: 'cult-payout', cultId: cult.id, amount });
  cult = world.cults[0];
  expect(accountFor(world).cash - personal).toBe(amount);
  expect(treasury - cult.cash).toBe(amount);
  expect(world.people[world.activePersonId].finance.cycleGross - earned).toBe(
    amount,
  );
  expect(() =>
    resolveCommand(world, { type: 'cult-payout', cultId: cult.id, amount }),
  ).toThrow(/month/);
  const npc = world.people[member.personId],
    before = accountFor(world, npc, cult.currency).cash,
    quote = cultRewardQuote(cult),
    cash = cult.cash;
  world = cultCommand(world, {
    type: 'cult-member',
    cultId: cult.id,
    personId: member.personId,
    action: 'reward',
    quotedCost: quote,
  });
  expect(
    accountFor(world, world.people[member.personId], cult.currency).cash -
      before,
  ).toBe(quote);
  expect(cash - world.cults[0].cash).toBe(quote);
  expect(world.cults[0].memberRewards).toBe(quote);
});

test('a fulfilled public gathering promise survives later private gatherings and save reloads', () => {
  let world = foundCult(undefined, {
      philosophy: 'ordinary-miracles',
      doctrines: ['kindness-interest', 'public-answers'],
    }),
    cult = world.cults[0];
  world = cultCommand(world, {
    type: 'cult-claim',
    cultId: cult.id,
    claim: 'good-neighbour',
    approach: 'explain',
  });
  world = cultCommand(world, {
    type: 'cult-ceremony',
    cultId: cult.id,
    ceremony: 'open-house',
    quotedCost: cultCeremonyQuote(world.cults[0], 'open-house'),
  });
  expect(world.cults[0].lastCeremony!.success).toBe(true);
  const fulfilled = world.cults[0].threads[0].fulfilledMonth;
  expect(fulfilled).toBe(cultMonthNumber(world));
  world = cultPeriod(world);
  world = cultCommand(world, {
    type: 'cult-ceremony',
    cultId: cult.id,
    ceremony: 'dream-circle',
    quotedCost: cultCeremonyQuote(world.cults[0], 'dream-circle'),
  });
  for (let i = 0; i < 7; i++) world = cultPeriod(world);
  expect(
    world.cults[0].threads.find((row) => row.templateId === 'good-neighbour')!
      .outcome,
  ).toBe('success');
  expect(
    world.cults[0].threads.find((row) => row.templateId === 'good-neighbour')!
      .fulfilledMonth,
  ).toBe(fulfilled);
});

test('a private ceremony cannot fulfil a promise to win over neighbours', () => {
  let world = foundCult(undefined, {
      philosophy: 'ordinary-miracles',
      doctrines: ['kindness-interest', 'public-answers'],
    }),
    cult = world.cults[0];
  world = cultCommand(world, {
    type: 'cult-claim',
    cultId: cult.id,
    claim: 'good-neighbour',
    approach: 'explain',
  });
  world = cultCommand(world, {
    type: 'cult-ceremony',
    cultId: cult.id,
    ceremony: 'dream-circle',
    quotedCost: cultCeremonyQuote(world.cults[0], 'dream-circle'),
  });
  expect(world.cults[0].lastCeremony!.success).toBe(true);
  expect(world.cults[0].threads[0].fulfilledMonth).toBeNull();
  for (let i = 0; i < 8; i++)
    ((world = cultPeriod(world, false)),
      (world = i < 7 ? drainCult(world) : world));
  expect(world.pending?.kind === 'decision' && world.pending.templateId).toBe(
    'cult-good-neighbour',
  );
});

test.each(cultClaims)(
  '$id has a bounded exactly-once deadline and survives configuration changes',
  (definition) => {
    let world = foundCult(undefined, {
        philosophy: definition.philosophy as Cult['philosophy'],
        doctrines: [
          definition.doctrine,
          definition.doctrine === 'public-answers'
            ? 'borrowed-dreams'
            : 'public-answers',
        ],
      }),
      cult = world.cults[0];
    world = cultCommand(world, {
      type: 'cult-claim',
      cultId: cult.id,
      claim: definition.id,
      approach: 'explain',
    });
    cult = world.cults[0];
    const thread = cult.threads[0];
    expect(thread.dueMonth - cultMonthNumber(world)).toBe(definition.months);
    expect(thread.participantIds).toHaveLength(1);
    world = cultCommand(world, {
      type: 'cult-beliefs',
      cultId: cult.id,
      leaderTitle: cult.leaderTitle,
      philosophy: 'quiet-orbit',
      doctrines: ['public-answers', 'leader-fallible'],
      rules: ['family-day', 'open-books'],
    });
    expect(world.cults[0].threads[0].philosophy).toBe(definition.philosophy);
    for (let i = 0; i < definition.months; i++) world = cultPeriod(world);
    expect(['resolved', 'cancelled']).toContain(
      world.cults[0].threads.find((row) => row.id === thread.id)!.status,
    );
    world.cults[0].lastSceneMonth = cultMonthNumber(world);
    const before = encodeWorld(world);
    cultStoryMonth(world, world.cults[0]);
    expect(encodeWorld(world)).toBe(before);
    expect(() =>
      resolveCommand(world, {
        type: 'cult-claim',
        cultId: cult.id,
        claim: definition.id,
        approach: 'explain',
      }),
    ).toThrow(/already made|Requires/);
  },
);

test('rebranding preserves scandals, old names, claims and actual pending prosecution', () => {
  let world = foundCult(),
    cult = world.cults[0],
    member = cult.members.find((row) => row.role === 'treasurer')!;
  member.loyalty = 15;
  const definition = cultStories.find(
      (row) => row.id === 'treasurer-envelope',
    )!,
    thread = newCultThread(
      world,
      cult,
      'story',
      definition.id,
      cultMonthNumber(world),
      [member.personId],
    );
  thread.title = definition.title;
  thread.body = definition.body;
  offerCultThread(world, cult, thread);
  world = resolveCommand(world, {
    type: 'choose',
    eventId: world.pending!.id,
    choiceId: 'divert',
  });
  world = drainCult(world);
  cult = world.cults[0];
  const incidents = [...cult.legalIncidents],
    cases = world.cases.map((row) => row.id),
    scandals = cult.scandals.map((row) => row.id),
    before = cult.name;
  // A legal arrest may block actions, but a concluded case must not erase its history either.
  for (const item of world.cases)
    if (item.status === 'awaiting-trial')
      expect(incidents).toContain(item.incidentId);
  expect(cases.length).toBeGreaterThan(0);
  // The ordinary arrest popup posted real bail through drainCult, preserving the pending hearing.
  expect(world.cases.every((item) => !item.detained)).toBe(true);
  world = cultCommand(world, {
    type: 'cult-recovery',
    cultId: cult.id,
    action: 'rebrand',
    name: 'The New Door',
    quotedCost: cultRecoveryQuote(cult, 'rebrand'),
  });
  cult = world.cults[0];
  expect(cult.names.map((row) => row.name)).toEqual([before, 'The New Door']);
  expect(cult.legalIncidents).toEqual(incidents);
  expect(world.cases.map((row) => row.id)).toEqual(cases);
  expect(cult.scandals.map((row) => row.id)).toEqual(scandals);
  expect(cult.recovery!.remaining).toBe(6);
  const heat = cult.heat;
  world = cultPeriod(world);
  expect(world.cults[0].recovery!.remaining).toBe(5);
  expect(world.cults[0].heat).toBeLessThan(heat);
});

test('death of a named follower cancels their offered scene and reduces actual membership once', () => {
  let world = arrangeStory(
      storyWorld,
      cultStories.find((row) => row.id === 'wrong-blue')!,
    ),
    cult = world.cults[0];
  const thread = cult.threads.find((row) => row.status === 'offered')!,
    personId = thread.participantIds[0],
    followers = cult.followers;
  recordDeath(world, personId, 'natural causes');
  validateWorld(world);
  expect(cult.followers).toBe(followers - 1);
  expect(cult.threads.find((row) => row.id === thread.id)!.status).toBe(
    'cancelled',
  );
  expect(world.pending?.id).not.toBe(thread.offerId);
  recordDeath(world, personId, 'natural causes');
  expect(cult.followers).toBe(followers - 1);
});

test('long-lived cults archive books and reports without losing exact money or NPC identity', () => {
  let world = prosperousCult();
  const members = world.cults[0].members.map((row) => row.personId);
  for (let i = 0; i < 180; i++) world = cultPeriod(world);
  const cult = world.cults[0];
  expect(cult.status).toBe('active');
  expect(cult.book).toHaveLength(512);
  expect(cult.bookBase.count).toBeGreaterThan(0);
  expect(cult.months).toHaveLength(60);
  expect(cult.years.length).toBeGreaterThanOrEqual(15);
  expect(cult.members.map((row) => row.personId)).toEqual(members);
  expect(cult.cash).toBe(
    cult.capital +
      cult.income -
      cult.expenses -
      cult.payouts -
      cult.misuse -
      cult.distribution,
  );
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
});

test('irrecoverable arrears collapse and settle the organisation without personal money', () => {
  let world = foundCult(undefined, { joiningFee: 0n, recurringFee: 0n }),
    cult = world.cults[0];
  cultSpend(
    world,
    cult,
    cult.cash,
    'communal-cost',
    'Committed communal costs',
  );
  cultChangeFollowers(cult, 3 - cult.followers);
  cult.loyalty = 0;
  const personal = accountFor(world).cash;
  for (let i = 0; i < 4; i++) world = cultPeriod(world);
  cult = world.cults[0];
  expect(cult.status).toBe('collapsed');
  expect(cult.writtenOff).toBeGreaterThan(0n);
  expect(cult.arrears).toBe(0n);
  expect(cult.cash).toBe(0n);
  expect(accountFor(world).cash).toBe(personal);
  expect(cult.members.every((row) => row.status !== 'active')).toBe(true);
  const before = encodeWorld(world);
  expect(() =>
    resolveCommand(world, { type: 'cult-disband', cultId: cult.id }),
  ).toThrow(/no longer lead/);
  expect(encodeWorld(world)).toBe(before);
});

test('real friendship repair prevents a former deputy becoming a rival years later', () => {
  let world = foundCult(),
    cult = world.cults[0],
    member = cult.members[0];
  member.loyalty = 5;
  member.grievance = 70;
  member.ambition = 90;
  world = cultCommand(world, {
    type: 'cult-member',
    cultId: cult.id,
    personId: member.personId,
    action: 'expel',
  });
  cult = world.cults[0];
  member = cult.members[0];
  const relation = relationFor(world, cult.founderId, member.personId)!;
  relation.strength = 59;
  cultMemberTrust(world, member, 12);
  expect(relation.strength).toBe(65);
  expect(relation.roles).toContain('friend');
  for (let i = 0; i < 24; i++) world = cultPeriod(world);
  expect(world.cults[0].rivals).toHaveLength(0);
  expect(
    world.cults[0].threads.find((row) => row.templateId === 'rival-return')!
      .outcome,
  ).toBe('success');
});

test('rival publicity collects actual joining fees once and charges its real cost', () => {
  let world = drainCult(
      arrangeStory(
        storyWorld,
        cultStories.find((row) => row.id === 'rival-breakfast')!,
      ),
    ),
    cult = world.cults[0],
    rival = cult.rivals[0];
  const cash = cult.cash,
    followers = cult.followers,
    quote = cultRivalQuote(cult, 'publicity');
  world = cultCommand(world, {
    type: 'cult-rival',
    cultId: cult.id,
    rivalId: rival.id,
    action: 'publicity',
    quotedCost: quote,
  });
  cult = world.cults[0];
  expect(cult.cash - cash).toBe(
    cult.joiningFee * BigInt(cult.followers - followers) - quote,
  );
});

test('ordinary recruitment grows past one thousand followers with only five real inner-circle NPCs', () => {
  let world = foundCult(undefined, {
      headquarters: 'sanctuary',
      philosophy: 'eternal-self',
      doctrines: ['reality-stutters', 'sleeping-genius'],
      rules: ['guest-night', 'family-day'],
    }),
    cult = world.cults[0];
  world = cultCommand(world, {
    type: 'cult-contribute',
    cultId: cult.id,
    amount: 100000000n,
  });
  world = cultCommand(world, {
    type: 'cult-beliefs',
    cultId: cult.id,
    leaderTitle: cult.leaderTitle,
    philosophy: 'eternal-self',
    doctrines: [
      'reality-stutters',
      'future-mail',
      'recycled-souls',
      'good-omens',
      'unfinished-world',
      'sleeping-genius',
    ],
    rules: [
      'guest-night',
      'weekly-letter',
      'volunteer-day',
      'public-rituals',
      'opt-out',
      'family-day',
    ],
  });
  for (let month = 0; month < 160 && world.cults[0].followers < 1200; month++)
    world = cultPeriod(world);
  cult = world.cults[0];
  expect(cult.status).toBe('active');
  expect(cult.followers).toBeGreaterThanOrEqual(1200);
  const ordinaryPeople = Object.keys(world.people).length;
  // Named members materialise only through the two deliberate recruitment drives.
  for (let i = 0; i < 2; i++) {
    cult = world.cults[0];
    world = cultCommand(world, {
      type: 'cult-recruit',
      cultId: cult.id,
      method: 'referral',
      quotedCost: cultAmount(cult, 10 + Math.floor(cult.followers / 500)),
    });
  }
  expect(world.cults[0].members).toHaveLength(5);
  expect(Object.keys(world.people)).toHaveLength(ordinaryPeople + 2);
  const fame = world.people[world.activePersonId].stats.fame;
  for (let i = 0; i < 6; i++) world = cultPeriod(world);
  expect(world.people[world.activePersonId].stats.fame).toBeGreaterThan(fame);
  expect(world.cults[0].members).toHaveLength(5);
  expect(world.cults[0].followers).toBeLessThanOrEqual(25000);
});
