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
    id: 'toddler-parent-name', min: 2, max: 4, parent: true, illustration: 'relationship', title: 'Your name is No',
    body: 'You decide {parent} is called “No”, because they say it so often. You introduce them to a visitor as No. No looks tired.',
    choices: [
      o('repeat', 'Ask No for a biscuit', { happiness: 3, discipline: -1 }, 'They answer to it', '{parent} says no. You point out that they have just said their own name. The visitor needs a moment.', 'I named {parent} No, then asked No for a biscuit.', 1),
      o('ask', 'Ask whether their middle name is Stop', { smarts: 3, happiness: 2 }, 'A full legal name', '{parent} laughs before they can stop themselves. You introduce them again, with the extra name.', 'I asked whether {parent}’s full name was No Stop.', 3),
      o('usual', 'Give them their old name back', { discipline: 2, happiness: 1 }, 'Temporary reprieve', '{parent} thanks you. You explain that they can earn No back if they keep saying it.', 'I restored {parent}’s usual name, subject to review.', 2),
    ],
  },
  {
    id: 'toddler-ice-cube', min: 2, max: 4, parent: true, illustration: 'wellbeing', title: 'Something in your sock',
    body: 'You hide an ice cube in your sock. {parent} asks why your foot is leaking. You had not planned for questions.',
    choices: [
      o('watch', 'Show {parent} your disappearing treasure', { smarts: 3, discipline: 1 }, 'One wet sock', 'You turn the sock out over a bowl. A tiny cube slides out. {parent} supplies a dry sock; you inspect the bowl for the rest of your treasure.', 'I showed {parent} the ice cube I had hidden in my sock.', 2),
      o('touch', 'Try the other sock', { happiness: 3, energy: -1 }, 'Two wet socks', 'You transfer the cube. The other foot starts leaking too. {parent} takes the cube before you run out of feet.', 'I tested whether an ice cube would melt in both my socks.'),
      o('save', 'Ask to put your sock in the freezer', { happiness: 2 }, 'Foot not included', '{parent} takes the sock off first. You watch it go into the freezer and demand a visiting time.', 'I asked {parent} to freeze my sock to save an ice cube.', 3),
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
    id: 'toddler-why-machine', min: 3, max: 5, parent: true, illustration: 'education', title: 'The watermelon investigation',
    body: '{parent} jokes that swallowing a seed could grow a watermelon in your tummy. You have questions. Several concern the size of your tummy.',
    choices: [
      o('follow', 'Demand to know where the leaves go', { smarts: 4, energy: -2 }, 'The witness changes their story', '{parent} admits it was a joke and explains what seeds actually need. You ask why they left out the soil problem.', 'I questioned {parent} until they explained a joke about swallowing seeds.', 2),
      o('draw', 'Draw a plan for your indoor garden', { smarts: 2, happiness: 3 }, 'Limited growing space', 'Your drawing has a watermelon, a ladder and a tiny gardener. {parent} explains why none of them will be moving in.', 'I drew an imaginary watermelon garden inside my tummy.', 3),
      o('invent', 'Announce you are growing a fruit salad', { happiness: 3 }, 'An ambitious harvest', '{parent} explains that this will not happen. You request a spoon anyway, in case they are wrong.', 'I claimed I could grow a fruit salad in my tummy.', 1),
    ],
  },
  {
    id: 'child-first-loose-tooth', min: 5, max: 7, illustration: 'wellbeing', title: 'A mouth with sound effects',
    body: 'Your first loose tooth makes a clicking noise. You discover you can make it louder. Lunch is about to become a performance.',
    choices: [
      o('leave', 'Let everyone eat in peace', { discipline: 3, stress: -1 }, 'A private dental matter', 'You leave the tooth alone. Lunch proceeds without an audience inspecting your mouth.', 'I kept my loose tooth out of the lunchtime conversation.'),
      o('check', 'Check the wobble in a mirror', { smarts: 2 }, 'Still attached', 'You can see the gap when it moves. Watching yourself do it is fascinating; apparently this is less exciting for other people.', 'I inspected my first loose tooth in the mirror.'),
      o('announce', 'Give everyone a live demonstration', { happiness: 3, respect: -1 }, 'Lunch briefly postponed', 'You click it three times and demand that everyone look. Several people put their food down.', 'I interrupted lunch to demonstrate my loose tooth.'),
    ],
  },
  {
    id: 'child-pocket-museum', min: 4, max: 7, parent: true, illustration: 'journal', title: 'The museum has escaped',
    body: 'You empty your pocket collection onto the table for {parent}. Three stones. A leaf. A slug you thought was another leaf. The slug makes for the edge.',
    choices: [
      o('sort', 'Give {parent} the guided tour', { smarts: 2, happiness: 3 }, 'Please follow the shiny line', 'You describe the stones while {parent} catches the slug on a leaf. Your only moving exhibit is removed halfway through the tour.', 'I gave {parent} a museum tour while a slug escaped from my pocket collection.', 3),
      o('return', 'Return the slug before it reaches the floor', { discipline: 2, stress: -2 }, 'Exhibit returned to supplier', 'You carry it outside on the leaf. {parent} checks both your pockets. The second one is thankfully all stones.', 'I returned an accidental pocket slug to the garden.', 2),
      o('names', 'Claim the slug lives here now', { happiness: 3, discipline: -1 }, 'Application declined', '{parent} says it can live outside. You name it Table Slug anyway and escort it to its new address under a plant pot.', 'I tried to move a pocket slug into the house and named it Table Slug.', 1),
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
    id: 'school-answer-blurt', min: 6, max: 10, school: 'primary', teacher: true, illustration: 'education', title: 'Forty-two. Definitely forty-two.',
    body: '{teacher} starts a question and your hand shoots up. You have an excellent answer. You are still waiting to hear what the question is.',
    choices: [
      o('wait', 'Hear the rest before committing', { discipline: 3 }, 'A useful last-minute adjustment', 'The question is about the number of sides on a triangle. You quietly retire forty-two and give the correct answer.', 'I waited to hear a whole classroom question before answering.', undefined, { teacherBond: 3, grades: 1 }),
      o('blurt', 'Shout “forty-two” with total confidence', { happiness: 2, discipline: -2 }, 'A very complicated triangle', '{teacher} draws three sides on the board and asks where the other thirty-nine should go.', 'I shouted the wrong answer before {teacher} finished a question.', undefined, { teacherBond: -2 }),
      o('listen', 'Let someone else risk it first', { smarts: 2, respect: 1 }, 'A safer number', 'Their explanation makes sense. You learn the answer without having to defend your original guess.', 'I listened to another explanation instead of guessing at a question.', undefined, { grades: 1 }),
    ],
  },
  {
    id: 'school-slide-queue', min: 6, max: 10, school: 'primary', classmate: true, illustration: 'relationship', title: 'Supreme Slide Commander',
    body: '{classmate} has ranked everyone in the slide queue. They are “Supreme Commander”. You are “Basic Passenger”. They say commanders get two turns.',
    choices: [
      o('ask', 'Apply to be Deputy Slide Commander', { smarts: 2, respect: -1 }, 'A top-heavy administration', '{classmate} agrees, then everyone else demands a promotion. You end up with nine commanders taking one turn each.', 'I helped dismantle {classmate}’s slide hierarchy by getting everyone promoted.', undefined, { peerBond: 2 }),
      o('let', 'Take your basic turn', { discipline: 2, stress: -2 }, 'Excellent basic sliding', 'You slide while {classmate} is still explaining the ranks. By the time they finish, the queue has moved past their speech.', 'I ignored {classmate}’s playground rankings and took my turn on the slide.'),
      o('push', 'Publish a ranking with them at the bottom', { respect: -5, happiness: 3 }, 'Commander demoted', 'You announce that {classmate} is “Captain Wet Bottom”. Everyone repeats it. {classmate} tears up your list and says they cannot stand you.', 'I humiliated {classmate} with a rival playground ranking.', undefined, { peerBond: -18, trust:{peer:-12} }),
    ],
  },
  {
    id: 'school-show-tell-prop', min: 6, max: 9, school: 'primary', classmate: true, teacher: true, illustration: 'education', title: 'The invisible exhibit',
    body: 'You forgot your show-and-tell. {classmate} has already announced that yours is “the best one”. Everyone turns towards your empty hands.',
    choices: [
      o('describe', 'Admit you left it at home', { respect: 3, smarts: 1 }, 'A disappointing lack of magic', '{teacher} lets you describe it. {classmate} whispers that the publicity may have been a mistake.', 'I admitted forgetting my show-and-tell object.', undefined, { teacherBond: 2, peerBond: 1 }),
      o('mime', 'Act out an escaped dinosaur', { happiness: 3, energy: -2 }, 'The exhibit has escaped', 'You roar, crawl under a desk and nearly lose a shoe. {classmate} applauds. Nobody remembers to ask about the object.', 'I improvised a dinosaur performance at show-and-tell.', undefined, { skill: { id: 'acting', delta: 2 }, peerBond: 2 }),
      o('invent', 'Claim it is invisible and dangerous', { respect: -3, stress: 2 }, 'Please contain your exhibit', '{teacher} asks why your invisible crocodile has no cage. You say the cage is invisible too. Their face says this has gone far enough.', 'I claimed I had brought an invisible crocodile to show-and-tell.', undefined, { teacherBond: -3 }),
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
