import { EventTemplate, storyOption as o } from './eventTypes';

/** Original early-life situations. Props are narrative; money and people are never invented. */
export const schoolDayTemplates: readonly EventTemplate[] = [
  {
    id: 'toddler-stairwell-echo', min: 2, max: 4, illustration: 'birthday', title: 'Who said that?',
    body: 'Your voice echoes in a stairwell. Whoever lives in the walls knows the same words as you, but always says them late.',
    choices: [
      o('hello', 'Try a very long hello', { happiness: 3, energy: -1 }, 'A late reply', 'The walls return most of your hello. You start again before they finish.', 'I discovered an echo and gave it a very long greeting.'),
      o('quiet', 'Try a quiet little word', { smarts: 2, discipline: 1 }, 'Volume control', 'The quiet word barely comes back. You try a louder one and hear the difference.', 'I tested how loudly I had to speak to hear an echo.'),
      o('wait', 'Wait for the walls to start', { discipline: 2 }, 'A patient opponent', 'Nothing happens. Whoever is in there appears to be waiting for you too.', 'I waited for an echo to speak first.'),
    ],
  },
  {
    id: 'toddler-zipper-puzzle', min: 2, max: 5, illustration: 'wellbeing', title: 'A one-way machine',
    body: 'You can pull a jacket’s zip down perfectly. Getting it started in the other direction appears to require a different kind of engineering.',
    choices: [
      o('align', 'Line the bottom pieces up carefully', { discipline: 3, smarts: 1 }, 'A small connection', 'You hold the pieces together and make another attempt. Taking it slowly helps.', 'I practised lining up the bottom of a jacket zip.'),
      o('inspect', 'Look closely at the little teeth', { smarts: 3 }, 'An interesting machine', 'Two rows of teeth join as the slider moves. You inspect them from both sides.', 'I examined how a zip joined two rows of little teeth.'),
      o('break', 'Put it down and take a break', { happiness: 2, energy: 1 }, 'Engineering postponed', 'The jacket lies beside you. You give your fingers a rest before another attempt.', 'I took a break from trying to fasten a zip.'),
    ],
  },
  {
    id: 'toddler-shadow-race', min: 3, max: 5, illustration: 'wellbeing', title: 'A very close race',
    body: 'Your shadow keeps reaching the wall before you. You try standing still. It has apparently thought of that too.',
    choices: [
      o('dance', 'Make it do a silly dance', { happiness: 4, energy: -2 }, 'An obedient rival', 'You stop trying to beat the shadow and give it increasingly ridiculous instructions.', 'I made my shadow do a silly dance.'),
      o('light', 'Move closer to the light', { smarts: 3 }, 'Changing competition', 'Your shadow grows. You move back and watch it shrink again.', 'I discovered that moving near a light changed my shadow’s size.'),
      o('rest', 'Sit down beside it', { energy: 3, stress: -1 }, 'Joint last place', 'Neither of you gets anywhere. It is quite comfortable.', 'My shadow and I took a break from racing.'),
    ],
  },
  {
    id: 'toddler-cardboard-postbox', min: 3, max: 5, illustration: 'journal', title: 'Urgent correspondence',
    body: 'You draw a letter and slide it into a cardboard box. It comes straight out of the missing bottom. The postal service is extremely fast.',
    choices: [
      o('repair', 'Fold a bottom for the box', { discipline: 3, smarts: 1 }, 'Delivery delayed', 'The letter stays inside this time. You open the box to make sure it arrived.', 'I repaired my cardboard postbox so letters would stay inside.'),
      o('sort', 'Make a pile for each colour', { smarts: 2, happiness: 1 }, 'Sorting office', 'You sort your drawings into neat piles. One letter is mostly brown scribbles and gets its own pile.', 'I sorted my pretend letters by colour.'),
      o('express', 'Send the same letter again', { happiness: 4, energy: -1 }, 'Express service', 'The letter falls out again. You are delighted by the consistency.', 'I posted the same drawing through a bottomless box several times.'),
    ],
  },
  {
    id: 'toddler-biscuit-halves', min: 3, max: 5, illustration: 'birthday', title: 'Two is more than one',
    body: 'Your biscuit breaks in half. There are now two biscuits, although something about the total feels suspicious.',
    choices: [
      o('compare', 'Fit the halves back together', { smarts: 3, discipline: 1 }, 'The original arrangement', 'The edges match. You test them twice before accepting that both pieces were one biscuit.', 'I fitted two broken biscuit halves back together.'),
      o('celebrate', 'Celebrate the extra biscuit', { happiness: 4 }, 'Excellent arithmetic', 'You enjoy both pieces. The portion has not changed, but the occasion has improved.', 'I celebrated having two pieces of the same biscuit.'),
      o('crumbs', 'Count all the little crumbs', { smarts: 2, energy: -1 }, 'Rapid expansion', 'There are rather more crumbs than halves. You lose count and start again.', 'I tried to count every crumb from a broken biscuit.'),
    ],
  },
  {
    id: 'school-inverted-map', min: 6, max: 11, school: 'primary', teacher: true, illustration: 'education', title: 'North has moved',
    body: '{teacher} gives you a classroom map exercise. You have been following it upside down. Your desk is apparently in the sea.',
    choices: [
      o('turn', 'Turn it around and restart', { discipline: 2, energy: -1 }, 'Dry land', 'The room makes more sense now. You correct the route you drew.', 'I corrected a map exercise after reading the map upside down.', undefined, { grades: 2 }),
      o('ask', 'Ask how to find north', { smarts: 2 }, 'A useful arrow', '{teacher} points out the compass. You practise turning the map without losing your place.', 'I asked {teacher} how to orient a map.', undefined, { teacherBond: 2, skill: { id: 'science', delta: 1 } }),
      o('submarine', 'Announce that your desk is a submarine', { happiness: 3, respect: -1 }, 'Fleet recalled', '{teacher} allows one submarine noise, then asks you to correct the map.', 'I called my desk a submarine during a map exercise.', undefined, { teacherBond: -1 }),
    ],
  },
  {
    id: 'school-library-whisper', min: 6, max: 11, school: 'primary', classmate: true, illustration: 'relationship', title: 'Quiet, please',
    body: '{classmate} tells you something funny during quiet reading. You try not to laugh. The noise you make is considerably less dignified.',
    choices: [
      o('pause', 'Take a breath and keep reading', { discipline: 3, stress: -1 }, 'Nearly composed', 'You manage another paragraph. {classmate} makes a heroic effort to look innocent.', 'I recovered from a laughing fit during quiet reading.'),
      o('later', 'Ask for the rest at break', { respect: 2 }, 'A sensible booking', '{classmate} agrees to save the story. You both get back to your books.', 'I asked {classmate} to finish a funny story at break.', undefined, { peerBond: 3 }),
      o('reply', 'Whisper an even worse joke', { happiness: 3, discipline: -1 }, 'Sympathy laughter', 'Now neither of you is reading much. The joke was not even particularly good.', 'I made {classmate} laugh during quiet reading.', undefined, { peerBond: 2, grades: -1 }),
    ],
  },
  {
    id: 'school-relay-handover', min: 7, max: 11, school: 'primary', classmate: true, teacher: true, illustration: 'wellbeing', title: 'Passing the problem',
    body: 'During relay practice, you and {classmate} both let go of the baton. {teacher} watches it finish the handover by itself.',
    choices: [
      o('practise', 'Practise the handover together', { discipline: 2, energy: -3 }, 'A firmer arrangement', 'You slow down and agree on a signal. The next few handovers stay off the ground.', 'I practised relay handovers with {classmate}.', undefined, { peerBond: 3, skill: { id: 'sport', delta: 2 } }),
      o('ask', 'Ask {teacher} to demonstrate', { smarts: 1, energy: -1 }, 'One hand at a time', '{teacher} shows you where to hold it. You try again at walking speed.', 'I asked {teacher} to demonstrate a relay handover.', undefined, { teacherBond: 2, skill: { id: 'sport', delta: 1 } }),
      o('blame', 'Insist {classmate} dropped it', { respect: -3 }, 'Two empty hands', '{classmate} points out that you also let go. The next handover is rather frosty.', 'I blamed {classmate} for a baton we both dropped.', undefined, { peerBond: -4, teacherBond: -2 }),
    ],
  },
  {
    id: 'school-bean-monitor', min: 6, max: 11, school: 'primary', teacher: true, illustration: 'education', title: 'Management of one bean',
    body: '{teacher} asks you to monitor the classroom bean plant. You have made a progress chart. The bean has contributed one leaf.',
    choices: [
      o('measure', 'Measure it at the same time', { discipline: 3, energy: -1 }, 'Consistent research', 'You keep the measurements comparable. The chart finally has something useful to say.', 'I measured our classroom bean plant at a consistent time.', undefined, { grades: 1, skill: { id: 'science', delta: 2 } }),
      o('ask', 'Ask what the plant needs', { smarts: 2 }, 'A manageable workload', '{teacher} explains the light and water it needs. You adjust the care plan.', 'I asked {teacher} how to care for the classroom bean plant.', undefined, { teacherBond: 3 }),
      o('speech', 'Give it a motivational speech', { happiness: 3 }, 'No visible response', 'The bean remains one leaf ahead of doing nothing. You add a speech bubble to the chart.', 'I tried encouraging a bean plant with a speech.'),
    ],
  },
  {
    id: 'school-secret-language', rarity: 'uncommon', min: 7, max: 11, school: 'primary', classmate: true, illustration: 'relationship', title: 'A private language',
    body: 'You and {classmate} invent a secret language. By lunchtime, neither of you remembers the word for lunch.',
    choices: [
      o('dictionary', 'Write a tiny dictionary together', { smarts: 2, discipline: 1 }, 'Terms agreed', 'You settle on a few words you can both remember. Lunch gets a very short entry.', 'I wrote a small secret-language dictionary with {classmate}.', undefined, { peerBond: 3 }),
      o('gestures', 'Try gestures instead', { happiness: 3, energy: -1 }, 'Unexpected pantomime', 'Your gesture for lunch looks like a trapped bird. {classmate} understands eventually.', 'I tried inventing secret gestures with {classmate}.', undefined, { peerBond: 2, skill: { id: 'acting', delta: 1 } }),
      o('ordinary', 'Switch back to ordinary words', { stress: -2, discipline: 1 }, 'Translation complete', 'The conversation becomes much easier. You keep one secret word for emergencies.', 'I abandoned most of our secret language when we forgot it.'),
    ],
  },
  {
    id: 'school-microphone-rehearsal', min: 7, max: 11, school: 'primary', teacher: true, illustration: 'education', title: 'Is this thing on?',
    body: 'At assembly rehearsal, {teacher} asks you to test the microphone. You say “Is this thing on?” The empty hall asks it back.',
    choices: [
      o('read', 'Practise the actual announcement', { discipline: 2, energy: -2 }, 'Clear enough', 'You slow down and read it through. {teacher} asks you to keep that pace.', 'I practised reading an announcement into the assembly microphone.', undefined, { teacherBond: 2, skill: { id: 'acting', delta: 2 } }),
      o('breathe', 'Ask how to stop rushing', { smarts: 1, stress: -2 }, 'Room for a breath', '{teacher} marks pauses on the page. The announcement becomes easier to read.', 'I asked {teacher} for help speaking more slowly.', undefined, { teacherBond: 3 }),
      o('noise', 'Try an impressive monster noise', { happiness: 3, respect: -2 }, 'Sound check complete', 'It is impressive. {teacher} moves the microphone out of reach for the moment.', 'I tested an assembly microphone with a monster noise.', undefined, { teacherBond: -3 }),
    ],
  },
  {
    id: 'school-rainy-break', min: 6, max: 11, school: 'primary', classmate: true, illustration: 'relationship', title: 'Indoor championship',
    body: 'Rain keeps your class inside at break. {classmate} proposes a board game, then explains a rule you are fairly sure they just invented.',
    choices: [
      o('agree', 'Agree on the rules first', { discipline: 2, respect: 1 }, 'Before the first move', 'You settle the argument before starting. The game is much closer without surprise rules.', 'I agreed on board-game rules with {classmate} before playing.', undefined, { peerBond: 3 }),
      o('play', 'Try their strange version', { happiness: 3 }, 'House rules', 'The rules are ridiculous in both directions. You finish the game laughing.', 'I tried {classmate}’s unusual board-game rules.', undefined, { peerBond: 2 }),
      o('quit', 'Accuse them of cheating and quit', { stress: 2, respect: -2 }, 'An empty seat', 'The game stops. {classmate} spends the rest of break playing something else.', 'I accused {classmate} of cheating before our game began.', undefined, { peerBond: -4 }),
    ],
  },
  {
    id: 'school-label-swap', rarity: 'uncommon', min: 8, max: 11, school: 'primary', classmate: true, teacher: true, illustration: 'education', title: 'The wrong caption',
    body: 'Your classroom display has {classmate}’s label under your drawing and yours under a picture of a potato. {teacher} is about to show the class.',
    choices: [
      o('quiet', 'Point out the swap quietly', { respect: 2, discipline: 1 }, 'Labels corrected', '{teacher} swaps the labels before the display. The potato keeps its anonymity.', 'I quietly pointed out swapped labels on a classroom display.', undefined, { teacherBond: 2, peerBond: 1 }),
      o('joke', 'Introduce your new potato portrait', { happiness: 3 }, 'A brief artistic career', '{classmate} laughs and helps switch the labels. Your drawing gets its own name back.', 'I joked about a potato picture being labelled as my work.', undefined, { peerBond: 3 }),
      o('accuse', 'Accuse {classmate} of stealing credit', { respect: -3, stress: 2 }, 'The labels were loose', '{teacher} explains that the labels fell off earlier. {classmate} does not enjoy the accusation.', 'I blamed {classmate} for labels that had fallen off a display.', undefined, { peerBond: -5, teacherBond: -2 }),
    ],
  },
  {
    id: 'teen-unit-confusion', min: 12, max: 17, school: 'secondary', teacher: true, illustration: 'education', title: 'A remarkably large answer',
    body: 'Your science calculation produces a desk taller than a mountain. {teacher} asks whether you used centimetres or metres. You used whichever fitted.',
    choices: [
      o('redo', 'Redo it with consistent units', { discipline: 2, energy: -3 }, 'A smaller desk', 'The corrected answer fits in the classroom. You mark the unit beside every step.', 'I corrected inconsistent units in a science calculation.', undefined, { grades: 2, skill: { id: 'science', delta: 2 } }),
      o('help', 'Ask where the units changed', { smarts: 2 }, 'The missing conversion', '{teacher} helps you find the line where the scale changed. You finish the correction yourself.', 'I asked {teacher} to help find a unit-conversion mistake.', undefined, { teacherBond: 3, grades: 1 }),
      o('defend', 'Defend your extremely large desk', { happiness: 2, discipline: -1 }, 'Insufficient classroom space', '{teacher} returns the calculation for correction. The original answer does not earn the marks.', 'I defended a science answer with incompatible units.', undefined, { grades: -2, teacherBond: -2 }),
    ],
  },
  {
    id: 'teen-debate-draw', min: 13, max: 17, school: 'secondary', classmate: true, teacher: true, illustration: 'education', title: 'The other side',
    body: '{teacher} assigns debate sides by drawing names. You must argue against an idea you support. {classmate} looks delighted with the arrangement.',
    choices: [
      o('research', 'Research the strongest counterargument', { smarts: 2, energy: -3 }, 'An inconvenient good point', 'You find a better objection than you expected. Your speech becomes more careful about its claims.', 'I researched a debate position I did not personally support.', undefined, { grades: 2, teacherBond: 2 }),
      o('practice', 'Rehearse against {classmate}', { discipline: 2, energy: -2 }, 'Useful opposition', 'You practise responding without interrupting. {classmate} finds the weak parts of your opening.', 'I rehearsed a class debate with {classmate}.', undefined, { peerBond: 3, skill: { id: 'politics', delta: 2 } }),
      o('refuse', 'Refuse to prepare that side', { stress: -1, respect: -2 }, 'A very short opening', '{teacher} records the missing preparation. Your opinion remains yours; the assignment remains unfinished.', 'I refused to prepare my assigned debate position.', undefined, { grades: -2, teacherBond: -3 }),
    ],
  },
  {
    id: 'teen-yearbook-proof', rarity: 'uncommon', min: 13, max: 17, school: 'secondary', classmate: true, teacher: true, illustration: 'journal', title: 'Words to remember',
    body: 'A proof of the class yearbook puts {classmate}’s quote beside your name. It says “Insert something memorable here.” {teacher} wants corrections today.',
    choices: [
      o('correct', 'Send the correct name and quote', { discipline: 2, respect: 1 }, 'Proof corrected', '{teacher} updates the draft. {classmate} also sends an actual quote this time.', 'I corrected the names and quotations on a yearbook proof.', undefined, { teacherBond: 2, peerBond: 1 }),
      o('together', 'Write better quotes with {classmate}', { happiness: 3, energy: -1 }, 'Several rejected drafts', 'You reject a lot of terrible lines before settling on two you can live with.', 'I helped {classmate} choose a yearbook quote.', undefined, { peerBond: 4 }),
      o('keep', 'Keep the placeholder beside your name', { happiness: 2, respect: -1 }, 'Memorable enough', 'You approve the draft as written. {teacher} checks that you really mean it.', 'I deliberately kept a placeholder as my yearbook quote.'),
    ],
  },
  {
    id: 'teen-study-soundtrack', min: 12, max: 17, school: 'secondary', classmate: true, illustration: 'relationship', title: 'Background noise',
    body: 'You and {classmate} try studying together. Their playlist has a chorus you cannot stop singing. Neither of you has turned the page.',
    choices: [
      o('quiet', 'Suggest one quiet study session', { discipline: 3, energy: -2 }, 'An actual page turned', 'You agree to save the playlist for a break. The work finally starts moving.', 'I agreed on a quiet study session with {classmate}.', undefined, { grades: 2, peerBond: 2 }),
      o('separate', 'Work separately and meet after', { discipline: 2, stress: -1 }, 'Different methods', 'You finish your own section in quiet. {classmate} keeps the music and understands the arrangement.', 'I chose to study separately from {classmate}.'),
      o('sing', 'Abandon the work for the chorus', { happiness: 3, energy: -1 }, 'Perfectly rehearsed', 'You both learn the chorus. The assignment is less impressed.', 'I sang with {classmate} instead of finishing a study session.', undefined, { grades: -2, peerBond: 3 }),
    ],
  },
  {
    id: 'teen-family-interview', rarity: 'uncommon', min: 14, max: 17, parent: true, parentContact: true, school: 'secondary', teacher: true, illustration: 'relationship', title: 'The long version',
    body: '{teacher} sets a family-history interview. You call {parent} with one question about school. Twenty minutes later, they are still describing the journey there.',
    choices: [
      o('listen', 'Listen and write useful follow-ups', { respect: 2, energy: -2 }, 'An unexpected detail', 'A follow-up produces a story you had not heard before. You organise your notes afterwards.', 'I listened to {parent}’s school memories for a class interview.', 4, { grades: 1 }),
      o('focus', 'Explain which questions you need', { discipline: 2, smarts: 1 }, 'Back to the assignment', 'You show {parent} the questions. The answers become shorter and much easier to organise.', 'I explained my interview questions to {parent}.', 2, { grades: 2 }),
      o('interrupt', 'Keep interrupting to speed things up', { stress: 2, respect: -2 }, 'Short answers at last', '{parent} stops telling the long stories. Your notes are shorter than you hoped.', 'I kept interrupting {parent} during a family-history interview.', -4, { grades: -1 }),
    ],
  },
  {
    id: 'teen-volunteer-roster', min: 14, max: 17, school: 'secondary', classmate: true, teacher: true, illustration: 'education', title: 'Two names, one job',
    body: '{teacher} has put you and {classmate} down to tidy the classroom after an activity. You both thought the other person had volunteered.',
    choices: [
      o('share', 'Split the work and get started', { discipline: 2, energy: -3 }, 'Finished sooner', 'You agree who will do each part. Complaining takes longer than the last few chairs.', 'I shared the classroom cleanup with {classmate}.', undefined, { peerBond: 3, teacherBond: 2 }),
      o('clarify', 'Ask {teacher} how the roster works', { smarts: 1, respect: 2 }, 'A rotating arrangement', '{teacher} explains the rotation. You help this time and know when your next turn is.', 'I asked {teacher} to explain the classroom duty roster.', undefined, { teacherBond: 2 }),
      o('leave', 'Leave {classmate} to do it', { energy: 2, respect: -3 }, 'One name remembered', '{classmate} finishes alone. They and {teacher} both notice your early departure.', 'I left {classmate} to finish our classroom duty alone.', undefined, { peerBond: -5, teacherBond: -3 }),
    ],
  },
  {
    id: 'teen-marking-correction', min: 14, max: 17, school: 'secondary', teacher: true, illustration: 'education', title: 'An honest correction',
    body: '{teacher} returns a marked exercise. One correct answer has been crossed out, but another wrong answer received credit. You check the sums twice.',
    choices: [
      o('both', 'Show {teacher} both mistakes', { respect: 3, discipline: 1 }, 'An accurate record', '{teacher} corrects both marks. The errors cancel out, and your overall grade stays the same.', 'I showed {teacher} two marking mistakes that cancelled each other out.', undefined, { teacherBond: 3 }),
      o('understand', 'Ask to work through the answers', { smarts: 2, energy: -2 }, 'More useful than a mark', 'You identify what made each answer right or wrong. The extra understanding helps your current work.', 'I worked through a marked exercise with {teacher}.', undefined, { grades: 2, teacherBond: 2 }),
      o('ignore', 'Leave the balanced mistakes alone', { stress: -1 }, 'Same total', 'You keep the paper as it is. The overall mark is unchanged, but you make a note of the correct answers.', 'I left two balancing marking errors uncorrected.'),
    ],
  },
];
