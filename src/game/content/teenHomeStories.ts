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
    id: 'teen-shrinking-sleeves', min: 11, max: 16, illustration: 'wellbeing', title: 'Your top has become a crop top',
    body: 'You stretch in a familiar top and discover an alarming amount of midriff. Your sleeves have also retreated. Apparently, your body has been making decisions without consulting your wardrobe.',
    choices: [
      o('compare', 'Check an old photo for evidence', { smarts: 2, stress: -1 }, 'The sleeves were innocent', 'The photo confirms it: you have grown. The top has been doing the same job with less and less material to work with.', 'I realised how much I had grown after comparing an old photo with my clothes.'),
      o('roll', 'Roll the sleeves and call it fashion', { happiness: 2, discipline: 1 }, 'Extremely limited edition', 'You commit to the look. It remains a short top, but you stop tugging at it every few seconds.', 'I rolled up short sleeves and wore the top as it was.'),
      o('compare-others', 'Check everyone else’s growth rate', { stress: 3, happiness: -2 }, 'An unwinnable investigation', 'Some people are taller. Some are shorter. None of your checking gives your top another centimetre of fabric.', 'I worried about how my growth compared with other people’s.'),
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
    id: 'teen-phone-at-dinner', min: 12, max: 17, parent: true, illustration: 'relationship', title: 'A conversation with a screen in it',
    body: '{parent} is halfway through a story when you notice their phone in their hand. You may have found a witness for your next argument about phones.',
    choices: [
      o('ask', 'Ask for a few minutes without phones', { respect: 3, happiness: 1 }, 'A mutual arrangement', '{parent} puts the phone away. You agree to do the same when you are talking together.', 'I asked {parent} for a conversation without phones.', 3),
      o('wait', 'Wait, then ask about the story', { discipline: 2, stress: -1 }, 'Back to the interesting part', '{parent} finishes checking the message and returns to the story. You ask what happened next.', 'I brought {parent} back to a story after a phone interruption.', 2),
      o('score', 'Recite every time they mentioned your screen use', { respect: -2, stress: 3 }, 'An extensive case file', 'You remember more examples than the conversation needs. The original story goes unfinished.', 'I turned a phone interruption into an argument with {parent}.', -3),
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
    id: 'teen-old-interest-box', min: 12, max: 17, illustration: 'journal', title: 'Your former favourite thing',
    body: 'You find an old drawing of the thing you once intended to do every day forever. Forever appears to have ended quite a while ago.',
    choices: [
      o('try', 'Spend a little time drawing it again', { happiness: 3, energy: -2 }, 'Still available', 'You remember why you enjoyed it. You do not need to decide what the rest of forever looks like.', 'I revisited a subject I used to love drawing.'),
      o('keep', 'Keep the drawing as a good memory', { happiness: 2, stress: -2 }, 'A previous interest can stay previous', 'You put the drawing somewhere safe. Enjoying it then does not require enjoying it every day now.', 'I kept an old drawing without making myself restart the interest.'),
      o('judge', 'Decide you were foolish to like it', { happiness: -2, stress: 2 }, 'A rather harsh reviewer', 'The drawing has done nothing new to deserve the review. It was made by a younger you having a good time.', 'I judged an old interest more harshly than it deserved.'),
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
    id: 'teen-parent-voice-note', min: 13, max: 17, parent: true, parentContact: true, illustration: 'relationship', title: 'Sent from a windy place',
    body: '{parent} sends a voice message. The wind gets most of the speaking time. You can make out your name and something about later.',
    choices: [
      o('clarify', 'Ask for the details as text', { discipline: 2, respect: 1 }, 'The wind leaves the conversation', '{parent} sends a short message you can read. It answers the question the recording had been trying to ask.', 'I asked {parent} to resend a windy voice message as text.', 3),
      o('later', 'Arrange a time to talk properly', { happiness: 2, stress: -1 }, 'A clearer conversation', 'You speak when you can both hear each other. The original message was mostly a question about your day.', 'I arranged a proper conversation with {parent} after a windy voice message.', 4),
      o('guess', 'Reply as though you understood', { discipline: -2, stress: 2 }, 'An unlikely answer', '{parent} asks what your reply means. You still need to ask what the recording said.', 'I guessed at a voice message from {parent} instead of asking.', -2),
    ],
  },
  {
    id: 'teen-sunday-list', min: 13, max: 17, illustration: 'education', title: 'The plan needs another colour',
    body: 'You promised to finish everything by Sunday. Sunday is nearly over. You have completed six versions of the to-do list, including a colour key.',
    choices: [
      o('choose', 'Finish one task without making a new list', { discipline: 3, stress: -2 }, 'An unexpected practical development', 'One thing actually gets done. You resist the urge to redesign the tick beside it.', 'I stopped revising a to-do list and completed one task.'),
      o('break', 'Cross out half the tasks without remorse', { energy: 2, stress: -2 }, 'The list finally fits', 'Some plans are simply not happening tonight. Admitting it gives you room to stop; it does not complete the crossed-out tasks.', 'I cut an unrealistic evening plan instead of trying to finish everything.'),
      o('all', 'Declare an all-nighter. Design a new schedule.', { energy: -4, stress: 4, discipline: -1 }, 'Version seven is beautiful', 'You move between tasks, headings and snacks. Very little gets finished, but the colour key has become exceptional.', 'I exhausted myself planning too much and finishing very little.'),
    ],
  },
];
