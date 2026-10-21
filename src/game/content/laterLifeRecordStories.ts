import { situation as s } from './lifeSituation';

/** Prospective scenes require recorded earned retirement or current widowhood. */
export const laterLifeRecordTemplates = [
  s('retired-employer-box', 'Retired, according to the form', 'You mark “retired” on a form. The next box still requires an employer. The instructions say to complete every box, but seem unsure which decade you are in.', [
    ['guidance', 'Find the retirement instructions', { discipline: 2, stress: -1 }, 'The useful note was smaller', 'You find the retirement guidance below a much larger instruction to complete every box. The answer takes less space than the search for it.', 'I checked how a form wanted my retirement recorded.'],
    ['ask', 'Ask what belongs in the box', { respect: 2, stress: -1 }, 'A question about the form', 'You ask for clarification. The answer concerns how to fill in the box, which is all you needed to know.', 'I asked how to complete an employer box after marking myself retired.'],
    ['repeat', 'Write “STILL RETIRED” in both boxes', { happiness: 2, stress: 2, energy: -2 }, 'Your position is very clear', 'The form now mentions retirement twice. It makes your point quite firmly without telling you how the employer box is meant to be completed.', 'I wrote “STILL RETIRED” across two boxes on a form.'],
  ], { retired: true, illustration: 'journal' }),
  s('widowed-name-in-conversation', 'The sentence stops there', 'Someone mentions {lateSpouse}, then stops and apologises. You were in the middle of another subject. Now you have to decide whether to make room for the name or keep going.', [
    ['mention', 'Say the name is okay', { respect: 2, stress: -1 }, 'Room for the next sentence', 'You say that {lateSpouse} can be mentioned. The conversation slows long enough for you to choose what to say next, without asking you to explain everything you feel.', 'I made room for {lateSpouse}’s name in a conversation.'],
    ['private', 'Not today, please', { discipline: 2, stress: -1 }, 'The other subject resumes', 'You say you would rather not talk about {lateSpouse} today. They accept that and return to the subject you had started. You finish your sentence without another question.', 'I said I did not want to talk about {lateSpouse} today.'],
    ['perform', 'Force a cheerful answer', { stress: 3, energy: -2 }, 'A tone you have to maintain', 'You give a brighter answer than you feel. It moves the conversation along, but keeping up that tone takes effort.', 'I gave an overly cheerful answer when someone mentioned {lateSpouse}.'],
  ], { widowed: true, illustration: 'conversation' }),
];
