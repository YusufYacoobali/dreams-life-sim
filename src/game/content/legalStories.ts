import { storyOption as option, type EventTemplate } from './eventTypes';

/** Personal dilemmas around actual proceedings, custody and release. These
 * choices do not alter evidence, verdicts, sentence credit or legal payments. */
export const legalTemplates: readonly EventTemplate[] = [
  {
    id: 'case-question-list', min: 18, max: 120, legal: 'awaiting-trial', illustration: 'court',
    title: 'Before the hearing',
    body: 'Your {offence} hearing in {caseCity} is still ahead. You start a list of questions. Halfway down the page, it has become a speech to an imaginary courtroom.',
    choices: [
      option('questions', 'Separate the facts from the questions', { discipline: 3, stress: -2 }, 'A shorter page', 'You mark what you know and what you still need to ask. The uncertainty remains, but it no longer occupies every line.', 'I separated facts from questions while preparing for my {offence} hearing.'),
      option('concise', 'Practise one concise explanation', { smarts: 2, energy: -2 }, 'Without the grand finale', 'You try saying what you mean without a dramatic opening. It takes a few attempts to stop addressing an imaginary audience.', 'I practised a concise explanation before my {offence} hearing.'),
      option('arguments', 'Rehearse every possible argument', { stress: 3, energy: -2 }, 'The audience never leaves', 'You answer objections nobody has made, then invent better objections. The hearing is still ahead; you have already exhausted yourself once.', 'I wore myself out rehearsing imagined arguments before my hearing.'),
    ],
  },
  {
    id: 'prison-case-boundary', min: 18, max: 120, legal: 'prison-peer', illustration: 'prison',
    title: 'More than your case',
    body: 'At {facility}, {prisonPeer} asks about your case. You would like one conversation that does not begin with what brought you here.',
    choices: [
      option('boundary', 'Kindly say you want a different subject', { respect: 2 }, 'A little room to talk', '{prisonPeer} leaves the question alone. Setting a boundary does not have to end the conversation.', 'I asked {prisonPeer} for a conversation about something other than my case.', undefined, { prisonPeerBond: 1 }),
      option('feelings', 'Say how you feel, without retelling the case', { stress: -2 }, 'An answer about today', 'You explain how the day is going instead of repeating the case. {prisonPeer} listens without getting another account of the proceedings.', 'I talked to {prisonPeer} about how I felt in custody, without retelling my case.', undefined, { prisonPeerBond: 3 }),
      option('boast', 'Turn the answer into a boast', { respect: -2, stress: 2 }, 'The story takes over', 'You make the account sound impressive. {prisonPeer} goes quiet, and you end up feeling even more defined by the case.', 'I boasted about my case to {prisonPeer} and regretted the conversation.', undefined, { prisonPeerBond: -2 }),
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
];
