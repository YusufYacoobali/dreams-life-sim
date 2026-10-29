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
    id: 'toddler-zipper-puzzle', min: 2, max: 5, illustration: 'wellbeing', title: 'The two-headed jacket',
    body: 'You manage to zip two jackets together. They are now one enormous jacket with four sleeves. This may be your greatest invention.',
    choices: [
      o('align', 'Carefully separate the creature', { discipline: 3, smarts: 1 }, 'Back to two jackets', 'You work out which zip goes where. Both jackets survive the experiment.', 'I worked out how to separate two jackets I had zipped together.'),
      o('inspect', 'Investigate whether a third one would fit', { smarts: 3 }, 'Expandable technology', 'You examine the teeth and discover why only certain sides join. The four-sleeved version remains your finest work.', 'I examined how jacket zips could join together.'),
      o('break', 'Leave your invention on the floor', { happiness: 2, energy: 1 }, 'Resting between appearances', 'The creature lies still. You rest beside it. World-changing ideas are tiring.', 'I took a break after zipping two jackets together.'),
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
    id: 'school-inverted-map', min: 6, max: 11, school: 'primary', teacher: true, illustration: 'education', title: 'The staffroom boss fight',
    body: 'You copied your school map from a video game. {teacher} wants to know why the staffroom is labelled “FINAL BOSS” and the toilets contain treasure.',
    choices: [
      o('turn', 'Replace the monsters with actual rooms', { discipline: 2, energy: -2 }, 'A less dangerous school', 'You redraw the map. The dragon becomes the library. {teacher} marks the corrected version and circles the one staircase you accidentally kept.', 'I replaced a video-game map with a real map of my school.', undefined, { grades: 3 }),
      o('ask', 'Ask whether the staffroom really is off limits', { smarts: 2 }, 'No equipment required', '{teacher} says pupils should knock. You cross out “requires flaming sword” and draw a doorbell that does not exist. They catch that too.', 'I asked {teacher} about entering the staffroom after labelling it a boss chamber.', undefined, { teacherBond: 2, skill: { id: 'science', delta: 1 } }),
      o('submarine', 'Insist the treasure is in the toilets', { happiness: 3, respect: -2 }, 'Quest declined', '{teacher} returns the map unmarked. You must redo it, and nobody volunteers to check your treasure claim.', 'I defended a copied fantasy map instead of completing my school-map assignment.', undefined, { teacherBond: -3, grades:-3 }),
    ],
  },
  {
    id: 'school-library-whisper', min: 6, max: 11, school: 'primary', classmate: true, illustration: 'relationship', title: 'A very short biography',
    body: '{classmate} passes you a homemade book called “People Who Smell Weird”. Your name is on page one. Every other page is blank.',
    choices: [
      o('pause', 'Give it a terrible review', { smarts: 2, respect: 1 }, 'Needs more characters', 'You write “repetitive, poorly researched” on the cover. {classmate} laughs, then admits they could not think of a second chapter.', 'I reviewed {classmate}’s insulting homemade book as a disappointed critic.', undefined, { peerBond:2 }),
      o('later', 'Ask why they made it about you', { respect: 2, stress: 1 }, 'The author retracts', '{classmate} says it was meant to be funny. You ask them to explain the funny part. They cross out your name and use the book for doodles.', 'I made {classmate} explain an insulting book they had written about me.', undefined, { peerBond:-3, trust:{peer:-3} }),
      o('reply', 'Write their name on every remaining page', { happiness: 3, discipline: -1 }, 'The expanded edition', '{classmate} objects to being most of the book. You point out that they are also the author. Neither of you is reading the assigned book anymore.', 'I filled the rest of {classmate}’s insult book with their own name.', undefined, { peerBond:-5, grades:-1 }),
    ],
  },
  {
    id: 'school-relay-handover', min: 7, max: 11, school: 'primary', classmate: true, teacher: true, illustration: 'wellbeing', title: 'The baton stayed behind',
    body: 'You and {classmate} complete a spectacular relay changeover. Both of you are sprinting. The baton is still on the ground beside {teacher}.',
    choices: [
      o('practise', 'Try again, this time with the baton', { discipline: 2, energy: -3 }, 'Equipment included', 'You slow down and practise the handover. Carrying the actual baton makes your teamwork much more convincing.', 'I practised a failed relay handover with {classmate}.', undefined, { peerBond: 3, skill: { id: 'sport', delta: 2 } }),
      o('ask', 'Ask {teacher} for a demonstration', { smarts: 1, energy: -1 }, 'One crucial detail', '{teacher} demonstrates keeping hold until the other runner takes it. You practise at walking speed, which is less glorious but more useful.', 'I asked {teacher} to demonstrate a relay handover.', undefined, { teacherBond: 2, skill: { id: 'sport', delta: 1 } }),
      o('blame', 'Claim {classmate} was meant to collect it', { respect: -3 }, 'A disputed version of events', '{teacher} points out that you were both standing beside it. {classmate} refuses to accept sole responsibility for an object neither of you picked up.', 'I blamed {classmate} for our failed relay handover.', undefined, { peerBond: -4, teacherBond: -2 }),
    ],
  },
  {
    id: 'school-bean-monitor', min: 6, max: 11, school: 'primary', teacher: true, illustration: 'education', title: 'The bean is not thriving',
    body: 'The class bean plant is dead. {teacher} asks why your progress chart still says “thriving”. You added a smiley face this morning.',
    choices: [
      o('measure', 'Write an honest report on its demise', { discipline: 3, energy: -1 }, 'A useful post-mortem', 'You record the dry soil and brown leaves. {teacher} gives credit for the observations, rather than your earlier optimism.', 'I corrected my report about a dead classroom bean plant.', undefined, { grades: 1, skill: { id: 'science', delta: 2 } }),
      o('ask', 'Ask {teacher} where you went wrong', { smarts: 2 }, 'Water was involved', 'The care instructions mentioned watering it. You had been updating the chart instead. {teacher} appreciates that you finally asked.', 'I asked {teacher} why the bean plant had died.', undefined, { teacherBond: 3 }),
      o('speech', 'Give it an emotional farewell speech', { happiness: 3 }, 'Gone to a bigger windowsill', 'You call it “a giant among beans”. {teacher} lets you finish, then asks you to update the chart. You write “no longer thriving”.', 'I gave a funeral speech for a classroom bean plant.'),
    ],
  },
  {
    id: 'school-secret-language', rarity: 'uncommon', min: 7, max: 11, school: 'primary', classmate: true, illustration: 'relationship', title: 'Nobody told the spy',
    body: 'You catch {classmate} explaining your secret code to everyone. They claim it is fine because they have invented a second, more secret code. You have not been told it.',
    choices: [
      o('dictionary', 'Demand to inspect the new codebook', { smarts: 2, discipline: 1 }, 'One unhelpful entry', 'The new codebook contains one word: “banana”. {classmate} says its meaning is classified. You add a second word meaning “tell your partner things”.', 'I inspected {classmate}’s replacement secret code and found one word.', undefined, { peerBond:2 }),
      o('gestures', 'Invent a silent signal for “you are fired”', { happiness: 3, energy: -1 }, 'The message gets through', 'Your signal involves a dramatic bow and pointing away. {classmate} understands immediately and offers to make you head spy again.', 'I used a theatrical gesture to dismiss {classmate} from our imaginary spy team.', undefined, { peerBond:-2, skill:{id:'acting',delta:1} }),
      o('ordinary', 'Tell everyone the first code means nothing', { stress: -2, respect: -1 }, 'A room full of bananas', 'You claim you made the words up to see who would repeat them. Everyone turns to {classmate}, who is still halfway through a banana demonstration.', 'I disowned a secret code after {classmate} gave it away.', undefined, { peerBond:-6, trust:{peer:-5} }),
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
    id: 'school-rainy-break', min: 6, max: 11, school: 'primary', classmate: true, illustration: 'relationship', title: 'Secrets bingo',
    body: 'For indoor break, {classmate} makes bingo cards out of everyone’s embarrassing habits. Your square says “cries at cartoons”. They beg you not to add their baby nickname.',
    choices: [
      o('agree', 'Make everyone write their own square', { discipline: 2, respect: 2 }, 'Voluntary humiliation', 'You admit that cartoon dogs get to you. Someone else confesses to eating a paper cupcake case. {classmate} quietly removes half the original cards.', 'I turned {classmate}’s secrets bingo into a game of voluntary confessions.', undefined, { peerBond:3 }),
      o('play', 'Give a fake sob every time your square comes up', { happiness: 4, energy: -1 }, 'Full house. Very emotional.', 'You sob through three rounds and dedicate the last one to a fictional cartoon potato. {classmate} laughs too hard to call the next number.', 'I played along with {classmate}’s secrets bingo by giving an absurd crying performance.', undefined, { peerBond:3, skill:{id:'acting',delta:1} }),
      o('quit', 'Announce their baby nickname to the room', { happiness: 2, respect: -6, stress: 3 }, 'Bingo, Baby Stinkbug', 'The room chants the nickname. {classmate} rips up the cards and tells you they will never tell you anything private again.', 'I exposed {classmate}’s private nickname to get back at them during secrets bingo.', undefined, { peerBond:-20, trust:{peer:-18} }),
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
    id: 'teen-unit-confusion', min: 12, max: 17, school: 'secondary', teacher: true, illustration: 'education', title: 'Fastest toy car alive',
    body: 'You invented the numbers for a marked science report. Your toy car apparently reached 90,000 kilometres an hour. {teacher} asks to see the original measurements.',
    choices: [
      o('redo', 'Admit it and take the report back', { respect: 2, energy: -4 }, 'The car has been recalled', '{teacher} lets you submit a properly measured replacement with a reduced mark. The real car rolls under a cupboard. You record that too.', 'I admitted inventing science data and replaced my report with real measurements.', undefined, { grades:-5, teacherBond:-4, skill:{id:'science',delta:2} }),
      o('help', 'Offer a live demonstration instead', { smarts: 2, energy: -3, stress: 2 }, 'Less speed, more evidence', 'The car travels half a metre and stops. You explain the measurement correctly while {teacher} watches. Your practical work rescues some marks from the fabricated report.', 'I salvaged part of a falsified science assignment with a real practical demonstration.', undefined, { grades:-3, teacherBond:-6, skill:{id:'science',delta:2} }),
      o('defend', 'Invent a second sheet of measurements', { discipline: -4, stress: 5 }, 'Three times the speed of your credibility', '{teacher} notices your recorded journey takes minus four seconds. The report gets no credit, and your claim that the car travelled backwards in time does not help.', 'I doubled down on fabricated science data and received no credit for the report.', undefined, { grades:-18, teacherBond:-16, trust:{teacher:-14} }),
    ],
  },
  {
    id: 'teen-debate-draw', min: 13, max: 17, school: 'secondary', classmate: true, teacher: true, illustration: 'education', title: 'Against compulsory naps',
    body: '{teacher} assigns you to argue against replacing homework with compulsory naps. {classmate} gets the other side and immediately pretends to fall asleep.',
    choices: [
      o('research', 'Build the strongest anti-nap case', { smarts: 2, energy: -3 }, 'Evidence against your interests', 'You produce a solid argument about lost learning time. A yawn halfway through the speech complicates your position, but the work earns its marks.', 'I prepared a class debate against replacing homework with naps.', undefined, { grades: 2, teacherBond: 2 }),
      o('practice', 'Rehearse against {classmate}', { discipline: 2, energy: -2 }, 'Pillows are not evidence', '{classmate} keeps interrupting with proposed pillow designs. You learn to bring an argument back to the question.', 'I rehearsed the nap debate with {classmate}.', undefined, { peerBond: 3, skill: { id: 'politics', delta: 2 } }),
      o('refuse', 'Refuse to betray the nap movement', { stress: -1, respect: -2 }, 'A brave stand against completing work', '{teacher} records the missing preparation. Your commitment to naps is impressive; your assignment is blank.', 'I refused to prepare my assigned side of a class debate.', undefined, { grades: -2, teacherBond: -3 }),
    ],
  },
  {
    id: 'teen-yearbook-proof', rarity: 'uncommon', min: 13, max: 17, school: 'secondary', classmate: true, teacher: true, illustration: 'journal', title: 'Immortal words, wrong person',
    body: 'The yearbook proof puts {classmate}’s quote under your photo: “I peaked at nine.” {teacher} needs corrections today. You are not sure you want to ask what happened at nine.',
    choices: [
      o('correct', 'Return the quote to its rightful owner', { discipline: 2, respect: 1 }, 'A corrected confession', '{teacher} fixes the names. {classmate} explains that they won a particularly good sack race.', 'I corrected swapped yearbook quotations.', undefined, { teacherBond: 2, peerBond: 1 }),
      o('together', 'Write gloriously vain quotes together', { happiness: 3, energy: -1 }, 'Future legends, current drafts', 'You spend a break inventing increasingly impressive futures. The quotes you finally choose are mostly jokes about the two of you.', 'I wrote new yearbook quotes with {classmate}.', undefined, { peerBond: 4 }),
      o('keep', 'Approve it as your mysterious backstory', { happiness: 2, respect: -1 }, 'A legend with no supporting details', '{teacher} checks that you mean it. You nod solemnly. Several people are now curious about your ninth year.', 'I kept someone else’s quote as my own yearbook entry.'),
    ],
  },
  {
    id: 'teen-study-soundtrack', min: 12, max: 17, school: 'secondary', classmate: true, illustration: 'relationship', title: 'Your debut single is chemistry',
    body: '{classmate} secretly records you singing chemistry definitions and adds a dance beat. The file is called “Desperate for Zinc”. They want to send it to the class.',
    choices: [
      o('quiet', 'Make them delete the recording', { respect: 2, stress: -2 }, 'An extremely limited release', '{classmate} deletes it while you watch. They call you difficult. You call them a record label with no permission forms.', 'I made {classmate} delete a secret recording of my chemistry revision song.', undefined, { peerBond:-3, trust:{peer:-4} }),
      o('separate', 'Demand credit as the anonymous vocalist', { smarts: 2, happiness: 2 }, 'Featuring Element X', 'The class gets an anonymous revision track. You deny involvement until you accidentally sing the next definition exactly on beat.', 'I let {classmate} share my chemistry song under an anonymous credit.', undefined, { grades:2, peerBond:2 }),
      o('sing', 'Record a completely unnecessary key change', { happiness: 4, energy: -3 }, 'Too much zinc', 'You belt out the chorus. {classmate} abandons the beat because it no longer fits. The worksheet is still blank, but neither of you can forget what an ion is.', 'I abandoned a chemistry worksheet to record a dramatic revision-song finale with {classmate}.', undefined, { grades:-3, peerBond:4, skill:{id:'music',delta:1} }),
    ],
  },
  {
    id: 'teen-family-interview', rarity: 'uncommon', min: 14, max: 17, parent: true, parentContact: true, school: 'secondary', teacher: true, illustration: 'relationship', title: 'The Biscuit Bandit speaks',
    body: 'For a family-history assignment, you ask {parent} about school. They admit their nickname was “The Biscuit Bandit”, then ask whether the interview is being recorded.',
    choices: [
      o('listen', 'Let them confess everything', { respect: 2, energy: -2 }, 'A surprisingly large operation', 'The story involves a lunch tin and a very unconvincing alibi. You organise the useful parts into your assignment. {parent} enjoys telling you the rest.', 'I interviewed {parent} about their childhood nickname.', 4, { grades: 1 }),
      o('focus', 'Ask for a version safe to hand in', { discipline: 2, smarts: 1 }, 'An edited history', 'You get enough detail for the assignment without reproducing every embarrassing nickname. {parent} appreciates the discretion.', 'I selected school memories from {parent} for a family-history assignment.', 2, { grades: 2 }),
      o('interrupt', 'Keep interrupting to demand biscuit details', { stress: 2, respect: -2 }, 'Interview terminated', '{parent} stops talking after your fourth interrogation about the lunch tin. Your notes contain a nickname and very little history.', 'I annoyed {parent} by interrupting a family-history interview.', -4, { grades: -1 }),
    ],
  },
  {
    id: 'teen-volunteer-roster', min: 14, max: 17, school: 'secondary', classmate: true, teacher: true, illustration: 'education', title: 'Your signature has improved',
    body: '{teacher} thanks you for volunteering to clean the classroom. The roster has your name in {classmate}’s handwriting. {classmate} suddenly becomes interested in the ceiling.',
    choices: [
      o('share', 'Make {classmate} split the work', { discipline: 2, energy: -3 }, 'A reluctant double act', '{classmate} admits the trick and apologises while stacking chairs. You finish together; {teacher} is glad the room gets done.', 'I made {classmate} share a cleanup they had volunteered me for.', undefined, { peerBond: 3, teacherBond: 2 }),
      o('clarify', 'Show {teacher} the handwriting', { smarts: 1, respect: 2 }, 'An easy comparison', '{teacher} checks the roster against {classmate}’s notes. Your name is removed. You enjoy being thanked for something you will not have to do.', 'I told {teacher} that I had not signed the classroom volunteer roster.', undefined, { teacherBond: 2 }),
      o('leave', 'Walk out and leave {classmate} with it', { energy: 2, respect: -3 }, 'A terrible leaving speech', 'You announce that the handwriting expert can handle the chairs. {classmate} is furious, and {teacher} dislikes the scene more than your explanation.', 'I left {classmate} to finish a disputed classroom cleanup.', undefined, { peerBond: -5, teacherBond: -3 }),
    ],
  },
  {
    id: 'teen-marking-correction', min: 14, max: 17, school: 'secondary', teacher: true, illustration: 'education', title: 'Selective honesty',
    body: '{teacher} has marked a correct answer wrong and a wrong answer right. The mistakes cancel out. You could mention both, or suddenly become very interested in only one.',
    choices: [
      o('both', 'Point out both mistakes', { respect: 3, discipline: 1 }, 'No profit, better reputation', '{teacher} corrects both marks and thanks you for being honest. Your grade stays exactly where it was.', 'I showed {teacher} two marking mistakes that cancelled each other out.', undefined, { teacherBond: 3 }),
      o('understand', 'Get the answers explained properly', { smarts: 2, energy: -2 }, 'Something you can keep', 'You work through both questions with {teacher}. The extra practice helps your current work more than arguing over the old total.', 'I reviewed two confusing marked answers with {teacher}.', undefined, { grades: 2, teacherBond: 2 }),
      o('ignore', 'Ask for the lost marks. Hide the free ones.', { stress: 2, respect: -3 }, 'A small, awkward victory', '{teacher} adds the missing marks. Then they ask why you folded the other half of the paper underneath. You keep the points and lose some credibility.', 'I claimed missing marks without mentioning another answer marked too generously.', undefined, { grades: 2, teacherBond: -2 }),
    ],
  },
];
