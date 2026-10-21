export type ConversationTopic = 'everyday' | 'interests' | 'family' | 'school' | 'work' | 'feelings';
export type ConversationOutcome = 'open' | 'reserved';
export type ConversationContext = {
  readonly targetName: string;
  readonly targetFirstName: string;
  readonly actorAge: number;
  readonly targetAge: number;
  readonly actorStress: number;
  readonly targetStress: number;
  readonly trust: number;
  readonly setting: 'ordinary' | 'hospital' | 'custody' | 'apart';
  readonly familyRole?: string;
  readonly interest?: { readonly person: 'you' | 'them' | 'both'; readonly label: string };
  readonly school?: { readonly person: 'you' | 'them'; readonly name: string; readonly field: string; readonly status: 'current' | 'paused' | 'completed' };
  readonly work?: { readonly person: 'you' | 'them'; readonly title: string; readonly employer: string; readonly status: 'current' | 'past' };
};
export type ConversationWriting = { title: string; body: string; journal: string };

// Context and outcome are supplied by the action. Writing neither reads a world
// nor decides eligibility, rewards or outcomes, and never draws another roll.
export function writeConversation(context: ConversationContext, topic: ConversationTopic, outcome: ConversationOutcome): ConversationWriting {
  const { targetName: fullName, targetFirstName: name } = context;
  const child = Math.min(context.actorAge, context.targetAge) < 12;
  const youngActor = context.actorAge < 12;
  const open = outcome === 'open';
  const scene = (title: string, body: string, journal: string): ConversationWriting => {
    const setting = context.setting === 'apart' ? 'You catch up from different places.'
      : context.setting === 'hospital' ? 'You make room for a chat around the hospital routine.'
      : context.setting === 'custody' ? 'You keep in touch while custody shapes the day.' : '';
    return { title, body: setting ? body + ' ' + setting : body, journal };
  };

  switch (topic) {
    case 'everyday': {
      if (!open) return scene('Just a quick catch-up', `${name} gives you the short version of the day. You let a small conversation stay small.`, `I had a brief catch-up with ${fullName}.`);
      const body = child
        ? youngActor ? `You tell ${name} about one tiny thing from your day. Somehow it needs three explanations and a sound effect.`
          : `${name} tells you about one tiny thing from the day. You ask a question and get the extended version, complete with sound effects.`
        : Math.min(context.actorAge, context.targetAge) < 18 ? `You and ${name} compare the little things that made today longer than necessary. The conversation acquires an unofficial ranking system.`
          : `You and ${name} compare the day's tiny annoyances. One of them gets a much longer hearing than it deserves.`;
      return scene('The important little things', body, `I swapped little stories about the day with ${fullName}.`);
    }
    case 'interests': {
      const interest = context.interest;
      const subject = interest ? interest.person === 'both' ? `your shared interest in ${interest.label}`
        : interest.person === 'you' ? `your interest in ${interest.label}` : `${name}'s interest in ${interest.label}` : 'what catches your attention';
      const journalSubject = interest ? interest.person === 'both' ? `our shared interest in ${interest.label}`
        : interest.person === 'you' ? `my interest in ${interest.label}` : `${fullName}'s interest in ${interest.label}` : 'our interests';
      if (!open) return scene('Another time for that', `You bring up ${subject}, but ${name} keeps the answer brief. You leave the subject there.`, `I briefly talked with ${fullName} about ${journalSubject}.`);
      const body = child ? `You and ${name} talk about ${subject}. One question turns into several more. Nobody has run out of questions yet.`
        : interest?.person === 'both' ? `You and ${name} get into ${subject}. Agreement lasts right up to the part where each of you has a favourite.`
          : `You and ${name} get into ${subject}. The explanation becomes a surprisingly good conversation, even at the bit that needs explaining twice.`;
      return scene('You can talk about that', body, `I talked with ${fullName} about ${journalSubject}.`);
    }
    case 'family': {
      if (!context.familyRole) return scene(open ? 'Talking about family' : 'A private subject', open
        ? `You and ${name} talk about what family means to different people. You leave other people's private business out of it.`
        : `${name} keeps the family conversation brief. You respect the limit.`, `I ${open ? 'talked about family' : 'kept a family conversation brief'} with ${fullName}.`);
      const relative = `your ${context.familyRole.toLowerCase()}, ${name},`;
      if (!open) return scene('A private subject', `You try talking with ${relative} about family. The answer is brief, and you respect the limit.`, `I brought up family with ${fullName} without pressing for more.`);
      const body = child ? `You and ${relative} talk about what makes a fair family rule. The smallest rules get the biggest opinions.`
        : `You and ${relative} talk about what being family asks of you. It turns out you have different ideas about which advice was actually requested.`;
      return scene('Family has opinions', body, `I talked with ${fullName} about being family and giving each other room.`);
    }
    case 'school': {
      const school = context.school;
      if (!school) return scene(open ? 'A question about learning' : 'School can wait', open
        ? `You and ${name} talk about what makes something hard to learn. You compare questions without pretending to have all the answers.`
        : `${name} does not want to get into school today. You leave the subject alone.`, `I ${open ? 'talked about learning' : 'kept a school conversation brief'} with ${fullName}.`);
      const owner = school.person === 'you' ? 'your' : `${name}'s`;
      const journalOwner = school.person === 'you' ? 'my' : 'their';
      const subject = school.status === 'paused' ? `${owner} paused studies at ${school.name}`
        : school.status === 'completed' ? `${owner} time at ${school.name}`
          : `${owner} studies${school.field && school.field !== 'general' ? ' in ' + school.field : ''} at ${school.name}`;
      const journalSubject = school.status === 'paused' ? `${journalOwner} paused studies at ${school.name}`
        : school.status === 'completed' ? `${journalOwner} earlier studies at ${school.name}` : `${journalOwner} studies at ${school.name}`;
      if (!open) return scene('Enough school for now', `You mention ${subject}. ${name} keeps it brief, so you let the subject rest.`, `I briefly talked with ${fullName} about ${journalSubject}.`);
      const ending = school.status === 'paused' ? 'You leave the next step open.'
        : school.status === 'completed' ? 'The awkward bits make a better story than the tidy version.'
          : child ? 'You compare what is interesting and what takes forever.' : 'You get past the usual question about how it is going.';
      return scene(school.status === 'completed' ? 'School, looking back' : school.status === 'paused' ? 'Studies on pause' : 'Beyond the school update', `You and ${name} talk about ${subject}. ${ending}`, `I talked with ${fullName} about ${journalSubject}.`);
    }
    case 'work': {
      const work = context.work;
      if (!work) return scene(open ? 'What work is like' : 'Work can wait', open
        ? `You and ${name} talk about what a good working day might look like. Neither of you promises to have it figured out.`
        : `${name} would rather leave work out of the conversation. You take the hint.`, `I ${open ? 'talked about working life' : 'kept a work conversation brief'} with ${fullName}.`);
      const owner = work.person === 'you' ? 'your' : `${name}'s`;
      const job = `${work.status === 'past' ? 'former ' : ''}${work.title} role at ${work.employer}`;
      const journalSubject = `${work.person === 'you' ? 'my' : 'their'} ${job}`;
      if (!open) return scene('Off the work topic', `You bring up ${owner} ${job}. ${name} does not want a longer work conversation today, and you move on.`, `I briefly talked with ${fullName} about ${journalSubject}.`);
      const ending = work.status === 'past' ? 'You compare what seemed important then with what still stands out.'
        : child ? 'Explaining the job title turns out to need several more questions.' : 'The job sounds simpler before you get to the people.';
      return scene(work.status === 'past' ? 'An old job story' : 'Beyond the job title', `You and ${name} talk about ${owner} ${job}. ${ending}`, `I talked with ${fullName} about ${journalSubject}.`);
    }
    case 'feelings': {
      if (!open) return scene('No need to push', `You ask how things are going, but ${name} keeps the answer short. You let the conversation stop there.`, `I checked in with ${fullName} and respected their privacy.`);
      const body = child ? `You and ${name} find words for how you feel. “Good” and “bad” turn out to have quite a bit of detail in the middle.`
        : context.actorStress >= 60 && context.targetStress >= 60 ? `You and ${name} admit things have felt strained. Nobody wins a prize for being the most frazzled.`
          : context.actorStress >= 60 ? `You tell ${name} that things feel strained lately. ${name} listens without turning it into a competition.`
            : context.targetStress >= 60 ? `You ask ${name} how they are holding up. The conversation leaves room for an answer longer than “fine”.`
              : context.trust >= 70 ? `You and ${name} talk honestly about how things have been. Neither of you has to add “only joking” afterwards.`
                : `You and ${name} get past “fine, thanks” and talk about how you are actually doing. You give each other time to answer.`;
      return scene('Past the easy answer', body, `I talked honestly with ${fullName} about how we were feeling.`);
    }
  }
}
