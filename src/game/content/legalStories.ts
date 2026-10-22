import { storyOption as option, type EventTemplate } from './eventTypes';

/** Personal dilemmas around actual proceedings, custody and release. These
 * choices do not alter evidence, verdicts, sentence credit or legal payments. */
export const legalTemplates: readonly EventTemplate[] = [
  {
    id: 'case-question-list', min: 18, max: 120, legal: 'awaiting-trial', illustration: 'court',
    title: 'You cannot handle the rehearsal',
    body: 'Your {offence} hearing in {caseCity} is still ahead. You rehearse a speech so powerful that you briefly forget you are arguing with a shampoo bottle.',
    choices: [
      option('questions', 'Replace the speech with actual questions', { discipline: 3, stress: -2 }, 'Objection: shampoo', 'You cross out “ladies and gentlemen” and write down what you need to ask. The bottle is excused.', 'I wrote practical questions before my {offence} hearing.'),
      option('concise', 'Practise saying only what you know', { smarts: 2, energy: -2 }, 'No dramatic music required', 'Without the flourishes, the explanation takes thirty seconds. You miss the applause you were planning to imagine.', 'I practised a short factual explanation before my hearing.'),
      option('arguments', 'Give the bottle the performance of its life', { stress: 3, energy: -2 }, 'A hostile bathroom', 'You lose an hour arguing both sides. By the end, even your own shampoo seems unconvinced.', 'I exhausted myself rehearsing imaginary courtroom arguments.'),
    ],
  },
  {
    id: 'prison-case-boundary', min: 18, max: 120, legal: 'prison-peer', illustration: 'prison',
    title: 'The unauthorised adaptation',
    body: 'At {facility}, {prisonPeer} says your case would make a brilliant crime drama. They want to know which actor should play you. You have not agreed to be entertainment.',
    choices: [
      option('boundary', 'Tell them your life is not a casting call', { respect: 2 }, 'A cancelled production', '{prisonPeer} drops the pitch. You ask about something else before they can suggest a sequel.', 'I asked {prisonPeer} to stop treating my case as entertainment.', undefined, { prisonPeerBond: 1 }),
      option('feelings', 'Admit you are scared, not glamorous', { stress: -2 }, 'An answer about today', '{prisonPeer} stops discussing actors and listens. For once, you can talk without making any of it sound impressive.', 'I told {prisonPeer} how custody actually felt.', undefined, { prisonPeerBond: 3 }),
      option('boast', 'Demand an action star and several explosions', { respect: -2, stress: 2 }, 'Based on a wildly inflated story', '{prisonPeer} asks which part involved the helicopter. You are already regretting the trailer.', 'I exaggerated my case to impress {prisonPeer}.', undefined, { prisonPeerBond: -2 }),
    ],
  },
  {
    id: 'release-open-afternoon', min: 18, max: 120, legal: 'released', illustration: 'release',
    title: 'An unscheduled afternoon',
    body: 'Since your release from {facility}, an empty afternoon feels surprisingly unfamiliar. You catch yourself waiting for a prison timetable to tell you what comes next.',
    choices: [
      option('routine', 'Make a modest plan for the afternoon', { discipline: 3, energy: -1 }, 'A timetable you can change', 'You choose a few manageable things and leave gaps between them. The plan is useful partly because it belongs to you.', 'I made a modest afternoon plan while adjusting to life after {facility}.'),
      option('walk', 'Take an unhurried local walk', { happiness: 3, energy: -3 }, 'No bell to beat', 'You walk without trying to turn it into a task. Choosing when to head back feels like part of the afternoon.', 'I took an unhurried walk while adjusting to life after custody.'),
      option('fill', 'Fill every minute to avoid the quiet', { stress: 3, energy: -3 }, 'A crowded kind of freedom', 'You keep adding tasks until the afternoon feels like something to get through. Having choices does not make it easy to stop.', 'I filled an afternoon with tasks to avoid the quiet after my release.'),
    ],
  },
  {
    id: 'case-internet-defence', min: 18, max: 120, legal: 'awaiting-trial', rarity: 'uncommon', illustration: 'court',
    title: 'The comments section has passed the bar',
    body: 'While you prepare for your {offence} hearing in {caseCity}, a stranger online says courts cannot punish you if you write your name in green. Their profile picture is a wolf wearing sunglasses.',
    choices: [
      option('check', 'Check a reliable explanation of the process', { smarts: 4, discipline: 2, energy: -2 }, 'The wolf is not a source', 'You find actual information about the hearing. None of it mentions stationery colours.', 'I checked reliable information instead of trusting an online legal claim.'),
      option('joke', 'Thank the wolf for its years of legal service', { happiness: 3, stress: -2 }, 'An honorary qualification', 'You close the thread after one joke. It is the first part of the discussion that has helped your mood.', 'I laughed off absurd online advice about my hearing.'),
      option('argue', 'Spend the evening interrogating the wolf', { stress: 5, energy: -4, smarts: 1 }, 'You rest your case at 2 a.m.', 'They send a much longer theory involving flags. You prove nothing and sleep badly.', 'I wasted an evening arguing about bogus legal advice.'),
    ],
  },
  {
    id: 'case-heroic-sketch', min: 18, max: 120, legal: 'awaiting-trial', rarity: 'rare', illustration: 'court',
    title: 'Your good side is not a defence',
    body: 'With your {offence} hearing in {caseCity} approaching, you catch yourself practising a dignified courtroom expression in a reflection. It looks alarmingly like constipation.',
    choices: [
      option('prepare', 'Stop posing and review the hearing details', { discipline: 4, stress: -1 }, 'Preparation has fewer cheekbones', 'You check the practical information. At least you now know what you need to remember besides your best angle.', 'I reviewed practical details instead of rehearsing a courtroom pose.'),
      option('laugh', 'Try the expression once more and laugh', { happiness: 3, stress: -3 }, 'The serious face needs work', 'The second attempt is worse. Laughing at it releases some tension without changing what is ahead.', 'I laughed at my attempt to look dignified before a hearing.'),
      option('perfect', 'Perfect a look of misunderstood innocence', { stress: 4, energy: -3, respect: -2 }, 'A difficult role', 'After twenty minutes, you look guilty of something entirely new. Fortunately, the reflection is not a witness.', 'I spent too long rehearsing how I wanted to look in court.'),
    ],
  },
  {
    id: 'prison-nickname-audition', min: 18, max: 120, legal: 'prison-peer', rarity: 'uncommon', illustration: 'prison',
    title: 'The Professor has concerns',
    body: 'At {facility}, {prisonPeer} starts calling you “Professor” after you correctly explain how a cupboard door opens. You sense an opportunity to acquire completely undeserved prestige.',
    choices: [
      option('own', 'Accept the title and thank your imaginary faculty', { happiness: 4, stress: -1 }, 'A very small university', '{prisonPeer} laughs. You agree your expertise ends at cupboards, which keeps the joke friendly.', 'I shared a joke with {prisonPeer} about an undeserved nickname.', undefined, { prisonPeerBond: 4 }),
      option('stop', 'Ask them to use your actual name', { discipline: 3, happiness: -1 }, 'No honorary degree required', '{prisonPeer} drops it. You lose a joke you did not enjoy and gain a little less attention.', 'I asked {prisonPeer} not to use a prison nickname.', undefined, { prisonPeerBond: 1 }),
      option('mock', 'Give them a much nastier nickname', { happiness: 3, respect: -4, stress: 3 }, 'A joke changes owners', 'You laugh first. {prisonPeer} does not join in, and the conversation finishes without a graduation ceremony.', 'I upset {prisonPeer} by answering a nickname with an insult.', undefined, { prisonPeerBond: -6 }),
    ],
  },
  {
    id: 'prison-paper-mastermind', min: 18, max: 120, legal: 'prison-peer', rarity: 'rare', illustration: 'prison',
    title: 'The mastermind needs an eraser',
    body: '{prisonPeer} shows you a puzzle maze at {facility} and says they are excellent at escaping anything. Their pencil line runs directly through three printed walls.',
    choices: [
      option('solve', 'Solve it together without crossing the walls', { smarts: 4, energy: -2 }, 'An escape confined to paper', 'You find the actual route. {prisonPeer} insists the walls were printed unusually close together.', 'I solved a paper maze with {prisonPeer}.', undefined, { prisonPeerBond: 4 }),
      option('play', 'Draw a helicopter over the finish line', { happiness: 4, discipline: -1 }, 'An extremely generous puzzle budget', '{prisonPeer} adds a parachute. The escape becomes a cartoon, which is considerably more enjoyable.', 'I turned a difficult paper maze into a joke with {prisonPeer}.', undefined, { prisonPeerBond: 3 }),
      option('ridicule', 'Explain why their mastermind career is doomed', { happiness: 2, respect: -4, stress: 3 }, 'Walls remain between you', '{prisonPeer} folds the page before you finish. You have solved the problem of being asked again.', 'I mocked {prisonPeer} over a failed paper puzzle.', undefined, { prisonPeerBond: -6 }),
    ],
  },
  {
    id: 'prison-snoring-review', min: 18, max: 120, legal: 'prison-peer', rarity: 'uncommon', illustration: 'prison',
    title: 'Inner peace sounds terrible',
    body: 'At {facility}, {prisonPeer} boasts that their snoring proves they sleep with a clear conscience. You have heard industrial machinery with a lighter conscience.',
    choices: [
      option('honest', 'Ask them to take the noise seriously', { discipline: 3, stress: -1 }, 'An awkward conversation stays civil', '{prisonPeer} is embarrassed, but listens. There is no instant cure; at least they stop calling it a gift.', 'I spoke honestly with {prisonPeer} about their snoring.', undefined, { prisonPeerBond: 2 }),
      option('joke', 'Ask whether the conscience needs an oil change', { happiness: 4, stress: -2 }, 'The engine laughs', '{prisonPeer} laughs so hard they briefly reproduce the noise. You wish the demonstration had been less accurate.', 'I shared a joke about snoring with {prisonPeer}.', undefined, { prisonPeerBond: 4 }),
      option('imitate', 'Perform an unkindly accurate impression', { happiness: 3, respect: -4, stress: 3 }, 'A short and unpopular concert', '{prisonPeer} tells you to stop. You enjoy your own performance enough to make the conversation worse.', 'I offended {prisonPeer} by mocking their snoring.', undefined, { prisonPeerBond: -5 }),
    ],
  },
  {
    id: 'release-automatic-permission', min: 18, max: 120, legal: 'released', rarity: 'uncommon', illustration: 'release',
    title: 'You can just leave',
    body: 'Since leaving {facility}, you sometimes catch yourself waiting for permission to do ordinary things. Today you stand at the exit of a public building, then remember the door is available to you.',
    choices: [
      option('step', 'Step outside and choose where to go', { happiness: 4, discipline: 2, stress: -2 }, 'A small choice is still yours', 'You head out when you want to. The moment matters more than the distance you walk.', 'I noticed a small freedom while adjusting to life after custody.'),
      option('pause', 'Give yourself a moment before moving', { energy: 2, stress: -3 }, 'There is no bell', 'You take a breath. Getting used to freedom is allowed to take longer than opening a door.', 'I gave myself time while adjusting to life after release.'),
      option('scold', 'Tell yourself you should be over this', { stress: 4, happiness: -3 }, 'An old timetable gets a new voice', 'You leave, but spend the walk arguing with yourself. The criticism feels unpleasantly familiar.', 'I criticised myself for taking time to adjust after custody.'),
    ],
  },
];
