import { EventTemplate, storyOption as option } from './eventTypes';

/** Ordinary work with people the player has actually met at the current job. */
export const workplaceTemplates: readonly EventTemplate[] = [
  {
    id: 'work-three-priorities', min: 16, max: 85, workplace: true, supervisor: true, illustration: 'career', title: 'All three are urgent',
    body: '{supervisor} gives you three tasks at {workplace}. All three must come first. Apparently the vacancy was for a small octopus.',
    choices: [
      option('order', 'Make {supervisor} rank them out loud', { discipline: 3, stress: -2 }, 'One first place available', '{supervisor} reluctantly picks an order. You leave with instructions that obey the laws of time.', 'I asked {supervisor} to rank three urgent tasks.', undefined, { supervisorBond: 3 }),
      option('repeat', 'Repeat the impossible promise back slowly', { smarts: 2, respect: 2 }, 'It sounds worse out loud', 'By the third “simultaneously”, {supervisor} hears the problem. You both agree to try using numbers.', 'I repeated an impossible work plan until {supervisor} reconsidered it.', undefined, { supervisorBond: 2 }),
      option('guess', 'Pick whichever makes {supervisor} look best', { stress: 3, energy: -2, respect: -2 }, 'A promising little favourite', '{supervisor} loves the choice. The other two tasks keep staring at you. So does your conscience.', 'I prioritised making {supervisor} look good over the other tasks.', undefined, { supervisorBond: 4 }),
    ],
  },
  {
    id: 'work-unfamiliar-process', min: 16, max: 85, workplace: true, coworker: true, illustration: 'career', title: 'The forbidden instructions',
    body: '{coworker} shows you how things actually get done at {workplace}. The official instructions apparently describe a different workplace in a better universe.',
    choices: [
      option('ask', 'Ask for the unofficial demonstration', { smarts: 3, stress: -2 }, 'Welcome behind the curtain', '{coworker} shows you the workaround, then makes you swear never to say it was their idea.', 'I learned a work process from {coworker} rather than the unclear instructions.', undefined, { coworkerBond: 4 }),
      option('notes', 'Write down the forbidden knowledge', { discipline: 3, smarts: 2 }, 'A suspiciously useful document', '{coworker} asks for a copy. You title it “What We Actually Do” and keep it out of the shared folder.', 'I documented a useful work process with {coworker}.', undefined, { coworkerBond: 3 }),
      option('pretend', 'Claim you invented the workaround', { happiness: 2, stress: 4, respect: -2 }, 'An extremely recent invention', '{coworker} asks you to explain the next step. Your pioneering research ends there.', 'I claimed credit for a workaround {coworker} had just shown me.', undefined, { coworkerBond: -5 }),
    ],
  },
  {
    id: 'work-breakroom-sign', min: 16, max: 85, workplace: true, coworker: true, illustration: 'journal', title: 'Your mother does not work here',
    body: 'A breakroom note says “YOUR MOTHER DOES NOT WORK HERE”. {coworker} points at a mouldy cup and asks whether she at least visits.',
    choices: [
      option('clear', 'Wash your cup and the abandoned one', { discipline: 3, energy: -2 }, 'Two cups, no manifesto', 'You deal with the cups. {coworker} offers to dry them, which is more help than the note has been.', 'I cleaned abandoned cups with {coworker}.', undefined, { coworkerBond: 2 }),
      option('suggest', 'Replace it with “Please wash your cup”', { smarts: 2, respect: 2 }, 'The family is no longer involved', '{coworker} agrees the new wording is clearer. Nobody has to defend a relative before doing the washing-up.', 'I suggested a direct breakroom notice to {coworker}.', undefined, { coworkerBond: 2 }),
      option('reply', 'Add “She says wash it yourself”', { happiness: 3, stress: 3, respect: -2 }, 'Mum has entered the dispute', '{coworker} laughs, then asks if you are planning to touch the cup. You were hoping the laugh would count.', 'I added a sarcastic reply instead of cleaning the breakroom.', undefined, { coworkerBond: -1 }),
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
    id: 'work-message-love', min: 16, max: 85, workplace: true, supervisor: true, illustration: 'conversation', title: 'Love you, boss',
    body: 'You send {supervisor} a work message ending “Love you”. They start typing. They stop. They start again.',
    choices: [
      option('correct', 'Send “Wrong sign-off. Sorry.”', { stress: -2, respect: 2 }, 'Disaster downgraded', '“Thought so,” replies {supervisor}. You decide never to investigate how long they thought about it.', 'I corrected an accidental “Love you” message to {supervisor}.', undefined, { supervisorBond: 1 }),
      option('joke', 'Ask whether this counts as networking', { happiness: 3, stress: -1 }, 'A stronger professional connection', '{supervisor} sends a laughing face. Your next message receives an extremely formal “Kind regards”.', 'I joked with {supervisor} after sending the wrong sign-off.', undefined, { supervisorBond: 2 }),
      option('inspect', 'Send a twelve-paragraph explanation', { stress: 5, energy: -2 }, 'You have made it a document', '{supervisor} replies, “Please stop explaining.” You have now used the word love nine more times.', 'I made an awkward message to {supervisor} worse by overexplaining it.', undefined, { supervisorBond: -3 }),
    ],
  },
  {
    id: 'work-photo-blink', min: 16, max: 85, workplace: true, coworker: true, illustration: 'journal', title: 'Proof of life, debatable',
    body: '{coworker} shows you a photo from {workplace}. You look asleep. {coworker} looks like someone has just identified the body.',
    choices: [
      option('retake', 'Insist on one photo where you look alive', { happiness: 3, stress: -1 }, 'A slightly stronger pulse', '{coworker} counts down. You both open your eyes so wide that the new photo suggests a different emergency.', 'I asked {coworker} to retake a terrible work photo.', undefined, { coworkerBond: 2 }),
      option('keep', 'Keep it as an honest account of work', { happiness: 4 }, 'No retouching necessary', 'You and {coworker} laugh until the photo stops being embarrassing. It remains horrifying.', 'I laughed with {coworker} about an unflattering work photo.', undefined, { coworkerBond: 4 }),
      option('decline', 'Crop yourself out. Keep their face.', { happiness: 2, respect: -3, stress: 2 }, 'An obvious editorial decision', '{coworker} sees your crop. You explain that it was for the composition. The composition does not believe you either.', 'I cropped myself out of a work photo while keeping {coworker} looking bad.', undefined, { coworkerBond: -6 }),
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
    id: 'work-shared-credit', min: 16, max: 85, workplace: true, coworker: true, supervisor: true, illustration: 'career', title: 'Your brilliant borrowed idea',
    body: '{supervisor} praises your brilliant solution at {workplace}. It was {coworker}’s idea. {coworker} is beside you, waiting to find out what sort of person you are.',
    choices: [
      option('name', 'Tell {supervisor} whose idea it was', { respect: 4, happiness: 2 }, 'The rightful owner steps forward', '{supervisor} thanks you both. {coworker} gives you the relieved look of someone who can stop rehearsing an argument.', 'I credited {coworker} for the idea {supervisor} had praised.', undefined, { coworkerBond: 5, supervisorBond: 2 }),
      option('both', 'Call it a team effort', { respect: 3 }, 'A generous use of the plural', '{coworker} accepts the shared credit. You know which half of the team did the thinking.', 'I shared credit for a work idea with {coworker}.', undefined, { coworkerBond: 3, supervisorBond: 1 }),
      option('take', 'Smile like it came to you in a dream', { happiness: 2, stress: 3, respect: -3 }, 'A proud little fraud', '{coworker} lets you finish enjoying the praise before asking you to explain your idea. Your dream omitted the details.', 'I took credit for {coworker}’s work idea.', undefined, { coworkerBond: -7 }),
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
  {
    id: 'work-anonymous-survey', min: 16, max: 85, workplace: true, supervisor: true, rarity: 'uncommon', illustration: 'career', title: 'Completely anonymous, says your witness',
    body: '{supervisor} watches over your shoulder while you complete an anonymous leadership survey at {workplace}. The first question is whether you feel comfortable being honest.',
    choices: [
      option('honest', 'Answer honestly while maintaining eye contact', { respect: 4, stress: 3 }, 'A very identifiable opinion', '{supervisor} reads the answer. You both learn something about how comfortable honesty feels.', 'I answered a leadership survey honestly while {supervisor} watched.', undefined, { supervisorBond: -5 }),
      option('praise', 'Give full marks. Type “help” in the comments.', { happiness: 2, smarts: 2 }, 'An excellent cry for assistance', '{supervisor} asks what you need help with. You gesture at the word anonymous until they stop smiling.', 'I mocked the lack of privacy in a work survey.', undefined, { supervisorBond: -2 }),
      option('privacy', 'Ask them to demonstrate anonymity by leaving', { discipline: 3, respect: 2 }, 'A practical training exercise', '{supervisor} takes the hint and steps away. You get to form an opinion without an audience.', 'I asked {supervisor} for privacy while completing a work survey.', undefined, { supervisorBond: 2 }),
    ],
  },
];
