import { situation as s } from './lifeSituation';

export const homeLifeTemplates = [
  s('home-key-bowl', 'The key bowl is empty', 'You spend several minutes looking for your keys before discovering them beside the bowl specifically introduced to prevent this situation.', [
    ['place', 'Put them in the actual bowl', { discipline: 4, stress: -2 }, 'A modest procedural improvement', 'The keys finally meet their designated location. The bowl has been waiting patiently for this promotion.', 'I found my keys beside the place meant to keep them from getting lost.'],
    ['move', 'Move the bowl to where you look first', { smarts: 3, discipline: 2 }, 'A system that fits its user', 'You put the reminder where your attention naturally goes. It feels more useful than arguing with your own habits.', 'I moved my key bowl to a more useful place.'],
    ['search', 'Design an elaborate key-finding system', { energy: -4, stress: 3 }, 'Several diagrams, one bowl', 'You develop a plan more complicated than the original problem. The keys remain beside the bowl while you work.', 'I overcomplicated a problem that already had a bowl.'],
  ]),
  s('home-squeak-investigation', 'The house has one note', 'You notice a faint squeak each time you move a chair. After the fifth repetition, it begins to sound as though the room is commenting on your decisions.', [
    ['check', 'Check where the sound comes from', { smarts: 3, stress: -3 }, 'A small mystery identified', 'You locate the contact point and stop treating the noise as a personal opinion. Identifying it is enough for now.', 'I worked out where a repeated squeak in my home came from.'],
    ['shift', 'Use another chair for the moment', { energy: 2, stress: -2 }, 'A quieter temporary arrangement', 'You choose a different place to sit. A minor irritation does not have to occupy the whole afternoon.', 'I chose a quieter place to sit instead of arguing with a squeak.'],
    ['test', 'Repeat the noise until it explains itself', { stress: 4, energy: -3 }, 'A rigorous but limited experiment', 'You establish that the chair still squeaks. The room has learned rather more about your patience.', 'I tested an irritating squeak far more times than necessary.'],
  ]),
  s('home-box-worth-keeping', 'A box of exceptional quality', 'You finish unpacking an ordinary household item and decide its empty box might be too useful to throw away. The cupboard already contains evidence of this policy.', [
    ['recycle', 'Recycle the box properly', { discipline: 4, stress: -2 }, 'Space for a future decision', 'You flatten it and clear the area. The hypothetical need for this exact box remains hypothetical.', 'I recycled a good box instead of adding it to the collection.'],
    ['use', 'Give it a specific job now', { smarts: 3, discipline: 2 }, 'An employed box', 'You use it to organise loose papers. It earns its place by doing something rather than suggesting possibilities.', 'I gave an empty box a real organising job.'],
    ['store', 'Save it with the other excellent boxes', { happiness: 2, stress: 2 }, 'A growing packaging archive', 'The cupboard closes with some persuasion. Your future box requirements are comprehensively covered.', 'I kept another exceptionally promising empty box.'],
  ]),
  s('home-window-cleaning-discovery', 'The view has a smudge', 'You keep noticing a mark on a window. From one angle it resembles a distant bird; from another it is clearly something that happened to breakfast.', [
    ['clean', 'Clean the small patch', { discipline: 3, energy: -2 }, 'The bird disappears', 'The view becomes less mysterious. You complete the small task without deciding to clean the entire home.', 'I removed a window smudge that had looked like a distant bird.'],
    ['schedule', 'Add it to your next tidy-up', { discipline: 2, stress: -1 }, 'A sensible place on the list', 'You note the job and return to what you were doing. Recognising a task does not require doing it instantly.', 'I put a small household job on a manageable list.'],
    ['observe', 'Keep checking whether it has moved', { energy: -2, stress: 2 }, 'Remarkably stationary wildlife', 'The shape stays exactly where breakfast left it. You gather no new evidence.', 'I kept looking at a smudge instead of deciding what to do about it.'],
  ]),
  s('home-found-old-list', 'Urgent, according to an old list', 'While sorting papers at home, you find a list headed “ABSOLUTELY ESSENTIAL”. Half the items no longer mean anything to you.', [
    ['review', 'Keep only what still matters', { discipline: 4, stress: -3 }, 'A shorter present-day list', 'You separate current tasks from expired urgency. The old handwriting is allowed to have changed its mind.', 'I reviewed an old urgent list instead of inheriting all its worries.'],
    ['remember', 'Try to remember the forgotten items', { smarts: 3, happiness: 2 }, 'A small time capsule', 'Several details return, along with the reasons they once felt important. You do not turn them all into fresh tasks.', 'I remembered what an old household list had once meant.'],
    ['adopt', 'Treat every item as urgent again', { stress: 5, energy: -3 }, 'A past version of you takes charge', 'You create a busy afternoon from concerns that had mostly expired without causing trouble.', 'I made an old list urgent again without checking whether it still mattered.'],
  ]),
  s('home-unexpected-echo', 'Testing the room’s acoustics', 'You make a small noise in an unusually quiet room and discover an echo you had never noticed. Obviously, the next scientific step is another noise.', [
    ['play', 'Enjoy one brief ridiculous experiment', { happiness: 4, stress: -2 }, 'Domestic science concludes', 'You test a few sounds, laugh at yourself and stop before the experiment becomes the neighbourhood soundtrack.', 'I briefly investigated an unexpected echo in my home.'],
    ['notice', 'Listen to the room for a moment', { stress: -3, smarts: 2 }, 'A familiar place sounds different', 'You notice the ordinary sounds you usually miss. The home has not changed, but your attention has.', 'I listened more carefully to a familiar room.'],
    ['loud', 'Attempt the biggest echo available', { happiness: 2, stress: 3, energy: -2 }, 'The experiment exceeds its brief', 'The louder sound proves that louder sounds are louder. You decide this finding probably did not need announcing.', 'I took a small household echo experiment too far.'],
  ]),
].map(template => ({ ...template, home: true }));
