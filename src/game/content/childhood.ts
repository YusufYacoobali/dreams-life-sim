import { EventTemplate, storyOption as o } from './eventTypes';
import { schoolDayTemplates } from './schoolDayStories';
import { earlyHomeTemplates } from './earlyHomeStories';
import { teenHomeTemplates } from './teenHomeStories';

/** Individually authored childhood situations; names bind to saved people. */
export const childhoodTemplates: readonly EventTemplate[] = [
  ...schoolDayTemplates,
  ...earlyHomeTemplates,
  ...teenHomeTemplates,
  {
    id: 'first-echo', min: 1, max: 2, illustration: 'birthday', title: 'Encore! Encore!',
    body: 'You bang a spoon on a bowl. It makes a brilliant noise. You would like to check that result another twenty times.',
    choices: [
      o('concert', 'Give the full concert', { happiness: 4, energy: -1 }, 'A short, loud career', 'You keep banging until you drop the spoon. You look very pleased with yourself.', 'I discovered how much noise a spoon and a bowl could make.'),
      o('rhythm', 'Try a different rhythm', { smarts: 2, discipline: 1 }, 'A second tune', 'Fast, slow, fast. You try it again to make sure it still works.', 'I tried different rhythms with a spoon and a bowl.'),
      o('inspect', 'Look inside the bowl', { smarts: 3 }, 'No tiny orchestra', 'The bowl is empty. You tap it once more, just to check.', 'I inspected a bowl after discovering it made noise.'),
    ],
  },
  {
    id: 'first-sock-escape', min: 1, max: 2, illustration: 'wellbeing', title: 'Feet at last',
    body: 'You pull off one sock. There was a foot in there the whole time. The other sock now looks suspicious.',
    choices: [
      o('both', 'Free the other foot', { happiness: 3, discipline: 1 }, 'Matching feet', 'Two socks off. Ten toes accounted for. You start wiggling them.', 'I pulled off both socks and investigated my toes.'),
      o('replace', 'Try putting the sock back', { smarts: 2, discipline: 2 }, 'Harder in reverse', 'The sock catches on your heel. You keep trying for a while.', 'I tried to put a sock back on by myself.'),
      o('wave', 'Wave the sock around', { happiness: 4, energy: -1 }, 'New flag', 'You wave it until it lands behind you. Finding it becomes the next game.', 'I celebrated removing a sock by waving it like a flag.'),
    ],
  },
  {
    id: 'first-mirror-guest', min: 1, max: 2, illustration: 'relationship', title: 'Who invited that baby?',
    body: 'There is a baby in the mirror. They copy every move you make. You have concerns about their manners.',
    choices: [
      o('face', 'Pull your strangest face', { happiness: 4 }, 'Extremely rude guest', 'They pull it right back. You laugh and try another one.', 'I made faces at my reflection and laughed when it copied me.'),
      o('peek', 'Look behind the mirror', { smarts: 3, energy: -1 }, 'Where did they go?', 'You find the back of a mirror. The baby is still on the other side.', 'I looked behind a mirror to find the other baby.'),
      o('wave', 'Wave hello', { happiness: 2, smarts: 1 }, 'A polite introduction', 'The baby waves back at exactly the same time. This could work.', 'I waved hello to my reflection.'),
    ],
  },
  {
    id: 'toddler-wall-gallery', min: 2, max: 4, parent: true, illustration: 'property', title: 'Permanent exhibition',
    body: 'You draw a huge purple person on the wall. {parent} walks in while you are adding the teeth.',
    choices: [
      o('admit', 'Show off your work', { happiness: 3, respect: -1 }, 'Mixed reviews', '{parent} gives you paper. The wall gets a long scrub.', 'I drew a purple person on the wall. It was not a commissioned piece.', 1),
      o('clean', 'Help clean it up', { discipline: 3, energy: -2 }, 'Short exhibition', 'You clean the part you can reach. The teeth are higher up.', 'I helped {parent} clean my drawing off the wall.', 3),
      o('blame', 'Blame a very tall baby', { respect: -3, stress: 2 }, 'Weak defence', '{parent} looks at the crayon still in your hand.', 'I blamed another baby for my wall drawing. There was no other baby.', -2),
    ],
  },
  {
    id: 'toddler-grocery-microphone', min: 2, max: 5, parent: true, illustration: 'relationship', title: 'Price check on your dignity',
    body: 'In a quiet shop, you loudly announce that {parent} has a bottom. Several shoppers appear to know already.',
    choices: [
      o('repeat', 'Repeat it for anyone who missed it', { happiness: 4, respect: -2 }, 'Full coverage', '{parent} finishes shopping at record speed.', 'I made a loud announcement about {parent} in a shop.', -2),
      o('whisper', 'Try an extremely loud whisper', { happiness: 2, discipline: 1 }, 'Minor improvement', 'Only half the aisle hears the second announcement.', 'I practised whispering. There was room for improvement.'),
      o('hug', 'Give {parent} a hug', { happiness: 3 }, 'Damage control', '{parent} hugs you back and changes the subject.', 'I hugged {parent} after embarrassing them in public.', 4),
    ],
  },
  {
    id: 'toddler-cardboard-rocket', min: 3, max: 5, parent: true, illustration: 'travel', title: 'Launch delayed',
    body: 'You turn a cardboard box into a rocket. {parent} says dinner is ready. Mission Control has terrible timing.',
    choices: [
      o('invite', 'Invite {parent} aboard', { happiness: 4 }, 'Crew shortage solved', '{parent} puts one foot in the box. The rocket is now full.', 'My cardboard rocket carried me and one of {parent}’s feet.', 4),
      o('countdown', 'Finish one last countdown', { smarts: 2, discipline: 2 }, 'Back for dinner', 'You reach zero, make a loud noise and land beside the table.', 'I finished a rocket launch before dinner.'),
      o('refuse', 'Refuse to return to Earth', { happiness: -2, stress: 2 }, 'Dinner is on Earth', '{parent} waits. Space food turns out to be whatever is already on the table.', 'I refused to leave my cardboard rocket. Hunger changed my mind.', -2),
    ],
  },
  {
    id: 'toddler-suspicious-haircut', min: 3, max: 5, parent: true, illustration: 'wellbeing', title: 'Customer complaint',
    body: '{parent} takes you for a haircut. You are convinced the cape means you have been promoted to wizard.',
    choices: [
      o('spell', 'Cast a spell on the comb', { happiness: 3, smarts: 1 }, 'Comb survives', 'The comb refuses to turn into a frog. Your haircut carries on.', 'I tried magic during a haircut. It did not affect the comb.'),
      o('ask', 'Ask what every tool does', { smarts: 3, discipline: 1 }, 'Less mysterious', 'Knowing what happens next makes it easier to sit still.', 'I asked questions until my haircut felt less scary.'),
      o('hold', 'Ask {parent} to hold your hand', { stress: -3 }, 'A familiar hand', '{parent} stays beside you until the haircut is done.', 'Holding {parent}’s hand helped me through a haircut.', 4),
    ],
  },
  {
    id: 'child-lost-button', min: 4, max: 7, parent: true, illustration: 'journal', title: 'Missing person: teddy’s eye',
    body: 'One of your old teddy’s button eyes comes off. You ask {parent} whether teddy needs an ambulance.',
    choices: [
      o('repair', 'Help with a supervised repair', { smarts: 3, discipline: 2 }, 'Outpatient care', '{parent} handles the needle. You choose where the eye belongs.', 'I helped {parent} repair my teddy.', 3),
      o('patch', 'Give teddy a pirate patch', { happiness: 4 }, 'Career change', 'Teddy becomes a pirate. Nobody asks to see a sailing qualification.', 'My teddy lost an eye and became a pirate.'),
      o('comfort', 'Stay with teddy until it is fixed', { happiness: 2, respect: 2 }, 'Good company', 'You keep teddy company while {parent} repairs the eye.', 'I stayed beside my teddy during a repair.', 2),
    ],
  },
  {
    id: 'child-first-sleepover-plan', min: 4, max: 8, parent: true, illustration: 'property', title: 'Hotel living room',
    body: 'You ask {parent} whether you can camp in the living room. Your packing list contains six cushions and no clothes.',
    choices: [
      o('plan', 'Help make a proper sleeping spot', { discipline: 3, happiness: 3 }, 'Room with a sofa', '{parent} helps you set up, then checks on you before bed.', 'I camped in the living room with {parent}’s help.', 3),
      o('invite', 'Ask {parent} to camp too', { happiness: 4 }, 'Family booking', 'You share a bedtime story on the floor. {parent} misses the sofa already.', 'I invited {parent} to camp in the living room.', 5),
      o('bed', 'Decide your bed is better', { energy: 4, stress: -2 }, 'Excellent facilities', 'Your bed has a mattress. It wins the comparison.', 'I cancelled my living-room camping trip.'),
    ],
  },
  {
    id: 'school-arcade-invitation', min: 6, max: 11, parent: true, school: 'primary', classmate: true, illustration: 'birthday', title: 'Birthday invitation',
    body: '{classmate} invites you to a birthday party at an arcade. The invitation has more glitter than useful information.',
    choices: [
      o('ask', 'Ask {parent} for permission', { discipline: 2 }, 'Adults need an address', '{parent} checks the time and supervision. Their answer and any plan are recorded below. Nothing is paid just for asking.', 'I asked {parent} for permission to go to {classmate}’s arcade birthday.', 2, { peerBond: 3, followUp: 'arcade-invitation' }),
      o('details', 'Ask {classmate} for more details', { smarts: 2 }, 'Actual information', 'You find the date hidden under a glitter sticker. Now you can talk it over at home.', 'I asked {classmate} for the details of their birthday party.', undefined, { peerBond: 2 }),
      o('decline', 'Politely decline', { respect: 2 }, 'No hard feelings', 'You thank {classmate}. You can still spend time together at school.', 'I politely declined {classmate}’s birthday invitation.'),
    ],
  },
  {
    id: 'school-project-promise', min: 7, max: 16, school: 'any', classmate: true, teacher: true, illustration: 'education', title: 'Your name on the cover',
    body: '{classmate} asks you to share a class project. {teacher} has given you two months. That sounds like a problem for Future You.',
    choices: [
      o('promise', 'Promise to write your section', { discipline: 1 }, 'Future You has been notified', 'You agree on a section to write. The deadline is saved; agreeing has not completed any work.', 'I agreed to write a section of a class project with {classmate}.', undefined, { peerBond: 1, followUp: 'project-promise' }),
      o('separate', 'Ask to work separately', { respect: 2 }, 'Your own name, your own work', '{teacher} agrees that you can work separately. No shared project is scheduled.', 'I chose to work separately instead of making a project promise.'),
      o('honest', 'Admit you cannot commit', { respect: 3 }, 'An early answer beats an empty page', '{classmate} appreciates knowing before the deadline. You do not make a promise you cannot keep.', 'I told {classmate} I could not commit to a shared project.'),
    ],
  },
  {
    id: 'school-volcano-breach', rarity: 'uncommon', min: 6, max: 11, school: 'primary', classmate: true, teacher: true, illustration: 'education', title: 'The volcano has escaped',
    body: 'Your classroom volcano erupts across {classmate}’s desk. {teacher} grabs a towel. You have made geology personal.',
    choices: [
      o('clean', 'Help clean the desk', { discipline: 2, energy: -2 }, 'Containment team', 'You clean together. {teacher} asks you to use less mixture next time.', 'I cleaned up after our classroom volcano flooded {classmate}’s desk.', undefined, { peerBond: 3, teacherBond: 2 }),
      o('measure', 'Measure how far it went', { smarts: 2 }, 'Useful, eventually', 'You record the spill and then help clean. The next model gets a bigger tray.', 'I measured our volcano’s spill and helped clean it up.', undefined, { skill: { id: 'science', delta: 2 } }),
      o('sequel', 'Add the rest of the mixture', { happiness: 3, respect: -4 }, 'Sequel cancelled', '{teacher} removes the mixture. You get the longest part of the cleanup.', 'I tried to make a classroom volcano erupt twice. {teacher} stopped the sequel.', undefined, { teacherBond: -5, peerBond: -2 }),
    ],
  },
  {
    id: 'school-tree-audition', rarity: 'uncommon', min: 6, max: 11, school: 'primary', teacher: true, illustration: 'education', title: 'A demanding role',
    body: '{teacher} asks for volunteers to play a tree in the class show. The tree has one line: “I am a tree.”',
    choices: [
      o('audition', 'Audition like your career depends on it', { happiness: 3, energy: -2 }, 'Deep roots', 'You try three different readings. {teacher} says one will do.', 'I auditioned for a tree with more enthusiasm than the script required.', undefined, { skill: { id: 'acting', delta: 2 }, teacherBond: 2 }),
      o('backstage', 'Offer to help with the scenery', { discipline: 3 }, 'A different branch', 'You help paint a backdrop. The tree still gets more applause during rehearsal.', 'I helped paint scenery for our class show.', undefined, { teacherBond: 2 }),
      o('decline', 'Let someone else be vegetation', { stress: -2 }, 'Rooted in your seat', 'You watch the auditions. There are several strong trees.', 'I passed on the tree audition.'),
    ],
  },
  {
    id: 'school-mascot-petition', rarity: 'uncommon', min: 7, max: 11, school: 'primary', classmate: true, teacher: true, illustration: 'journal', title: 'Vote for the damp sock',
    body: '{classmate} starts a petition to make a damp sock the class mascot. {teacher} asks what values the sock represents.',
    choices: [
      o('speech', 'Give the sock a campaign speech', { happiness: 3, respect: -1 }, 'A moving argument', 'You promise less homework and more washing machines. {teacher} remains unconvinced.', 'I gave a speech supporting {classmate}’s damp-sock mascot.', undefined, { peerBond: 3, skill: { id: 'politics', delta: 1 } }),
      o('design', 'Suggest a cleaner mascot', { smarts: 2, discipline: 2 }, 'Compromise candidate', 'You help sketch a mascot everyone can sit near.', 'I helped {classmate} replace a damp-sock mascot proposal.', undefined, { peerBond: 2, teacherBond: 2 }),
      o('abstain', 'Stay out of sock politics', { stress: -2 }, 'Independent observer', 'The petition continues without your signature.', 'I stayed out of a class argument about a sock mascot.'),
    ],
  },
  {
    id: 'school-recorder-solo', min: 6, max: 11, school: 'primary', classmate: true, illustration: 'education', title: 'A nose for music',
    body: '{classmate} has learned to play the recorder with their nose. They ask you to accompany their debut. The first note makes everyone check for a trapped bird.',
    choices: [
      o('practice', 'Drum on the desk and let them have their moment', { happiness: 3, energy: -2 }, 'A very short tour', 'You find a beat that nearly matches the squeaks. {classmate} attempts an encore, sneezes, and announces an interval.', 'I accompanied {classmate}’s nose-recorder debut by drumming on a desk.', undefined, { peerBond:3, skill:{id:'music',delta:2} }),
      o('polite', 'Offer to be the audience from further away', { respect: 2, stress: -2 }, 'Excellent seats still available', 'You applaud from across the room. {classmate} bows and asks if you can hear it clearly. Unfortunately, yes.', 'I supported {classmate}’s nose-recorder performance from a comfortable distance.', undefined, { peerBond:1 }),
      o('imitate', 'Announce that you can play an imaginary one', { happiness: 3, respect: -2 }, 'Critics prefer the silence', 'You mime a full solo without making a sound. The laughter makes {classmate} stop playing. They tell you to find your own audience.', 'I upstaged {classmate}’s nose-recorder solo with a silent imaginary instrument.', undefined, { peerBond:-5 }),
    ],
  },
  {
    id: 'school-lunch-trade', min: 6, max: 11, school: 'primary', classmate: true, illustration: 'relationship', title: 'Hostile snack takeover',
    body: '{classmate} offers a plain cracker for your favourite snack. They call the cracker “rare”. There are twelve more in the packet.',
    choices: [
      o('counter', 'Demand two snacks for your one', { smarts: 2, respect: -1 }, 'The negotiator gets greedy', '{classmate} nearly agrees, then notices you smiling. They withdraw the cracker and their goodwill.', 'I tried to turn {classmate}’s snack offer into a better deal for myself.', undefined, { peerBond: -2 }),
      o('keep', 'Eat your snack during the sales pitch', { discipline: 2 }, 'Offer expired', '{classmate} is still describing the cracker’s qualities when you finish the last bite.', 'I ate my snack instead of swapping it with {classmate}.'),
      o('share', 'Split yours and spare the cracker', { happiness: 2, respect: 2 }, 'A rescue operation', 'You both enjoy half a decent snack. {classmate} admits the cracker was a difficult sell.', 'I shared my snack with {classmate}.', undefined, { peerBond: 3 }),
    ],
  },
  {
    id: 'school-name-joke', min: 6, max: 11, school: 'primary', classmate: true, illustration: 'relationship', title: 'They do not find it funny',
    body: 'Someone keeps making a joke out of {classmate}’s name. {classmate} has stopped correcting them.',
    choices: [
      o('support', 'Use their name properly and speak up', { respect: 4, stress: 1 }, 'A little backup', 'You say it is getting old. {classmate} thanks you later.', 'I backed {classmate} when someone kept mocking their name.', undefined, { peerBond: 5 }),
      o('check', 'Check on {classmate} privately', { respect: 2 }, 'Someone noticed', '{classmate} tells you it has been bothering them.', 'I checked on {classmate} after someone made fun of their name.', undefined, { peerBond: 4 }),
      o('join', 'Join in for a laugh', { respect: -5, happiness: -2 }, 'Cheap laugh', '{classmate} hears you. It hurts more coming from someone they know.', 'I joined in when someone mocked {classmate}’s name.', undefined, { peerBond: -7 }),
    ],
  },
  {
    id: 'school-homework-soap', min: 7, max: 11, school: 'primary', teacher: true, illustration: 'education', title: 'The homework needs rinsing',
    body: 'Your homework went through the wash. {teacher} is holding a damp piece of paper that now says almost nothing.',
    choices: [
      o('redo', 'Offer to do it again', { discipline: 3, energy: -3 }, 'Second attempt', 'You repeat the work and hand it in. This version stays dry.', 'I redid homework that went through the wash.', undefined, { grades: 2, teacherBond: 2 }),
      o('explain', 'Explain and show what you remember', { respect: 2, stress: 1 }, 'Some evidence survives', '{teacher} asks a few questions. You can answer enough to show you tried.', 'I explained why my homework was soaking wet.', undefined, { teacherBond: 2 }),
      o('art', 'Claim it is an art project', { respect: -3 }, 'Wrong subject', '{teacher} asks for the actual assignment. The damp paper earns no credit.', 'I called my ruined homework art. {teacher} wanted the assignment.', undefined, { grades: -2, teacherBond: -3 }),
    ],
  },
  {
    id: 'school-bench-reserve', min: 6, max: 11, school: 'primary', classmate: true, illustration: 'relationship', title: 'Imaginary friend wanted',
    body: '{classmate} is alone at break. They say their imaginary friend has moved to a better school. They are interviewing replacements on the empty part of the bench.',
    choices: [
      o('sit', 'Help interview the invisible applicants', { happiness: 3, smarts: 1 }, 'A crowded bench', 'You reject the first applicant for imaginary biting. {classmate} rejects the second for actually being a dragon. You run out of break before making an appointment.', 'I helped {classmate} interview replacements for an imaginary friend.', undefined, { peerBond:5 }),
      o('invite', 'Apply, despite being inconveniently real', { respect: 2, happiness: 2 }, 'You meet most of the requirements', '{classmate} asks whether you can turn invisible. You hide behind the bench. They accept that as a reasonable compromise and come to play with you.', 'I applied to be {classmate}’s imaginary friend and was accepted despite being visible.', undefined, { peerBond:4 }),
      o('queue', 'Pretend you have accidentally sat on one', { happiness: 2, respect: -2 }, 'A difficult first impression', 'You jump up and apologise to empty air. {classmate} says you have crushed their best candidate and refuses your offer to flatten the others equally.', 'I disrupted {classmate}’s imaginary-friend interviews with a bench prank.', undefined, { peerBond:-4 }),
    ],
  },
  {
    id: 'school-race-false-start', min: 7, max: 11, school: 'primary', teacher: true, illustration: 'wellbeing', title: 'An impressive illegal start',
    body: 'You start a practice race before {teacher} blows the whistle. You are winning by an enormous amount.',
    choices: [
      o('restart', 'Stop and restart fairly', { respect: 3, energy: -2 }, 'Same starting line', 'You run again with everyone else. It is harder when they are moving too.', 'I restarted a practice race after jumping the whistle.', undefined, { skill: { id: 'sport', delta: 2 }, teacherBond: 2 }),
      o('finish', 'Finish and demand a medal', { happiness: 2, respect: -3 }, 'Medal unavailable', '{teacher} points you back to the starting line.', 'I demanded a medal for a race I started early.', undefined, { teacherBond: -3 }),
      o('laugh', 'Laugh and wait for the next race', { happiness: 3 }, 'Short-lived champion', 'Your lead disappears before the next whistle.', 'I laughed off a false start in a practice race.'),
    ],
  },
  {
    id: 'school-tiny-editor', min: 8, max: 11, school: 'primary', classmate: true, illustration: 'journal', title: 'The headteacher is three mice',
    body: '{classmate} wants help with a class newsletter. The headline is “Headteacher Replaced by Three Mice”. Their evidence is a chewed worksheet.',
    choices: [
      o('report', 'Investigate before printing it', { smarts: 3, discipline: 1 }, 'One human, several questions', 'The headteacher is visibly one person. {classmate} reluctantly changes the headline to “Worksheet Damaged”. Your reporting improves; circulation probably will not.', 'I helped {classmate} check a ridiculous newsletter claim.', undefined, { peerBond: 3, skill: { id: 'content', delta: 1 } }),
      o('cartoon', 'Draw a wanted poster for the mice', { happiness: 3 }, 'Artist’s impression', 'You draw three mice sharing a tie. {classmate} laughs so hard the real headline can wait.', 'I drew a mouse conspiracy cartoon for {classmate}’s newsletter.', undefined, { peerBond: 2 }),
      o('decline', 'Leave the rodent conspiracy to them', { energy: 2 }, 'No comment', '{classmate} calls this suspicious. You remain comfortable with your decision to leave mouse journalism.', 'I declined to help with {classmate}’s newsletter.', undefined),
    ],
  },
  {
    id: 'school-glitter-border', min: 7, max: 11, school: 'primary', teacher: true, illustration: 'education', title: 'Glitter lockdown',
    body: 'You spill a pot of glitter during a class project. {teacher} finds some inside a closed book.',
    choices: [
      o('clean', 'Help clean every desk', { discipline: 3, energy: -3 }, 'Still sparkling', 'You clean until the bell. There is probably some glitter left in the building forever.', 'I helped clean a classroom after spilling glitter everywhere.', undefined, { teacherBond: 3 }),
      o('plan', 'Make a paper funnel for next time', { smarts: 2, discipline: 1 }, 'A smaller disaster next time', 'You help clean, then test a funnel over a tray.', 'I made a paper funnel after a glitter spill.', undefined, { skill: { id: 'science', delta: 1 }, teacherBond: 1 }),
      o('fan', 'Try blowing it away', { respect: -3, happiness: 1 }, 'Now it is airborne', '{teacher} takes away the pot and hands you a cloth.', 'I blew on spilled glitter. This made things worse.', undefined, { teacherBond: -4 }),
    ],
  },
  {
    id: 'teen-homework-leak', min: 12, max: 17, school: 'secondary', classmate: true, teacher: true, illustration: 'education', title: 'Answers attached',
    body: '{classmate} sends you a photo of tomorrow’s homework answers. Their message says “delete after reading”, which sounds very normal.',
    choices: [
      o('own', 'Do your own work', { discipline: 3, energy: -2 }, 'Less convenient', 'You work through the questions. You understand the method by the end.', 'I did my own homework after {classmate} sent a photo of the answers.', undefined, { grades: 2 }),
      o('together', 'Offer to work through it together', { smarts: 2, energy: -3 }, 'Actual revision', 'You explain your methods to each other and put the photo away.', 'I worked through the homework with {classmate} instead of copying.', undefined, { grades: 1, peerBond: 3 }),
      o('copy', 'Copy it, including the wrong date', { respect: -3, stress: 3 }, 'Excellent attention to somebody else’s detail', '{teacher} notices the identical wrong date and asks you to redo the assignment.', 'I copied homework from {classmate}, including an obvious mistake.', undefined, { grades: -3, teacherBond: -4 }),
    ],
  },
  {
    id: 'teen-group-project-credit', min: 12, max: 17, school: 'secondary', classmate: true, teacher: true, illustration: 'education', title: 'The unpaid goblin',
    body: '{classmate} turns your group presentation into a pitch for an imaginary company. You are listed as “unpaid goblin”. Their dog is CEO. {teacher} asks where the actual research is.',
    choices: [
      o('clarify', 'Open the real research before the dog gets a salary', { respect: 3, stress: 1 }, 'Goblin saves the meeting', 'You present your actual work. {teacher} marks it while {classmate} clicks past a slide about office beanbags. The dog receives no academic credit.', 'I rescued our group presentation after {classmate} replaced the research with a fake company pitch.', undefined, { grades:4, teacherBond:3, peerBond:-3 }),
      o('private', 'Whisper a demand for a better job title', { happiness: 3, discipline: -2 }, 'Assistant to the dog', '{classmate} promotes you on the slide. You finish the ridiculous pitch together, then {teacher} explains that enthusiasm has not answered the assignment.', 'I negotiated an imaginary promotion during {classmate}’s fake company presentation.', undefined, { grades:-5, peerBond:4 }),
      o('interrupt', 'Delete the pitch while they are presenting it', { happiness: 2, respect: -5, stress: 4 }, 'The company has ceased trading', '{classmate} faces a blank screen and shouts at you. {teacher} gives the incomplete presentation a poor mark. You spend the rest of the lesson arguing over who ruined it first.', 'I deleted {classmate}’s presentation mid-speech and damaged both our grade and our relationship.', undefined, { grades:-16, peerBond:-20, teacherBond:-10, trust:{peer:-15} }),
    ],
  },
  {
    id: 'teen-mic-still-live', min: 12, max: 17, school: 'secondary', classmate: true, teacher: true, illustration: 'journal', title: 'The microphone is still on',
    body: 'After a class announcement, {classmate} whispers that the school jingle sounds like a microwave. The microphone is still on.',
    choices: [
      o('switch', 'Switch it off and warn them', { respect: 2, discipline: 2 }, 'Broadcast ends', 'Most people heard the first comment. You prevent a second one.', 'I switched off a live microphone before {classmate} said anything worse.', undefined, { peerBond: 3 }),
      o('apologise', 'Help make a short apology', { respect: 3 }, 'Transmission corrected', 'You explain the mistake. {teacher} reminds you to check the switch.', 'I helped {classmate} apologise for a live-microphone mistake.', undefined, { peerBond: 2, teacherBond: 2 }),
      o('beep', 'Add microwave sound effects', { happiness: 3, respect: -4 }, 'Now a duet', '{teacher} turns it off for you. Neither of you is asked to make the next announcement.', 'I added sound effects to {classmate}’s live-microphone insult.', undefined, { teacherBond: -5, peerBond: 1 }),
    ],
  },
  {
    id: 'teen-solo-rehearsal', min: 12, max: 17, school: 'secondary', classmate: true, illustration: 'education', title: 'You are in verse two',
    body: '{classmate} asks you to help rehearse a song about everyone who has annoyed them. Your name appears in verse two. The rhyme is frankly weak.',
    choices: [
      o('stay', 'Suggest a better rhyme for your insult', { discipline: 2, happiness: 3, energy: -3 }, 'An unwilling co-writer', 'You improve the line and rehearse the chorus. {classmate} laughs, then admits that your original offence was borrowing a pencil.', 'I helped {classmate} rehearse a song that included an insult about me.', undefined, { peerBond: 4, skill: { id: 'music', delta: 2 } }),
      o('talk', 'Ask why you made the track list', { respect: 2, stress: 1 }, 'A very small grudge', '{classmate} explains the pencil incident. You point out that it has been six months. They apologise and cut your verse.', 'I asked {classmate} why they had written an insulting song about me.', undefined, { peerBond: 4 }),
      o('leave', 'Walk out before verse three', { energy: 2 }, 'No backing vocals', '{classmate} has to rehearse alone. You leave wondering how much material they have saved for the bridge.', 'I left after hearing my name in {classmate}’s insulting song.', undefined, { peerBond: -3 }),
    ],
  },
  {
    id: 'teen-exam-freeze', min: 13, max: 17, school: 'secondary', teacher: true, illustration: 'education', title: 'At least you know your name',
    body: 'Your practice exam is going badly. So far, you have written your name and the date. The date is wrong.',
    choices: [
      o('skip', 'Hunt for every easy mark first', { discipline: 3, stress: -2 }, 'A rescue in small pieces', 'You collect enough answers to get moving. Even question one looks less hostile on your second visit.', 'I recovered from freezing in a practice exam by answering easier questions first.', undefined, { grades: 2 }),
      o('help', 'Take the wreckage to {teacher} afterwards', { respect: 2, energy: -2 }, 'Recoverable damage', '{teacher} finds the step you missed. You work through it together. Correcting the date takes considerably less time.', 'I reviewed a difficult practice exam with {teacher}.', undefined, { grades: 2, teacherBond: 3 }),
      o('panic', 'Write an apology in the answer box', { stress: 4, energy: -2 }, 'Unfortunately, this is not English', 'Your explanation is sincere and beautifully punctuated. It earns none of the missing marks.', 'I wrote an apology instead of answering a practice exam question.', undefined, { grades: -2 }),
    ],
  },
  {
    id: 'teen-canteen-review', min: 12, max: 17, school: 'secondary', classmate: true, teacher: true, illustration: 'journal', title: 'One star. Still hungry.',
    body: '{classmate} drafts a fake restaurant review of the school canteen. It includes the phrase “structural pasta”.',
    choices: [
      o('feedback', 'Turn it into useful feedback', { respect: 3, smarts: 1 }, 'Less funny, more useful', 'You keep the specific complaints and remove the insults. {teacher} helps pass it on.', 'I helped {classmate} turn a canteen rant into useful feedback.', undefined, { peerBond: 2, teacherBond: 2 }),
      o('private', 'Keep the joke between you', { happiness: 3 }, 'Private critic', 'You laugh over the draft and leave it unpublished.', 'I laughed at {classmate}’s canteen review without sharing it.', undefined, { peerBond: 2 }),
      o('read', 'Read it aloud in class', { happiness: 2, respect: -3 }, 'Review interrupted', '{teacher} stops you halfway through “pasta”. You lose the rest of your break explaining.', 'I read {classmate}’s canteen rant aloud in class.', undefined, { teacherBond: -4 }),
    ],
  },
  {
    id: 'school-corpse-stage-notes', rarity: 'uncommon', min: 8, max: 11, school: 'primary', classmate: true, teacher: true, illustration: 'education', title: 'The corpse has notes',
    body: 'During a class play rehearsal, {classmate} plays the dead monarch. They keep sitting up to complain that your funeral speech is not sad enough. {teacher} asks you to try once more.',
    choices: [
      o('flatter', 'Invent a wildly flattering eulogy', { happiness: 3, energy: -2 }, 'A tragic loss to sandwich making', 'You praise their kindness, courage and ability to open crisp packets. {classmate} stays dead for almost the whole speech.', 'I improvised a flattering funeral speech for {classmate} in a class play.', undefined, { peerBond: 4, skill: { id: 'acting', delta: 2 } }),
      o('direct', 'Ask the corpse to stop directing', { respect: 2, discipline: 2 }, 'A quieter royal household', '{teacher} backs you up. {classmate} folds their arms, then remembers that corpses usually keep still.', 'I asked {classmate} to stop interrupting our class play rehearsal.', undefined, { teacherBond: 2, peerBond: -2 }),
      o('resurrect', 'Announce a miracle and cancel the funeral', { happiness: 4, respect: -3 }, 'The monarch objects to recovery', 'You shout that they are alive. {classmate} demands their death scene back, and {teacher} sends everyone to the start of the script.', 'I derailed a class play rehearsal by bringing {classmate}’s character back to life.', undefined, { peerBond: -3, teacherBond: -4 }),
    ],
  },
  {
    id: 'teen-exam-lucky-snail', rarity: 'rare', min: 12, max: 17, school: 'secondary', classmate: true, teacher: true, illustration: 'education', title: 'The luck is escaping',
    body: '{classmate} brought a “lucky snail” to a practice exam. It has escaped the pencil case and reached {teacher}’s answer sheet. Nobody appears to have consulted the snail.',
    choices: [
      o('rescue', 'Quietly help move it somewhere safe', { discipline: 2, energy: -2 }, 'A slower evacuation', '{teacher} helps you lift it onto a leaf. {classmate} thanks you for saving their luck; you suggest keeping it outside next time.', 'I helped move {classmate}’s snail safely out of a practice exam.', undefined, { peerBond: 4, teacherBond: 2, skill: { id: 'science', delta: 1 } }),
      o('tell', 'Identify its owner immediately', { respect: -2, stress: 2 }, 'No chance of mistaken custody', '{teacher} thanks you for explaining. {classmate} spends the rest of the practice exam avoiding your eye.', 'I told {teacher} that the escaped snail belonged to {classmate}.', undefined, { teacherBond: 3, peerBond: -6 }),
      o('defend', 'Insist the snail is your study partner', { happiness: 4, stress: 3 }, 'It has not answered question one', 'You explain its excellent listening skills. {teacher} points to the slime on the answer sheet. {classmate} is grateful, but your defence does not impress.', 'I tried to defend an escaped snail as a study partner.', undefined, { peerBond: 4, teacherBond: -5, skill: { id: 'acting', delta: 1 } }),
    ],
  },
  {
    id: 'teen-mind-reading-helmet', rarity: 'rare', min: 13, max: 17, school: 'secondary', classmate: true, teacher: true, illustration: 'education', title: 'The helmet knows too much',
    body: '{classmate} built a “mind-reading helmet” from a colander. {teacher} wants a demonstration. You are supposed to feed {classmate} the answers with hand signals.',
    choices: [
      o('test', 'Suggest an actual test instead', { respect: 3, energy: -2 }, 'The colander fails peer review', 'You test questions neither of you has rehearsed. The helmet reads no minds. {teacher} appreciates the method; {classmate} dislikes your timing.', 'I tested {classmate}’s fake mind-reading helmet honestly.', undefined, { skill: { id: 'science', delta: 2 }, teacherBond: 3, peerBond: -4 }),
      o('assist', 'Deliver the hand signals theatrically', { happiness: 3, respect: -3 }, 'The thought transmission is visible', 'You hide neither hand particularly well. {teacher} watches your performance and asks whether the helmet works with your hands in your pockets.', 'I helped stage {classmate}’s fake mind-reading demonstration.', undefined, { peerBond: 4, teacherBond: -4, skill: { id: 'acting', delta: 2 } }),
      o('credit', 'Claim the mind-reading genius was yours', { respect: -4, stress: 3 }, 'Shared credit for a kitchen utensil', '{classmate} immediately reveals the signals to disprove you. {teacher} now knows that both inventors were bluffing.', 'I tried to take credit for {classmate}’s fake mind-reading helmet.', undefined, { peerBond: -6, teacherBond: -3 }),
    ],
  },
  {
    id: 'teen-insult-cake', rarity: 'uncommon', min: 13, max: 17, school: 'secondary', classmate: true, teacher: true, illustration: 'relationship', title: 'The cake has a message',
    body: '{classmate} made a cake iced with an insult about {teacher}. It was meant for a private joke. {teacher} has just asked what is in the box.',
    choices: [
      o('eat', 'Eat the incriminating slice immediately', { happiness: 3, energy: -2, stress: 2 }, 'The evidence was mostly icing', 'You stuff the message into your mouth. {teacher} asks a second question, which you cannot answer. {classmate} struggles not to laugh.', 'I ate a slice of {classmate}’s cake to hide its insulting message.', undefined, { peerBond: 4, teacherBond: -2 }),
      o('admit', 'Tell {teacher} what the cake says', { respect: 2, stress: 2 }, 'An unusually literal confession', '{teacher} is disappointed. {classmate} thinks a less complete description would have been sufficient.', 'I told {teacher} about an insult iced onto {classmate}’s cake.', undefined, { teacherBond: 2, peerBond: -5 }),
      o('offer', 'Open the box and offer them a slice', { happiness: 2, respect: -4 }, 'A generous serving of consequences', '{teacher} reads the icing. The silence lasts until {classmate} closes the box. Neither of you receives a thank-you.', 'I showed {teacher} the insulting cake {classmate} had made.', undefined, { teacherBond: -6, peerBond: -3 }),
    ],
  },
];
