import { monthFrom } from '../../src/game/calendar';
import { cultStories } from '../../src/game/content/cultStories';
import { resolveCommand } from '../../src/game/engine';
import {
  copyWorld,
  decodeWorld,
  encodeWorld,
  validateWorld,
  type World,
} from '../../src/game/model';
import { fullName } from '../../src/game/personHelpers';
import { randomInteger } from '../../src/game/random';
import {
  cultChangeFollowers,
  cultRecord,
} from '../../src/game/systems/cultCore';
import {
  cultStoryContext,
  cultStoryMonth,
  offerCultThread,
} from '../../src/game/systems/cultEvents';
import { cultMonthNumber } from '../../src/game/systems/cultSchemas';
import {
  newCultThread,
  scheduleCultCallback,
} from '../../src/game/systems/cultThreads';
import { relationFor } from '../../src/game/systems/relationshipQueries';
import { drainCult, foundCult } from '../support/cults';

const recruiterChoices = [
  ['phone-in-the-bell', 'broadcast'],
  ['merchandise-star', 'credit'],
  ['kettle-ownership-war', 'broadcast'],
  ['activity-comments-escape', 'reply'],
  ['activity-sermon-crown', 'share'],
  ['activity-open-house-visitor', 'host'],
  ['activity-grand-chair', 'platform'],
  ['activity-member-credit', 'credit'],
] as const;

function entrustRole(templateId: string, choiceId: string) {
  const definition = cultStories.find((row) => row.id === templateId)!;
  let world = foundCult(undefined, {
    headquarters: 'farmhouse',
    rules: [definition.rule ?? 'no-phones', 'open-books'],
    doctrines: [definition.doctrine ?? 'borrowed-dreams', 'public-answers'],
  });
  const cult = world.cults[0];
  // Keep all eight actual responsibility contexts eligible, including the
  // treasurer's sacred-kettle receipts and the deputy's public platform.
  // Use the membership helper so the existing report totals still reconcile.
  cultChangeFollowers(
    cult,
    Math.max(80, definition.minFollowers ?? 0) - cult.followers,
  );
  expect(definition.need).toBeUndefined();
  if (definition.role)
    expect(
      cult.members.some(
        (member) =>
          member.status === 'active' && member.role === definition.role,
      ),
    ).toBe(true);
  const context = cultStoryContext(world, cult, definition)!;
  expect(context).toBeDefined();
  const thread = newCultThread(
    world,
    cult,
    'story',
    templateId,
    cultMonthNumber(world),
    [context.member.personId],
  );
  thread.title = definition.title;
  thread.body = definition.body.replaceAll(
    '{member}',
    fullName(world.people[context.member.personId]),
  );
  thread.ruleId = definition.rule ?? null;
  thread.doctrineId = definition.doctrine ?? null;
  cult.lastSceneMonth = null;
  expect(offerCultThread(world, cult, thread)).toBe(true);
  world = decodeWorld(encodeWorld(validateWorld(world)));
  const offered = world.pending!;
  if (offered.kind !== 'decision') throw Error('Expected a real cult decision');
  const savedChoice = offered.choices.find((row) => row.id === choiceId)!;
  expect(savedChoice.effects).toEqual([
    {
      kind: 'cult-choice',
      cultId: cult.id,
      threadId: thread.id,
      offerId: thread.offerId,
      choiceId,
    },
  ]);
  const randomBefore = { ...world.random };
  world = resolveCommand(world, {
    type: 'choose',
    eventId: offered.id,
    choiceId,
  });
  // The existing scheduled callback draws its stored roll exactly once.
  expect(world.random).toEqual({
    ...randomBefore,
    events: randomInteger(randomBefore.events, 1, 100).state,
  });
  expect(world.pending?.kind === 'result' && world.pending.body).toBe(
    savedChoice.resultBody,
  );
  world = drainCult(world);
  const callback = world.cults[0].threads.find(
    (row) => row.templateId === 'recruiter-return',
  )!;
  expect(callback.participantIds).toEqual([context.member.personId]);
  expect(callback.dueMonth - cultMonthNumber(world)).toBe(8);
  expect(callback.title).toBe('You gave them ideas');
  expect(callback.status).toBe('scheduled');
  return { world, callbackId: callback.id, personId: context.member.personId };
}

function beforeDeadline(world: World) {
  world.date = monthFrom(world.date, 7);
  // Suppress unrelated random story selection, not the scheduled callback.
  world.cults[0].lastSceneMonth = cultMonthNumber(world);
  const before = encodeWorld(validateWorld(world));
  cultStoryMonth(world, world.cults[0]);
  expect(encodeWorld(world)).toBe(before);
  world.date = monthFrom(world.date, 1);
  world.cults[0].lastSceneMonth = cultMonthNumber(world);
}

test('the shared recruiter callback covers all eight real responsibility choices', () => {
  expect(
    cultStories.flatMap((story) =>
      story.choices
        .filter((choice) => choice.action === 'recruiter')
        .map((choice) => [story.id, choice.id]),
    ),
  ).toEqual(recruiterChoices);
});

describe.each(recruiterChoices)('%s / %s', (templateId, choiceId) => {
  test.each(['success', 'failure'] as const)(
    '%s remains truthful to the entrusted work and settles once after eight months',
    (outcome) => {
      const arranged = entrustRole(templateId, choiceId);
      const world = arranged.world;
      const cult = world.cults[0];
      const member = cult.members.find(
        (row) => row.personId === arranged.personId,
      )!;
      member.loyalty = outcome === 'success' ? 80 : 20;
      relationFor(world, cult.founderId, member.personId)!.strength = 20;
      beforeDeadline(world);
      const before = copyWorld(world);
      const followers = cult.followers;
      const name = fullName(world.people[member.personId]);
      const callback = cult.threads.find(
        (row) => row.id === arranged.callbackId,
      )!;
      const storedBinding = {
        id: callback.id,
        created: { ...callback.created },
        dueMonth: callback.dueMonth,
        participantIds: [...callback.participantIds],
        roll: callback.roll,
        title: callback.title,
        body: callback.body,
      };
      cultStoryMonth(world, cult);
      expect(callback).toMatchObject({
        ...storedBinding,
        status: 'resolved',
        outcome,
        settledMonth: cultMonthNumber(world),
      });
      expect(world.random).toEqual(before.random);
      expect(world.accounts).toEqual(before.accounts);
      expect(world.ledger).toEqual(before.ledger);
      expect(world.liabilities).toEqual(before.liabilities);
      if (outcome === 'success') {
        expect(cult.followers - followers).toBe(25);
        expect(cult.cash - before.cults[0].cash).toBe(cult.joiningFee * 25n);
        expect(cult.income - before.cults[0].income).toBe(
          cult.joiningFee * 25n,
        );
        expect(cult.book.at(-1)).toMatchObject({
          delta: cult.joiningFee * 25n,
          kind: 'income',
          category: 'joining',
          description: 'Followers recruited by ' + name,
        });
        expect(cult.scandals).toEqual(before.cults[0].scandals);
        expect(world.journal.at(-1)!.text).toBe(
          name +
            ' brought 25 new followers through the work I entrusted to them.',
        );
      } else {
        expect(cult.followers).toBe(followers);
        expect(cult.cash).toBe(before.cults[0].cash);
        expect(cult.book).toEqual(before.cults[0].book);
        expect(cult.heat - before.cults[0].heat).toBe(10);
        expect(cult.reputation - before.cults[0].reputation).toBe(-4);
        expect(cult.scandals.at(-1)).toMatchObject({
          severity: 10,
          reason:
            name +
            ' publicly criticised the leadership after being given more responsibility.',
        });
        expect(world.journal.at(-1)!.text).toBe(
          name +
            ' publicly criticised my leadership after I entrusted them with a bigger role.',
        );
      }
      expect(cult.report.events.at(-1)).toBe(world.journal.at(-1)!.text);
      expect(
        world.journal
          .slice(before.journal.length)
          .map((row) => row.text)
          .join(' '),
      ).not.toMatch(/broadcast|platform|eight months ago/i);
      expect(decodeWorld(encodeWorld(validateWorld(world)))).toEqual(world);
      const settled = encodeWorld(world);
      cultStoryMonth(world, cult);
      expect(encodeWorld(world)).toBe(settled);
    },
  );
});

test('literal saved callback titles and old journal text are preserved on reload and duplicate scheduling', () => {
  const { world, callbackId, personId } = entrustRole(
    'merchandise-star',
    'credit',
  );
  const cult = world.cults[0];
  const callback = cult.threads.find((row) => row.id === callbackId)!;
  // Arrange the old persisted strings explicitly; they must never be regenerated.
  callback.title = 'The broadcast grows up';
  const oldText =
    fullName(world.people[personId]) +
    ' brought 7 new followers through the broadcast I entrusted to them eight months ago.';
  cultRecord(world, cult, oldText);
  const saved = encodeWorld(validateWorld(world));
  const reloaded = decodeWorld(saved);
  expect(encodeWorld(reloaded)).toBe(saved);
  expect(
    reloaded.cults[0].threads.find((row) => row.id === callbackId)!.title,
  ).toBe('The broadcast grows up');
  expect(reloaded.journal.at(-1)!.text).toBe(oldText);
  expect(reloaded.cults[0].report.events.at(-1)).toBe(oldText);
  scheduleCultCallback(
    reloaded,
    reloaded.cults[0],
    reloaded.cults[0].members.find((row) => row.personId === personId)!,
    'recruiter-return',
    8,
  );
  expect(encodeWorld(reloaded)).toBe(saved);
});
