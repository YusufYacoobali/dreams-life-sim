import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import {
  decodeWorld,
  encodeWorld,
  validateWorld,
  type World,
} from '../../src/game/model';
import { rules } from '../../src/game/rules';
import {
  cultCeremonyIds,
  cultRecruitmentIds,
} from '../../src/game/content/cults';
import {
  cultCeremonyQuote,
  cultRecruitQuote,
} from '../../src/game/systems/cultCore';
import {
  cultReplacementCandidates,
  cultReplacementQuote,
  cultVacancyRoles,
} from '../../src/game/systems/cultRoster';
import { createContact } from '../../src/game/systems/npcs';
import { connectPerson } from '../../src/game/systems/relationships';
import { cultFixture, foundCult } from '../support/cults';

function settle(input: World, decisions: Set<string>, results: Set<string>) {
  let world = input,
    guard = 0;
  while (
    (world.pending || world.annual) &&
    !world.people[world.activePersonId].died &&
    guard++ < 200
  ) {
    const event = world.pending;
    if (event?.kind === 'decision') {
      decisions.add(event.templateId);
      const available = event.choices.filter(
        (choice) => !choiceUnavailable(world, choice),
      );
      const preferred = [
        'answer',
        'correct',
        'questions',
        'welcome',
        'decline',
        'doubt',
        'private',
        'plain',
        'credit',
        'laugh',
        'more',
        'stay',
        'discuss',
        'listen',
        'shared',
        'admit',
        'care',
        'remand',
      ];
      const choice =
        available.find((row) => preferred.includes(row.id)) ?? available[0];
      if (!choice)
        throw new Error('A saved journey decision has no available response');
      world = resolveCommand(world, {
        type: 'choose',
        eventId: event.id,
        choiceId: choice.id,
      });
    } else if (event) {
      results.add(event.title + ': ' + event.body);
      world = resolveCommand(world, {
        type: 'acknowledge',
        resultId: event.id,
      });
    } else world = resolveCommand(world, { type: 'resume' });
    world = decodeWorld(encodeWorld(world));
  }
  if (guard >= 200)
    throw new Error('Cult journey did not finish its saved progression');
  return world;
}

test.each(['US', 'GB', 'JP'] as const)(
  'six years of %s cult activities, promises, replacements and cold reloads remain coherent',
  (country) => {
    let world = foundCult(cultFixture(country), {
      headquarters: 'woodland',
      doctrines: ['moon-lessons', 'public-answers'],
    });
    // Arrange a known community, then use only real engine commands to manage it.
    for (let i = 0; i < 8; i++) {
      const contact = createContact(world, {
        age: 25 + i,
        country,
        city: world.cults[0].city,
      });
      connectPerson(world, contact.id);
    }
    world = validateWorld(world);
    const original = world.cults[0].members.map((member) => member.personId);
    const retired: string[] = [],
      decisions = new Set<string>(),
      results = new Set<string>();
    const command = (action: GameCommand) => {
      const before = encodeWorld(world),
        next = resolveCommand(world, action);
      expect(encodeWorld(world)).toBe(before);
      expect(encodeWorld(resolveCommand(world, action))).toBe(
        encodeWorld(next),
      );
      world = settle(decodeWorld(encodeWorld(next)), decisions, results);
    };
    for (let year = 0; year < 6; year++) {
      const cultId = world.cults[0].id;
      command({
        type: 'cult-contribute',
        cultId,
        amount: rules[country].baseWage / 10n,
      });
      const method = cultRecruitmentIds[year % cultRecruitmentIds.length];
      command({
        type: 'cult-recruit',
        cultId,
        method,
        quotedCost: cultRecruitQuote(world.cults[0], method),
      });
      command({ type: 'cult-preach', cultId });
      const ceremony = cultCeremonyIds[year % cultCeremonyIds.length];
      command({
        type: 'cult-ceremony',
        cultId,
        ceremony,
        quotedCost: cultCeremonyQuote(world.cults[0], ceremony),
      });
      if (year === 0)
        command({
          type: 'cult-claim',
          cultId,
          claim: 'green-moon',
          approach: 'explain',
        });
      if (year % 2 === 0) {
        const member = world.cults[0].members.find(
          (row) => row.status === 'active',
        )!;
        retired.push(member.personId);
        command({
          type: 'cult-member',
          cultId,
          personId: member.personId,
          action: 'expel',
        });
        const cult = world.cults[0],
          candidate = cultReplacementCandidates(world, cult).find(
            (person) =>
              !cult.members.some((member) => member.personId === person.id),
          ),
          role = cultVacancyRoles(cult)[0];
        if (!candidate)
          throw new Error(
            'The arranged local community has no new replacement candidate',
          );
        command({
          type: 'cult-fill-vacancy',
          cultId,
          personId: candidate.id,
          role,
          quotedCost: cultReplacementQuote(cult),
        });
      }
      command({ type: 'advance' });
      expect(world.people[world.activePersonId].died).toBeNull();
      const cult = world.cults[0];
      expect(cult.status).toBe('active');
      expect(
        cult.members.filter((row) => row.status === 'active').length,
      ).toBeLessThanOrEqual(5);
      expect(cult.cash).toBe(
        cult.capital +
          cult.income -
          cult.expenses -
          cult.payouts -
          cult.distribution -
          cult.misuse,
      );
    }
    const cult = world.cults[0];
    expect(cult.members.length).toBeGreaterThan(5);
    for (const id of [...original, ...retired]) {
      expect(cult.members.find((row) => row.personId === id)).toBeDefined();
      expect(world.people[id]).toBeDefined();
    }
    expect(
      cult.threads.find((thread) => thread.templateId === 'green-moon')?.status,
    ).toBe('resolved');
    expect([...decisions].some((id) => id.startsWith('cult-activity-'))).toBe(
      true,
    );
    expect(results.size).toBeGreaterThan(18);
    expect(decodeWorld(encodeWorld(world))).toEqual(world);
  },
  120000,
);
