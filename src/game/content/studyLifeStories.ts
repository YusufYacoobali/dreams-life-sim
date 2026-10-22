import { situation as s } from './lifeSituation';

/** Only matching recorded postsecondary courses can supply these situations. */
export const studyLifeTemplates = [
  s('study-timetable-colour-code', 'A beautifully organised delay', 'You sit down to study {studyField} for your course at {studySchool}. Twenty minutes later, your study timetable has three colours. You have not started the work.', [
    ['practice', 'Do one manageable exercise', { smarts: 3, discipline: 2, energy: -2 }, 'The first untidy answer', 'You choose one small exercise and attempt it. The answer needs work, but it gives you something more useful to examine than another empty timetable.', 'I attempted a small piece of {studyField} work instead of polishing my study plan.'],
    ['reset', 'Take a short reset', { stress: -3, energy: 2 }, 'The timetable can wait', 'You step away briefly and stop reorganising the same page. A break leaves you less wound up about beginning.', 'I took a short break from overplanning my {studyField} study time.'],
    ['perfect', 'Perfect the colour coding', { stress: 3, discipline: -2, energy: -1 }, 'The plan receives another edition', 'You reorganise the colours, then discover two categories that need different shades. The timetable looks increasingly accomplished. The work remains untouched.', 'I spent my study time redesigning a {studyField} timetable.'],
  ], { study: 'active', illustration: 'education' }),
  s('study-paused-unsolicited-tip', 'Financial genius', 'Your {studyField} course at {studySchool} is paused because you cannot cover tuition. Someone tells you to “just try harder”. Apparently, you forgot to try having money.', [
    ['explain', 'Ask whether their advice comes with tuition', { respect: 3, stress: -1 }, 'The motivational speech ends', 'You ask if they would like to cover the fee. They would not. Suddenly, everyone agrees the problem involves money.', 'I challenged glib advice about my tuition pause in {studyField}.'],
    ['private', 'Thank them for absolutely nothing', { stress: -3, discipline: 2 }, 'Advice returned unopened', 'You end the conversation before it becomes a lecture about positive thinking. The course can wait; so can their next tip.', 'I shut down unsolicited advice about my paused {studyField} course.'],
    ['pretend', 'Claim you have already graduated', { happiness: 2, stress: 5, respect: -3 }, 'A fictional qualification needs details', 'They ask about your final project. You describe a topic you have not studied yet and regret inviting questions.', 'I claimed to have finished my {studyField} course while it was still paused.'],
  ], { study: 'paused', illustration: 'education' }),
  s('study-confident-fake-source', 'According to Professor Madeup', 'While revising {studyField} at {studySchool}, you find a very confident online explanation. Its main source is “insert credible reference here”.', [
    ['verify', 'Check the claim against your course material', { smarts: 4, discipline: 3, energy: -3 }, 'Confidence was doing most of the work', 'The explanation mixed one useful point with two inventions. You keep the real point and work through it properly.', 'I checked a dubious {studyField} explanation against my course material.'],
    ['discard', 'Close it and take a short break', { stress: -3, energy: 2 }, 'One less fake expert', 'You stop arguing with a paragraph that cannot answer you. A few quiet minutes beat another suspicious citation.', 'I stepped away from an unreliable {studyField} study guide.'],
    ['defend', 'Defend the answer because it sounds impressive', { happiness: 2, smarts: -2, respect: -3, stress: 4 }, 'The source is still a placeholder', 'You repeat the claim aloud, reach the invented citation and hear how thin it sounds. You have practised sounding certain instead of understanding it.', 'I repeated an unsupported {studyField} claim instead of checking it.'],
  ], { study: 'active', rarity: 'uncommon', illustration: 'education' }),
];
