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
  readonly relationshipRole?: string;
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
    const setting = context.setting === 'apart' ? 'You catch up from different places'
      : context.setting === 'hospital' ? 'You make room for a chat around the hospital routine'
      : context.setting === 'custody' ? 'You keep in touch while custody shapes the day' : '';
    return { title, body: setting ? setting+'; '+(body.startsWith('You ')?'you '+body.slice(4):body) : body, journal };
  };

  switch (topic) {
    case 'everyday': {
      if (!open) return scene('Just a quick catch-up', `${name} gives you the headline version of the day. You resist conducting the follow-up interview.`, `I had a brief catch-up with ${fullName}.`);
      const body = child
        ? youngActor ? `You tell ${name} about a tiny part of your day. Halfway through, you remember three details that must be explained first.`
          : `${name} tells you about one tiny part of the day. You ask what happened next and receive the director’s cut.`
        : Math.min(context.actorAge, context.targetAge) < 18 ? `You and ${name} compare the day’s minor disasters. The least important one wins the longest discussion.`
          : `You and ${name} put the day’s small annoyances on trial. Neither of you can explain why the smallest one needs so many witnesses.`;
      return scene('The important little things', body, `I swapped little stories about the day with ${fullName}.`);
    }
    case 'interests': {
      const interest = context.interest;
      const subject = interest ? interest.person === 'both' ? `your shared interest in ${interest.label}`
        : interest.person === 'you' ? `your interest in ${interest.label}` : `${name}'s interest in ${interest.label}` : 'what catches your attention';
      const journalSubject = interest ? interest.person === 'both' ? `our shared interest in ${interest.label}`
        : interest.person === 'you' ? `my interest in ${interest.label}` : `${fullName}'s interest in ${interest.label}` : 'our interests';
      if (!open) return scene('Another time for that', `You bring up ${subject}. ${name} offers a short answer, and you retire the subject before it needs rescuing.`, `I briefly talked with ${fullName} about ${journalSubject}.`);
      const body = child ? `You and ${name} talk about ${subject}. The answer to one question turns out to require five more questions.`
        : interest?.person === 'both' ? `You and ${name} get into ${subject}. You agree on almost everything except the parts each of you cares about most.`
          : interest?.person === 'you' ? `You and ${name} talk about ${subject}. You catch yourself beginning the advanced explanation and give them the useful version instead.`
            : interest?.person === 'them' ? `You ask ${name} about ${subject}. One detail finally makes sense, which earns you a considerably more detailed explanation.`
              : `You and ${name} compare what holds your attention. Neither of you attempts to turn the conversation into a recruitment drive.`;
      return scene('You can talk about that', body, `I talked with ${fullName} about ${journalSubject}.`);
    }
    case 'family': {
      if (!context.familyRole) return scene(open ? 'Talking about family' : 'A private subject', open
        ? `You and ${name} discuss what people mean by family. You manage to have opinions without appointing yourselves judges of anyone else’s.`
        : `${name} does not want to unpack the family subject today. You leave it packed.`, `I ${open ? 'talked about family' : 'kept a family conversation brief'} with ${fullName}.`);
      const relative = `your ${(context.relationshipRole??context.familyRole).toLowerCase()}, ${name},`;
      if (!open) return scene('A private subject', `You ask ${relative} about family. Their short answer is not an invitation to ask the same question more slowly.`, `I brought up family with ${fullName} without pressing for more.`);
      const body = child ? `You and ${relative} discuss what makes a fair family rule. The rules are small; your objections arrive fully grown.`
        : `You and ${relative} discuss the difference between helping and taking over. You each produce an example the other would rather not hear.`;
      return scene('Family has opinions', body, `I talked with ${fullName} about being family and giving each other room.`);
    }
    case 'school': {
      const school = context.school;
      if (!school) return scene(open ? 'A question about learning' : 'School can wait', open
        ? `You and ${name} compare things you find hard to learn. Admitting you do not understand something takes less work than pretending to explain it.`
        : `${name} declines the school conversation. You do not assign a second attempt as homework.`, `I ${open ? 'talked about learning' : 'kept a school conversation brief'} with ${fullName}.`);
      const owner = school.person === 'you' ? 'your' : `${name}'s`;
      const journalOwner = school.person === 'you' ? 'my' : 'their';
      const subject = school.status === 'paused' ? `${owner} paused studies at ${school.name}`
        : school.status === 'completed' ? `${owner} time at ${school.name}`
          : `${owner} studies${school.field && school.field !== 'general' ? ' in ' + school.field : ''} at ${school.name}`;
      const journalSubject = school.status === 'paused' ? `${journalOwner} paused studies at ${school.name}`
        : school.status === 'completed' ? `${journalOwner} earlier studies at ${school.name}` : `${journalOwner} studies at ${school.name}`;
      if (!open) return scene('Enough school for now', `You mention ${subject}. ${name} gives a short answer, and you spare both of you the progress report.`, `I briefly talked with ${fullName} about ${journalSubject}.`);
      const ending = school.status === 'paused' ? 'You discuss the uncertainty without demanding a decision before the conversation ends.'
        : school.status === 'completed' ? 'The parts left out of the polite summary make a much better conversation.'
          : child ? 'You discover that interesting and taking forever can describe the same lesson.' : 'You get beyond the standard update and into the part that actually takes effort.';
      return scene(school.status === 'completed' ? 'School, looking back' : school.status === 'paused' ? 'Studies on pause' : 'Beyond the school update', `You and ${name} talk about ${subject}. ${ending}`, `I talked with ${fullName} about ${journalSubject}.`);
    }
    case 'work': {
      const work = context.work;
      if (!work) return scene(open ? 'What work is like' : 'Work can wait', open
        ? `You and ${name} discuss what makes a working day bearable. Neither of you confuses having an opinion with having solved it.`
        : `${name} would rather not discuss work. You let the subject clock off.`, `I ${open ? 'talked about working life' : 'kept a work conversation brief'} with ${fullName}.`);
      const owner = work.person === 'you' ? 'your' : `${name}'s`;
      const job = `${work.status === 'past' ? 'former ' : ''}${work.title} role at ${work.employer}`;
      const journalSubject = `${work.person === 'you' ? 'my' : 'their'} ${job}`;
      if (!open) return scene('Off the work topic', `You mention ${owner} ${job}. ${name} gives you the short version, and you do not turn it into an interview.`, `I briefly talked with ${fullName} about ${journalSubject}.`);
      const ending = work.status === 'past' ? 'The things that felt enormous at the time now have much shorter explanations.'
        : child ? 'The job title sounds simple until someone has to explain what it means.' : 'The job description is short; explaining the people takes longer.';
      return scene(work.status === 'past' ? 'An old job story' : 'Beyond the job title', `You and ${name} talk about ${owner} ${job}. ${ending}`, `I talked with ${fullName} about ${journalSubject}.`);
    }
    case 'feelings': {
      if (!open) return scene('No need to push', `You ask how things are going, and ${name} keeps the answer short. You accept the answer without trying to prise it open.`, `I checked in with ${fullName} and respected their privacy.`);
      const body = child ? `You and ${name} try to explain how you feel. “Fine” loses its job after failing the first follow-up question.`
        : context.actorStress >= 60 && context.targetStress >= 60 ? `You and ${name} admit things have felt strained. You compare notes without holding auditions for who has it worse.`
          : context.actorStress >= 60 ? `You tell ${name} that things feel strained lately. They let you finish without presenting a five-point plan for your entire life.`
            : context.targetStress >= 60 ? `You ask ${name} how they are holding up. You wait through the first “fine” until they decide what they actually want to say.`
              : context.trust >= 70 ? `You and ${name} talk honestly about how things have been. You can leave a difficult sentence standing without disguising it as a joke.`
                : `You and ${name} get past “fine, thanks” without demanding the whole story. A little honesty is enough for this conversation.`;
      return scene('Past the easy answer', body, `I talked honestly with ${fullName} about how we were feeling.`);
    }
  }
}
