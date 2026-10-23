import type { World } from '../model';
import { fullName } from '../personHelpers';
import {
  cultClaims,
  cultClaimRemedies,
  cultClaimOutcome,
  type CultClaimId,
} from '../content/cultClaims';
import {
  applyCultClaimImpact,
  applyCultClaimRemedy,
  cultClaimRemedyCost,
  cultClaimRemedyReason,
} from './cultClaimResponses';
import {
  cultStories,
  type CultStoryChoice,
  type CultStoryDefinition,
} from '../content/cultStories';
import { cultPhilosophies, cultRoleTitles } from '../content/cults';
import type { BoundChoice, RuntimeEffectRow } from '../runtime';
import { offerPending } from '../pendingQueue';
import { storyParticipants } from '../storyNames';
import { IneligibleAction } from '../errors';
import { bounded, draw, post } from './common';
import {
  cultMonthNumber,
  type Cult,
  type CultChoiceEffect,
  type CultMember,
  type CultThread,
} from './cultSchemas';
import {
  cultActionReason,
  cultAmount,
  cultBook,
  cultChangeFollowers,
  cultMemberPayment,
  cultMemberTrust,
  cultMemory,
  cultMoney,
  cultRecord,
  cultScandal,
  cultSpend,
} from './cultCore';
import {
  cultMemberLeaves,
  cultRivalArrives,
  newCultThread,
  scheduleCultCallback,
} from './cultThreads';
import { relationFor } from './relationshipQueries';
import { storyPersonPresent } from './storyContext';
import { recordCultMisappropriation } from './legal';
const outstanding = (thread: CultThread) =>
  thread.status === 'scheduled' || thread.status === 'offered';
function localMember(world: World, cult: Cult, role?: CultMember['role']) {
  return cult.members.find(
    (member) =>
      member.status === 'active' &&
      (!role || member.role === role) &&
      storyPersonPresent(world, world.people[member.personId]) &&
      world.people[member.personId].country === cult.country &&
      world.people[member.personId].city === cult.city,
  );
}
function relativeFor(world: World, cult: Cult) {
  const edge = world.relationships.find(
    (row) =>
      (row.from === cult.founderId || row.to === cult.founderId) &&
      (row.roles.includes('parent') ||
        row.roles.includes('sibling') ||
        row.romance === 'married') &&
      (() => {
        const person =
          world.people[row.from === cult.founderId ? row.to : row.from];
        return (
          person &&
          storyPersonPresent(world, person) &&
          person.country === cult.country &&
          person.city === cult.city
        );
      })(),
  );
  return edge
    ? world.people[edge.from === cult.founderId ? edge.to : edge.from]
    : undefined;
}
export function cultStoryContext(
  world: World,
  cult: Cult,
  definition: CultStoryDefinition,
) {
  if (
    (definition.rule && !cult.rules.includes(definition.rule)) ||
    (definition.doctrine && !cult.doctrines.includes(definition.doctrine)) ||
    (definition.minFollowers && cult.followers < definition.minFollowers)
  )
    return;
  const member = localMember(world, cult, definition.role);
  if (!member) return;
  const rival = cult.rivals.find((row) => row.status === 'active'),
    relative = relativeFor(world, cult);
  if (
    (definition.need === 'rival' && !rival) ||
    (definition.need === 'family' && !relative) ||
    (definition.need === 'ambition' &&
      (member.ambition < 60 || member.loyalty > 55)) ||
    (definition.need === 'payout' && cult.payouts === 0n) ||
    (definition.need === 'headquarters' &&
      cult.headquarters === 'meeting-room') ||
    (definition.need === 'contradiction' &&
      !(
        cult.rules.includes('public-rituals') &&
        cult.rules.includes('private-rituals')
      ))
  )
    return;
  return { member, rival, relative };
}
function bind(text: string, world: World, cult: Cult, thread: CultThread) {
  const member = world.people[thread.participantIds[0]],
    relative = world.people[thread.participantIds[1]],
    rival = cult.rivals.find((row) => row.status === 'active');
  return text
    .replaceAll('{member}', member ? fullName(member) : 'the inner circle')
    .replaceAll('{relative}', relative ? fullName(relative) : 'my relative')
    .replaceAll('{rival}', rival?.name ?? 'the rival organisation')
    .replaceAll(
      '{philosophy}',
      cultPhilosophies.find((row) => row.id === thread.philosophy)!.title,
    );
}
function boundCultChoice(
  world: World,
  cult: Cult,
  thread: CultThread,
  id: string,
  label: string,
  body: string,
  journal: string,
): BoundChoice {
  return {
    id,
    label,
    effects: [
      {
        kind: 'cult-choice',
        cultId: cult.id,
        threadId: thread.id,
        offerId: thread.offerId!,
        choiceId: id,
        ...(thread.kind === 'claim' ? { claimRevision: 2 as const } : {}),
      },
    ],
    resultTitle: 'Your organisation remembers',
    resultBody: bind(body, world, cult, thread),
    journal: bind(journal, world, cult, thread),
  };
}
export function offerCultThread(world: World, cult: Cult, thread: CultThread) {
  if (
    cult.lastSceneMonth === cultMonthNumber(world) ||
    cult.leaderId !== world.activePersonId ||
    world.people[world.activePersonId].died
  )
    return false;
  thread.status = 'offered';
  thread.offerId = thread.id + '_offer_' + thread.postponements;
  cult.lastSceneMonth = cultMonthNumber(world);
  const choices: BoundChoice[] =
    thread.kind === 'claim'
      ? [
          boundCultChoice(
            world,
            cult,
            thread,
            'admit',
            'Admit I was wrong',
            'You gave a plain answer. The failed promise remains on record.',
            'I admitted that my promised ' +
              thread.title.toLowerCase() +
              ' had not happened.',
          ),
          boundCultChoice(
            world,
            cult,
            thread,
            'postpone',
            'Say the date was wrong',
            'The promise is postponed for twelve months. It cannot be postponed again.',
            'I postponed my ' +
              thread.title.toLowerCase() +
              ' promise by twelve months.',
          ),
          boundCultChoice(
            world,
            cult,
            thread,
            cultClaimRemedies[thread.templateId as CultClaimId].id,
            cultClaimRemedies[thread.templateId as CultClaimId].label +
              (cultClaimRemedyCost(cult, thread) > 0n
                ? ' · ' + cultMoney(cult, cultClaimRemedyCost(cult, thread))
                : ''),
            cultClaimRemedies[thread.templateId as CultClaimId].result,
            cultClaimRemedies[thread.templateId as CultClaimId].journal,
          ),
        ]
      : cultStories
          .find((row) => row.id === thread.templateId)!
          .choices.map((choice) =>
            boundCultChoice(
              world,
              cult,
              thread,
              choice.id,
              choice.label,
              choice.result,
              choice.journal,
            ),
          );
  choices.push(
    boundCultChoice(
      world,
      cult,
      thread,
      'withdraw',
      'Leave it to the group',
      'The group carries on without an answer from you.',
      'I left ' + thread.title.toLowerCase() + ' for the group to handle.',
    ),
  );
  const roleOverrides = Object.fromEntries(
    cult.members.map((member) => [
      member.personId,
      cultRoleTitles[member.role].toLowerCase(),
    ]),
  );
  offerPending(
    world,
    {
      kind: 'decision',
      id: thread.offerId,
      templateId: 'cult-' + thread.templateId,
      title: thread.title,
      body: thread.body,
      illustration: thread.kind === 'claim' ? 'cult-claim' : 'cult-followers',
      personIds: [cult.founderId, ...thread.participantIds],
      participants: storyParticipants(
        world,
        thread.participantIds,
        roleOverrides,
      ),
      choices,
    },
    24,
  );
  return true;
}
function storyChoice(thread: CultThread, choiceId: string) {
  return cultStories
    .find((row) => row.id === thread.templateId)
    ?.choices.find((row) => row.id === choiceId);
}
export function cultChoiceReason(
  world: World,
  effect: CultChoiceEffect,
): string | undefined {
  const cult = world.cults.find((row) => row.id === effect.cultId),
    thread = cult?.threads.find((row) => row.id === effect.threadId);
  if (
    !cult ||
    cult.status !== 'active' ||
    cult.leaderId !== world.activePersonId ||
    !thread ||
    thread.status !== 'offered' ||
    thread.offerId !== effect.offerId
  )
    return 'This cult situation has already ended';
  if (effect.choiceId === 'withdraw') return;
  const unavailable = cultActionReason(world, cult);
  if (unavailable) return unavailable;
  if (thread.kind === 'claim') {
    const remedy = cultClaimRemedies[thread.templateId as CultClaimId];
    if (effect.claimRevision === 2 && effect.choiceId === remedy?.id)
      return cultClaimRemedyReason(world, cult, thread);
    if (
      ![
        'admit',
        'postpone',
        ...(effect.claimRevision === 2 ? [] : ['blame']),
      ].includes(effect.choiceId)
    )
      return 'Choose an available response';
    if (effect.choiceId === 'postpone' && thread.postponements >= 1)
      return 'This promise has already been postponed';
    if (
      effect.choiceId === 'blame' &&
      !cult.members.some(
        (row) =>
          row.personId === thread.participantIds[0] && row.status === 'active',
      )
    )
      return 'The named follower is no longer in the organisation';
  } else {
    const choice = storyChoice(thread, effect.choiceId);
    if (!choice) return 'Choose an available response';
    if (choice.costBps && cult.cash < cultAmount(cult, choice.costBps))
      return 'The treasury cannot cover this choice';
    if (choice.action === 'misuse' && cult.legalIncidents.length >= 64)
      return 'The organisation’s financial-offence history is full';
    if (choice.action === 'misuse' && cult.cash < 10n)
      return 'There are no funds available to divert';
  }
}
export function resolveCultChoice(
  world: World,
  effect: CultChoiceEffect,
): RuntimeEffectRow[] {
  const reason = cultChoiceReason(world, effect);
  if (reason) throw new IneligibleAction(reason);
  const cult = world.cults.find((row) => row.id === effect.cultId)!,
    thread = cult.threads.find((row) => row.id === effect.threadId)!,
    member = cult.members.find(
      (row) => row.personId === thread.participantIds[0],
    );
  const before = { loyalty: cult.loyalty, heat: cult.heat, cash: cult.cash };
  thread.response = effect.choiceId;
  thread.offerId = null;
  if (effect.choiceId === 'withdraw') {
    thread.status = 'cancelled';
    thread.outcome = 'cancelled';
    thread.settledMonth = cultMonthNumber(world);
    cult.loyalty = bounded(cult.loyalty - 3);
    cult.heat = bounded(cult.heat + 2);
  } else if (thread.kind === 'claim') {
    if (effect.choiceId === 'postpone') {
      thread.status = 'scheduled';
      thread.postponements = 1;
      thread.dueMonth = cultMonthNumber(world) + 12;
      thread.outcome = 'postponed';
      cult.heat = bounded(cult.heat + 4);
    } else {
      thread.status = 'resolved';
      thread.outcome = 'failure';
      thread.settledMonth = cultMonthNumber(world);
      if (
        effect.claimRevision === 2 &&
        effect.choiceId ===
          cultClaimRemedies[thread.templateId as CultClaimId].id
      ) {
        applyCultClaimRemedy(world, cult, thread);
      } else if (effect.claimRevision === 2 && effect.choiceId === 'admit') {
        const impact = cultClaimOutcome(
          thread.templateId as CultClaimId,
          false,
        );
        applyCultClaimImpact(
          world,
          cult,
          thread,
          {
            ...impact,
            reputation: (impact.reputation ?? 0) + 3,
            heat: Math.max(2, (impact.heat ?? 4) - 2),
          },
          'I acknowledged the failed ' +
            thread.title.toLowerCase() +
            ' promise.',
        );
      } else if (effect.choiceId === 'admit') {
        cult.loyalty = bounded(cult.loyalty - 4);
        cult.reputation = bounded(cult.reputation + 2);
        cultScandal(
          world,
          cult,
          'I admitted the failed ' + thread.title.toLowerCase() + ' promise.',
          thread.approach === 'double-down' ? 7 : 4,
        );
      } else {
        cult.loyalty = bounded(cult.loyalty - 2);
        cultScandal(
          world,
          cult,
          'I blamed a follower for my failed ' +
            thread.title.toLowerCase() +
            ' promise.',
          12,
        );
        if (member) {
          cultMemberTrust(world, member, -30);
          member.grievance = bounded(member.grievance + 30);
          cultMemory(
            world,
            cult,
            member,
            'blamed',
            'The leader blamed me for the failed ' +
              thread.title.toLowerCase() +
              ' promise.',
          );
          scheduleCultCallback(world, cult, member, 'accusation-return', 12);
        }
      }
    }
  } else {
    const choice = storyChoice(thread, effect.choiceId)!;
    thread.status = 'resolved';
    thread.outcome = 'success';
    thread.settledMonth = cultMonthNumber(world);
    if (choice.costBps) {
      const cost = cultAmount(cult, choice.costBps);
      if (choice.action === 'aid' && member)
        cultMemberPayment(world, cult, member, cost, 'Recorded member support');
      else cultSpend(world, cult, cost, 'story-cost', thread.title);
    }
    if (choice.incomeBps)
      cultBook(
        world,
        cult,
        cultAmount(cult, choice.incomeBps),
        'income',
        'story-income',
        thread.title,
      );
    cult.loyalty = bounded(cult.loyalty + (choice.loyalty ?? 0));
    cult.satisfaction = bounded(cult.satisfaction + (choice.satisfaction ?? 0));
    cult.reputation = bounded(cult.reputation + (choice.reputation ?? 0));
    if ((choice.heat ?? 0) >= 5)
      cultScandal(
        world,
        cult,
        bind(choice.journal, world, cult, thread),
        choice.heat!,
      );
    else cult.heat = bounded(cult.heat + (choice.heat ?? 0));
    if (choice.growth) {
      const joined = cultChangeFollowers(cult, choice.growth);
      if (joined > 0)
        cultBook(
          world,
          cult,
          cult.joiningFee * BigInt(joined),
          'income',
          'joining',
          'New members after a public situation',
        );
    }
    if (member) {
      cultMemberTrust(world, member, choice.memberLoyalty ?? 0);
      member.ambition = bounded(member.ambition + (choice.ambition ?? 0));
      cultMemory(
        world,
        cult,
        member,
        'story',
        bind(choice.journal, world, cult, thread),
      );
    }
    if (choice.action === 'relax') {
      const rule =
        thread.templateId === 'double-door-rule'
          ? 'private-rituals'
          : thread.ruleId;
      if (rule && cult.rules.includes(rule) && cult.rules.length > 2)
        cult.rules = cult.rules.filter((row) => row !== rule);
      else if (rule && cult.rules.includes(rule)) {
        const replacement = (
          ['family-day', 'opt-out', 'minute-silence'] as const
        ).find((row) => !cult.rules.includes(row));
        if (replacement)
          cult.rules = cult.rules.map((row) =>
            row === rule ? replacement : row,
          );
      }
    }
    if (thread.templateId === 'double-door-rule' && choice.id === 'closed')
      cult.rules = cult.rules
        .map((row) => (row === 'public-rituals' ? 'minute-silence' : row))
        .filter((row, index, all) => all.indexOf(row) === index);
    if (choice.action === 'humiliate' && member) {
      member.grievance = bounded(member.grievance + 25);
      scheduleCultCallback(world, cult, member, 'accusation-return', 12);
    }
    if (choice.action === 'expel' && member) {
      member.grievance = bounded(member.grievance + 30);
      cultMemberTrust(world, member, -30);
      cultMemberLeaves(world, cult, member, 'expelled');
    }
    if (choice.action === 'recruiter' && member)
      scheduleCultCallback(world, cult, member, 'recruiter-return', 8);
    if (choice.action === 'reconcile')
      for (const rival of cult.rivals.filter((row) => row.status === 'active'))
        rival.relationship = bounded(rival.relationship + 15);
    if (choice.action === 'misuse') {
      const amount =
          cult.cash / 10n < cultAmount(cult, 100)
            ? cult.cash / 10n
            : cultAmount(cult, 100),
        person = world.people[cult.founderId];
      post(
        world,
        amount,
        0n,
        'cult-misuse',
        cult.id + ': diverted communal funds',
        null,
        person,
        cult.currency,
      );
      cultBook(
        world,
        cult,
        -amount,
        'misuse',
        'diverted-funds',
        'Communal funds diverted to the leader',
        person.id,
        world.ledger.at(-1)!.id,
      );
      cult.legalIncidents.push(
        recordCultMisappropriation(
          world,
          person.id,
          amount,
          !!member && member.loyalty < 35,
        ).id,
      );
    }
  }
  cult.report.events.push(thread.title + ': ' + effect.choiceId);
  if (cult.report.events.length > 12) cult.report.events.shift();
  return [
    {
      id: 'cult-loyalty',
      label: 'Member loyalty',
      value:
        (cult.loyalty - before.loyalty >= 0 ? '+' : '') +
        (cult.loyalty - before.loyalty) +
        '%',
      tone: cult.loyalty >= before.loyalty ? 'positive' : 'negative',
    },
    {
      id: 'cult-heat',
      label: 'Public heat',
      value:
        (cult.heat - before.heat >= 0 ? '+' : '') +
        (cult.heat - before.heat) +
        '%',
      tone: cult.heat <= before.heat ? 'positive' : 'negative',
    },
    ...(cult.cash !== before.cash
      ? [
          {
            id: 'cult-cash',
            label: 'Treasury change',
            value: cultMoney(cult, cult.cash - before.cash),
            tone:
              cult.cash > before.cash
                ? ('positive' as const)
                : ('negative' as const),
          },
        ]
      : []),
  ];
}
function claimSucceeded(cult: Cult, thread: CultThread) {
  const definition = cultClaims.find((row) => row.id === thread.templateId)!;
  if (definition.test === 'impossible') return false;
  if (definition.test === 'chance')
    return thread.roll <= (definition.chance ?? 50);
  if (definition.test === 'ceremony') return thread.fulfilledMonth !== null;
  if (definition.test === 'workshop') return cult.upgrades.includes('workshop');
  if (definition.test === 'garden') return cult.upgrades.includes('garden');
  if (definition.test === 'recruitment')
    return cult.followers > thread.baseline.followers;
  if (definition.test === 'preach')
    return cult.sermons >= thread.baseline.sermons + 2;
  if (definition.test === 'fee-cut')
    return cult.recurringFee < thread.baseline.fees;
  return thread.fulfilledMonth !== null;
}
export function cultStoryMonth(world: World, cult: Cult) {
  const now = cultMonthNumber(world);
  for (const thread of cult.threads.filter(
    (row) => row.status === 'scheduled' && row.dueMonth <= now,
  )) {
    if (
      thread.participantIds.some(
        (id) => !world.people[id] || world.people[id].died,
      )
    ) {
      thread.status = 'cancelled';
      thread.outcome = 'cancelled';
      thread.settledMonth = now;
      continue;
    }
    if (thread.kind === 'callback') {
      if (thread.templateId === 'rival-return') {
        cultRivalArrives(world, cult, thread);
        continue;
      }
      const member = cult.members.find(
        (row) => row.personId === thread.participantIds[0],
      );
      thread.status = 'resolved';
      thread.settledMonth = now;
      if (!member) {
        thread.outcome = 'cancelled';
        thread.status = 'cancelled';
        continue;
      }
      const trust =
        relationFor(world, cult.founderId, member.personId)?.strength ?? 0;
      if (thread.templateId === 'recruiter-return') {
        if (
          member.status === 'active' &&
          (member.loyalty >= 55 || trust >= 60)
        ) {
          const joined = cultChangeFollowers(
            cult,
            Math.min(40, 5 + Math.floor(member.loyalty / 4)),
          );
          cultBook(
            world,
            cult,
            cult.joiningFee * BigInt(joined),
            'income',
            'joining',
            'Followers recruited by ' + fullName(world.people[member.personId]),
          );
          cultRecord(
            world,
            cult,
            fullName(world.people[member.personId]) +
              ' brought ' +
              joined +
              ' new followers through the broadcast I entrusted to them eight months ago.',
          );
          thread.outcome = 'success';
        } else {
          thread.outcome = 'failure';
          cultScandal(
            world,
            cult,
            'An old official broadcast became a criticism of the leadership.',
            10,
          );
          cultRecord(
            world,
            cult,
            fullName(world.people[member.personId]) +
              ' used the platform I gave them to criticise my leadership.',
          );
        }
      } else if (trust >= 65) {
        thread.outcome = 'success';
        cultRecord(
          world,
          cult,
          'My repaired relationship with ' +
            fullName(world.people[member.personId]) +
            ' kept an old public argument from becoming a scandal.',
        );
      } else {
        thread.outcome = 'failure';
        cultScandal(
          world,
          cult,
          fullName(world.people[member.personId]) +
            ' described an old humiliation in public.',
          16,
        );
        cultRecord(
          world,
          cult,
          fullName(world.people[member.personId]) +
            ' spoke publicly about how I treated them a year ago.',
        );
        if (member.status === 'active' && member.grievance > 45)
          cultMemberLeaves(world, cult, member, 'left');
      }
      continue;
    }
    if (thread.kind === 'claim') {
      const definition = cultClaims.find(
        (row) => row.id === thread.templateId,
      )!;
      if (claimSucceeded(cult, thread)) {
        thread.status = 'resolved';
        thread.outcome = 'success';
        thread.settledMonth = now;
        applyCultClaimImpact(
          world,
          cult,
          thread,
          cultClaimOutcome(definition.id, true),
        );
        cultRecord(
          world,
          cult,
          'My ' +
            thread.title.toLowerCase() +
            ' promise came due. ' +
            definition.successText,
        );
      } else if (
        definition.quiet &&
        thread.approach !== 'double-down' &&
        cult.heat < 60
      ) {
        thread.status = 'resolved';
        thread.outcome = 'failure';
        thread.settledMonth = now;
        applyCultClaimImpact(
          world,
          cult,
          thread,
          cultClaimOutcome(definition.id, false),
          'The ' + thread.title.toLowerCase() + ' promise failed.',
        );
        cultRecord(
          world,
          cult,
          'My ' +
            thread.title.toLowerCase() +
            ' promise failed. ' +
            definition.followup,
        );
      } else {
        thread.body =
          definition.followup +
          (thread.approach === 'double-down'
            ? ' You had insisted there was no room for doubt.'
            : thread.approach === 'viewing'
              ? ' Members remember paying for the viewing preparations.'
              : ' You had presented the prediction cautiously.');
        offerCultThread(world, cult, thread);
      }
    } else offerCultThread(world, cult, thread);
  }
  if (
    cultActionReason(world, cult) ||
    cult.lastSceneMonth === now ||
    cult.threads.some((row) => row.status === 'offered') ||
    cult.threads.filter((row) => outstanding(row) && row.kind === 'story')
      .length ||
    now % 3 !== cult.started.month % 3
  )
    return;
  const candidates = cultStories.filter(
    (definition) =>
      definition.source !== 'activity' &&
      now - (cult.storyLast[definition.id] ?? -1000) >= 36 &&
      cultStoryContext(world, cult, definition),
  );
  if (!candidates.length || draw(world, 'events', 1, 100) > 38) return;
  const weighted = candidates.flatMap((row) =>
      Array.from(
        {
          length:
            row.rarity === 'common' ? 5 : row.rarity === 'uncommon' ? 3 : 1,
        },
        () => row,
      ),
    ),
    definition = weighted[draw(world, 'events', 0, weighted.length - 1)],
    context = cultStoryContext(world, cult, definition)!;
  const ids = [
      context.member.personId,
      ...(definition.need === 'family' && context.relative
        ? [context.relative.id]
        : []),
    ],
    thread = newCultThread(world, cult, 'story', definition.id, now, ids);
  thread.ruleId = definition.rule ?? null;
  thread.doctrineId = definition.doctrine ?? null;
  thread.title = definition.title;
  thread.body = bind(definition.body, world, cult, thread);
  cult.storyLast[definition.id] = now;
  offerCultThread(world, cult, thread);
}
