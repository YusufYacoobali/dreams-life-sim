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
      "You get people to stop and listen. One wants to know about dental care. You steer the conversation back to your beliefs.",
    modest:
      'You squeeze a pitch between people dodging your leaflets. One passer-by changes direction twice to avoid your explanation.',
    empty:
      'You finish your pitch to a bus queue just as the bus arrives. Everyone finds somewhere else to be.',
    incident: 'activity-street-question',
  },
  social: {
    strong:
      'Your clip brings in recruits. The comments demand a longer explanation of your beliefs and a shorter explanation of your hair.',
    modest:
      'Your clip finds an interested audience. Most commenters still prefer arguing with one another under your invitation.',
    empty:
      'Your clip gets comments, arguments and an unsolicited haircut suggestion. It gets no recruits.',
    incident: 'activity-comments-escape',
  },
  'open-evening': {
    strong:
      "Visitors sign up after your talk. One tries to finish the refreshments before their enlightenment begins.",
    modest:
      'You get a signed form. Other visitors thank you for the refreshments with the firm politeness of people refusing a second date.',
    empty:
      'Visitors eat the refreshments and leave. You have persuaded them to accept snacks.',
    incident: 'activity-open-door',
  },
  referral: {
    strong:
      'Your followers’ friends join. You deliver the welcome while the people who invited them look relieved that you are behaving yourself.',
    modest:
      'A guest fills in a form. Conversations at the table become much more careful once the membership pitch starts.',
    empty:
      'Your followers bring friends. The friends enjoy seeing them and decline to turn the friendship into a membership.',
    incident: 'activity-referral-table',
  },
  publicity: {
    strong:
      "Your stunt turns spectators into recruits. A bystander declines to stand any closer while taking a form.",
    modest:
      'Your stunt interests would-be recruits. Most spectators leave with a photograph and a story they intend to tell at your expense.',
    empty:
      'You attract cameras, spectators and no recruits. People enjoy watching you without wanting to become your responsibility.',
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
    (joined === 1 ? ' new follower joined; ' : ' new followers joined; ') +
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
      (joined === 1 ? ' new follower joined ' : ' new followers joined ') +
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
        ? "Your newest followers"
        : "Not a single convert",
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
      'You describe a life hidden in a dream. Followers start comparing their own, talking over you to explain which alternate self had the worst marriage.',
    ordinary:
      "You explain dream messages. A follower shuts their eyes and calls it research.",
    pushback:
      'You interpret a follower’s dream. They correct you in front of everyone, then correct your interpretation of the correction.',
  },
  'final-update': {
    topic: 'the coming update to reality',
    engaged:
      'You promise that reality can improve. Followers shout suggestions until someone demands a version without your longer speeches.',
    ordinary:
      "You describe the next version of reality. A follower makes you promise it will accept their existing membership.",
    pushback:
      'You explain how reality will improve. Someone asks why your microphone still sounds like that. The room wants that answered first.',
  },
  'cosmic-accounting': {
    topic: 'what the universe owes us',
    engaged:
      'You declare that the universe owes everyone. Followers cheer and begin listing what they intend to collect. You struggle to regain the floor.',
    ordinary:
      'You explain the universe’s accounts. Your treasurer reminds the room that the rent still requires money from this universe.',
    pushback:
      'You discuss what the cosmos owes you. Followers ask what you owe them for sitting through this.',
  },
  'last-picnic': {
    topic: 'making the most of the time left',
    engaged:
      'You speak about the time everyone has left. Followers draw closer and start discussing whom they want at the next meal.',
    ordinary:
      "You discuss preparing for the end. A follower moves the discussion firmly towards lunch.",
    pushback:
      'You say there is no time to waste. Someone points out how long you have been saying it.',
  },
  'chosen-lost': {
    topic: 'the truth only the chosen know',
    engaged:
      'You tell the room it holds knowledge the world lacks. Followers sit straighter and begin offering to explain things to one another.',
    ordinary:
      "You hint at a hidden truth. Followers wait through the break for you to reveal it.",
    pushback:
      'You promise hidden knowledge. A follower demands one example. The pause grows long enough for others to repeat the question.',
  },
  'eternal-self': {
    topic: 'the perfect self waiting inside us',
    engaged:
      'You describe the person each follower could become. People start confiding in one another until you have to ask for their attention back.',
    ordinary:
      'You ask everyone to look deep inside themselves. A follower announces that they have found hunger.',
    pushback:
      'You describe your own journey towards perfection. A follower asks how far you still have to go.',
  },
  'quiet-orbit': {
    topic: 'hearing what silence has to say',
    engaged:
      'You stop speaking and let the room listen. A hesitant follower starts talking. This time nobody interrupts them.',
    ordinary:
      'You keep the sermon short and leave room for silence. Several followers look pleased by this particular teaching.',
    pushback:
      'You explain silence for so long that followers begin practising it while looking pointedly at you.',
  },
  'ordinary-miracles': {
    topic: 'miracles hiding in everyday life',
    engaged:
      'You ask for stories of small miracles. Followers compete to tell theirs until you have a queue of people insisting theirs sounds least believable.',
    ordinary:
      'You ask for a small miracle. A follower describes finding a parking space in enough detail to use up the sermon.',
    pushback:
      'You call everyday struggles blessings in disguise. Someone asks which blessing is meant to cover their bills.',
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
        ? "I got the room talking."
        : tone === 'ordinary'
          ? "I held their attention through the sermon."
          : "I faced questions I could not easily answer."),
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
        ? "You have their attention"
        : tone === 'ordinary'
          ? "The sermon is over"
          : "They would like an answer",
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
      "You get the room comparing dreams until a usually silent follower has everyone listening. They start another account before you can close the circle.",
    ordinary:
      'You hear everyone’s dream. One is an elaborate account of making a sandwich. You wait for the revelation; it is the sandwich.',
    failure:
      'You keep explaining what followers’ dreams meant. They start explaining why you are wrong. The circle breaks up before you can settle it.',
    incident: 'activity-dream-copy',
  },
  'quiet-table': {
    success:
      'You let the silence hold. Shoulders drop around the table. Someone starts to thank you, then thinks better of it.',
    ordinary:
      'You sit through a peaceful silence, broken mainly by the chairs. Followers leave looking less exhausted.',
    failure:
      'You give so many instructions about silence that the gathering ends with followers rubbing their temples.',
    incident: 'activity-quiet-alarm',
  },
  'community-supper': {
    success:
      'You get members and neighbours eating together. People linger over empty plates and ask when you are doing this again.',
    ordinary:
      'You serve the supper. Everyone eats, and the loudest dispute concerns who gets the last helping.',
    failure:
      'You run late and short of food. Guests ask for a second helping and receive your increasingly careful apology.',
    incident: 'activity-supper-seats',
  },
  starlight: {
    success:
      'You guide followers through a clear sky. People keep pointing things out after the vigil ends and forget to ask you to explain their significance.',
    ordinary:
      'You watch the sky with the group. A follower proposes a warm coat as the evening’s most convincing source of protection.',
    failure:
      'You point confidently in the wrong direction. Cold followers turn back and forth until someone asks when you intend to identify the car park.',
    incident: 'activity-starlight-camera',
  },
  'open-house': {
    success:
      'You let visitors look around and answer their questions. Members join in, eager to show off the place even when you are trying to finish the tour.',
    ordinary:
      'You show visitors the meetings and expenses. They stay curious after the refreshments run out.',
    failure:
      'You welcome visitors and dodge their questions. They stop asking you and start exchanging looks with one another.',
    incident: 'activity-open-house-visitor',
  },
  'grand-promise': {
    success:
      'You deliver the big gathering you advertised. Guests find seats, the programme holds together and followers cheer without waiting for your cue.',
    ordinary:
      'You get the gathering through its untidy moments. Followers help you finish instead of asking when they can leave.',
    failure:
      'You lose control of the arrangements. Followers queue for the gathering while being asked to help organise it. Nobody looks grateful for the opportunity.',
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
        ? "I got the gathering through its programme."
        : "I let down the people who came."),
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
          ? definition.title + ": a crowd worth having"
          : definition.title + ": you pulled it off"
        : definition.title + ": they expected better",
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
      ? "They bring up the old argument before you finish asking how they are. This is what they want to talk about."
      : member.personality === 'sceptic'
        ? "“How do you know?” They let the question sit until you stop trying to talk around it."
        : member.personality === 'opportunist'
          ? "They ask about the group’s future, then move swiftly to their own position in it."
          : member.personality === 'showy'
            ? 'They describe their latest contribution at enough volume for nearby followers to hear.'
            : member.personality === 'practical'
              ? 'They skip your opening remarks and ask what needs doing before the next gathering.'
              : 'They talk earnestly about the followers they are helping. You struggle to find a moment to finish your tea.';
  if (action === 'praise')
    return member.ambition >= 70
      ? "“Could you say that in front of everyone?” They already know which announcement would suit."
      : role === 'treasurer'
        ? "They smile, then show you how much work was hidden behind the neat total."
        : role === 'organiser'
          ? "They name everyone who stayed late to clear up. They would like you to thank those people too."
          : "They brighten when you name what they did. For once, they get thanked as a person instead of as part of “everyone”.";
  if (action === 'reward')
    return member.grievance >= 30
      ? "They accept the payment. “Thank you. We still need to talk about what happened.”"
      : member.personality === 'opportunist'
        ? "They check the amount before thanking you, then ask what the next promotion pays."
        : "They check the payment has arrived and thank you. You leave the sermon about generosity out of it.";
  if (action === 'confront')
    return member.loyalty >= 65
      ? "They stare at you while the room watches. “After everything I’ve done for you?”"
      : "They answer back loudly enough for the room to hear. You do not get the final word just by standing at the front.";
  if (action === 'expel')
    return "They leave without thanking you for the experience. You watch the doorway longer than you meant to.";
  if (action === 'promote')
    return member.personality === 'opportunist' || member.ambition >= 70
      ? 'They accept the second-in-command role before you finish offering it. “How much authority will I have when you are away?”'
      : member.personality === 'sceptic'
        ? 'They accept the promotion and ask whether being closer to you will make their questions easier to answer.'
        : 'They accept the promotion. For a moment they look pleased; then they ask what happens when you disagree.';
  return member.personality === 'practical'
    ? 'They accept the responsibility and ask for the tasks. Your explanation of its spiritual significance can wait.'
    : member.personality === 'showy'
      ? 'They accept and ask whether you plan to announce it in front of everyone.'
      : 'They accept the responsibility and ask where to start.';
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
