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
    id: 'work-unfamiliar-process', min: 16, max: 85, workplace: true, coworker: true, supervisor: true, illustration: 'career', title: "Your signature, their shortcut",
    body: "{coworker} has copied your signature onto an inspection you never did at {workplace}. {supervisor} wants the finished form. Apparently your handwriting has been promoted.",
    choices: [
      option("ask", "Make {coworker} redo the check with you", {"discipline": 5, "energy": -4}, "The signature attends in person", "You perform the actual check together. {coworker} complains that this takes longer than copying your name. You agree that this is precisely the point.", "I made {coworker} repeat an inspection they had falsely signed in my name.", undefined, {"coworkerBond": -4, "trust": {"coworker": -12}, "workPerformance": 8}),
      option("notes", "Give the original to {supervisor}", {"respect": 6, "stress": 4}, "An authentic piece of evidence", "{supervisor} asks {coworker} why your signature appeared before you did. The check gets redone. Your work record stays yours; {coworker} stops offering to save you time.", "I showed {supervisor} an inspection {coworker} had falsely signed for me.", undefined, {"coworkerBond": -18, "supervisorBond": 4, "trust": {"coworker": -25, "supervisor": 8}, "workPerformance": 12}),
      option("pretend", "Say you signed it", {"respect": -5, "stress": 7}, "Congratulations on the inspection", "{supervisor} asks a basic question about what you checked. You cannot answer it. {coworker} studies the floor while your work takes the hit.", "I covered for {coworker}’s forged inspection signature and damaged my own work record.", undefined, {"coworkerBond": 6, "supervisorBond": -10, "trust": {"supervisor": -15}, "workPerformance": -18}),
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
    id: 'work-safety-arrow', min: 16, max: 85, workplace: true, supervisor: true, illustration: 'career', title: "Safety first, draughts second",
    body: "{supervisor} has wedged the emergency exit shut at {workplace} to stop a draught. The obstruction sits directly beneath a poster saying safety is everybody’s responsibility.",
    choices: [
      option("report", "Refuse to work until the exit is clear", {"respect": 7, "stress": 5}, "A surprisingly movable obstacle", "{supervisor} calls you difficult while moving the obstruction. You agree that leaving a burning building would have been more difficult.", "I refused to work while {supervisor} kept an emergency exit blocked.", undefined, {"supervisorBond": -6, "trust": {"supervisor": -15}, "workPerformance": -5}),
      option("route", "Clear it yourself and point at the poster", {"discipline": 5, "energy": -3}, "Everybody includes you", "You move the obstruction safely and leave the exit usable. {supervisor} reads the poster as though somebody has recently changed it.", "I cleared a blocked emergency exit despite {supervisor}’s objection to the draught.", undefined, {"supervisorBond": -3, "workPerformance": 10}),
      option("ignore", "Climb over it to demonstrate the problem", {"health": -10, "energy": -4, "stress": 6}, "Demonstration, with bruises", "Your foot catches and you land hard on your elbow. {supervisor} clears the exit while you sit there hurting. The poster has offered no assistance.", "I hurt myself demonstrating why the emergency exit should not be blocked.", undefined, {"supervisorBond": -4, "trust": {"supervisor": -10}, "workPerformance": -8}),
    ],
  },
  {
    id: 'work-shared-credit', min: 16, max: 85, workplace: true, coworker: true, supervisor: true, illustration: 'career', title: "A remarkable resemblance",
    body: "{coworker} presents your latest draft as their own at {workplace}. {supervisor} loves it. They have even kept your note saying “ask {coworker} to check this”.",
    choices: [
      option("name", "Show {supervisor} your original", {"respect": 6, "stress": 3}, "The author has receipts", "The matching draft makes the explanation short. {supervisor} corrects the credit. {coworker} suggests it was a team effort, despite having just met the team.", "I proved to {supervisor} that {coworker} had presented my work as their own.", undefined, {"coworkerBond": -12, "supervisorBond": 4, "trust": {"coworker": -25, "supervisor": 8}, "workPerformance": 15}),
      option("both", "Accept shared credit and make them finish it", {"smarts": 4, "energy": 3}, "A practical introduction to teamwork", "You name yourself as co-author, then hand {coworker} every remaining task. Their enthusiasm for joint ownership drops sharply. {supervisor} accepts the split.", "I claimed shared credit and left {coworker} to finish the work they had taken.", undefined, {"coworkerBond": -5, "supervisorBond": 2, "trust": {"coworker": -12}, "workPerformance": 5}),
      option("take", "Let them take the praise", {"respect": -4, "stress": 7}, "A very successful silence", "{supervisor} records the achievement under {coworker}’s name. Afterwards, {coworker} thanks you for being understanding. You have never understood them better.", "I stayed silent while {coworker} received credit for my work.", undefined, {"coworkerBond": -8, "trust": {"coworker": -20}, "workPerformance": -10}),
    ],
  },
  {
    id: 'work-question-at-door', min: 16, max: 85, workplace: true, supervisor: true, illustration: 'conversation', title: "The apology volunteer",
    body: "As you leave {workplace}, {supervisor} hands you a statement accepting blame for a mistake you did not make. They would read it themselves, but apparently have a very urgent appointment.",
    choices: [
      option("later", "Hand it back before the appointment", {"respect": 5, "stress": 3}, "The appointment can wait", "You tell {supervisor} that the person responsible should speak. They find time to rewrite the statement using the word “I”.", "I refused to deliver {supervisor}’s apology for a mistake that was not mine.", undefined, {"supervisorBond": -4, "trust": {"supervisor": -8}}),
      option("clarify", "Read it, naming {supervisor} as the author", {"smarts": 3, "respect": 3}, "Accurately attributed", "You begin, “A statement from {supervisor}.” Their urgent appointment somehow takes place beside you, correcting your introduction.", "I made clear that an apology {supervisor} gave me was their statement.", undefined, {"supervisorBond": -6}),
      option("all", "Deliver it in a dramatic confession voice", {"happiness": 3, "respect": -4, "energy": -3}, "Too guilty to be credible", "You clutch your heart and confess to destroying everything. Somebody asks which mistake this concerns. {supervisor} interrupts before you can improvise another one.", "I turned {supervisor}’s attempt to make me apologise into an embarrassing performance.", undefined, {"supervisorBond": -8}),
    ],
  },
  {
    id: 'work-quiet-kindness', min: 16, max: 85, workplace: true, coworker: true, illustration: 'relationship', title: "Found your phone. Improved it.",
    body: "{coworker} returns your lost phone at {workplace}. The wallpaper is now their face. There are thirty-seven more versions in the camera roll, including one with your lunch.",
    choices: [
      option("thanks", "Thank them, then inspect the camera roll", {"happiness": 4, "stress": -2}, "A thorough identification procedure", "{coworker} says the photos prove who found it. You agree the evidence is overwhelming, especially the six close-ups of their nostrils.", "I got my lost phone back from {coworker}, along with thirty-eight unwanted portraits.", undefined, {"coworkerBond": 4}),
      option("laugh", "Ask them to pick their official portrait", {"happiness": 5, "energy": -1}, "The artist is difficult to please", "{coworker} rejects every photo and asks for better lighting. You take the phone back before the exhibition can expand.", "I made {coworker} choose one of the ridiculous selfies they left on my lost phone.", undefined, {"coworkerBond": 5}),
      option("rush", "Delete the lot while they watch", {"discipline": 3, "respect": -2}, "A brutal retrospective", "Each deleted selfie gets a small protest. You finish with the wallpaper. {coworker} describes the whole thing as censorship and finally goes back to work.", "I deleted {coworker}’s unsolicited phone portraits in front of them.", undefined, {"coworkerBond": -3}),
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
