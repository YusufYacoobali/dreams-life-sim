import { EventTemplate, storyOption as option } from './eventTypes';

/** Free ordinary moments with an actual adult friend or current partner. */
export const adultRelationshipTemplates: readonly EventTemplate[] = [
  {
    id: 'friend-long-voice-note', min: 18, max: 120, friend: true, illustration: 'conversation', title: 'A message with chapters',
    body: '{friend} plays you a voice note explaining a very small misunderstanding. The progress bar suggests it has a middle act.',
    choices: [
      option('listen', 'Give it your full attention', { energy: -2, stress: -1 }, 'The extended version', 'You hear the whole story. {friend} notices that you listened instead of waiting for a gap.', 'I listened properly to a long story from {friend}.', undefined, { friendBond: 5 }),
      option('summary', 'Ask which part needs an answer', { smarts: 2, discipline: 2 }, 'A useful short version', '{friend} finds the actual question. The rest turns out to be background, foreground and weather.', 'I helped {friend} find the question inside a long explanation.', undefined, { friendBond: 2 }),
      option('guess', 'Guess the ending halfway through', { happiness: 2, respect: -2 }, 'Not that kind of story', 'Your guess is wrong. {friend} stops explaining before you learn why.', 'I interrupted {friend} with a confident guess.', undefined, { friendBond: -3 }),
    ],
  },
  {
    id: 'friend-different-budget', min: 18, max: 120, friend: true, illustration: 'relationship', title: 'The inexpensive version',
    body: 'You and {friend} are discussing things to do in {city}. A paid outing comes up. {friend} quietly says it is outside their budget.',
    choices: [
      option('walk', 'Suggest a free walk together', { happiness: 3, energy: -2 }, 'Company was the point', 'You take a short walk without buying anything. The conversation is no less enjoyable.', 'I enjoyed a free walk with {friend}.', undefined, { friendBond: 4 }),
      option('ask', 'Ask what would feel comfortable', { respect: 3, stress: -1 }, 'No financial performance required', '{friend} suggests sitting and talking instead. You do exactly that.', 'I asked {friend} what suited their budget and kept things simple.', undefined, { friendBond: 5 }),
      option('insist', 'Say it cannot cost that much', { respect: -3, stress: 2 }, 'That is not your number to choose', '{friend} repeats the boundary. You spend the conversation defending a price rather than enjoying the company.', 'I dismissed {friend}’s budget instead of listening.', undefined, { friendBond: -5 }),
    ],
  },
  {
    id: 'friend-advice-or-listening', min: 18, max: 120, friend: true, illustration: 'conversation', title: 'No solution requested',
    body: '{friend} tells you about a frustrating day. Your first three solutions are already lining up. None has been requested.',
    choices: [
      option('ask', 'Ask whether they want ideas or company', { smarts: 2, respect: 3 }, 'The right sort of help', '{friend} chooses company. You let the story finish without turning it into a project.', 'I asked {friend} what kind of support they wanted.', undefined, { friendBond: 5 }),
      option('listen', 'Listen and acknowledge the hard part', { stress: -2, energy: -1 }, 'A little room to be annoyed', 'You do not fix the day. {friend} looks relieved not to have to justify finding it difficult.', 'I let {friend} talk through a difficult day.', undefined, { friendBond: 4 }),
      option('lecture', 'Deliver all three solutions', { discipline: 2, respect: -2 }, 'An unsolicited presentation', '{friend} explains why the first two will not work, then gives up on the third.', 'I gave {friend} a lecture when they wanted someone to listen.', undefined, { friendBond: -4 }),
    ],
  },
  {
    id: 'friend-creative-feedback', min: 18, max: 120, friend: true, illustration: 'journal', title: 'Be honest, but also be my friend',
    body: '{friend} reads you a short poem they wrote and asks what you think. You like one line much more than the other lines.',
    choices: [
      option('specific', 'Name the line you liked and explain why', { smarts: 2, respect: 2 }, 'Praise with a location', '{friend} knows exactly what worked for you. Neither of you has to pretend the poem is finished.', 'I gave {friend} specific encouragement about a poem.', undefined, { friendBond: 4 }),
      option('permission', 'Ask whether they want detailed feedback', { discipline: 2, respect: 3 }, 'The requested amount of honesty', '{friend} asks about one uncertain passage. You discuss that part without taking over the poem.', 'I checked what feedback {friend} wanted before giving it.', undefined, { friendBond: 3 }),
      option('brutal', 'Treat honesty as a competition', { stress: 2, respect: -4 }, 'The poem was not the only fragile thing', 'You find several sharp ways to say the same criticism. {friend} puts the poem away.', 'I was needlessly harsh about something {friend} had made.', undefined, { friendBond: -5 }),
    ],
  },
  {
    id: 'friend-interrupted-thought', min: 18, max: 120, friend: true, illustration: 'conversation', title: 'The rest of your sentence',
    body: 'Every time you start an explanation, {friend} jumps in with a related story. Yours has been an opening sentence for several minutes.',
    choices: [
      option('finish', 'Say you would like to finish the thought', { respect: 3, stress: -2 }, 'A sentence with an ending', '{friend} apologises and waits. You finally reach the part you wanted to say.', 'I asked {friend} to let me finish speaking.', undefined, { friendBond: 2 }),
      option('return', 'Listen, then return to your point', { discipline: 3, energy: -2 }, 'A patient detour', 'You acknowledge the connection and bring the conversation back. Both stories get an ending.', 'I brought a wandering conversation with {friend} back to my point.', undefined, { friendBond: 3 }),
      option('compete', 'Interrupt louder', { stress: 4, respect: -2 }, 'Two opening sentences', 'For a moment you are both talking. Neither explanation becomes clearer.', 'I tried to out-interrupt {friend}.', undefined, { friendBond: -3 }),
    ],
  },
  {
    id: 'friend-unwanted-nickname', min: 18, max: 120, friend: true, illustration: 'relationship', title: 'Please do not let that catch on',
    body: '{friend} tries out a new nickname for you. You would prefer it did not survive this conversation.',
    choices: [
      option('plain', 'Say you prefer your actual name', { respect: 3, stress: -2 }, 'A small, clear boundary', '{friend} drops the nickname. The conversation continues without a naming ceremony.', 'I told {friend} I preferred my own name.', undefined, { friendBond: 2 }),
      option('light', 'Make the request with a light joke', { happiness: 3, stress: -1 }, 'Retired after one appearance', '{friend} laughs and agrees. The nickname has an admirably short career.', 'I gently retired a nickname {friend} had invented.', undefined, { friendBond: 3 }),
      option('pretend', 'Laugh along despite disliking it', { stress: 4 }, 'Now apparently approved', '{friend} uses it again. Your laugh did not communicate the objection you were having internally.', 'I pretended to like a nickname from {friend}.'),
    ],
  },
  {
    id: 'friend-quiet-company', min: 18, max: 120, friend: true, illustration: 'relationship', title: 'Nothing needs saying',
    body: 'You are sitting with {friend}. For once the silence seems comfortable. Part of you still wants to fill it with a review of the weather.',
    choices: [
      option('quiet', 'Enjoy a little quiet together', { stress: -4, energy: 2 }, 'Company without commentary', '{friend} settles back too. Neither of you has to earn the other person’s company by talking.', 'I enjoyed some quiet company with {friend}.', undefined, { friendBond: 3 }),
      option('check', 'Ask if the quiet is comfortable', { respect: 2, stress: -2 }, 'A short answer, then quiet', '{friend} says it is. You stop treating the pause as a problem.', 'I checked that {friend} was comfortable with a quiet moment.', undefined, { friendBond: 2 }),
      option('fill', 'Keep talking to cover every pause', { energy: -3, stress: 2 }, 'An exhausting weather report', 'You find several things to say about the same cloud. {friend} does not seem to have needed the update.', 'I talked through a comfortable silence with {friend}.'),
    ],
  },
  {
    id: 'friend-changed-opinion', min: 18, max: 120, friend: true, illustration: 'conversation', title: 'I used to think that too',
    body: '{friend} mentions an opinion you once shared. You have changed your mind, but saying so feels oddly like correcting an earlier version of yourself in public.',
    choices: [
      option('explain', 'Explain what changed your mind', { smarts: 3, respect: 2 }, 'An update rather than a victory', '{friend} asks a question. You have a conversation instead of defending your old position out of habit.', 'I explained a change of mind to {friend}.', undefined, { friendBond: 3 }),
      option('curious', 'Ask how they see it now', { smarts: 2, discipline: 2 }, 'Room for two unfinished thoughts', 'You discover that {friend} has doubts too. Neither of you needs a final answer immediately.', 'I compared a changing opinion with {friend}.', undefined, { friendBond: 4 }),
      option('dismiss', 'Say only an idiot would still think that', { respect: -4, stress: 3 }, 'Including a recent version of you', '{friend} goes quiet. Your new opinion has acquired an unnecessary insult.', 'I dismissed {friend} for an opinion I used to share.', undefined, { friendBond: -5 }),
    ],
  },
  {
    id: 'partner-phone-attention', min: 18, max: 120, partner: true, illustration: 'relationship', title: 'One more notification',
    body: '{partner} is telling you something when your phone lights up. You have checked it twice already. The third glance is apparently less subtle than you think.',
    choices: [
      option('away', 'Put it away and ask what you missed', { discipline: 3, respect: 2 }, 'Attention, returned', 'You acknowledge the interruption. {partner} picks up the thread without competing with a screen.', 'I put my phone away and listened to {partner}.', undefined, { partnerBond: 5 }),
      option('explain', 'Explain why you need a short pause', { respect: 2, stress: -1 }, 'An actual pause', '{partner} agrees to wait a moment. You finish looking, then return to the conversation properly.', 'I asked {partner} for a clear pause instead of half-listening.', undefined, { partnerBond: 2 }),
      option('deny', 'Insist you heard every word', { stress: 3, respect: -3 }, 'A difficult claim to demonstrate', '{partner} asks what the last sentence was. Your answer is mostly a description of your phone.', 'I pretended to be listening to {partner}.', undefined, { partnerBond: -5 }),
    ],
  },
  {
    id: 'partner-alone-time', min: 18, max: 120, partner: true, illustration: 'relationship', title: 'An afternoon with nobody',
    body: '{partner} says they could use a little time alone. Your first instinct is to ask what you have done. They have not said you have done anything.',
    choices: [
      option('respect', 'Respect the request without a quiz', { respect: 3, stress: -2 }, 'Space can be ordinary', '{partner} thanks you for understanding. A short boundary does not have to become a long explanation.', 'I respected {partner}’s need for some time alone.', undefined, { partnerBond: 4 }),
      option('clarify', 'Ask what amount of space would help', { discipline: 2, stress: -1 }, 'Less guessing', 'You understand what {partner} means. Neither of you has to read a hidden message into the request.', 'I clarified what {partner} meant by needing space.', undefined, { partnerBond: 3 }),
      option('test', 'Treat it as a test of your relationship', { stress: 5, respect: -2 }, 'A request becomes an exam', '{partner} now has to reassure you before getting the quiet they asked for.', 'I made {partner}’s request for space about me.', undefined, { partnerBond: -4 }),
    ],
  },
  {
    id: 'partner-money-conversation', min: 18, max: 120, partner: true, illustration: 'relationship', title: 'Before choosing the expensive option',
    body: '{partner} asks what you feel comfortable spending on paid plans together. The question is about comfort, but you hear an invitation to sound more wealthy.',
    choices: [
      option('honest', 'Say what feels affordable without showing off', { respect: 3, stress: -3 }, 'A useful limit', 'You discuss a limit rather than making a purchase. {partner} is glad the answer is real.', 'I had an honest conversation about spending with {partner}.', undefined, { partnerBond: 4 }),
      option('both', 'Ask what feels comfortable for both of you', { smarts: 2, respect: 2 }, 'Two people in the budget', 'The discussion leaves room for both sets of priorities. No money changes hands.', 'I compared spending boundaries with {partner}.', undefined, { partnerBond: 5 }),
      option('boast', 'Claim the price never matters to you', { stress: 4, respect: -2 }, 'An expensive sentence', '{partner} asks you to be serious. You have made a practical question needlessly awkward without buying anything.', 'I boasted instead of discussing money honestly with {partner}.', undefined, { partnerBond: -3 }),
    ],
  },
  {
    id: 'partner-other-couples', min: 18, max: 120, partner: true, illustration: 'relationship', title: 'Everybody else, apparently',
    body: '{partner} looks at cheerful pictures of other couples and wonders whether you should be doing more. The pictures contain very few ordinary Tuesdays.',
    choices: [
      option('specific', 'Ask what they would actually like more of', { smarts: 2, respect: 2 }, 'A need instead of a comparison', '{partner} talks about wanting more attention. You can understand that better than a collection of photographs.', 'I asked {partner} what mattered behind a comparison with other couples.', undefined, { partnerBond: 4 }),
      option('ordinary', 'Talk about what you enjoy in ordinary life', { happiness: 3, stress: -2 }, 'The parts nobody photographs', 'You and {partner} remember a few small things you like together. The pictures stop setting the whole standard.', 'I appreciated ordinary moments with {partner}.', undefined, { partnerBond: 3 }),
      option('compete', 'Compare your relationship to theirs in return', { stress: 4, respect: -2 }, 'A contest with no judges', 'Now both of you are defending yourselves against people who are not in the conversation.', 'I turned {partner}’s comparison into a competition.', undefined, { partnerBond: -4 }),
    ],
  },
  {
    id: 'partner-disagreement-loop', min: 18, max: 120, partner: true, illustration: 'conversation', title: 'The same point, slightly louder',
    body: 'You and {partner} have each explained your side of a disagreement twice. The third version appears to be the second version with more volume.',
    choices: [
      option('reflect', 'Say what you understand of their point', { smarts: 2, stress: -3 }, 'Finally discussing the same thing', '{partner} corrects one detail. You discover that part of the disagreement was about what each of you thought the other meant.', 'I checked that I understood {partner} during a disagreement.', undefined, { partnerBond: 4 }),
      option('pause', 'Ask for a calm pause in the conversation', { discipline: 3, energy: 1 }, 'No final word required', 'You both stop repeating yourselves. The question remains open, but the temperature comes down.', 'I took a calm pause in a difficult conversation with {partner}.', undefined, { partnerBond: 1 }),
      option('score', 'Bring up every unrelated grievance', { stress: 5, respect: -3 }, 'A much larger subject', 'The original issue disappears under several others. {partner} looks more tired than persuaded.', 'I dragged unrelated complaints into a disagreement with {partner}.', undefined, { partnerBond: -5 }),
    ],
  },
  {
    id: 'partner-public-affection', min: 18, max: 120, partner: true, illustration: 'relationship', title: 'Comfort has a location',
    body: 'While you are out together, {partner} reaches for your hand. You feel awkward about public affection today and are unsure how to say it kindly.',
    choices: [
      option('explain', 'Explain your comfort without blaming them', { respect: 3, stress: -2 }, 'A boundary with context', '{partner} understands that the request is about how you feel here. Neither of you has to guess what the hesitation means.', 'I explained a boundary around public affection to {partner}.', undefined, { partnerBond: 3 }),
      option('ask', 'Talk about what feels comfortable for both of you', { smarts: 2, respect: 2 }, 'Two preferences can fit', 'You find a way to walk together that suits you both. No one has to prove affection through discomfort.', 'I talked about shared comfort with {partner}.', undefined, { partnerBond: 4 }),
      option('snap', 'Pull away and snap without explaining', { stress: 3, respect: -3 }, 'The missing explanation', '{partner} does not know what went wrong. Your discomfort has become an unnecessary hurt.', 'I reacted sharply instead of explaining a boundary to {partner}.', undefined, { partnerBond: -4 }),
    ],
  },
  {
    id: 'partner-arrives-late', min: 18, max: 120, partner: true, illustration: 'conversation', title: 'You have had time to rehearse',
    body: '{partner} arrives later than you expected. During the wait, you have composed a speech with an opening, three accusations and a conclusion.',
    choices: [
      option('ask', 'Ask what happened before delivering the speech', { discipline: 3, stress: -2 }, 'Information before conclusions', '{partner} explains the delay. You can discuss the wait without defending an accusation you made before knowing the story.', 'I asked {partner} about a delay before assuming the worst.', undefined, { partnerBond: 3 }),
      option('impact', 'Explain how the wait affected you', { respect: 3, stress: -1 }, 'A clear point', 'You describe the impact without guessing at motives. {partner} acknowledges it.', 'I told {partner} how an unexpected wait affected me.', undefined, { partnerBond: 4 }),
      option('speech', 'Deliver the whole rehearsed speech', { energy: -3, stress: 4, respect: -2 }, 'An audience of one unhappy person', '{partner} barely gets a sentence in. The explanation has to wait behind your conclusion.', 'I accused {partner} before hearing why they were late.', undefined, { partnerBond: -5 }),
    ],
  },
];
