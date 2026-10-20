import { EventTemplate, storyOption as option } from './eventTypes';

/** Ordinary work with people the player has actually met at the current job. */
export const workplaceTemplates: readonly EventTemplate[] = [
  {
    id: 'work-three-priorities', min: 16, max: 85, workplace: true, supervisor: true, illustration: 'career', title: 'Three first priorities',
    body: 'At {workplace}, {supervisor} calls three different tasks “the first priority”. You have two hands and a follow-up question.',
    choices: [
      option('order', 'Ask which one comes first', { discipline: 3, stress: -2 }, 'A useful numbered list', '{supervisor} chooses an order. None of the tasks vanish, but they stop competing for the same minute.', 'I asked {supervisor} to put three urgent tasks in order.', undefined, { supervisorBond: 3 }),
      option('repeat', 'Repeat the plan back before starting', { smarts: 2, respect: 2 }, 'One misunderstanding fewer', 'Hearing the instructions aloud makes the clash obvious. {supervisor} corrects the plan before you begin.', 'Repeating a work plan back to {supervisor} caught a clash.', undefined, { supervisorBond: 2 }),
      option('guess', 'Guess, then worry about the guess', { stress: 4, energy: -2 }, 'A priority-shaped circle', 'You spend too long switching between tasks. {supervisor} eventually asks which one you are doing.', 'I tried to guess which of three work priorities mattered most.'),
    ],
  },
  {
    id: 'work-unfamiliar-process', min: 16, max: 85, workplace: true, coworker: true, illustration: 'career', title: 'The part nobody explained',
    body: '{coworker} notices you studying a routine at {workplace}. Apparently everybody knows how it works. Everybody was not born knowing.',
    choices: [
      option('ask', 'Ask for a slow demonstration', { smarts: 3, stress: -2 }, 'The missing step', '{coworker} shows you the awkward bit twice. You can ask a question without pretending it is a test.', 'I asked {coworker} to explain an unfamiliar work process.', undefined, { coworkerBond: 4 }),
      option('notes', 'Write down the steps together', { discipline: 3, smarts: 2 }, 'Instructions with actual instructions', 'Your notes include the small step everyone normally forgets to mention. {coworker} asks for a copy.', 'I made clearer process notes with {coworker}.', undefined, { coworkerBond: 3 }),
      option('pretend', 'Nod with entirely borrowed confidence', { stress: 4, respect: -2 }, 'Confidence does not contain instructions', 'You get stuck at the same step. Asking later is somehow more awkward.', 'I pretended to understand a work process instead of asking.'),
    ],
  },
  {
    id: 'work-breakroom-sign', min: 16, max: 85, workplace: true, coworker: true, illustration: 'journal', title: 'Polite capitals',
    body: 'A note in the break area says PLEASE LEAVE THIS SPACE AS YOU FOUND IT. {coworker} points out that this would preserve the problem indefinitely.',
    choices: [
      option('clear', 'Clear your things and one extra mess', { discipline: 3, energy: -2 }, 'A small local improvement', 'You leave a clean space without launching a tribunal. {coworker} takes their things too.', 'I helped leave the break area tidier with {coworker}.', undefined, { coworkerBond: 2 }),
      option('suggest', 'Suggest a clearer note', { smarts: 2, respect: 2 }, 'Less interpretation required', '“Wash your cup” proves harder to misunderstand. {coworker} appreciates the brevity.', 'I suggested a clearer break-area note to {coworker}.', undefined, { coworkerBond: 2 }),
      option('reply', 'Add a sarcastic reply underneath', { happiness: 2, stress: 3, respect: -2 }, 'The wall has a comments section', '{coworker} laughs once. Now there are two notes and exactly the same mess.', 'I added sarcasm to a work notice instead of helping.', undefined, { coworkerBond: -1 }),
    ],
  },
  {
    id: 'work-break-playlist', min: 16, max: 85, workplace: true, coworker: true, illustration: 'music', title: 'One song, several opinions',
    body: 'During a break, {coworker} offers to play a song. It has an introduction long enough to apply for its own break.',
    choices: [
      option('listen', 'Give it one proper listen', { happiness: 3, stress: -2 }, 'A better chorus than expected', 'The song eventually arrives at its point. {coworker} tells you why they like it.', 'I listened to a favourite song with {coworker}.', undefined, { coworkerBond: 4 }),
      option('trade', 'Trade a recommendation afterwards', { happiness: 4 }, 'A very small music club', 'You disagree about the best part. Neither of you needs to win.', 'I traded music recommendations with {coworker}.', undefined, { coworkerBond: 3 }),
      option('quiet', 'Ask for a quiet break today', { stress: -3, energy: 2 }, 'A reasonable volume: zero', 'You explain that you need a few quiet minutes. {coworker} puts the phone away.', 'I asked {coworker} for a quiet work break.'),
    ],
  },
  {
    id: 'work-message-love', min: 16, max: 85, workplace: true, supervisor: true, illustration: 'conversation', title: 'An unexpected sign-off',
    body: 'You finish an ordinary message to {supervisor} with “Love you”. Your thumb appears to think you are talking to family.',
    choices: [
      option('correct', 'Send “Sorry, wrong sign-off”', { stress: -2, respect: 2 }, 'Four words do the job', '{supervisor} replies with “No problem”. The exchange ends without a committee.', 'I corrected an accidental family sign-off in a message to {supervisor}.', undefined, { supervisorBond: 1 }),
      option('joke', 'Say your thumb needs supervision', { happiness: 3, stress: -1 }, 'An appropriately brief joke', '{supervisor} sends a laughing face and returns to the original question.', 'I laughed off a mistaken message sign-off with {supervisor}.', undefined, { supervisorBond: 2 }),
      option('inspect', 'Read the sent message twenty times', { stress: 5, energy: -2 }, 'Still the same two words', 'The sign-off remains sent. The work question still needs an answer.', 'I worried too long about a harmless message to {supervisor}.'),
    ],
  },
  {
    id: 'work-photo-blink', min: 16, max: 85, workplace: true, coworker: true, illustration: 'journal', title: 'Everybody blinked separately',
    body: '{coworker} shows you a photo of a few people from {workplace}. Between you, the group has managed roughly one open eye.',
    choices: [
      option('retake', 'Ask for one quick retake', { happiness: 3, stress: -1 }, 'A modest improvement in eyes', '{coworker} counts down this time. It helps most of you.', 'I asked {coworker} to retake an impressively mistimed group photo.', undefined, { coworkerBond: 2 }),
      option('keep', 'Enjoy the terrible photo together', { happiness: 4 }, 'The candid version', 'You and {coworker} decide the failed photograph is funnier than a perfect one would have been.', 'I laughed with {coworker} at a badly timed work photo.', undefined, { coworkerBond: 4 }),
      option('decline', 'Ask not to be in the next one', { stress: -2, discipline: 2 }, 'A perfectly ordinary request', '{coworker} agrees. You can enjoy the break without posing for another photograph.', 'I told {coworker} I would rather skip another work photo.'),
    ],
  },
  {
    id: 'work-safety-arrow', min: 16, max: 85, workplace: true, supervisor: true, illustration: 'career', title: 'This way to the wall',
    body: 'A safety direction sign at {workplace} points straight at a blank wall. {supervisor} is nearby. The wall offers no further guidance.',
    choices: [
      option('report', 'Point it out to {supervisor}', { respect: 4, stress: -1 }, 'A useful thing to notice', '{supervisor} checks it and takes responsibility for getting it corrected. You leave the fitting to someone authorised.', 'I reported a confusing safety sign to {supervisor}.', undefined, { supervisorBond: 3 }),
      option('route', 'Ask where the actual safe route is', { smarts: 3, discipline: 2 }, 'Directions with a destination', '{supervisor} shows you the real route and notes the misleading sign.', 'I checked the safe route at work with {supervisor}.', undefined, { supervisorBond: 2 }),
      option('ignore', 'Assume somebody else has noticed', { stress: 2, respect: -2 }, 'Still pointing at plaster', 'You walk past. The next person gets the same unhelpful instruction.', 'I left a confusing work safety sign unreported.'),
    ],
  },
  {
    id: 'work-shared-credit', min: 16, max: 85, workplace: true, coworker: true, supervisor: true, illustration: 'career', title: 'There were two of us',
    body: '{supervisor} thanks you for sorting out a small problem at {workplace}. {coworker} did the fiddly half and is standing close enough to hear.',
    choices: [
      option('name', 'Name what {coworker} contributed', { respect: 4, happiness: 2 }, 'The complete version', '{supervisor} thanks you both. {coworker} does not have to interrupt to become visible.', 'I made sure {supervisor} heard about {coworker}’s work.', undefined, { coworkerBond: 5, supervisorBond: 2 }),
      option('both', 'Say you worked it out together', { respect: 3 }, 'A short correction', 'The thank-you becomes plural. {coworker} gives you a quick nod.', 'I shared credit for a work task with {coworker}.', undefined, { coworkerBond: 3, supervisorBond: 1 }),
      option('take', 'Accept the whole compliment', { stress: 3, respect: -3 }, 'A very quiet half of the team', '{coworker} says nothing. The silence stays with you longer than the praise.', 'I took credit without mentioning {coworker}.', undefined, { coworkerBond: -5 }),
    ],
  },
  {
    id: 'work-question-at-door', min: 16, max: 85, workplace: true, supervisor: true, illustration: 'conversation', title: 'One quick question',
    body: 'As you leave for a scheduled break, {supervisor} says “one quick question”. The opening sentence already has three parts.',
    choices: [
      option('later', 'Ask to pick it up after the break', { discipline: 3, stress: -2, energy: 2 }, 'A time instead of a promise', '{supervisor} agrees to talk when you return. You get your break without needing a speech.', 'I agreed a better time for a work discussion with {supervisor}.', undefined, { supervisorBond: 2 }),
      option('clarify', 'Ask what needs answering right now', { smarts: 3, respect: 2 }, 'One actual question', 'Only one part needs a short answer. The rest can wait until afterwards.', 'I clarified which work question {supervisor} needed answered.', undefined, { supervisorBond: 2 }),
      option('all', 'Try to answer all three at once', { energy: -3, stress: 4 }, 'A break with no break in it', 'The conversation fills the time you meant to take. You leave wishing you had asked first.', 'I used up a work break on a discussion with {supervisor}.'),
    ],
  },
  {
    id: 'work-quiet-kindness', min: 16, max: 85, workplace: true, coworker: true, illustration: 'relationship', title: 'A small favour, correctly remembered',
    body: '{coworker} quietly brings back something you left in the break area at {workplace}. You had been conducting a very serious search in the wrong place.',
    choices: [
      option('thanks', 'Thank {coworker} properly', { happiness: 3, stress: -2 }, 'Found, with help', 'You stop searching and say what the small favour saved you. {coworker} looks pleased.', 'I thanked {coworker} for returning something I had misplaced.', undefined, { coworkerBond: 4 }),
      option('laugh', 'Admit where you had been looking', { happiness: 4, stress: -1 }, 'An impressively wrong location', '{coworker} shares a previous search of their own. Yours suddenly feels quite ordinary.', 'I laughed with {coworker} about looking in the wrong place.', undefined, { coworkerBond: 3 }),
      option('rush', 'Take it and hurry away', { stress: 2 }, 'One thank-you short', 'You remember your manners halfway down the corridor. The moment has already passed.', 'I hurried off without properly thanking {coworker}.', undefined, { coworkerBond: -2 }),
    ],
  },
];
