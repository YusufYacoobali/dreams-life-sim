import type { World } from '../model';
import { fullName } from '../personHelpers';
import { rules } from '../rules';
import { cultActivityStories } from '../content/cultActivities';
import {
  cultCeremonies,
  cultPhilosophies,
  cultRecruitment,
} from '../content/cults';
import { IneligibleAction } from '../errors';
import type { RuntimeEffectRow } from '../runtime';
import { active, bounded, draw, result } from './common';
import { cultMonthNumber, type Cult, type CultMember } from './cultSchemas';
import {
  cultBook,
  cultCapacity,
  cultCeremonyQuote,
  cultChangeFollowers,
  cultMemberTrust,
  cultModifiers,
  cultMoney,
  cultRecord,
  cultRecruitQuote,
  cultScandal,
  cultSpend,
} from './cultCore';
import { cultStoryContext, offerCultThread } from './cultEvents';
import { newCultThread, recordCultCeremonyPromises } from './cultThreads';
import { storyPersonPresent } from './storyContext';

type Recruitment = (typeof cultRecruitment)[number]['id'];
type Ceremony = (typeof cultCeremonies)[number]['id'];
type ActivityOpening = {
  loyalty: number;
  satisfaction: number;
  reputation: number;
  heat: number;
  cash: bigint;
};

export function cultLocalMembers(world: World, cult: Cult) {
  return cult.members.filter((member) => {
    const person = world.people[member.personId];
    return (
      member.status === 'active' &&
      person &&
      storyPersonPresent(world, person) &&
      person.country === cult.country &&
      person.city === cult.city
    );
  });
}

/** A routine incident is offered now or not created at all; it never queues stale visits. */
export function offerCultActivity(
  world: World,
  cult: Cult,
  storyId: string,
  opening: string,
  chance: number,
  personId?: string,
) {
  const now = cultMonthNumber(world);
  if (
    cult.lastSceneMonth === now ||
    cult.threads.some(
      (thread) =>
        thread.status === 'offered' ||
        (thread.kind === 'story' && thread.status === 'scheduled'),
    ) ||
    now - (cult.storyLast[storyId] ?? -1000) < 12
  )
    return false;
  const definition = cultActivityStories.find((story) => story.id === storyId);
  if (!definition)
    throw new Error('Unknown cult activity incident: ' + storyId);
  const context = cultStoryContext(world, cult, definition);
  if (!context) return false;
  const member = personId
    ? cultLocalMembers(world, cult).find(
        (row) =>
          row.personId === personId &&
          (!definition.role || row.role === definition.role),
      )
    : context.member;
  if (!member || draw(world, 'events', 1, 100) > chance) return false;
  const thread = newCultThread(world, cult, 'story', definition.id, now, [
    member.personId,
  ]);
  thread.ruleId = definition.rule ?? null;
  thread.doctrineId = definition.doctrine ?? null;
  thread.title = definition.title;
  thread.body =
    opening +
    '\n\n' +
    definition.body
      .replaceAll('{member}', fullName(world.people[member.personId]))
      .replaceAll(
        '{philosophy}',
        cultPhilosophies.find((row) => row.id === cult.philosophy)!.title,
      );
  cult.storyLast[definition.id] = now;
  if (!offerCultThread(world, cult, thread))
    throw new Error('The cult activity scene became unavailable');
  return true;
}

function opening(cult: Cult): ActivityOpening {
  return {
    loyalty: cult.loyalty,
    satisfaction: cult.satisfaction,
    reputation: cult.reputation,
    heat: cult.heat,
    cash: cult.cash,
  };
}

function activityEffects(
  cult: Cult,
  before: ActivityOpening,
): RuntimeEffectRow[] {
  const rows: RuntimeEffectRow[] = [];
  for (const [key, label, positive] of [
    ['loyalty', 'Loyalty', true],
    ['satisfaction', 'Satisfaction', true],
    ['reputation', 'Public reputation', true],
    ['heat', 'Public heat', false],
  ] as const) {
    const delta = cult[key] - before[key];
    if (delta)
      rows.push({
        id: 'cult-' + key,
        label,
        value: (delta > 0 ? '+' : '') + delta + '%',
        tone: delta > 0 === positive ? 'positive' : 'negative',
      });
  }
  if (cult.cash !== before.cash)
    rows.push({
      id: 'cult-cash',
      label: 'Treasury change',
      value: cultMoney(cult, cult.cash - before.cash),
      tone: cult.cash > before.cash ? 'positive' : 'negative',
    });
  return rows;
}

const recruitmentWriting: Record<
  Recruitment,
  { strong: string; modest: string; empty: string; incident: string }
> = {
  street: {
    strong:
      'People stop to ask questions rather than pretending to take a phone call. Your invitation travels further than the leaflets.',
    modest:
      'A few people take the invitation seriously. Most have somewhere to be, including one person who has walked past you twice.',
    empty:
      'You explain the movement to a bus queue. The bus arrives before anyone commits to another meeting.',
    incident: 'activity-street-question',
  },
  social: {
    strong:
      'The recruitment clip reaches people who are interested in the group, rather than people arguing about the chair behind you.',
    modest:
      'The clip finds a small audience. The most popular comment is still about the chair behind you.',
    empty:
      'The comments grow faster than the guest list. Nobody who clicks the invitation actually joins.',
    incident: 'activity-comments-escape',
  },
  'open-evening': {
    strong:
      'Visitors stay for the questions as well as the refreshments. The group feels more convincing with its doors open.',
    modest:
      'Some visitors return the membership forms. Others thank you for the refreshments and leave without inventing an excuse.',
    empty:
      'The visitors enjoy the refreshments. The membership forms remain admirably clean.',
    incident: 'activity-open-door',
  },
  referral: {
    strong:
      'Members invite people who actually trust them. The gathering feels like friends introducing friends.',
    modest:
      'A few friends of members decide to join. The others are still willing to share a table, which is useful too.',
    empty:
      'Members bring people who already know their best stories. The guests enjoy the company and decline membership.',
    incident: 'activity-referral-table',
  },
  publicity: {
    strong:
      'The stunt gets attention beyond the usual audience. Enough curious spectators stay to become followers.',
    modest:
      'People remember the stunt. Fewer remember the invitation attached to it.',
    empty:
      'The stunt attracts cameras and spectators. The spectators leave with their photographs rather than membership forms.',
    incident: 'activity-stunt-sponsor',
  },
};

export function runCultRecruitment(
  world: World,
  cult: Cult,
  method: Recruitment,
  quotedCost: bigint,
) {
  const quote = cultRecruitQuote(cult, method);
  if (quote !== quotedCost)
    throw new IneligibleAction('The recruitment quote changed');
  const before = opening(cult),
    person = active(world),
    definition = cultRecruitment.find((row) => row.id === method)!;
  cultSpend(world, cult, quote, 'recruitment', 'Recruitment: ' + method);
  const mods = cultModifiers(cult),
    pressure = Number(
      (cult.joiningFee * 10000n) / rules[cult.country].baseWage,
    );
  const recruiter = cultLocalMembers(world, cult).find(
    (row) => row.role === 'recruiter',
  );
  const fit =
    method === 'referral'
      ? Math.round((cult.loyalty + cult.satisfaction - 120) / 4)
      : method === 'open-evening'
        ? (cult.rules.includes('public-rituals') ? 10 : 0) -
          (cult.rules.includes('private-rituals') ? 14 : 0) +
          (cult.upgrades.includes('kitchen') ? 5 : 0)
        : method === 'publicity'
          ? (cult.upgrades.includes('monument') ? 10 : 0) -
            Math.floor(cult.heat / 5)
          : method === 'street'
            ? cult.rules.includes('walking-meetings')
              ? 8
              : 0
            : recruiter
              ? Math.floor(recruiter.loyalty / 10)
              : 0;
  const appeal = bounded(
    (person.stats.respect + person.skills.politics + person.publicLife.image) /
      3 +
      mods.growth / 10 +
      fit +
      (recruiter ? (recruiter.loyalty - 50) / 10 : 0) -
      cult.heat / 2 -
      pressure / 2,
  );
  const roll = draw(world, 'events', 1, 100);
  const joined = cultChangeFollowers(
    cult,
    Math.max(
      0,
      Math.floor(
        ((definition.reach + Math.min(50, Math.floor(cult.followers / 100))) *
          Math.max(0, appeal + roll - 50)) /
          100,
      ),
    ),
  );
  cultBook(
    world,
    cult,
    cult.joiningFee * BigInt(joined),
    'income',
    'joining',
    'Joining fees after recruitment',
  );
  cult.heat = bounded(
    cult.heat + definition.heat + (method === 'publicity' && roll < 25 ? 4 : 0),
  );
  cult.reputation = bounded(cult.reputation + (joined > 0 ? 2 : -1));
  const words = recruitmentWriting[method];
  const narrative =
    joined >= Math.ceil(definition.reach * 0.7)
      ? words.strong
      : joined
        ? words.modest
        : words.empty;
  const body =
    narrative +
    '\n\n' +
    joined +
    ' new followers joined; ' +
    cultMoney(cult, cult.joiningFee * BigInt(joined)) +
    ' in joining fees reached the treasury.' +
    (cult.followers >= cultCapacity(cult)
      ? ' The headquarters is at capacity.'
      : '');
  cultRecord(
    world,
    cult,
    'I recruited through ' +
      definition.title.toLowerCase() +
      '. ' +
      joined +
      ' new followers joined ' +
      cult.name +
      '.',
  );
  if (
    !offerCultActivity(
      world,
      cult,
      words.incident,
      body,
      35,
      recruiter?.personId,
    )
  )
    result(
      world,
      joined
        ? 'The invitation found its audience'
        : 'A recruitment drive without recruits',
      body,
      'cult-recruitment',
      activityEffects(cult, before),
    );
  return joined;
}

type SermonTone = 'engaged' | 'ordinary' | 'pushback';
const sermonWriting: Record<
  Cult['philosophy'],
  { topic: string; engaged: string; ordinary: string; pushback: string }
> = {
  'dream-archive': {
    topic: 'the lives hidden in dreams',
    engaged:
      'Members compare their dream accounts and find a detail worth discussing. Nobody needs to borrow your conclusion.',
    ordinary:
      'You discuss the dream accounts. One member asks whether falling asleep during the explanation counts as fieldwork.',
    pushback:
      'Two dream accounts contradict your explanation. Members would rather hear the accounts than another explanation of why they agree.',
  },
  'final-update': {
    topic: 'the supposed next version of reality',
    engaged:
      'Members use your update metaphor to suggest a change they can actually make. The meeting calendar gets repaired before reality does.',
    ordinary:
      'You discuss the next version of reality. The group agrees that the refreshments in this version are adequate.',
    pushback:
      'A member asks why reality needs an update when the microphone still does not work. The room sides with the microphone.',
  },
  'cosmic-accounting': {
    topic: 'what the group owes one another',
    engaged:
      'Members connect the talk to practical help they can give. The useful part of the balance sheet has names on it.',
    ordinary:
      'You explain the universe’s books. The treasurer quietly reminds everyone that rent is due in ordinary money.',
    pushback:
      'The talk turns toward what the universe owes you. Members want to know what their fees are paying for.',
  },
  'last-picnic': {
    topic: 'looking after people while there is still time',
    engaged:
      'The room leaves with practical plans to share meals and check on people. The end of the world can wait until the washing-up is done.',
    ordinary:
      'You discuss making time for one another. Several people make a firm commitment to the next lunch.',
    pushback:
      'Members ask why another speech about urgency has run forty minutes over. Their lunches have not survived the apocalypse.',
  },
  'chosen-lost': {
    topic: 'what hidden knowledge is actually useful for',
    engaged:
      'A quiet member connects the discussion to a problem the group can solve. They get the credit for noticing it.',
    ordinary:
      'You discuss the group’s hidden knowledge. Someone suggests labelling the cupboard where you keep it.',
    pushback:
      'Members ask for one useful example of the hidden knowledge. You discover that a pause can feel much longer than a revelation.',
  },
  'eternal-self': {
    topic: 'understanding yourself without making it everyone else’s job',
    engaged:
      'Members recognise themselves in the discussion and talk to one another instead of watching you. The room is better for it.',
    ordinary:
      'You discuss knowing yourself. One member confidently announces that they are hungry.',
    pushback:
      'The talk becomes a catalogue of your own achievements. The room has heard this particular journey inward before.',
  },
  'quiet-orbit': {
    topic: 'what the quieter members have noticed',
    engaged:
      'You leave room for a hesitant member to speak. Their account changes the direction of the meeting.',
    ordinary:
      'The quiet gathering stays quiet. People leave rested, with very little need to quote you.',
    pushback:
      'You explain silence at considerable length. Several members begin practising it on your behalf.',
  },
  'ordinary-miracles': {
    topic: 'ordinary things that have mattered to people',
    engaged:
      'Members tell each other specific stories about help that arrived when they needed it. The useful details survive the meeting.',
    ordinary:
      'You ask for ordinary miracles. A member describes finding an exact parking space, and refuses to be hurried.',
    pushback:
      'The discussion asks members to be grateful for things they have worked hard to survive. A few people would prefer practical help.',
  },
};

export function cultSermonChance(world: World, cult: Cult) {
  const person = active(world),
    members = cultLocalMembers(world, cult);
  const adviser = members.find((row) => row.role === 'adviser');
  const doubt = members.some(
    (row) => row.personality === 'sceptic' && row.loyalty < 45,
  )
    ? 6
    : 0;
  return Math.max(
    25,
    Math.min(
      90,
      Math.round(
        47 +
          person.skills.politics / 8 +
          person.stats.respect / 10 +
          cult.loyalty / 10 -
          cult.heat / 5 -
          (100 - cult.satisfaction) / 12 -
          person.stats.stress / 15 +
          (adviser && adviser.loyalty >= 65 ? 5 : 0) -
          doubt,
      ),
    ),
  );
}

export function runCultPreaching(world: World, cult: Cult) {
  const before = opening(cult),
    person = active(world),
    chance = cultSermonChance(world, cult),
    roll = draw(world, 'events', 1, 100);
  const tone: SermonTone =
    roll <= Math.floor(chance * 0.45)
      ? 'engaged'
      : roll <= chance
        ? 'ordinary'
        : 'pushback';
  const loyalty = tone === 'engaged' ? 4 : tone === 'ordinary' ? 1 : -2;
  const satisfaction = tone === 'engaged' ? 3 : tone === 'ordinary' ? 1 : -1;
  cult.sermons++;
  person.stats.energy = bounded(person.stats.energy - 5);
  cult.loyalty = bounded(cult.loyalty + loyalty);
  cult.satisfaction = bounded(cult.satisfaction + satisfaction);
  cult.reputation = bounded(cult.reputation + (tone === 'engaged' ? 1 : 0));
  cult.heat = bounded(cult.heat + (tone === 'pushback' ? 1 : 0));
  for (const member of cultLocalMembers(world, cult))
    cultMemberTrust(
      world,
      member,
      tone === 'engaged' ? 2 : tone === 'ordinary' ? 1 : -2,
    );
  const words = sermonWriting[cult.philosophy],
    narrative = words[tone];
  cultRecord(
    world,
    cult,
    'I spoke about ' +
      words.topic +
      '. ' +
      (tone === 'engaged'
        ? 'Members carried the discussion themselves.'
        : tone === 'ordinary'
          ? 'The gathering was calm.'
          : 'Members challenged the sermon.'),
  );
  const deputy = cultLocalMembers(world, cult).find(
    (row) => row.role === 'deputy',
  );
  const story =
    cult.philosophy === 'cosmic-accounting' ||
    cult.doctrines.includes('wealth-receipts')
      ? 'activity-sermon-audit'
      : deputy && (deputy.ambition >= 60 || cult.rules.includes('leader-first'))
        ? 'activity-sermon-crown'
        : 'activity-sermon-question';
  const body =
    narrative +
    '\n\nLoyalty is now ' +
    cult.loyalty +
    '%; satisfaction is ' +
    cult.satisfaction +
    '%.';
  if (
    !offerCultActivity(world, cult, story, body, tone === 'pushback' ? 42 : 18)
  )
    result(
      world,
      tone === 'engaged'
        ? 'A sermon people carried with them'
        : tone === 'ordinary'
          ? 'A useful gathering'
          : 'The questions lasted longer',
      body,
      'cult-philosophy',
      activityEffects(cult, before),
    );
}

const ceremonyWriting: Record<
  Ceremony,
  { success: string; ordinary: string; failure: string; incident: string }
> = {
  'dream-circle': {
    success:
      'The circle finds a common thread without forcing everyone’s dreams to agree. The quietest account gets the longest discussion.',
    ordinary:
      'The dream circle hears everyone out. One account is mostly about a sandwich, but it is their sandwich.',
    failure:
      'Several people are talked over while you explain their own dreams to them. The circle ends with more notes than agreement.',
    incident: 'activity-dream-copy',
  },
  'quiet-table': {
    success:
      'The quiet gathering gives tired members room to breathe. Nobody feels obliged to turn the silence into a performance.',
    ordinary:
      'People sit together in a silence that mostly survives the folding chairs. They leave more rested than they arrived.',
    failure:
      'Instructions about the correct silence take longer than the silence itself. Several members leave with headaches.',
    incident: 'activity-quiet-alarm',
  },
  'community-supper': {
    success:
      'The supper brings members and neighbours to the same table. Plates return empty and conversations continue after the food.',
    ordinary:
      'The supper gets people fed. The food is ordinary, which turns out to be a perfectly respectable quality for dinner.',
    failure:
      'The supper runs short and late. An apology is offered much more efficiently than a second helping.',
    incident: 'activity-supper-seats',
  },
  starlight: {
    success:
      'The vigil gets a clear, patient look at the sky. People leave with actual observations rather than a borrowed prophecy.',
    ordinary:
      'The vigil stays with the sky long enough to notice something. Members agree that warm clothing also deserves a little reverence.',
    failure:
      'The vigil produces cold feet, confused directions and little worth seeing. Members have spent the evening trying to find the evening.',
    incident: 'activity-starlight-camera',
  },
  'open-house': {
    success:
      'Visitors see a group that can answer questions without closing its doors. Members are proud to show them around.',
    ordinary:
      'Visitors get a plain look at the group’s meetings and expenses. Curiosity survives the refreshments.',
    failure:
      'The open house feels like a closed meeting with strangers in it. Visitors are shown the refreshments more readily than the answers.',
    incident: 'activity-open-house-visitor',
  },
  'grand-promise': {
    success:
      'The advertised gathering actually comes together. Responsibilities are shared, guests find seats and the promises meet an audience.',
    ordinary:
      'The gathering is ambitious and occasionally untidy, but it happens. People see the work behind the announcement.',
    failure:
      'The grand gathering is too large for its arrangements. Members queue for an event they are also supposed to be organising.',
    incident: 'activity-grand-chair',
  },
};

/** Prepared premises and a trusted organiser matter more than a generous hidden roll. */
export function cultCeremonyChance(
  world: World,
  cult: Cult,
  ceremony: Ceremony,
) {
  const organiser = cultLocalMembers(world, cult).find(
    (row) => row.role === 'organiser',
  );
  let fit = 0;
  if (ceremony === 'dream-circle')
    fit =
      (cult.philosophy === 'dream-archive' ? 7 : 0) +
      (cult.rules.includes('dream-journal') ? 6 : 0);
  if (ceremony === 'quiet-table')
    fit =
      (cult.philosophy === 'quiet-orbit' ? 7 : 0) +
      (cult.rules.includes('minute-silence') ? 5 : 0) +
      (cult.upgrades.includes('garden') ? 5 : 0);
  if (ceremony === 'community-supper')
    fit =
      (cult.upgrades.includes('kitchen') ? 11 : 0) +
      (cult.rules.includes('monthly-dinner') ||
      cult.rules.includes('mutual-aid')
        ? 5
        : 0);
  if (ceremony === 'starlight')
    fit =
      (cult.headquarters !== 'meeting-room' ? 6 : -4) +
      (cult.doctrines.includes('moon-lessons') ? 5 : 0);
  if (ceremony === 'open-house')
    fit =
      (cult.rules.includes('public-rituals') ? 8 : 0) -
      (cult.rules.includes('private-rituals') ? 15 : 0) +
      (cult.rules.includes('open-books') ? 4 : 0);
  if (ceremony === 'grand-promise')
    fit =
      (cult.upgrades.includes('monument') ? 6 : 0) -
      Math.min(8, Math.floor(cult.followers / 2000));
  const chance =
    59 +
    Math.round((cult.satisfaction - 50) / 5) +
    Math.floor(cult.reputation / 12) +
    (organiser ? Math.round((organiser.loyalty - 45) / 6) : -8) +
    (cult.upgrades.includes('hall') ? 7 : 0) +
    fit -
    Math.floor(cult.heat / 4);
  return Math.max(25, Math.min(90, chance));
}

export function runCultCeremony(
  world: World,
  cult: Cult,
  ceremony: Ceremony,
  quotedCost: bigint,
) {
  const quote = cultCeremonyQuote(cult, ceremony);
  if (quote !== quotedCost)
    throw new IneligibleAction('The ceremony quote changed');
  const before = opening(cult),
    definition = cultCeremonies.find((row) => row.id === ceremony)!;
  cultSpend(world, cult, quote, 'ceremony', 'Ceremony: ' + ceremony);
  const chance = cultCeremonyChance(world, cult, ceremony),
    roll = draw(world, 'events', 1, 100),
    success = roll <= chance,
    outstanding = success && roll <= Math.floor(chance * 0.45);
  cult.ceremonies++;
  cult.lastCeremony = { id: ceremony, month: cultMonthNumber(world), success };
  recordCultCeremonyPromises(world, cult, ceremony, success);
  cult.loyalty = bounded(
    cult.loyalty + (success ? definition.loyalty + (outstanding ? 1 : 0) : -4),
  );
  cult.satisfaction = bounded(
    cult.satisfaction +
      (success ? definition.satisfaction + (outstanding ? 2 : 0) : -5),
  );
  const publicGathering =
    ['community-supper', 'open-house', 'grand-promise'].includes(ceremony) ||
    cult.rules.includes('public-rituals');
  cult.reputation = bounded(
    cult.reputation +
      (success
        ? definition.reputation + (outstanding ? 1 : 0)
        : publicGathering
          ? -3
          : 0),
  );
  const ordinary = Math.max(
    0,
    cult.followers -
      cult.members.filter((row) => row.status === 'active').length,
  );
  const proceeds = success
    ? (rules[cult.country].baseWage *
        BigInt(ordinary) *
        BigInt(outstanding ? 5 : 4)) /
      200000n
    : 0n;
  cultBook(
    world,
    cult,
    proceeds,
    'income',
    'ceremony',
    'Voluntary ceremony contributions',
  );
  for (const member of cultLocalMembers(world, cult))
    cultMemberTrust(
      world,
      member,
      success
        ? member.role === 'organiser'
          ? 3
          : 1
        : member.role === 'organiser'
          ? -2
          : -1,
    );
  if (!success && publicGathering)
    cultScandal(
      world,
      cult,
      definition.title + ' disappointed its actual guests.',
      ceremony === 'grand-promise' ? 8 : 5,
    );
  const words = ceremonyWriting[ceremony],
    narrative = success
      ? outstanding
        ? words.success
        : words.ordinary
      : words.failure;
  cultRecord(
    world,
    cult,
    'I held ' +
      definition.title.toLowerCase() +
      '. ' +
      (success
        ? 'The gathering worked.'
        : 'The arrangements failed the guests.'),
  );
  const body =
    narrative +
    '\n\nThe event cost ' +
    cultMoney(cult, quote) +
    '; voluntary contributions were ' +
    cultMoney(cult, proceeds) +
    '.';
  const canDescribeIncident =
    success ||
    ceremony === 'community-supper' ||
    ceremony === 'open-house' ||
    ceremony === 'grand-promise';
  if (
    !canDescribeIncident ||
    !offerCultActivity(world, cult, words.incident, body, success ? 30 : 50)
  )
    result(
      world,
      success
        ? outstanding
          ? definition.title + ': worth the work'
          : definition.title + ': a gathering held'
        : definition.title + ': a difficult evening',
      body,
      'cult-ceremony',
      activityEffects(cult, before),
    );
}

export function cultMemberResponse(
  member: CultMember,
  action:
    | 'talk'
    | 'praise'
    | 'promote'
    | 'assign'
    | 'reward'
    | 'confront'
    | 'expel',
) {
  const role = member.role;
  if (action === 'talk')
    return member.grievance >= 30
      ? 'They come back to the old dispute. Listening helps; the record of what happened remains.'
      : member.personality === 'sceptic'
        ? 'They ask a pointed question and wait for an actual answer.'
        : member.personality === 'opportunist'
          ? 'They ask where the group is going and whether there is a larger role in it.'
          : 'They talk about the people they have been working beside, rather than giving another speech.';
  if (action === 'praise')
    return member.ambition >= 70
      ? 'They accept the thanks and ask whether the next public announcement can name them.'
      : role === 'treasurer'
        ? 'They seem pleased that someone has noticed the work behind the accounts.'
        : role === 'organiser'
          ? 'They mention the people who stayed late to put the room back together.'
          : 'The praise matters because it names their responsibility rather than treating them as part of the crowd.';
  if (action === 'reward')
    return member.grievance >= 30
      ? 'The support reaches their real account. It helps with practical needs without erasing the old argument.'
      : member.personality === 'opportunist'
        ? 'They thank you, check the amount and ask what responsibility comes next.'
        : 'They receive the support directly and know which communal funds paid for it.';
  if (action === 'confront')
    return member.loyalty >= 65
      ? 'A previously loyal member is hurt by the public criticism. They remember who was watching.'
      : 'They answer sharply. The disagreement now has witnesses as well as a history.';
  if (action === 'expel')
    return 'They leave the organisation with their own identity, relationships and memory of this decision.';
  return 'Their changed responsibility is now part of the group’s actual leadership record.';
}

export function offerCultMemberActivity(
  world: World,
  cult: Cult,
  member: CultMember,
  action: string,
  opening: string,
) {
  if (member.status !== 'active') return false;
  if (action === 'talk' && member.grievance >= 30 && member.loyalty < 50)
    return offerCultActivity(
      world,
      cult,
      'activity-member-warning',
      opening,
      45,
      member.personId,
    );
  if (action === 'praise' && member.ambition >= 70)
    return offerCultActivity(
      world,
      cult,
      'activity-member-credit',
      opening,
      35,
      member.personId,
    );
  return false;
}
