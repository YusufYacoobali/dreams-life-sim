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
    id: 'teen-shrinking-sleeves', min: 11, max: 16, illustration: 'wellbeing', title: 'The sleeves have retreated',
    body: 'A familiar top now stops well above your wrists. Either you have grown or somebody has moved the ends.',
    choices: [
      o('compare', 'Compare it with an older photograph', { smarts: 2, stress: -1 }, 'A fairly ordinary explanation', 'The top looks the same. Your arms have been busy.', 'I noticed how much I had grown when my sleeves became too short.'),
      o('roll', 'Roll the sleeves up deliberately', { happiness: 2, discipline: 1 }, 'An intentional length', 'It is still the same top. At least the sleeves now look as though they received instructions.', 'I rolled up sleeves I had grown out of.'),
      o('compare-others', 'Spend the afternoon comparing heights', { stress: 3, happiness: -2 }, 'An inconclusive league table', 'People your age are growing at different rates. Checking again does not make yours change.', 'I worried about how quickly other people were growing.'),
    ],
  },
  {
    id: 'teen-family-game-timer', min: 11, max: 17, parent: true, illustration: 'relationship', title: 'After this round',
    body: 'You tell {parent} you will stop playing after this round. The game helpfully begins another round before you have finished the sentence.',
    choices: [
      o('stop', 'Stop at the end of the round', { discipline: 3, stress: -1 }, 'An actual stopping point', 'You leave the next round alone. {parent} does not have to ask again.', 'I stopped a game when I had agreed to stop.', 3),
      o('agree', 'Agree on a clear time for next time', { respect: 2, discipline: 2 }, 'Terms that fit on a clock', 'You stop now and discuss a time you can both recognise. “Soon” is removed from the agreement.', 'I agreed on a clearer stopping time with {parent}.', 2),
      o('extend', 'Keep announcing one more round', { happiness: 2, discipline: -2, stress: 2 }, 'The round develops sequels', '{parent} points out how many times you have said it. The argument lasts longer than the final round.', 'I kept extending a game after promising {parent} I would stop.', -3),
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
    id: 'teen-notification-loop', min: 12, max: 17, illustration: 'wellbeing', title: 'Nothing has happened again',
    body: 'You check for a new message. There is none. A few seconds later, you investigate whether that finding still holds.',
    choices: [
      o('away', 'Put the phone aside for a while', { discipline: 3, stress: -3 }, 'A longer interval', 'You get on with something else. The next check can wait until you have finished it.', 'I put my phone aside instead of repeatedly checking for messages.'),
      o('name', 'Notice what you are waiting for', { smarts: 2, stress: -2 }, 'A more useful question', 'You are hoping for a reply, rather than expecting new information every few seconds. Naming it makes the checking easier to stop.', 'I noticed why I kept checking for a message.'),
      o('refresh', 'Check just a few more times', { energy: -2, stress: 3 }, 'A thorough absence of news', 'The screen remains well inspected. Your afternoon receives less attention.', 'I kept checking for a message that had not arrived.'),
    ],
  },
  {
    id: 'teen-borrowed-charger', min: 12, max: 17, parent: true, illustration: 'relationship', title: 'Temporary ownership',
    body: 'You borrow {parent}’s charger and find it in your room several days later. Your room appears to have extended the loan.',
    choices: [
      o('return', 'Return it and explain', { respect: 3, discipline: 1 }, 'The charger goes home', '{parent} had been looking for it. Returning it is more useful than your explanation.', 'I returned {parent}’s charger after forgetting I had borrowed it.', 3),
      o('place', 'Agree on a place to return borrowed things', { discipline: 3 }, 'A less ambitious system', 'You return the charger and choose a visible spot for future returns. Remembering remains your part of the arrangement.', 'I agreed on a place to return things I borrowed from {parent}.', 2),
      o('deny', 'Deny having seen it', { respect: -3, stress: 2 }, 'A recognisable cable', '{parent} spots it beside you. You now have to explain the charger and the denial.', 'I denied borrowing {parent}’s charger while it was beside me.', -4),
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
    id: 'teen-household-small-meal', min: 13, max: 17, parent: true, illustration: 'wellbeing', title: 'The recipe says “simply”',
    body: 'You help {parent} prepare a simple meal. The recipe uses “simply” just before the step neither of you can understand.',
    choices: [
      o('read', 'Read the next few steps before continuing', { discipline: 3, smarts: 1 }, 'Fewer surprises', 'You work out what needs to happen first. {parent} handles the part that needs a more experienced hand.', 'I read ahead while helping {parent} prepare a meal.', 2),
      o('ask', 'Ask {parent} to explain what they are doing', { smarts: 3, energy: -1 }, 'A useful running commentary', '{parent} explains each step as you help. You ask why the supposedly simple recipe needed so many bowls.', 'I asked {parent} to explain the steps while we prepared a meal.', 3),
      o('guess', 'Skip ahead to the part that looks obvious', { discipline: -2, stress: 2 }, 'The bowls had a reason', '{parent} stops to sort out the order. You return to the step you skipped.', 'I guessed at a recipe step and made preparing a meal harder.', -2),
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
    id: 'teen-sunday-list', min: 13, max: 17, illustration: 'education', title: 'A very ambitious evening',
    body: 'Your list for the evening contains more tasks than the evening appears to contain hours. Writing smaller has not helped.',
    choices: [
      o('choose', 'Choose one useful thing to finish', { discipline: 3, stress: -2 }, 'One actual tick', 'You finish a manageable task and move the rest to a realistic place on the list.', 'I made an overfull evening list more manageable.'),
      o('break', 'Take a short break, then revise the list', { energy: 2, stress: -2 }, 'A second draft', 'After a pause, you make a shorter plan. It includes time to stop.', 'I took a break and made a more realistic plan for my evening.'),
      o('all', 'Try to do everything at once', { energy: -4, stress: 4, discipline: -1 }, 'Several things started', 'You move between tasks without finishing much. The list looks much the same when you stop.', 'I tried to do too many things at once and made little progress.'),
    ],
  },
];
