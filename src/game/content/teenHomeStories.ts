import { EventTemplate, storyOption as o } from './eventTypes';

/** Original early-teen situations. No implied purchases, new contacts or qualifications. */
export const teenHomeTemplates: readonly EventTemplate[] = [
  {
    id: 'teen-old-recording', min: 11, max: 16, parent: true, illustration: 'relationship', title: 'A previous version of you',
    body: '{parent} finds an old recording of you explaining how rain works. Your theory involves somebody emptying a bath above the clouds.',
    choices: [
      o('watch', 'Watch it together', { happiness: 3, stress: -2 }, 'The expert stands corrected', 'You laugh at your explanation. {parent} remembers the questions that came after it.', 'I watched an old childhood recording with {parent}.', 3),
      o('private', 'Ask to keep the recording private', { respect: 2, discipline: 1 }, 'A smaller audience', '{parent} agrees not to show it to visitors. You keep the option of laughing at it yourself.', 'I asked {parent} to keep an embarrassing childhood recording private.', 2),
      o('defend', 'Defend the bath theory', { happiness: 3, energy: -1 }, 'Some revisions required', '{parent} asks who refills the bath. Your updated theory needs more time.', 'I tried defending my childhood explanation of rain.', 1),
    ],
  },
  {
    id: 'teen-shrinking-sleeves', min: 11, max: 16, school: 'any', illustration: 'wellbeing', title: 'Little Star, big photograph',
    body: 'Your school-photo proof arrives. You wore an old top that barely fits. Across your chest, in extremely clear letters, it says “LITTLE STAR”.',
    choices: [
      o('compare', 'Ask for a crop above the lettering', { smarts: 2, stress: -1 }, 'Now a very large head', 'The cropped proof removes the slogan and most of your shoulders. You approve it before anyone suggests keeping the original as a wallet photo.', 'I cropped an embarrassing slogan out of my school photograph.'),
      o('roll', 'Sign the proof like a celebrity', { happiness: 3, respect: 1 }, 'Little Star goes professional', 'You add a sweeping signature and “no interviews”. The joke gets a laugh. You still choose the smallest print size.', 'I signed my embarrassing Little Star photograph as though I were famous.'),
      o('compare-others', 'Inspect everyone else’s proof for worse outfits', { stress: 3, happiness: -2 }, 'A thorough investigation', 'You find a blinking face and one unfortunate collar. You spend so long arguing that the photo is “not that bad” that everyone asks to see it.', 'I drew more attention to my school photograph while hunting for worse ones.'),
    ],
  },
  {
    id: 'teen-family-game-timer', min: 11, max: 17, parent: true, illustration: 'relationship', title: 'Your parent knows this level',
    body: 'You promise {parent} one last round. They sit down, watch your first attempt and say, “I used to beat this blindfolded.” This is an outrageous development.',
    choices: [
      o('stop', 'Stop before they can demonstrate', { discipline: 3, stress: -1 }, 'Dignity preserved', 'You keep your promise and turn it off. {parent} seems more pleased about that than any old high score.', 'I stopped a game when I had promised {parent} I would.', 3),
      o('agree', 'Agree on one round each, then stop', { respect: 2, discipline: 2 }, 'Management still has it', '{parent} is annoyingly good. You both stop at the agreed time, although you explain that the controls have changed.', 'I played one agreed round with {parent} before stopping.', 2),
      o('extend', 'Demand rematches until you win', { happiness: 2, discipline: -2, stress: 2 }, 'One more humiliation', '{parent} wins again. You accuse them of practising in secret. The argument lasts longer than the round you promised would be last.', 'I kept extending a game after losing to {parent}.', -3),
    ],
  },
  {
    id: 'teen-phone-at-dinner', min: 12, max: 17, parent: true, illustration: 'relationship', title: 'Do teenagers smell fear?',
    body: '{parent} asks you to fix their phone. An open draft says, “Do teenagers smell fear? Mine only appears when the fridge opens.” They suddenly offer to fix it themselves.',
    choices: [
      o('ask', 'Offer an answer from a qualified teenager', { respect: 2, happiness: 2 }, 'Mostly, we smell cheese', '{parent} laughs and admits they were having a moan. You fix the phone, then both turn towards the sound of the fridge opening.', 'I caught {parent} complaining about me and answered their question about teenagers.', 4, {trust:{parent:3}}),
      o('wait', 'Fix it without mentioning the draft', { discipline: 2, stress: -1 }, 'A delicate repair', 'You close the draft and fix the setting. {parent} thanks you three times. You ask whether the fridge requires technical support too.', 'I fixed {parent}’s phone without making an issue of a private complaint about me.', 2),
      o('score', 'Send their contacts a mocking reading of it', { respect: -6, stress: 4 }, 'Technical support terminated', '{parent} hears their own message in your worst impression of them. They take the phone back and tell you exactly what they think of sharing private messages. Neither of you is laughing.', 'I sent {parent}’s private complaint to their contacts to humiliate them.', -16, {trust:{parent:-18}}),
    ],
  },
  {
    id: 'teen-notification-loop', min: 12, max: 17, illustration: 'wellbeing', title: 'Sent to the group',
    body: 'You send “Whoever made this group is unbearable” to the group itself. The admin replies, “Hi.” You can see several people typing.',
    choices: [
      o('away', 'Mute the group and disappear', { discipline: 3, stress: -3 }, 'A successful retreat', 'You miss the replies and spend the afternoon doing something else. The message remains embarrassing; you stop watching it happen.', 'I muted a group after sending an insulting message to it.'),
      o('name', 'Admit you meant a different chat', { smarts: 2, stress: -2 }, 'An explanation with limits', 'Someone asks which group you were insulting. You apologise instead of opening a second investigation. The typing indicators finally stop.', 'I apologised for an insulting group message.'),
      o('refresh', 'Explain that autocorrect meant “adorable”', { energy: -2, stress: 3 }, 'Please show your keyboard', 'Nobody believes you. Someone types “unbearably adorable” and you keep checking as the joke gets worse.', 'I blamed an insulting group message on autocorrect.'),
    ],
  },
  {
    id: 'teen-borrowed-charger', min: 12, max: 17, parent: true, illustration: 'relationship', title: 'The cable is in your hand',
    body: '{parent} announces that their charger has been missing for three days. You look down. Their charger is in your hand. There is still time to make this worse.',
    choices: [
      o('return', 'Hand over the evidence', { respect: 3, discipline: 1 }, 'Found at the scene', '{parent} accepts the charger and your apology. Three days of mystery ends in approximately two seconds.', 'I returned {parent}’s charger and admitted forgetting about it.', 3),
      o('place', 'Negotiate a shared charging spot', { discipline: 3 }, 'Conditional amnesty', 'You return the charger and choose a place everyone can find it. {parent} makes you repeat the part about returning it.', 'I agreed on a shared place for {parent}’s charger.', 2),
      o('deny', 'Say “What charger?” without hiding it', { respect: -3, stress: 2 }, 'A remarkably short cross-examination', '{parent} points at your hand. You look at it as though the cable has just appeared there. Nobody is convinced.', 'I denied taking {parent}’s charger while holding it.', -4),
    ],
  },
  {
    id: 'teen-old-interest-box', min: 12, max: 17, illustration: 'journal', title: 'A complaint from past you',
    body: 'You find a childhood letter addressed to yourself. It says, “If you are not a dinosaur by thirteen, you have ruined everything.” There is a drawing of the expected dinosaur.',
    choices: [
      o('try', 'Make a tail out of socks and deliver a roar', { happiness: 4, energy: -2 }, 'Partial compliance', 'The tail falls off during your first turn. You add “technical difficulties” beneath the original demand and draw yourself with better knees.', 'I answered a childhood demand to become a dinosaur by making a sock tail.'),
      o('keep', 'Write a formal rejection on the back', { happiness: 2, stress: -2 }, 'Your application was unsuccessful', 'You explain that the teeth would be expensive and doorways remain a concern. You sign it with a very serious claw print.', 'I wrote a rejection letter to my childhood plan to become a dinosaur.'),
      o('judge', 'Destroy the evidence', { discipline: -1, stress: -2 }, 'The dinosaur cannot prove anything', 'You tear the letter up, then notice you kept the drawing. It is an excellent dinosaur. You hide it somewhere nobody can ask questions.', 'I destroyed an unreasonable childhood demand and secretly kept its dinosaur drawing.'),
    ],
  },
  {
    id: 'teen-household-small-meal', min: 13, max: 17, parent: true, illustration: 'wellbeing', title: 'The pancake is on the ceiling',
    body: 'You help {parent} make “foolproof” pancakes. The first one is stuck to the ceiling. Neither of you wants to discuss how it got there.',
    choices: [
      o('read', 'Consult the recipe before pancake two', { discipline: 3, smarts: 1 }, 'The pan is a serving suggestion', 'The instructions recommend turning it gently. You complete the next batch without adding anything else to the ceiling.', 'I read the recipe after a disastrous pancake toss with {parent}.', 2),
      o('ask', 'Ask {parent} to demonstrate', { smarts: 3, energy: -1 }, 'A quieter technique', '{parent} uses a spatula. The pancake stays below head height. You both agree that this method has advantages.', 'I learned a less dramatic way to turn pancakes from {parent}.', 3),
      o('guess', 'Attempt the exact same toss again', { discipline: -2, stress: 2 }, 'Reproducible results', 'The second pancake hits the cupboard. {parent} takes the pan and gives you the cloth.', 'I repeated a failed pancake toss and made more mess.', -2),
    ],
  },
  {
    id: 'teen-parent-voice-note', min: 13, max: 17, parent: true, parentContact: true, illustration: 'relationship', title: 'That is definitely your voice',
    body: '{parent} sends a voice note pretending to be you: “I would love to do all the washing-up forever.” Their impression makes you sound like a distressed goose.',
    choices: [
      o('clarify', 'Request a less insulting goose', { respect: 1, happiness: 3 }, 'A second audition', '{parent} sends a deeper version. Now you sound like a goose with a cold. You both give up trying to discuss the dishes.', 'I demanded a better impression after {parent} impersonated me in a voice note.', 3),
      o('later', 'Offer one actual round of washing-up', { discipline: 2, energy: -2 }, 'Forever has been renegotiated', '{parent} accepts one evening. You wash up later, with the original recording playing beside the sink. The goose does not offer to dry.', 'I negotiated one evening of washing-up after {parent} sent a fake promise in my voice.', 4),
      o('guess', 'Send an impression of them volunteering instead', { happiness: 3, energy: -1 }, 'A household of terrible actors', '{parent} replies, “I sound nothing like that.” You send their goose back. The exchange ends with two laughing voice notes and no volunteers.', 'I answered {parent}’s fake voice note with an equally bad impression of them.', 2),
    ],
  },
  {
    id: 'teen-sunday-list', min: 13, max: 17, parent: true, illustration: 'relationship', title: 'Your stand-in has a meeting',
    body: 'To dodge chores, you left a dummy in your dressing gown at your desk. {parent} is now giving it a serious talk about responsibility. The dummy is handling it well.',
    choices: [
      o('choose', 'Step out and take over the discussion', { discipline: 3, energy: -2 }, 'A noticeable improvement in posture', '{parent} says the dummy already agreed to take the rubbish out. You do it while the dummy remains at the desk, apparently thinking about its future.', 'I replaced a dummy during {parent}’s lecture and did the chore it had agreed to.', 2),
      o('break', 'Leave a second dummy to play {parent}', { happiness: 4, energy: -2 }, 'A surprisingly peaceful household', '{parent} watches you arrange both dummies, then hands the real you a rubbish bag. The two stand-ins remain deep in discussion.', 'I made a second dummy to answer the first one and still had to do my chores.', 1),
      o('all', 'Stay hidden and let the dummy handle it', { discipline: -3, stress: 4, energy: -3 }, 'The witness is uncooperative', '{parent} removes the dressing gown, finds a cushion, and addresses the rest of the lecture to your hiding place. You have to wait for it to finish before coming out.', 'I hid while {parent} discovered my chore-dodging dummy.', -4),
    ],
  },
];
