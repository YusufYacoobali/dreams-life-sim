import { situation as s } from './lifeSituation';

/** Prospective scenes require recorded earned retirement or current widowhood. */
export const laterLifeRecordTemplates = [
  s("retired-employer-box", "The algorithm wants you back", "You mark retired on an online form. It immediately suggests an exciting entry-level opportunity and asks whether you are available for early starts.", [
    ["guidance", "Explain to the chatbot what retired means", {"stress": 3, "smarts": 2, "energy": -2}, "So that is a yes to flexible working?", "You type NO in capital letters. The chatbot congratulates you on your enthusiasm.", "I tried to explain retirement to a form that kept recommending jobs."],
    ["ask", "Ask for the salary before rejecting it", {"respect": 3, "discipline": 3, "happiness": 2}, "Depending on experience", "You point out that you have decades of experience. The form offers a personality quiz instead of a number.", "I asked a recruitment form about pay after telling it I was retired."],
    ["repeat", "List your occupation as Formerly employed", {"happiness": 5, "stress": -2}, "Employment completed", "The form demands a reason for leaving. You write Completed employment and feel briefly like a decommissioned satellite.", "I described myself as Formerly employed on a form that would not accept retirement."],
  ], {"retired": true, "illustration": "journal"}),
  s('widowed-name-in-conversation', 'The sentence stops there', 'Someone mentions {lateSpouse}, then stops and apologises. You were in the middle of another subject. Now you have to decide whether to make room for the name or keep going.', [
    ['mention', 'Say the name is okay', { respect: 2, stress: -1 }, 'Room for the next sentence', 'You say that {lateSpouse} can be mentioned. The conversation slows long enough for you to choose what to say next, without asking you to explain everything you feel.', 'I made room for {lateSpouse}’s name in a conversation.'],
    ['private', 'Not today, please', { discipline: 2, stress: -1 }, 'The other subject resumes', 'You say you would rather not talk about {lateSpouse} today. They accept that and return to the subject you had started. You finish your sentence without another question.', 'I said I did not want to talk about {lateSpouse} today.'],
    ['perform', 'Force a cheerful answer', { stress: 3, energy: -2 }, 'A tone you have to maintain', 'You give a brighter answer than you feel. It moves the conversation along, but keeping up that tone takes effort.', 'I gave an overly cheerful answer when someone mentioned {lateSpouse}.'],
  ], { widowed: true, illustration: 'conversation' }),
];
