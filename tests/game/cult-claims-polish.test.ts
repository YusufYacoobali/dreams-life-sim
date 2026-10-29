import { resolveCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import {
  copyWorld,
  decodeWorld,
  encodeWorld,
  validateWorld,
  type World,
} from '../../src/game/model';
import { monthFrom } from '../../src/game/calendar';
import {
  cultClaims,
  cultClaimRemedies,
  cultClaimChoiceSetValid,
  type CultClaimId,
} from '../../src/game/content/cultClaims';
import { cultDramaticStories } from '../../src/game/content/cultDramaticStories';
import {
  cultStoryContext,
  cultStoryMonth,
  offerCultThread,
} from '../../src/game/systems/cultEvents';
import {
  cultAmount,
  cultSpend,
  cultChangeFollowers,
  cultPayoutAvailable,
  cultFeeOptions,
} from '../../src/game/systems/cultCore';
import { cultClaimRemedyCost } from '../../src/game/systems/cultClaimResponses';
import { cultMonthNumber, type Cult } from '../../src/game/systems/cultSchemas';
import { newCultThread } from '../../src/game/systems/cultThreads';
import { accountFor } from '../../src/game/systems/common';
import { cultCommand, cultPeriod, foundCult } from '../support/cults';

function prepareClaim(
  id: CultClaimId,
  approach: 'double-down' | 'explain' = 'double-down',
) {
  const definition = cultClaims.find((row) => row.id === id)!;
  let world = foundCult(undefined, {
    philosophy: definition.philosophy as Cult['philosophy'],
    doctrines: [
      definition.doctrine,
      definition.doctrine === 'public-answers'
        ? 'borrowed-dreams'
        : 'public-answers',
    ],
  });
  const cultId = world.cults[0].id;
  world = cultCommand(world, {
    type: 'cult-contribute',
    cultId,
    amount: 2000000n,
  });
  world = cultCommand(world, {
    type: 'cult-claim',
    cultId,
    claim: id,
    approach,
  });
  world.cults[0].threads[0].roll = 100;
  return world;
}
function bringDue(input: World) {
  const world = copyWorld(input),
    cult = world.cults[0],
    thread = cult.threads.find((row) => row.kind === 'claim')!;
  const definition = cultClaims.find((row) => row.id === thread.templateId)!;
  world.date = monthFrom(thread.created, definition.months);
  cult.lastSceneMonth = null;
  cultStoryMonth(world, cult);
  return validateWorld(world);
}
function failedClaim(id: CultClaimId) {
  const world = bringDue(prepareClaim(id));
  expect(world.pending?.kind).toBe('decision');
  return world;
}
function choose(world: World, choiceId: string) {
  if (world.pending?.kind !== 'decision')
    throw Error('Expected a saved decision');
  return resolveCommand(world, {
    type: 'choose',
    eventId: world.pending.id,
    choiceId,
  });
}

test.each(cultClaims.map((row) => row.id))(
  '%s has a specific, persistent remedy with actual effects and no duplicate settlement',
  (id) => {
    const before = failedClaim(id),
      cult = before.cults[0],
      thread = cult.threads.find((row) => row.templateId === id)!;
    const remedy = cultClaimRemedies[id],
      event = before.pending;
    if (event?.kind !== 'decision') throw Error('Expected claim decision');
    expect(event.choices).toHaveLength(4);
    expect(event.choices.map((row) => row.id)).toEqual([
      'admit',
      'postpone',
      remedy.id,
      'withdraw',
    ]);
    expect(
      cultClaimChoiceSetValid(
        id,
        event.choices.map((row) => row.id),
      ),
    ).toBe(true);
    expect(
      event.choices.every(
        (row) =>
          row.effects[0].kind === 'cult-choice' &&
          row.effects[0].claimRevision === 2,
      ),
    ).toBe(true);
    expect(
      choiceUnavailable(
        before,
        event.choices.find((row) => row.id === remedy.id)!,
      ),
    ).toBeUndefined();
    const cost = cultClaimRemedyCost(cult, thread),
      personal = accountFor(before).cash,
      witnessId = thread.participantIds[0],
      witnessCash = accountFor(
        before,
        before.people[witnessId],
        cult.currency,
      ).cash;
    const restored = decodeWorld(encodeWorld(before));
    expect(restored).toEqual(before);
    const world = choose(restored, remedy.id),
      after = world.cults[0],
      settled = after.threads.find((row) => row.id === thread.id)!;
    expect(settled.status).toBe('resolved');
    expect(settled.outcome).toBe('failure'); // Keeping a late commitment does not rewrite its missed deadline.
    expect(settled.response).toBe(remedy.id);
    expect(after.cash).toBe(
      cult.cash - cost + (id === 'kettle-oracle' ? cultAmount(cult, 45) : 0n),
    );
    expect(accountFor(world).cash).toBe(personal);
    expect(after.cash).toBe(
      after.capital +
        after.income -
        after.expenses -
        after.payouts -
        after.distribution -
        after.misuse,
    );
    if (id === 'final-monday' || id === 'full-table')
      expect(
        accountFor(world, world.people[witnessId], cult.currency).cash,
      ).toBe(witnessCash + cultAmount(cult, id === 'final-monday' ? 80 : 120));
    if (id === 'sleeping-talent') expect(after.upgrades).toContain('workshop');
    if (id === 'memory-garden') expect(after.upgrades).toContain('garden');
    if (id === 'perfect-weather') expect(after.upgrades).toContain('hall');
    if (id === 'dream-visitor')
      expect([after.joiningFee, after.recurringFee]).toEqual([0n, 0n]);
    if (id === 'last-picnic' || id === 'full-table' || id === 'good-neighbour')
      expect(after.ceremonies).toBe(cult.ceremonies + 1);
    if (id === 'quiet-answer')
      expect(
        after.members.find((row) => row.personId === witnessId)!.role,
      ).toBe('adviser');
    expect(decodeWorld(encodeWorld(world))).toEqual(world);
    expect(() =>
      resolveCommand(world, {
        type: 'choose',
        eventId: event.id,
        choiceId: remedy.id,
      }),
    ).toThrow();
  },
);

test('an unaffordable practical remedy stays saved and cannot debit any account; withdrawal remains available', () => {
  const initial = failedClaim('sleeping-talent'),
    cult = initial.cults[0];
  cultSpend(
    initial,
    cult,
    cult.cash,
    'fixture-commitment',
    'Already committed communal expense',
  );
  const saved = encodeWorld(initial),
    event = initial.pending;
  if (event?.kind !== 'decision') throw Error('Expected claim decision');
  const remedy = event.choices.find((row) => row.id === 'build-workshop-now')!;
  expect(choiceUnavailable(initial, remedy)).toMatch(/treasury/i);
  expect(() => choose(initial, remedy.id)).toThrow(/treasury/i);
  expect(encodeWorld(initial)).toBe(saved);
  expect(choose(initial, 'withdraw').cults[0].threads[0].status).toBe(
    'cancelled',
  );
});

test('a witness in hospital cannot receive a claim ceremony role or an in-person compensation response', () => {
  const world = failedClaim('final-monday'),
    member = world.cults[0].members.find(
      (row) => row.personId === world.cults[0].threads[0].participantIds[0],
    )!;
  world.people[member.personId].health.hospitalizedUntil =
    cultMonthNumber(world) + 2;
  const before = encodeWorld(world);
  expect(() => choose(world, 'repay-lost-shift')).toThrow(
    /witness.*available/i,
  );
  expect(encodeWorld(world)).toBe(before);
  expect(choose(world, 'withdraw').cults[0].threads[0].status).toBe(
    'cancelled',
  );
});

test.each(['doctrines', 'rules'] as const)(
  'a failed promise never silently overwrites one of six unrelated %s',
  (field) => {
    let world = prepareClaim(
      field === 'doctrines' ? 'green-moon' : 'future-letter',
    );
    const cult = world.cults[0];
    const doctrines: Cult['doctrines'] = [
      'borrowed-dreams',
      'animal-observers',
      'wealth-receipts',
      'future-mail',
      'memory-garden',
      'sleeping-genius',
    ];
    const rules: Cult['rules'] = [
      'family-day',
      'friday-blue',
      'dream-journal',
      'minute-silence',
      'monthly-attendance',
      'uniform-robes',
    ];
    world = cultCommand(world, {
      type: 'cult-beliefs',
      cultId: cult.id,
      leaderTitle: cult.leaderTitle,
      philosophy: cult.philosophy,
      doctrines: field === 'doctrines' ? doctrines : cult.doctrines,
      rules: field === 'rules' ? rules : cult.rules,
    });
    world = bringDue(world);
    const saved = encodeWorld(world),
      original = [...world.cults[0][field]];
    expect(() =>
      choose(
        world,
        field === 'doctrines' ? 'invite-astronomer' : 'unseal-postbag',
      ),
    ).toThrow(/six.*slots.*full/i);
    expect(encodeWorld(world)).toBe(saved);
    expect(world.cults[0][field]).toEqual(original);
    expect(choose(world, 'admit').cults[0].threads[0].status).toBe('resolved');
  },
);

test('ordinary quiet failures remain quiet and their consequences differ with the actual promise', () => {
  const reboot = bringDue(prepareClaim('world-reboot', 'explain'));
  const garden = bringDue(prepareClaim('memory-garden', 'explain'));
  expect(reboot.cults[0].threads[0]).toMatchObject({
    status: 'resolved',
    outcome: 'failure',
  });
  expect(garden.cults[0].threads[0]).toMatchObject({
    status: 'resolved',
    outcome: 'failure',
  });
  expect(reboot.cults[0].loyalty).not.toBe(garden.cults[0].loyalty);
  expect(reboot.cults[0].followers).toBeLessThan(garden.cults[0].followers);
  expect(garden.cults[0].members[0].loyalty).toBeLessThan(
    reboot.cults[0].members[0].loyalty,
  );
});

test('a dramatic public leadership challenge expels the actual deputy and schedules that same person’s later rivalry', () => {
  const world = foundCult(undefined, { headquarters: 'woodland' }),
    cult = world.cults[0],
    deputy = cult.members.find((row) => row.role === 'deputy')!;
  // The scene requires a real ambitious deputy and a sufficiently large audience.
  cult.followers = 60;
  cult.report.gained += 60 - cult.report.followers;
  cult.report.followers = 60;
  deputy.ambition = 90;
  deputy.loyalty = 20;
  deputy.grievance = 60;
  const definition = cultDramaticStories.find(
    (row) => row.id === 'second-microphone',
  )!;
  expect(cultStoryContext(world, cult, definition)?.member.personId).toBe(
    deputy.personId,
  );
  cult.lastSceneMonth = null;
  const thread = newCultThread(
    world,
    cult,
    'story',
    definition.id,
    cultMonthNumber(world),
    [deputy.personId],
  );
  thread.title = definition.title;
  thread.body = definition.body;
  expect(offerCultThread(world, cult, thread)).toBe(true);
  const beforeFollowers = cult.followers;
  const resolved = choose(validateWorld(world), 'expel');
  expect(
    resolved.cults[0].members.find((row) => row.personId === deputy.personId)!
      .status,
  ).toBe('expelled');
  expect(resolved.cults[0].followers).toBeLessThan(beforeFollowers);
  expect(resolved.cults[0].threads).toContainEqual(
    expect.objectContaining({
      kind: 'callback',
      templateId: 'rival-return',
      participantIds: [deputy.personId],
      dueMonth: cultMonthNumber(world) + 24,
    }),
  );
});

test('the public payout story can expose a fresh real diversion through the existing court pipeline', () => {
  const fees = cultFeeOptions('US')[3];
  let world = foundCult(undefined, {
    headquarters: 'farmhouse',
    joiningFee: fees.joining,
    recurringFee: fees.recurring,
  });
  cultChangeFollowers(world.cults[0], 500 - world.cults[0].followers);
  for (let month = 0; month < 3; month++) world = cultPeriod(world);
  const amount = cultPayoutAvailable(world.cults[0]);
  expect(amount).toBeGreaterThan(0n);
  world = cultCommand(world, {
    type: 'cult-payout',
    cultId: world.cults[0].id,
    amount,
  });
  const cult = world.cults[0],
    member = cult.members.find((row) => row.role === 'treasurer')!;
  member.loyalty = 20;
  const definition = cultDramaticStories.find(
    (row) => row.id === 'payout-on-projector',
  )!;
  expect(cultStoryContext(world, cult, definition)?.member.personId).toBe(
    member.personId,
  );
  cult.lastSceneMonth = null;
  const thread = newCultThread(
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
  const personal = accountFor(world).cash;
  const resolved = choose(validateWorld(world), 'envelope'),
    organisation = resolved.cults[0];
  expect(organisation.misuse).toBeGreaterThan(0n);
  expect(accountFor(resolved).cash).toBe(personal + organisation.misuse);
  expect(organisation.legalIncidents).toHaveLength(1);
  const incident = resolved.incidents.find(
    (row) => row.id === organisation.legalIncidents[0],
  )!;
  expect(incident.offence).toBe('cult-fraud');
  expect(resolved.cases.some((row) => row.incidentId === incident.id)).toBe(
    true,
  );
  expect(decodeWorld(encodeWorld(resolved))).toEqual(resolved);
});

test('quarterly random selection cannot invent an activity incident when no routine action happened', () => {
  const base = foundCult(undefined, { headquarters: 'woodland' });
  cultChangeFollowers(base.cults[0], 100 - base.cults[0].followers);
  base.date = monthFrom(base.date, 1);
  let ordinaryScenes = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const world = copyWorld(base),
      cult = world.cults[0];
    cult.lastSceneMonth = null;
    world.random.events = seed;
    cultStoryMonth(world, cult);
    const stories = cult.threads.filter((row) => row.kind === 'story');
    expect(
      stories.every((row) => !row.templateId.startsWith('activity-')),
    ).toBe(true);
    ordinaryScenes += stories.length;
    validateWorld(world);
  }
  expect(ordinaryScenes).toBeGreaterThan(0);
});
