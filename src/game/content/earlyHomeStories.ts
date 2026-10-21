import { EventTemplate, storyOption as o } from './eventTypes';

/** Original early-life situations. Named adults and classmates are saved people. */
export const earlyHomeTemplates: readonly EventTemplate[] = [
  {
    id: 'first-bubble-catch', min: 1, max: 2, illustration: 'birthday', title: 'A very brief possession',
    body: 'A soap bubble floats past your nose. You reach for it. Your new favourite thing has already resigned.',
    choices: [
      o('chase', 'Go after the next one', { happiness: 4, energy: -2 }, 'Plenty of vacancies', 'There are more bubbles. You spend several happy minutes failing to keep any of them.', 'I chased soap bubbles and caught absolutely nothing.'),
      o('watch', 'Watch where it goes', { smarts: 3, discipline: 1 }, 'A longer visit', 'The next bubble drifts past your hand. Leaving it alone makes it last longer.', 'I watched a soap bubble float away instead of grabbing it.'),
      o('complain', 'Complain about the disappearing bubble', { stress: 2, happiness: -1 }, 'Customer service unavailable', 'The bubble does not return. Another one lands on your sleeve and meets the same end.', 'I objected when a soap bubble disappeared.'),
    ],
  },
  {
    id: 'first-tower-demolition', min: 1, max: 2, illustration: 'property', title: 'Building regulations',
    body: 'You stack three blocks. For a moment, the tower stands. Then you discover what your elbow has been planning.',
    choices: [
      o('rebuild', 'Build it again with a wider bottom', { smarts: 3, discipline: 2 }, 'A better foundation', 'The new tower survives your elbow. Your hand brings it down a little later.', 'I rebuilt a block tower with a wider base.'),
      o('crash', 'Knock down the next tower on purpose', { happiness: 4, energy: -1 }, 'Demolition specialist', 'Building is fine. The crash is excellent. You start preparing another crash.', 'I discovered that knocking down block towers was also a game.'),
      o('stop', 'Line the blocks up on the floor', { discipline: 2, stress: -2 }, 'No planning permission needed', 'The line cannot fall over. You add another block and admire your work.', 'I made a line of blocks after my tower fell down.'),
    ],
  },
  {
    id: 'first-camera-closeup', min: 1, max: 3, parent: true, illustration: 'relationship', title: 'Ready for your close-up',
    body: '{parent} points a phone camera at you. You can see yourself on the screen. Your nose deserves further investigation.',
    choices: [
      o('nose', 'Move right up to the lens', { happiness: 4 }, 'Mostly nostril', '{parent} keeps the picture. It is a bold choice of composition.', 'I gave {parent} a very close view of my nose.', 3),
      o('wave', 'Wave at the small person on screen', { smarts: 2, happiness: 2 }, 'A reliable correspondent', 'The small person waves back. {parent} joins in from behind the phone.', 'I waved at myself while {parent} took a picture.', 4),
      o('away', 'Turn around at the crucial moment', { energy: 2 }, 'Excellent view of the back', '{parent} gets a photograph of the back of your head. You have already found something else to do.', 'I turned away just as {parent} took a picture.'),
    ],
  },
  {
    id: 'first-nap-negotiation', min: 1, max: 3, parent: true, illustration: 'wellbeing', title: 'Too busy to be tired',
    body: '{parent} says it is time for a nap. You have been awake for ages and have only inspected half the room.',
    choices: [
      o('nap', 'Give your eyes a short test closure', { energy: 5, stress: -2 }, 'Test extended', 'You wake up later. The uninspected half of the room is still there.', 'I fell asleep while checking whether I needed a nap.', 2),
      o('settle', 'Ask {parent} to stay for a minute', { energy: 3, happiness: 2 }, 'One familiar minute', '{parent} sits beside you. The inspection can wait.', 'Having {parent} nearby helped me settle for a nap.', 4),
      o('protest', 'Explain your position at full volume', { energy: -3, stress: 2 }, 'A tiring argument', '{parent} listens. You become less convincing with every yawn.', 'I loudly denied needing a nap, between yawns.', -1),
    ],
  },
  {
    id: 'toddler-parent-name', min: 2, max: 4, parent: true, illustration: 'relationship', title: 'Management has a name',
    body: 'You hear someone call {parent} by their first name. You try it out. The reaction suggests you have discovered a shortcut.',
    choices: [
      o('repeat', 'Use it for every request', { happiness: 3, discipline: -1 }, 'A very familiar caller', '{parent} explains what you usually call them. You test the shortcut once more.', 'I tried calling {parent} by their first name.', 1),
      o('ask', 'Ask why people have different names', { smarts: 3, respect: 1 }, 'A reasonable question', '{parent} explains names and family words. You have several follow-up questions.', 'I asked {parent} about names and family words.', 3),
      o('usual', 'Go back to your usual name for them', { discipline: 2, happiness: 1 }, 'Still gets an answer', 'The old method works. You use it to ask for a drink.', 'I went back to my usual name for {parent}.', 2),
    ],
  },
  {
    id: 'toddler-ice-cube', min: 2, max: 4, parent: true, illustration: 'wellbeing', title: 'The evidence is melting',
    body: '{parent} puts an ice cube in a bowl for you to inspect. It is cold, slippery and getting smaller without permission.',
    choices: [
      o('watch', 'Watch what happens to it', { smarts: 3, discipline: 1 }, 'A shallow answer', 'The bowl slowly fills with water. {parent} explains where the cube went.', 'I watched an ice cube turn into water.', 2),
      o('touch', 'Touch it, then remove your hand very quickly', { smarts: 2, happiness: 2 }, 'Still cold', 'You repeat the experiment. The result is impressively consistent.', 'I checked how cold an ice cube was, several times.'),
      o('save', 'Ask {parent} to save it', { happiness: 2 }, 'Back to the freezer', '{parent} puts the bowl somewhere colder. You check on it later.', 'I asked {parent} to rescue a melting ice cube.', 3),
    ],
  },
  {
    id: 'toddler-lift-button', min: 3, max: 5, parent: true, illustration: 'property', title: 'An important appointment',
    body: 'In a lift, {parent} lets you press the button for your floor. There are so many other buttons. It seems wasteful.',
    choices: [
      o('one', 'Press the right button once', { discipline: 3, respect: 1 }, 'Express service', 'The lift takes you where you meant to go. You have performed a valuable public service.', 'I pressed the correct lift button for {parent}.', 3),
      o('check', 'Ask what the other buttons do', { smarts: 3 }, 'A guided tour of the panel', '{parent} explains the floors and tells you which buttons to leave alone.', 'I asked {parent} about the buttons in a lift.', 2),
      o('more', 'Press a few extra floor buttons', { happiness: 2, discipline: -2 }, 'The scenic route', 'The lift stops at floors nobody wanted. {parent} is less impressed than you expected.', 'I gave everyone in a lift several unnecessary stops.', -3),
    ],
  },
  {
    id: 'toddler-caterpillar-crossing', min: 3, max: 5, local: true, illustration: 'journal', title: 'Heavy traffic',
    body: 'A caterpillar is crossing a path. It has a lot of feet and very little urgency.',
    choices: [
      o('watch', 'Crouch down and watch', { smarts: 3, discipline: 1 }, 'Eventually, the other side', 'It reaches the edge and disappears under a leaf. You remain impressed by all the feet.', 'I watched a caterpillar cross a path.'),
      o('space', 'Give it plenty of room', { respect: 2, happiness: 2 }, 'Right of way', 'You take a careful step around it. The caterpillar continues its important walk.', 'I gave a caterpillar room to cross.'),
      o('race', 'Challenge it to a race', { happiness: 3, energy: -1 }, 'A decisive victory', 'You reach the end of the path first. Your opponent appears unaware of the result.', 'I won a race against a caterpillar that had not entered.'),
    ],
  },
  {
    id: 'toddler-why-machine', min: 3, max: 5, parent: true, illustration: 'education', title: 'One more question',
    body: 'You ask {parent} why the sky is blue. The answer contains at least four things you can ask about next.',
    choices: [
      o('follow', 'Keep asking about the answer', { smarts: 4, energy: -2 }, 'A substantial interview', '{parent} answers until they need to look something up. This creates a new question about looking things up.', 'I kept asking {parent} questions about the sky.', 2),
      o('draw', 'Draw what you think they mean', { smarts: 2, happiness: 3 }, 'An original diagram', '{parent} looks at your drawing. There is rather more purple than the explanation required.', 'I drew my own explanation of the sky.', 3),
      o('invent', 'Explain your much better theory', { happiness: 3 }, 'Paint, obviously', 'You propose that somebody painted it. {parent} asks who does the clouds.', 'I proposed that the sky had been painted.', 1),
    ],
  },
  {
    id: 'child-first-loose-tooth', min: 5, max: 7, illustration: 'wellbeing', title: 'An unreliable tooth',
    body: 'One tooth has started wobbling. The others appear to be staying out of the argument.',
    choices: [
      o('leave', 'Leave it alone for now', { discipline: 3, stress: -1 }, 'No deadline', 'It can come out when it is ready. You get on with your day.', 'I decided to let a loose tooth come out in its own time.'),
      o('check', 'Inspect it in the mirror', { smarts: 2 }, 'The tooth remains attached', 'You establish that it is definitely wobbling. This does not make it any less distracting.', 'I inspected my first loose tooth in the mirror.'),
      o('announce', 'Tell everyone you see', { happiness: 3, respect: -1 }, 'Widely reported', 'Several people already knew. They hear the update anyway.', 'I made sure everyone knew about my loose tooth.'),
    ],
  },
  {
    id: 'child-pocket-museum', min: 4, max: 7, illustration: 'journal', title: 'Admission is free',
    body: 'Your pocket contains three stones, a leaf and something that used to be a leaf. You are considering opening a museum.',
    choices: [
      o('sort', 'Sort the collection by shape', { smarts: 3, discipline: 1 }, 'A respectable exhibition', 'The smallest stone gets its own section. The crumbled leaf needs a larger display area.', 'I sorted a pocketful of stones and leaves.'),
      o('return', 'Put the collection back outside', { discipline: 2, stress: -2 }, 'Open-air museum', 'The stones return to the path. You can still visit them.', 'I returned my pocket collection to the outdoors.'),
      o('names', 'Give every stone a dramatic name', { happiness: 3, smarts: 1 }, 'Lord Pebble joins the collection', 'The leaf receives a title too, despite its condition.', 'I gave the stones in my pocket elaborate names.'),
    ],
  },
  {
    id: 'school-wrong-jacket', min: 6, max: 9, school: 'primary', classmate: true, illustration: 'relationship', title: 'Unexpected extra sleeves',
    body: 'You put on what you think is your jacket. Your hands vanish into the sleeves. {classmate} is looking for theirs.',
    choices: [
      o('return', 'Check the name and hand it back', { respect: 3, discipline: 1 }, 'The right fit', '{classmate} helps find your jacket. Your hands reappear.', 'I returned {classmate}’s jacket after taking it by mistake.', undefined, { peerBond: 3 }),
      o('joke', 'Perform a brief long-armed dance', { happiness: 3 }, 'Limited engagement', '{classmate} laughs, then asks for the jacket back. You finish the dance quickly.', 'I made {classmate} laugh after mixing up our jackets.', undefined, { peerBond: 2 }),
      o('insist', 'Insist you have suddenly grown smaller', { discipline: -2, respect: -2 }, 'The label disagrees', '{classmate} points to the name inside. It is a fairly strong argument.', 'I argued that {classmate}’s jacket was mine.', undefined, { peerBond: -3 }),
    ],
  },
  {
    id: 'school-empty-lunchbox', min: 6, max: 11, school: 'primary', classmate: true, teacher: true, illustration: 'relationship', title: 'A disappointing lunch',
    body: '{classmate} opens a lunchbox with nothing in it. They look embarrassed. {teacher} is nearby.',
    choices: [
      o('quiet', 'Quietly ask {teacher} for help', { respect: 4 }, 'Lunch gets sorted', '{teacher} helps without making an announcement. {classmate} looks relieved.', 'I quietly got {teacher}’s help when {classmate} had no lunch.', undefined, { peerBond: 4, teacherBond: 2 }),
      o('ask', 'Ask {classmate} what would help', { respect: 2, happiness: 1 }, 'A private conversation', '{classmate} asks you to come with them to speak to {teacher}. You go together.', 'I went with {classmate} to ask for help with lunch.', undefined, { peerBond: 5 }),
      o('announce', 'Announce it across the table', { respect: -4, stress: 2 }, 'More attention than help', '{teacher} sorts out lunch. {classmate} asks why you had to tell everyone.', 'I embarrassed {classmate} by announcing their empty lunchbox.', undefined, { peerBond: -5 }),
    ],
  },
  {
    id: 'school-answer-blurt', min: 6, max: 10, school: 'primary', teacher: true, illustration: 'education', title: 'You know this one',
    body: '{teacher} asks a question. You know the answer. Waiting for your hand to be noticed feels like a serious design flaw.',
    choices: [
      o('wait', 'Keep your hand up and wait', { discipline: 3 }, 'Eventually, your turn', '{teacher} calls on you. The answer survives the wait.', 'I waited for my turn to answer {teacher}’s question.', undefined, { teacherBond: 3, grades: 1 }),
      o('blurt', 'Shout it out before it escapes', { happiness: 2, discipline: -2 }, 'Correct, but loud', '{teacher} agrees with your answer and reminds you about taking turns.', 'I shouted out an answer in class.', undefined, { teacherBond: -2 }),
      o('listen', 'Listen to someone else’s explanation', { smarts: 2, respect: 1 }, 'Same answer, different route', 'They explain a step you had done in your head. It turns out to be useful.', 'I listened to another way of solving a classroom question.', undefined, { grades: 1 }),
    ],
  },
  {
    id: 'school-slide-queue', min: 6, max: 10, school: 'primary', classmate: true, illustration: 'relationship', title: 'Express lane',
    body: '{classmate} slips in front of you in the queue for the slide. Apparently knowing you is a transport policy.',
    choices: [
      o('ask', 'Ask them to join the back', { respect: 3, stress: 1 }, 'A short negotiation', '{classmate} grumbles, then moves back. Your turn arrives without a special permit.', 'I asked {classmate} not to cut in front of me.', undefined, { peerBond: -1 }),
      o('let', 'Let it go this time', { stress: -2, happiness: 1 }, 'One extra wait', 'You get a turn soon enough. You make a note to speak up if it happens again.', 'I let {classmate} go ahead of me on the slide.'),
      o('push', 'Push past them in return', { respect: -4, discipline: -2 }, 'Two people out of line', 'The argument holds up the whole queue. Neither of you gets the next turn.', 'I started an argument after {classmate} cut into a queue.', undefined, { peerBond: -5 }),
    ],
  },
  {
    id: 'school-show-tell-prop', min: 6, max: 9, school: 'primary', classmate: true, teacher: true, illustration: 'education', title: 'Please imagine the object',
    body: 'It is your turn at show-and-tell. The thing you meant to show is at home. {classmate} has noticed your empty hands.',
    choices: [
      o('describe', 'Describe it honestly', { respect: 3, smarts: 1 }, 'An unusually portable exhibit', '{teacher} lets you explain what you meant to bring. {classmate} asks a useful question.', 'I did show-and-tell without the object I meant to show.', undefined, { teacherBond: 2, peerBond: 1 }),
      o('mime', 'Demonstrate it with enormous gestures', { happiness: 3, energy: -2 }, 'A lively presentation', 'You nearly knock over a chair. The class remembers the demonstration.', 'I acted out my missing show-and-tell object.', undefined, { skill: { id: 'acting', delta: 2 }, peerBond: 2 }),
      o('invent', 'Claim it is too valuable to display', { respect: -3, stress: 2 }, 'A question about value', '{teacher} asks what makes it valuable. Your explanation becomes steadily less convincing.', 'I made up a story about why I had brought nothing to show-and-tell.', undefined, { teacherBond: -3 }),
    ],
  },
  {
    id: 'child-boardgame-rules', min: 5, max: 9, parent: true, illustration: 'relationship', title: 'The rules have been updated',
    body: 'You are losing a board game with {parent}. You have just remembered a rule under which you would be winning.',
    choices: [
      o('accept', 'Finish under the original rules', { discipline: 3, respect: 2 }, 'A respectable defeat', '{parent} wins this round. You immediately request another.', 'I finished a board game fairly even though I was losing.', 3),
      o('next', 'Suggest your rule for the next game', { smarts: 2, happiness: 2 }, 'Future legislation', '{parent} agrees to try it after this round. The new version is rather silly.', 'I invented a new board-game rule for the next round.', 4),
      o('insist', 'Insist it has always been the rule', { respect: -3, stress: 2 }, 'Two pages of bad news', '{parent} opens the instructions. Your amendment is difficult to locate.', 'I tried to change a board-game rule while losing.', -3),
    ],
  },
  {
    id: 'child-shop-separation', rarity: 'rare', min: 5, max: 9, parent: true, illustration: 'relationship', title: 'The aisle looks different',
    body: '{parent} steps around a shelf in a shop. You turn the other way and suddenly cannot see them.',
    choices: [
      o('stay', 'Stay nearby and call their name', { discipline: 3, stress: -2 }, 'Just around the shelf', '{parent} hears you and comes back. You agree to stay where you can see each other.', 'I stayed nearby and called for {parent} when we got separated in a shop.', 3),
      o('staff', 'Ask a member of staff for help', { smarts: 2, respect: 2 }, 'Help at the desk', 'A member of staff helps you find {parent}. You are both relieved.', 'I asked shop staff for help finding {parent}.', 2),
      o('search', 'Rush off to search another aisle', { stress: 4, energy: -2 }, 'A longer search', '{parent} finds you further away than expected. You have a careful talk before leaving.', 'I made a shop separation last longer by rushing off to search.', -1),
    ],
  },
  {
    id: 'school-practice-alarm', min: 6, max: 11, school: 'primary', teacher: true, illustration: 'education', title: 'A very loud rehearsal',
    body: 'The school alarm sounds during a practice evacuation. {teacher} asks everyone to leave calmly. Your chair has other ideas about moving quietly.',
    choices: [
      o('follow', 'Follow the instructions and leave your things', { discipline: 3, respect: 2 }, 'All accounted for', '{teacher} checks the class at the meeting point. Your bag can wait inside.', 'I followed {teacher}’s instructions during a practice evacuation.', undefined, { teacherBond: 3 }),
      o('ask', 'Ask {teacher} where to go', { smarts: 2, stress: -2 }, 'A clear direction', '{teacher} points out the route. Knowing what to do makes the noise easier to handle.', 'I asked {teacher} for directions during a school evacuation practice.', undefined, { teacherBond: 2 }),
      o('bag', 'Delay to pack everything neatly', { discipline: -2, stress: 2 }, 'This is not a holiday', '{teacher} tells you to leave the bag. You catch up and learn why the practice matters.', 'I held up an evacuation practice by trying to pack my bag.', undefined, { teacherBond: -3 }),
    ],
  },
  {
    id: 'school-mysterious-noise', min: 6, max: 11, school: 'primary', classmate: true, teacher: true, illustration: 'relationship', title: 'An unclaimed contribution',
    body: 'A loud fart interrupts the lesson. {classmate} looks straight at you. Their face suggests a serious conflict of interest.',
    choices: [
      o('ignore', 'Keep your face impressively neutral', { discipline: 3, stress: -1 }, 'Lesson continues', '{teacher} carries on. {classmate} eventually stops looking at you.', 'I ignored a suspicious look after a loud noise in class.'),
      o('joke', 'Whisper that the chair needs repairing', { happiness: 3 }, 'An innocent chair', '{classmate} nearly laughs out loud. {teacher} asks you both to concentrate.', 'I blamed a classroom noise on a perfectly good chair.', undefined, { peerBond: 3, teacherBond: -1 }),
      o('accuse', 'Name your prime suspect at full volume', { happiness: 2, respect: -3 }, 'Investigation closed', '{teacher} asks you to stop. {classmate} denies everything with remarkable confidence.', 'I publicly accused {classmate} of farting in class.', undefined, { peerBond: -4, teacherBond: -2 }),
    ],
  },
];
