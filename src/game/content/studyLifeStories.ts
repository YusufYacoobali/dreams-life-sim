import { situation as s } from './lifeSituation';

/** Only matching recorded postsecondary courses can supply these situations. */
export const studyLifeTemplates = [
  s('study-timetable-colour-code', 'A beautifully organised delay', 'You sit down to study {studyField} for your course at {studySchool}. Twenty minutes later, your study timetable has three colours. You have not started the work.', [
    ['practice', 'Do one manageable exercise', { smarts: 3, discipline: 2, energy: -2 }, 'The first untidy answer', 'You choose one small exercise and attempt it. The answer needs work, but it gives you something more useful to examine than another empty timetable.', 'I attempted a small piece of {studyField} work instead of polishing my study plan.'],
    ['reset', 'Take a short reset', { stress: -3, energy: 2 }, 'The timetable can wait', 'You step away briefly and stop reorganising the same page. A break leaves you less wound up about beginning.', 'I took a short break from overplanning my {studyField} study time.'],
    ['perfect', 'Perfect the colour coding', { stress: 3, discipline: -2, energy: -1 }, 'The plan receives another edition', 'You reorganise the colours, then discover two categories that need different shades. The timetable looks increasingly accomplished. The work remains untouched.', 'I spent my study time redesigning a {studyField} timetable.'],
  ], { study: 'active', illustration: 'education' }),
  s('study-paused-unsolicited-tip', 'An unsolicited study tip', 'Someone asks how {studyField} at {studySchool} is going. You mention the pause. “Just try harder,” they say. You wonder whether the tuition office accepts that in instalments.', [
    ['explain', 'Explain the funding pause', { respect: 3, stress: -1 }, 'The actual difficulty gets a name', 'You explain that the course is waiting for tuition, then stop. They have no funding suggestion to add, but the advice about effort also stops.', 'I explained that my {studyField} course was paused for tuition.'],
    ['private', 'Keep the financial details private', { stress: -3, discipline: 2 }, 'A question you can decline', 'You say you would rather not discuss the details. The next question is about something else, and you answer that one more comfortably.', 'I kept the financial details of my paused {studyField} course private.'],
    ['pretend', 'Say you have already finished', { stress: 4, respect: -3 }, 'Congratulations arrive too soon', 'You say the course is finished. The congratulations arrive quickly, followed by questions your unfinished coursework cannot answer.', 'I claimed I had finished my {studyField} course while it was paused for tuition.'],
  ], { study: 'paused', illustration: 'education' }),
];
