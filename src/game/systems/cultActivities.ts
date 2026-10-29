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

type RoutineLine =
  | string
  | ({ default: string } & Partial<Record<CultMember['personality'], string>>);

/** Cast an existing, present member without drawing RNG or changing their state. */
function routineNarrative(
  world: World,
  cult: Cult,
  role: CultMember['role'],
  line: RoutineLine,
) {
  const members = cultLocalMembers(world, cult);
  const speaker = members.find(member => member.role === role) ?? members[0];
  const text = typeof line === 'string' ? line : (speaker && line[speaker.personality]) ?? line.default;
  return text.replaceAll('{member}', speaker ? fullName(world.people[speaker.personId]) : 'A follower');
}

const recruitmentWriting: Record<
  Recruitment,
  { strong: RoutineLine; modest: RoutineLine; empty: RoutineLine; incident: string }
> = {
  street: {
    strong:
      'Your pavement sermon draws {recruits}. {member} has to explain that eternal life does not include dental cover.',
    modest: {
      default: 'You leave with {recruits}. {member} keeps pitching to a man who is only trying to cross the road.',
      sceptic: 'You leave with {recruits}. {member} asks why you can reveal the universe’s secrets but cannot get anyone to take a leaflet.',
      showy: 'You leave with {recruits}. {member} takes a bow as a passer-by asks you both to move.',
    },
    empty:
      'The bus arrives halfway through your revelation. Everyone boards. {member} keeps preaching to the timetable.',
    incident: 'activity-street-question',
  },
  social: {
    strong:
      'Your clip brings in {recruits}. {member} wants to know why the comments have declared your hair the real miracle.',
    modest: {
      default: 'Your invitation lands {recruits}. {member} is still arguing with an account called ProphetEater.',
      practical: 'Your invitation lands {recruits}. {member} disables the microphone before you can reply to ProphetEater.',
      opportunist: 'Your invitation lands {recruits}. {member} asks if the account should start promoting them instead.',
    },
    empty:
      'Nobody signs up. {member} reads you the top comment: “Is this a cult or a hostage video?”',
    incident: 'activity-comments-escape',
  },
  'open-evening': {
    strong:
      'You finish the evening with {recruits}. {member} explains that taking the entire snack tray home is not an initiation rite.',
    modest: {
      default: 'Your talk and refreshments bring in {recruits}. {member} catches a departing guest wrapping biscuits in your leaflets.',
      earnest: 'Your talk and refreshments bring in {recruits}. {member} stays to answer a nervous guest after you have given up on the pitch.',
      sceptic: 'Your talk and refreshments bring in {recruits}. {member} suggests testing which part works by letting you give the next talk without biscuits.',
    },
    empty:
      'The guests eat and leave without signing. {member} lifts the empty snack tray. “They were very committed to this bit.”',
    incident: 'activity-open-door',
  },
  referral: {
    strong:
      'The introductions bring you {recruits}. {member} interrupts your welcome to promise everyone you are less intense once you have eaten.',
    modest: {
      default: 'The invitations bring in {recruits}. {member} has to explain that your followers were real people before they met you.',
      opportunist: 'The invitations bring in {recruits}. {member} asks for credit in front of the guests before you have learned their names.',
      practical: 'The invitations bring in {recruits}. {member} writes down the guests’ names while you are still trying to invent titles for them.',
    },
    empty:
      'Nobody joins. {member} gets a hug from a guest and a firm request to keep your pitch out of their friendship.',
    incident: 'activity-referral-table',
  },
  publicity: {
    strong:
      'Your stunt attracts {recruits}. {member} asks which part of the crowd cheering was meant to happen before you lost your dignity.',
    modest: {
      default: 'The spectacle wins you {recruits}. {member} finds a photograph of your worst moment already circulating.',
      showy: 'The spectacle wins you {recruits}. {member} requests a second attempt because they were not visible enough in the first humiliation.',
      sceptic: 'The spectacle wins you {recruits}. {member} suggests making the next revelation somewhere with fewer witnesses.',
    },
    empty:
      'The crowd films everything and nobody joins. {member} quietly takes your name off the next sign.',
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
  const fees = cult.joiningFee * BigInt(joined);
  const recruits = joined + (joined === 1 ? ' new follower' : ' new followers') +
    (fees > 0n ? ' and ' + cultMoney(cult, fees) + ' in joining fees' : '');
  const body =
    routineNarrative(world, cult, 'recruiter', narrative).replaceAll('{recruits}', recruits) +
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
  { topic: string; engaged: RoutineLine; ordinary: RoutineLine; pushback: RoutineLine }
> = {
  'dream-archive': {
    topic: 'the lives hidden in dreams',
    engaged:
      'You describe the lives hidden in dreams. {member} starts a furious debate about whether an imaginary spouse can demand an imaginary divorce.',
    ordinary: {
      default: 'You explain dream messages. {member} shuts their eyes and calls it research.',
      showy: 'You explain dream messages. {member} describes a dream in which everyone applauded them, then waits for the room to catch up.',
      sceptic: 'You explain dream messages. {member} asks why the universe needed them naked at a job interview.',
    },
    pushback:
      'You interpret a dream. {member} corrects you in front of everyone, then corrects your interpretation of the correction.',
  },
  'final-update': {
    topic: 'the coming update to reality',
    engaged:
      'You promise a better version of reality. {member} demands the removal of back pain, mosquitoes and the need to wear trousers. The room gives you an impossible list.',
    ordinary: {
      default: 'You describe the next version of reality. {member} wants to know whether they will still have to know their password.',
      practical: 'You describe the next version of reality. {member} asks you to fix the microphone in this one first.',
      opportunist: 'You describe the next version of reality. {member} puts in a request to come back as your boss.',
    },
    pushback:
      'You announce an upgrade to existence. {member} asks if replacing you would be the free trial. The room laughs before you can answer.',
  },
  'cosmic-accounting': {
    topic: 'what the universe owes us',
    engaged:
      'You declare that the universe owes everyone. {member} demands compensation for puberty. The room cheers while you search for a less expensive revelation.',
    ordinary: {
      default: 'You explain what the universe owes you. {member} reminds the room that the landlord still wants money from this universe.',
      opportunist: 'You explain what the universe owes you. {member} wants to know if there is a finder’s fee.',
      sceptic: 'You explain what the universe owes you. {member} asks if you plan to chase it up or just keep announcing the balance.',
    },
    pushback:
      'You discuss what the cosmos owes you. {member} asks what you owe the room for sitting through this.',
  },
  'last-picnic': {
    topic: 'making the most of the time left',
    engaged:
      'You speak about the time everyone has left. {member} names someone they want at the next meal. Others start adding names.',
    ordinary: {
      default: 'You discuss preparing for the end. {member} asks if they should defrost anything.',
      practical: 'You discuss preparing for the end. {member} asks for a date so they can stop buying the large milk.',
      earnest: 'You discuss preparing for the end. {member} wants to spend the time feeding people. You let them speak.',
    },
    pushback:
      'You say there is no time to waste. {member} points out how long you have been saying it.',
  },
  'chosen-lost': {
    topic: 'the truth only the chosen know',
    engaged:
      'You declare the room chosen. {member} starts coaching everyone on how to walk past the unenlightened without looking smug. Nobody manages it.',
    ordinary: {
      default: 'You hint at a hidden truth. {member} stays through the break, determined to catch you eventually saying it.',
      opportunist: 'You hint at a hidden truth. {member} asks if learning it comes with a more important title.',
      showy: 'You hint at a hidden truth. {member} nods so vigorously that people start asking them what it is.',
    },
    pushback:
      'You promise hidden knowledge. {member} demands one example. The pause grows long enough for the room to start chanting the question.',
  },
  'eternal-self': {
    topic: 'the perfect self waiting inside us',
    engaged:
      'You describe everyone’s perfect inner self. {member} wants theirs to chair the next meeting. People start requesting introductions to their own.',
    ordinary: {
      default: 'You ask everyone to look deep inside themselves. {member} announces that they have found hunger.',
      sceptic: 'You ask everyone to look deep inside themselves. {member} asks whether their perfect self can take over their share of the chores.',
      showy: 'You ask everyone to look deep inside themselves. {member} claims to be finished before you have closed your eyes.',
    },
    pushback:
      'You describe your own journey towards perfection. {member} asks how far you still have to go.',
  },
  'quiet-orbit': {
    topic: 'hearing what silence has to say',
    engaged:
      'You stop speaking and let the room listen. {member} starts talking about something difficult. This time nobody interrupts.',
    ordinary: {
      default: 'You leave room for silence. {member} closes their eyes, and you resist filling it with another explanation.',
      practical: 'You leave room for silence. {member} turns off the rattling fan. That improves things more than your introduction did.',
      showy: 'You leave room for silence. {member} mouths “am I doing it right?” loudly enough for everyone to hear.',
    },
    pushback:
      'You explain silence for so long that {member} raises a finger to their lips. The room joins in.',
  },
  'ordinary-miracles': {
    topic: 'miracles hiding in everyday life',
    engaged:
      'You ask for small miracles. {member} describes a public toilet with paper, soap and a working lock. The room reacts as if the sea has parted.',
    ordinary: {
      default: 'You ask for a small miracle. {member} describes finding a parking space in enough detail to use up the sermon.',
      earnest: 'You ask for a small miracle. {member} talks about a stranger who stayed to help. You put your planned example aside.',
      sceptic: 'You ask for a small miracle. {member} nominates the fact that this meeting might finish on time.',
    },
    pushback:
      'You call everyday struggles blessings in disguise. {member} asks which blessing is meant to cover their bills.',
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
    narrative = routineNarrative(world, cult, cult.philosophy === 'cosmic-accounting' ? 'treasurer' : 'adviser', words[tone]);
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
  const body = narrative;
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
  { success: RoutineLine; ordinary: RoutineLine; failure: RoutineLine; incident: string }
> = {
  'dream-circle': {
    success:
      'At the {cost} dream circle, {member} reenacts a dream in which you were their pet hamster. Everyone wants the hamster’s side of the story.',
    ordinary: {
      default: 'You spend {cost} hearing everyone’s dreams. {member} describes making a sandwich. You wait for the revelation; it is the sandwich.',
      showy: 'You spend {cost} hearing everyone’s dreams. {member} performs theirs with sound effects and refuses to skip the overture.',
      opportunist: 'You spend {cost} hearing everyone’s dreams. {member} describes being put in charge and watches you for signs of recognition.',
    },
    failure:
      'Your {cost} dream circle turns on you when {member} rejects your interpretation. You are still defending it as people leave.',
    incident: 'activity-dream-copy',
  },
  'quiet-table': {
    success:
      'You spend {cost} bringing everyone together and let the silence hold. {member} takes a long breath. For once, you leave the moment alone.',
    ordinary: {
      default: 'Your {cost} quiet gathering settles down. {member} loses a battle with a squeaky chair and has to sit very still.',
      practical: 'Your {cost} quiet gathering settles down. {member} moves the squeaky chair outside without waiting for a revelation.',
      showy: 'Your {cost} quiet gathering settles down. {member} checks whether anyone is watching them look serene.',
    },
    failure:
      'Your {cost} silent gathering is mostly instructions about silence. {member} puts their head in their hands. You explain that too.',
    incident: 'activity-quiet-alarm',
  },
  'community-supper': {
    success:
      'You spend {cost} feeding members and neighbours. {member} tries to clear the plates, but people keep pulling out chairs for one more conversation.',
    ordinary: {
      default: 'You serve a {cost} supper. {member} referees an argument over the last helping with the serving spoon.',
      earnest: 'You serve a {cost} supper. {member} gives up their seat to someone arriving late and keeps the conversation going from the doorway.',
      opportunist: 'You serve a {cost} supper. {member} takes credit for the cooking while conspicuously avoiding the washing-up.',
    },
    failure:
      'The {cost} supper runs late and short. {member} has to tell the queue that your apology is the only thing available for seconds.',
    incident: 'activity-supper-seats',
  },
  starlight: {
    success:
      'You bring everyone out for a {cost} vigil. {member} spots something and the group crowds closer, forgetting to ask you what it means.',
    ordinary: {
      default: 'You spend {cost} watching the sky together. {member} proposes a warm coat as the evening’s most convincing source of protection.',
      sceptic: 'You spend {cost} watching the sky together. {member} asks how to distinguish a divine sign from a plane to Malaga.',
      showy: 'You spend {cost} watching the sky together. {member} keeps trying to stand where the moonlight flatters them.',
    },
    failure:
      'You point confidently in the wrong direction during the {cost} vigil. {member} asks whether the car park is also beyond your understanding.',
    incident: 'activity-starlight-camera',
  },
  'open-house': {
    success:
      'Visitors fill your {cost} open house with questions. {member} takes over the tour and starts showing off corners you had hoped to skip.',
    ordinary: {
      default: 'You host a {cost} open house. {member} answers a visitor asking what happens if enlightenment does not suit them.',
      practical: 'You host a {cost} open house. {member} gives visitors a straight answer while you are still working on the grand welcome.',
      sceptic: 'You host a {cost} open house. {member} laughs when a visitor asks whether you came with the building.',
    },
    failure:
      'You spend {cost} welcoming visitors, then dodge their questions. {member} is left facing a guest who wants to know if you are always like this.',
    incident: 'activity-open-house-visitor',
  },
  'grand-promise': {
    success:
      'Your {cost} gathering ends with {member} leading a conga line chanting your title. You join at the back and lose all control of your own procession.',
    ordinary: {
      default: 'Your {cost} gathering survives its untidy moments. {member} ushers you towards the microphone before you can attempt another grand entrance.',
      practical: 'Your {cost} gathering survives its untidy moments. {member} abandons your entrance cue and gets everyone seated.',
      showy: 'Your {cost} gathering survives its untidy moments. {member} accepts applause clearly intended for you. You have to keep smiling.',
    },
    failure:
      'A queue forms at the {cost} gathering while you stand without a plan. {member} has to ask the people waiting to come inside and help set it up.',
    incident: 'activity-grand-chair',
  },
};

const ceremonyContributions: Record<Ceremony, string> = {
  'dream-circle': 'The collection brings in ',
  'quiet-table': 'Members leave voluntary contributions of ',
  'community-supper': 'The supper collection brings in ',
  starlight: 'Followers contribute ',
  'open-house': 'Members contribute ',
  'grand-promise': 'The collection reaches ',
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
  const body = routineNarrative(world, cult, 'organiser', narrative)
    .replaceAll('{cost}', cultMoney(cult, quote)) +
    (proceeds > 0n ? ' ' + ceremonyContributions[ceremony] + cultMoney(cult, proceeds) + '.' : '');
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
